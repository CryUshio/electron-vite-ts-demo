/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'reflect-metadata';
import { Container, decorate, injectable } from 'inversify';
import { asyncProxyWrapper, dynamicProxyWrapper } from './ServiceWrapper';
import {
  AsyncService,
  Service,
  ServiceIdentifier,
  ServiceInfo,
  DynamicService,
  MetadataDependencies,
  MetadataKeys,
  ServiceContainerIdentifier,
  ServiceBindingTo,
} from './typings';
import { getPropertyCacheMetadataKey } from './utils';
import { Vue } from 'vue-class-component';

export class ServiceContainer {
  static isServiceContainerIdentifier(
    serviceId: ServiceIdentifier | undefined,
  ): serviceId is ServiceContainerIdentifier {
    return typeof serviceId === 'string' || typeof serviceId === 'symbol';
  }

  /** inversify container */
  public container: Container;

  private parent?: ServiceContainer;

  /** 保存依赖构造器、引用计数、子依赖 */
  private serviceInfos: Map<ServiceContainerIdentifier, ServiceInfo> = new Map();

  public constructor(parent?: ServiceContainer) {
    this.parent = parent;
    this.container =
      parent?.container.createChild({ defaultScope: 'Singleton' }) ||
      new Container({ defaultScope: 'Singleton' });
  }

  public bind<T>(serviceId: ServiceContainerIdentifier): Omit<ServiceBindingTo<T>, 'toSelf'>;

  public bind<T>(serviceId: Service<T>): Pick<ServiceBindingTo<T>, 'toSelf'>;

  /**
   * 绑定一个标识符
   * @param serviceId 服务唯一标识
   */
  public bind(serviceId: ServiceIdentifier) {
    console.info('skr: bind');

    if (ServiceContainer.isServiceContainerIdentifier(serviceId)) {
      return {
        to: this.to.bind(this, serviceId),
        toDynamic: this.toDynamic.bind(this, serviceId),
        toAsync: this.toAsync.bind(this, serviceId),
        toConstructor: this.toConstructor.bind(this, serviceId),
        toConstant: this.toConstant.bind(this, serviceId),
      };
    }

    return {
      toSelf: this.toSelf.bind(this, serviceId),
    };
  }

  public get<T>(serviceId: ServiceIdentifier) {
    const identifier = this.getIdentifier(serviceId);

    if (!identifier) {
      throw new Error(`No service identifier found from '${this.getTargetObjectName(serviceId)}'`);
    }

    const info = this.serviceInfos.get(identifier);

    if (info && info.retainCount < 1 && !info.keepAlive) {
      throw new Error(`Service '${this.getTargetObjectName(info.service)}' now is inactive.`);
    }

    return this.container.get<T>(identifier);
  }

  public createChild() {
    const child = new ServiceContainer(this);

    return child;
  }

  public dispose(target: object) {
    // const ctor = typeof target === 'function' ? target : target.constructor;
    const metadataDeps: MetadataDependencies =
      Reflect.getMetadata(MetadataKeys.dependencies, target) || new Set();

    console.info('skr: dispose deps', target, metadataDeps);

    metadataDeps.forEach((serviceId) => {
      this.reduceRetainCount(serviceId);
    });

    // Reflect.deleteMetadata(MetadataKeys.dependencies, target);
  }

  /**
   * Vue 组件消费者装饰器
   * @type decorator
   *
   * 自动绑定 dispose
   */
  public Consumer() {
    const dispose = this.dispose.bind(this);

    return function (target: Service<Vue>) {
      console.info('skr: Consumer', target.name);

      const descriptor = Reflect.getOwnPropertyDescriptor(target.prototype, 'unmounted') || {
        value: function () {},
      };

      const oriFn = descriptor.value;

      descriptor.value = function () {
        console.info('skr: unmounted.', target.name);

        dispose(target.prototype);

        oriFn();
      };

      Reflect.defineProperty(target.prototype, 'unmounted', descriptor);
    };
  }

  /**
   * 注入依赖
   * @type decorator
   *
   * 懒加载
   */
  public LazyInject(serviceId?: ServiceIdentifier) {
    return (target: object, property: string) => {
      Reflect.defineProperty(target, property, {
        get: () => {
          /** 尝试从属性类型获取 serviceId */
          const identifier = ServiceContainer.isServiceContainerIdentifier(serviceId)
            ? serviceId
            : this.getServiceIdentifier(target, property);

          console.info('skr: LazyInject', identifier);

          if (!identifier) {
            throw new Error(
              `No service identifier found. From '${this.getTargetObjectName(target)}.${property}'`,
            );
          }

          /** 避免重复执行添加依赖逻辑 */
          if (!Reflect.hasOwnMetadata(MetadataKeys.isInjected, target, property)) {
            this.addDependency(identifier).to(target);

            Reflect.defineMetadata(MetadataKeys.isInjected, true, target, property);
          }

          this.rebindService(identifier);

          return this.container.get(identifier);
        },
      });
      /** 保护属性不被修改 */
      Reflect.defineProperty(target, property, {
        writable: false,
      });

      return Object.getOwnPropertyDescriptor(target, property) as any;
    };
  }

  /**
   * 注入异步依赖
   * @type decorator
   *
   * 懒加载的语法糖，注意异步依赖是一个 Promise
   */
  public AsyncInject(serviceId: ServiceIdentifier) {
    return this.LazyInject(serviceId);
  }

  public snapshot() {
    console.info('skr: snapshot ', this.serviceInfos);
  }

  private to(serviceId: ServiceContainerIdentifier, dep: Service<any>) {
    decorate(injectable(), dep);
    Reflect.defineMetadata(MetadataKeys.identifier, serviceId, dep);
    this.recordServiceInfo(serviceId, dep);

    console.info('skr: bind', dep?.name);

    this.container.bind(serviceId).to(dep);

    return this.getBindingOptions(serviceId);
  }

  private toSelf(service: Service<any>) {
    const serviceId = this.genServiceIdentifier(service);

    return this.to(serviceId, service);
  }

  /**
   * 动态绑定单例
   * @param service 返回类构造函数
   */
  private toDynamic(serviceId: ServiceContainerIdentifier, service: DynamicService<any>) {
    const proxyWrapper = dynamicProxyWrapper(service);

    return this.to(serviceId, proxyWrapper);
  }

  /**
   * 异步绑定单例
   * @param service 返回异步类构造函数
   */
  private toAsync(serviceId: ServiceContainerIdentifier, service: AsyncService<any>) {
    const proxyWrapper = asyncProxyWrapper(service);

    return this.to(serviceId, proxyWrapper);
  }

  /** 绑定多实例构造器 */
  private toConstructor(serviceId: ServiceContainerIdentifier, value: Service<any>) {
    this.container.bind(serviceId).toConstructor(value);
  }

  /** 绑定常量 */
  private toConstant(serviceId: ServiceContainerIdentifier, value: any) {
    this.container.bind(serviceId).toConstantValue(value);
  }

  private keepAlive(serviceId: ServiceContainerIdentifier) {
    this.updateServiceInfo(serviceId, { keepAlive: true });

    return;
  }

  private recordServiceInfo(
    serviceId: ServiceContainerIdentifier,
    service: any,
    options?: Partial<ServiceInfo>,
  ) {
    this.serviceInfos.set(serviceId, {
      service,
      retainCount: 0,
      ...options,
    });
  }

  private updateServiceInfo(serviceId: ServiceContainerIdentifier, info: Partial<ServiceInfo>) {
    this.serviceInfos.set(serviceId, {
      ...this.serviceInfos.get(serviceId)!,
      ...info,
    });
  }

  private getBindingOptions(serviceId: ServiceContainerIdentifier) {
    return {
      keepAlive: this.keepAlive.bind(this, serviceId),
    };
  }

  private genServiceIdentifier(dep: any) {
    const type = typeof dep;

    return Symbol(
      `qq-di_${
        type !== 'object' && type !== 'function'
          ? type
          : dep?.name || dep?.constructor?.name || dep?.prototype?.constructor?.name || 'anonymous'
      }`,
    );
  }

  private getTargetObjectName(target: any) {
    return target?.constructor?.name || 'anonymous';
  }

  private getIdentifier(serviceId: ServiceIdentifier) {
    return ServiceContainer.isServiceContainerIdentifier(serviceId)
      ? serviceId
      : this.getServiceIdentifier(serviceId);
  }

  private getServiceIdentifier(target: object, property?: string | symbol) {
    /** 尝试从属性类型获取 serviceId */
    const Service = property
      ? Reflect.getMetadata(MetadataKeys.designType, target, property)
      : Reflect.getMetadata(MetadataKeys.designType, target);
    const metadataId: ServiceContainerIdentifier | undefined =
      typeof Service === 'object' || typeof Service === 'function'
        ? Reflect.getMetadata(MetadataKeys.identifier, Service)
        : undefined;

    return metadataId;
  }

  /** 回收后重新绑定依赖 */
  private rebindService(serviceId: ServiceContainerIdentifier) {
    const info = this.serviceInfos.get(serviceId);

    if (!info) {
      return;
    }

    if (!this.container.isBound(serviceId)) {
      this.container.bind(serviceId).to(info.service);
    }
  }

  /** 给服务添加依赖 */
  private addDependency(serviceId: ServiceContainerIdentifier) {
    return {
      to: (target: object) => {
        // const ctor = typeof target === 'function' ? target : target.constructor;
        const metadataDeps: MetadataDependencies =
          Reflect.getMetadata(MetadataKeys.dependencies, target) || new Set();

        console.info('skr: add dep target', target, serviceId);

        metadataDeps.add(serviceId);

        this.increaseRetainCount(serviceId);
        Reflect.defineMetadata(MetadataKeys.dependencies, metadataDeps, target);
      },
    };
  }

  /** 给服务移除依赖 */
  private removeDependency(serviceId: ServiceContainerIdentifier) {
    return {
      from: (target: object) => {
        const metadataDeps: MetadataDependencies =
          Reflect.getMetadata(MetadataKeys.dependencies, target) || new Set();

        metadataDeps.delete(serviceId);
        this.reduceRetainCount(serviceId);
      },
    };
  }

  /** 给依赖增加引用计数 */
  private increaseRetainCount(serviceId: ServiceContainerIdentifier) {
    const info = this.serviceInfos.get(serviceId);

    if (info?.keepAlive) {
      return;
    }

    if (info) {
      const { retainCount = 0 } = info;
      this.updateServiceInfo(serviceId, { retainCount: retainCount + 1 });

      return;
    }

    /** 递归查找 */
    if (this.parent) {
      this.parent.increaseRetainCount(serviceId);

      return;
    }

    /** 找不到说明不需要管理引用计数 */
  }

  /** 给依赖减少引用计数 */
  private reduceRetainCount(serviceId: ServiceContainerIdentifier) {
    const info = this.serviceInfos.get(serviceId);

    if (info?.keepAlive) {
      return;
    }

    if (info) {
      const { retainCount = 0 } = info;

      retainCount > 0 && this.updateServiceInfo(serviceId, { retainCount: retainCount - 1 });

      if (retainCount - 1 < 1) {
        this.clearService(serviceId);
      }

      return;
    }

    /** 递归查找 */
    if (this.parent) {
      this.parent.reduceRetainCount(serviceId);

      return;
    }

    /** 找不到说明不需要管理引用计数 */
  }

  /** 清理 service 依赖并删除实例 */
  private clearService(serviceId: ServiceContainerIdentifier) {
    const info = this.serviceInfos.get(serviceId);

    if (!info) {
      return;
    }

    console.info('skr: unbind service ', serviceId);

    const target = this.container.get<Service<any>>(serviceId);

    this.dispose(target);
    /** 删除实例 */
    this.container.unbind(serviceId);
  }
}
