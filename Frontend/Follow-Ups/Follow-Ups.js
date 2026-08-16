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
    const progressChart = createProgressChart();
    await loadFollowUps(progressChart);
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

function createProgressChart() {
    const ctx = document.getElementById("progressChart")?.getContext("2d");
    if (!ctx) return null;

    return new Chart(ctx, {
        type: "line",
        data: {
            labels: ["No data"],
            datasets: [{
                label: "Progress",
                data: [0],
                borderColor: "#3461FF",
                backgroundColor: "rgba(52, 97, 255, 0.08)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0
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

async function loadFollowUps(progressChart) {
    const tasks = await fetchAPI("/api/tasks/my");
    const list = Array.isArray(tasks) ? tasks : [];
    const now = new Date();
    const completed = list.filter(task => task.status === "Completed").length;
    const overdue = list.filter(task => task.status !== "Completed" && task.dueDate && new Date(task.dueDate) < now).length;
    const inProgress = list.filter(task => String(task.status || "").toLowerCase().includes("progress")).length;
    const blocked = list.filter(task => String(task.status || "").toLowerCase() === "blocked").length;
    const todo = Math.max(list.length - completed - inProgress - blocked, 0);
    const progress = list.length ? Math.round((completed / list.length) * 100) : 0;

    document.getElementById("overdueCount").textContent = overdue;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("timeSaved").textContent = "0h";
    document.getElementById("participationRate").textContent = "0%";
    document.getElementById("totalTasks").textContent = list.length;
    document.getElementById("completedRate").textContent = formatCountPercent(completed, list.length);
    document.getElementById("inProgressRate").textContent = formatCountPercent(inProgress, list.length);
    document.getElementById("todoRate").textContent = formatCountPercent(todo, list.length);
    document.getElementById("blockedRate").textContent = formatCountPercent(blocked, list.length);
    document.getElementById("overallPercentage").textContent = `${progress}%`;

    renderReminders(list.filter(task => task.status !== "Completed" && task.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5));

    if (progressChart) {
        progressChart.data.labels = list.length ? ["Progress"] : ["No data"];
        progressChart.data.datasets[0].data = [progress];
        progressChart.update();
    }
}

function renderReminders(tasks) {
    const reminderList = document.getElementById("reminderList");
    if (!reminderList) return;

    if (!tasks.length) {
        reminderList.innerHTML = '<p class="empty-followups">No follow-ups yet.</p>';
        return;
    }

    reminderList.innerHTML = tasks.map(task => `
        <div class="reminder-item">
            <div class="reminder-icon"><i class="fa-regular fa-file-lines"></i></div>
            <div class="reminder-info">
                <h4>${escapeHtml(task.title)}</h4>
                <p>${formatFullDate(task.dueDate)}</p>
            </div>
        </div>
    `).join("");
}

function formatCountPercent(value, total) {
    const percent = total ? Math.round((value / total) * 100) : 0;
    return `${value} (${percent}%)`;
}
