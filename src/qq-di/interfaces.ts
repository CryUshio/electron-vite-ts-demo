import { Service } from './typings';

export interface IDisposable {
  dispose(): void;
}

export type IService<T extends IDisposable> = Service<T>;
