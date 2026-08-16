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

    const participantEmails = [];
    initParticipants(participantEmails);

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

    // Set default date to today and block past dates on this page only
    const dateInput = document.getElementById("date");
    if (dateInput) {
        const today = getTodayInputValue();
        dateInput.min = today;
        if (!dateInput.value) dateInput.value = today;
    }
});

function initParticipants(participantEmails) {
    const addBtn = document.querySelector(".add-participant-btn");
    const entry = document.getElementById("participantEntry");
    const input = document.getElementById("participantEmailInput");
    const saveBtn = document.getElementById("saveParticipantBtn");
    const chips = document.getElementById("participantChips");

    if (!addBtn || !entry || !input || !saveBtn || !chips) return;

    function renderParticipants() {
        chips.innerHTML = participantEmails.map(email => `
            <span class="participant-chip">
                ${escapeHtml(email)}
                <button type="button" data-email="${escapeHtml(email)}" aria-label="Remove participant">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </span>
        `).join("");

        chips.querySelectorAll("button[data-email]").forEach(btn => {
            btn.addEventListener("click", () => {
                const email = btn.getAttribute("data-email");
                const index = participantEmails.indexOf(email);
                if (index >= 0) participantEmails.splice(index, 1);
                renderParticipants();
            });
        });
    }

    function addParticipant() {
        const email = input.value.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast("Please enter a valid participant email", "error");
            return;
        }
        if (participantEmails.includes(email)) {
            showToast("Participant already added", "error");
            return;
        }

        participantEmails.push(email);
        input.value = "";
        entry.hidden = true;
        renderParticipants();
    }

    addBtn.addEventListener("click", () => {
        entry.hidden = !entry.hidden;
        if (!entry.hidden) input.focus();
    });
    saveBtn.addEventListener("click", addParticipant);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addParticipant();
        }
    });
}

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
    const today = getTodayInputValue();
    const dateVal = date ? date.value : today;
    const timeVal = time ? time.value : "10:00";
    const meetingDateValue = new Date(`${dateVal}T${timeVal}:00`);

    if (Number.isNaN(meetingDateValue.getTime())) {
        showToast("Please choose a valid meeting date and time", "error");
        return;
    }

    if (dateVal < today) {
        showToast("Please choose today or a future date", "error");
        return;
    }

    const meetingDate = meetingDateValue.toISOString();

    // Get workspace ID
    let workspaceId = null;
    if (workspaceSelect && workspaceSelect.value) {
        workspaceId = parseInt(workspaceSelect.value);
    } else {
        const resolved = await getCurrentWorkspaceId();
        if (resolved) workspaceId = parseInt(resolved);
    }

    if (!workspaceId) {
        showToast("Please create or select a workspace first", "error");
        return;
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
