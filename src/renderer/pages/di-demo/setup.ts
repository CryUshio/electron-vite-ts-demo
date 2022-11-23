import { Service } from '@/qq-di/typings';
import { ctr, ServiceIdentifiers } from './services/container';
import { Log } from './services/Log';
import type { Message } from './services/Message';

export function setup() {
  ctr.bind(Log).toSelf();
  ctr.bind(ServiceIdentifiers.Message).toDynamic(() => require('./services/Message').Message);
  ctr.bind(ServiceIdentifiers.IPC).toAsync(async () => (await import('./services/Ipc')).IPC);
}
