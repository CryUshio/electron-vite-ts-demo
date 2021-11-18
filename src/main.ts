import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 240,
    minHeight: 300,
    webPreferences: {
      // 编译后后缀名为 js
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  console.log(process.env.NODE_ENV);
  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000/main');
    // Open the DevTools.
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, './renderer/main.html'));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools({ mode: 'detach' });

  const ChildWindow = new BrowserWindow({
    x: mainWindow.getBounds().x + 200,
    y: mainWindow.getBounds().y,
    width: 400,
    height: 600,
    autoHideMenuBar: true, //设置窗口菜单栏是否自动隐藏
    resizable: false, // 用户是否可以手动调整窗口大小
    parent: mainWindow, // 设置父窗口 remote.getCurrentWindow() 返回 BrowserWindow - 此网页所属的窗口
    minimizable: false, //是否可以最小化
    movable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
    },
    hasShadow: false,
  });
  ChildWindow.loadURL('http://localhost:3000/main');
  // ChildWindow.setAlwaysOnTop(true);
  ChildWindow.show();

  // setTimeout(() => {
  //   ChildWindow.setBounds({ x: 0, y: 0, width: 400, height: 320 }, true);
  // }, 3000);

  let prevY = ChildWindow.getBounds().y;
  mainWindow.on('will-resize', (e, newBounds, details) => {
    console.info('skr: resize', newBounds, details);
    const { x, y: badY, width, height } = newBounds;
    const mainWindowBounds = mainWindow.getBounds();

    // let y = mainWindowBounds.y;
    // let h = mainWindowBounds.height;

    // if (prevY !== mainWindowBounds.y) {
    //   prevY = badY;
    //   y = badY;
    //   h = height;
    // }

    ChildWindow.setBounds({
      x: x + 200,
      y: badY,
      width: mainWindowBounds.width - 200,
      height,
    });
    // ChildWindow.setPosition(x + 200, y);
    // ChildWindow.setSize(width - 200, height);
  });

  mainWindow.on('resized', () => {
    console.info('skr: resized');
  });

  // mainWindow.on('will-move', (e, newBounds) => {
  //   console.info('skr: move', newBounds);
  //   // const { x, y, width, height } = newBounds;
  //   // ChildWindow.setBounds({ x: x + 200, y, width: width - 200, height });
  //   // ChildWindow.setPosition(x + 200, y);
  //   // ChildWindow.setSize(width - 200, height);
  // });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

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
