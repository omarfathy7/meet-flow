// ==========================================
// MEETFLOW TASKS PAGE — FULL BACKEND INTEGRATION
// ==========================================
// Depends on: ../api.js (loaded first)

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    // 1. Toggle Sidebar
    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.querySelector(".sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("close");
            document.body.classList.toggle("sidebar-closed");
        });
    }

    // 2. Priority Selection Handling
    const priorityButtons = document.querySelectorAll(".priority-btn");
    let selectedPriority = "High";

    priorityButtons.forEach(btn => {
        if (btn.classList.contains("low")) btn.setAttribute("data-priority", "Low");
        if (btn.classList.contains("medium")) btn.setAttribute("data-priority", "Medium");
        if (btn.classList.contains("high")) btn.setAttribute("data-priority", "High");

        btn.addEventListener("click", () => {
            priorityButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedPriority = btn.getAttribute("data-priority");
        });
    });

    // 3. State
    let allTasks = [];
    let editingTaskId = null;
    let editingMeetingId = null;

    // 4. Set Default Date
    const deadlineInput = document.getElementById("taskDeadline");
    if (deadlineInput) {
        deadlineInput.value = new Date().toISOString().split("T")[0];
    }

    // 5. Load data on init
    loadMyTasks();
    loadMeetingsForSelect();
    loadWorkspaceMembersForAssignee();

    // 6. Form submission
    const taskForm = document.getElementById("taskForm");
    const cancelBtn = document.querySelector(".btn-cancel");

    if (taskForm) {
        taskForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (editingTaskId) {
                await updateTask();
            } else {
                await createTask();
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetForm();
        });
    }

    // ------------------------------------------
    // Load My Tasks (GET /api/tasks/my)
    // ------------------------------------------
    async function loadMyTasks() {
        const tasks = await fetchAPI("/api/tasks/my");
        if (tasks && Array.isArray(tasks)) {
            allTasks = tasks;
        } else {
            allTasks = [];
        }
        renderTasks();
    }

    // ------------------------------------------
    // Load Meetings for Select Dropdown
    // ------------------------------------------
    async function loadMeetingsForSelect() {
        const workspaceId = localStorage.getItem("currentWorkspaceId") || 1;
        const meetings = await fetchAPI(`/api/Meetings/workspace/${workspaceId}`);

        const projectSelect = document.getElementById("taskProject");
        if (!projectSelect) return;

        projectSelect.innerHTML = '<option value="" disabled selected>Select meeting</option>';

        if (meetings && Array.isArray(meetings)) {
            meetings.forEach(m => {
                const option = document.createElement("option");
                option.value = m.id;
                option.textContent = `${m.title} (${formatDate(m.meetingDate)})`;
                projectSelect.appendChild(option);
            });
        }
    }

    // ------------------------------------------
    // Load Workspace Members for Assignee Dropdown
    // ------------------------------------------
    async function loadWorkspaceMembersForAssignee() {
        const workspaceId = localStorage.getItem("currentWorkspaceId") || 1;
        const members = await fetchAPI(`/api/Workspaces/${workspaceId}/members`);

        const assigneeSelect = document.getElementById("taskAssignee");
        if (!assigneeSelect) return;

        assigneeSelect.innerHTML = '<option value="" disabled selected>Select assignee</option>';

        if (members && Array.isArray(members)) {
            members.forEach(member => {
                const option = document.createElement("option");
                option.value = member.userId;
                option.textContent = member.fullName || member.email;
                assigneeSelect.appendChild(option);
            });
        }
    }

    // ------------------------------------------
    // Create Task (POST /api/meetings/{meetingId}/tasks)
    // ------------------------------------------
    async function createTask() {
        const title = document.getElementById("taskTitle").value.trim();
        const description = document.getElementById("taskDescription").value.trim();
        const assignee = document.getElementById("taskAssignee").value;
        const deadline = document.getElementById("taskDeadline").value;
        const statusSelect = document.getElementById("taskStatus");
        const meetingSelect = document.getElementById("taskProject");

        if (!title) {
            showToast("Please enter a task title", "error");
            return;
        }

        const meetingId = meetingSelect ? meetingSelect.value : null;
        if (!meetingId) {
            showToast("Please select a meeting", "error");
            return;
        }

        const payload = {
            title: title,
            description: description || null,
            assignedTo: assignee ? parseInt(assignee) : null,
            dueDate: deadline ? new Date(deadline).toISOString() : null,
            priority: selectedPriority
        };

        const submitBtn = document.querySelector(".btn-submit");
        const originalText = submitBtn ? submitBtn.textContent : "Create Task";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Creating..."; }

        const result = await fetchAPI(`/api/meetings/${meetingId}/tasks`, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (result) {
            showToast("Task created successfully!");
            resetForm();
            await loadMyTasks();
        } else {
            showToast("Failed to create task", "error");
        }

        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }

    // ------------------------------------------
    // Update Task (PUT /api/meetings/{meetingId}/tasks/{taskId})
    // ------------------------------------------
    async function updateTask() {
        const title = document.getElementById("taskTitle").value.trim();
        const description = document.getElementById("taskDescription").value.trim();
        const assignee = document.getElementById("taskAssignee").value;
        const deadline = document.getElementById("taskDeadline").value;

        if (!title) {
            showToast("Please enter a task title", "error");
            return;
        }

        const payload = {
            title: title,
            description: description || null,
            assignedTo: assignee ? parseInt(assignee) : null,
            dueDate: deadline ? new Date(deadline).toISOString() : null,
            priority: selectedPriority
        };

        const submitBtn = document.querySelector(".btn-submit");
        const originalText = submitBtn ? submitBtn.textContent : "Update Task";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Updating..."; }

        const result = await fetchAPI(`/api/meetings/${editingMeetingId}/tasks/${editingTaskId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        if (result) {
            showToast("Task updated successfully!");
            resetForm();
            await loadMyTasks();
        } else {
            showToast("Failed to update task", "error");
        }

        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }

    // ------------------------------------------
    // Delete Task (DELETE /api/meetings/{meetingId}/tasks/{taskId})
    // ------------------------------------------
    window.deleteTask = async function(meetingId, taskId) {
        if (!confirm("Are you sure you want to delete this task?")) return;

        const result = await fetchAPI(`/api/meetings/${meetingId}/tasks/${taskId}`, {
            method: "DELETE"
        });

        showToast("Task deleted");
        await loadMyTasks();
    };

    // ------------------------------------------
    // Toggle Task Status (PUT /api/meetings/{meetingId}/tasks/{taskId}/status)
    // ------------------------------------------
    window.toggleTaskStatus = async function(meetingId, taskId, isChecked) {
        const newStatus = isChecked ? "Completed" : "Pending";
        await fetchAPI(`/api/meetings/${meetingId}/tasks/${taskId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus })
        });
        showToast(`Task marked as ${newStatus}`);
        await loadMyTasks();
    };

    // ------------------------------------------
    // Render Tasks
    // ------------------------------------------
    function renderTasks() {
        const tasksList = document.querySelector(".tasks-list");
        const taskCount = document.querySelector(".task-count");

        if (!tasksList) return;
        if (taskCount) taskCount.textContent = `${allTasks.length} Tasks`;

        if (allTasks.length === 0) {
            tasksList.innerHTML = '<p style="color: #94A3B8; font-size: 14px; text-align: center; margin-top: 20px;">No tasks yet. Create one using the form.</p>';
            return;
        }

        tasksList.innerHTML = allTasks.map(task => {
            const isCompleted = task.status === "Completed";
            const priorityClass = (task.priority || "Medium");
            const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

            return `
                <div class="task-item-card" style="${isOverdue ? 'border-left: 3px solid #DC2626;' : ''}">
                    <div class="task-card-header" style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" ${isCompleted ? "checked" : ""}
                               onchange="toggleTaskStatus(${task.meetingId}, ${task.id}, this.checked)"
                               style="width:18px; height:18px; cursor:pointer;">
                        <span class="task-card-title" style="${isCompleted ? 'text-decoration:line-through; opacity:0.6;' : ''}">${escapeHtml(task.title)}</span>
                        <span class="priority-badge ${priorityClass}">${priorityClass}</span>
                    </div>
                    ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ""}
                    <div class="task-card-footer" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span class="task-date"><i class="fa-regular fa-calendar"></i> ${formatDate(task.dueDate)}</span>
                            <span class="task-status" style="margin-left:8px;">${task.status || "Pending"}</span>
                            ${task.assignedToName ? `<span style="margin-left:8px; font-size:12px; color:#64748B;"><i class="fa-regular fa-user"></i> ${escapeHtml(task.assignedToName)}</span>` : ""}
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button onclick="editTask(${task.meetingId}, ${task.id})" style="background:none; border:none; cursor:pointer; color:#3461FF; font-size:13px;" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteTask(${task.meetingId}, ${task.id})" style="background:none; border:none; cursor:pointer; color:#DC2626; font-size:13px;" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // ------------------------------------------
    // Edit Task — populate form
    // ------------------------------------------
    window.editTask = function(meetingId, taskId) {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        editingTaskId = taskId;
        editingMeetingId = meetingId;

        document.getElementById("taskTitle").value = task.title || "";
        document.getElementById("taskDescription").value = task.description || "";

        const assigneeSelect = document.getElementById("taskAssignee");
        if (assigneeSelect && task.assignedTo) assigneeSelect.value = task.assignedTo;

        const deadlineInput = document.getElementById("taskDeadline");
        if (deadlineInput && task.dueDate) deadlineInput.value = task.dueDate.split("T")[0];

        const projectSelect = document.getElementById("taskProject");
        if (projectSelect) projectSelect.value = meetingId;

        // Set priority
        priorityButtons.forEach(b => b.classList.remove("active"));
        const targetBtn = document.querySelector(`.priority-btn[data-priority="${task.priority}"]`);
        if (targetBtn) targetBtn.classList.add("active");
        selectedPriority = task.priority || "High";

        // Update submit button text
        const submitBtn = document.querySelector(".btn-submit");
        if (submitBtn) submitBtn.textContent = "Update Task";

        // Scroll to form
        document.querySelector(".task-form-card")?.scrollIntoView({ behavior: "smooth" });
    };

    // ------------------------------------------
    // Reset Form
    // ------------------------------------------
    function resetForm() {
        editingTaskId = null;
        editingMeetingId = null;

        if (taskForm) taskForm.reset();
        priorityButtons.forEach(b => b.classList.remove("active"));
        const highBtn = document.querySelector(".priority-btn.high");
        if (highBtn) highBtn.classList.add("active");
        selectedPriority = "High";
        if (deadlineInput) deadlineInput.value = new Date().toISOString().split("T")[0];

        const submitBtn = document.querySelector(".btn-submit");
        if (submitBtn) submitBtn.textContent = "Create Task";
    }
});