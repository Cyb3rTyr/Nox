// renderer/renderer.js
// Handles sidebar toggle, navigation, and page-specific simulations.

// Sidebar collapse/expand
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Navigation & page switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const page = btn.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
    });
});

// Malware Scan Simulation
document.getElementById('startScan').addEventListener('click', () => {
    const bar = document.getElementById('bar');
    let pct = 0;
    const timer = setInterval(() => {
        pct += 10;
        bar.style.width = pct + '%';
        if (pct >= 100) clearInterval(timer);
    }, 300);
});

// System Health Simulation
const log = document.getElementById('health-log');
document.getElementById('updateBtn').addEventListener('click', () => {
    log.textContent = 'Running update...\n';
    setTimeout(() => log.textContent += '✅ Update completed successfully!\n', 1500);
});
document.getElementById('upgradeBtn').addEventListener('click', () => {
    log.textContent = 'Running upgrade...\n';
    setTimeout(() => log.textContent += '✅ Upgrade completed successfully!', 2000);
});


// Add this inside your renderer.js file
document.getElementById('wingtUpdateBtn').addEventListener('click', () => {
    const log = document.getElementById('health-log');
    log.textContent = 'Executing: wingt update...\n';
    setTimeout(() => {
        log.textContent += '🔄 Checking for updates...\n';
        setTimeout(() => {
            log.textContent += '⬇️ Downloading updates...\n';
            setTimeout(() => {
                log.textContent += '📦 Installing updates...\n';
                setTimeout(() => {
                    log.textContent += '✅ "wingt update" completed successfully!\n';
                }, 1500);
            }, 1500);
        }, 1500);
    }, 1000);
});
