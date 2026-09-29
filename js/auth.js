document.addEventListener('DOMContentLoaded', async () => {
  // Check if already logged in
  if (window.SahakarDB) {
    const user = await window.SahakarDB.getCurrentUser();
    if (user) {
      redirectUser(user.role);
      return;
    }
  }

  // Set up i18n and Language selector if they exist
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

  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;
      
      try {
        const user = await window.SahakarDB.signIn(email, password);
        redirectUser(user.role);
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = window.I18n ? window.I18n.t('error') + ': Invalid credentials.' : 'Invalid credentials.';
        }
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      let role = 'customer';
      const roleRadios = document.getElementsByName('role');
      for (const r of roleRadios) {
        if (r.checked) {
          role = r.value;
          break;
        }
      }
      
      try {
        const user = await window.SahakarDB.signUp(email, password, role, name);
        redirectUser(user.role);
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = window.I18n ? window.I18n.t('error') : 'Signup failed.';
        }
      }
    });
  }

  function redirectUser(role) {
    if (role === 'admin') {
      window.location.href = 'admin.html';
    } else if (role === 'worker') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'booking.html';
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
