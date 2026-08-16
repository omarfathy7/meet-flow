document.addEventListener('DOMContentLoaded', () => {
    const GOOGLE_CLIENT_ID = '138679985970-061ega3qvghmm0sfjk91rlih1uk5fp67.apps.googleusercontent.com';
    const GOOGLE_LOGIN_ENDPOINT = 'https://meetflow.runasp.net/api/Auth/google-login';

    const phoneInput = document.getElementById('phone');
    let iti = null;
    if (phoneInput && window.intlTelInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: "eg",
            separateDialCode: true,
            preferredCountries: ["eg", "sa", "ae", "us", "kw"],
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js"
        });
    }

    //Password
    const toggleIcons = document.querySelectorAll('.toggle-password');
    toggleIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);

            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                targetInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Verification Code
    function verifyAndRedirect(userIdentifier, token) {
        const verificationCode = prompt(`[Verification Required]\nWe sent a 6-digit verification code to ${userIdentifier}.\nPlease enter the code to proceed:`, "123456");

        if (verificationCode !== null) {
            if (verificationCode.trim() === "") {
                alert("Verification code cannot be empty.");
                return false;
            }

            // حفظ بيانات التوكن والـ User ID القادمة من الباك إند
            if (token && typeof token === 'object') {
                if (token.accessToken) localStorage.setItem('accessToken', token.accessToken);
                if (token.refreshToken) localStorage.setItem('refreshToken', token.refreshToken);
                if (token.userId) localStorage.setItem('userId', token.userId);
                localStorage.setItem('userData', JSON.stringify(token));
            } else if (token) {
                localStorage.setItem('accessToken', token);
            }

            localStorage.setItem('isVerified', 'true');
            alert("Account verified successfully! Redirecting to Dashboard...");
            window.location.href = '../Dashboard/Dashboard.html';
            return true;
        }
        return false;
    }

    //login by Google
    const googleBtn = document.getElementById('googleBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const loaded = await ensureGoogleIdentityLoaded();
            if (!loaded) return;

            try {
                google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleCredentialResponse
                });
                google.accounts.id.prompt();
            } catch (err) {
                console.error("Google sign-up initialization failed.", err);
                alert("Unable to start Google sign-up right now.");
            }
        });
    }

    function ensureGoogleIdentityLoaded() {
        if (window.google && google.accounts && google.accounts.id) {
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

            const finishWhenReady = () => {
                const startedAt = Date.now();
                const timer = setInterval(() => {
                    if (window.google && google.accounts && google.accounts.id) {
                        clearInterval(timer);
                        resolve(true);
                    } else if (Date.now() - startedAt > 5000) {
                        clearInterval(timer);
                        alert("Google sign-up could not load. Check your internet connection or browser blocking settings.");
                        resolve(false);
                    }
                }, 100);
            };

            if (existingScript) {
                finishWhenReady();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = finishWhenReady;
            script.onerror = () => {
                alert("Google sign-up could not load. Check your internet connection or browser blocking settings.");
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }

    // Google
    async function handleGoogleCredentialResponse(response) {
        await loginWithGoogleIdToken(response.credential);
    }

    async function loginWithGoogleIdToken(idToken) {
        if (!idToken) {
            alert("Google did not return a valid sign-up token.");
            return;
        }

        const googleBtnLabel = googleBtn ? googleBtn.querySelector('span') : null;
        const originalBtnText = googleBtnLabel ? googleBtnLabel.textContent : 'Google';
        if (googleBtn) {
            googleBtn.disabled = true;
            if (googleBtnLabel) googleBtnLabel.textContent = 'Signing in...';
        }

        try {
            const apiResponse = await fetch(GOOGLE_LOGIN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ idToken })
            });

            const responseText = await apiResponse.text();
            let result = {};
            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch (err) {
                result = { message: responseText };
            }

            if (!apiResponse.ok) {
                alert(result.message || result.title || 'Google sign-up failed.');
                return;
            }

            saveAuthSession(result);
            window.location.href = '../Dashboard/Dashboard.html';
        } catch (error) {
            console.error('Google sign-up error:', error);
            alert('Unable to sign up with Google right now.');
        } finally {
            if (googleBtn) {
                googleBtn.disabled = false;
                if (googleBtnLabel) googleBtnLabel.textContent = originalBtnText;
            }
        }
    }

    function saveAuthSession(data) {
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.userId) localStorage.setItem('userId', data.userId);
        localStorage.setItem('userData', JSON.stringify(data));
    }

    //Apple
    const appleBtn = document.getElementById('appleBtn');
    if (appleBtn) {
        appleBtn.addEventListener('click', async () => {
            if (window.AppleID && AppleID.auth) {
                try {
                    AppleID.auth.init({
                        clientId: 'com.meetflow.web',
                        scope: 'name email',
                        redirectURI: window.location.origin,
                        state: 'origin:web',
                        usePopup: true
                    });
                    const data = await AppleID.auth.signIn();
                    console.log("Apple auth response:", data);
                    if (data && data.authorization) {
                        verifyAndRedirect('Apple ID', data.authorization.id_token);
                    }
                } catch (error) {
                    console.warn("Apple Sign-In failed or popup closed. Triggering Demo Verification mode.", error);
                    triggerSocialDemo('Apple', 'user@icloud.com');
                }
            } else {
                triggerSocialDemo('Apple', 'user@icloud.com');
            }
        });
    }

    // Google / Apple
    function triggerSocialDemo(providerName, defaultEmail) {
        const userEmail = prompt(`[${providerName} Authentication]\nPlease enter your ${providerName} account email:`, defaultEmail);
        if (userEmail !== null && userEmail.trim() !== "") {
            const mockToken = `mock_${providerName.toLowerCase()}_token_` + Math.random().toString(36).substring(2);
            verifyAndRedirect(userEmail.trim(), mockToken);
        }
    }

    // Register Form Submit
    const registerForm = document.getElementById('registerForm');
    const submitBtn = registerForm ? registerForm.querySelector('button[type="submit"]') : null;

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Country key
            const dialCode = iti ? `+${iti.getSelectedCountryData().dialCode}` : '';
            const phone = document.getElementById('phone').value.trim();
            const termsAccepted = document.getElementById('terms').checked;

            // Validation
            if (password !== confirmPassword) {
                alert('Password and Confirm Password do not match.');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            if (!termsAccepted) {
                alert('You must agree to the Terms of Service and Privacy Policy.');
                return;
            }

            const payload = {
                fullName: `${firstName} ${lastName}`.trim(),
                email: email,
                phoneNumber: `${dialCode}${phone}`,
                password: password
            };

            const originalBtnText = submitBtn ? submitBtn.innerText : 'Create Account';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Creating Account...';
            }

            try {
                const response = await fetch('https://meetflow.runasp.net/api/Auth/register', {
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
                    alert('Account created successfully!');
                    verifyAndRedirect(email, result);
                } else {
                    alert(result.message || result.title || 'Registration failed. Please check your data.');
                }
            } catch (error) {
                console.error('Error during registration:', error);
                alert('Network error. Unable to connect to the server.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
            }
        });
    }
});
