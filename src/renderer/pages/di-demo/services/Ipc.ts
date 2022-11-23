/* eslint-disable @typescript-eslint/no-empty-function */
import { IDisposable, Service } from '../../../../qq-di';
import { ctr } from './container';
import { Log } from './Log';

function P(target, p) {
  console.info('skr: IPC prop decorator');
}

@Service()
export class IPC implements IDisposable {
  @ctr.LazyInject()
  private log!: Log;

  constructor() {
    console.info('skr: IPC ctor');
  }

  invoke() {
    console.info('skr: IPC invoke', this);

    this.log.print('ipc invoke');
  }

  dispose(): void {}
}
