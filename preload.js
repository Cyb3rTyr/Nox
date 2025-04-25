const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('noxAPI', {
    runUpdate: () => ipcRenderer.invoke('run-update-command'),

    listVaultFolders: () => ipcRenderer.invoke('list-vault-folders'),
    listFolderFiles: (folderName) => ipcRenderer.invoke('list-folder-files', folderName),
    addFolderToVault: () => ipcRenderer.invoke('add-folder-to-vault'),
    deleteFolder: (folderName) => ipcRenderer.invoke('delete-folder', folderName),
    copyFileToFolder: (filePath, folderName) => ipcRenderer.invoke('copy-file-to-folder', { filePath, folderName }),
});
