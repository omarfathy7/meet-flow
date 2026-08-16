document.addEventListener("DOMContentLoaded", async () => {
    if (!requireAuth()) return;

    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.querySelector(".sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                document.body.classList.toggle("mobile-menu-open");
            } else {
                sidebar.classList.toggle("close");
                document.body.classList.toggle("sidebar-closed");
            }
        });
    }

    await loadHeaderProfile();
    await initNotificationDropdown({ viewUrl: "Notifications.html" });
    initNotificationFilters();
    await renderNotificationsPage();
});

let currentNotifications = [];

async function renderNotificationsPage() {
    const notifications = await loadNotifications();
    currentNotifications = Array.isArray(notifications) ? notifications : [];
    renderNotificationList();
}

function initNotificationFilters() {
    const search = document.getElementById("notificationSearch");
    const filterType = document.getElementById("filterType");
    const filterDate = document.getElementById("filterDate");
    const tabs = document.querySelectorAll(".notification-tab");

    search?.addEventListener("input", renderNotificationList);
    filterType?.addEventListener("change", renderNotificationList);
    filterDate?.addEventListener("change", renderNotificationList);

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(item => item.classList.remove("active"));
            tab.classList.add("active");
            if (filterType) filterType.value = tab.dataset.filter || "all";
            renderNotificationList();
        });
    });
}

function renderNotificationList() {
    const notifications = getFilteredNotifications();
    const list = document.getElementById("notificationsList");
    const emptyState = document.getElementById("emptyState");
    const unreadCount = document.getElementById("unreadCount");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const markAllReadBtn = document.getElementById("markAllReadBtn");
    const clearAllBtn = document.getElementById("clearAllBtn");

    const unread = currentNotifications.filter(item => !item.isRead).length;
    if (unreadCount) unreadCount.textContent = unread;
    document.querySelectorAll(".notification-badge").forEach(badge => {
        badge.textContent = unread;
        badge.style.display = "flex";
    });

    if (markAllReadBtn) markAllReadBtn.disabled = currentNotifications.length === 0;
    if (clearAllBtn) clearAllBtn.disabled = currentNotifications.length === 0;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";

    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = "";
        if (emptyState) emptyState.classList.add("show");
        return;
    }

    if (emptyState) emptyState.classList.remove("show");
    list.innerHTML = notifications.map(item => `
        <div class="notification-item ${item.isRead ? "" : "unread"}" data-type="${escapeHtml(item.type || "system")}">
            <div class="notification-icon ${escapeHtml(item.type || "system")}">
                <i class="fa-regular fa-bell"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title-row">
                    <h3>${escapeHtml(item.title || "Notification")}</h3>
                    <span class="notification-dot"></span>
                </div>
                <p>${escapeHtml(item.message || "")}</p>
                <span class="notification-time">
                    <i class="fa-regular fa-clock"></i>
                    ${escapeHtml(item.createdAt ? formatDate(item.createdAt) : "")}
                </span>
            </div>
        </div>
    `).join("");
}

function getFilteredNotifications() {
    const searchTerm = (document.getElementById("notificationSearch")?.value || "").toLowerCase().trim();
    const type = document.getElementById("filterType")?.value || "all";
    const dateFilter = document.getElementById("filterDate")?.value || "all";

    return currentNotifications.filter(item => {
        const matchesSearch = !searchTerm || `${item.title || ""} ${item.message || ""}`.toLowerCase().includes(searchTerm);
        const matchesType = type === "all" || (type === "unread" ? !item.isRead : item.type === type);
        const matchesDate = dateFilter === "all" || matchesNotificationDate(item.createdAt, dateFilter);
        return matchesSearch && matchesType && matchesDate;
    });
}

function matchesNotificationDate(createdAt, dateFilter) {
    if (!createdAt) return false;
    const date = new Date(createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateFilter === "today") return date.toDateString() === today.toDateString();
    if (dateFilter === "yesterday") return date.toDateString() === yesterday.toDateString();
    return true;
}
