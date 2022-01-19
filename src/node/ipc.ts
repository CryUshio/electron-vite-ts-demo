import { ipcMain } from 'electron';
import { windows } from '../common/windows';
import { EventChannel, WindowNames } from '../common/const';
import generateTestContent from './utils/generateTestContent';

export default function ipcServer() {
  /** 渲染层主调 */
  ipcMain.handle(EventChannel.GET_FILE, (e, { size, startTime }) => {
    const start = Date.now();
    console.info('skr: ipcMain', EventChannel.GET_FILE, start - startTime);
    const file = generateTestContent(size);
    const end = Date.now();

    return {
      serverReceiveTime: start,
      serverSendTime: end,
      serverHandleCost: end - start,
      file,
    };
  });

  /** 渲染层 emit */
  ipcMain.on(EventChannel.GET_FILE_EMIT, (e, { size, startTime, seq }) => {
    const start = Date.now();
    console.info('skr: ipcMain', EventChannel.GET_FILE_EMIT, start - startTime);
    const file = generateTestContent(size);
    const end = Date.now();

    windows.get(WindowNames.MAIN)?.webContents.send(EventChannel.GET_FILE_EMIT, {
      serverReceiveTime: start,
      serverSendTime: end,
      serverHandleCost: end - start,
      file,
      seq,
    });
  });

  ipcMain.handle(EventChannel.START_READ_FILE, (e, { size, concurrent }) => {
    console.info('skr: ipcMain', EventChannel.START_READ_FILE);
    /** 主进程触发事件 */
    for (let i = 0; i < concurrent; i++) {
      windows.get(WindowNames.MAIN)?.webContents.send(EventChannel.READ_FILE, {
        serverSendTime: Date.now(),
        file: generateTestContent(size),
      });
    }
  });
}
