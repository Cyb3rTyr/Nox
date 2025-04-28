// scripts/defenderScanner.js
const { spawn } = require('child_process');

function runCommand(psCommand) {
    return new Promise((resolve, reject) => {
        const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand];
        const p = spawn('powershell.exe', args, { shell: true });
        let out = '';
        p.stdout.on('data', d => out += d.toString());
        p.stderr.on('data', d => out += d.toString());
        p.on('close', () => resolve(out.trim() || `Exited`));
        p.on('error', reject);
    });
}

(async () => {
    const [, , mode, target] = process.argv;

    // Ensure real-time ON before scans
    await runCommand('Set-MpPreference -DisableRealtimeMonitoring $false').catch(() => { });

    let res = '';
    switch (mode) {
        case 'update': res = await runCommand('Update-MpSignature'); break;
        case 'quick': res = await runCommand('Start-MpScan -ScanType QuickScan'); break;
        case 'full': res = await runCommand('Start-MpScan -ScanType FullScan'); break;
        case 'folder':
            if (!target) return console.error('❗ Specify folder path');
            const safe = target.replace(/'/g, "''");
            res = await runCommand(`Start-MpScan -ScanPath '${safe}' -ScanType CustomScan`);
            break;
        case 'realtime-off':
            res = await runCommand('Set-MpPreference -DisableRealtimeMonitoring $true');
            break;
        case 'realtime-on':
            res = await runCommand('Set-MpPreference -DisableRealtimeMonitoring $false');
            break;
        default:
            return console.log(`
Usage: node defenderScanner.js <update|quick|full|folder|realtime-on|realtime-off> [path]
`);
    }
    console.log(res);
})();
