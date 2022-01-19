import { EventChannel } from '../common/const';
import { Server } from 'socket.io';
import generateTestContent from './utils/generateTestContent';

const ws = new Server();

export default function wsServer() {
  ws.listen(3001);

  ws.on('connection', (client) => {
    client.on(EventChannel.GET_FILE, ({ size, startTime, seq }) => {
      const start = Date.now();
      console.info('skr: ws server', EventChannel.GET_FILE, start - startTime);
      const file = generateTestContent(size);
      const end = Date.now();

      client.emit(EventChannel.GET_FILE, {
        serverReceiveTime: start,
        serverSendTime: end,
        serverHandleCost: end - start,
        file,
        seq,
      });
    });

    client.on(EventChannel.START_READ_FILE, ({ size, concurrent }) => {
      console.info('skr: ws server', EventChannel.START_READ_FILE);
      /** 主进程触发事件 */
      for (let i = 0; i < concurrent; i++) {
        ws.emit(EventChannel.READ_FILE, {
          serverSendTime: Date.now(),
          file: generateTestContent(size),
        });
      }
    });
  });
}
