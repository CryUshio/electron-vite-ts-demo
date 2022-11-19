import { injectable } from 'inversify';
import { Service } from '../../../../qq-di';

@Service()
// @injectable()
export class Log {
  print(...args: any[]) {
    console.log('[INFO]', ...args);
  }
}
