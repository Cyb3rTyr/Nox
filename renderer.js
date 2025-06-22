// renderer.js, top of file

Chart.defaults.font.family = 'Rubik';   // global font

Chart.register({
    id: 'doughnutCenterText',
    afterDatasetDraw(chart) {
        if (chart.config.type !== 'doughnut') return;

        const {
            ctx,
            data: { datasets },
            chartArea: { top, left, width, height }
        } = chart;

        const [value, rest] = datasets[0].data;
        const total = value + rest;
        const percentText = total ? Math.round((value / total) * 100) + '%' : '';

        // pull the primary slice’s color
        const mainColor = Array.isArray(datasets[0].backgroundColor)
            ? datasets[0].backgroundColor[0]
            : datasets[0].backgroundColor;

        ctx.save();
        ctx.font = '700 2rem Rubik';         // bold 2rem Rubik
        ctx.fillStyle = mainColor;           // match slice color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = left + width / 2;
        const y = top + height / 2;
        ctx.fillText(percentText, x, y);
        ctx.restore();
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');

    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
});


// Navigation & page switching
// renderer.js

document.addEventListener('DOMContentLoaded', () => {
    const quickBtn = document.getElementById('md-quick');
    const fullBtn = document.getElementById('md-full');
    const folderBtn = document.getElementById('md-folder-btn');
    const folderInput = document.getElementById('md-folder-input');
    const output = document.getElementById('md-output');
    const loader = document.getElementById('md-loader');
    const status = document.getElementById('md-status');
    const saveBtn = document.getElementById('md-save');

    const updateStatus = (msg) => {
        const time = new Date().toLocaleTimeString();
        status.textContent = `[${time}] ${msg}`;
    };

    const runScan = async (mode, target = null) => {
        const loader = document.getElementById('md-loader');
        const output = document.getElementById('md-output');
        const status = document.getElementById('md-status');
        const emptyState = document.getElementById('md-empty');
        if (emptyState) emptyState.style.display = 'none';

        loader.classList.remove('hidden');
        loader.textContent = '';
        output.textContent = '';
        const time = new Date().toLocaleTimeString();
        status.textContent = `[${time}] Running ${mode} scan...`;

        try {
            const result = await window.defenderAPI.run(mode, target);
            loader.classList.add('hidden');
            loader.textContent = '✅';
            status.textContent = `[${new Date().toLocaleTimeString()}] ${mode} scan complete.`;

            let threats;
            try {
                threats = JSON.parse(result);
            } catch {
                output.innerHTML = `<div class="no-threats">✅ Scan complete, no threat data available.</div>`;
                return;
            }

            if (Array.isArray(threats) && threats.length > 0) {
                output.innerHTML = threats.map(t => `
                <div class="threat-box">
                    <strong>${t.ThreatName}</strong><br>
                    Severity: <span class="sev">${t.Severity}</span><br>
                    Action Success: ${t.ActionSuccess ? '✅' : '❌'}
                </div>
            `).join('');
            } else {
                output.innerHTML = `<div class="no-threats">✅ No active threats detected.</div>`;
            }

        } catch (err) {
            loader.classList.add('hidden');
            loader.textContent = '❌';
            output.innerHTML = `<span style="color:tomato;">❌ Scan failed:</span>\n${err.message}`;
            status.textContent = `[${new Date().toLocaleTimeString()}] Scan failed.`;
        }
    };



    quickBtn?.addEventListener('click', () => runScan('quick'));
    fullBtn?.addEventListener('click', () => runScan('full'));
    folderBtn?.addEventListener('click', () => folderInput?.click());
    folderInput?.addEventListener('change', () => {
        const files = folderInput.files;
        if (files.length > 0) {
            const folderPath = files[0].path;
            runScan('folder', folderPath);
        }
    });

    saveBtn?.addEventListener('click', () => {
        const blob = new Blob([output.textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `defender-scan-${Date.now()}.txt`;
        a.click();
    });
});


// draw charts on first load
document.addEventListener('DOMContentLoaded', initHomeDashboard);


// Prevent double-init
let chartsInitialized = false;
// disable borders on all doughnut/pie arcs
Chart.defaults.elements.arc.borderWidth = 0;


function initHomeDashboard() {
    if (chartsInitialized) return;
    chartsInitialized = true;

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // 1) Threats Blocked (line)
    new Chart(document.getElementById('threatsChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Threats',
                data: [5, 3, 8, 12, 11, 17, 22],  // ← fake data
                borderColor: '#00A9BB',
                backgroundColor: 'rgba(0,169,189,0.18)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#00A9BB'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#c5e2df' }, grid: { color: '#222' } },
                x: { ticks: { color: '#c5e2df' }, grid: { color: '#222' } }
            }
        }
    });

    // 2) Files Encrypted (line)
    new Chart(document.getElementById('filesChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Encrypted',
                data: [0, 1, 1, 2, 3, 5, 7],   // ← fake data
                borderColor: '#40a68d',
                backgroundColor: 'rgba(41,101,89,0.18)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#40a68d'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#c5e2df' }, grid: { color: '#222' } },
                x: { ticks: { color: '#c5e2df' }, grid: { color: '#222' } }
            }
        }
    });

    // ─── replace your existing System Health chart with this ───
    // calculate your health percentage (swap in your real data)
    const healthValue = 87;  // e.g. 85%

    // pick color based on thresholds
    let healthColor;
    if (healthValue > 75) {
        healthColor = '#6EEB83';           // green
    } else if (healthValue >= 50) {
        healthColor = '#F5A623';           // yellow
    } else {
        healthColor = '#FF4C4C';           // red
    }

    new Chart(document.getElementById('healthChart'), {
        type: 'doughnut',
        data: {
            labels: ['Healthy', 'Remaining'],
            datasets: [{
                data: [healthValue, 100 - healthValue],
                backgroundColor: [healthColor, '#222'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false }
            }
        }
    });


    // 4) Updates Installed (bar)
    new Chart(document.getElementById('updatesChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Updates',
                data: [2, 4, 6, 5, 9, 7, 10],  // ← fake data
                backgroundColor: 'rgba(0, 169, 187,0.3)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#c5e2df' }, grid: { color: '#222' } },
                x: { ticks: { color: '#c5e2df' }, grid: { color: '#222' } }
            }
        }
    });

    // ─── Privacy Trackers Removed with dynamic color ───
    const privacyValue = 88;  // ← fake placeholder (0–100%)
    let privacyColor;
    if (privacyValue > 75) {
        privacyColor = '#6EEB83';   // green
    } else if (privacyValue >= 50) {
        privacyColor = '#F5A623';   // yellow
    } else {
        privacyColor = '#FF4C4C';   // red
    }

    new Chart(document.getElementById('privacyChart'), {
        type: 'doughnut',
        data: {
            labels: ['Removed', 'Remaining'],
            datasets: [{
                data: [privacyValue, 100 - privacyValue],
                backgroundColor: [privacyColor, '#222'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false }
            }
        }
    });

}

// fire on first load
document.addEventListener('DOMContentLoaded', initHomeDashboard);


// renderer.js
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        console.log('[nav] clicked →', btn.dataset.page);

        // 1) Toggle selected nav item
        document.querySelectorAll('.nav-btn')
            .forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // 2) Show that page
        const page = btn.dataset.page;
        document.querySelectorAll('.page')
            .forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');

        // 3) Load & init the right module
        if (page === 'malware-defense') {
            console.log('[nav] loading malwareDefense.js');
            const mod = await import('./pages/malwareDefense.js');
            mod.init();
        }
        // … any other pages you already had …
        else if (page === 'system-cleanup') {
            console.log('[nav] loading systemCleanup.js');
            const mod = await import('./pages/systemCleanup.js');
            mod.init();
        } else if (page === 'system-health') {
            console.log('[nav] loading systemHealth.js');
            checkAvailableUpdates(); // ✅ ADD THIS
        }
        // … further pages …
    });
});


document.getElementById('ms-info')?.addEventListener('click', () => {
    const modal = document.getElementById('sc-info-modal');
    const text = document.getElementById('sc-info-text');
    if (modal && text) {
        text.textContent = "Malware Scan checks your system for malicious files and threats.";
        modal.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('info-modal');
    const contentDiv = document.getElementById('info-box-content');
    const closeBtn = modal.querySelector('.close');

    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const mdFile = btn.dataset.md;               // e.g. "home.md"
            try {
                const res = await fetch(mdFile);
                if (!res.ok) throw new Error(res.statusText);
                const md = await res.text();
                contentDiv.innerHTML = marked.parse(md);
            } catch (err) {
                contentDiv.innerHTML =
                    `<p style="color:tomato">Error loading ${mdFile}: ${err.message}</p>`;
            }
            modal.classList.add('visible');
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
    });

    // Enable closing info modal by clicking outside the content
    modal.addEventListener('mousedown', (e) => {
        // If the click is directly on the modal overlay (not inside the content)
        if (e.target === modal) {
            modal.classList.remove('visible');
        }
    });
});


// Scanner: inline result rendering
// main.js (renderer)
// main.js (renderer)
// main.js (renderer)
document.addEventListener('DOMContentLoaded', () => {
    // 1) grab DOM elements once
    const bar = document.getElementById('scanner-bar');
    const input = document.getElementById('scanner-url-input');
    const button = document.getElementById('scanner-scan-btn');
    const resultBox = document.getElementById('scanner-result');
    const wrapper = resultBox.querySelector('.result-wrapper');

    console.log('📦 Renderer initialized');
    console.log(' bar:', bar);
    console.log(' input:', input);
    console.log(' button:', button);
    console.log(' resultBox:', resultBox);
    console.log(' wrapper:', wrapper);

    function setDisabled(val) {
        input.disabled = val;
        button.disabled = val;
    }

    function sizeResultArea() {
        if (!bar || !resultBox) return;
        const bottomOfBar = bar.getBoundingClientRect().bottom;
        const available = window.innerHeight - bottomOfBar - 20;
        console.log('↕️ sizeResultArea:', { bottomOfBar, available });
        resultBox.style.height = `${available}px`;
    }

    async function doScan() {
        const url = input.value.trim();
        if (!url) return;

        setDisabled(true);

        // 2) show spinner & size box
        resultBox.classList.remove('hidden');
        wrapper.innerHTML = `
      <div style="text-align:center">
        <span class="spinner"></span> Scanning…
      </div>`;
        sizeResultArea();

        let raw;
        try {
            raw = await window.urlScanner.scan(url);
        } catch (err) {
            wrapper.innerHTML = `<p style="color:tomato">Scan API error: ${err}</p>`;
            sizeResultArea();
            setDisabled(false);
            return;
        }

        // 3) parse JSON
        let data = null;
        try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { }

        // 4) build table rows
        const ok = data?.ok;
        const rows = [
            ['Status', ok ? '✅ Secure' : '❌ Not Secure'],
            ['DNS Resolved', data?.dnsResolved ?? '–'],
            ['Redirects', data?.redirects?.length ?? '–'],
            ['Final URL', data?.finalUrl
                ? `<a href="${data.finalUrl}" target="_blank">${data.finalUrl}</a>`
                : '–'],
            ['Status Code', data?.statusCode ?? '–'],
            ['TLS Used', data?.tls?.used ?? '–'],
            ['TLS Validated', data?.tls?.validated ?? '–'],
            ['Issuer', data?.tls?.issuer ?? '–'],
            ['Valid From', data?.tls?.validFrom ?? '–'],
            ['Valid To', data?.tls?.validTo ?? '–'],
            ['Error', data?.error ?? '–']
        ];

        const tableRowsHtml = rows.map(
            ([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`
        ).join('');

        // 5) inject table & resize
        wrapper.innerHTML = `
      <table class="scan-table">
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    `;
        sizeResultArea();

        setDisabled(false);
        input.value = '';
    }

    // 6) wire it all up once
    sizeResultArea();
    window.addEventListener('resize', sizeResultArea);
    button.addEventListener('click', doScan);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !button.disabled) doScan();
    });
});

function checkAvailableUpdates() {
    const listDiv = document.getElementById('updateList');
    const resultDiv = document.getElementById('updateResult');

    if (!listDiv || !window.updateAPI?.checkUpdates) return;

    listDiv.innerHTML = '🔍 Checking for available updates...';

    window.updateAPI.checkUpdates()
        .then(output => {
            // Raw CLI output
            resultDiv.innerHTML = ``;

            // Attempt to parse update lines
            const lines = output.split('\n');
            const updates = lines
                .filter(line => /^\s*\S+\s+\S+\s+\S+/.test(line)) // simple package line pattern
                .map(line => `<li>${line}</li>`)
                .join('');

            listDiv.innerHTML = updates
                ? `<ul style="margin-top: 10px">${updates}</ul>`
                : '✅ No updates available.';
        })
        .catch(err => {
            listDiv.innerHTML = `<span style="color:tomato">❌ Error: ${err.message}</span>`;
        });
}



document.addEventListener('DOMContentLoaded', () => {
    const upgradeBtn = document.getElementById('upgradeAllBtnSystem');
    const resultDiv = document.getElementById('updateResult');

    if (upgradeBtn && window.updateAPI) {
        upgradeBtn.addEventListener('click', async () => {
            upgradeBtn.disabled = true;
            resultDiv.innerHTML = '🔄 Running winget update...';

            try {
                const response = await window.updateAPI.upgradeAll();

                resultDiv.innerHTML = response.message.replace(/\n/g, '<br>');
            } catch (err) {
                resultDiv.innerHTML = `<span style="color:tomato">Unexpected error: ${err.message}</span>`;
            } finally {
                upgradeBtn.disabled = false;
            }
        });
    }
});
