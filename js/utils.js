/**
 * EcoTrack — Utility Functions Module
 * 
 * Provides general-purpose helper functions used throughout the platform,
 * including number/date formatting, DOM manipulation, animation utilities,
 * input sanitization, and convenience helpers.
 * 
 * All functions are attached to the global `EcoTrack.Utils` namespace.
 * 
 * @namespace EcoTrack.Utils
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.Utils = (() => {
  'use strict';

  // ─── Category Metadata ──────────────────────────────────────────────
  // Centralised maps so every module can look up icons/colours consistently.

  /** @type {Object<string, string>} Emoji icons keyed by activity category */
  const CATEGORY_ICONS = Object.freeze({
    transport:  '🚗',
    food:       '🍽️',
    energy:     '⚡',
    shopping:   '🛍️',
    digital:    '💻'
  });

  /** @type {Object<string, string>} Brand colours keyed by activity category */
  const CATEGORY_COLORS = Object.freeze({
    transport:  '#3B82F6', // blue
    food:       '#10B981', // emerald
    energy:     '#F59E0B', // amber
    shopping:   '#8B5CF6', // violet
    digital:    '#EC4899'  // pink
  });

  // ─── Number Formatting ──────────────────────────────────────────────

  /**
   * Format a number with thousand-separator commas and fixed decimals.
   *
   * @param {number} num      — The number to format.
   * @param {number} [decimals=0] — Decimal places (clamped to 0–20).
   * @returns {string} Formatted string, e.g. "1,234.56".
   *
   * @example
   * formatNumber(1234.5, 2); // "1,234.50"
   */
  function formatNumber(num, decimals = 0) {
    try {
      const n = Number(num);
      if (Number.isNaN(n)) return '0';

      // Clamp decimals to safe range for toFixed
      const d = clamp(Math.round(decimals), 0, 20);
      return n.toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d
      });
    } catch {
      return '0';
    }
  }

  /**
   * Format a CO₂ value in human-friendly units.
   * Values ≥ 1 000 kg are displayed in tonnes; otherwise in kg.
   *
   * @param {number} kg — CO₂ in kilograms.
   * @returns {string} e.g. "2.5 kg CO₂" or "1.2 tonnes CO₂".
   */
  function formatCO2(kg) {
    try {
      const value = Number(kg);
      if (Number.isNaN(value)) return '0 kg CO₂';

      if (Math.abs(value) >= 1000) {
        return `${formatNumber(value / 1000, 1)} tonnes CO₂`;
      }
      return `${formatNumber(value, 1)} kg CO₂`;
    } catch {
      return '0 kg CO₂';
    }
  }

  // ─── Date Formatting ────────────────────────────────────────────────

  /**
   * Format a date as "Jun 10, 2026".
   *
   * @param {Date|string|number} date — Any value accepted by `new Date()`.
   * @returns {string} Formatted date string, or empty string on invalid input.
   */
  function formatDate(date) {
    try {
      if (!date) return '';
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return '';

      return d.toLocaleDateString('en-US', {
        month: 'short',
        day:   'numeric',
        year:  'numeric'
      });
    } catch {
      return '';
    }
  }

  /**
   * Return a human-friendly relative timestamp ("2 hours ago", "yesterday", etc.).
   *
   * @param {Date|string|number} date — Reference date.
   * @returns {string} Relative string.
   */
  function formatRelativeDate(date) {
    try {
      const d      = new Date(date);
      const now    = Date.now();
      const diffMs = now - d.getTime();

      if (Number.isNaN(diffMs)) return '';

      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours   = Math.floor(minutes / 60);
      const days    = Math.floor(hours / 24);
      const weeks   = Math.floor(days / 7);
      const months  = Math.floor(days / 30);
      const years   = Math.floor(days / 365);

      if (seconds < 5)   return 'just now';
      if (seconds < 60)  return `${seconds} seconds ago`;
      if (minutes === 1)  return '1 minute ago';
      if (minutes < 60)  return `${minutes} minutes ago`;
      if (hours === 1)    return '1 hour ago';
      if (hours < 24)    return `${hours} hours ago`;
      if (days === 1)     return 'yesterday';
      if (days < 7)      return `${days} days ago`;
      if (weeks === 1)    return '1 week ago';
      if (weeks < 5)     return `${weeks} weeks ago`;
      if (months === 1)   return '1 month ago';
      if (months < 12)   return `${months} months ago`;
      if (years === 1)    return '1 year ago';
      return `${years} years ago`;
    } catch {
      return '';
    }
  }

  // ─── ID Generation ──────────────────────────────────────────────────

  /**
   * Generate a unique identifier string.
   * Uses `crypto.randomUUID()` when available, otherwise falls back to
   * a timestamp + random-hex scheme.
   *
   * @returns {string} A unique ID.
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp-based hex ID
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  }

  // ─── Function Utilities ─────────────────────────────────────────────

  /**
   * Create a debounced version of a function.
   * The returned function delays invocation until `delay` ms have elapsed
   * since the last call.
   *
   * @param {Function} fn    — Function to debounce.
   * @param {number}   delay — Delay in milliseconds (default 300).
   * @returns {Function} Debounced function with a `.cancel()` method.
   */
  function debounce(fn, delay = 300) {
    let timerId = null;

    const debounced = function (...args) {
      clearTimeout(timerId);
      timerId = setTimeout(() => fn.apply(this, args), delay);
    };

    /** Cancel any pending invocation. */
    debounced.cancel = () => clearTimeout(timerId);

    return debounced;
  }

  /**
   * Create a throttled version of a function.
   * Ensures the function runs at most once every `limit` ms.
   *
   * @param {Function} fn    — Function to throttle.
   * @param {number}   limit — Minimum interval in milliseconds (default 300).
   * @returns {Function} Throttled function.
   */
  function throttle(fn, limit = 300) {
    let inThrottle = false;

    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }

  // ─── Security ───────────────────────────────────────────────────────

  /**
   * Sanitize a string for safe HTML insertion.
   * Escapes characters that could enable XSS: & < > " ' ` / 
   *
   * @param {string} str — Raw user input.
   * @returns {string} Sanitized string safe for innerHTML-like use.
   */
  function sanitizeInput(str) {
    if (typeof str !== 'string') return '';

    const escapeMap = {
      '&':  '&amp;',
      '<':  '&lt;',
      '>':  '&gt;',
      '"':  '&quot;',
      "'":  '&#x27;',
      '`':  '&#x60;',
      '/':  '&#x2F;'
    };

    return str.replace(/[&<>"'`/]/g, char => escapeMap[char]);
  }

  // ─── Math Helpers ───────────────────────────────────────────────────

  /**
   * Clamp a value between a minimum and maximum.
   *
   * @param {number} value — Input value.
   * @param {number} min   — Lower bound.
   * @param {number} max   — Upper bound.
   * @returns {number} Clamped value.
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  /**
   * Linearly interpolate between two values.
   *
   * @param {number} start — Start value (t = 0).
   * @param {number} end   — End value   (t = 1).
   * @param {number} t     — Interpolation factor (0–1).
   * @returns {number} Interpolated result.
   */
  function lerp(start, end, t) {
    const clamped = clamp(t, 0, 1);
    return start + (end - start) * clamped;
  }

  // ─── Animation ──────────────────────────────────────────────────────

  /**
   * Animate a numeric counter inside a DOM element, using easeOutExpo
   * for a satisfying deceleration curve.
   *
   * @param {HTMLElement} element       — Target element whose textContent is updated.
   * @param {number}      start        — Starting value.
   * @param {number}      end          — Target value.
   * @param {number}      [duration=1000] — Animation length in ms.
   * @param {string}      [suffix='']  — Text appended after the number (e.g. " kg").
   */
  function animateCounter(element, start, end, duration = 1000, suffix = '') {
    if (!element) return;

    // Respect reduced-motion preference
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = formatNumber(end, 1) + suffix;
      return;
    }

    const startTime = performance.now();

    /** Ease-out exponential curve for natural deceleration. */
    const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    function update(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased    = easeOutExpo(progress);
      const current  = lerp(start, end, eased);

      element.textContent = formatNumber(current, 1) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ─── Toast Notifications ───────────────────────────────────────────

  /**
   * Display a temporary toast notification.
   *
   * @param {string} message          — Message text.
   * @param {'success'|'error'|'warning'|'info'} [type='info'] — Visual style.
   * @param {number} [duration=3000]  — Auto-dismiss time in ms.
   */
  function showToast(message, type = 'info', duration = 3000) {
    try {
      // Ensure a toast container exists
      let container = document.getElementById('ecotrack-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'ecotrack-toast-container';
        Object.assign(container.style, {
          position:       'fixed',
          top:            '20px',
          right:          '20px',
          zIndex:         '10000',
          display:        'flex',
          flexDirection:  'column',
          gap:            '10px',
          pointerEvents:  'none'        // let clicks pass through empty space
        });
        document.body.appendChild(container);
      }

      // Icon per type
      const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

      // Build the toast element
      const toast = document.createElement('div');
      toast.className = `ecotrack-toast ecotrack-toast--${sanitizeInput(type)}`;
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'polite');
      toast.style.pointerEvents = 'auto';     // toast itself is clickable
      toast.innerHTML = `
        <span class="ecotrack-toast__icon">${icons[type] || icons.info}</span>
        <span class="ecotrack-toast__message">${sanitizeInput(message)}</span>
        <button class="ecotrack-toast__close" aria-label="Close notification">&times;</button>
      `;

      // Dismiss on close button click
      const closeBtn = toast.querySelector('.ecotrack-toast__close');
      closeBtn.addEventListener('click', () => removeToast(toast));

      container.appendChild(toast);

      // Trigger enter animation on next frame
      requestAnimationFrame(() => toast.classList.add('ecotrack-toast--visible'));

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
      }
    } catch (err) {
      // Fallback: plain console warning when DOM isn't available
      console.warn('[EcoTrack Toast]', message, err);
    }
  }

  /**
   * Remove a toast element with a fade-out transition.
   * @param {HTMLElement} toast
   * @private
   */
  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('ecotrack-toast--visible');
    toast.classList.add('ecotrack-toast--exit');
    // Remove from DOM after CSS transition completes
    setTimeout(() => toast.remove(), 300);
  }

  // ─── Date Helpers ───────────────────────────────────────────────────

  /**
   * Return the start-of-day timestamp (ms) for a Date.
   *
   * @param {Date|string|number} [date=new Date()]
   * @returns {number}
   */
  function startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /**
   * Return a greeting appropriate for the time of day.
   *
   * @returns {'Good morning'|'Good afternoon'|'Good evening'}
   */
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Get the number of days in a given month.
   *
   * @param {number} year  — Full year (e.g. 2026).
   * @param {number} month — Month (1-indexed: 1 = January … 12 = December).
   * @returns {number} Number of days.
   */
  function getDaysInMonth(year, month) {
    // `new Date(year, month, 0)` gives the last day of the previous month,
    // so month here (1-indexed) naturally maps to the correct JS month.
    return new Date(year, month, 0).getDate();
  }

  /**
   * Calculate the ISO 8601 week number for a date.
   *
   * @param {Date|string|number} date — Input date.
   * @returns {number} ISO week number (1–53).
   */
  function getWeekNumber(date) {
    const d = new Date(date);
    // Set to nearest Thursday: current date + 4 - current day number (Mon = 1)
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    // January 4 is always in week 1
    const jan4 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  }

  // ─── Object Utilities ──────────────────────────────────────────────

  /**
   * Deep-clone a JSON-compatible object (no functions, Dates, etc.).
   * Uses `structuredClone` when available; falls back to JSON round-trip.
   *
   * @param {*} obj — Value to clone.
   * @returns {*} Deep copy.
   */
  function deepClone(obj) {
    try {
      if (typeof structuredClone === 'function') {
        return structuredClone(obj);
      }
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }

  // ─── Category Helpers ──────────────────────────────────────────────

  /**
   * Get the emoji icon for an activity category.
   *
   * @param {string} category — Category key (transport, food, energy, shopping, digital).
   * @returns {string} Emoji or a generic fallback '📋'.
   */
  function getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || '📋';
  }

  /**
   * Get the brand colour for an activity category.
   *
   * @param {string} category — Category key.
   * @returns {string} Hex colour string.
   */
  function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || '#6B7280'; // gray-500 fallback
  }

  // ─── Array / Async Helpers ─────────────────────────────────────────

  /**
   * Return a random item from an array.
   *
   * @template T
   * @param {T[]} array — Source array.
   * @returns {T|undefined} Random element, or undefined for empty arrays.
   */
  function getRandomItem(array) {
    if (!Array.isArray(array) || array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Promise-based delay.
   *
   * @param {number} ms — Milliseconds to wait.
   * @returns {Promise<void>}
   *
   * @example
   * await EcoTrack.Utils.sleep(500);
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Public API ─────────────────────────────────────────────────────

  return Object.freeze({
    // Formatting
    formatNumber,
    formatCO2,
    formatDate,
    formatRelativeDate,

    // ID & functions
    generateId,
    debounce,
    throttle,

    // Security
    sanitizeInput,

    // Math
    clamp,
    lerp,

    // Animation / DOM
    animateCounter,
    showToast,

    // Date helpers
    startOfDay,
    getGreeting,
    getDaysInMonth,
    getWeekNumber,

    // Objects / arrays
    deepClone,
    getRandomItem,

    // Category helpers
    getCategoryIcon,
    getCategoryColor,

    // Async
    sleep
  });
})();
