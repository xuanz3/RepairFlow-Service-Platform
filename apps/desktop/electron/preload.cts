import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('repairFlow', {
  platform: process.platform,
  version: '0.1.0',
});
