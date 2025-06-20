// preload.js
const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('defenderAPI', {
    run: (mode, target) => ipcRenderer.invoke('defender-run', mode, target),

    getDiskBytes: async () => {
        const drives = await require('node-disk-info').driveList();
        const sys = drives.find(d => d.filesystem.startsWith('C:') || d.mounted === '/');
        return sys.blocks * sys.blockSize;
    },

    getScanEstimate: (mode, target) => ipcRenderer.invoke('get-scan-estimate', mode, target)
});



contextBridge.exposeInMainWorld('cleanupBridge', {
    run: action => ipcRenderer.invoke('cleanup-run', action),
    cancel: () => ipcRenderer.invoke('cleanup-cancel'),
    onProgress: callback => ipcRenderer.on('cleanup-progress', (_e, pct) => callback(pct))
});

contextBridge.exposeInMainWorld('urlScanner', {
    scan: (url) => ipcRenderer.invoke('scan-url', url)
});

contextBridge.exposeInMainWorld('sysInfo', {
    getStats: () => ipcRenderer.invoke('get-system-stats')
});

// new: update API
contextBridge.exposeInMainWorld('updateAPI', {
    getUpdates: () => ipcRenderer.invoke('get-updates'),
    upgradeAll: () => ipcRenderer.invoke('upgrade-all')
});

// Sanity‐check in DevTools:
console.log(
    '✅ preload loaded – cleanupBridge.run:',
    typeof window.cleanupBridge?.run,
    'cleanupBridge.cancel:',
    typeof window.cleanupBridge?.cancel,
    'upgradeAll →',
    typeof window.updateAPI?.upgradeAll
);