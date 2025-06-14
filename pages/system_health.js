// File: pages/system_health.js

const { exec } = require('child_process');
const si = require('systeminformation');
const { getDiskInfo } = require('node-disk-info');

/**
 * Initialize the System Health page. Call this when the page is shown.
 */
async function init() {
    await loadSystemHealth();
}

/**
 * Main function to gather and display all health info.
 */
async function loadSystemHealth() {
    await Promise.all([
        loadSystemInfo(),
        loadDiskInfo(),
        loadWingetUpdates()
    ]);
}

async function loadSystemInfo() {
    try {
        const cpu = await si.cpu();
        const mem = await si.mem();
        const osInfo = await si.osInfo();
        const time = await si.time();
        const tempData = await si.cpuTemperature();
        const loadData = await si.currentLoad();

        const cpuUsagePct = loadData.currentLoad.toFixed(1);
        const ramUsed = (mem.used / 1e9).toFixed(1);
        const ramTotal = (mem.total / 1e9).toFixed(1);
        const ramPct = ((mem.used / mem.total) * 100).toFixed(1);
        const cpuTemp = (tempData.main || 0).toFixed(1);
        const uptimeHrs = (time.uptime / 3600).toFixed(1);

        // CPU status color-coded by usage
        let cpuStatus, cpuColor;
        if (cpuUsagePct < 50) { cpuStatus = 'Good'; cpuColor = 'green'; }
        else if (cpuUsagePct < 75) { cpuStatus = 'Moderate'; cpuColor = 'orange'; }
        else { cpuStatus = 'High'; cpuColor = 'red'; }

        // RAM status color-coded by usage
        let ramStatus, ramColor;
        if (ramPct < 50) { ramStatus = 'Good'; ramColor = 'green'; }
        else if (ramPct < 75) { ramStatus = 'Moderate'; ramColor = 'orange'; }
        else { ramStatus = 'High'; ramColor = 'red'; }

        // Warning for heavy load
        const warnEl = document.getElementById('healthWarning');

        document.getElementById('cpuInfo').innerHTML =
            `${cpu.manufacturer} ${cpu.brand} — ${cpuUsagePct}% ` +
            `<span style="color:${cpuColor};font-weight:bold">(${cpuStatus})</span>`;

        document.getElementById('ramInfo').innerHTML =
            `${ramUsed} GB / ${ramTotal} GB — ${ramPct}% ` +
            `<span style="color:${ramColor};font-weight:bold">(${ramStatus})</span>`;

        document.getElementById('osInfo').innerText = `${osInfo.distro} (${osInfo.arch})`;
        document.getElementById('uptimeInfo').innerText = `${uptimeHrs} hrs`;

        if (warnEl) {
            warnEl.innerText = (cpuUsagePct > 85 || ramPct > 90 || cpuTemp > 80)
                ? '⚠️ For accurate results, close heavy apps before checking.'
                : '';
        }
    } catch (err) {
        console.error('System Info error:', err);
    }
}

async function loadDiskInfo() {
    try {
        const disks = await getDiskInfo();
        const container = document.getElementById('diskInfo');
        container.innerHTML = '';

        disks.forEach(disk => {
            const totalGB = (parseInt(disk.blocks, 10) / 1e9).toFixed(1);
            const availGB = (parseInt(disk.available, 10) / 1e9).toFixed(1);
            const usedPct = parseInt(disk.capacity, 10);

            let status;
            if (usedPct > 90) { status = '🔴 Nearly full'; }
            else { status = '🟢 OK'; }

            container.insertAdjacentHTML('beforeend', `
        <div class="disk-card">
          <strong>${disk.mounted}</strong>: ${availGB} GB free of ${totalGB} GB (${usedPct}% full) ${status}
          <div class="progress"><div class="bar" style="width: ${usedPct}%;"></div></div>
        </div>
      `);
        });
    } catch (err) {
        console.error('Disk info error:', err);
    }
}

async function loadWingetUpdates() {
    const container = document.getElementById('updateList');
    container.innerHTML = 'Checking for updates…';

    exec('winget upgrade', (err, stdout, stderr) => {
        if (err && !stdout) {
            container.innerHTML = 'Failed to load updates.';
            return;
        }

        const out = (stdout || stderr).toString();

        if (
            /no applicable update found/i.test(out) ||
            /no installed package found matching input criteria/i.test(out) ||
            /0 upgraded packages/i.test(out)
        ) {
            container.innerHTML =
                '<p><strong>0</strong> updates available: All up to date!</p>';
            return;
        }

        const lines = out
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l && !/^(Name|Id|Version|Available|Source)/i.test(l))
            .filter(l => /^\S+\s+\S+\s+\S+/.test(l));

        const count = lines.length;

        container.innerHTML = `<p><strong>${count}</strong> updates available:</p>` +
            (count
                ? `<ul>${lines.map(u => `<li>${u}</li>`).join('')}</ul>`
                : '<p>All up to date!</p>');
    });
}

function upgradeAllPackages() {
    const resultBox = document.getElementById('updateResult');
    resultBox.innerText = 'Upgrading all packages…';
    exec('winget upgrade --all -u', (err, _stdout, stderr) => {
        resultBox.innerText = err ? `Error: ${stderr}` : 'Upgrade completed!';
    });
}

// expose to HTML
window.upgradeAllPackages = upgradeAllPackages;

// Export init for nav handler
export { init as systemHealthInit };
