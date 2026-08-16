// ==========================================
// MEETFLOW CREATE MEETING — BACKEND INTEGRATION
// ==========================================
// Depends on: ../api.js (loaded first)

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    // Sidebar Toggle
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.querySelector(".main-content");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle("open");
            } else {
                sidebar.classList.toggle("close");
                if (mainContent) mainContent.classList.toggle("expand");
            }
        });
    }

    // Load workspaces for selection
    loadWorkspaces();

    // Form submission
    const form = document.getElementById("createMeetingForm");
    const cancelBtn = document.querySelector(".btn-cancel");

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            window.location.href = "../Meetings/Meetings.html";
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await createMeeting();
        });
    }

    // Set default date to today
    const dateInput = document.getElementById("date");
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }
});

// ------------------------------------------
// Load Workspaces for Dropdown (GET /api/Workspaces)
// ------------------------------------------
async function loadWorkspaces() {
    const workspaces = await fetchAPI("/api/Workspaces");

    const select = document.getElementById("workspaceSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = '<option value="" disabled selected>Select workspace</option>';

    if (workspaces && Array.isArray(workspaces)) {
        workspaces.forEach(ws => {
            const option = document.createElement("option");
            option.value = ws.id;
            option.textContent = ws.name || `Workspace ${ws.id}`;
            select.appendChild(option);
        });

        // Auto-select if there's a stored workspace ID
        const currentWsId = localStorage.getItem("currentWorkspaceId");
        if (currentWsId) {
            select.value = currentWsId;
        }

        // Auto-select if only one workspace exists
        if (workspaces.length === 1) {
            select.value = workspaces[0].id;
        }
    }
}

// ------------------------------------------
// Create Meeting (POST /api/Meetings)
// ------------------------------------------
async function createMeeting() {
    const title = document.getElementById("title");
    const date = document.getElementById("date");
    const time = document.getElementById("time");
    const agenda = document.getElementById("agenda");
    const workspaceSelect = document.getElementById("workspaceSelect");
    const addToCalendar = document.getElementById("addToCalendar");

    if (!title || !title.value.trim()) {
        showToast("Please enter a meeting title", "error");
        return;
    }

    // Build meetingDate from date + time inputs
    const dateVal = date ? date.value : new Date().toISOString().split("T")[0];
    const timeVal = time ? time.value : "10:00";
    const meetingDateValue = new Date(`${dateVal}T${timeVal}:00`);

    if (Number.isNaN(meetingDateValue.getTime())) {
        showToast("Please choose a valid meeting date and time", "error");
        return;
    }

    const meetingDate = meetingDateValue.toISOString();

    // Get workspace ID
    let workspaceId = 1;
    if (workspaceSelect && workspaceSelect.value) {
        workspaceId = parseInt(workspaceSelect.value);
    } else {
        const stored = localStorage.getItem("currentWorkspaceId");
        if (stored) workspaceId = parseInt(stored);
    }

    const payload = {
        workspaceId: workspaceId,
        title: title.value.trim(),
        description: agenda ? agenda.value.trim() : "",
        meetingDate: meetingDate
    };

    // Disable submit button
    const submitBtn = document.querySelector(".btn-create");
    const originalText = submitBtn ? submitBtn.textContent : "Create Meeting";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating...";
    }

    try {
        const result = await fetchAPI("/api/Meetings", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (result) {
            showToast("Meeting created successfully!");
            // Store workspace ID for future use
            localStorage.setItem("currentWorkspaceId", workspaceId);
            showCalendarResult({
                title: payload.title,
                description: payload.description,
                startDate: meetingDateValue,
                enabled: !addToCalendar || addToCalendar.checked
            });
        } else {
            showToast("Failed to create meeting", "error");
        }
    } catch (error) {
        showToast("Error creating meeting", "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

function showCalendarResult({ title, description, startDate, enabled }) {
    const resultPanel = document.getElementById("calendarResult");
    const calendarLink = document.getElementById("googleCalendarLink");
    const resultMessage = document.getElementById("calendarResultMessage");
    const formActions = document.querySelector(".form-actions");

    if (!resultPanel) return;

    if (enabled && calendarLink) {
        calendarLink.href = buildGoogleCalendarUrl(title, description, startDate);
        calendarLink.hidden = false;
        if (resultMessage) {
            resultMessage.textContent = "Your meeting is saved in MeetFlow. Add it to Google Calendar when you are ready.";
        }
    } else if (calendarLink) {
        calendarLink.hidden = true;
        if (resultMessage) {
            resultMessage.textContent = "Your meeting is saved in MeetFlow.";
        }
    }

    resultPanel.hidden = false;
    if (formActions) formActions.hidden = true;
    resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function buildGoogleCalendarUrl(title, description, startDate) {
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: title,
        dates: `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`,
        details: description || "Created from MeetFlow"
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatGoogleCalendarDate(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
