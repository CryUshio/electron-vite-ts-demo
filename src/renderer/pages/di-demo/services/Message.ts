/* eslint-disable @typescript-eslint/no-empty-function */
import { inject } from 'inversify';
import { IDisposable, Service } from '../../../../qq-di';
import { ctr } from './container';
import { Log } from './Log';

@ctr.Service()
export class Message implements IDisposable {
  private log: Log;

  constructor(@ctr.LazyInject() log: Log) {
    this.log = log;
    console.info('skr: Message ctor', log);
  }

  send() {
    this.log.print('send msg');
  }

  dispose(): void {}
}
