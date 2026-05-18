const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flashApi', {
  getData: () => ipcRenderer.invoke('get-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  pickCsv: () => ipcRenderer.invoke('pick-csv'),
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  triggerStudyBreak: () => ipcRenderer.invoke('trigger-study-break'),
  onTimerFired: (cb) => {
    const handler = (_, payload) => cb(payload);
    ipcRenderer.on('timer-fired', handler);
    return () => ipcRenderer.removeListener('timer-fired', handler);
  },
  onMandatoryBlocked: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('mandatory-blocked', handler);
    return () => ipcRenderer.removeListener('mandatory-blocked', handler);
  },
});
