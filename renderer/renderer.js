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
    });
});


