/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncService, Service, DynamicService } from './typings';

class DynamicWrapper<T extends object> {
  private dep: DynamicService<T>;

  private instance?: T;

  public constructor(dep: DynamicService<T>) {
    this.dep = dep;
  }

  public getInstance() {
    if (this.instance) {
      return this.instance;
    }

    const Service = this.dep();

    return (this.instance = new Service());
  }
}

class AsyncWrapper<T extends object> {
  private dep: AsyncService<T>;

  private instance?: T;

  public constructor(dep: AsyncService<T>) {
    this.dep = dep;
  }

  public async getInstance() {
    if (this.instance) {
      return this.instance;
    }

    const Service = await this.dep();

    return (this.instance = new Service());
  }
}

export function dynamicProxyWrapper<T extends object>(dep: DynamicService<T>) {
  // const dynamicWrapper = new DynamicWrapper(dep);

  return new Proxy(DynamicWrapper, {
    construct(target) {
      return new target(dep).getInstance();
    },
  }) as Service<T>;
}

export function asyncProxyWrapper<T extends object>(dep: AsyncService<T>) {
  // const asyncWrapper = new AsyncWrapper(dep);

  return new Proxy(AsyncWrapper, {
    construct(target) {
      return new target(dep).getInstance();
    },
  }) as Service<T>;
}
