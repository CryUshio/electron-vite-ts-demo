/* eslint-disable @typescript-eslint/no-empty-function */
import { injectable } from 'inversify';
import { Service, IDisposable } from '../../../../qq-di';

@Service()
// @injectable()
export class Log implements IDisposable {
  print(...args: any[]) {
    console.log('[INFO]', ...args);
  }

  dispose(): void {}
}
