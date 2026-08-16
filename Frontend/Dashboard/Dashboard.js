const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");

menuToggle.addEventListener("click", () => {


    if (window.innerWidth <= 768) {
        sidebar.classList.toggle("open");
    } else {
        sidebar.classList.toggle("close");
        mainContent.classList.toggle("expand");
    }

});

const taskTabs = document.querySelectorAll(".task-tabs button");

taskTabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        taskTabs.forEach((t) => t.classList.remove("active"));

        tab.classList.add("active");

    });
    // ==========================================
    // MEETFLOW DASHBOARD - COMPLETE BACKEND INTEGRATION
    // ==========================================

    // رابط الباك إند الحقيقي المرفوع
    const BASE_URL = "https://meetflow.runasp.net";

    document.addEventListener("DOMContentLoaded", () => {
        initDashboard();
    });

    // Helper Function for API Requests
    async function fetchAPI(endpoint, options = {}) {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        const defaultHeaders = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        if (token) {
            defaultHeaders["Authorization"] = `Bearer ${token}`;
        }

        try {
            // تحويل الرابط النسبي إلى الرابط الكامل للباك إند
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            if (response.status === 401) {
                console.warn("Unauthorized access. Token might be missing or expired.");
                return null;
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    // Global Tasks State
    let globalTasks = [];

    async function initDashboard() {
        await loadUserProfile();
        await loadDashboardSummary();
        await loadUpcomingMeetings();
        await loadMyTasks();
    }

    // 1. User Profile Sync (/api/User/me)
    async function loadUserProfile() {
        const userData = await fetchAPI("/api/User/me");
        if (!userData) return;

        const userNameElem = document.querySelector(".header-user-name");
        const userRoleElem = document.querySelector(".header-user-role");
        const avatarElem = document.querySelector(".header-avatar");
        const welcomeHeading = document.querySelector(".welcome h1");

        const fullName = userData.fullName ? userData.fullName.trim() : "User";
        const role = userData.role || "Member";
        const nameParts = fullName.split(" ").filter(p => p.length > 0);
        const firstName = nameParts[0] || "User";

        // Dynamic Greeting
        const hour = new Date().getHours();
        let greeting = "Good morning";
        if (hour >= 12 && hour < 18) greeting = "Good afternoon";
        else if (hour >= 18) greeting = "Good evening";

        // Dynamic Initials
        let initials = "U";
        if (nameParts.length >= 2) {
            initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
            initials = nameParts[0].substring(0, 2).toUpperCase();
        }

        if (userNameElem) userNameElem.textContent = fullName;
        if (userRoleElem) userRoleElem.textContent = role;
        if (welcomeHeading) welcomeHeading.textContent = `${greeting}, ${firstName} 👋`;
        if (avatarElem) avatarElem.textContent = initials;
    }

    // 2. Dashboard Summary Cards (/api/Dashboard/summary)
    async function loadDashboardSummary() {
        const summary = await fetchAPI("/api/Dashboard/summary");
        if (!summary) return;

        const statCards = document.querySelectorAll(".stat-card");
        if (statCards.length < 4) return;

        // Stat 1: Today's Meetings
        const card1Value = statCards[0].querySelector("h2");
        const card1Sub = statCards[0].querySelector("p");
        if (card1Value) card1Value.textContent = summary.todaysMeetingsCount ?? 0;
        if (card1Sub) {
            card1Sub.textContent = summary.nextMeetingTitle
                ? `Next meeting in ${summary.nextMeetingInMinutes} min`
                : "No upcoming meetings";
        }

        // Stat 2: Tasks Pending
        const card2Value = statCards[1].querySelector("h2");
        const card2Sub = statCards[1].querySelector("p");
        if (card2Value) card2Value.textContent = summary.tasksPendingCount ?? 0;
        if (card2Sub) {
            card2Sub.textContent = `${summary.tasksOverdueCount ?? 0} tasks overdue`;
        }

        // Stat 3: Completion Progress
        const card3Value = statCards[2].querySelector("h2");
        if (card3Value) card3Value.textContent = `${summary.completionProgressPercent ?? 0}%`;

        // Stat 4: Active Projects
        const card4Value = statCards[3].querySelector("h2");
        const card4Sub = statCards[3].querySelector("p");
        if (card4Value) card4Value.textContent = summary.activeWorkspacesCount ?? 0;
        if (card4Sub) {
            card4Sub.textContent = `${summary.workspacesAtRiskCount ?? 0} projects at risk`;
        }
    }

    // 3. Upcoming Meetings List (/api/Meetings/workspace/{workspaceId})
    async function loadUpcomingMeetings() {
        const workspaceId = localStorage.getItem("currentWorkspaceId") || 1;
        const meetings = await fetchAPI(`/api/Meetings/workspace/${workspaceId}`);

        const meetingsSection = document.querySelector(".meetings");
        if (!meetingsSection) return;

        // الحصول على العناصر واستبدال القديم بالجديد
        const oldItems = meetingsSection.querySelectorAll(".meeting-item");
        oldItems.forEach(item => item.remove());

        if (!meetings || !Array.isArray(meetings) || meetings.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.className = "text-muted py-3";
            emptyMsg.textContent = "No upcoming meetings scheduled.";
            meetingsSection.appendChild(emptyMsg);
            return;
        }

        const upcoming = meetings
            .filter(m => new Date(m.meetingDate) >= new Date())
            .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
            .slice(0, 5);

        upcoming.forEach(m => {
            const itemHtml = `
            <div class="meeting-item">
                <div class="meeting-time">
                    <h4>${formatTime(m.meetingDate)}</h4>
                    <span>${formatDateLabel(m.meetingDate)}</span>
                </div>
                <div class="meeting-details">
                    <h4>${escapeHtml(m.title)}</h4>
                </div>
                <button class="join-btn" onclick="window.location.href='../Meetings/Meetings.html?id=${m.id}'">Join</button>
            </div>
        `;
            meetingsSection.insertAdjacentHTML("beforeend", itemHtml);
        });
    }

    // 4. Tasks Integration & Dynamic Filters (/api/tasks/my)
    async function loadMyTasks() {
        const tasks = await fetchAPI("/api/tasks/my");
        if (!tasks || !Array.isArray(tasks)) return;

        globalTasks = tasks;
        renderTasks("Pending");
        setupTaskTabListeners();
    }

    function renderTasks(filterStatus) {
        const taskList = document.querySelector(".task-list");
        if (!taskList) return;

        let filtered = globalTasks;

        if (filterStatus === "Pending") {
            filtered = globalTasks.filter(t => t.status !== "Completed");
        } else if (filterStatus === "Overdue") {
            filtered = globalTasks.filter(t => t.status !== "Completed" && new Date(t.dueDate) < new Date());
        } else if (filterStatus === "Completed") {
            filtered = globalTasks.filter(t => t.status === "Completed");
        }

        if (filtered.length === 0) {
            taskList.innerHTML = `<p class="empty-state text-muted py-3 text-center">No ${filterStatus.toLowerCase()} tasks found.</p>`;
            return;
        }

        taskList.innerHTML = filtered.map(t => {
            const isCompleted = t.status === "Completed";
            const priorityClass = (t.priority || "Medium").toLowerCase();

            return `
            <div class="task-item" data-task-id="${t.id}">
                <input type="checkbox" ${isCompleted ? "checked" : ""} 
                       onchange="updateTaskStatus(${t.meetingId}, ${t.id}, this.checked)">
                <div class="task-info">
                    <h4 class="${isCompleted ? 'completed-text' : ''}">${escapeHtml(t.title)}</h4>
                    <span>${escapeHtml(t.workspaceName || "Project")} • ${formatDate(t.dueDate)}</span>
                </div>
                <small class="priority-${priorityClass}">${t.priority || "Medium"}</small>
            </div>
        `;
        }).join("");
    }

    // Update Task Status (/api/meetings/{meetingId}/tasks/{taskId}/status)
    async function updateTaskStatus(meetingId, taskId, isChecked) {
        const newStatus = isChecked ? "Completed" : "Pending";

        const response = await fetchAPI(`/api/meetings/${meetingId}/tasks/${taskId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus })
        });

        if (response) {
            const task = globalTasks.find(t => t.id === taskId);
            if (task) task.status = newStatus;
            await loadDashboardSummary();
        }
    }

    function setupTaskTabListeners() {
        const tabs = document.querySelectorAll(".task-tabs button");
        tabs.forEach(tab => {
            tab.addEventListener("click", (e) => {
                tabs.forEach(t => t.classList.remove("active"));
                e.currentTarget.classList.add("active");

                const tabText = e.currentTarget.textContent.trim();
                let filter = "Pending";
                if (tabText.includes("Overdue")) filter = "Overdue";
                else if (tabText.includes("Completed")) filter = "Completed";

                renderTasks(filter);
            });
        });
    }

    // Utility Helpers
    function formatDate(dateString) {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    function formatTime(dateString) {
        if (!dateString) return "";
        return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    }

    function formatDateLabel(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString() ? "Today" : formatDate(dateString);
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, match => {
            const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return chars[match];
        });
    }

});

