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
