document.addEventListener("DOMContentLoaded", async () => {
    if (!requireAuth()) return;

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");

    if (menuToggle && sidebar && mainContent) {
        menuToggle.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle("open");
            } else {
                sidebar.classList.toggle("close");
                mainContent.classList.toggle("expand");
            }
        });
    }

    const userData = await loadHeaderProfile();
    updateWelcomeMessage(userData);
    await initNotificationDropdown({ viewUrl: "../Notifications/Notifications.html" });
    await Promise.all([
        loadDashboardSummary(),
        loadUpcomingMeetings(),
        loadMyTasks()
    ]);
    renderRecentActivity([]);
});

let dashboardTasks = [];

async function loadDashboardSummary() {
    const summary = await fetchAPI("/api/Dashboard/summary");
    const statCards = document.querySelectorAll(".stat-card");
    if (statCards.length < 4) return;

    const values = {
        todaysMeetingsCount: summary?.todaysMeetingsCount ?? 0,
        nextMeetingTitle: summary?.nextMeetingTitle || "",
        nextMeetingInMinutes: summary?.nextMeetingInMinutes ?? null,
        tasksPendingCount: summary?.tasksPendingCount ?? 0,
        tasksOverdueCount: summary?.tasksOverdueCount ?? 0,
        completionProgressPercent: summary?.completionProgressPercent ?? 0,
        activeWorkspacesCount: summary?.activeWorkspacesCount ?? 0,
        workspacesAtRiskCount: summary?.workspacesAtRiskCount ?? 0
    };

    statCards[0].querySelector("h2").textContent = values.todaysMeetingsCount;
    statCards[0].querySelector("p").textContent = values.nextMeetingTitle
        ? `Next meeting in ${values.nextMeetingInMinutes ?? 0} min`
        : "No upcoming meetings";

    statCards[1].querySelector("h2").textContent = values.tasksPendingCount;
    statCards[1].querySelector("p").textContent = `${values.tasksOverdueCount} tasks overdue`;

    statCards[2].querySelector("h2").textContent = `${Math.round(values.completionProgressPercent)}%`;
    statCards[2].querySelector("p").textContent = "Based on your tasks";

    statCards[3].querySelector("h2").textContent = values.activeWorkspacesCount;
    statCards[3].querySelector("p").textContent = `${values.workspacesAtRiskCount} projects at risk`;
}

async function loadUpcomingMeetings() {
    const container = document.querySelector(".meetings-list");
    if (!container) return;

    const workspaceId = await getCurrentWorkspaceId();
    if (!workspaceId) {
        renderEmpty(container, "No upcoming meetings scheduled.");
        return;
    }

    const meetings = await fetchAPI(`/api/Meetings/workspace/${workspaceId}`);
    if (!Array.isArray(meetings)) {
        renderEmpty(container, "No upcoming meetings scheduled.");
        return;
    }

    const upcoming = meetings
        .filter(m => new Date(m.meetingDate) >= new Date())
        .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
        .slice(0, 5);

    if (upcoming.length === 0) {
        renderEmpty(container, "No upcoming meetings scheduled.");
        return;
    }

    container.innerHTML = upcoming.map(m => `
        <div class="meeting-item">
            <div class="meeting-time">
                <h4>${formatTime(m.meetingDate)}</h4>
                <span>${formatDateLabel(m.meetingDate)}</span>
            </div>
            <div class="meeting-details">
                <h4>${escapeHtml(m.title)}</h4>
            </div>
            <button class="join-btn" onclick="window.location.href='../Meetings/Meetings.html?id=${m.id}'">View</button>
        </div>
    `).join("");
}

async function loadMyTasks() {
    const tasks = await fetchAPI("/api/tasks/my");
    dashboardTasks = Array.isArray(tasks) ? tasks : [];
    setupTaskTabListeners();
    renderTasks("Pending");
}

function setupTaskTabListeners() {
    const tabs = document.querySelectorAll(".task-tabs button");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderTasks(tab.dataset.filter || "Pending");
        });
    });
}

function renderTasks(filterStatus) {
    const taskList = document.querySelector(".task-list");
    if (!taskList) return;

    let filtered = dashboardTasks;
    if (filterStatus === "Pending") {
        filtered = dashboardTasks.filter(t => t.status !== "Completed");
    } else if (filterStatus === "Overdue") {
        filtered = dashboardTasks.filter(t => t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < new Date());
    } else if (filterStatus === "Completed") {
        filtered = dashboardTasks.filter(t => t.status === "Completed");
    }

    updateTaskTabCounts();

    if (filtered.length === 0) {
        renderEmpty(taskList, `No ${filterStatus.toLowerCase()} tasks found.`);
        return;
    }

    taskList.innerHTML = filtered.slice(0, 5).map(t => {
        const isCompleted = t.status === "Completed";
        const priorityClass = (t.priority || "Medium").toLowerCase();
        return `
            <div class="task-item" data-task-id="${t.id}">
                <input type="checkbox" ${isCompleted ? "checked" : ""}
                       onchange="updateTaskStatus(${t.meetingId}, ${t.id}, this.checked)">
                <div class="task-info">
                    <h4 class="${isCompleted ? "completed-text" : ""}">${escapeHtml(t.title)}</h4>
                    <span>${escapeHtml(t.workspaceName || "Meeting task")} - ${formatDate(t.dueDate)}</span>
                </div>
                <small class="priority-${priorityClass}">${escapeHtml(t.priority || "Medium")}</small>
            </div>
        `;
    }).join("");
}

function updateTaskTabCounts() {
    const tabs = document.querySelectorAll(".task-tabs button");
    const pending = dashboardTasks.filter(t => t.status !== "Completed").length;
    const overdue = dashboardTasks.filter(t => t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const completed = dashboardTasks.filter(t => t.status === "Completed").length;
    const counts = { Pending: pending, Overdue: overdue, Completed: completed };

    tabs.forEach(tab => {
        const filter = tab.dataset.filter || "Pending";
        tab.textContent = `${filter} (${counts[filter] ?? 0})`;
    });
}

async function updateTaskStatus(meetingId, taskId, isChecked) {
    const newStatus = isChecked ? "Completed" : "Pending";
    const response = await fetchAPI(`/api/meetings/${meetingId}/tasks/${taskId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
    });

    if (response !== null) {
        const task = dashboardTasks.find(t => t.id === taskId);
        if (task) task.status = newStatus;
        await loadDashboardSummary();
        renderTasks(document.querySelector(".task-tabs button.active")?.dataset.filter || "Pending");
    }
}

function renderRecentActivity(items) {
    const activityList = document.querySelector(".activity-list");
    if (!activityList) return;

    if (!Array.isArray(items) || items.length === 0) {
        renderEmpty(activityList, "No recent activity yet.");
        return;
    }
}

function updateWelcomeMessage(userData) {
    const welcomeHeading = document.querySelector(".welcome h1");
    if (!welcomeHeading) return;

    const fullName = userData?.fullName || "User";
    const firstName = fullName.trim().split(/\s+/)[0] || "User";
    welcomeHeading.textContent = `${getGreeting()}, ${firstName}`;
}

function renderEmpty(container, message) {
    container.innerHTML = `<p class="empty-inline">${escapeHtml(message)}</p>`;
}
