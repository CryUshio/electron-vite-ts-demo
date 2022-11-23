import { ServiceContainer } from '../../../../qq-di';

export const ctr = new ServiceContainer();

export enum ServiceIdentifiers {
  Message = 'serviceId_Message',
  IPC = 'serviceId_IPC',
}
