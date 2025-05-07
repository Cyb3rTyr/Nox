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
    /**
     * Runs the cleanup script. Returns Promise<string> of stdout.
     * @param {'scan'|'cleanDownloads'|'cleanTemp'|'cleanOldUpdates'|'cleanAll'} action
     */
    run: action => ipcRenderer.invoke('cleanup-run', action),
    /** Cancels the currently running cleanup, if any */
    cancel: () => ipcRenderer.invoke('cleanup-cancel')
});

// Sanity‐check in DevTools:
console.log(
    '✅ preload loaded – cleanupBridge.run:',
    typeof window.cleanupBridge?.run,
    'cleanupBridge.cancel:',
    typeof window.cleanupBridge?.cancel
);

