/* eslint-disable @typescript-eslint/no-empty-function */
import { IDisposable, Service } from '../../../../qq-di';
import { ctr } from './container';
import { Log } from './Log';

@Service()
export class Message implements IDisposable {
  @ctr.LazyInject()
  private log!: Log;

  constructor() {
    console.info('skr: Message ctor');
  }

  send() {
    this.log.print('send msg');
  }

  dispose(): void {}
}