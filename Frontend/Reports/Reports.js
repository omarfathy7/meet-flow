document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('close');
            document.body.classList.toggle('sidebar-closed');
        });
    }

    const reportsData = {
        today: createEmptyReportData('Today'),
        month: createEmptyReportData('This Month'),
        year: createEmptyReportData('This Year')
    };

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
                if (selectedPeriod) selectedPeriod.textContent = item.textContent;
                dropdownMenu.classList.remove('show');
                updateReportsUI(selectedValue);
            });
        });
    }

    document.querySelectorAll('.view-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });

    const viewAllBtn = document.getElementById('viewAllReportsBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
        });
    }

    updateReportsUI('today');

    function createEmptyReportData(label) {
        return {
            label,
            metrics: {
                totalMeetings: { value: '0', change: '0%' },
                tasksCompleted: { value: '0', change: '0%' },
                ontimeCompletion: { value: '0%', change: '0%' },
                avgDuration: { value: '0 min', change: '0%' }
            }
        };
    }

    function updateReportsUI(periodKey) {
        const data = reportsData[periodKey] || reportsData.today;
        setMetric('val-total-meetings', 'chg-total-meetings', data.metrics.totalMeetings);
        setMetric('val-tasks-completed', 'chg-tasks-completed', data.metrics.tasksCompleted);
        setMetric('val-ontime-completion', 'chg-ontime-completion', data.metrics.ontimeCompletion);
        setMetric('val-avg-duration', 'chg-avg-duration', data.metrics.avgDuration);
    }

    function setMetric(valueId, changeId, metric) {
        const valueElement = document.getElementById(valueId);
        const changeElement = document.getElementById(changeId);

        if (valueElement) valueElement.textContent = metric.value;
        if (changeElement) {
            changeElement.className = 'metric-change';
            changeElement.innerHTML = `<i class="fa-solid fa-minus"></i> ${metric.change}`;
        }
    }
});