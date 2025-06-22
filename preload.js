// preload.js
const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('defenderAPI', {
    /**
     * Runs a DefenderScanner script.
     * mode: 'update'|'quick'|'full'|'folder'|'realtime-on'|'realtime-off'
     * target: optional folder path
     */
    run: (mode, target) => ipcRenderer.invoke('defender-run', mode, target)
});


contextBridge.exposeInMainWorld('cleanupBridge', {
    run: (action) => ipcRenderer.invoke('cleanup-run', action),
    onProgress: (cb) => ipcRenderer.on('cleanup-progress', (_e, pct) => cb(pct)),
    onError: (cb) => ipcRenderer.on('cleanup-error', (_e, msg) => cb(msg)),
    onDone: (cb) => ipcRenderer.on('cleanup-done', (_e, code) => cb(code))
});


contextBridge.exposeInMainWorld('urlScanner', {
    scan: (url) => ipcRenderer.invoke('scan-url', url)
});

contextBridge.exposeInMainWorld('sysInfo', {
    getStats: () => ipcRenderer.invoke('get-system-stats')
});

// new: update API
contextBridge.exposeInMainWorld('updateAPI', {
    checkUpdates: () => ipcRenderer.invoke('check-updates'),
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

