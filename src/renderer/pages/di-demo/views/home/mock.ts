/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Channel } from '../../services/Channel';
import { ctr } from '../../services/container';

// @ts-ignore
@ctr.Consumer()
export default class MockVueComp {
  @ctr.LazyInject()
  public channel!: Channel;

  public mounted() {
    console.info('skr: MockVueComp mounted', this);
    this.channel.invoke();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public unmounted() {
    console.info('skr: MockVueComp unmounted', this);
  }
}
