/* eslint-disable @typescript-eslint/no-explicit-any */
export type Newable<T> = new (...args: any[]) => T;

export type Service<T> = Newable<T>;

export type DynamicService<T> = () => Service<T>;

export type AsyncService<T> = () => Promise<Service<T>>;

export interface IConstructable<T> {
  new (...args: any[]): T;
  [key: string]: any;
}

export type ServiceContainerIdentifier = symbol | string;

export type ServiceIdentifier<T = unknown> = ServiceContainerIdentifier | Service<T>;

export type MetadataDependencies = Set<ServiceContainerIdentifier>;

export interface ServiceInfo {
  service: any;
  retainCount: number;
  keepAlive?: boolean;
}

export interface ServiceBindingTo<T> {
  to(service: Service<T>): ServiceBindingOptions;
  toSelf(): ServiceBindingOptions;
  toDynamic(service: DynamicService<T>): ServiceBindingOptions;
  toAsync(service: AsyncService<T>): ServiceBindingOptions;
  toConstructor(value: Service<T>): void;
  toConstant(value: any): void;
}

export interface ServiceBindingOptions {
  keepAlive(): void;
}

export enum MetadataKeys {
  designType = 'design:type',
  isService = 'qq-di__is_a_service',
  isInjected = 'qq-di__is_injected',
  identifier = 'qq-di__identifier',
  dependencies = 'qq-di__deps',
}
