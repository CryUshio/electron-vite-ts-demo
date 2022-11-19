import { ctr } from './services/container';
import { Log } from './services/Log';
import { Message } from './services/Message';

export function setup() {
  ctr.bind(Log).toSelf();
  ctr.bind(Message).toSelf();
}
