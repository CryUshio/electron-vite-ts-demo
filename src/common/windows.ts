import { BrowserWindow } from 'electron';

export const windows: Map<string | symbol, BrowserWindow> = new Map();
