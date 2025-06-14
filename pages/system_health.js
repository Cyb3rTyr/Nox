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
        const load = await si.currentLoad();

        const cpuUsage = load.currentload.toFixed(1);
        const ramUsed = (mem.used / 1e9).toFixed(1);
        const ramTotal = (mem.total / 1e9).toFixed(1);
        const ramPct = ((mem.used / mem.total) * 100).toFixed(1);
        const cpuTemp = (tempData.main || 0).toFixed(1);
        const uptimeHrs = (time.uptime / 3600).toFixed(1);

        const cpuStatus = cpuUsage > 85 ? '🔴 High load' : '🟢 OK';
        const ramStatus = ramPct > 90 ? '🔴 High usage' : '🟢 OK';
        const tempStatus = cpuTemp > 80 ? '🔴 High temp' : '🟢 OK';

        document.getElementById('cpuInfo').innerText =
            `${cpu.manufacturer} ${cpu.brand} — ${cpuUsage}% (${cpuStatus})`;
        document.getElementById('ramInfo').innerText =
            `${ramUsed} GB / ${ramTotal} GB (${ramPct}%) (${ramStatus})`;
        document.getElementById('osInfo').innerText =
            `${osInfo.distro} ${osInfo.arch}`;
        document.getElementById('uptimeInfo').innerText =
            `${uptimeHrs} hrs — Temp: ${cpuTemp}°C (${tempStatus})`;

        // Warning for heavy load
        const warnEl = document.getElementById('healthWarning');
        if (warnEl) {
            warnEl.innerText = (+cpuUsage > 85 || +ramPct > 90 || +cpuTemp > 80)
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
            const status = usedPct > 90 ? '🔴 Nearly full' : '🟢 OK';

            container.insertAdjacentHTML('beforeend', `
        <div class="disk-card">
          <strong>${disk.mounted}</strong>: ${availGB} GB free of ${totalGB} GB (${usedPct}% full) (${status})
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
        // If the call totally failed
        if (err && !stdout) {
            container.innerHTML = 'Failed to load updates.';
            return;
        }

        // 1) Check for the “no applicable update” message
        if (/no applicable update found/i.test(stdout)) {
            container.innerHTML = '<p><strong>0</strong> updates available: All up to date!</p>';
            return;
        }

        // 2) Otherwise parse out only the real lines of package data:
        //    skip the header, trim, and drop any empty lines
        const lines = stdout
            .split('\n')
            // remove the header row (which usually starts with “Name” or “Id”)
            .filter(l => !/^(Name|Id)\s+/i.test(l))
            .map(l => l.trim())
            .filter(l => l);

        const count = lines.length;
        container.innerHTML = `<p><strong>${count}</strong> updates available:</p>`
            + (count
                ? `<ul>${lines.map(u => `<li>${u}</li>`).join('')}</ul>`
                : '<p>All up to date!</p>'
            );
    });
}


function upgradeAllPackages() {
    const resultBox = document.getElementById('updateResult');
    resultBox.innerText = 'Upgrading all packages…';

    exec('winget upgrade --all -u', (err, stdout, stderr) => {
        resultBox.innerText = err ? `Error: ${stderr}` : 'Upgrade completed!';
    });
}

// Expose init for nav handler
export { init as systemHealthInit };
const btn = document.getElementById('upgradeAllBtn');
if (btn) {
    btn.addEventListener('click', () => {
        console.log('Upgrade All clicked');
        upgradeAllPackages();
    });
}