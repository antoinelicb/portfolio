document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // ========================================================================
  // CONFIGURATION ET CONSTANTES
  // ========================================================================

  const CONFIG = {
    SCROLL_THRESHOLD: 10,
    INTERSECTION_THRESHOLD: 0.15,
    THEME_STORAGE_KEY: 'preferred-theme',
    SCROLL_DEBOUNCE_DELAY: 10,
    ANIMATION_DELAY: 100
  };

  const SELECTORS = {
    fadeElements: '.fade-in',
    hamburger: '.hamburger',
    navLinks: '.nav-links',
    navbar: '.navbar',
    themeToggle: '#theme-toggle',
    themeIcon: '#theme-toggle i',
    scrollUpBtn: '#scrollUpBtn'
  };

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  const debounce = (func, wait) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const safeQuerySelector = (selector) => {
    const el = document.querySelector(selector);
    if (!el) console.warn(`Élément non trouvé: ${selector}`);
    return el;
  };

  const storage = {
    get: (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  };

  // ========================================================================
  // SCROLL ANIMATIONS
  // ========================================================================

  class ScrollAnimations {
    constructor() {
      this.elements = document.querySelectorAll(SELECTORS.fadeElements);
      if (this.elements.length) this.init();
    }
    init() {
      const observerOptions = {
        threshold: CONFIG.INTERSECTION_THRESHOLD,
        rootMargin: '0px 0px -50px 0px'
      };
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, index * CONFIG.ANIMATION_DELAY);
            this.observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      this.elements.forEach(el => this.observer.observe(el));
    }
  }

  // ========================================================================
  // MOBILE NAVIGATION
  // ========================================================================

  class MobileNavigation {
    constructor() {
      this.hamburger = safeQuerySelector(SELECTORS.hamburger);
      this.navLinks = safeQuerySelector(SELECTORS.navLinks);
      this.isOpen = false;
      if (this.hamburger && this.navLinks) this.init();
    }
    init() {
      this.hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
      this.navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });
      document.addEventListener('click', (e) => {
        if (this.isOpen &&
            !this.hamburger.contains(e.target) &&
            !this.navLinks.contains(e.target)) this.close();
      });
      window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768 && this.isOpen) this.close();
      }, 250));
    }
    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }
    open() {
      this.hamburger.classList.add('open');
      this.navLinks.classList.add('open');
      this.hamburger.setAttribute('aria-expanded', 'true');
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
    }
    close() {
      this.hamburger.classList.remove('open');
      this.navLinks.classList.remove('open');
      this.hamburger.setAttribute('aria-expanded', 'false');
      this.isOpen = false;
      document.body.style.overflow = '';
    }
  }

  // ========================================================================
  // NAVBAR SCROLL
  // ========================================================================

  class NavbarScroll {
    constructor() {
      this.navbar = safeQuerySelector(SELECTORS.navbar);
      this.isScrolled = false;
      if (this.navbar) this.init();
    }
    init() {
      this.checkScroll();
      window.addEventListener('scroll', debounce(() => this.checkScroll(), CONFIG.SCROLL_DEBOUNCE_DELAY), { passive: true });
    }
    checkScroll() {
      const shouldBeScrolled = window.scrollY > CONFIG.SCROLL_THRESHOLD;
      if (shouldBeScrolled !== this.isScrolled) {
        this.isScrolled = shouldBeScrolled;
        this.navbar.classList.toggle('scrolled', this.isScrolled);
      }
    }
  }

  // ========================================================================
  // THEME MANAGER
  // ========================================================================

  class ThemeManager {
    constructor() {
      this.toggleButton = safeQuerySelector(SELECTORS.themeToggle);
      this.body = document.body;
      this.currentTheme = 'light';
      if (this.toggleButton) this.init();
    }
    init() {
      this.loadSavedTheme();
      this.toggleButton.addEventListener('click', () => this.toggle());
      if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', (e) => {
          if (!storage.get(CONFIG.THEME_STORAGE_KEY)) {
            this.setTheme(e.matches ? 'dark' : 'light');
          }
        });
      }
    }
    loadSavedTheme() {
      const savedTheme = storage.get(CONFIG.THEME_STORAGE_KEY);
      if (savedTheme) this.setTheme(savedTheme);
      else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light');
      }
    }
    toggle() {
      const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
      storage.set(CONFIG.THEME_STORAGE_KEY, newTheme);
    }
    setTheme(theme) {
      this.currentTheme = theme;
      this.body.classList.toggle('dark', theme === 'dark');
      this.updateIcon(theme);
      this.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      setTimeout(() => {
        this.body.style.transition = '';
      }, 300);
    }
    updateIcon(theme) {
      const icon = this.toggleButton.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
        lucide.createIcons();
      }
    }
  }

  // ========================================================================
  // SCROLL UP BUTTON
  // ========================================================================

  const scrollUpBtn = safeQuerySelector(SELECTORS.scrollUpBtn);
  if (scrollUpBtn) {
    window.addEventListener('scroll', () => {
      scrollUpBtn.style.display = window.scrollY > 300 ? 'inline-flex' : 'none';
    });
    scrollUpBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========================================================================
  // INITIALISATIONS
  // ========================================================================

  new ScrollAnimations();
  new MobileNavigation();
  new NavbarScroll();
  new ThemeManager();
  // Gestion simple FAQ accordéon
const faqButtons = document.querySelectorAll('.faq-question');

faqButtons.forEach(button => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !expanded);
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    if (answer) {
      if (expanded) {
        answer.hidden = true;
      } else {
        answer.hidden = false;
      }
    }
  });
});

});


