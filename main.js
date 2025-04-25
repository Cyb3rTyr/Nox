const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const vaultPath = path.join(__dirname, 'vault'); // 📂 <-- vault folder

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 900,
        minWidth: 700,
        minHeight: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('index.html');
}

// Ensure vault folder exists
app.whenReady().then(() => {
    if (!fs.existsSync(vaultPath)) {
        fs.mkdirSync(vaultPath);
    }
    createWindow();
});

// Update command
ipcMain.handle('run-update-command', async () => {
    return new Promise((resolve, reject) => {
        const child = spawn('winget', ['update']);
        let output = '';

        child.stdout.on('data', data => output += data.toString());
        child.stderr.on('data', data => output += data.toString());

        child.on('close', code => resolve(output || `Process exited with code ${code}`));
        child.on('error', err => reject(`Failed to run: ${err}`));
    });
});

// List folders inside vault
ipcMain.handle('list-vault-folders', async () => {
    try {
        return fs.readdirSync(vaultPath).filter(file => {
            return fs.statSync(path.join(vaultPath, file)).isDirectory();
        });
    } catch (err) {
        console.error(err);
        return [];
    }
});

// List files inside a folder
ipcMain.handle('list-folder-files', async (event, folderName) => {
    try {
        const fullPath = path.join(vaultPath, folderName);
        return fs.readdirSync(fullPath);
    } catch (err) {
        console.error(err);
        return [];
    }
});

// Add a new folder
ipcMain.handle('add-folder-to-vault', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;
    const selectedPath = result.filePaths[0];
    const folderName = path.basename(selectedPath);
    const destination = path.join(vaultPath, folderName);

    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination);
        // Optionally copy files too
        const files = fs.readdirSync(selectedPath);
        for (const file of files) {
            const src = path.join(selectedPath, file);
            const dest = path.join(destination, file);
            fs.copyFileSync(src, dest);
        }
        return folderName;
    }
    return null;
});

// Delete folder
ipcMain.handle('delete-folder', async (event, folderName) => {
    const fullPath = path.join(vaultPath, folderName);
    try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
});

// Drag & drop file into folder
ipcMain.handle('copy-file-to-folder', async (event, { filePath, folderName }) => {
    const destFolder = path.join(vaultPath, folderName);
    const fileName = path.basename(filePath);
    const destPath = path.join(destFolder, fileName);

    try {
        fs.renameSync(filePath, destPath);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
});
