// ═══ Telegram Saver Landing — Script ═══

const BACKEND_URL = 'https://tgsaver-backend.onrender.com';
const GOOGLE_WEB_CLIENT_ID = '1058038592594-pt2l6tjbapqvolcb2qeapmbm5bdv9er4.apps.googleusercontent.com';

// ═══ GOOGLE SIGN-IN ═══

function initGoogleSignIn() {
  if (typeof google === 'undefined') return;
  google.accounts.id.initialize({
    client_id: GOOGLE_WEB_CLIENT_ID,
    callback: handleGoogleSignIn,
    auto_select: false
  });
  google.accounts.id.renderButton(
    document.getElementById('g_id_signin'),
    { theme: 'filled_black', size: 'large', width: 300, text: 'signin_with', shape: 'rectangular', locale: 'ru' }
  );
}

async function handleGoogleSignIn(response) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/google-web`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('tgsaver_user', JSON.stringify(data.user));
      localStorage.setItem('tgsaver_session', data.sessionToken);
      updateUILoggedIn(data.user);
      // Show success in modal
      document.getElementById('login-state-initial').classList.add('hidden');
      document.getElementById('login-state-success').classList.remove('hidden');
      document.getElementById('login-success-msg').textContent =
        `Добро пожаловать, ${data.user.name}!`;
      // Close modal after 1.5s
      setTimeout(() => {
        document.getElementById('login-modal').classList.remove('open');
        // Reset modal state
        setTimeout(() => {
          document.getElementById('login-state-initial').classList.remove('hidden');
          document.getElementById('login-state-success').classList.add('hidden');
        }, 300);
      }, 1500);
    }
  } catch (err) {
    console.error('Login error:', err);
  }
}

// ═══ UI STATE MANAGEMENT ═══

function updateUILoggedIn(user) {
  // Hide login button, show user info
  document.getElementById('nav-login-btn').classList.add('hidden');
  const userInfo = document.getElementById('nav-user-info');
  userInfo.classList.remove('hidden');
  document.getElementById('nav-user-avatar').src = user.picture || '';
  document.getElementById('nav-user-name').textContent = user.name;

  // Show profile link in nav
  document.getElementById('nav-profile-link').classList.remove('hidden');

  // Prepare profile modal data (but keep it hidden until clicked)
  document.getElementById('profile-section').classList.remove('hidden');
  document.getElementById('profile-section').classList.remove('open');
  document.getElementById('profile-avatar').src = user.picture || '';
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-plan').textContent = user.plan.toUpperCase();

  // Load limits from backend
  loadUserLimits();
}

function updateUILoggedOut() {
  document.getElementById('nav-login-btn').classList.remove('hidden');
  document.getElementById('nav-user-info').classList.add('hidden');
  document.getElementById('nav-profile-link').classList.add('hidden');
  document.getElementById('profile-section').classList.add('hidden');
  localStorage.removeItem('tgsaver_user');
  localStorage.removeItem('tgsaver_session');
}

async function loadUserLimits() {
  const sessionToken = localStorage.getItem('tgsaver_session');
  if (!sessionToken) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/user/limits-by-id?userId=${sessionToken}`);
    if (!res.ok) throw new Error('Failed');
    const limits = await res.json();

    // Update plan badge
    document.getElementById('profile-plan').textContent = limits.plan.toUpperCase();

    // Update media
    const mMax = limits.mediaMax === null ? '∞' : limits.mediaMax;
    document.getElementById('profile-media-count').textContent = `${limits.mediaUsed} / ${mMax}`;
    const mediaPct = mMax === '∞' ? (limits.mediaUsed > 0 ? 100 : 0) : (limits.mediaUsed / limits.mediaMax) * 100;
    document.getElementById('profile-media-bar').style.width = Math.min(100, mediaPct) + '%';

    // Update text
    const tMax = limits.textMax === null ? '∞' : limits.textMax;
    document.getElementById('profile-text-count').textContent = `${limits.textUsed} / ${tMax}`;
    const textPct = tMax === '∞' ? (limits.textUsed > 0 ? 100 : 0) : (limits.textUsed / limits.textMax) * 100;
    document.getElementById('profile-text-bar').style.width = Math.min(100, textPct) + '%';

    // Update timer
    const remaining = limits.limitReset - Date.now();
    if (remaining > 0) {
      const minutes = Math.round(remaining / 60000);
      if (minutes < 60) {
        document.getElementById('profile-reset-timer').textContent = `Сброс через ${minutes} мин`;
      } else {
        const hours = Math.floor(remaining / 3600000);
        const days = Math.floor(hours / 24);
        const h = hours % 24;
        document.getElementById('profile-reset-timer').textContent = `Сброс через ${days}д ${h}ч`;
      }
    }
  } catch (err) {
    console.error('Failed to load limits:', err);
  }
}

// ═══ DOM READY ═══

document.addEventListener('DOMContentLoaded', () => {

  // ═══ NAVBAR SCROLL EFFECT ═══
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ═══ MOBILE NAV TOGGLE ═══
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // ═══ FAQ ACCORDION ═══
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ═══ SMOOTH SCROLL FOR ANCHOR LINKS ═══
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ═══ INTERSECTION OBSERVER — FADE IN ON SCROLL ═══
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for fade-in
  document.querySelectorAll('.feature-card, .step-card, .pricing-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Add visible class styles
  const style = document.createElement('style');
  style.textContent = `
    .feature-card.visible, .step-card.visible, .pricing-card.visible, .faq-item.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);

  // Stagger animation delays
  document.querySelectorAll('.features-grid .feature-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.1}s`;
  });

  document.querySelectorAll('.pricing-grid .pricing-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.1}s`;
  });

  document.querySelectorAll('.faq-list .faq-item').forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.08}s`;
  });

  // ═══ LOGIN / AUTH EVENT LISTENERS ═══

  // Login button opens modal
  document.getElementById('nav-login-btn').addEventListener('click', () => {
    document.getElementById('login-modal').classList.add('open');
    initGoogleSignIn(); // Initialize button when modal opens
  });

  // Close modal
  document.getElementById('login-modal-close').addEventListener('click', () => {
    document.getElementById('login-modal').classList.remove('open');
  });

  // Click outside to close
  document.getElementById('login-modal').addEventListener('click', (e) => {
    if (e.target.id === 'login-modal') {
      document.getElementById('login-modal').classList.remove('open');
    }
  });

  // Open profile modal
  function openProfileModal() {
    const modal = document.getElementById('profile-section');
    if (modal) {
      modal.classList.add('open');
      loadUserLimits();
    }
  }

  // Clicking user info in nav opens profile modal
  document.getElementById('nav-user-info').addEventListener('click', openProfileModal);

  // Profile link in nav opens profile modal
  document.getElementById('nav-profile-link').addEventListener('click', (e) => {
    e.preventDefault();
    openProfileModal();
  });

  // Close profile modal
  document.getElementById('profile-modal-close').addEventListener('click', () => {
    document.getElementById('profile-section').classList.remove('open');
  });

  // Click outside profile modal to close
  document.getElementById('profile-section').addEventListener('click', (e) => {
    if (e.target.id === 'profile-section') {
      document.getElementById('profile-section').classList.remove('open');
    }
  });

  // Logout
  document.getElementById('profile-logout-btn').addEventListener('click', () => {
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
    updateUILoggedOut();
  });

  // Check for saved session on load
  const savedUser = localStorage.getItem('tgsaver_user');
  if (savedUser) {
    try {
      updateUILoggedIn(JSON.parse(savedUser));
    } catch (e) {
      localStorage.removeItem('tgsaver_user');
    }
  }
});
