// ==========================================
// MEETFLOW TEAM PAGE — FULL BACKEND INTEGRATION
// ==========================================
// Depends on: ../api.js (loaded first)

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    // ===================================================
    // 1. Sidebar Toggle Logic
    // ===================================================
    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.querySelector(".sidebar");
    const workspaceSelect = document.getElementById("workspaceSelect");
    const workspaceInfo = document.getElementById("workspaceInfo");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("close");
            document.body.classList.toggle("sidebar-closed");
        });
    }

    // ===================================================
    // 2. Tabs Switcher Logic
    // ===================================================
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-tab");
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            const target = document.getElementById(`${tabId}-tab`);
            if (target) target.classList.add("active");
            if (searchInput) {
                searchInput.placeholder = tabId === "departments" ? "Search departments..." : "Search members...";
                filterActiveTeamTab(searchInput.value.toLowerCase().trim());
            }
        });
    });

    // ===================================================
    // 3. Search Filter Logic
    // ===================================================
    const searchInput = document.getElementById("memberSearchInput");
    const tableBody = document.getElementById("teamTableBody");
    const departmentsGrid = document.getElementById("departmentsGrid");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            filterActiveTeamTab(searchTerm);
        });
    }

    // ===================================================
    // 4. Invite Member Modal
    // ===================================================
    const openModalBtn = document.getElementById("openInviteModalBtn");
    const closeModalBtn = document.getElementById("closeInviteModalBtn");
    const cancelModalBtn = document.getElementById("cancelInviteBtn");
    const inviteModal = document.getElementById("inviteModal");
    const inviteForm = document.getElementById("inviteMemberForm");
    const createWorkspaceModal = document.getElementById("createWorkspaceModal");
    const joinWorkspaceModal = document.getElementById("joinWorkspaceModal");
    const createWorkspaceForm = document.getElementById("createWorkspaceForm");
    const joinWorkspaceForm = document.getElementById("joinWorkspaceForm");
    const openCreateWorkspaceBtn = document.getElementById("openCreateWorkspaceBtn");
    const openJoinWorkspaceBtn = document.getElementById("openJoinWorkspaceBtn");
    const deleteWorkspaceBtn = document.getElementById("deleteWorkspaceBtn");

    function openModal() {
        if (inviteModal) inviteModal.classList.add("active");
    }

    function closeModal() {
        if (inviteModal) inviteModal.classList.remove("active");
    }

    function bindModal(openButton, modal, closeButtons) {
        if (openButton && modal) {
            openButton.addEventListener("click", () => modal.classList.add("active"));
        }

        closeButtons.forEach(button => {
            if (button && modal) {
                button.addEventListener("click", () => modal.classList.remove("active"));
            }
        });

        if (modal) {
            modal.addEventListener("click", (event) => {
                if (event.target === modal) modal.classList.remove("active");
            });
        }
    }

    if (openModalBtn) openModalBtn.addEventListener("click", openModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    if (inviteModal) {
        inviteModal.addEventListener("click", (e) => {
            if (e.target === inviteModal) closeModal();
        });
    }

    bindModal(openCreateWorkspaceBtn, createWorkspaceModal, [
        document.getElementById("closeCreateWorkspaceBtn"),
        document.getElementById("cancelCreateWorkspaceBtn")
    ]);
    bindModal(openJoinWorkspaceBtn, joinWorkspaceModal, [
        document.getElementById("closeJoinWorkspaceBtn"),
        document.getElementById("cancelJoinWorkspaceBtn")
    ]);

    if (workspaceSelect) {
        workspaceSelect.addEventListener("change", async () => {
            currentWorkspaceId = workspaceSelect.value || null;
            if (currentWorkspaceId) {
                localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
                await loadMembers(currentWorkspaceId);
                updateWorkspaceInfo();
            }
        });
    }

    if (createWorkspaceForm) {
        createWorkspaceForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await createWorkspace();
        });
    }

    if (joinWorkspaceForm) {
        joinWorkspaceForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await joinWorkspace();
        });
    }

    if (deleteWorkspaceBtn) {
        deleteWorkspaceBtn.addEventListener("click", deleteWorkspace);
    }

    // ===================================================
    // 5. State
    // ===================================================
    let currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || null;
    let currentWorkspace = null;
    let canManageWorkspace = false;
    let allMembers = [];
    let allWorkspaces = [];

    // ===================================================
    // 6. Initialize — Load Workspaces & Members
    // ===================================================
    initTeamPage();

    async function initTeamPage() {
        await loadWorkspaces();
        if (currentWorkspaceId) {
            await loadMembers(currentWorkspaceId);
        } else {
            renderMembersTable([]);
            updateStatsCards([]);
        }
    }

    // ===================================================
    // 7. Load Workspaces (GET /api/Workspaces)
    // ===================================================
    async function loadWorkspaces() {
        const workspaces = await fetchAPI("/api/Workspaces");
        if (!workspaces || !Array.isArray(workspaces)) {
            allWorkspaces = [];
            renderWorkspaceSelect();
            updateWorkspaceInfo();
            return;
        }

        allWorkspaces = workspaces;

        // If no valid workspace selected, pick the first available workspace
        const selectedStillExists = workspaces.some(ws => String(ws.id) === String(currentWorkspaceId));
        if ((!currentWorkspaceId || !selectedStillExists) && workspaces.length > 0) {
            currentWorkspaceId = String(workspaces[0].id);
            localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
        }

        renderWorkspaceSelect();
        updateWorkspaceInfo();
        updateStatsCards(allMembers);
        renderDepartments([]);
    }

    function renderWorkspaceSelect() {
        if (!workspaceSelect) return;

        if (allWorkspaces.length === 0) {
            workspaceSelect.innerHTML = '<option value="">No workspaces yet</option>';
            return;
        }

        workspaceSelect.innerHTML = allWorkspaces.map(workspace => `
            <option value="${workspace.id}" ${String(workspace.id) === String(currentWorkspaceId) ? "selected" : ""}>
                ${escapeHtml(workspace.name || `Workspace ${workspace.id}`)}
            </option>
        `).join("");
    }

    function updateWorkspaceInfo() {
        currentWorkspace = allWorkspaces.find(ws => String(ws.id) === String(currentWorkspaceId)) || null;
        canManageWorkspace = ["Owner", "Admin"].includes(currentWorkspace?.myRole);

        if (openModalBtn) openModalBtn.style.display = canManageWorkspace ? "inline-flex" : "none";

        if (!workspaceInfo) return;

        if (!currentWorkspace) {
            workspaceInfo.textContent = "Create a workspace or join one with a code to start collaborating.";
            return;
        }

        workspaceInfo.innerHTML = `
            <strong>${escapeHtml(currentWorkspace.name || `Workspace ${currentWorkspace.id}`)}</strong>
            <span class="workspace-role-badge">${escapeHtml(currentWorkspace.myRole || "Member")}</span>
            <br>
            Owner: ${escapeHtml(currentWorkspace.createdByName || "Unknown")} · ${currentWorkspace.memberCount || allMembers.length || 0} member${(currentWorkspace.memberCount || allMembers.length || 0) === 1 ? "" : "s"}
            ${canManageWorkspace ? "" : '<div class="permission-note">Member access: you can view workspace information and members, but management actions are hidden.</div>'}
        `;
    }

    // ===================================================
    // 8. Load Members (GET /api/Workspaces/{id}/members)
    // ===================================================
    async function loadMembers(workspaceId) {
        const members = await fetchAPI(`/api/Workspaces/${workspaceId}/members`);
        if (!members || !Array.isArray(members)) {
            allMembers = [];
            renderMembersTable([]);
            return;
        }

        allMembers = members;
        renderMembersTable(members);
        updateStatsCards(members);
        renderDepartments([]);
        updateWorkspaceInfo();
    }

    // ===================================================
    // 9. Render Members in Table
    // ===================================================
    function renderMembersTable(members) {
        if (!tableBody) return;

        if (members.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:30px; color:#94A3B8;">
                        ${currentWorkspaceId ? "No team members found. Invite members to get started." : "Create or join a workspace to see members."}
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = members.map(member => {
            const initials = getInitials(member.fullName);
            return `
                <tr class="member-row" data-user-id="${member.userId}">
                    <td>
                        <div class="member-info">
                            <div class="avatar-circle" style="display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:#3461FF;">
                                ${initials}
                            </div>
                            <div>
                                <span class="member-name">${escapeHtml(member.fullName || "Unknown")}</span>
                                <small style="display:block; color:#94A3B8; font-size:11px;">${escapeHtml(member.email || "")}</small>
                            </div>
                        </div>
                    </td>
                    <td class="role-cell">
                        ${canManageWorkspace ? `
                            <select class="role-select" onchange="changeMemberRole(${member.userId}, this.value)"
                                    style="border:1px solid #E2E8F0; border-radius:6px; padding:4px 8px; font-size:13px; background:#F8FAFC; cursor:pointer;">
                                <option value="Member" ${member.role === "Member" ? "selected" : ""}>Member</option>
                                <option value="Admin" ${member.role === "Admin" ? "selected" : ""}>Admin</option>
                                <option value="Owner" ${member.role === "Owner" ? "selected" : ""}>Owner</option>
                            </select>
                        ` : `<span>${escapeHtml(member.role || "Member")}</span>`}
                    </td>
                    <td>
                        <span class="status-indicator">
                            <span class="status-dot online"></span> Active
                        </span>
                    </td>
                    <td class="tasks-cell">—</td>
                    <td class="action-cell">
                        ${canManageWorkspace ? `
                            <button class="action-btn" onclick="removeMember(${member.userId})" title="Remove member"
                                    style="color:#DC2626;">
                                <i class="fa-solid fa-user-minus"></i>
                            </button>
                        ` : ""}
                    </td>
                </tr>
            `;
        }).join("") + `
            <tr class="no-member-results" style="display:none;">
                <td colspan="5" style="text-align:center; padding:30px; color:#94A3B8;">
                    No matching members found.
                </td>
            </tr>
        `;
    }

    // ===================================================
    // 10. Update Stats Cards
    // ===================================================
    function updateStatsCards(members) {
        const statCards = document.querySelectorAll(".stat-card");
        if (statCards.length < 4) return;

        // Total Members
        const totalH2 = statCards[0].querySelector("h2");
        if (totalH2) totalH2.textContent = members.length;
        const totalSub = statCards[0].querySelector(".sub-text");
        if (totalSub) totalSub.innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${members.length} total`;

        // Active Members
        const activeH2 = statCards[1].querySelector("h2");
        if (activeH2) activeH2.textContent = members.length;
        const activeSub = statCards[1].querySelector(".sub-text");
        if (activeSub) activeSub.innerHTML = `<i class="fa-solid fa-circle status-dot online"></i> Active`;

        const departmentsH2 = statCards[2].querySelector("h2");
        if (departmentsH2) departmentsH2.textContent = "0";
        const departmentsSub = statCards[2].querySelector(".sub-text");
        if (departmentsSub) departmentsSub.innerHTML = `<i class="fa-solid fa-building"></i> No departments`;

        // Pending Invitations
        const pendingH2 = statCards[3].querySelector("h2");
        if (pendingH2) pendingH2.textContent = "0";
        const pendingSub = statCards[3].querySelector(".sub-text");
        if (pendingSub) pendingSub.innerHTML = `<i class="fa-solid fa-envelope"></i> Awaiting response`;
    }

    function renderDepartments(departments) {
        if (!departmentsGrid) return;

        if (!Array.isArray(departments) || departments.length === 0) {
            departmentsGrid.innerHTML = '<p class="empty-team-state">No departments yet.</p>';
            return;
        }
    }

    function filterActiveTeamTab(searchTerm) {
        const activeTab = document.querySelector(".tab-btn.active")?.getAttribute("data-tab") || "all-members";

        if (activeTab === "departments") {
            const cards = departmentsGrid ? [...departmentsGrid.querySelectorAll(".department-card")] : [];
            cards.forEach(card => {
                card.style.display = card.innerText.toLowerCase().includes(searchTerm) ? "" : "none";
            });
            const visibleCards = cards.filter(card => card.style.display !== "none").length;
            const emptyState = departmentsGrid?.querySelector(".empty-team-state");
            if (emptyState && cards.length > 0) {
                emptyState.style.display = visibleCards === 0 ? "" : "none";
                emptyState.textContent = "No matching departments found.";
            }
            return;
        }

        if (!tableBody) return;
        const rows = [...tableBody.querySelectorAll("tr.member-row")];
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(searchTerm) ? "" : "none";
        });
        const noResultsRow = tableBody.querySelector(".no-member-results");
        if (noResultsRow) {
            noResultsRow.style.display = rows.length > 0 && rows.every(row => row.style.display === "none") ? "" : "none";
        }
    }

    async function createWorkspace() {
        const nameInput = document.getElementById("workspaceNameInput");
        const name = nameInput ? nameInput.value.trim() : "";

        if (!name) {
            showToast("Please enter a workspace name", "error");
            return;
        }

        const submitBtn = createWorkspaceForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : "Create Workspace";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating...";
        }

        const workspace = await fetchAPI("/api/Workspaces", {
            method: "POST",
            body: JSON.stringify({ name })
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        if (!workspace?.id) {
            showToast(getApiErrorMessage("Failed to create workspace."), "error");
            return;
        }

        currentWorkspaceId = String(workspace.id);
        localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
        createWorkspaceForm.reset();
        createWorkspaceModal.classList.remove("active");
        showToast("Workspace created.");
        await loadWorkspaces();
        await loadMembers(currentWorkspaceId);
    }

    async function joinWorkspace() {
        const codeInput = document.getElementById("workspaceCodeInput");
        const code = codeInput ? codeInput.value.trim() : "";

        if (!code) {
            showToast("Please enter a workspace code", "error");
            return;
        }

        const submitBtn = joinWorkspaceForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : "Join Workspace";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Joining...";
        }

        let workspace = await fetchAPI("/api/Workspaces/join-by-code", {
            method: "POST",
            body: JSON.stringify({ code })
        });

        if (!workspace && getLastApiError()?.status === 404) {
            workspace = await fetchAPI("/api/Workspaces/join", {
                method: "POST",
                body: JSON.stringify({ code })
            });
        }

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        if (!workspace?.id) {
            const error = getLastApiError();
            const message = error?.status === 404
                ? "Join by workspace code is not available in the deployed backend yet."
                : getApiErrorMessage("Invalid workspace code. Please check it and try again.");
            showToast(message, "error");
            return;
        }

        currentWorkspaceId = String(workspace.id);
        localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
        joinWorkspaceForm.reset();
        joinWorkspaceModal.classList.remove("active");
        showToast("Joined workspace.");
        await loadWorkspaces();
        await loadMembers(currentWorkspaceId);
    }

    // ===================================================
    // 11. Invite Member (POST /api/Workspaces/{id}/members)
    // ===================================================
    if (inviteForm) {
        inviteForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("memberEmail");
            const email = emailInput ? emailInput.value.trim() : "";

            if (!email) {
                showToast("Please enter an email address", "error");
                return;
            }

            if (!currentWorkspaceId) {
                showToast("No workspace selected", "error");
                return;
            }

            if (!canManageWorkspace) {
                showToast("Only workspace owners or admins can invite members.", "error");
                return;
            }

            const submitBtn = inviteForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : "Send Invitation";
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Inviting..."; }

            const result = await fetchAPI(`/api/Workspaces/${currentWorkspaceId}/members`, {
                method: "POST",
                body: JSON.stringify({ email: email })
            });

            if (result) {
                const selectedRole = document.getElementById("memberRole")?.value || "";
                if (selectedRole && result.userId) {
                    await fetchAPI(`/api/Workspaces/${currentWorkspaceId}/members/${result.userId}/role`, {
                        method: "PUT",
                        body: JSON.stringify({ role: selectedRole })
                    });
                }
                showToast(`Invitation sent to ${email}!`);
                inviteForm.reset();
                closeModal();
                await loadMembers(currentWorkspaceId);
            } else {
                showToast("Failed to invite member. Make sure the email is registered.", "error");
            }

            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        });
    }

    // ===================================================
    // 12. Change Member Role (PUT /api/Workspaces/{id}/members/{userId}/role)
    // ===================================================
    window.changeMemberRole = async function (userId, newRole) {
        if (!currentWorkspaceId) return;
        if (!canManageWorkspace) {
            showToast("Only workspace owners or admins can manage roles.", "error");
            await loadMembers(currentWorkspaceId);
            return;
        }

        const result = await fetchAPI(`/api/Workspaces/${currentWorkspaceId}/members/${userId}/role`, {
            method: "PUT",
            body: JSON.stringify({ role: newRole })
        });

        if (result !== null) {
            showToast(`Role updated to ${newRole}`);
        } else {
            showToast("Failed to update role", "error");
            await loadMembers(currentWorkspaceId);
        }
    };

    // ===================================================
    // 13. Remove Member (DELETE /api/Workspaces/{id}/members/{userId})
    // ===================================================
    window.removeMember = async function (userId) {
        if (!confirm("Are you sure you want to remove this member?")) return;
        if (!currentWorkspaceId) return;
        if (!canManageWorkspace) {
            showToast("Only workspace owners or admins can remove members.", "error");
            return;
        }

        await fetchAPI(`/api/Workspaces/${currentWorkspaceId}/members/${userId}`, {
            method: "DELETE"
        });

        showToast("Member removed");
        await loadMembers(currentWorkspaceId);
    };
});
