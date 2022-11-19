import { inject, injectable } from 'inversify';
import { Service } from '../../../../qq-di';
import { ctr } from './container';
import { Log } from './Log';

function P(): PropertyDecorator {
  return function (target, p) {
    console.info('skr: P', target, p);

    Reflect.defineProperty(target, `_${p.toString()}`, {
      get() {
        console.info('skr: _p');
        return 'skr: p';
      },
    });

    Reflect.defineProperty(target.constructor, p, {
      value: target[`_${p.toString()}`],
    });
  };
}

@Service()
// @injectable()
export class Message {
  // @inject(Log)
  @ctr.LazyInject()
  private log!: Log;

  constructor() {
    console.info('skr: Message ctor');
  }

  send() {
    this.log.print('send msg');
  }
}
