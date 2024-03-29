import path from 'path';
import { app, BrowserWindow } from 'electron';
import ipcServer from './node/ipc';
import { windows } from './common/windows';
import { WindowNames } from './common/const';
import wsServer from './node/ws';

function createWindow() {
  console.log(process.env.NODE_ENV);
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 240,
    minHeight: 300,
    webPreferences: {
      // contextIsolation: true,
      // 编译后后缀名为 js
      webSecurity: false,
      preload: path.join(__dirname, './preload.js'),
    },
  });

  windows.set(WindowNames.MAIN, mainWindow);

  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000/pages/main/index.html');
    // Open the DevTools.
    mainWindow.webContents.openDevTools({ mode: 'bottom' });
  } else {
    mainWindow.loadFile(path.join(__dirname, './renderer/main.html'));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  /** 启动 ipcServer */
  ipcServer();
  wsServer();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
