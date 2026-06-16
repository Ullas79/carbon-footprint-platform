/**
 * EcoTrack — Accessibility Utilities Module
 *
 * Provides keyboard-user detection, focus trapping for modals/dialogs,
 * screen-reader announcements, OS preference detection, skip-navigation,
 * and visual-preference toggles (high contrast, large text, reduced motion).
 *
 * Depends on: EcoTrack.Store (getSettings, updateSettings)
 *
 * @namespace EcoTrack.Accessibility
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.Accessibility = (() => {
  'use strict';

  // ─── Internal State ─────────────────────────────────────────────────

  /** @type {HTMLElement|null} Element that had focus before a trap was activated. */
  let _previousFocus = null;

  /** @type {HTMLElement|null} Element currently receiving focus-trap treatment. */
  let _trapElement = null;

  /** @type {Function|null} Bound keydown handler for the active focus trap. */
  let _trapHandler = null;

  /** @type {HTMLElement|null} Shared aria-live region for announcements. */
  let _liveRegion = null;

  /** Whether init() has already run (guard against double-init). */
  let _initialised = false;

  // ─── Selector for focusable elements ────────────────────────────────

  /** CSS selector covering all naturally focusable / tabbable elements. */
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
  ].join(', ');

  // ─── Initialisation ─────────────────────────────────────────────────

  /**
   * Bootstrap all accessibility features.
   * Safe to call multiple times — subsequent calls are no-ops.
   *
   * - Detects keyboard vs. pointer users.
   * - Creates the shared ARIA live region.
   * - Reads OS-level accessibility preferences.
   * - Sets up skip-navigation and ARIA labels.
   * - Restores any previously-saved visual preferences from the store.
   */
  function init() {
    if (_initialised) return;

    try {
      detectKeyboardUser();
      _createLiveRegion();
      _applyOsPreferences();
      _restoreSavedPreferences();
      setupSkipNavigation();
      setupAriaLabels();

      _initialised = true;
      console.info('[EcoTrack.Accessibility] Initialised.');
    } catch (err) {
      console.error('[EcoTrack.Accessibility] init() failed:', err);
    }
  }

  // ─── Keyboard / Pointer Detection ──────────────────────────────────

  /**
   * Add a `.keyboard-user` class to `<body>` when the user navigates with
   * Tab, and remove it when they click with a pointer. This lets CSS
   * show focus outlines only for keyboard users.
   */
  function detectKeyboardUser() {
    const onKeyDown = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    };

    const onMouseDown = () => {
      document.body.classList.remove('keyboard-user');
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
  }

  // ─── Focus Trapping ────────────────────────────────────────────────

  /**
   * Trap keyboard focus within a given container element (e.g. a modal).
   * Tab and Shift+Tab cycle only among focusable children; Escape
   * releases the trap.
   *
   * @param {HTMLElement} element — Container to trap focus within.
   */
  function trapFocus(element) {
    if (!element) return;

    // Release any existing trap first
    releaseFocus();

    _trapElement   = element;
    _previousFocus = document.activeElement;

    // Move focus to the first focusable child
    const focusable = _getFocusableChildren(element);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      // If nothing is focusable, make the container itself focusable
      element.setAttribute('tabindex', '-1');
      element.focus();
    }

    // Attach keydown handler for Tab cycling + Escape exit
    _trapHandler = (e) => {
      if (e.key === 'Escape') {
        releaseFocus();
        return;
      }

      if (e.key !== 'Tab') return;

      const nodes = _getFocusableChildren(_trapElement);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }

      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        // Shift+Tab from first → wrap to last
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        // Tab from last → wrap to first
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', _trapHandler);
  }

  /**
   * Release the current focus trap and restore focus to the previously
   * focused element.
   */
  function releaseFocus() {
    if (_trapHandler) {
      document.removeEventListener('keydown', _trapHandler);
      _trapHandler = null;
    }

    if (_previousFocus && typeof _previousFocus.focus === 'function') {
      _previousFocus.focus();
    }

    _trapElement   = null;
    _previousFocus = null;
  }

  /**
   * Get all visible, focusable child elements inside a container.
   *
   * @param {HTMLElement} container
   * @returns {HTMLElement[]}
   * @private
   */
  function _getFocusableChildren(container) {
    if (!container) return [];

    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter(el => {
        // Exclude hidden or invisible elements
        return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
      });
  }

  // ─── Screen Reader Announcements ───────────────────────────────────

  /**
   * Create the shared ARIA live region (hidden visually, readable by
   * assistive tech).
   * @private
   */
  function _createLiveRegion() {
    if (_liveRegion) return;

    _liveRegion = document.createElement('div');
    _liveRegion.id = 'ecotrack-live-region';
    _liveRegion.setAttribute('role', 'status');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');

    // Visually hidden but accessible to screen readers
    Object.assign(_liveRegion.style, {
      position: 'absolute',
      width:    '1px',
      height:   '1px',
      padding:  '0',
      margin:   '-1px',
      overflow: 'hidden',
      clip:     'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border:   '0'
    });

    document.body.appendChild(_liveRegion);
  }

  /**
   * Push a message to the ARIA live region for screen-reader announcement.
   *
   * @param {string} message                  — Text to announce.
   * @param {'polite'|'assertive'} [priority='polite'] — Urgency level.
   */
  function announceToScreenReader(message, priority = 'polite') {
    if (!_liveRegion) _createLiveRegion();

    // Update aria-live priority if needed
    _liveRegion.setAttribute('aria-live', priority);

    // Clear → set pattern forces assistive tech to re-read even if same text
    _liveRegion.textContent = '';

    requestAnimationFrame(() => {
      _liveRegion.textContent = message;
    });
  }

  // ─── Visual Preference Toggles ─────────────────────────────────────

  /**
   * Toggle high-contrast mode.
   * Adds / removes `.high-contrast` on `<body>` and persists the choice.
   *
   * @returns {boolean} New state (true = enabled).
   */
  function toggleHighContrast() {
    const enabled = document.body.classList.toggle('high-contrast');
    _persistPreference('highContrast', enabled);
    announceToScreenReader(
      `High contrast mode ${enabled ? 'enabled' : 'disabled'}.`
    );
    return enabled;
  }

  /**
   * Toggle large-text mode.
   * Adds / removes `.large-text` on `<body>` and persists the choice.
   *
   * @returns {boolean} New state (true = enabled).
   */
  function toggleLargeText() {
    const enabled = document.body.classList.toggle('large-text');
    _persistPreference('largeText', enabled);
    announceToScreenReader(
      `Large text mode ${enabled ? 'enabled' : 'disabled'}.`
    );
    return enabled;
  }

  /**
   * Toggle reduced-motion mode.
   * Adds / removes `.reduced-motion` on `<body>` and persists the choice.
   *
   * @returns {boolean} New state (true = enabled).
   */
  function toggleReducedMotion() {
    const enabled = document.body.classList.toggle('reduced-motion');
    _persistPreference('reducedMotion', enabled);
    announceToScreenReader(
      `Reduced motion ${enabled ? 'enabled' : 'disabled'}.`
    );
    return enabled;
  }

  /**
   * Set the document font size tier.
   * Removes all size classes then applies the selected one.
   *
   * @param {'small'|'normal'|'large'|'xlarge'} size — Font-size tier.
   */
  function setFontSize(size) {
    const validSizes = ['small', 'normal', 'large', 'xlarge'];

    if (!validSizes.includes(size)) {
      console.warn(`[EcoTrack.Accessibility] Invalid font size: "${size}"`);
      return;
    }

    // Remove existing font-size classes
    for (const s of validSizes) {
      document.body.classList.remove(`font-${s}`);
    }

    // 'normal' means no class at all
    if (size !== 'normal') {
      document.body.classList.add(`font-${size}`);
    }

    _persistPreference('fontSize', size);
    announceToScreenReader(`Font size set to ${size}.`);
  }

  // ─── OS Preference Detection ───────────────────────────────────────

  /**
   * Read the user's operating-system / browser accessibility preferences
   * via CSS media queries.
   *
   * @returns {Object} `{ reducedMotion, highContrast, colorScheme }`
   */
  function getPreferences() {
    return {
      reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
      highContrast:  window.matchMedia?.('(prefers-contrast: more)').matches        ?? false,
      colorScheme:   window.matchMedia?.('(prefers-color-scheme: dark)').matches
                       ? 'dark'
                       : 'light'
    };
  }

  /**
   * Apply OS-level preferences on first load (auto-enable reduced motion
   * and high contrast if the OS requests them).
   * @private
   */
  function _applyOsPreferences() {
    const prefs = getPreferences();

    if (prefs.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }
    if (prefs.highContrast) {
      document.body.classList.add('high-contrast');
    }

    // Listen for live changes (e.g. user toggles system dark mode)
    window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .addEventListener?.('change', (e) => {
        document.body.classList.toggle('reduced-motion', e.matches);
      });

    window.matchMedia?.('(prefers-contrast: more)')
      .addEventListener?.('change', (e) => {
        document.body.classList.toggle('high-contrast', e.matches);
      });
  }

  /**
   * Restore visual preferences saved in EcoTrack.Store.
   * @private
   */
  function _restoreSavedPreferences() {
    try {
      const settings = EcoTrack.Store?.getSettings?.();
      if (!settings) return;

      if (settings.reducedMotion) document.body.classList.add('reduced-motion');
      if (settings.highContrast)  document.body.classList.add('high-contrast');
      if (settings.fontSize && settings.fontSize !== 'normal') {
        document.body.classList.add(`font-${settings.fontSize}`);
      }
    } catch {
      // Store may not be initialised yet — that's fine
    }
  }

  /**
   * Persist a single accessibility preference to the store.
   *
   * @param {string} key   — Settings key.
   * @param {*}      value — Value to store.
   * @private
   */
  function _persistPreference(key, value) {
    try {
      EcoTrack.Store?.updateSettings?.({ [key]: value });
    } catch {
      // Store may not be available — degrade gracefully
    }
  }

  // ─── Skip Navigation ───────────────────────────────────────────────

  /**
   * Inject a visually-hidden "Skip to content" link at the top of the page.
   * The link targets `#main-content`; create that id on your `<main>`.
   */
  function setupSkipNavigation() {
    // Avoid duplicates
    if (document.getElementById('ecotrack-skip-nav')) return;

    const skipLink = document.createElement('a');
    skipLink.id          = 'ecotrack-skip-nav';
    skipLink.href        = '#main-content';
    skipLink.className   = 'skip-navigation';
    skipLink.textContent = 'Skip to main content';

    // Visually hidden until focused
    Object.assign(skipLink.style, {
      position:   'absolute',
      top:        '-100px',
      left:       '0',
      padding:    '12px 24px',
      background: '#1a1a2e',
      color:      '#00d4aa',
      fontSize:   '14px',
      fontWeight: '600',
      zIndex:     '100000',
      textDecoration: 'none',
      borderRadius:   '0 0 8px 0',
      transition: 'top 0.2s ease'
    });

    // Show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-100px';
    });

    // Click handler — move focus to main content
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.getElementById('main-content');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
        main.removeAttribute('tabindex');
      }
    });

    // Insert as the very first child of body
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // ─── ARIA Label Audit ──────────────────────────────────────────────

  /**
   * Walk the DOM and add basic ARIA labels to interactive elements that
   * are missing them. This is a lightweight safety net — proper labels
   * should be authored in the HTML templates.
   */
  function setupAriaLabels() {
    try {
      // Buttons without accessible names
      document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])')
        .forEach(btn => {
          // Only add a label if the button has no text content
          if (!btn.textContent.trim() && !btn.querySelector('img[alt]')) {
            const title = btn.getAttribute('title');
            if (title) {
              btn.setAttribute('aria-label', title);
            } else {
              btn.setAttribute('aria-label', 'Button');
              console.warn('[EcoTrack.Accessibility] Button missing label:', btn);
            }
          }
        });

      // Images without alt text
      document.querySelectorAll('img:not([alt])')
        .forEach(img => {
          // Mark decorative images as presentational; log a warning for others
          if (img.getAttribute('role') === 'presentation') return;
          img.setAttribute('alt', '');
          console.warn('[EcoTrack.Accessibility] Image missing alt text:', img);
        });

      // Links without accessible names
      document.querySelectorAll('a[href]:not([aria-label])')
        .forEach(link => {
          if (!link.textContent.trim() && !link.querySelector('img[alt]')) {
            const title = link.getAttribute('title');
            if (title) {
              link.setAttribute('aria-label', title);
            }
          }
        });

      // Inputs without labels
      document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
        .forEach(input => {
          // Check for an associated <label>
          const id = input.id;
          if (id && document.querySelector(`label[for="${id}"]`)) return;
          // Check for wrapping <label>
          if (input.closest('label')) return;

          const placeholder = input.getAttribute('placeholder');
          if (placeholder) {
            input.setAttribute('aria-label', placeholder);
          } else {
            console.warn('[EcoTrack.Accessibility] Input missing label:', input);
          }
        });

    } catch (err) {
      console.error('[EcoTrack.Accessibility] setupAriaLabels() failed:', err);
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────

  return Object.freeze({
    init,

    // Keyboard detection
    detectKeyboardUser,

    // Focus management
    trapFocus,
    releaseFocus,

    // Screen reader
    announceToScreenReader,

    // Visual toggles
    toggleHighContrast,
    toggleLargeText,
    toggleReducedMotion,
    setFontSize,

    // OS preferences
    getPreferences,

    // Navigation helpers
    setupSkipNavigation,
    setupAriaLabels
  });
})();
