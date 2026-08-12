// ==========================================
// MEETFLOW MEETINGS PAGE — FULL BACKEND INTEGRATION
// ==========================================
// Depends on: ../api.js (loaded first)

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    // Sidebar Toggle
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

    // State
    let allMeetings = [];
    let currentTab = "upcoming";

    // Tab Switching
    const tabButtons = document.querySelectorAll("#meetingsTabs .tab-btn");
    tabButtons.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabButtons.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            currentTab = tab.getAttribute("data-tab") || "upcoming";
            renderMeetings();
        });
    });

    // Load meetings on page load
    loadMeetings();

    // ------------------------------------------
    // Load Meetings (GET /api/Meetings/workspace/{workspaceId})
    // ------------------------------------------
    async function loadMeetings() {
        const workspaceId = localStorage.getItem("currentWorkspaceId") || 1;
        const meetings = await fetchAPI(`/api/Meetings/workspace/${workspaceId}`);

        if (meetings && Array.isArray(meetings)) {
            allMeetings = meetings;
        } else {
            allMeetings = [];
        }
        renderMeetings();
    }

    // ------------------------------------------
    // Render Meetings by Tab Filter
    // ------------------------------------------
    function renderMeetings() {
        const container = document.querySelector(".meetings-group-list");
        if (!container) return;

        container.innerHTML = "";

        const now = new Date();
        let filtered = [];

        if (currentTab === "upcoming") {
            filtered = allMeetings
                .filter(m => new Date(m.meetingDate) >= now)
                .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
        } else if (currentTab === "past") {
            filtered = allMeetings
                .filter(m => new Date(m.meetingDate) < now)
                .sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));
        } else if (currentTab === "cancelled") {
            // API doesn't have a cancelled status field, show empty for now
            filtered = [];
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px 20px; color:#94A3B8;">
                    <i class="fa-regular fa-calendar" style="font-size:48px; margin-bottom:12px; display:block; opacity:0.5;"></i>
                    <p style="font-size:15px;">No ${currentTab} meetings found.</p>
                </div>
            `;
            return;
        }

        // Group meetings by date
        const groups = {};
        filtered.forEach(m => {
            const label = formatDateLabel(m.meetingDate);
            if (!groups[label]) groups[label] = [];
            groups[label].push(m);
        });

        Object.entries(groups).forEach(([dateLabel, meetings]) => {
            const groupHtml = `
                <div class="date-group">
                    <span class="group-date-label">${escapeHtml(dateLabel)}</span>
                    ${meetings.map(m => `
                        <div class="meeting-row-item" data-meeting-id="${m.id}">
                            <div class="time-box">
                                <h4>${formatTime(m.meetingDate)}</h4>
                            </div>
                            <div class="info-box" style="flex:1; cursor:pointer;" onclick="viewMeetingDetails(${m.id})">
                                <h4>${escapeHtml(m.title)}</h4>
                                ${m.description ? `<p style="font-size:12px; color:#94A3B8; margin:2px 0 0;">${escapeHtml(m.description).substring(0, 60)}</p>` : ""}
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <button class="join-btn" onclick="viewMeetingDetails(${m.id})">View</button>
                                <button class="join-btn" style="background:#DC2626;" onclick="deleteMeetingById(${m.id})" title="Delete">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
            container.insertAdjacentHTML("beforeend", groupHtml);
        });
    }

    // Expose functions globally
    window.viewMeetingDetails = async function(meetingId) {
        const meeting = await fetchAPI(`/api/Meetings/${meetingId}`);
        if (!meeting) {
            showToast("Failed to load meeting details", "error");
            return;
        }

        // Load notes, tasks, and decisions for this meeting
        const [notes, tasks, decisions] = await Promise.all([
            fetchAPI(`/api/Meetings/${meetingId}/notes`),
            fetchAPI(`/api/meetings/${meetingId}/tasks`),
            fetchAPI(`/api/meetings/${meetingId}/decisions`)
        ]);

        showMeetingModal(meeting, notes || [], tasks || [], decisions || []);
    };

    window.deleteMeetingById = async function(meetingId) {
        if (!confirm("Are you sure you want to delete this meeting?")) return;

        try {
            const response = await fetchAPI(`/api/Meetings/${meetingId}`, { method: "DELETE" });
            showToast("Meeting deleted successfully");
            await loadMeetings();
        } catch (e) {
            showToast("Failed to delete meeting", "error");
        }
    };

    // ------------------------------------------
    // Meeting Details Modal
    // ------------------------------------------
    function showMeetingModal(meeting, notes, tasks, decisions) {
        // Remove existing modal
        const existingModal = document.getElementById("meetingDetailModal");
        if (existingModal) existingModal.remove();

        const modal = document.createElement("div");
        modal.id = "meetingDetailModal";
        modal.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999;
            background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center;
            animation: fadeIn 0.2s ease;
        `;

        modal.innerHTML = `
            <div style="background:#fff; border-radius:16px; width:90%; max-width:700px; max-height:85vh;
                        overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); padding:32px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="margin:0; font-size:22px; color:#1E293B;">${escapeHtml(meeting.title)}</h2>
                    <button onclick="document.getElementById('meetingDetailModal').remove()"
                            style="background:none; border:none; font-size:24px; cursor:pointer; color:#64748B;">&times;</button>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                    <div style="background:#F8FAFC; padding:12px; border-radius:10px;">
                        <small style="color:#94A3B8;">Date & Time</small>
                        <p style="margin:4px 0 0; font-weight:600; color:#1E293B;">${formatFullDate(meeting.meetingDate)} at ${formatTime(meeting.meetingDate)}</p>
                    </div>
                    <div style="background:#F8FAFC; padding:12px; border-radius:10px;">
                        <small style="color:#94A3B8;">Created By</small>
                        <p style="margin:4px 0 0; font-weight:600; color:#1E293B;">${escapeHtml(meeting.createdByName || "Unknown")}</p>
                    </div>
                </div>

                ${meeting.description ? `<p style="color:#475569; margin-bottom:20px;">${escapeHtml(meeting.description)}</p>` : ""}

                <!-- Notes Section -->
                <div style="margin-bottom:20px;">
                    <h3 style="font-size:16px; color:#1E293B; margin-bottom:10px;">
                        <i class="fa-regular fa-note-sticky" style="margin-right:6px;"></i> Notes (${notes.length})
                    </h3>
                    ${notes.length > 0 ? notes.map(n => `
                        <div style="background:#F8FAFC; padding:12px; border-radius:8px; margin-bottom:8px; position:relative;">
                            <p style="margin:0; color:#475569; font-size:14px;">${escapeHtml(n.content)}</p>
                            <small style="color:#94A3B8;">${escapeHtml(n.createdByName || "")} • ${formatDate(n.createdAt)}</small>
                            <button onclick="deleteNote(${meeting.id}, ${n.id})" style="position:absolute; top:8px; right:8px; background:none; border:none; color:#DC2626; cursor:pointer; font-size:12px;"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    `).join("") : '<p style="color:#94A3B8; font-size:13px;">No notes yet.</p>'}
                    <div style="display:flex; gap:8px; margin-top:8px;">
                        <input type="text" id="newNoteInput" placeholder="Add a note..."
                               style="flex:1; padding:10px 14px; border:1px solid #E2E8F0; border-radius:8px; font-size:13px;">
                        <button onclick="addNote(${meeting.id})"
                                style="padding:10px 18px; background:#3461FF; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:13px;">Add</button>
                    </div>
                </div>

                <!-- Decisions Section -->
                <div style="margin-bottom:20px;">
                    <h3 style="font-size:16px; color:#1E293B; margin-bottom:10px;">
                        <i class="fa-solid fa-gavel" style="margin-right:6px;"></i> Decisions (${decisions.length})
                    </h3>
                    ${decisions.length > 0 ? decisions.map(d => `
                        <div style="background:#FEF3C7; padding:12px; border-radius:8px; margin-bottom:8px; border-left:3px solid #F59E0B; position:relative;">
                            <p style="margin:0; color:#92400E; font-size:14px;">${escapeHtml(d.description)}</p>
                            <small style="color:#B45309;">${formatDate(d.createdAt)}</small>
                            <button onclick="deleteDecision(${meeting.id}, ${d.id})" style="position:absolute; top:8px; right:8px; background:none; border:none; color:#DC2626; cursor:pointer; font-size:12px;"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    `).join("") : '<p style="color:#94A3B8; font-size:13px;">No decisions yet.</p>'}
                    <div style="display:flex; gap:8px; margin-top:8px;">
                        <input type="text" id="newDecisionInput" placeholder="Add a decision..."
                               style="flex:1; padding:10px 14px; border:1px solid #E2E8F0; border-radius:8px; font-size:13px;">
                        <button onclick="addDecision(${meeting.id})"
                                style="padding:10px 18px; background:#F59E0B; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:13px;">Add</button>
                    </div>
                </div>

                <!-- Tasks Section -->
                <div>
                    <h3 style="font-size:16px; color:#1E293B; margin-bottom:10px;">
                        <i class="fa-solid fa-list-check" style="margin-right:6px;"></i> Tasks (${tasks.length})
                    </h3>
                    ${tasks.length > 0 ? tasks.map(t => `
                        <div style="background:#F8FAFC; padding:12px; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" ${t.status === "Completed" ? "checked" : ""}
                                   onchange="updateMeetingTaskStatus(${meeting.id}, ${t.id}, this.checked)"
                                   style="width:18px; height:18px;">
                            <div style="flex:1;">
                                <p style="margin:0; font-size:14px; color:#1E293B; ${t.status === 'Completed' ? 'text-decoration:line-through; opacity:0.6;' : ''}">${escapeHtml(t.title)}</p>
                                <small style="color:#94A3B8;">${escapeHtml(t.assignedToName || "Unassigned")} • ${formatDate(t.dueDate)}</small>
                            </div>
                            <span style="font-size:11px; padding:3px 8px; border-radius:4px; background:${t.priority === 'High' ? '#FEE2E2' : t.priority === 'Low' ? '#DCFCE7' : '#FEF3C7'}; color:${t.priority === 'High' ? '#DC2626' : t.priority === 'Low' ? '#16A34A' : '#D97706'};">${t.priority || "Medium"}</span>
                        </div>
                    `).join("") : '<p style="color:#94A3B8; font-size:13px;">No tasks yet.</p>'}
                </div>
            </div>
        `;

        // Close on backdrop click
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    // ------------------------------------------
    // Notes CRUD
    // ------------------------------------------
    window.addNote = async function(meetingId) {
        const input = document.getElementById("newNoteInput");
        const content = input ? input.value.trim() : "";
        if (!content) { showToast("Please enter a note", "error"); return; }

        const result = await fetchAPI(`/api/Meetings/${meetingId}/notes`, {
            method: "POST",
            body: JSON.stringify({ content: content })
        });

        if (result) {
            showToast("Note added");
            viewMeetingDetails(meetingId);
        } else {
            showToast("Failed to add note", "error");
        }
    };

    window.deleteNote = async function(meetingId, noteId) {
        if (!confirm("Delete this note?")) return;
        await fetchAPI(`/api/Meetings/${meetingId}/notes/${noteId}`, { method: "DELETE" });
        showToast("Note deleted");
        viewMeetingDetails(meetingId);
    };

    // ------------------------------------------
    // Decisions CRUD
    // ------------------------------------------
    window.addDecision = async function(meetingId) {
        const input = document.getElementById("newDecisionInput");
        const description = input ? input.value.trim() : "";
        if (!description) { showToast("Please enter a decision", "error"); return; }

        const result = await fetchAPI(`/api/meetings/${meetingId}/decisions`, {
            method: "POST",
            body: JSON.stringify({ description: description })
        });

        if (result) {
            showToast("Decision added");
            viewMeetingDetails(meetingId);
        } else {
            showToast("Failed to add decision", "error");
        }
    };

    window.deleteDecision = async function(meetingId, decisionId) {
        if (!confirm("Delete this decision?")) return;
        await fetchAPI(`/api/meetings/${meetingId}/decisions/${decisionId}`, { method: "DELETE" });
        showToast("Decision deleted");
        viewMeetingDetails(meetingId);
    };

    // ------------------------------------------
    // Task Status Update from Modal
    // ------------------------------------------
    window.updateMeetingTaskStatus = async function(meetingId, taskId, isChecked) {
        const newStatus = isChecked ? "Completed" : "Pending";
        await fetchAPI(`/api/meetings/${meetingId}/tasks/${taskId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus })
        });
        showToast(`Task marked as ${newStatus}`);
    };
});