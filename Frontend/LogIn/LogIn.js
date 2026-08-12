document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const submitBtn = loginForm.querySelector('.btn-primary');

  const googleBtn = document.getElementById('googleBtn');
  const appleBtn = document.getElementById('appleBtn');

  // Base URL
  const BASE_URL = 'https://meetflow.runasp.net';
  const LOGIN_ENDPOINT = `${BASE_URL}/api/Auth/login`;

  
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
    if (errorElement) {
      errorElement.remove();
    }
    input.classList.remove('input-error');
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

 
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      if (emailInput.value.trim() !== '') {
        clearError(emailInput);
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      if (passwordInput.value.trim() !== '') {
        clearError(passwordInput);
      }
    });
  }

  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      let isValid = true;
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // Email Varify
      if (!email) {
        showError(emailInput, 'البريد الإلكتروني مطلوب');
        isValid = false;
      } else if (!validateEmail(email)) {
        showError(emailInput, 'يرجى إدخال بريد إلكتروني صحيح');
        isValid = false;
      } else {
        clearError(emailInput);
      }

      //Passwod Varify
      if (!password) {
        showError(passwordInput, 'كلمة المرور مطلوبة');
        isValid = false;
      } else {
        clearError(passwordInput);
      }

      if (!isValid) return;

      const payload = {
        email: email,
        password: password
      };

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
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data = {};
        try {
          data = JSON.parse(responseText);
        } catch (err) {
          data = { message: responseText };
        }

        if (response.ok) {
          console.log('Login successful AuthResultDto:', data);

          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          if (data.userId) {
            localStorage.setItem('userId', data.userId);
          }
          
          localStorage.setItem('userData', JSON.stringify(data));

          window.location.href = '../Dashboard/Dashboard.html';

        } else {
          const errorMessage = data.message || data.title || 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.';
          showError(passwordInput, errorMessage);
        }

      } catch (error) {
        console.error('Fetch Error:', error);
        alert('تعذر الاتصال بالسيرفر. يرجى التأكد من الاتصال بالإنترنت.');
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  // Google & Apple
  function handleSocialLogin(providerName) {
    alert(`سيتم إتاحة الدخول عبر ${providerName} فور توفر الـ Endpoints الخاصة بها في السيرفر.`);
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', () => handleSocialLogin('Google'));
  }

  if (appleBtn) {
    appleBtn.addEventListener('click', () => handleSocialLogin('Apple'));
  }
});