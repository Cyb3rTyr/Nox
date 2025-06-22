// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const si = require('systeminformation');

const COMSPEC = process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe';
const SYSTEM_ROOT = process.env.SystemRoot || 'C:\\Windows';
const PS_EXE = path.join(
    SYSTEM_ROOT, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'
);

function getScript(relPath) {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar.unpacked', relPath)
        : path.join(__dirname, relPath);
}


let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 700,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            // Restore preload bridge
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const { shell } = require('electron');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('mailto:')) {
            // parse mailto: address and params
            const mailto = new URL(url);
            const to = mailto.pathname;
            const params = mailto.searchParams;
            const subject = params.get('subject') || '';
            const body = params.get('body') || '';

            // build Gmail web-compose URL
            let gmailUrl = [
                'https://mail.google.com/mail/u/0/',
                '?view=cm&fs=1&tf=1',
                `&to=${encodeURIComponent(to)}`,
                subject && `&su=${encodeURIComponent(subject)}`,
                body && `&body=${encodeURIComponent(body)}`
            ].filter(Boolean).join('');

            shell.openExternal(gmailUrl);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('mailto:')) {
            event.preventDefault();

            const mailto = new URL(url);
            const to = mailto.pathname;
            const params = mailto.searchParams;
            const subject = params.get('subject') || '';
            const body = params.get('body') || '';

            let gmailUrl = [
                'https://mail.google.com/mail/u/0/',
                '?view=cm&fs=1&tf=1',
                `&to=${encodeURIComponent(to)}`,
                subject && `&su=${encodeURIComponent(subject)}`,
                body && `&body=${encodeURIComponent(body)}`
            ].filter(Boolean).join('');

            shell.openExternal(gmailUrl);
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

// ── Defender Scanner IPC ──────────────────────────────────────────────────
ipcMain.handle('defender-run', async (_evt, mode, target) => {
    // Always use the real cmd.exe
    const cmd = COMSPEC;

    // Point at the unpacked defender script in production, or scripts/ in dev
    const script = getScript('scripts/defenderScanner.js');

    // Build the args: /c node <script> <mode> [<target>]
    const args = ['/c', 'node', script, mode];
    if (target) args.push(target);

    return new Promise((resolve, reject) => {
        let out = '';
        const child = spawn(cmd, args, {
            cwd: app.isPackaged ? process.resourcesPath : __dirname,
            windowsHide: true
        });
        child.stdout.on('data', d => out += d.toString());
        child.stderr.on('data', d => out += d.toString());
        child.on('close', () => resolve(out.trim()));
        child.on('error', err => reject(err));
    });
});


// ── System Cleanup IPC ───────────────────────────────────────────────────
ipcMain.handle('cleanup-run', (_evt, action) => {
    // Build common PowerShell args
    const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass'];

    // Choose the right command or script
    switch (action) {
        case 'scan':
            psArgs.push('-File', getScript('scripts/systemCleanup.ps1'), '-Scan');
            break;
        case 'cleanOldUpdates':
            psArgs.push('-Command', 'Clear-RecycleBin -Force');
            break;
        case 'cleanDownloads':
            psArgs.push('-File', getScript('scripts/systemCleanup.ps1'), '-CleanDownloads');
            break;
        case 'cleanTemp':
            psArgs.push('-File', getScript('scripts/systemCleanup.ps1'), '-CleanTemp');
            break;
        case 'cleanAll':
            psArgs.push('-File', getScript('scripts/systemCleanup.ps1'), '-CleanAll');
            break;
        default:
            throw new Error(`Unknown cleanup action: ${action}`);
    }

    // Spawn PowerShell using the guaranteed path
    return new Promise((resolve, reject) => {
        let out = '';
        const child = spawn(PS_EXE, psArgs, { windowsHide: true });
        child.stdout.on('data', chunk => out += chunk.toString());
        child.stderr.on('data', chunk => out += chunk.toString());
        child.on('close', () => resolve(out.trim()));
        child.on('error', reject);
    });
});


// ── URL Scanner IPC ───────────────────────────────────────────────────────────
ipcMain.handle('scan-url', async (_event, url) => {
    console.log('scan-url called with', url);
    return new Promise((resolve, reject) => {
        const scriptPath = getScript('scripts/urlScanner.js');
        const child = spawn(COMSPEC, ['/c', 'node', scriptPath, url], {
            cwd: app.isPackaged ? process.resourcesPath : __dirname,
            windowsHide: true
        });
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
ipcMain.handle('check-updates', async () => {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
        const child = spawn('winget', ['update'], {
            shell: true,
            windowsHide: true
        });

        let output = '';
        child.stdout.on('data', data => output += data.toString());
        child.stderr.on('data', data => output += data.toString());

        child.on('close', code => {
            if (code === 0) resolve(output.trim());
            else reject(new Error(output.trim()));
        });
    });
});


// handle “upgrade everything”
// ── UPGRADE ALL (winget logic) ──────────────────────────────────
ipcMain.handle('upgrade-all', async () => {
    const { spawn } = require('child_process');

    const runCommand = (command, args) => {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                shell: true,
                windowsHide: true
            });

            let output = '';
            child.stdout.on('data', data => output += data.toString());
            child.stderr.on('data', data => output += data.toString());

            child.on('close', code => {
                if (code === 0) resolve(output.trim());
                else reject(new Error(output.trim()));
            });

            child.on('error', err => reject(err));
        });
    };

    try {
        const updateOut = await runCommand('winget', ['update']);
        console.log('🟡 Winget UPDATE output:\n', updateOut);

        await new Promise(resolve => setTimeout(resolve, 15000));

        const upgradeOut = await runCommand('winget', ['upgrade', '--all', '-u']);
        console.log('🟢 Winget UPGRADE output:\n', upgradeOut);

        return {
            success: true,
            message: `📦 Winget Update Output:\n\n${updateOut}\n\n⬆ Winget Upgrade Output:\n\n${upgradeOut}`
        };

    } catch (err) {
        console.error('❌ upgrade-all error:', err.message);
        return {
            success: false,
            message: `❌ Error:\n\n${err.message}`
        };
    }
});