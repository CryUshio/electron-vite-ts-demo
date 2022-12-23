/* eslint-disable no-nested-ternary */
/* eslint-disable max-params */
/* eslint-disable no-dupe-class-members */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Container, decorate, injectable } from 'inversify';
import { dynamicProxyWrapper } from './ServiceWrapper';
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
  Promisify,
  ConstructorArgumentsMetadata,
  IConstructable,
} from './typings';
import { getPropertyCacheMetadataKey } from './utils';
import { IDisposable } from './interfaces';

export class ServiceContainer {
  private static isServiceContainerIdentifier(
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

  public bind<T extends IDisposable>(
    serviceId: ServiceContainerIdentifier,
  ): Omit<ServiceBindingTo<T>, 'toSelf'>;

  public bind<T extends IDisposable>(serviceId: Service<T>): Pick<ServiceBindingTo<T>, 'toSelf'>;

  /**
   * 绑定一个标识符
   * @param serviceId 服务唯一标识
   */
  public bind(serviceId: ServiceIdentifier) {
    if (ServiceContainer.isServiceContainerIdentifier(serviceId)) {
      return {
        to: this.to.bind(this, serviceId),
        toDynamic: this.toDynamic.bind(this, serviceId),
        // toAsync: this.toAsync.bind(this, serviceId),
        toConstructor: this.toConstructor.bind(this, serviceId),
        toConstant: this.toConstant.bind(this, serviceId),
      };
    }

    return {
      toSelf: this.toSelf.bind(this, serviceId),
    };
  }

  public get<T>(serviceId: ServiceIdentifier): T {
    console.info('skr: serviceId', serviceId);
    const identifier = this.getIdentifier(serviceId);

    if (!identifier) {
      throw new Error(`No service identifier found from '${this.getTargetObjectName(serviceId)}'`);
    }

    const info = this.serviceInfos.get(identifier);

    if (info && info.retainCount < 1 && !info.keepAlive) {
      throw new Error(`Service '${identifier.toString()}' now is inactive.`);
    }

    const service = this.container.get<T>(identifier);

    return service;
  }

  public isBound(serviceId: ServiceIdentifier): boolean {
    console.info('skr: serviceId', serviceId);
    const identifier = this.getIdentifier(serviceId);

    if (!identifier) {
      return false;
    }

    return this.container.isBound(identifier);
  }

  public createChild() {
    const child = new ServiceContainer(this);

    return child;
  }

  public dispose(target: object) {
    // const ctor = typeof target === 'function' ? target : target.constructor;
    const metadataDeps: MetadataDependencies =
      Reflect.getMetadata(MetadataKeys.dependencies, target) || new Set();

    console.info(
      'skr: dispose deps',
      target,
      metadataDeps,
      Reflect.getMetadata(MetadataKeys.dependencies, target.constructor),
    );

    metadataDeps.forEach((serviceId) => {
      this.reduceRetainCount(serviceId);
    });

    // Reflect.deleteMetadata(MetadataKeys.dependencies, target);
  }

  /**
   * 服务装饰器
   * @type decorator
   *
   * 标记一个服务，并注入构造函数参数
   */
  public Service() {
    return (target: IConstructable<any>) => {
      Reflect.defineMetadata(MetadataKeys.isService, true, target);

      const getService = (serviceId: ServiceContainerIdentifier) => {
        return this.prepareInjectService(serviceId);
      };

      const buildingRelationships = (serviceId: ServiceContainerIdentifier, target: object) => {
        this.buildingRelationships(target, serviceId);
      };

      function Wrapper(...params: any[]) {
        const args: ConstructorArgumentsMetadata =
          Reflect.getMetadata(MetadataKeys.arguments, target) || {};

        Object.entries(args).forEach(([index, serviceId]) => {
          const service = getService(serviceId);

          params.splice(Number(index), 1, service);
        });

        const instance = new target(...params);

        Object.entries(args).forEach(([index, serviceId]) => {
          buildingRelationships(serviceId, instance);
        });

        return instance;
      }

      Object.defineProperty(Wrapper, 'name', { value: this.getTargetObjectName(target) });

      console.info('skr: @Service', this.getTargetObjectName(Wrapper));

      return Wrapper as unknown as IConstructable<any>;
    };
  }

  /**
   * Vue 组件消费者装饰器
   * @type decorator
   *
   * 自动绑定 dispose
   */
  public Consumer() {
    const dispose = this.dispose.bind(this);

    return function (target: Service<any>) {
      console.info('skr: Consumer', target.name);

      const descriptor = Reflect.getOwnPropertyDescriptor(target.prototype, 'unmounted') || {
        value() {},
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
    return (
      target: object,
      property: string | undefined,
      indexOrPropertyDescriptor?: number | PropertyDescriptor,
    ) => {
      return this.inject(target, property, indexOrPropertyDescriptor, serviceId);
    };
  }

  /**
   * 注入异步依赖
   * @type decorator
   *
   * 懒加载的语法糖，注意异步依赖是一个 Promise
   */
  public AsyncInject(serviceId: ServiceIdentifier) {
    // return <T extends object, P extends keyof T>(target: T & Promisify<T, P>, property: P) => {
    //   return this.inject(target, property as string, serviceId);
    // };

    return (
      target: object,
      property: string,
      indexOrPropertyDescriptor?: number | PropertyDescriptor,
    ) => {
      return this.inject(target, property, indexOrPropertyDescriptor, serviceId);
    };
  }

  public snapshot() {
    console.info('skr: snapshot ', this.serviceInfos);
  }

  private inject(
    target: object,
    property: string | undefined,
    indexOrPropertyDescriptor: number | PropertyDescriptor | undefined,
    serviceId?: ServiceIdentifier,
  ) {
    console.info(
      'skr: inject',
      this.getTargetObjectName(target),
      property,
      indexOrPropertyDescriptor,
    );

    if (typeof indexOrPropertyDescriptor === 'number') {
      if (property !== undefined) {
        throw new Error('@LazyInject can only be used in property, constructor parameters.');
      }

      return this.injectParameter(target, undefined, indexOrPropertyDescriptor, serviceId);
    }

    return this.injectProperty(target, property!, serviceId);
  }

  private injectProperty(target: object, property: string, serviceId?: ServiceIdentifier) {
    Reflect.defineProperty(target, property, {
      get: () => {
        const identifier = this.getInjectIdentifier(target, property, undefined, serviceId);
        const service = this.prepareInjectService(identifier);

        this.buildingRelationships(target, identifier);

        return service;
      },
    });
    /** 保护属性不被修改 */
    Reflect.defineProperty(target, property, {
      writable: false,
    });

    return Object.getOwnPropertyDescriptor(target, property) as any;
  }

  private injectParameter(
    target: object,
    property: undefined,
    index: number,
    serviceId?: ServiceIdentifier,
  ) {
    /** 尝试从属性类型获取 serviceId */
    const identifier = this.getInjectIdentifier(target, property, index, serviceId);

    const args: ConstructorArgumentsMetadata =
      Reflect.getMetadata(MetadataKeys.arguments, target) || {};

    /** 避免重复执行添加依赖逻辑 */
    if (!Object.values(args).includes(identifier)) {
      args[String(index)] = identifier;

      Reflect.defineMetadata(MetadataKeys.arguments, args, target);
    }

    console.info(
      'skr: injectParameter',
      this.getTargetObjectName(target),
      property,
      index,
      identifier,
    );
  }

  /** 保证注入的依赖有被绑定到内部容器 */
  private prepareInjectService(serviceId: ServiceContainerIdentifier) {
    console.info('skr: prepareInjectService', serviceId);

    this.rebindService(serviceId);

    return this.container.get(serviceId);
  }

  /** 建立依赖关系 */
  private buildingRelationships(target: object, serviceId: ServiceContainerIdentifier) {
    const injected: ServiceContainerIdentifier[] =
      Reflect.getMetadata(MetadataKeys.isInjected, target) || [];

    /** 避免重复执行添加依赖逻辑 */
    if (!injected.includes(serviceId)) {
      this.addDependency(serviceId).to(target);
      injected.push(serviceId);

      Reflect.defineMetadata(MetadataKeys.isInjected, injected, target);
    }
  }

  private to(serviceId: ServiceContainerIdentifier, dep: Service<any>) {
    decorate(injectable(), dep);
    Reflect.defineMetadata(MetadataKeys.identifier, serviceId, dep);
    this.recordServiceInfo(serviceId, dep);

    console.info('skr: bind', dep?.name, serviceId);

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
    const proxyWrapper = dynamicProxyWrapper(service, serviceId.toString());

    return this.to(serviceId, proxyWrapper);
  }

  /**
   * 异步绑定单例
   * @param service 返回异步类构造函数
   */
  // private toAsync(serviceId: ServiceContainerIdentifier, service: AsyncService<any>) {
  //   const proxyWrapper = asyncProxyWrapper(service);

  //   return this.to(serviceId, proxyWrapper);
  // }

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

  private getTargetObjectName(serviceId: any) {
    return ServiceContainer.isServiceContainerIdentifier(serviceId)
      ? serviceId
      : serviceId?.name ||
          serviceId?.constructor?.name ||
          serviceId?.constructor?.prototype?.name ||
          'anonymous';
  }

  /** 获取指定 id 的唯一服务 id */
  private getIdentifier(serviceId: ServiceIdentifier) {
    return ServiceContainer.isServiceContainerIdentifier(serviceId)
      ? serviceId
      : this.getServiceIdentifier(serviceId);
  }

  /** 获取 inject 装饰器装饰的属性对应的服务 id */
  private getInjectIdentifier(
    target: object,
    property?: string | symbol,
    index?: number | PropertyDescriptor,
    serviceId?: ServiceIdentifier,
  ) {
    const identifier =
      serviceId !== undefined
        ? this.getIdentifier(serviceId)
        : this.getServiceIdentifier(target, property, index);

    if (!identifier) {
      throw new Error(
        `No service identifier found. From '${this.getTargetObjectName(target)}.${String(
          property,
        )}'`,
      );
    }
    return identifier;
  }

  private getServiceIdentifier(
    target: object,
    property?: string | symbol,
    index?: number | PropertyDescriptor,
  ) {
    /** 尝试从类的属性类型获取 serviceId，即原始构造函数 */
    const Service = property
      ? /** 属性依赖 */
        Reflect.getMetadata(MetadataKeys.designType, target, property)
      : typeof index === 'number'
      ? /** 构造函数参数依赖 */
        Reflect.getMetadata(MetadataKeys.designParamTypes, target)[index]
      : target;
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

        console.info('skr: add dep %s to %s', serviceId, this.getTargetObjectName(target));

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

    const target = this.container.get<IDisposable>(serviceId);

    this.dispose(target);
    target?.dispose?.();
    /** 删除实例 */
    this.container.unbind(serviceId);
  }
}
