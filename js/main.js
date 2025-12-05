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
    this.setupDropdownMenu();
    this.setupSmoothScrolling();
    this.setupActiveNavigation();
    this.setupKeyboardNavigation();
    this.setupScrollEffect();
  }

  setupScrollEffect() {
    if (!this.navbar) return;

    let lastScroll = 0;

    window.addEventListener('scroll', throttle(() => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 50) {
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, 16));
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
    this.navMenu.classList.toggle('mobile-open');
    
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    
    this.hamburger.setAttribute('aria-expanded', this.isMenuOpen);
    this.navMenu.setAttribute('aria-hidden', !this.isMenuOpen);
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
    this.hamburger.classList.remove('active');
    this.navMenu.classList.remove('mobile-open');
    document.body.style.overflow = '';
    
    this.hamburger.setAttribute('aria-expanded', 'false');
    this.navMenu.setAttribute('aria-hidden', 'true');
  }

  setupDropdownMenu() {
    const dropdown = document.querySelector('.nav-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const dropdownLink = dropdown?.querySelector('.nav-link');
    
    if (!dropdown || !dropdownMenu || !dropdownLink) return;

    const isMobile = () => window.innerWidth <= 768;
    let isDropdownOpen = false;

    const handleDropdownClick = (e) => {
      if (isMobile()) {
        e.preventDefault();
        isDropdownOpen = !isDropdownOpen;
        dropdown.classList.toggle('active', isDropdownOpen);
      }
    };

    const closeDropdown = () => {
      isDropdownOpen = false;
      dropdown.classList.remove('active');
    };

    dropdownLink.addEventListener('click', handleDropdownClick);

    document.addEventListener('click', (e) => {
      if (isMobile() && isDropdownOpen && !dropdown.contains(e.target)) {
        closeDropdown();
      }
    });

    window.addEventListener('resize', () => {
      if (!isMobile() && isDropdownOpen) {
        closeDropdown();
      }
    });
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

class ScrollAnimationManager {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window && !CONFIG.prefersReducedMotion) {
      this.setupScrollObserver();
      this.observeElements();
    } else {
      this.fallbackAnimation();
    }
  }

  setupScrollObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: CONFIG.observerRootMargin
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          this.observer.unobserve(entry.target);
        }
      });
    }, options);
  }

  observeElements() {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      this.observer.observe(el);
    });
  }

  fallbackAnimation() {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.classList.add('in-view');
    });
  }
}

class TypingEffect {
  constructor() {
    this.phrases = [
      'Intelligence Artificielle',
      'Machine Learning',
      'Solutions Métier',
      'Applications Web',
      'Deep Learning'
    ];
    this.currentPhrase = 0;
    this.currentChar = 0;
    this.isDeleting = false;
    this.typingSpeed = 100;
    this.deletingSpeed = 50;
    this.pauseTime = 2000;
    this.element = null;
    this.init();
  }

  init() {
    this.element = document.querySelector('.typing-text');
    if (this.element) {
      this.type();
    }
  }

  type() {
    const current = this.phrases[this.currentPhrase];

    if (this.isDeleting) {
      this.element.textContent = current.substring(0, this.currentChar - 1);
      this.currentChar--;
    } else {
      this.element.textContent = current.substring(0, this.currentChar + 1);
      this.currentChar++;
    }

    let typeSpeed = this.isDeleting ? this.deletingSpeed : this.typingSpeed;

    if (!this.isDeleting && this.currentChar === current.length) {
      typeSpeed = this.pauseTime;
      this.isDeleting = true;
    } else if (this.isDeleting && this.currentChar === 0) {
      this.isDeleting = false;
      this.currentPhrase = (this.currentPhrase + 1) % this.phrases.length;
      typeSpeed = 500;
    }

    setTimeout(() => this.type(), typeSpeed);
  }
}

class ParticlesBackground {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.particleCount = 50;
    this.mouse = { x: null, y: null, radius: 150 };
    this.init();
  }

  init() {
    const hero = document.querySelector('.hero');
    if (!hero || CONFIG.isMobile) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particles-canvas';
    hero.insertBefore(this.canvas, hero.firstChild);

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createParticles();
    this.animate();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
  }

  resize() {
    if (!this.canvas) return;
    const hero = this.canvas.parentElement;
    this.canvas.width = hero.offsetWidth;
    this.canvas.height = hero.offsetHeight;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle, index) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (this.mouse.x !== null) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mouse.radius) {
          const force = (this.mouse.radius - distance) / this.mouse.radius;
          particle.x -= dx * force * 0.02;
          particle.y -= dy * force * 0.02;
        }
      }

      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 102, 255, ${particle.opacity})`;
      this.ctx.fill();

      this.particles.slice(index + 1).forEach(other => {
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(0, 102, 255, ${0.1 * (1 - distance / 120)})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      });
    });

    requestAnimationFrame(() => this.animate());
  }
}

class CustomCursor {
  constructor() {
    this.cursor = null;
    this.cursorDot = null;
    this.init();
  }

  init() {
    if (CONFIG.isTouch || CONFIG.isMobile) return;

    this.cursor = document.createElement('div');
    this.cursor.className = 'custom-cursor';
    document.body.appendChild(this.cursor);

    this.cursorDot = document.createElement('div');
    this.cursorDot.className = 'cursor-dot';
    document.body.appendChild(this.cursorDot);

    document.body.classList.add('has-custom-cursor');

    document.addEventListener('mousemove', (e) => {
      this.cursor.style.left = e.clientX + 'px';
      this.cursor.style.top = e.clientY + 'px';
      this.cursorDot.style.left = e.clientX + 'px';
      this.cursorDot.style.top = e.clientY + 'px';
    });

    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, .card, .btn');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('cursor-hover');
      });
    });

    document.addEventListener('mousedown', () => {
      this.cursor.classList.add('cursor-click');
      this.cursorDot.classList.add('cursor-click');
    });
    document.addEventListener('mouseup', () => {
      this.cursor.classList.remove('cursor-click');
      this.cursorDot.classList.remove('cursor-click');
    });

    document.addEventListener('mouseleave', () => {
      this.cursor.style.opacity = '0';
      this.cursorDot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      this.cursor.style.opacity = '1';
      this.cursorDot.style.opacity = '1';
    });
  }
}

class PageTransitions {
  constructor() {
    this.transitionElement = null;
    this.init();
  }

  init() {
    this.transitionElement = document.createElement('div');
    this.transitionElement.className = 'page-transition';
    document.body.appendChild(this.transitionElement);

    document.body.classList.add('page-loaded');

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');

      if (href &&
          !href.startsWith('#') &&
          !href.startsWith('http') &&
          !href.startsWith('mailto') &&
          href.endsWith('.html')) {

        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigateTo(href);
        });
      }
    });
  }

  navigateTo(url) {
    this.transitionElement.classList.add('active');

    setTimeout(() => {
      window.location.href = url;
    }, 600);
  }
}

class RippleEffect {
  constructor() {
    this.init();
  }

  init() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

        btn.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    });
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
      this.components.scrollAnimation = new ScrollAnimationManager();
      this.components.lazyLoad = new LazyLoadManager();
      this.components.performance = new PerformanceManager();
      this.components.serviceWorker = new ServiceWorkerManager();

      this.components.typingEffect = new TypingEffect();
      this.components.particles = new ParticlesBackground();
      this.components.customCursor = new CustomCursor();
      this.components.pageTransitions = new PageTransitions();
      this.components.rippleEffect = new RippleEffect();

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

document.documentElement.classList.add('js-enabled');

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