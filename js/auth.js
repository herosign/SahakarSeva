document.addEventListener('DOMContentLoaded', async () => {
  const isCustomerPage = window.location.pathname.includes('customer-login');
  const isWorkerPage = window.location.pathname.includes('worker-login');

  // Check if already logged in
  if (window.SahakarDB) {
    const user = await window.SahakarDB.getCurrentUser();
    if (user) {
      if (isCustomerPage) {
        // If on customer login page, only redirect if actually a customer!
        if (user.role === 'customer') {
          window.location.href = '/customer-dashboard.html';
          return;
        }
        // If logged in as worker, do NOT redirect to onboarding from customer login page!
      } else if (isWorkerPage) {
        // If on worker login page, only redirect if actually a worker!
        if (user.role === 'worker') {
          const onboarded = localStorage.getItem('sahakar_worker_profile');
          window.location.href = onboarded ? '/dashboard.html' : '/onboarding.html';
          return;
        }
      } else {
        redirectUser(user.role);
        return;
      }
    }
  }

  // Set up i18n
  if (window.I18n) {
    window.I18n.applyToPage();
    setupLanguageSelector();
  }

  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  const toggleLinks = document.querySelectorAll('.toggle-form');
  const errorMsg = document.getElementById('error-msg');

  if (toggleLinks) {
    toggleLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        signinForm.classList.toggle('hidden');
        signupForm.classList.toggle('hidden');
        if (errorMsg) errorMsg.textContent = '';
      });
    });
  }

  // Handle Sign In
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;
      
      try {
        const user = await window.SahakarDB.signIn(email, password);
        if (isCustomerPage) {
          window.location.href = '/customer-dashboard.html';
        } else if (isWorkerPage) {
          const onboarded = localStorage.getItem('sahakar_worker_profile');
          window.location.href = onboarded ? '/dashboard.html' : '/onboarding.html';
        } else {
          redirectUser(user.role);
        }
      } catch (err) {
        console.error(err);
        if (errorMsg) {
          errorMsg.textContent = err.message || (window.I18n ? window.I18n.t('error') + ': Invalid credentials.' : 'Invalid credentials.');
        }
      }
    });
  }

  // Handle Sign Up
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      let role = isCustomerPage ? 'customer' : (isWorkerPage ? 'worker' : 'customer');
      const roleInput = document.querySelector('input[name="role"]');
      if (roleInput) {
        if (roleInput.type === 'hidden') {
          role = roleInput.value;
        } else {
          const checkedRadio = document.querySelector('input[name="role"]:checked');
          if (checkedRadio) role = checkedRadio.value;
        }
      }
      
      try {
        const user = await window.SahakarDB.signUp(email, password, role, name);
        if (isCustomerPage) {
          window.location.href = '/customer-dashboard.html';
        } else if (isWorkerPage) {
          window.location.href = '/onboarding.html';
        } else {
          redirectUser(user.role);
        }
      } catch (err) {
        console.error(err);
        if (errorMsg) {
          errorMsg.textContent = err.message || (window.I18n ? window.I18n.t('error') : 'Signup failed.');
        }
      }
    });
  }

  function redirectUser(role) {
    if (role === 'admin') {
      window.location.href = '/admin.html';
    } else if (role === 'worker') {
      const onboarded = localStorage.getItem('sahakar_worker_profile');
      window.location.href = onboarded ? '/dashboard.html' : '/onboarding.html';
    } else {
      window.location.href = '/customer-dashboard.html';
    }
  }

  function setupLanguageSelector() {
    const langSelect = document.getElementById('lang-select');
    if (!langSelect) return;
    
    const langs = window.I18n.getLanguages();
    langs.forEach(l => {
      const option = document.createElement('option');
      option.value = l.code;
      option.textContent = l.nativeName;
      if (l.code === window.I18n.getCurrentLanguage()) {
        option.selected = true;
      }
      langSelect.appendChild(option);
    });

    langSelect.addEventListener('change', (e) => {
      window.I18n.setLanguage(e.target.value);
    });
  }
});
