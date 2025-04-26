const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Navigation & page switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const page = btn.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');

        // Load update logic only for system-health
        if (page === 'system-health') {
            const module = await import('./pages/update.js');
            if (module.init) module.init();
        }

        if (page === 'home') initHomeDashboard();

    });
});

// draw charts on first load
document.addEventListener('DOMContentLoaded', initHomeDashboard);


// Prevent double-init
let chartsInitialized = false;

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
                borderColor: '#00D9FF',
                backgroundColor: 'rgba(0,217,255,0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#00D9FF'
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
                borderColor: '#6EEB83',
                backgroundColor: 'rgba(110,235,131,0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#6EEB83'
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

    // 3) System Health (doughnut)
    new Chart(document.getElementById('healthChart'), {
        type: 'doughnut',
        data: {
            labels: ['Healthy', 'Remainder'],
            datasets: [{
                data: [85, 15],  // ← fake percent
                backgroundColor: ['#00D9FF', '#222'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { display: false } }
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
                backgroundColor: '#00D9FF'
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

    // 5) Privacy Trackers Removed (doughnut)
    new Chart(document.getElementById('privacyChart'), {
        type: 'doughnut',
        data: {
            labels: ['Removed', 'Left'],
            datasets: [{
                data: [55, 45],  // ← fake percent
                backgroundColor: ['#F5A623', '#222'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { display: false } }
        }
    });
}

// fire on first load
document.addEventListener('DOMContentLoaded', initHomeDashboard);
