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

    // 2. Timeframe Dropdown Action
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
                selectedPeriod.textContent = item.textContent;
                dropdownMenu.classList.remove('show');
                updateData(item.getAttribute('data-value'));
            });
        });
    }

    // 3. Chart.js Initialization
    const ctx = document.getElementById('progressChart')?.getContext('2d');
    let progressChart;

    if (ctx) {
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM'],
                datasets: [{
                    label: 'Progress',
                    data: [20, 35, 45, 60, 70, 74],
                    borderColor: '#3461FF',
                    backgroundColor: 'rgba(52, 97, 255, 0.08)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: { display: false, min: 0, max: 100 }
                }
            }
        });
    }

    // 4. Update UI Data based on selection
    function updateData(period) {
        if (!progressChart) return;

        if (period === 'day') {
            document.getElementById('overdueCount').textContent = '2';
            document.getElementById('completedCount').textContent = '14';
            progressChart.data.labels = ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM'];
            progressChart.data.datasets[0].data = [20, 35, 45, 60, 70, 74];
        } else if (period === 'month') {
            document.getElementById('overdueCount').textContent = '5';
            document.getElementById('completedCount').textContent = '68';
            progressChart.data.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            progressChart.data.datasets[0].data = [30, 50, 65, 82];
        } else if (period === 'year') {
            document.getElementById('overdueCount').textContent = '12';
            document.getElementById('completedCount').textContent = '410';
            progressChart.data.labels = ['Q1', 'Q2', 'Q3', 'Q4'];
            progressChart.data.datasets[0].data = [40, 60, 75, 90];
        }
        progressChart.update();
    }
});