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
    run: action => ipcRenderer.invoke('cleanup-run', action),
    cancel: () => ipcRenderer.invoke('cleanup-cancel'),
    onProgress: callback => ipcRenderer.on('cleanup-progress', (_e, pct) => callback(pct))
});

// Sanity‐check in DevTools:
console.log(
    '✅ preload loaded – cleanupBridge.run:',
    typeof window.cleanupBridge?.run,
    'cleanupBridge.cancel:',
    typeof window.cleanupBridge?.cancel
);

