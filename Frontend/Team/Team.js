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

    function openModal() {
        if (inviteModal) inviteModal.classList.add("active");
    }

    function closeModal() {
        if (inviteModal) inviteModal.classList.remove("active");
    }

    if (openModalBtn) openModalBtn.addEventListener("click", openModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    if (inviteModal) {
        inviteModal.addEventListener("click", (e) => {
            if (e.target === inviteModal) closeModal();
        });
    }

    // ===================================================
    // 5. State
    // ===================================================
    let currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || null;
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
        }
    }

    // ===================================================
    // 7. Load Workspaces (GET /api/Workspaces)
    // ===================================================
    async function loadWorkspaces() {
        const workspaces = await fetchAPI("/api/Workspaces");
        if (!workspaces || !Array.isArray(workspaces)) {
            allWorkspaces = [];
            return;
        }

        allWorkspaces = workspaces;

        // If no workspace selected, pick the first one
        if (!currentWorkspaceId && workspaces.length > 0) {
            currentWorkspaceId = workspaces[0].id;
            localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
        }

        updateStatsCards(allMembers);
        renderDepartments([]);
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
                        No team members found. Invite members to get started.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = members.map(member => {
            const initials = getInitials(member.fullName);
            return `
                <tr data-user-id="${member.userId}">
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
                        <select class="role-select" onchange="changeMemberRole(${member.userId}, this.value)"
                                style="border:1px solid #E2E8F0; border-radius:6px; padding:4px 8px; font-size:13px; background:#F8FAFC; cursor:pointer;">
                            <option value="Member" ${member.role === "Member" ? "selected" : ""}>Member</option>
                            <option value="Admin" ${member.role === "Admin" ? "selected" : ""}>Admin</option>
                            <option value="Owner" ${member.role === "Owner" ? "selected" : ""}>Owner</option>
                        </select>
                    </td>
                    <td>
                        <span class="status-indicator">
                            <span class="status-dot online"></span> Active
                        </span>
                    </td>
                    <td class="tasks-cell">—</td>
                    <td class="action-cell">
                        <button class="action-btn" onclick="removeMember(${member.userId})" title="Remove member"
                                style="color:#DC2626;">
                            <i class="fa-solid fa-user-minus"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
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
            departmentsGrid?.querySelectorAll(".department-card").forEach(card => {
                card.style.display = card.innerText.toLowerCase().includes(searchTerm) ? "" : "none";
            });
            return;
        }

        if (!tableBody) return;
        tableBody.querySelectorAll("tr").forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(searchTerm) ? "" : "none";
        });
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

            const submitBtn = inviteForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : "Send Invitation";
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Inviting..."; }

            const result = await fetchAPI(`/api/Workspaces/${currentWorkspaceId}/members`, {
                method: "POST",
                body: JSON.stringify({ email: email })
            });

            if (result) {
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

        await fetchAPI(`/api/Workspaces/${currentWorkspaceId}/members/${userId}`, {
            method: "DELETE"
        });

        showToast("Member removed");
        await loadMembers(currentWorkspaceId);
    };
});
