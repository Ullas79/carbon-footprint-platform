/**
 * EcoTrack - Main Application Controller
 * 
 * Handles SPA routing, view management, navigation, theme switching,
 * and initialization of all modules.
 * 
 * @namespace EcoTrack.App
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.App = (() => {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────
  let currentView = 'dashboard';
  let isInitialized = false;
  let isTransitioning = false;

  // ─── View Registry ────────────────────────────────────────────────
  const VIEWS = {
    dashboard: {
      title: 'Dashboard',
      icon: '📊',
      render: () => EcoTrack.Dashboard?.renderDashboard(),
      label: 'View your carbon footprint dashboard'
    },
    tracker: {
      title: 'Log Activity',
      icon: '📝',
      render: () => EcoTrack.Tracker?.renderTrackerPage(),
      label: 'Log your daily activities'
    },
    insights: {
      title: 'Insights',
      icon: '💡',
      render: () => EcoTrack.Insights?.renderDetailedInsights(),
      label: 'View personalized carbon reduction insights'
    },
    challenges: {
      title: 'Challenges',
      icon: '🏆',
      render: () => EcoTrack.Challenges?.renderChallengesPage(),
      label: 'Browse and join eco challenges'
    },
    assistant: {
      title: 'EcoBot',
      icon: '🤖',
      render: () => EcoTrack.Assistant?.renderChat(),
      label: 'Chat with your AI eco assistant'
    },
    settings: {
      title: 'Settings',
      icon: '⚙️',
      render: () => renderSettingsPage(),
      label: 'Adjust your preferences'
    }
  };

  // ─── Initialization ───────────────────────────────────────────────

  /**
   * Initialize the application.
   * Sets up the store, checks onboarding status, renders the shell,
   * and initializes all modules.
   */
  function init() {
    if (isInitialized) return;

    console.log('%c🌿 EcoTrack v1.0.0', 'color: #10B981; font-size: 16px; font-weight: bold;');
    console.log('%cCarbon Footprint Awareness Platform', 'color: #94A3B8; font-size: 12px;');

    try {
      // Initialize data store
      EcoTrack.Store.init();

      // Apply saved theme and accessibility settings
      applySettings();

      // Initialize accessibility utilities
      EcoTrack.Accessibility?.init();

      // Check if onboarding is needed
      const onboarding = EcoTrack.Store.getOnboardingData();
      if (!onboarding || !onboarding.completed) {
        renderOnboarding();
      } else {
        renderAppShell();
        initModules();
        navigateTo('dashboard', false);
      }

      // Set up event listeners
      setupEventListeners();

      isInitialized = true;

      // Check if tests should run automatically via query param
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('test') || urlParams.has('tests') || urlParams.has('runTests')) {
        setTimeout(() => {
          runTests();
        }, 500);
      }
    } catch (error) {
      console.error('EcoTrack initialization failed:', error);
      renderErrorState(error);
    }
  }

  /**
   * Initialize all application modules
   */
  function initModules() {
    try {
      EcoTrack.Calculator?.init?.();
      EcoTrack.Charts?.init?.();
      EcoTrack.Dashboard?.init?.();
      EcoTrack.Tracker?.init?.();
      EcoTrack.Insights?.init?.();
      EcoTrack.Challenges?.init?.();
      EcoTrack.Assistant?.init?.();
    } catch (error) {
      console.error('Module initialization error:', error);
    }
  }

  // ─── Routing & Navigation ─────────────────────────────────────────

  /**
   * Navigate to a view
   * @param {string} viewName - Name of the view to navigate to
   * @param {boolean} [pushState=true] - Whether to push to browser history
   */
  function navigateTo(viewName, pushState = true) {
    if (!VIEWS[viewName] || isTransitioning) return;
    if (viewName === currentView && isInitialized) return;

    isTransitioning = true;

    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      isTransitioning = false;
      return;
    }

    // Update active nav item
    updateActiveNav(viewName);

    // Page transition
    mainContent.classList.add('page-exit');

    setTimeout(() => {
      currentView = viewName;

      // Update page title
      document.title = `${VIEWS[viewName].title} | EcoTrack`;

      // Render the view
      try {
        VIEWS[viewName].render();
      } catch (error) {
        console.error(`Error rendering ${viewName}:`, error);
        mainContent.innerHTML = renderErrorContent(error);
      }

      // Animate in
      mainContent.classList.remove('page-exit');
      mainContent.classList.add('page-enter');

      setTimeout(() => {
        mainContent.classList.remove('page-enter');
        isTransitioning = false;
      }, 300);

      // Update browser history
      if (pushState) {
        history.pushState({ view: viewName }, '', `#${viewName}`);
      }

      // Scroll to top
      window.scrollTo(0, 0);

      // Announce to screen readers
      EcoTrack.Accessibility?.announceToScreenReader(
        `Navigated to ${VIEWS[viewName].title}`
      );
    }, 150);
  }

  /**
   * Update active state on navigation items
   * @param {string} viewName - Active view name
   */
  function updateActiveNav(viewName) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const isActive = item.dataset.view === viewName;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  // ─── Rendering ────────────────────────────────────────────────────

  /**
   * Render the onboarding wizard
   */
  function renderOnboarding() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div id="onboarding-container" class="onboarding-container" role="main" aria-label="Onboarding wizard">
      </div>
    `;

    // Initialize onboarding after DOM is ready
    setTimeout(() => {
      EcoTrack.Onboarding?.init();
    }, 100);
  }

  /**
   * Render the main application shell (sidebar + content area)
   */
  function renderAppShell() {
    const app = document.getElementById('app');
    if (!app) return;

    const profile = EcoTrack.Store.getUserProfile();
    const settings = EcoTrack.Store.getSettings();

    app.innerHTML = `
      <!-- Skip Navigation -->
      <a href="#main-content" class="skip-nav" id="skip-nav">Skip to main content</a>

      <div class="app-layout" role="presentation">
        <!-- Sidebar Navigation -->
        <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
          <div class="sidebar__logo">
            <div class="sidebar__logo-icon" aria-hidden="true">
              <span>🌿</span>
            </div>
            <div class="sidebar__logo-text">
              <span class="sidebar__logo-name">EcoTrack</span>
              <span class="sidebar__logo-tagline">Carbon Tracker</span>
            </div>
          </div>

          <nav class="sidebar__nav" role="menubar" aria-label="Primary navigation">
            ${Object.entries(VIEWS).map(([key, view]) => `
              <button class="nav-item" data-view="${key}" role="menuitem"
                      aria-label="${view.label}" tabindex="0">
                <span class="nav-item__icon" aria-hidden="true">${view.icon}</span>
                <span class="nav-item__label">${view.title}</span>
                <span class="nav-item__mobile-label">${view.title}</span>
              </button>
            `).join('')}
          </nav>

          <div class="sidebar__footer">
            <div class="sidebar__user">
              <div class="avatar avatar--sm" aria-hidden="true">
                <span>🌱</span>
              </div>
              <div class="sidebar__user-info">
                <span class="sidebar__user-name">${EcoTrack.Utils.sanitizeInput(profile.name || 'Eco Explorer')}</span>
                <span class="sidebar__user-level">Lvl ${profile.level || 1} · ${getLevelTitle(profile.level || 1)}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content" id="main-content" role="main" 
              aria-label="Main content" tabindex="-1">
          <!-- Views are rendered here -->
        </main>
      </div>

      <!-- Toast Container -->
      <div id="toast-container" class="toast-container" 
           role="status" aria-live="polite" aria-label="Notifications">
      </div>

      <!-- Modal Container -->
      <div id="modal-container" class="modal-container" role="presentation">
      </div>

      <!-- Screen Reader Announcements -->
      <div id="sr-announcements" class="sr-only" 
           aria-live="assertive" aria-atomic="true">
      </div>
    `;
  }

  /**
   * Render settings page
   */
  function renderSettingsPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const settings = EcoTrack.Store.getSettings();
    const profile = EcoTrack.Store.getUserProfile();

    mainContent.innerHTML = `
      <div class="page-container animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">⚙️ Settings</h1>
            <p class="page-subtitle">Customize your EcoTrack experience</p>
          </div>
        </div>

        <div class="settings-grid">
          <!-- Profile Section -->
          <div class="card settings-card animate-fade-in stagger-1">
            <div class="card-header">
              <h2>👤 Profile</h2>
            </div>
            <div class="card-body">
              <div class="input-group">
                <label for="settings-name">Display Name</label>
                <input type="text" id="settings-name" class="input" 
                       value="${EcoTrack.Utils.sanitizeInput(profile.name || '')}"
                       placeholder="Your name" maxlength="50"
                       aria-describedby="name-help">
                <small id="name-help" class="input-help">This is how EcoBot will address you</small>
              </div>
              <div class="input-group">
                <label for="settings-country">Country</label>
                <select id="settings-country" class="select" aria-label="Select your country">
                  ${renderCountryOptions(profile.country)}
                </select>
              </div>
              <button class="btn btn-primary" id="save-profile-btn" aria-label="Save profile changes">
                Save Profile
              </button>
            </div>
          </div>

          <!-- Appearance Section -->
          <div class="card settings-card animate-fade-in stagger-2">
            <div class="card-header">
              <h2>🎨 Appearance</h2>
            </div>
            <div class="card-body">
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Dark Mode</span>
                  <span class="setting-desc">Use dark color scheme</span>
                </div>
                <label class="switch" aria-label="Toggle dark mode">
                  <input type="checkbox" id="toggle-dark-mode" 
                         ${settings.theme === 'dark' ? 'checked' : ''}>
                  <span class="switch-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">High Contrast</span>
                  <span class="setting-desc">Increase contrast for better visibility</span>
                </div>
                <label class="switch" aria-label="Toggle high contrast mode">
                  <input type="checkbox" id="toggle-high-contrast"
                         ${settings.highContrast ? 'checked' : ''}>
                  <span class="switch-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Reduce Motion</span>
                  <span class="setting-desc">Minimize animations</span>
                </div>
                <label class="switch" aria-label="Toggle reduced motion">
                  <input type="checkbox" id="toggle-reduced-motion"
                         ${settings.reducedMotion ? 'checked' : ''}>
                  <span class="switch-slider"></span>
                </label>
              </div>
              <div class="input-group">
                <label for="font-size-select">Font Size</label>
                <select id="font-size-select" class="select" aria-label="Select font size">
                  <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                  <option value="normal" ${settings.fontSize === 'normal' ? 'selected' : ''}>Normal</option>
                  <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                  <option value="xlarge" ${settings.fontSize === 'xlarge' ? 'selected' : ''}>Extra Large</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Units Section -->
          <div class="card settings-card animate-fade-in stagger-3">
            <div class="card-header">
              <h2>📏 Units & Goals</h2>
            </div>
            <div class="card-body">
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Units</span>
                  <span class="setting-desc">Metric (kg, km) or Imperial (lbs, miles)</span>
                </div>
                <select id="units-select" class="select select-sm" aria-label="Select measurement units">
                  <option value="metric" ${settings.units === 'metric' ? 'selected' : ''}>Metric</option>
                  <option value="imperial" ${settings.units === 'imperial' ? 'selected' : ''}>Imperial</option>
                </select>
              </div>
              <div class="input-group">
                <label for="daily-goal">Daily CO₂ Target (kg)</label>
                <input type="number" id="daily-goal" class="input" 
                       value="${EcoTrack.Store.get('goals')?.daily || 10}"
                       min="1" max="100" step="1"
                       aria-describedby="goal-help">
                <small id="goal-help" class="input-help">Your daily carbon budget in kg CO₂</small>
              </div>
              <button class="btn btn-primary" id="save-goals-btn" aria-label="Save goal changes">
                Save Goals
              </button>
            </div>
          </div>

          <!-- Data Section -->
          <div class="card settings-card animate-fade-in stagger-4">
            <div class="card-header">
              <h2>💾 Data Management</h2>
            </div>
            <div class="card-body">
              <div class="settings-actions">
                <button class="btn btn-secondary" id="export-data-btn" 
                        aria-label="Export all data as JSON file">
                  📥 Export Data
                </button>
                <button class="btn btn-secondary" id="import-data-btn"
                        aria-label="Import data from JSON file">
                  📤 Import Data
                </button>
                <input type="file" id="import-file-input" accept=".json" 
                       class="visually-hidden" aria-hidden="true">
                <button class="btn btn-secondary" id="restart-onboarding-btn"
                        aria-label="Restart the onboarding wizard">
                  🔄 Redo Onboarding
                </button>
                <button class="btn btn-danger" id="clear-data-btn"
                        aria-label="Delete all data permanently">
                  🗑️ Clear All Data
                </button>
              </div>
            </div>
          </div>

          <!-- About Section -->
          <div class="card settings-card animate-fade-in stagger-5">
            <div class="card-header">
              <h2>ℹ️ About EcoTrack</h2>
            </div>
            <div class="card-body">
              <div class="about-info">
                <p><strong>EcoTrack</strong> v1.0.0</p>
                <p>A Carbon Footprint Awareness Platform that helps you understand, track, and reduce your environmental impact through personalized insights and actionable challenges.</p>
                <p class="text-muted">Built with 💚 for a greener future</p>
                <p class="text-muted">Emission data sourced from UK DEFRA, IEA, and Our World in Data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach settings event listeners
    setupSettingsListeners();
  }

  /**
   * Render country select options
   */
  function renderCountryOptions(selected) {
    const countries = [
      { code: 'global', name: 'Global Average' },
      { code: 'us', name: 'United States' },
      { code: 'canada', name: 'Canada' },
      { code: 'uk', name: 'United Kingdom' },
      { code: 'germany', name: 'Germany' },
      { code: 'france', name: 'France' },
      { code: 'australia', name: 'Australia' },
      { code: 'japan', name: 'Japan' },
      { code: 'china', name: 'China' },
      { code: 'india', name: 'India' },
      { code: 'brazil', name: 'Brazil' },
      { code: 'eu', name: 'European Union' }
    ];
    return countries.map(c => 
      `<option value="${c.code}" ${selected === c.code ? 'selected' : ''}>${c.name}</option>`
    ).join('');
  }

  /**
   * Get level title for a given level number
   * @param {number} level
   * @returns {string}
   */
  function getLevelTitle(level) {
    const titles = {
      1: 'Eco Seedling',
      2: 'Green Sprout',
      3: 'Growing Tree',
      4: 'Forest Guide',
      5: 'Nature Guardian',
      6: 'Earth Protector',
      7: 'Climate Champion',
      8: 'Eco Leader',
      9: 'Planet Hero',
      10: 'Eco Legend'
    };
    return titles[Math.min(level, 10)] || 'Eco Legend';
  }

  // ─── Settings Event Listeners ─────────────────────────────────────

  function setupSettingsListeners() {
    // Save profile
    document.getElementById('save-profile-btn')?.addEventListener('click', () => {
      const name = document.getElementById('settings-name')?.value?.trim();
      const country = document.getElementById('settings-country')?.value;
      
      if (name) {
        const profile = EcoTrack.Store.getUserProfile();
        profile.name = name;
        profile.country = country;
        EcoTrack.Store.setUserProfile(profile);
        
        // Update sidebar user name
        const userNameEl = document.querySelector('.user-name');
        if (userNameEl) userNameEl.textContent = EcoTrack.Utils.sanitizeInput(name);
        
        EcoTrack.Utils.showToast('Profile saved! 👤', 'success');
      }
    });

    // Dark mode toggle
    document.getElementById('toggle-dark-mode')?.addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      EcoTrack.Store.updateSettings({ theme });
      document.body.classList.toggle('light-mode', theme === 'light');
      EcoTrack.Utils.showToast(`${theme === 'dark' ? '🌙' : '☀️'} ${theme.charAt(0).toUpperCase() + theme.slice(1)} mode enabled`, 'success');
    });

    // High contrast toggle
    document.getElementById('toggle-high-contrast')?.addEventListener('change', (e) => {
      EcoTrack.Store.updateSettings({ highContrast: e.target.checked });
      EcoTrack.Accessibility?.toggleHighContrast();
    });

    // Reduced motion toggle
    document.getElementById('toggle-reduced-motion')?.addEventListener('change', (e) => {
      EcoTrack.Store.updateSettings({ reducedMotion: e.target.checked });
      EcoTrack.Accessibility?.toggleReducedMotion();
    });

    // Font size
    document.getElementById('font-size-select')?.addEventListener('change', (e) => {
      EcoTrack.Store.updateSettings({ fontSize: e.target.value });
      EcoTrack.Accessibility?.setFontSize(e.target.value);
    });

    // Units
    document.getElementById('units-select')?.addEventListener('change', (e) => {
      EcoTrack.Store.updateSettings({ units: e.target.value });
      EcoTrack.Utils.showToast('Units updated! 📏', 'success');
    });

    // Save goals
    document.getElementById('save-goals-btn')?.addEventListener('click', () => {
      const daily = parseFloat(document.getElementById('daily-goal')?.value) || 10;
      const goals = EcoTrack.Store.get('goals') || {};
      goals.daily = EcoTrack.Utils.clamp(daily, 1, 100);
      goals.weekly = goals.daily * 7;
      goals.monthly = goals.daily * 30;
      EcoTrack.Store.set('goals', goals);
      EcoTrack.Utils.showToast('Goals updated! 🎯', 'success');
    });

    // Export data
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
      const data = EcoTrack.Store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrack-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      EcoTrack.Utils.showToast('Data exported! 📥', 'success');
    });

    // Import data
    document.getElementById('import-data-btn')?.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });

    document.getElementById('import-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          EcoTrack.Store.importData(event.target.result);
          EcoTrack.Utils.showToast('Data imported successfully! 📤', 'success');
          setTimeout(() => location.reload(), 1000);
        } catch (error) {
          EcoTrack.Utils.showToast('Invalid data file! ❌', 'error');
        }
      };
      reader.readAsText(file);
    });

    // Restart onboarding
    document.getElementById('restart-onboarding-btn')?.addEventListener('click', () => {
      if (confirm('This will restart the onboarding wizard. Your data will be preserved. Continue?')) {
        const onboarding = EcoTrack.Store.getOnboardingData();
        onboarding.completed = false;
        EcoTrack.Store.setOnboardingData(onboarding);
        location.reload();
      }
    });

    // Clear all data
    document.getElementById('clear-data-btn')?.addEventListener('click', () => {
      if (confirm('⚠️ This will permanently delete ALL your data. This cannot be undone. Are you sure?')) {
        if (confirm('Really delete everything? Last chance!')) {
          EcoTrack.Store.clearAllData();
          location.reload();
        }
      }
    });
  }

  // ─── Theme & Settings ─────────────────────────────────────────────

  /**
   * Apply saved settings to the DOM
   */
  function applySettings() {
    const settings = EcoTrack.Store.getSettings();

    // Theme
    if (settings.theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }

    // High contrast
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }

    // Font size
    if (settings.fontSize && settings.fontSize !== 'normal') {
      document.body.classList.add(`font-${settings.fontSize}`);
    }
  }

  // ─── Event Listeners ──────────────────────────────────────────────

  function setupEventListeners() {
    // Navigation click handler (delegated)
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        e.preventDefault();
        const view = navItem.dataset.view;
        if (view) navigateTo(view);
      }
    });

    // Keyboard navigation for nav items
    document.addEventListener('keydown', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const view = navItem.dataset.view;
        if (view) navigateTo(view);
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state?.view) {
        navigateTo(e.state.view, false);
      }
    });

    // Handle hash navigation
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1);
      if (VIEWS[hash]) {
        navigateTo(hash, false);
      }
    });

    // Check initial hash
    const initialHash = location.hash.slice(1);
    if (initialHash && VIEWS[initialHash]) {
      currentView = initialHash;
    }
  }

  // ─── Error Handling ───────────────────────────────────────────────

  function renderErrorState(error) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="error-state" role="alert">
          <div class="error-content">
            <span class="error-icon" aria-hidden="true">⚠️</span>
            <h1>Something went wrong</h1>
            <p>${EcoTrack.Utils?.sanitizeInput(error.message) || 'An unexpected error occurred.'}</p>
            <button class="btn btn-primary" onclick="location.reload()">
              Reload App
            </button>
          </div>
        </div>
      `;
    }
  }

  function renderErrorContent(error) {
    return `
      <div class="empty-state" role="alert">
        <span class="empty-icon" aria-hidden="true">⚠️</span>
        <h2>Failed to load this page</h2>
        <p>${EcoTrack.Utils?.sanitizeInput(error.message) || 'Please try again.'}</p>
        <button class="btn btn-primary" onclick="EcoTrack.App.navigateTo('dashboard')">
          Go to Dashboard
        </button>
      </div>
    `;
  }

  // ─── Post-Onboarding Entry Point ─────────────────────────────────

  /**
   * Called by Onboarding module after completion
   * to transition from onboarding to the main app.
   */
  function onOnboardingComplete() {
    renderAppShell();
    initModules();
    navigateTo('dashboard', false);

    // Show welcome toast
    const profile = EcoTrack.Store.getUserProfile();
    setTimeout(() => {
      EcoTrack.Utils.showToast(
        `Welcome to EcoTrack, ${EcoTrack.Utils.sanitizeInput(profile.name || 'Explorer')}! 🌿`,
        'success',
        4000
      );
    }, 500);
  }

  // ─── Testing ──────────────────────────────────────────────────────

  /**
   * Run built-in tests
   */
  function runTests() {
    console.log('%c🧪 Running EcoTrack Tests...', 'color: #3B82F6; font-size: 14px;');
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
      if (condition) {
        console.log(`  ✅ ${testName}`);
        passed++;
      } else {
        console.error(`  ❌ ${testName}`);
        failed++;
      }
    }

    // Utils tests
    assert(EcoTrack.Utils.formatNumber(1234.5, 1) === '1,234.5', 'Utils.formatNumber');
    assert(EcoTrack.Utils.sanitizeInput('<script>alert("xss")</script>').indexOf('<script>') === -1, 'Utils.sanitizeInput blocks XSS');
    assert(EcoTrack.Utils.clamp(5, 0, 10) === 5, 'Utils.clamp within range');
    assert(EcoTrack.Utils.clamp(-1, 0, 10) === 0, 'Utils.clamp below min');
    assert(EcoTrack.Utils.clamp(15, 0, 10) === 10, 'Utils.clamp above max');
    assert(typeof EcoTrack.Utils.generateId() === 'string', 'Utils.generateId returns string');
    assert(EcoTrack.Utils.generateId() !== EcoTrack.Utils.generateId(), 'Utils.generateId is unique');

    // Calculator tests
    const carCO2 = EcoTrack.Calculator.calculateActivity('transport', 'car_petrol', 10);
    assert(carCO2 > 0, 'Calculator.calculateActivity returns positive CO2 for car');
    assert(EcoTrack.Calculator.calculateActivity('transport', 'bicycle', 10) === 0, 'Calculator: bicycle is zero emission');
    assert(EcoTrack.Calculator.calculateActivity('food', 'vegan_meal', 1) < EcoTrack.Calculator.calculateActivity('food', 'high_meat_meal', 1), 'Calculator: vegan < meat');

    // Store tests
    const testKey = '__test__';
    EcoTrack.Store.set(testKey, { test: true });
    assert(EcoTrack.Store.get(testKey)?.test === true, 'Store.set/get roundtrip');
    localStorage.removeItem(`ecotrack_${testKey}`);

    // Country averages
    const averages = EcoTrack.Calculator.getCountryAverages();
    assert(averages.us > averages.india, 'US average > India average');
    assert(averages.global > 0, 'Global average is positive');

    // Trees calculation
    const trees = EcoTrack.Calculator.treesNeededToOffset(220);
    assert(trees === 10, 'treesNeededToOffset(220) = 10 trees');

    // Accessibility tests
    const initialPrefs = EcoTrack.Accessibility?.getPreferences();
    if (initialPrefs) {
      assert(typeof initialPrefs.reducedMotion === 'boolean', 'Accessibility: reducedMotion preference is boolean');
      assert(typeof initialPrefs.highContrast === 'boolean', 'Accessibility: highContrast preference is boolean');
    }

    // Tracker tests
    if (EcoTrack.Tracker) {
      const initialLogsCount = EcoTrack.Tracker.getTodayActivities().length;
      EcoTrack.Tracker.logActivity('transport', 'car_petrol', 10);
      const newLogs = EcoTrack.Tracker.getTodayActivities();
      assert(newLogs.length === initialLogsCount + 1, 'Tracker: activity logged successfully');
      const lastLog = newLogs.find(l => l.value === 10 && l.type === 'car_petrol');
      if (lastLog) {
        assert(lastLog.category === 'transport' && lastLog.type === 'car_petrol' && lastLog.value === 10, 'Tracker: correct activity details');
        EcoTrack.Tracker.deleteActivity(lastLog.id);
        assert(EcoTrack.Tracker.getTodayActivities().length === initialLogsCount, 'Tracker: activity deleted successfully');
      }
    }

    // Challenges tests
    if (EcoTrack.Challenges) {
      const lvlInfo = EcoTrack.Challenges.getLevelInfo(0);
      assert(lvlInfo.level === 1, 'Challenges: 0 XP is Level 1');
      assert(lvlInfo.progressPercent === 0, 'Challenges: 0 XP has 0% progress');
      const badgeInfo = EcoTrack.Challenges.getBadgeInfo('first-log');
      assert(badgeInfo !== null && badgeInfo.name === 'First Step', 'Challenges: retrieved correct badge info');
    }

    // Insights tests
    if (EcoTrack.Insights) {
      const seasonalTips = EcoTrack.Insights.getSeasonalTips();
      assert(Array.isArray(seasonalTips) && seasonalTips.length > 0, 'Insights: retrieves seasonal tips');
      const contextualTip = EcoTrack.Insights.getContextualTip();
      assert(typeof contextualTip === 'string' && contextualTip.length > 0, 'Insights: retrieves contextual tip');
    }

    // Assistant tests
    if (EcoTrack.Assistant) {
      const intent = EcoTrack.Assistant.matchIntent('hello');
      assert(intent === 'greeting', 'Assistant: matches greeting intent');
      const botResponse = EcoTrack.Assistant.generateResponse('fact');
      assert(typeof botResponse === 'string' && botResponse.includes('Did you know?'), 'Assistant: generates fact response');
    }

    console.log(`\n%c🧪 Tests Complete: ${passed} passed, ${failed} failed`, 
      `color: ${failed === 0 ? '#10B981' : '#EF4444'}; font-size: 14px;`);
    
    return { passed, failed };
  }

  // ─── Public API ───────────────────────────────────────────────────

  return {
    init,
    navigateTo,
    onOnboardingComplete,
    getLevelTitle,
    renderCountryOptions,
    runTests,
    getCurrentView: () => currentView,
    getViews: () => VIEWS
  };
})();

// ─── Bootstrap ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  EcoTrack.App.init();
});
