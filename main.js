// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');
const si = require('systeminformation');
const fs = require('fs');
const { promisify } = require('util');
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);


let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        minWidth: 1100,
        minHeight: 700,
        webPreferences: {
            // Restore preload bridge
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.maximize();
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);


ipcMain.handle('get-system-stats', async () => {
    // gather everything in parallel
    const [load, mem, osInfo, time, disks] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.osInfo(),
        si.time(),
        si.fsSize()
    ]);
    return {
        cpu: load,
        ram: mem,
        os: osInfo,
        uptime: time,
        disks
    };
});


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

// handle “what updates are available?”
ipcMain.handle('get-updates', async () => {
    // TODO: replace this with your real update-check logic
    // return an array of { name, version } for each available update
    return [
        // example:
        // { name: 'Nox Core', version: '1.2.3' },
        // { name: 'Security Definitions', version: '2025.06.14' }
    ];
});

// handle “upgrade everything”
ipcMain.handle('upgrade-all', async () => {
    // TODO: run your upgrade logic, return a message or error
    try {
        // await doUpgrade();
        return { success: true, message: 'All updates installed successfully.' };
    } catch (e) {
        return { success: false, message: 'Upgrade failed: ' + e.message };
    }
});




ipcMain.handle('get-scan-estimate', async (_evt, mode, folderPath) => {
    console.log('💡 get-scan-estimate called:', mode, folderPath);
    const SCAN_SPEED_MBPS = 80;
    const SAFETY_FACTOR = 1.2;

    async function getFolderSize(dir) {
        let total = 0;
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                try {
                    if (entry.isDirectory()) {
                        total += await getFolderSize(fullPath);
                    } else if (entry.isFile()) {
                        const { size } = await stat(fullPath);
                        total += size;
                    }
                } catch { }
            }
        } catch { }
        return total;
    }

    if (mode === 'quick') {
        const quickPaths = [
            'C:\\Windows',
            'C:\\Program Files',
            'C:\\Program Files (x86)',
            'C:\\Users'
        ];
        let totalBytes = 0;
        for (const p of quickPaths) {
            totalBytes += await getFolderSize(p);
        }
        const secs = (totalBytes / (1024 * 1024) / SCAN_SPEED_MBPS) * SAFETY_FACTOR;
        return Math.round(secs);
    }

    if (mode === 'full') {
        const disks = await si.fsSize();
        const used = disks.reduce((acc, d) => acc + d.used, 0);
        const secs = (used / (1024 * 1024) / SCAN_SPEED_MBPS) * SAFETY_FACTOR;
        return Math.round(secs);
    }

    if (mode === 'folder' && folderPath) {
        const size = await getFolderSize(folderPath);
        const secs = (size / (1024 * 1024) / SCAN_SPEED_MBPS) * SAFETY_FACTOR;
        return Math.round(secs);
    }

    return 30; // fallback
});


// ── Ensure all scans stop when quitting ─────────────────────────────────
app.on('before-quit', () => {
    for (const child of runningScans) {
        // SIGTERM on Unix, TerminateProcess on Windows
        child.kill();
    }
});