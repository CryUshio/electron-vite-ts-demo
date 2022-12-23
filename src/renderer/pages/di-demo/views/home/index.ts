/* eslint-disable @typescript-eslint/ban-types */
import { Container, decorate, inject, injectable } from 'inversify';
import { v4 } from 'uuid';
import { Vue } from 'vue-class-component';
import { ctr, ServiceIdentifiers } from '../../services/container';
import { Log } from '../../services/Log';
import { IPC } from '../../services/Ipc';
import { Message } from '../../services/Message';
import MockVueComp from './mock';

type Promisify<T extends object> = { [P in keyof T]: Promise<T[P]> };

@ctr.Consumer()
export default class Home extends Vue {
  // private test = ctr.get(Foo);
  // @inject(Log)
  // private log!: Log;

  @ctr.LazyInject(ServiceIdentifiers.Message)
  private msgService!: Message;

  @ctr.LazyInject(ServiceIdentifiers.IPC)
  private ipc!: IPC;

  // private get msgService() {
  //   return ctr.get(Message);
  //   // return new Message();
  // }

  public getSize() {
    this.msgService.send();
    ctr.snapshot();
  }

  public async invoke() {
    console.info('skr: invoke', this.ipc);

    // (await this.ipc.invoke)();
    ctr.snapshot();
  }

  public bind() {
    console.info('skr: bind');
  }

  public mounted() {
    // const comp = new MockVueComp();

    // comp.mounted();
    // comp.unmounted();
  }

  public unmounted() {
    console.info('skr: Home unmounted');
    ctr.snapshot();
  }
}
