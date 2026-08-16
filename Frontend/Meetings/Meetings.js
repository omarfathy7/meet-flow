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

    loadHeaderProfile();
    initNotificationDropdown({ viewUrl: "../Notifications/Notifications.html" });

    // State
    let allMeetings = [];
    let currentTab = "upcoming";
    let activeMeetingContext = null;

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
        const workspaceId = await getCurrentWorkspaceId();
        if (!workspaceId) {
            allMeetings = [];
            renderMeetings();
            return;
        }
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
    window.viewMeetingDetails = async function (meetingId) {
        const meeting = await fetchAPI(`/api/Meetings/${meetingId}`);
        if (!meeting) {
            showToast("Failed to load meeting details", "error");
            return;
        }

        // Load notes, tasks, decisions, existing AI drafts, and workspace members for this meeting
        const [notes, tasks, decisions, drafts, participants] = await Promise.all([
            fetchAPI(`/api/Meetings/${meetingId}/notes`),
            fetchAPI(`/api/meetings/${meetingId}/tasks`),
            fetchAPI(`/api/meetings/${meetingId}/decisions`),
            fetchAPI(`/api/meetings/${meetingId}/task-drafts`),
            loadMeetingParticipants(meeting)
        ]);

        showMeetingModal(meeting, notes || [], tasks || [], decisions || [], drafts || [], participants || []);
    };

    async function loadMeetingParticipants(meeting) {
        if (!meeting?.workspaceId) {
            return meeting?.createdBy ? [{
                userId: meeting.createdBy,
                fullName: meeting.createdByName || "Organizer"
            }] : [];
        }

        const members = await fetchAPI(`/api/Workspaces/${meeting.workspaceId}/members`);
        if (Array.isArray(members) && members.length > 0) {
            return members.map(member => ({
                userId: member.userId,
                fullName: member.fullName || member.email || `User ${member.userId}`
            }));
        }

        return meeting.createdBy ? [{
            userId: meeting.createdBy,
            fullName: meeting.createdByName || "Organizer"
        }] : [];
    }

    window.deleteMeetingById = async function (meetingId) {
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
    function showMeetingModal(meeting, notes, tasks, decisions, drafts, participants) {
        // Remove existing modal
        const existingModal = document.getElementById("meetingDetailModal");
        if (existingModal) existingModal.remove();

        activeMeetingContext = {
            meeting,
            notes,
            decisions,
            participants
        };

        const canExtractWithAI = notes.length > 0 || decisions.length > 0;

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

                <!-- AI Task Drafts Section -->
                <div class="ai-task-section">
                    <div class="ai-task-head">
                        <div>
                            <h3>
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                                AI Task Suggestions
                            </h3>
                            <p>${canExtractWithAI ? "Review extracted task drafts before saving them." : "Add meeting notes or decisions before extracting tasks."}</p>
                        </div>
                        <button class="join-btn ai-extract-btn" id="extractTasksAiBtn" onclick="extractTasksWithAI(${meeting.id})" ${canExtractWithAI ? "" : "disabled"}>
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                            Extract Tasks with AI
                        </button>
                    </div>
                    <div id="aiTaskDraftsPanel" class="ai-drafts-panel"></div>
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
        renderAiTaskDrafts(drafts || []);
    }

    function buildAiExtractionPayload() {
        const context = activeMeetingContext;
        if (!context) return {};

        return {
            meeting_title: context.meeting.title || "",
            meeting_date: context.meeting.meetingDate ? context.meeting.meetingDate.split("T")[0] : null,
            participants: context.participants.map(participant => ({
                user_id: participant.userId,
                full_name: participant.fullName
            })),
            notes: context.notes.map(note => note.content).filter(Boolean),
            decisions: context.decisions.map(decision => decision.description).filter(Boolean)
        };
    }

    window.extractTasksWithAI = async function (meetingId) {
        const button = document.getElementById("extractTasksAiBtn");
        const panel = document.getElementById("aiTaskDraftsPanel");
        const originalText = button ? button.innerHTML : "";

        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Extracting...';
        }
        if (panel) {
            panel.innerHTML = '<p class="ai-draft-empty">Extracting task suggestions...</p>';
        }

        const drafts = await fetchAPI(`/api/meetings/${meetingId}/tasks/extract-from-notes`, {
            method: "POST",
            body: JSON.stringify(buildAiExtractionPayload())
        });

        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }

        if (!Array.isArray(drafts)) {
            if (panel) panel.innerHTML = `<p class="ai-draft-error">${escapeHtml(getApiErrorMessage("Failed to extract tasks with AI."))}</p>`;
            showToast(getApiErrorMessage("Failed to extract tasks with AI."), "error");
            return;
        }

        renderAiTaskDrafts(drafts);
        showToast(drafts.length ? "AI task suggestions are ready for review." : "AI did not find task suggestions.", drafts.length ? "success" : "info");
    };

    function renderAiTaskDrafts(drafts) {
        const panel = document.getElementById("aiTaskDraftsPanel");
        if (!panel) return;

        if (!Array.isArray(drafts) || drafts.length === 0) {
            panel.innerHTML = '<p class="ai-draft-empty">No task drafts yet.</p>';
            return;
        }

        panel.innerHTML = drafts.map(draft => `
            <div class="ai-draft-card" data-draft-id="${draft.id}" data-decision-id="${draft.decisionId || ""}">
                <div class="ai-draft-grid">
                    <label>
                        Title
                        <input class="ai-draft-title" type="text" value="${escapeHtml(draft.title || "")}">
                    </label>
                    <label>
                        Assignee
                        <select class="ai-draft-assignee">
                            <option value="">Unassigned</option>
                            ${buildParticipantOptions(draft.assignedTo, draft.assignedToName || draft.assigneeNameRaw)}
                        </select>
                    </label>
                    <label>
                        Priority
                        <select class="ai-draft-priority">
                            ${["Low", "Medium", "High"].map(priority => `
                                <option value="${priority}" ${(draft.priority || "Medium") === priority ? "selected" : ""}>${priority}</option>
                            `).join("")}
                        </select>
                    </label>
                    <label>
                        Deadline
                        <input class="ai-draft-due-date" type="date" value="${draft.dueDate ? draft.dueDate.split("T")[0] : ""}">
                    </label>
                </div>
                <label>
                    Description
                    <textarea class="ai-draft-description" rows="2">${escapeHtml(draft.description || "")}</textarea>
                </label>
                ${draft.decisionDescription ? `<p class="ai-draft-source">Decision: ${escapeHtml(draft.decisionDescription)}</p>` : ""}
                <div class="ai-draft-actions">
                    <button type="button" class="ai-secondary-btn" onclick="saveAiDraft(${draft.id})">Save changes</button>
                    <button type="button" class="ai-accept-btn" onclick="acceptAiDraft(${draft.id})">Accept</button>
                    <button type="button" class="ai-reject-btn" onclick="rejectAiDraft(${draft.id})">Reject</button>
                </div>
            </div>
        `).join("");
    }

    function buildParticipantOptions(selectedUserId, rawName) {
        const participants = activeMeetingContext?.participants || [];
        const selected = String(selectedUserId || "");
        const options = participants.map(participant => `
            <option value="${participant.userId}" ${String(participant.userId) === selected ? "selected" : ""}>
                ${escapeHtml(participant.fullName)}
            </option>
        `).join("");

        if (!selectedUserId && rawName) {
            return `<option value="" selected>${escapeHtml(rawName)} (unmatched)</option>${options}`;
        }

        return options;
    }

    function getDraftPayload(draftId) {
        const card = document.querySelector(`.ai-draft-card[data-draft-id="${draftId}"]`);
        if (!card) return null;

        const assignedTo = card.querySelector(".ai-draft-assignee")?.value || "";
        const dueDate = card.querySelector(".ai-draft-due-date")?.value || "";
        const decisionId = card.dataset.decisionId || "";

        return {
            title: card.querySelector(".ai-draft-title")?.value.trim() || "",
            description: card.querySelector(".ai-draft-description")?.value.trim() || null,
            assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
            decisionId: decisionId ? parseInt(decisionId, 10) : null,
            priority: card.querySelector(".ai-draft-priority")?.value || "Medium",
            dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null
        };
    }

    window.saveAiDraft = async function (draftId) {
        const meetingId = activeMeetingContext?.meeting?.id;
        const payload = getDraftPayload(draftId);
        if (!meetingId || !payload) return null;
        if (!payload.title) {
            showToast("Draft title is required.", "error");
            return null;
        }

        const result = await fetchAPI(`/api/meetings/${meetingId}/task-drafts/${draftId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        if (!result) {
            showToast(getApiErrorMessage("Failed to update draft."), "error");
            return null;
        }

        showToast("Draft updated.");
        return result;
    };

    window.acceptAiDraft = async function (draftId) {
        const meetingId = activeMeetingContext?.meeting?.id;
        if (!meetingId) return;

        const updated = await saveAiDraft(draftId);
        if (!updated) return;

        const result = await fetchAPI(`/api/meetings/${meetingId}/task-drafts/${draftId}/approve`, {
            method: "POST"
        });

        if (result) {
            showToast("Task created from AI draft.");
            viewMeetingDetails(meetingId);
        } else {
            showToast(getApiErrorMessage("Failed to accept draft."), "error");
        }
    };

    window.rejectAiDraft = async function (draftId) {
        const meetingId = activeMeetingContext?.meeting?.id;
        if (!meetingId) return;
        if (!confirm("Reject this AI task draft?")) return;

        const result = await fetchAPI(`/api/meetings/${meetingId}/task-drafts/${draftId}`, {
            method: "DELETE"
        });

        if (result !== null) {
            showToast("Draft rejected.");
            const drafts = await fetchAPI(`/api/meetings/${meetingId}/task-drafts`);
            renderAiTaskDrafts(Array.isArray(drafts) ? drafts : []);
        } else {
            showToast(getApiErrorMessage("Failed to reject draft."), "error");
        }
    };

    // ------------------------------------------
    // Notes CRUD
    // ------------------------------------------
    window.addNote = async function (meetingId) {
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

    window.deleteNote = async function (meetingId, noteId) {
        if (!confirm("Delete this note?")) return;
        await fetchAPI(`/api/Meetings/${meetingId}/notes/${noteId}`, { method: "DELETE" });
        showToast("Note deleted");
        viewMeetingDetails(meetingId);
    };

    // ------------------------------------------
    // Decisions CRUD
    // ------------------------------------------
    window.addDecision = async function (meetingId) {
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

    window.deleteDecision = async function (meetingId, decisionId) {
        if (!confirm("Delete this decision?")) return;
        await fetchAPI(`/api/meetings/${meetingId}/decisions/${decisionId}`, { method: "DELETE" });
        showToast("Decision deleted");
        viewMeetingDetails(meetingId);
    };

    // ------------------------------------------
    // Task Status Update from Modal
    // ------------------------------------------
    window.updateMeetingTaskStatus = async function (meetingId, taskId, isChecked) {
        const newStatus = isChecked ? "Completed" : "Pending";
        await fetchAPI(`/api/meetings/${meetingId}/tasks/${taskId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus })
        });
        showToast(`Task marked as ${newStatus}`);
    };
});
