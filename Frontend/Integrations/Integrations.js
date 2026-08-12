document.addEventListener('DOMContentLoaded', () => {

    // ===================================================
    // 1. SIDEBAR COLLAPSE & MOBILE MENU TOGGLE
    // ===================================================
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.body.classList.toggle('mobile-menu-open');
            } else {
                sidebar.classList.toggle('close');
                document.body.classList.toggle('sidebar-closed');
            }
        });
    }

    // ===================================================
    // 2. TOGGLE INTEGRATION STATUS (Connected <-> Connect)
    // ===================================================
    const integrationsGrid = document.getElementById('integrationsGrid');

    if (integrationsGrid) {
        integrationsGrid.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-action="toggle"]');
            if (!btn) return;

            const appCard = btn.closest('.integration-card');
            const appName = appCard ? appCard.getAttribute('data-app') : 'App';

            if (btn.classList.contains('connected')) {
                // تحويل الحالة من Connected إلى Connect
                btn.className = 'btn-connect';
                btn.textContent = 'Connect';
                console.log(`Disconnected from ${appName}`);
            } else {
                // تحويل الحالة من Connect إلى Connected
                btn.className = 'status-badge connected';
                btn.textContent = 'Connected';
                console.log(`Connected to ${appName}`);
            }
        });
    }

});