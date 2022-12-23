import { Channel } from './services/Channel';
import { ctr, ServiceIdentifiers } from './services/container';
import { Log } from './services/Log';

export function setup() {
  ctr.bind(Log).toSelf();
  ctr.bind(Channel).toSelf();
  ctr.bind(ServiceIdentifiers.Message).toDynamic(() => require('./services/Message').Message);
  ctr.bind(ServiceIdentifiers.IPC).toDynamic(() => require('./services/Ipc').IPC);
  // ctr.bind(ServiceIdentifiers.IPC).toAsync(async () => (await import('./services/Ipc')).IPC);
}
