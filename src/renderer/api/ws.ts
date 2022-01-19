import WebSocket from 'socket.io-client';
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

const ws = WebSocket('//localhost:3001');

ws.on('open', () => {
  console.info('skr: ws connected.');
});

export default {
  getFile(size: number): Promise<IPerformanceData> {
    const startTime = Date.now();
    const seq = `${EventChannel.GET_FILE}-${startTime}-${Math.random()}`;

    const req = new Promise<IPerformanceData>((resolve) => {
      const listener = (r: IGetFileRes) => {
        if (r.seq === seq) {
          console.info('skr: ws serverHandleCost', r.serverHandleCost);
          ws.off(EventChannel.GET_FILE, listener);

          resolve({
            uploadCost: r.serverReceiveTime - startTime,
            downloadCost: Date.now() - r.serverSendTime,
            handleCost: r.serverHandleCost,
          });
        }
      };

      ws.on(EventChannel.GET_FILE, listener);
    });

    ws.emit(EventChannel.GET_FILE, { size, startTime, seq });

    return req;
  },

  startFileRead(size: number, concurrent: number): void {
    ws.emit(EventChannel.START_READ_FILE, { size, concurrent });
  },

  onFileRead(cb: (res: Pick<IPerformanceData, 'downloadCost'>) => void): void {
    ws.on(EventChannel.READ_FILE, (res: IReadFileRes) => {
      cb({ downloadCost: Date.now() - res.serverSendTime });
    });
  },
};
