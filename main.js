// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
function createWindow() {
    // 1) Create the BrowserWindow
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // 2) THEN maximize it
    mainWindow.maximize();

    // 3) And only now load your HTML
    mainWindow.loadFile('index.html');
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

// ── System Cleanup IPC ───────────────────────────────────────────────────────
ipcMain.handle('cleanup-run', (_evt, action) => {
    // Update the path to the new location in the scripts folder
    const psScript = path.join(__dirname, 'scripts', 'systemCleanup.ps1');
    const child = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', psScript,
        '-Scan',
        '-ExportCsv'
    ], { cwd: __dirname, shell: true });

    // forward progress lines as IPC events
    child.stdout.on('data', chunk => {
        const lines = chunk.toString().split(/\r?\n/);
        for (const line of lines) {
            if (line.startsWith('PROGRESS:')) {
                const pct = parseInt(line.split(':')[1], 10);
                mainWindow.webContents.send('cleanup-progress', pct);
            }
        }
    });

    return new Promise((resolve, reject) => {
        let out = '';
        child.stdout.on('data', chunk => {
            const text = chunk.toString();
            if (!text.startsWith('PROGRESS:')) out += text;
        });
        child.stderr.on('data', chunk => out += chunk.toString());
        child.on('close', () => resolve(out));
        child.on('error', err => reject(err));
    });
});