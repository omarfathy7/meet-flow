// ==========================================
// MEETFLOW — SHARED API SERVICE LAYER
// ==========================================
// Include this file via <script src="../api.js"></script>
// BEFORE the page-specific JS file.

const BASE_URL = "https://meetflow.runasp.net";

// ------------------------------------------
// Core API Fetch Wrapper
// ------------------------------------------
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem("accessToken");
    const defaultHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        // Auto-refresh on 401
        if (response.status === 401) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                // Retry the original request with new token
                const newToken = localStorage.getItem("accessToken");
                const retryHeaders = {
                    ...defaultHeaders,
                    ...options.headers,
                    "Authorization": `Bearer ${newToken}`
                };
                const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
                    ...options,
                    headers: retryHeaders
                });
                if (!retryResponse.ok) {
                    console.warn(`API retry failed: ${retryResponse.status}`);
                    return null;
                }
                const retryText = await retryResponse.text();
                return retryText ? JSON.parse(retryText) : {};
            } else {
                console.warn("Session expired. Redirecting to login.");
                handleSessionExpired();
                return null;
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error ${response.status}: ${errorText}`);
            throw new Error(errorText || `API Error: ${response.status}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

// ------------------------------------------
// Token Refresh (POST /api/Auth/refresh-token)
// ------------------------------------------
async function tryRefreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    const accessToken = localStorage.getItem("accessToken");

    if (!refreshToken) {
        alert("Debug Info: No refresh token found in localStorage. The backend might not have sent it during login.");
        return false;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/Auth/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ refreshToken: refreshToken })
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(`Debug Info: Backend rejected the refresh token.\nStatus: ${response.status}\nMessage: ${errorText}\n\nThis means the backend's refresh token expired or is invalid.`);
            console.error(`Token refresh failed with status ${response.status}:`, errorText);
            return false;
        }

        const data = await response.json();
        if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
        }
        if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
        }
        if (data.userId) {
            localStorage.setItem("userId", data.userId);
        }
        return true;
    } catch (error) {
        alert(`Debug Info: Network error while trying to refresh token: ${error.message}`);
        console.error("Token refresh network/parsing error:", error);
        return false;
    }
}

// ------------------------------------------
// Logout (POST /api/Auth/logout)
// ------------------------------------------
async function apiLogout() {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
        await fetch(`${BASE_URL}/api/Auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify({ refreshToken: refreshToken || "" })
        });
    } catch (e) {
        console.warn("Logout request failed:", e);
    }
    clearSession();
}

// ------------------------------------------
// Logout All Sessions (POST /api/Auth/logout-all)
// ------------------------------------------
async function apiLogoutAll() {
    try {
        await fetch(`${BASE_URL}/api/Auth/logout-all`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            }
        });
    } catch (e) {
        console.warn("Logout-all request failed:", e);
    }
    clearSession();
}

// ------------------------------------------
// Session Helpers
// ------------------------------------------
function clearSession() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userData");
    localStorage.removeItem("currentWorkspaceId");
}

function handleSessionExpired() {
    clearSession();
    // Avoid redirect loop if already on login page
    if (!window.location.pathname.includes("LogIn")) {
        window.location.href = getRelativePath("LogIn/LogIn.html");
    }
}

function getRelativePath(target) {
    // Detect depth from project root based on current URL
    const path = window.location.pathname;
    const parts = path.split("/").filter(p => p.length > 0);
    // If we're inside a subfolder (e.g., /Dashboard/Dashboard.html), go up one level
    if (parts.length >= 2) {
        return `../${target}`;
    }
    return target;
}

// ------------------------------------------
// Auth Guard — redirect to login if no token
// ------------------------------------------
function requireAuth() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        handleSessionExpired();
        return false;
    }
    return true;
}

// ------------------------------------------
// Utility Helpers
// ------------------------------------------
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, match => {
        const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return chars[match];
    });
}

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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return formatDate(dateString);
}

function formatFullDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short", year: "numeric", month: "short", day: "numeric"
    });
}

function getInitials(fullName) {
    if (!fullName) return "U";
    const parts = fullName.trim().split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : "U";
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function getTodayInputValue() {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split("T")[0];
}

async function getCurrentWorkspaceId() {
    const stored = localStorage.getItem("currentWorkspaceId");
    if (stored) return stored;

    const workspaces = await fetchAPI("/api/Workspaces");
    if (Array.isArray(workspaces) && workspaces.length > 0) {
        const workspaceId = String(workspaces[0].id);
        localStorage.setItem("currentWorkspaceId", workspaceId);
        return workspaceId;
    }

    return null;
}

async function loadHeaderProfile() {
    const userData = await getCurrentUserProfile();
    if (!userData) return null;

    document.querySelectorAll(".header-user-name, .profile span, .user-name").forEach(el => {
        el.textContent = userData.fullName || "User";
    });
    document.querySelectorAll(".header-user-role, .user-role").forEach(el => {
        el.textContent = userData.role || "Member";
    });
    document.querySelectorAll(".header-avatar").forEach(el => {
        el.textContent = getInitials(userData.fullName || "User");
    });
    document.querySelectorAll(".user-profile .avatar").forEach(el => {
        el.textContent = getInitials(userData.fullName || "User");
    });
    document.querySelectorAll(".profile img").forEach(img => {
        const name = encodeURIComponent(userData.fullName || "User");
        img.src = `https://ui-avatars.com/api/?name=${name}&background=EEF3FF&color=3461FF`;
        img.alt = userData.fullName || "Profile";
    });

    return userData;
}

async function getCurrentUserProfile() {
    const apiUser = await fetchAPI("/api/User/me");
    if (apiUser) {
        const normalized = normalizeUserProfile(apiUser);
        localStorage.setItem("userData", JSON.stringify(normalized));
        return normalized;
    }

    try {
        const stored = JSON.parse(localStorage.getItem("userData") || "null");
        if (stored) return normalizeUserProfile(stored);
    } catch (error) {
        console.warn("Invalid stored user data:", error);
    }

    const storedName = localStorage.getItem("fullName") || localStorage.getItem("userName");
    const storedRole = localStorage.getItem("role");
    if (storedName || storedRole) {
        return {
            id: localStorage.getItem("userId"),
            fullName: storedName || "User",
            role: storedRole || "Member"
        };
    }

    return null;
}

function normalizeUserProfile(user) {
    const storedName = localStorage.getItem("fullName") || localStorage.getItem("userName");
    const storedRole = localStorage.getItem("role");
    const id = user?.id ?? user?.userId ?? localStorage.getItem("userId") ?? "";

    return {
        ...user,
        id,
        userId: user?.userId ?? id,
        fullName: user?.fullName || user?.name || storedName || "User",
        role: user?.role || storedRole || "Member"
    };
}

async function loadNotifications() {
    // No notifications endpoint exists in the current backend Swagger.
    return [];
}

function ensureNotificationDropdownStyles() {
    if (document.getElementById("notification-dropdown-styles")) return;

    const style = document.createElement("style");
    style.id = "notification-dropdown-styles";
    style.textContent = `
        .notification-menu-wrap { position: relative; }
        .app-notification-dropdown {
            position: absolute; top: calc(100% + 10px); right: 0; width: 320px;
            background: #fff; border: 1px solid #E2E8F0; border-radius: 12px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14); padding: 12px;
            z-index: 3000; display: none;
        }
        .notification-menu-wrap { display: inline-flex; }
        .app-notification-dropdown.show { display: block; }
        .app-notification-head {
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; padding: 4px 4px 10px; border-bottom: 1px solid #F1F5F9;
        }
        .app-notification-head h3 { margin: 0; font-size: 14px; color: #0F172A; }
        .app-notification-view {
            color: #3461FF; font-size: 12px; font-weight: 700; text-decoration: none;
            white-space: nowrap;
        }
        .app-notification-empty {
            padding: 24px 10px; text-align: center; color: #64748B; font-size: 13px;
        }
        .app-notification-item {
            display: flex; gap: 10px; padding: 12px 4px; border-bottom: 1px solid #F8FAFC;
        }
        .app-notification-item:last-child { border-bottom: 0; }
        .app-notification-item strong { display: block; color: #0F172A; font-size: 13px; }
        .app-notification-item span { color: #64748B; font-size: 12px; line-height: 1.4; }
        @media (max-width: 576px) {
            .app-notification-dropdown { right: -48px; width: min(320px, calc(100vw - 32px)); }
        }
    `;
    document.head.appendChild(style);
}

async function initNotificationDropdown(options = {}) {
    const button = document.querySelector(options.buttonSelector || '.notification-btn, .notification, [aria-label="Notifications"]');
    if (!button) return;
    if (button.dataset.notificationReady === "true") return;
    button.dataset.notificationReady = "true";

    ensureNotificationDropdownStyles();

    const viewUrl = options.viewUrl || getRelativePath("Notifications/Notifications.html");
    const wrapper = button.parentElement && button.parentElement.classList.contains("notification-menu-wrap")
        ? button.parentElement
        : document.createElement("div");

    if (!wrapper.classList.contains("notification-menu-wrap")) {
        button.parentNode.insertBefore(wrapper, button);
        wrapper.appendChild(button);
    }

    let dropdown = wrapper.querySelector(".app-notification-dropdown");
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.className = "app-notification-dropdown";
        wrapper.appendChild(dropdown);
    }

    const notifications = await loadNotifications();
    const unread = notifications.filter(n => !n.isRead).length;
    document.querySelectorAll(".notification-badge").forEach(badge => {
        badge.textContent = unread;
        badge.style.display = "flex";
    });
    button.classList.toggle("has-zero", unread === 0);

    const latest = notifications.slice(0, 3);
    dropdown.innerHTML = `
        <div class="app-notification-head">
            <h3>Notifications</h3>
            <a class="app-notification-view" href="${viewUrl}">View all notifications</a>
        </div>
        ${latest.length ? latest.map(item => `
            <div class="app-notification-item">
                <i class="fa-regular fa-bell"></i>
                <div>
                    <strong>${escapeHtml(item.title || "Notification")}</strong>
                    <span>${escapeHtml(item.message || "")}</span>
                </div>
            </div>
        `).join("") : '<div class="app-notification-empty">No notifications yet.</div>'}
    `;

    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropdown.classList.toggle("show");
    });

    document.addEventListener("click", (event) => {
        if (!wrapper.contains(event.target)) {
            dropdown.classList.remove("show");
        }
    });
}

function normalizeSidebarNav() {
    const iconMap = [
        ["Dashboard", "fa-solid fa-table-columns"],
        ["Meetings", "fa-regular fa-calendar"],
        ["Tasks", "fa-solid fa-check"],
        ["Follow-Ups", "fa-solid fa-arrow-turn-up"],
        ["Calender", "fa-regular fa-calendar-days"],
        ["Analytics", "fa-solid fa-chart-line"],
        ["Team", "fa-solid fa-users"],
        ["Reports", "fa-regular fa-file-lines"],
        ["Integrations", "fa-solid fa-plug"],
        ["Settings", "fa-solid fa-gear"],
        ["Help&Support", "fa-regular fa-circle-question"]
    ];

    iconMap.forEach(([pathPart, iconClass]) => {
        document.querySelectorAll(`.sidebar a[href*="${pathPart}"] i`).forEach(icon => {
            icon.className = iconClass;
        });
    });

    if (!document.getElementById("sidebar-stability-styles")) {
        const style = document.createElement("style");
        style.id = "sidebar-stability-styles";
        style.textContent = `
            .sidebar nav {
                max-height: calc(100vh - 116px);
                overflow-y: auto;
                overflow-x: hidden;
                padding-right: 2px;
            }
            .sidebar nav::-webkit-scrollbar { width: 4px; }
            .sidebar nav::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 999px; }
            .sidebar.close nav ul li a { min-height: 46px; }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener("DOMContentLoaded", normalizeSidebarNav);
document.addEventListener("DOMContentLoaded", () => {
    const hasNotificationButton = document.querySelector('.notification-btn, .notification, [aria-label="Notifications"]');
    if (hasNotificationButton) initNotificationDropdown();
});

// ------------------------------------------
// Toast Notification Helper
// ------------------------------------------
function showToast(message, type = "success") {
    // Remove any existing toast
    const existing = document.getElementById("api-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "api-toast";
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 10000;
        padding: 14px 24px; border-radius: 10px; font-size: 14px;
        font-family: 'Inter', 'Segoe UI', sans-serif; font-weight: 500;
        color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        animation: toastSlideIn 0.35s ease; max-width: 380px;
        background: ${type === "success" ? "linear-gradient(135deg, #16A34A, #15803D)" :
            type === "error" ? "linear-gradient(135deg, #DC2626, #B91C1C)" :
                "linear-gradient(135deg, #2563EB, #1D4ED8)"};
    `;

    // Add animation keyframes if not present
    if (!document.getElementById("toast-keyframes")) {
        const style = document.createElement("style");
        style.id = "toast-keyframes";
        style.textContent = `
            @keyframes toastSlideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes toastSlideOut {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(20px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "toastSlideOut 0.35s ease forwards";
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}
