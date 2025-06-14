// pages/system_health.js
window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('system-health');
    if (!container) return;

    // stats elements
    const cpuEl = document.getElementById('cpuInfo');
    const ramEl = document.getElementById('ramInfo');
    const osEl = document.getElementById('osInfo');
    const upEl = document.getElementById('uptimeInfo');
    const diskEl = document.getElementById('diskInfo');
    const warnEl = document.getElementById('healthWarning');

    // update UI elements
    const upgradeBtn = document.getElementById('upgradeAllBtn');
    const updateListEl = document.getElementById('updateList');
    const updateResult = document.getElementById('updateResult');

    async function refreshStats() {
        try {
            const { cpu, ram, os, uptime, disks } = await window.sysInfo.getStats();
            // CPU
            const cpuPct = cpu.currentLoad.toFixed(1);
            const cpuColor = cpuPct < 50 ? 'green' : cpuPct < 75 ? 'orange' : 'red';
            cpuEl.innerHTML =
                `${cpuPct}% <span style="color:${cpuColor}">(${cpuPct < 50 ? 'Good' : cpuPct < 75 ? 'Moderate' : 'High'})</span>`;
            warnEl.innerText = cpuPct > 85 ? '⚠️ CPU load critical!' : '';

            // RAM
            const usedGB = (ram.used / 1e9).toFixed(1);
            const totalGB = (ram.total / 1e9).toFixed(1);
            const ramPct = ((ram.used / ram.total) * 100).toFixed(1);
            const ramColor = ramPct < 50 ? 'green' : ramPct < 75 ? 'orange' : 'red';
            ramEl.innerHTML =
                `${usedGB} GB / ${totalGB} GB — <span style="color:${ramColor}">${ramPct}%</span>`;

            // OS & Uptime
            osEl.innerText = `${os.distro} (${os.arch})`;
            upEl.innerText = `${(uptime.uptime / 3600).toFixed(1)} hrs`;

            // Disks
            diskEl.innerHTML = disks.map(d => {
                const usedPct = ((d.used / d.size) * 100).toFixed(1);
                const usedGB = (d.used / 1e9).toFixed(1);
                const sizeGB = (d.size / 1e9).toFixed(1);
                const color = usedPct < 75 ? 'green' : usedPct < 90 ? 'orange' : 'red';
                return `<p>
          ${d.fs} @ ${d.mount}: 
          <span style="color:${color}">${usedPct}% used</span> 
          (${usedGB}/${sizeGB} GB)
        </p>`;
            }).join('');
        } catch (e) {
            console.error('Stats fetch error', e);
            [cpuEl, ramEl, osEl, upEl, diskEl].forEach(el => el.innerText = 'N/A');
            warnEl.innerText = '';
        }
    }

    async function refreshUpdates() {
        try {
            const list = await window.updateAPI.getUpdates();
            if (list.length > 0) {
                updateListEl.innerHTML = list
                    .map(u => `<p>${u.name} — <em>${u.version}</em></p>`)
                    .join('');
            } else {
                updateListEl.innerText = '✅ No updates available';
            }
        } catch (e) {
            console.error('Updates fetch error', e);
            updateListEl.innerText = '❌ Could not fetch updates';
        }
    }

    // hook “Upgrade All” button
    upgradeBtn.addEventListener('click', async () => {
        updateResult.innerText = 'Upgrading…';
        const res = await window.updateAPI.upgradeAll();
        updateResult.innerText = res.message;
        // re-run list after upgrade
        refreshUpdates();
    });

    // initial load + intervals
    refreshStats();
    refreshUpdates();
    setInterval(refreshStats, 5000);
    setInterval(refreshUpdates, 60000); // check updates every minute
});