// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');

let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        minWidth: 1100,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: true,    // allow require(...) in renderer
            contextIsolation: false,  // must be false whenever nodeIntegration is true
        }
    });
    mainWindow.maximize();
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── Defender Scanner IPC ─────────────────────────────────────────────────────
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
ipcMain.handle('cleanup-run', (event, action) => {
    let scriptPath, psArgs;

    switch (action) {
        case 'scan':
            scriptPath = path.join(__dirname, 'scripts', 'systemCleanup.ps1');
            psArgs = [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', scriptPath,
                '-Scan',
                '-ExportCsv'
            ];
            break;
        case 'emptyRecycleBin':
            scriptPath = path.join(__dirname, 'scripts', 'EmptyBin.ps1');
            psArgs = [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', scriptPath
            ];
            break;
        case 'cleanDownloads':
            scriptPath = path.join(__dirname, 'scripts', 'test.ps1');
            psArgs = [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', scriptPath,
                '-CleanDownloads'
            ];
            break;
        case 'cleanTemp':
            scriptPath = path.join(__dirname, 'scripts', 'test.ps1');
            psArgs = [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', scriptPath,
                '-CleanTemp'
            ];
            break;
        case 'cleanAll':
            scriptPath = path.join(__dirname, 'scripts', 'test.ps1');
            psArgs = [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', scriptPath,
                '-CleanAll'
            ];
            break;
        default:
            throw new Error(`Unknown cleanup action: ${action}`);
    }

    return new Promise((resolve, reject) => {
        const child = spawn('powershell.exe', psArgs, {
            cwd: __dirname,
            shell: true
        });
        let out = '';

        child.stdout.on('data', chunk => {
            const text = chunk.toString();
            // split on newlines so we can handle both PROGRESS and output
            text.split(/\r?\n/).forEach(line => {
                if (line.startsWith('PROGRESS:')) {
                    // send progress (0–100) back to renderer
                    const pct = parseInt(line.slice('PROGRESS:'.length), 10);
                    event.sender.send('cleanup-progress', pct);
                } else if (line.trim() !== '') {
                    // accumulate any non-progress text
                    out += line + '\n';
                }
            });
        });

        child.stderr.on('data', chunk => {
            const errText = chunk.toString();
            event.sender.send('cleanup-error', errText);
            out += errText;
        });

        child.on('close', code => {
            event.sender.send('cleanup-done', code);
            resolve(out);
        });

        child.on('error', err => reject(err));
    });
});

// ── URL Scanner IPC ───────────────────────────────────────────────────────────
ipcMain.handle('scan-url', async (_event, url) => {
    console.log('scan-url called with', url);
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'scripts', 'urlScanner.js');
        const child = spawn('node', [scriptPath, url], { cwd: __dirname, shell: true });
        let out = '';
        let err = '';

        child.stdout.on('data', chunk => out += chunk.toString());
        child.stderr.on('data', chunk => err += chunk.toString());

        child.on('close', code => {
            console.log('urlScanner.js exited with code', code);
            if (code === 0) {
                resolve(out.trim());
            } else {
                reject(err || `Script exited with code ${code}`);
            }
        });

        child.on('error', err => {
            console.error('Failed to start urlScanner.js:', err);
            reject(err);
        });
    });
});
