// File: pages/system_health.js

/**
 * Initialize the System Health page. Call this when the page is shown.
 */
async function init() {
    await loadSystemHealth();
}

/**
 * Gathers and displays health info using preload-exposed APIs.
 */
async function loadSystemHealth() {
    try {
        // System info
        const cpuData = await window.sysInfo.cpu();
        const mem = await window.sysInfo.mem();
        const osInfo = await window.sysInfo.osInfo();
        const time = await window.sysInfo.time();
        const loadData = await window.sysInfo.currentLoad();

        // CPU
        const cpuUsagePct = loadData.currentLoad.toFixed(1);
        let cpuStatus = 'Good', cpuColor = 'green';
        if (cpuUsagePct >= 75) { cpuStatus = 'High'; cpuColor = 'red'; }
        else if (cpuUsagePct >= 50) { cpuStatus = 'Moderate'; cpuColor = 'orange'; }
        document.getElementById('cpuInfo').innerHTML =
            `${cpuData.manufacturer} ${cpuData.brand} — ${cpuUsagePct}% ` +
            `<span style="color:${cpuColor};font-weight:bold">(${cpuStatus})</span>`;

        // RAM
        const ramUsedGB = (mem.used / 1e9).toFixed(1);
        const ramTotalGB = (mem.total / 1e9).toFixed(1);
        const ramPct = ((mem.used / mem.total) * 100).toFixed(1);
        let ramStatus = 'Good', ramColor = 'green';
        if (ramPct >= 75) { ramStatus = 'High'; ramColor = 'red'; }
        else if (ramPct >= 50) { ramStatus = 'Moderate'; ramColor = 'orange'; }
        document.getElementById('ramInfo').innerHTML =
            `${ramUsedGB} GB / ${ramTotalGB} GB — ${ramPct}% ` +
            `<span style="color:${ramColor};font-weight:bold">(${ramStatus})</span>`;

        // OS and uptime
        const uptimeHrs = (time.uptime / 3600).toFixed(1);
        document.getElementById('osInfo').innerText = `${osInfo.distro} (${osInfo.arch})`;
        document.getElementById('uptimeInfo').innerText = `${uptimeHrs} hrs`;

        // Disk Info
        const disks = await window.sysInfo.diskInfo();
        const diskContainer = document.getElementById('diskInfo');
        diskContainer.innerHTML = '';
        for (const disk of disks) {
            const totalGB = (disk.blocks / 1e9).toFixed(1);
            const availGB = (disk.available / 1e9).toFixed(1);
            const usedPct = parseInt(disk.capacity, 10);
            const status = usedPct >= 90 ? '🔴 Nearly full' : '🟢 OK';
            diskContainer.insertAdjacentHTML('beforeend', `
        <div class="disk-card">
          <strong>${disk.mounted}</strong>: ${availGB} GB free of ${totalGB} GB (${usedPct}% full) ${status}
          <div class="progress"><div class="bar" style="width: ${usedPct}%;"></div></div>
        </div>
      `);
        }

        // Winget updates
        const updateContainer = document.getElementById('updateList');
        try {
            const out = await window.winget.listUpgrades();
            const lines = out.split(/\r?\n/).map(l => l.trim()).filter(l => l && !/^Name/i.test(l));
            const count = lines.length;
            updateContainer.innerHTML = `<p><strong>${count}</strong> updates available:</p>` +
                (count ? `<ul>${lines.map(u => `<li>${u}</li>`).join('')}</ul>` : '<p>All up to date!</p>');
        } catch {
            updateContainer.innerHTML = '<p>Failed to load updates.</p>';
        }
    } catch (err) {
        console.error('Error loading system health:', err);
    }
}

/**
 * Upgrade all packages via winget
 */
async function upgradeAllPackages() {
    const resultBox = document.getElementById('updateResult');
    resultBox.innerText = 'Upgrading all packages…';
    try {
        await window.winget.upgradeAll();
        resultBox.innerText = 'Upgrade completed!';
    } catch (err) {
        resultBox.innerText = `Error: ${err}`;
    }
}

// Expose functions for HTML and nav
window.systemHealthInit = init;
window.upgradeAllPackages = upgradeAllPackages;
