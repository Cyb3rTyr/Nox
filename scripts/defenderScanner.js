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

    // Always re-enable real-time protection before scan
    await runCommand('Set-MpPreference -DisableRealtimeMonitoring $false').catch(() => { });

    let res = '';
    switch (mode) {

        case 'quick':
            await runCommand('Start-MpScan -ScanType QuickScan');
            res = await runCommand('Get-MpThreatDetection | Select-Object ThreatName, Severity, ActionSuccess | ConvertTo-Json -Depth 3');

            break;

        case 'full':
            await runCommand('Start-MpScan -ScanType FullScan');
            res = await runCommand('Get-MpThreatDetection | Select-Object ThreatName, Severity, ActionSuccess | ConvertTo-Json -Depth 3');

            break;

        case 'folder':
            if (!target) return console.error('❗ Specify folder path');
            const safe = target.replace(/'/g, "''");
            await runCommand(`Start-MpScan -ScanPath '${safe}' -ScanType CustomScan`);
            await new Promise(r => setTimeout(r, 1500)); // give time for Defender to log threat
            res = await runCommand('Get-MpThreatDetection | Sort-Object InitialDetectionTime -Descending | Select-Object -First 5 | ConvertTo-Json -Depth 3');
            break;

        default:
            return console.log(`
Usage: node defenderScanner.js <update|quick|full|folder|realtime-on|realtime-off> [path]
`);
    }

    console.log(res);
})();
