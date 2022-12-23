/* eslint-disable @typescript-eslint/no-empty-function */
import type { IPC } from './Ipc';
import { IDisposable, Service } from '../../../../qq-di';
import { ctr, ServiceIdentifiers } from './container';

@Service()
export class Channel implements IDisposable {
  @ctr.LazyInject(ServiceIdentifiers.IPC)
  private ipc!: IPC;

  public constructor() {
    console.info('skr: Channel ctor');
  }

  public invoke() {
    console.info('skr: Channel invoke', this);

    this.ipc.invoke();
  }

  public dispose(): void {}
}
