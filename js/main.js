'use strict';

const CONFIG = {
  animationDuration: 600,
  scrollOffset: 50,
  observerThreshold: 0.1,
  observerRootMargin: '0px 0px -50px 0px',
  debounceDelay: 16,
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isMobile: window.innerWidth <= 768,
  isTouch: 'ontouchstart' in window,
  supportsPassive: (() => {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get() {
          supportsPassive = true;
        }
      });
      window.addEventListener('testPassive', null, opts);
      window.removeEventListener('testPassive', null, opts);
    } catch (e) {}
    return supportsPassive;
  })()
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
         !CONFIG.isMobile &&
         'animate' in document.createElement('div') &&
         window.requestAnimationFrame;
};

const logError = (error, context) => {
  console.error(`[Portfolio] Erreur dans ${context}:`, error);
};

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
          const targetPosition = target.offsetTop - 20;
          
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

      this.components.navigation = new NavigationManager();
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

const app = new PortfolioApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PortfolioApp, app };
}

window.portfolioDebug = {
  app,
  nav: () => app.components.navigation,
  perf: () => app.components.performance.metrics,
  reload: () => location.reload()
};

console.log('[Portfolio] Debug tools disponibles via window.portfolioDebug');