// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 800, height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    win.maximizable = true;
    win.loadFile('index.html');
    win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// Single handler for defender-run
ipcMain.handle('defender-run', async (_evt, mode, target) => {
    const scriptPath = path.join(__dirname, 'scripts', 'defenderScanner.js');
    const args = [scriptPath, mode];
    if (target) args.push(target);

    return new Promise((resolve, reject) => {
        const child = spawn('node', args, { cwd: __dirname, shell: true });
        let out = '';
        child.stdout.on('data', d => out += d.toString());
        child.stderr.on('data', d => out += d.toString());
        child.on('close', () => resolve(out));
        child.on('error', err => reject(err));
    });
});
