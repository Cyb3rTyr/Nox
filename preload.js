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

// Sanity-check in DevTools console:
console.log('✅ preload loaded — defenderAPI.run is', typeof window.defenderAPI.run);

// preload.js
contextBridge.exposeInMainWorld('cleanupAPI', {
    /**
     * action: 'scan'|'cleanAll'|'cleanOldUpdates'|'cleanDownloads'|'cleanTemp'
     */
    run: (action) => ipcRenderer.invoke('cleanup-run', action)
});
