const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

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

// Listen for the update command from renderer
ipcMain.handle('run-update-command', async () => {
    return new Promise((resolve, reject) => {
        const child = spawn('winget', ['update']);
        let output = '';

        child.stdout.on('data', data => {
            output += data.toString();
        });

        child.stderr.on('data', data => {
            output += data.toString();
        });

        child.on('close', code => {
            resolve(output || `Process exited with code ${code}`);
        });

        child.on('error', err => {
            reject(`Failed to run: ${err}`);
        });
    });
});

app.whenReady().then(createWindow);
