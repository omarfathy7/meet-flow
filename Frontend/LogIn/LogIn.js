document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const submitBtn = loginForm ? loginForm.querySelector('.btn-primary') : null;
  const googleBtn = document.getElementById('googleBtn');
  const appleBtn = document.getElementById('appleBtn');

  const BASE_URL = 'https://meetflow.runasp.net';
  const LOGIN_ENDPOINT = `${BASE_URL}/api/Auth/login`;
  const GOOGLE_CLIENT_ID = '138679985970-061ega3qvghmm0sfjk91rlih1uk5fp67.apps.googleusercontent.com';
  const GOOGLE_LOGIN_ENDPOINT = `${BASE_URL}/api/Auth/google-login`;

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      const icon = togglePasswordBtn.querySelector('i') || togglePasswordBtn;
      if (isPassword) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      if (emailInput.value.trim() !== '') clearError(emailInput);
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      if (passwordInput.value.trim() !== '') clearError(passwordInput);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      let isValid = true;
      if (!email) {
        showError(emailInput, 'Email address is required.');
        isValid = false;
      } else if (!validateEmail(email)) {
        showError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      } else {
        clearError(emailInput);
      }

      if (!password) {
        showError(passwordInput, 'Password is required.');
        isValid = false;
      } else {
        clearError(passwordInput);
      }

      if (!isValid) return;

      const originalBtnText = submitBtn ? submitBtn.textContent : 'Log In';
      if (submitBtn) {
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
      }

      try {
        const response = await fetch(LOGIN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await parseResponse(response);

        if (response.ok) {
          saveAuthSession(data);
          window.location.href = '../Dashboard/Dashboard.html';
        } else {
          showError(passwordInput, formatApiError(data, 'Invalid email or password.'));
        }
      } catch (error) {
        console.error('Login error:', error);
        alert(getNetworkErrorMessage());
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', startGoogleSignIn);
  }

  if (appleBtn) {
    appleBtn.addEventListener('click', () => {
      alert('Apple sign-in will be available soon.');
    });
  }

  async function startGoogleSignIn() {
    const loaded = await ensureGoogleIdentityLoaded();
    if (!loaded) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => loginWithGoogleIdToken(response.credential)
    });
    google.accounts.id.prompt();
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
            alert('Google sign-in could not load. Check your internet connection or browser blocking settings.');
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
        alert('Google sign-in could not load. Check your internet connection or browser blocking settings.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  async function loginWithGoogleIdToken(idToken) {
    if (!idToken) {
      alert('Google did not return a valid sign-in token.');
      return;
    }

    const googleBtnLabel = googleBtn ? googleBtn.querySelector('span') : null;
    const originalText = googleBtnLabel ? googleBtnLabel.textContent : 'Google';
    if (googleBtn) {
      googleBtn.disabled = true;
      if (googleBtnLabel) googleBtnLabel.textContent = 'Signing in...';
    }

    try {
      const response = await fetch(GOOGLE_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        alert(data.message || data.title || 'Google sign-in failed.');
        return;
      }

      saveAuthSession(data);
      window.location.href = '../Dashboard/Dashboard.html';
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Unable to sign in with Google right now.');
    } finally {
      if (googleBtn) {
        googleBtn.disabled = false;
        if (googleBtnLabel) googleBtnLabel.textContent = originalText;
      }
    }
  }

  async function parseResponse(response) {
    const responseText = await response.text();
    try {
      return responseText ? JSON.parse(responseText) : {};
    } catch (err) {
      return { message: responseText };
    }
  }

  function saveAuthSession(data) {
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.userId) localStorage.setItem('userId', data.userId);
    localStorage.setItem('userData', JSON.stringify(data));
  }

  function showError(input, message) {
    const formGroup = input.closest('.form-group') || input.parentElement;
    let errorElement = formGroup.querySelector('.error-message');

    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'error-message';
      errorElement.style.color = '#e74c3c';
      errorElement.style.fontSize = '12px';
      errorElement.style.marginTop = '4px';
      errorElement.style.display = 'block';
      formGroup.appendChild(errorElement);
    }

    errorElement.textContent = message;
    input.classList.add('input-error');
  }

  function clearError(input) {
    const formGroup = input.closest('.form-group') || input.parentElement;
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) errorElement.remove();
    input.classList.remove('input-error');
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
  }

  function formatApiError(result, fallback) {
    if (result?.errors && typeof result.errors === 'object') {
      return Object.entries(result.errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('\n');
    }

    return result?.message || result?.title || fallback;
  }

  function getNetworkErrorMessage() {
    if (navigator && navigator.onLine === false) {
      return 'Network error. Your browser appears to be offline.';
    }

    return 'Network error. The browser could not reach the backend. Check that https://meetflow.runasp.net is reachable and that your browser is not blocking the request.';
  }
});
