document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('close');
            document.body.classList.toggle('sidebar-closed');
        });
    }

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
                
                fetchAnalyticsData(item.getAttribute('data-value'));
            });
        });
    }

    const meetingsCtx = document.getElementById('meetingsChart')?.getContext('2d');
    const tasksCtx = document.getElementById('tasksStatusChart')?.getContext('2d');

    let meetingsChart, tasksStatusChart;

    if (meetingsCtx) {
        meetingsChart = new Chart(meetingsCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    data: [12, 18, 17, 17, 15, 5, 4],
                    backgroundColor: '#3461FF',
                    borderRadius: 6,
                    barThickness: 32
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } },
                    y: { display: false }
                }
            }
        });
    }

    if (tasksCtx) {
        tasksStatusChart = new Chart(tasksCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'To Do', 'Blocked'],
                datasets: [{
                    data: [16, 6, 4, 2],
                    backgroundColor: ['#16A34A', '#EAB308', '#DC2626', '#A855F7'],
                    borderWidth: 0,
                    cutout: '78%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    function fetchAnalyticsData(period) {
        console.log(`Fetching analytics for period: ${period}`);
    }
});










const API_BASE_URL = 'https://meetflow.runasp.net';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function loadDashboardSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/Dashboard/summary`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('فشل في جلب بيانات الإحصائيات');

        const data = await response.json();

        if (document.getElementById('totalMeetings')) {
            document.getElementById('totalMeetings').textContent = data.todaysMeetingsCount || 0;
        }
        if (document.getElementById('tasksCompleted')) {
            document.getElementById('tasksCompleted').textContent = data.tasksPendingCount || 0;
        }
        if (document.getElementById('participation')) {
            document.getElementById('participation').textContent = `${data.completionProgressPercent || 0}%`;
        }

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
    }
}

async function loadTasksAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tasks/my`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('فشل في جلب المهام');

        const tasks = await response.json();

        const statusCounts = {
            completed: 0,
            inProgress: 0,
            pending: 0
        };

        tasks.forEach(task => {
            const status = (task.status || '').toLowerCase();
            if (status === 'completed' || status === 'done') {
                statusCounts.completed++;
            } else if (status === 'inprogress' || status === 'in progress') {
                statusCounts.inProgress++;
            } else {
                statusCounts.pending++;
            }
        });

        if (typeof tasksChart !== 'undefined' && tasksChart) {
            tasksChart.data.datasets[0].data = [
                statusCounts.completed,
                statusCounts.inProgress,
                statusCounts.pending
            ];
            tasksChart.update();
        }

    } catch (error) {
        console.error('Error fetching tasks analytics:', error);
    }
}

function fetchAnalyticsData(period) {
    console.log(`جاري تحديث البيانات للفترة: ${period}`);
    loadDashboardSummary();
    loadTasksAnalytics();
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardSummary();
    loadTasksAnalytics();
});