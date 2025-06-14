// pages/system_health.js

window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('system-health');
    if (!container) return;

    const cpuEl = document.getElementById('cpuInfo');
    const ramEl = document.getElementById('ramInfo');
    const osEl = document.getElementById('osInfo');
    const upEl = document.getElementById('uptimeInfo');
    const diskEl = document.getElementById('diskInfo');
    const warnEl = document.getElementById('healthWarning');

    async function refresh() {
        try {
            const { cpu, ram, os, uptime, disks } = await window.sysInfo.getStats();

            // —— CPU ——
            const cpuPct = cpu.currentLoad.toFixed(1);
            const cpuColor = cpuPct < 50 ? 'green' : cpuPct < 75 ? 'orange' : 'red';
            cpuEl.innerHTML =
                `${cpuPct}% <span style="color:${cpuColor}">(${cpuPct < 50 ? 'Good' : cpuPct < 75 ? 'Moderate' : 'High'})</span>`;
            warnEl.innerText = cpuPct > 85 ? '⚠️ CPU load critical!' : '';

            // —— RAM ——
            const usedGB = (ram.used / 1e9).toFixed(1);
            const totalGB = (ram.total / 1e9).toFixed(1);
            const ramPct = ((ram.used / ram.total) * 100).toFixed(1);
            const ramColor = ramPct < 50 ? 'green' : ramPct < 75 ? 'orange' : 'red';
            ramEl.innerHTML =
                `${usedGB} GB / ${totalGB} GB — ` +
                `<span style="color:${ramColor}">${ramPct}%</span>`;

            // —— OS & Uptime ——
            osEl.innerText = `${os.distro} (${os.arch})`;
            upEl.innerText = `${(uptime.uptime / 3600).toFixed(1)} hrs`;

            // —— Disk Space ——
            diskEl.innerHTML = disks.map(d => {
                const usedPct = ((d.used / d.size) * 100).toFixed(1);
                const usedGB = (d.used / 1e9).toFixed(1);
                const sizeGB = (d.size / 1e9).toFixed(1);
                const diskColor = usedPct < 75 ? 'green' : usedPct < 90 ? 'orange' : 'red';
                return `<p>
          ${d.fs} @ ${d.mount}: 
          <span style="color:${diskColor}">${usedPct}% used</span> 
          (${usedGB}/${sizeGB} GB)
        </p>`;
            }).join('');

        } catch (e) {
            console.error('System Health fetch error', e);
            cpuEl.innerText = ramEl.innerText = osEl.innerText = upEl.innerText = diskEl.innerText = 'N/A';
            warnEl.innerText = '';
        }
    }

    // initial fetch + refresh every 5s
    refresh();
    setInterval(refresh, 5000);
});
