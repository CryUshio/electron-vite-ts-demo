/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { unmanaged } from 'inversify';
import type { AsyncService, Service, DynamicService } from './typings';
import { IDisposable } from './interfaces';

class DynamicWrapper<T extends IDisposable> {
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

class AsyncWrapper<T extends IDisposable> {
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

export function dynamicProxyWrapper<T extends IDisposable>(dep: DynamicService<T>, name?: string) {
  // const dynamicWrapper = new DynamicWrapper(dep);

  function ProxyFn() {
    return new DynamicWrapper(dep).getInstance();
  }

  if (name) {
    Object.defineProperty(ProxyFn, 'name', { value: name });
  }

  return ProxyFn as unknown as Service<T>;
}

// export function asyncProxyWrapper<T extends IDisposable>(dep: AsyncService<T>) {
//   // const asyncWrapper = new AsyncWrapper(dep);

//   // return new Proxy(function AsyncWrapper() {}, {
//   //   construct() {
//   //     return new AsyncWrapper(dep).getInstance();
//   //   },
//   // }) as unknown as Service<T>;

//   return class AsyncWrapper {
//     private dep = dep;

//     private instance?: Promise<T>;

//     public constructor() {
//       // @ts-ignore
//       return new Proxy(() => {}, {
//         get: async (target, p: keyof T) => {
//           console.info('skr: AsyncWrapper Proxy', p);

//           const instance = await this.getInstance();

//           // @ts-ignore
//           return typeof instance[p] === 'function' ? instance[p].bind(instance) : instance[p];
//         },
//       });
//     }

//     public getInstance() {
//       if (this.instance) {
//         return this.instance;
//       }

//       return (this.instance = (async () => {
//         const Service = await this.dep();

//         console.info('skr: service', Service);

//         return new Service();
//       })());
//     }
//   };
// }
