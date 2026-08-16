document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const submitBtn = forgotPasswordForm ? forgotPasswordForm.querySelector('button[type="submit"]') : null;

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();

            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            const originalBtnText = submitBtn ? submitBtn.innerText : 'Send Reset Link';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Sending...';
            }

            try {
                const response = await fetch('https://meetflow.runasp.net/api/Auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                });

                const responseText = await response.text();
                let result = {};
                try {
                    result = JSON.parse(responseText);
                } catch (err) {
                    result = { message: responseText };
                }

                if (response.ok) {
                    alert('A verification code has been sent to your email.');

                    const code = prompt(`Please enter the code sent to ${email}:`);

                    if (code && code.trim() !== '') {
                        const newPassword = prompt('Enter your new password:');

                        if (newPassword && newPassword.trim() !== '') {
                            await handleResetPassword(email, code.trim(), newPassword);
                        } else {
                            alert('Password cannot be empty.');
                        }
                    }
                } else {
                    alert(result.message || result.title || 'Failed to process request. Please check your email.');
                }
            } catch (error) {
                console.error('Error during forgot password request:', error);
                alert('Network error. Unable to connect to the server.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
            }
        });
    }

    async function handleResetPassword(email, code, newPassword) {
        try {
            const payload = {
                email: email,
                code: code,
                newPassword: newPassword
            };

            const response = await fetch('https://meetflow.runasp.net/api/Auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let result = {};
            try {
                result = JSON.parse(responseText);
            } catch (err) {
                result = { message: responseText };
            }

            if (response.ok) {
                alert('Password reset successfully! Redirecting to Login...');
                window.location.href = '../LogIn/LogIn.html';
            } else {
                alert(result.message || result.title || 'Failed to reset password. Invalid code.');
            }
        } catch (error) {
            console.error('Error during password reset:', error);
            alert('Network error during password reset.');
        }
    }
});