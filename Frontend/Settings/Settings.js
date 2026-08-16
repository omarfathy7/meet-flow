document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'https://meetflow.runasp.net';

    // Helper Function to Get Bearer Authorization Headers
    function getAuthHeaders() {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // ===================================================
    // 1. SIDEBAR COLLAPSE & MOBILE MENU TOGGLE
    // ===================================================
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.body.classList.toggle('mobile-menu-open');
            } else {
                sidebar.classList.toggle('close');
                document.body.classList.toggle('sidebar-closed');
            }
        });
    }

    // ===================================================
    // 2. SETTINGS TABS NAVIGATION SWITCHING
    // ===================================================
    const navItems = document.querySelectorAll('.settings-nav .nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const activeTabContent = document.getElementById(`tab-${targetTab}`);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
            }
        });
    });

    // ===================================================
    // 3. FETCH CURRENT USER PROFILE DATA (GET /api/User/me)
    // ===================================================
    async function loadUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/User/me`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const userData = await response.json();

                // Filling form elements based on API fields
                const fullNameInput = document.getElementById('fullName') || document.getElementById('userName');
                const emailInput = document.getElementById('userEmail');
                const phoneInput = document.getElementById('phoneNumber');

                if (fullNameInput && userData.fullName) fullNameInput.value = userData.fullName;
                if (emailInput && userData.email) emailInput.value = userData.email;
                if (phoneInput && userData.phoneNumber) phoneInput.value = userData.phoneNumber;
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    loadUserProfile();

    // ===================================================
    // 4. UPDATE USER PROFILE (PUT /api/User/me)
    // ===================================================
    const generalForm = document.getElementById('generalForm');
    if (generalForm) {
        generalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = generalForm.querySelector('.btn-save');
            const originalText = btn.textContent;
            btn.textContent = 'Saving...';

            const fullNameInput = document.getElementById('fullName') || document.getElementById('userName');
            const phoneInput = document.getElementById('phoneNumber');

            const payload = {
                fullName: fullNameInput ? fullNameInput.value.trim() : '',
                phoneNumber: phoneInput ? phoneInput.value.trim() : ''
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/User/me`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    btn.textContent = 'Saved Successfully!';
                    btn.style.backgroundColor = '#16A34A';
                } else {
                    const errText = await response.text();
                    alert(`Failed to save: ${errText || 'Invalid request'}`);
                    btn.textContent = originalText;
                }
            } catch (err) {
                alert('Connection error while updating profile.');
                btn.textContent = originalText;
            }

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#3461FF';
            }, 2500);
        });
    }

    // ===================================================
    // 5. SECURITY: FORGOT & RESET PASSWORD VIA OTP
    // ===================================================
    const userEmailInput = document.getElementById('userEmail');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const otpInputContainer = document.getElementById('otpInputContainer');
    const otpCodeInput = document.getElementById('otpCode');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');

    const securityForm = document.getElementById('securityForm');
    const currPassInput = document.getElementById('currPass');
    const newPassInput = document.getElementById('newPass');
    const confirmPassInput = document.getElementById('confirmPass');
    const updatePassBtn = document.getElementById('updatePassBtn');

    // Step A: Request Code (POST /api/Auth/forgot-password)
    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', async () => {
            const email = userEmailInput.value.trim();
            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            sendCodeBtn.textContent = 'Sending Code...';
            sendCodeBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/api/Auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });

                if (response.ok) {
                    alert(`Verification code sent to ${email}. Please check your inbox.`);
                    if (otpInputContainer) otpInputContainer.style.display = 'block';
                    sendCodeBtn.textContent = 'Resend Code';
                    sendCodeBtn.disabled = false;
                } else {
                    const errorText = await response.text();
                    alert(`Error sending code: ${errorText || 'User not found.'}`);
                    sendCodeBtn.textContent = 'Send Verification Code';
                    sendCodeBtn.disabled = false;
                }
            } catch (error) {
                alert('Connection error with authentication server.');
                sendCodeBtn.textContent = 'Send Verification Code';
                sendCodeBtn.disabled = false;
            }
        });
    }

    // Step B: Unlock Fields after Code Entry
    if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', () => {
            const code = otpCodeInput.value.trim();

            if (!code) {
                alert('Please enter the verification code received on your email.');
                return;
            }

            alert('Code entered! Enter your new password below.');
            if (securityForm) securityForm.classList.remove('locked-form');
            if (newPassInput) newPassInput.disabled = false;
            if (confirmPassInput) confirmPassInput.disabled = false;
            if (updatePassBtn) updatePassBtn.disabled = false;
        });
    }

    // Step C: Execute Reset Password OR Change Password
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = userEmailInput ? userEmailInput.value.trim() : '';
            const code = otpCodeInput ? otpCodeInput.value.trim() : '';
            const currentPassword = currPassInput ? currPassInput.value : '';
            const newPassword = newPassInput ? newPassInput.value : '';
            const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

            if (newPassword !== confirmPassword) {
                alert('New password and confirm password do not match.');
                return;
            }

            updatePassBtn.textContent = 'Updating...';
            updatePassBtn.disabled = true;

            try {
                let response;

                // Option 1: Reset Password with OTP Code (POST /api/Auth/reset-password)
                if (code) {
                    response = await fetch(`${API_BASE_URL}/api/Auth/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: email,
                            code: code,
                            newPassword: newPassword
                        })
                    });
                }
                // Option 2: Direct Change Password with Current Password (PUT /api/User/change-password)
                else {
                    response = await fetch(`${API_BASE_URL}/api/User/change-password`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            currentPassword: currentPassword,
                            newPassword: newPassword
                        })
                    });
                }

                if (response.ok) {
                    alert('Password updated successfully!');
                    securityForm.reset();
                } else {
                    const errText = await response.text();
                    alert(`Failed to update password: ${errText || 'Invalid credentials or expired code.'}`);
                }
            } catch (error) {
                alert('Error connecting to the server. Please try again.');
            } finally {
                updatePassBtn.textContent = 'Update Password';
                updatePassBtn.disabled = false;
            }
        });
    }

});