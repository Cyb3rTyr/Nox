const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const vaultPath = path.join(__dirname, 'vault'); // Vault folder path

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400, // Default width
        height: 600, // Default height
        minWidth: 1400, // Minimum width
        minHeight: 600, // Minimum height
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // Enable Node.js integration
            contextIsolation: false, // Disable context isolation for compatibility
        },
    });



    // Maximize the window
    mainWindow.maximize();

    // Load your index.html file
    mainWindow.loadFile('index.html');

    // Optional: Remove the default menu bar
    mainWindow.setMenuBarVisibility(false);
}

// App initialization
app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Winget update command
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

// List files inside a specific vault folder
ipcMain.handle('list-folder-files', async (event, folderName) => {
    try {
        const fullPath = path.join(vaultPath, folderName);
        return fs.readdirSync(fullPath);
    } catch (err) {
        console.error(err);
        return [];
    }
});

// Import and MOVE a whole folder into vault and OPEN the vault folder
ipcMain.handle('import-folder-to-vault', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;

    const selectedPath = result.filePaths[0];
    const folderName = path.basename(selectedPath);
    const destination = path.join(vaultPath, folderName);

    if (!fs.existsSync(destination)) {
        try {
            fs.renameSync(selectedPath, destination); // MOVE instead of copy
            await shell.openPath(vaultPath); // Open the Vault folder after import
            return folderName;
        } catch (err) {
            console.error(err);
            return null;
        }
    }
    return null;
});

// Delete a folder inside vault
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
