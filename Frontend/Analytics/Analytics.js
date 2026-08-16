document.addEventListener("DOMContentLoaded", async () => {
    if (!requireAuth()) return;

    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.querySelector(".sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("close");
            document.body.classList.toggle("sidebar-closed");
        });
    }

    setupTimeframeDropdown();

    const meetingsChart = createMeetingsChart();
    const tasksStatusChart = createTasksStatusChart();

    await Promise.all([
        loadDashboardSummary(),
        loadTasksAnalytics(tasksStatusChart)
    ]);

    if (meetingsChart) meetingsChart.update();
});

function setupTimeframeDropdown() {
    const timeframeBtn = document.getElementById("timeframeBtn");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const selectedPeriod = document.getElementById("selectedPeriod");
    const dropdownItems = document.querySelectorAll(".dropdown-item");

    if (!timeframeBtn || !dropdownMenu) return;

    timeframeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => dropdownMenu.classList.remove("show"));

    dropdownItems.forEach(item => {
        item.addEventListener("click", () => {
            dropdownItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            if (selectedPeriod) selectedPeriod.textContent = item.textContent;
            dropdownMenu.classList.remove("show");
        });
    });
}

function createMeetingsChart() {
    const ctx = document.getElementById("meetingsChart")?.getContext("2d");
    if (!ctx) return null;

    return new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: "#3461FF",
                borderRadius: 6,
                barThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11, weight: "600" } } },
                y: { display: false, beginAtZero: true }
            }
        }
    });
}

function createTasksStatusChart() {
    const ctx = document.getElementById("tasksStatusChart")?.getContext("2d");
    if (!ctx) return null;

    return new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Completed", "In Progress", "To Do", "Blocked"],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ["#16A34A", "#EAB308", "#DC2626", "#A855F7"],
                borderWidth: 0,
                cutout: "78%"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

async function loadDashboardSummary() {
    const data = await fetchAPI("/api/Dashboard/summary");
    document.getElementById("totalMeetings").textContent = data?.todaysMeetingsCount ?? 0;
    document.getElementById("tasksCompleted").textContent = 0;
    document.getElementById("timeSaved").textContent = "0h";
    document.getElementById("participation").textContent = `${Math.round(data?.completionProgressPercent ?? 0)}%`;
}

async function loadTasksAnalytics(tasksStatusChart) {
    const tasks = await fetchAPI("/api/tasks/my");
    const list = Array.isArray(tasks) ? tasks : [];
    const counts = { completed: 0, inProgress: 0, todo: 0, blocked: 0 };

    list.forEach(task => {
        const status = String(task.status || "").toLowerCase();
        if (status === "completed" || status === "done") counts.completed++;
        else if (status === "inprogress" || status === "in progress") counts.inProgress++;
        else if (status === "blocked") counts.blocked++;
        else counts.todo++;
    });

    const total = counts.completed + counts.inProgress + counts.todo + counts.blocked;
    document.getElementById("tasksCompleted").textContent = counts.completed;
    document.getElementById("totalTasksCount").textContent = total;
    document.getElementById("completedCount").textContent = formatCountPercent(counts.completed, total);
    document.getElementById("inProgressCount").textContent = formatCountPercent(counts.inProgress, total);
    document.getElementById("toDoCount").textContent = formatCountPercent(counts.todo, total);
    document.getElementById("blockedCount").textContent = formatCountPercent(counts.blocked, total);

    if (tasksStatusChart) {
        tasksStatusChart.data.datasets[0].data = [counts.completed, counts.inProgress, counts.todo, counts.blocked];
        tasksStatusChart.update();
    }
}

function formatCountPercent(value, total) {
    const percent = total ? Math.round((value / total) * 100) : 0;
    return `${value} (${percent}%)`;
}
