import { EventChannel } from '../../common/const';

interface IGetFileRes {
  serverReceiveTime: number;
  serverSendTime: number;
  serverHandleCost: number;
}

interface IReadFileRes {
  serverSendTime: number;
}

interface IPerformanceData {
  uploadCost: number;
  downloadCost: number;
  handleCost: number;
}

export default {
  getFile(size: number): Promise<IPerformanceData> {
    const startTime = Date.now();
    return window.ipcRenderer
      .invoke(EventChannel.GET_FILE, { size, startTime })
      .then((r: IGetFileRes) => {
        console.info('skr: ipc serverHandleCost', r.serverHandleCost);

        return {
          uploadCost: r.serverReceiveTime - startTime,
          downloadCost: Date.now() - r.serverSendTime,
          handleCost: r.serverHandleCost,
        };
      });
  },

  startFileRead(size: number, concurrent: number): Promise<void> {
    return window.ipcRenderer.invoke(EventChannel.START_READ_FILE, { size, concurrent });
  },

  onFileRead(cb: (res: Pick<IPerformanceData, 'downloadCost'>) => void): void {
    window.ipcRenderer.on(EventChannel.READ_FILE, (e, res: IReadFileRes) => {
      cb({ downloadCost: Date.now() - res.serverSendTime });
    });
  },
};
