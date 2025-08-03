'use strict';

const CONFIG = {
  animationDuration: 600,
  scrollOffset: 50,
  observerThreshold: 0.1,
  observerRootMargin: '0px 0px -50px 0px',
  debounceDelay: 16,
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const supportsAnimations = () => {
  return !CONFIG.prefersReducedMotion && 
         'animate' in document.createElement('div');
};

const logError = (error, context) => {
  console.error(`[Portfolio] Erreur dans ${context}:`, error);
};

class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.toggleButton = document.querySelector('.theme-toggle');
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupToggleButton();
    this.watchSystemTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    
    if (this.toggleButton) {
      const icon = this.theme === 'dark' ? '☀️' : '🌙';
      this.toggleButton.innerHTML = icon;
      this.toggleButton.setAttribute('aria-label', 
        `Passer au thème ${this.theme === 'dark' ? 'clair' : 'sombre'}`
      );
    }

    document.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme: this.theme } 
    }));
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();

    if (supportsAnimations()) {
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      setTimeout(() => {
        document.body.style.transition = '';
      }, 300);
    }
  }

  setupToggleButton() {
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.toggleTheme();
        
        if (supportsAnimations()) {
          this.toggleButton.style.transform = 'scale(0.9)';
          setTimeout(() => {
            this.toggleButton.style.transform = '';
          }, 150);
        }
      });
    }
  }

  watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.theme = e.matches ? 'dark' : 'light';
        this.applyTheme();
      }
    });
  }
}

class NavigationManager {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.hamburger = document.querySelector('.hamburger');
    this.navMenu = document.querySelector('.nav-menu');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.isMenuOpen = false;
    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.setupSmoothScrolling();
    this.setupScrollNavbar();
    this.setupActiveNavigation();
    this.setupKeyboardNavigation();
  }

  setupHamburgerMenu() {
    if (this.hamburger && this.navMenu) {
      this.hamburger.addEventListener('click', () => {
        this.toggleMobileMenu();
      });

      this.navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (this.isMenuOpen) {
            this.closeMobileMenu();
          }
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isMenuOpen) {
          this.closeMobileMenu();
        }
      });

      document.addEventListener('click', (e) => {
        if (this.isMenuOpen && 
            !this.navMenu.contains(e.target) && 
            !this.hamburger.contains(e.target)) {
          this.closeMobileMenu();
        }
      });
    }
  }

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.hamburger.classList.toggle('active');
    this.navMenu.classList.toggle('active');
    
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    
    this.hamburger.setAttribute('aria-expanded', this.isMenuOpen);
    this.navMenu.setAttribute('aria-hidden', !this.isMenuOpen);
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
    this.hamburger.classList.remove('active');
    this.navMenu.classList.remove('active');
    document.body.style.overflow = '';
    
    this.hamburger.setAttribute('aria-expanded', 'false');
    this.navMenu.setAttribute('aria-hidden', 'true');
  }

  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = anchor.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
          const navbarHeight = this.navbar ? this.navbar.offsetHeight : 0;
          const targetPosition = target.offsetTop - navbarHeight - 20;
          
          if (supportsAnimations()) {
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          } else {
            window.scrollTo(0, targetPosition);
          }
        }
      });
    });
  }

  setupScrollNavbar() {
    const updateNavbar = throttle(() => {
      if (!this.navbar) return;
      
      const scrollY = window.scrollY;
      const theme = document.documentElement.getAttribute('data-theme');
      
      if (scrollY > CONFIG.scrollOffset) {
        this.navbar.style.background = theme === 'dark' 
          ? 'rgba(17, 24, 39, 0.98)' 
          : 'rgba(255, 255, 255, 0.98)';
        this.navbar.style.backdropFilter = 'blur(12px)';
        this.navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      } else {
        this.navbar.style.background = theme === 'dark' 
          ? 'rgba(17, 24, 39, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)';
        this.navbar.style.backdropFilter = 'blur(10px)';
        this.navbar.style.boxShadow = 'none';
      }
    }, CONFIG.debounceDelay);

    window.addEventListener('scroll', updateNavbar);
    
    document.addEventListener('themeChange', updateNavbar);
  }

  setupActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return;

    const updateActiveLink = throttle(() => {
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        const correspondingLink = document.querySelector(`a[href="#${sectionId}"]`);
        
        if (correspondingLink && 
            scrollPosition >= sectionTop && 
            scrollPosition < sectionTop + sectionHeight) {
          this.navLinks.forEach(link => link.classList.remove('active'));
          correspondingLink.classList.add('active');
        }
      });
    }, CONFIG.debounceDelay);

    window.addEventListener('scroll', updateActiveLink);
  }

  setupKeyboardNavigation() {
    this.navLinks.forEach((link, index) => {
      link.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = (index + 1) % this.navLinks.length;
          this.navLinks[nextIndex].focus();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = (index - 1 + this.navLinks.length) % this.navLinks.length;
          this.navLinks[prevIndex].focus();
        }
      });
    });
  }
}

class AnimationManager {
  constructor() {
    this.animatedElements = new Set();
    this.observer = null;
    this.init();
  }

  init() {
    if (supportsAnimations()) {
      this.setupIntersectionObserver();
      this.observeElements();
      this.setupMicroInteractions();
    } else {
      this.showAllElements();
    }
  }

  setupIntersectionObserver() {
    const options = {
      threshold: CONFIG.observerThreshold,
      rootMargin: CONFIG.observerRootMargin
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.animateElement(entry.target);
          this.animatedElements.add(entry.target);
        }
      });
    }, options);
  }

  observeElements() {
    const selectors = [
      '.animate-on-scroll',
      '.skill-card',
      '.feature-card', 
      '.timeline-item',
      '.card',
      '.hero-text',
      '.hero-image'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (!element.style.opacity) {
          element.style.opacity = '0';
          element.style.transform = 'translateY(30px)';
          element.style.transition = `opacity ${CONFIG.animationDuration}ms ease, transform ${CONFIG.animationDuration}ms ease`;
        }
        
        this.observer.observe(element);
      });
    });
  }

  animateElement(element) {
    try {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      element.classList.add('in-view');

      if (element.classList.contains('hero-text')) {
        setTimeout(() => {
          element.style.transform = 'translateY(0) scale(1)';
        }, 100);
      }

      if (element.classList.contains('card')) {
        const delay = Array.from(element.parentNode.children).indexOf(element) * 100;
        element.style.transitionDelay = `${delay}ms`;
      }

      if (element.classList.contains('timeline-item')) {
        element.style.transform = 'translateX(0) translateY(0)';
      }
    } catch (error) {
      logError(error, 'animateElement');
    }
  }

  setupMicroInteractions() {
    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('mouseenter', () => {
        if (supportsAnimations()) {
          button.style.transform = 'translateY(-2px)';
        }
      });

      button.addEventListener('mouseleave', () => {
        if (supportsAnimations()) {
          button.style.transform = '';
        }
      });

      button.addEventListener('mousedown', () => {
        if (supportsAnimations()) {
          button.style.transform = 'translateY(0) scale(0.98)';
        }
      });

      button.addEventListener('mouseup', () => {
        if (supportsAnimations()) {
          button.style.transform = 'translateY(-2px) scale(1)';
        }
      });
    });

    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        if (supportsAnimations() && window.innerWidth > 768) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 20;
          const rotateY = (centerX - x) / 20;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        if (supportsAnimations()) {
          card.style.transform = '';
        }
      });
    });
  }

  showAllElements() {
    document.querySelectorAll('[style*="opacity: 0"]').forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'none';
    });
  }
}

class LazyLoadManager {
  constructor() {
    this.imageObserver = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.setupImageObserver();
      this.observeImages();
    } else {
      this.loadAllImages();
    }
  }

  setupImageObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '50px 0px'
    };

    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.imageObserver.unobserve(entry.target);
        }
      });
    }, options);
  }

  observeImages() {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      this.imageObserver.observe(img);
    });
  }

  loadImage(img) {
    return new Promise((resolve, reject) => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }

      img.onload = () => {
        img.classList.add('loaded');
        img.style.opacity = '1';
        resolve();
      };

      img.onerror = () => {
        logError(new Error('Échec du chargement d\'image'), 'loadImage');
        reject();
      };
    });
  }

  loadAllImages() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      delete img.dataset.src;
      img.classList.add('loaded');
    });
  }
}

class PerformanceManager {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    this.measureCLS();
    this.measureFID();
    this.measureLCP();
    this.optimizeScrollPerformance();
  }

  measureCLS() {
    if ('web-vital' in window) {
      window.webVitals.getCLS(this.logMetric.bind(this, 'CLS'));
    }
  }

  measureFID() {
    if ('web-vital' in window) {
      window.webVitals.getFID(this.logMetric.bind(this, 'FID'));
    }
  }

  measureLCP() {
    if ('web-vital' in window) {
      window.webVitals.getLCP(this.logMetric.bind(this, 'LCP'));
    }
  }

  logMetric(name, metric) {
    this.metrics[name] = metric.value;
    console.log(`[Performance] ${name}:`, metric.value);
  }

  optimizeScrollPerformance() {
    const passiveOptions = { passive: true };
    
    document.addEventListener('scroll', (e) => {
      requestAnimationFrame(() => {
      });
    }, passiveOptions);

    document.addEventListener('touchstart', (e) => {
    }, passiveOptions);
  }
}


class ServiceWorkerManager {
  constructor() {
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('[ServiceWorker] Enregistrement réussi:', registration.scope);
        
        registration.addEventListener('updatefound', () => {
          console.log('[ServiceWorker] Mise à jour disponible');
        });
      } catch (error) {
        logError(error, 'ServiceWorker registration');
      }
    }
  }
}

class PortfolioApp {
  constructor() {
    this.components = {};
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      this.components.theme = new ThemeManager();
      this.components.navigation = new NavigationManager();
      this.components.animation = new AnimationManager();
      this.components.lazyLoad = new LazyLoadManager();
      this.components.performance = new PerformanceManager();
      this.components.serviceWorker = new ServiceWorkerManager();

      this.setupGlobalEvents();
      this.setupErrorHandling();

      this.isInitialized = true;
      console.log('[Portfolio] Application initialisée avec succès');
      
      document.dispatchEvent(new CustomEvent('portfolioReady'));
      
    } catch (error) {
      logError(error, 'App initialization');
    }
  }

  setupGlobalEvents() {
    const handleResize = debounce(() => {
      document.dispatchEvent(new CustomEvent('portfolioResize'));
    }, 250);
    
    window.addEventListener('resize', handleResize);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[Portfolio] Page masquée - pause des animations');
      } else {
        console.log('[Portfolio] Page visible - reprise des animations');
      }
    });

    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        logError(new Error('Image non trouvée'), 'Image loading');
      }
    }, true);
  }

  setupErrorHandling() {
    window.addEventListener('error', (e) => {
      logError(e.error, 'Global error');
    });

    window.addEventListener('unhandledrejection', (e) => {
      logError(e.reason, 'Unhandled promise rejection');
    });
  }
}


const SW_CODE = `
const CACHE_NAME = 'portfolio-v1';
const urlsToCache = [
  '/',
  '/assets/css/style.css',
  '/assets/css/responsive.css',
  '/assets/js/main.js',
  '/index.html',
  '/about.html',
  '/flowsteo.html',
  '/contact.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
`;

const app = new PortfolioApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PortfolioApp, app };
}


function createServiceWorkerFile() {
  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
    const blob = new Blob([SW_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    console.log('[ServiceWorker] Code généré. Créez le fichier sw.js avec le contenu suivant:', SW_CODE);
  }
}

createServiceWorkerFile();

window.portfolioDebug = {
  app,
  theme: () => app.components.theme,
  nav: () => app.components.navigation,
  perf: () => app.components.performance.metrics,
  toggleTheme: () => app.components.theme.toggleTheme(),
  reload: () => location.reload()
};

console.log('[Portfolio] Debug tools disponibles via window.portfolioDebug');
