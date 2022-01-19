declare global {
  interface Window {
    ipcRenderer: Electron.IpcRenderer;
  }
}

export {};
