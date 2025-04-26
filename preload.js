const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('noxAPI', {
    runUpdate: () => ipcRenderer.invoke('run-update-command'),
});
