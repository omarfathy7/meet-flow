document.addEventListener('DOMContentLoaded', () => {

    // 1. Sidebar Toggle Logic
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('close');
            document.body.classList.toggle('sidebar-closed');
        });
    }

    // 2. Mock Statistics Data for (Today / This Month / This Year)
    const reportsData = {
        today: {
            label: "Today",
            metrics: {
                totalMeetings: { value: "3", change: "↑ 2%", positive: true },
                tasksCompleted: { value: "12", change: "↑ 5%", positive: true },
                ontimeCompletion: { value: "95%", change: "↑ 2%", positive: true },
                avgDuration: { value: "30 min", change: "↓ 10%", positive: false }
            }
        },
        month: {
            label: "This Month",
            metrics: {
                totalMeetings: { value: "28", change: "↑ 12%", positive: true },
                tasksCompleted: { value: "155", change: "↑ 18%", positive: true },
                ontimeCompletion: { value: "92%", change: "↑ 8%", positive: true },
                avgDuration: { value: "46 min", change: "↓ 5%", positive: false }
            }
        },
        year: {
            label: "This Year",
            metrics: {
                totalMeetings: { value: "320", change: "↑ 24%", positive: true },
                tasksCompleted: { value: "1,840", change: "↑ 32%", positive: true },
                ontimeCompletion: { value: "89%", change: "↑ 4%", positive: true },
                avgDuration: { value: "42 min", change: "↓ 8%", positive: false }
            }
        }
    };

    // 3. Dropdown Selection & Interactive View Switcher
    const timeframeBtn = document.getElementById('timeframeBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const selectedPeriod = document.getElementById('selectedPeriod');
    const dropdownItems = document.querySelectorAll('.dropdown-item');

    if (timeframeBtn && dropdownMenu) {
        timeframeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });

        dropdownItems.forEach(item => {
            item.addEventListener('click', () => {
                dropdownItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const selectedValue = item.getAttribute('data-value');
                selectedPeriod.textContent = item.textContent;
                dropdownMenu.classList.remove('show');

                // Update UI Table based on selection
                updateReportsUI(selectedValue);
            });
        });
    }

    // Function to Update Activity Summary Table Dynamic Values
    function updateReportsUI(periodKey) {
        const data = reportsData[periodKey];
        if (!data) return;

        // Total Meetings
        document.getElementById('val-total-meetings').textContent = data.metrics.totalMeetings.value;
        const chgMeetings = document.getElementById('chg-total-meetings');
        chgMeetings.innerHTML = `<i class="fa-solid fa-${data.metrics.totalMeetings.positive ? 'arrow-up' : 'arrow-down'}"></i> ${data.metrics.totalMeetings.change.replace(/[↑↓]\s?/, '')}`;

        // Tasks Completed
        document.getElementById('val-tasks-completed').textContent = data.metrics.tasksCompleted.value;
        const chgTasks = document.getElementById('chg-tasks-completed');
        chgTasks.innerHTML = `<i class="fa-solid fa-${data.metrics.tasksCompleted.positive ? 'arrow-up' : 'arrow-down'}"></i> ${data.metrics.tasksCompleted.change.replace(/[↑↓]\s?/, '')}`;

        // On-time Completion
        document.getElementById('val-ontime-completion').textContent = data.metrics.ontimeCompletion.value;
        const chgOntime = document.getElementById('chg-ontime-completion');
        chgOntime.innerHTML = `<i class="fa-solid fa-${data.metrics.ontimeCompletion.positive ? 'arrow-up' : 'arrow-down'}"></i> ${data.metrics.ontimeCompletion.change.replace(/[↑↓]\s?/, '')}`;

        // Average Duration
        document.getElementById('val-avg-duration').textContent = data.metrics.avgDuration.value;
        const chgDuration = document.getElementById('chg-avg-duration');
        chgDuration.innerHTML = `<i class="fa-solid fa-${data.metrics.avgDuration.positive ? 'arrow-up' : 'arrow-down'}"></i> ${data.metrics.avgDuration.change.replace(/[↑↓]\s?/, '')}`;
        
        chgDuration.className = `metric-change ${data.metrics.avgDuration.positive ? 'positive' : 'negative'}`;

        fetchReportsFromBackend(periodKey);
    }

    // 4. Report View Buttons Click Event Listener
    const reportBtns = document.querySelectorAll('.view-report-btn');
    reportBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const reportType = btn.getAttribute('data-report');
            alert(`Opening details for ${reportType.toUpperCase()} report (${selectedPeriod.textContent})...`);
        });
    });

    const viewAllBtn = document.getElementById('viewAllReportsBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Redirecting to full reports archive...');
        });
    }

    // 5. Backend API Fetching Placeholder
    const API_BASE_URL = 'https://meetflow.runasp.net';

    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async function fetchReportsFromBackend(timeframe) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/Reports?timeframe=${timeframe}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch report metrics');

            const reportResult = await response.json();
            console.log(`Backend reports data for ${timeframe}:`, reportResult);
        } catch (error) {
            console.log(`Note: Using local interactive state for timeframe [${timeframe}].`);
        }
    }
});