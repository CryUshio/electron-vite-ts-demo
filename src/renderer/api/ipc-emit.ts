import { EventChannel } from '../../common/const';

interface IGetFileRes {
  serverReceiveTime: number;
  serverSendTime: number;
  serverHandleCost: number;
  seq: string;
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
    const seq = `${EventChannel.GET_FILE_EMIT}-${startTime}-${Math.random()}`;

    const req = new Promise<IPerformanceData>((resolve) => {
      const listener = (e, r: IGetFileRes) => {
        if (r.seq === seq) {
          console.info('skr: ws serverHandleCost', r.serverHandleCost);
          window.ipcRenderer.removeListener(EventChannel.GET_FILE_EMIT, listener);

          resolve({
            uploadCost: r.serverReceiveTime - startTime,
            downloadCost: Date.now() - r.serverSendTime,
            handleCost: r.serverHandleCost,
          });
        }
      };

      window.ipcRenderer.on(EventChannel.GET_FILE_EMIT, listener);
    });

    window.ipcRenderer.send(EventChannel.GET_FILE_EMIT, { size, startTime, seq });

    return req;
  },

  startFileRead(size: number, concurrent: number): void {
    return window.ipcRenderer.send(EventChannel.START_READ_FILE, { size, concurrent });
  },

  onFileRead(cb: (res: Pick<IPerformanceData, 'downloadCost'>) => void): void {
    window.ipcRenderer.on(EventChannel.READ_FILE, (e, res: IReadFileRes) => {
      cb({ downloadCost: Date.now() - res.serverSendTime });
    });
  },
};
