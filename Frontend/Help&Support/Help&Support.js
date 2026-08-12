document.addEventListener('DOMContentLoaded', () => {

    // ===================================================
    // 1. SIDEBAR TOGGLE (COLLAPSE & MOBILE)
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
    // 2. FAQ ACCORDION INTERACTION
    // ===================================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all active items
            faqItems.forEach(el => el.classList.remove('active'));

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // ===================================================
    // 3. INTERACTIVE HERO & TOP SEARCH FILTER
    // ===================================================
    const heroSearchInput = document.getElementById('heroSearchInput');
    const heroSearchBtn = document.getElementById('heroSearchBtn');

    function performSearch(query) {
        const filter = query.toLowerCase().trim();

        faqItems.forEach(item => {
            const text = item.innerText.toLowerCase();
            const keywords = item.getAttribute('data-keywords') || '';

            if (text.includes(filter) || keywords.includes(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    if (heroSearchInput) {
        heroSearchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
    }

    if (heroSearchBtn) {
        heroSearchBtn.addEventListener('click', () => {
            if (heroSearchInput) performSearch(heroSearchInput.value);
        });
    }

    // ===================================================
    // 4. TOPIC CARD CLICK FILTER
    // ===================================================
    const topicCards = document.querySelectorAll('.topic-card');

    topicCards.forEach(card => {
        card.addEventListener('click', () => {
            const topic = card.getAttribute('data-topic');
            console.log(`Filtering by topic: ${topic}`);

            // Filter FAQs according to selected topic
            faqItems.forEach(item => {
                const keywords = item.getAttribute('data-keywords') || '';
                const text = item.innerText.toLowerCase();

                if (keywords.includes(topic) || text.includes(topic)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            // Smooth scroll to FAQs section
            document.querySelector('.faq-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // ===================================================
    // 5. LIVE CHAT BUTTON SIMULATION
    // ===================================================
    const sidebarChatBtn = document.getElementById('sidebarChatBtn');
    if (sidebarChatBtn) {
        sidebarChatBtn.addEventListener('click', () => {
            alert('Live Chat starting... An agent will be with you shortly!');
        });
    }
});