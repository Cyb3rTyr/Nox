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



const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Navigation & page switching
// renderer.js

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        // highlight & show page
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const page = btn.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');

        // page‐specific init:
        if (page === 'system-health') {
            const m = await import('./pages/update.js');
            m.init?.();
        }
        else if (page === 'home') {
            initHomeDashboard();
        }
        else if (page === 'malware-defense') {
            const m = await import('./pages/malwareDefense.js');
            m.init();
        }
        else if (page === 'system-cleanup') {
            // ← THIS IS THE NEW PART:
            const m = await import('./pages/systemCleanup.js');
            m.init();
        }
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
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const page = btn.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
        if (page === 'malware-defense') {
            const mod = await import('./pages/malwareDefense.js');
            mod.init();
        }
        // …other pages…
    });
});


// renderer.js
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        // existing logic...
        if (page === 'system-cleanup') {
            const module = await import('./pages/systemCleanup.js');
            module.init();

            // ← add the snippet HERE
            const scanBtn = document.getElementById('sc-scan');
            const modal = document.getElementById('scan-modal');
            const closeBtn = document.getElementById('modal-close');
            const progressCt = document.getElementById('modal-progress-container');
            const progressBar = document.getElementById('modal-progress-bar');
            const results = document.getElementById('modal-results');

            // Listen for progress updates
            ipcRenderer.on('cleanup-progress', (_e, pct) => {
                progCt.classList.remove('hidden');
                progBar.style.width = pct + '%';
            });

            scanBtn.addEventListener('click', async () => {
                // get your button by its ID from index.html:
                const cleanOldUpdatesBtn = document.getElementById('sc-clean-old-updates');

                cleanOldUpdatesBtn.addEventListener('click', async () => {
                    modal.classList.remove('hidden');
                    progressCt.classList.remove('hidden');
                    results.textContent = '';

                    try {
                        // invoke the same IPC channel, but passing your new action:
                        const out = await window.cleanupBridge.run('cleanOldUpdates');
                        results.textContent = out.trim();
                    } catch (err) {
                        results.textContent = 'Error: ' + err.message;
                    } finally {
                        progressCt.classList.add('hidden');
                    }
                });

                modal.classList.remove('hidden');
                progressCt.classList.remove('hidden');
                results.textContent = '';

                try {
                    const out = await window.cleanupBridge.run('scan');
                    results.textContent = out.trim();
                } catch (err) {
                    results.textContent = 'Error: ' + err.message;
                } finally {
                    progressCt.classList.add('hidden');
                }
            });

            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });

        }
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


// Scanner: trigger scan on Enter key and show modal with loading/result
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('scanner-url-input');
    const button = document.getElementById('scanner-scan-btn');
    const modal = document.getElementById('scanner-modal');
    const modalBody = document.getElementById('scanner-modal-body');
    const closeBtn = modal?.querySelector('.close');

    if (input && button && modal && modalBody && closeBtn) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') button.click();
        });

        button.addEventListener('click', async () => {
            const url = input.value;
            if (!url) return;
            // Show modal and loading
            modal.classList.remove('hidden');
            closeBtn.style.display = 'none'; // Hide close button
            modalBody.innerHTML = `<div style="text-align:center;padding:2em;"><span class="loader"></span><br>Scanning...</div>`;
            try {
                const result = await window.urlScanner.scan(url);
                console.log('Scan result:', result); // Debug log
                modalBody.innerHTML = `<pre>${result}</pre>`;
            } catch (err) {
                console.error('Scan error:', err); // Debug log
                modalBody.innerHTML = `<p style="color:tomato">Error: ${err}</p>`;
            }
            closeBtn.style.display = 'block'; // Show close button after scan
            input.value = ''; // Clear the input after scan completes
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Do NOT close scanner modal by clicking outside
        // (leave this block commented out)
        // modal.addEventListener('mousedown', (e) => {
        //     if (e.target === modal) {
        //         modal.classList.add('hidden');
        //     }
        // });
    }
});
