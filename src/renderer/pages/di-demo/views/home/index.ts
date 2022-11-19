/* eslint-disable @typescript-eslint/ban-types */
import { Container, decorate, inject, injectable } from 'inversify';
import { v4 } from 'uuid';
import { Vue } from 'vue-class-component';
import { ctr } from '../../services/container';
import { Log } from '../../services/Log';
import { Message } from '../../services/Message';

@ctr.Consumer()
export default class Home extends Vue {
  // private test = ctr.get(Foo);
  // @inject(Log)
  // private log!: Log;

  @ctr.LazyInject()
  private msgService!: Message;

  // private get msgService() {
  //   return ctr.get(Message);
  //   // return new Message();
  // }

  public getSize() {
    this.msgService.send();
    ctr.snapshot();
  }

  public bind() {
    console.info('skr: bind');
  }

  public unmounted() {
    console.info('skr: Home unmounted');
    ctr.snapshot();
  }
}
