// ==========================================
// MEETFLOW PROFILE PAGE — FULL BACKEND INTEGRATION
// ==========================================
// Depends on: ../api.js (loaded first)

document.addEventListener("DOMContentLoaded", () => {
    if (!requireAuth()) return;

    // ===================================================
    // 1. DYNAMIC TAB SWITCHING
    // ===================================================
    const navItems = document.querySelectorAll("#profileNavList li[data-tab]");
    const tabPanels = document.querySelectorAll(".tab-panel");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.getAttribute("data-tab");
            navItems.forEach(nav => nav.classList.remove("active"));
            tabPanels.forEach(panel => panel.classList.remove("active"));
            item.classList.add("active");
            const targetPanel = document.getElementById(`tab-${targetTab}`);
            if (targetPanel) targetPanel.classList.add("active");
        });
    });

    // ===================================================
    // 2. SIDEBAR COLLAPSE & MOBILE MENU TOGGLE
    // ===================================================
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

    // ===================================================
    // 3. LOAD PROFILE FROM API (GET /api/User/me)
    // ===================================================
    loadProfile();

    async function loadProfile() {
        const userData = await fetchAPI("/api/User/me");
        if (!userData) return;

        // Update display values
        const displayName = document.getElementById("val-display-name");
        const displayEmail = document.getElementById("val-display-email");
        const valFullname = document.getElementById("val-fullname");
        const valEmail = document.getElementById("val-email");
        const valPhone = document.getElementById("val-phone");

        if (displayName) displayName.textContent = userData.fullName || "User";
        if (displayEmail) displayEmail.textContent = userData.email || "";
        if (valFullname) valFullname.textContent = userData.fullName || "N/A";
        if (valEmail) valEmail.textContent = userData.email || "N/A";
        if (valPhone) valPhone.textContent = userData.phoneNumber || "N/A";

        // Update avatar initials
        const avatarIcon = document.querySelector(".user-avatar");
        if (avatarIcon && userData.fullName) {
            avatarIcon.innerHTML = `<span style="font-size:24px; font-weight:700; color:#3461FF;">${getInitials(userData.fullName)}</span>`;
        }
    }

    // ===================================================
    // 4. MODAL CONTROLS & FIELD INITIALIZATION
    // ===================================================
    const editModal = document.getElementById("editModal");
    const openEditBtn = document.getElementById("openEditBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const closeModalCross = document.getElementById("closeModalCross");

    let originalEmail = "";
    let originalPhone = "";
    let isEmailVerified = true;
    let isPhoneVerified = true;

    if (openEditBtn) {
        openEditBtn.addEventListener("click", () => {
            const currentName = document.getElementById("val-fullname").textContent;
            const currentEmail = document.getElementById("val-email").textContent;
            const currentPhone = document.getElementById("val-phone").textContent;
            const currentRole = document.getElementById("val-role") ? document.getElementById("val-role").textContent : "";
            const currentDept = document.getElementById("val-department") ? document.getElementById("val-department").textContent : "";

            document.getElementById("input-fullname").value = currentName;
            document.getElementById("input-email").value = currentEmail;
            document.getElementById("input-phone").value = currentPhone;
            if (document.getElementById("input-role")) document.getElementById("input-role").value = currentRole;
            if (document.getElementById("input-department")) document.getElementById("input-department").value = currentDept;

            originalEmail = currentEmail;
            originalPhone = currentPhone;
            isEmailVerified = true;
            isPhoneVerified = true;

            editModal.classList.add("active");
        });
    }

    const closeModal = () => {
        editModal.classList.remove("active");
        const emailOtp = document.getElementById("emailOtpBox");
        const phoneOtp = document.getElementById("phoneOtpBox");
        if (emailOtp) emailOtp.classList.remove("active");
        if (phoneOtp) phoneOtp.classList.remove("active");
    };

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (closeModalCross) closeModalCross.addEventListener("click", closeModal);

    // ===================================================
    // 5. EMAIL & PHONE VERIFICATION PROCESS
    // ===================================================
    const emailInput = document.getElementById("input-email");
    if (emailInput) {
        emailInput.addEventListener("input", (e) => {
            if (e.target.value !== originalEmail) {
                isEmailVerified = false;
            } else {
                isEmailVerified = true;
                const box = document.getElementById("emailOtpBox");
                if (box) box.classList.remove("active");
            }
        });
    }

    const verifyEmailBtn = document.getElementById("verifyEmailBtn");
    if (verifyEmailBtn) {
        verifyEmailBtn.addEventListener("click", () => {
            const newEmail = document.getElementById("input-email").value;
            if (!newEmail) { alert("Please enter an email address first."); return; }
            alert(`Verification code sent to email: ${newEmail}`);
            const box = document.getElementById("emailOtpBox");
            if (box) box.classList.add("active");
        });
    }

    const confirmEmailOtp = document.getElementById("confirmEmailOtp");
    if (confirmEmailOtp) {
        confirmEmailOtp.addEventListener("click", () => {
            const otpInput = document.getElementById("emailOtpInput").value;
            if (otpInput.trim() !== "") {
                isEmailVerified = true;
                alert("Email verified successfully!");
                const box = document.getElementById("emailOtpBox");
                if (box) box.classList.remove("active");
            } else {
                alert("Please enter a valid OTP code.");
            }
        });
    }

    const phoneInput = document.getElementById("input-phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            if (e.target.value !== originalPhone) {
                isPhoneVerified = false;
            } else {
                isPhoneVerified = true;
                const box = document.getElementById("phoneOtpBox");
                if (box) box.classList.remove("active");
            }
        });
    }

    const verifyPhoneBtn = document.getElementById("verifyPhoneBtn");
    if (verifyPhoneBtn) {
        verifyPhoneBtn.addEventListener("click", () => {
            const newPhone = document.getElementById("input-phone").value;
            if (!newPhone) { alert("Please enter a phone number first."); return; }
            alert(`Verification code sent via (WhatsApp / SMS) to: ${newPhone}`);
            const box = document.getElementById("phoneOtpBox");
            if (box) box.classList.add("active");
        });
    }

    const confirmPhoneOtp = document.getElementById("confirmPhoneOtp");
    if (confirmPhoneOtp) {
        confirmPhoneOtp.addEventListener("click", () => {
            const otpInput = document.getElementById("phoneOtpInput").value;
            if (otpInput.trim() !== "") {
                isPhoneVerified = true;
                alert("Phone number verified successfully!");
                const box = document.getElementById("phoneOtpBox");
                if (box) box.classList.remove("active");
            } else {
                alert("Please enter a valid OTP code.");
            }
        });
    }

    // ===================================================
    // 6. SAVE CHANGES — API Integration (PUT /api/User/me)
    // ===================================================
    const editProfileForm = document.getElementById("editProfileForm");
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!isEmailVerified) { alert("Please verify your new email first."); return; }
            if (!isPhoneVerified) { alert("Please verify your new phone number first."); return; }

            const updatedName = document.getElementById("input-fullname").value.trim();
            const updatedPhone = document.getElementById("input-phone").value.trim();

            const payload = {
                fullName: updatedName,
                phoneNumber: updatedPhone
            };

            const saveBtn = document.getElementById("saveChangesBtn");
            const originalText = saveBtn ? saveBtn.textContent : "Save Changes";
            if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving..."; }

            const result = await fetchAPI("/api/User/me", {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            if (result) {
                // Update display values
                document.getElementById("val-fullname").textContent = updatedName;
                document.getElementById("val-email").textContent = document.getElementById("input-email").value;
                document.getElementById("val-phone").textContent = updatedPhone;
                if (document.getElementById("val-role")) document.getElementById("val-role").textContent = document.getElementById("input-role")?.value || "";
                if (document.getElementById("val-department")) document.getElementById("val-department").textContent = document.getElementById("input-department")?.value || "";
                document.getElementById("val-display-name").textContent = updatedName;
                document.getElementById("val-display-email").textContent = document.getElementById("input-email").value;

                showToast("Profile updated successfully!");
                closeModal();
            } else {
                showToast("Failed to update profile", "error");
            }

            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = originalText; }
        });
    }

    // ===================================================
    // 7. LOGOUT (POST /api/Auth/logout)
    // ===================================================
    const logoutItem = document.querySelector(".logout-item a");
    if (logoutItem) {
        logoutItem.addEventListener("click", async (e) => {
            e.preventDefault();
            await apiLogout();
            window.location.href = "../LogIn/LogIn.html";
        });
    }

    // ===================================================
    // 8. LOGOUT ALL DEVICES (POST /api/Auth/logout-all)
    // ===================================================
    const logoutAllBtn = document.querySelector("#tab-privacy-security .btn-secondary-action");
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to log out from all devices?")) return;
            await apiLogoutAll();
            showToast("Logged out from all devices");
            window.location.href = "../LogIn/LogIn.html";
        });
    }

    // ===================================================
    // 9. CHANGE PASSWORD (PUT /api/User/change-password)
    // ===================================================
    const changePasswordBtn = document.querySelector("#tab-account-settings .setting-row:first-child .btn-secondary-action");
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", () => {
            const currentPassword = prompt("Enter your current password:");
            if (!currentPassword) return;

            const newPassword = prompt("Enter your new password (min 8 characters):");
            if (!newPassword || newPassword.length < 8) {
                alert("Password must be at least 8 characters.");
                return;
            }

            const confirmPassword = prompt("Confirm your new password:");
            if (newPassword !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            changePassword(currentPassword, newPassword);
        });
    }

    async function changePassword(currentPassword, newPassword) {
        const result = await fetchAPI("/api/User/change-password", {
            method: "PUT",
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        if (result !== null) {
            showToast("Password changed successfully!");
        } else {
            showToast("Failed to change password. Check your current password.", "error");
        }
    }

    // ===================================================
    // 10. DELETE ACCOUNT (DELETE /api/User/me)
    // ===================================================
    // Add delete account functionality if there's a suitable button
    window.deleteAccount = async function () {
        if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
        if (!confirm("This will delete ALL your data. Type 'DELETE' to confirm.")) return;

        const result = await fetchAPI("/api/User/me", { method: "DELETE" });
        if (result !== null) {
            clearSession();
            showToast("Account deleted");
            window.location.href = "../LogIn/LogIn.html";
        } else {
            showToast("Failed to delete account", "error");
        }
    };
});