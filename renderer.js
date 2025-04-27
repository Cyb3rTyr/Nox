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
