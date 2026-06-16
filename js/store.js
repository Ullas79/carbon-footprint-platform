/**
 * EcoTrack — Data Store Module
 *
 * Manages all persistent data via localStorage. Every read/write goes through
 * a single top-level key (`ecotrack_data`) that holds the entire application
 * state as a JSON object. Helper methods provide convenient, type-safe access
 * to individual slices (profile, activities, settings, etc.).
 *
 * Depends on: EcoTrack.Utils (generateId, deepClone)
 *
 * @namespace EcoTrack.Store
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.Store = (() => {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────

  /** localStorage key that holds the entire EcoTrack dataset. */
  const STORAGE_KEY = 'ecotrack_data';

  /** Current schema version — bump when migrating data shapes. */
  const SCHEMA_VERSION = 1;

  /**
   * Default data structure created for brand-new users.
   * Every slice lives under a predictable key so the rest of the app
   * can safely destructure without null-checks.
   */
  const DEFAULT_DATA = Object.freeze({
    _version: SCHEMA_VERSION,
    profile: {
      name:          '',
      country:       '',
      joinDate:      '',
      level:         1,
      xp:            0,
      totalReduced:  0
    },
    onboarding: {
      completed: false,
      answers:   {}
    },
    activities: [],
    settings: {
      theme:         'dark',
      units:         'metric',
      reducedMotion: false,
      highContrast:  false,
      fontSize:      'normal'
    },
    challenges: [],
    badges:     [],
    insights:   [],
    streak: {
      current:     0,
      longest:     0,
      lastLogDate: null
    },
    goals: {
      daily:   10,
      weekly:  70,
      monthly: 300,
      target:  'average'
    }
  });

  // ─── Internal Helpers ───────────────────────────────────────────────

  /**
   * Read the full data object from localStorage.
   * Returns a deep clone so callers never mutate the cached copy.
   *
   * @returns {Object} Complete EcoTrack data tree.
   * @private
   */
  function _readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return EcoTrack.Utils.deepClone(DEFAULT_DATA);
      return JSON.parse(raw);
    } catch (err) {
      console.error('[EcoTrack.Store] Failed to read localStorage:', err);
      return EcoTrack.Utils.deepClone(DEFAULT_DATA);
    }
  }

  /**
   * Persist the full data object to localStorage.
   *
   * @param {Object} data — Complete EcoTrack data tree.
   * @private
   */
  function _writeAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[EcoTrack.Store] Failed to write localStorage:', err);
      // QuotaExceededError is the most common failure here
      if (err.name === 'QuotaExceededError') {
        EcoTrack.Utils?.showToast?.(
          'Storage is full. Please export and clear old data.',
          'error'
        );
      }
    }
  }

  /**
   * Check whether two date strings (or ISO timestamps) refer to the same
   * calendar day.
   *
   * @param {string|Date} a
   * @param {string|Date} b
   * @returns {boolean}
   * @private
   */
  function _isSameDay(a, b) {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth()    === d2.getMonth() &&
      d1.getDate()     === d2.getDate()
    );
  }

  // ─── Initialisation ─────────────────────────────────────────────────

  /**
   * Initialise the store.
   * If no data exists in localStorage yet (first-time user), seeds the
   * default structure. Also performs lightweight schema migration when
   * the version number has changed.
   */
  function init() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);

      if (!existing) {
        // First run — seed defaults with today's join date
        const data = EcoTrack.Utils.deepClone(DEFAULT_DATA);
        data.profile.joinDate = new Date().toISOString();
        _writeAll(data);
        console.info('[EcoTrack.Store] Initialised with default data.');
        return;
      }

      // Ensure every expected key exists (forward-compatible merge)
      const data    = JSON.parse(existing);
      const defaults = EcoTrack.Utils.deepClone(DEFAULT_DATA);
      let dirty     = false;

      for (const key of Object.keys(defaults)) {
        if (!(key in data)) {
          data[key] = defaults[key];
          dirty = true;
        }
      }

      if (dirty) {
        _writeAll(data);
        console.info('[EcoTrack.Store] Patched missing keys into existing data.');
      }
    } catch (err) {
      console.error('[EcoTrack.Store] init() failed:', err);
    }
  }

  // ─── Generic Get / Set ──────────────────────────────────────────────

  /**
   * Retrieve a top-level key from the store.
   *
   * @param {string} key — Top-level property name (e.g. 'profile').
   * @returns {*} The stored value, or undefined.
   */
  function get(key) {
    const data = _readAll();
    return data[key] !== undefined ? EcoTrack.Utils.deepClone(data[key]) : undefined;
  }

  /**
   * Set a top-level key in the store.
   *
   * @param {string} key   — Top-level property name.
   * @param {*}      value — Value to store (must be JSON-serialisable).
   */
  function set(key, value) {
    const data = _readAll();
    data[key] = value;
    _writeAll(data);
  }

  // ─── User Profile ──────────────────────────────────────────────────

  /**
   * Get the current user profile.
   * @returns {Object} Profile object.
   */
  function getUserProfile() {
    return get('profile');
  }

  /**
   * Update the user profile (shallow merge).
   *
   * @param {Object} profile — Partial profile fields to merge.
   */
  function setUserProfile(profile) {
    const data = _readAll();
    data.profile = { ...data.profile, ...profile };
    _writeAll(data);
  }

  // ─── Activities ─────────────────────────────────────────────────────

  /**
   * Retrieve logged activities, optionally filtered by date range and/or
   * category.
   *
   * @param {Object}  [filters]               — Optional filter criteria.
   * @param {string}  [filters.category]       — Category key to match.
   * @param {string|Date} [filters.startDate]  — Inclusive start date.
   * @param {string|Date} [filters.endDate]    — Inclusive end date.
   * @param {string}  [filters.type]           — Activity type to match.
   * @returns {Array<Object>} Matching activities, newest first.
   */
  function getActivities(filters = {}) {
    const data       = _readAll();
    let activities   = data.activities || [];

    // Apply category filter
    if (filters.category) {
      activities = activities.filter(a => a.category === filters.category);
    }

    // Apply type filter
    if (filters.type) {
      activities = activities.filter(a => a.type === filters.type);
    }

    // Apply date range filters
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      activities  = activities.filter(a => new Date(a.timestamp).getTime() >= start);
    }
    if (filters.endDate) {
      const end  = new Date(filters.endDate).getTime();
      activities = activities.filter(a => new Date(a.timestamp).getTime() <= end);
    }

    // Return newest-first
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Log a new activity.
   * Automatically stamps with id and timestamp if not provided.
   *
   * @param {Object} activity            — Activity data.
   * @param {string} activity.category   — Category key (transport, food, …).
   * @param {string} activity.type       — Specific activity type (car_petrol, beef, …).
   * @param {number} activity.value      — Quantity in the relevant unit.
   * @param {string} activity.unit       — Unit label (km, kg, kWh, …).
   * @param {number} activity.co2        — Pre-calculated CO₂ in kg.
   * @returns {Object} The stored activity (with id & timestamp).
   */
  function addActivity(activity) {
    const data = _readAll();

    const record = {
      id:        EcoTrack.Utils.generateId(),
      timestamp: new Date().toISOString(),
      ...activity                              // caller fields override defaults
    };

    data.activities.push(record);
    _writeAll(data);

    // Side-effect: update the logging streak
    updateStreak();

    return EcoTrack.Utils.deepClone(record);
  }

  /**
   * Remove an activity by its id.
   *
   * @param {string} id — Activity ID.
   * @returns {boolean} True if an activity was removed.
   */
  function removeActivity(id) {
    const data   = _readAll();
    const before = data.activities.length;
    data.activities = data.activities.filter(a => a.id !== id);
    _writeAll(data);
    return data.activities.length < before;
  }

  // ─── Insights ───────────────────────────────────────────────────────

  /**
   * Get all personalised insights.
   * @returns {Array<Object>}
   */
  function getInsights() {
    return get('insights') || [];
  }

  /**
   * Add a new insight.
   *
   * @param {Object} insight — Insight data.
   * @returns {Object} Stored insight with id.
   */
  function addInsight(insight) {
    const data = _readAll();

    const record = {
      id:        EcoTrack.Utils.generateId(),
      timestamp: new Date().toISOString(),
      read:      false,
      ...insight
    };

    data.insights = data.insights || [];
    data.insights.push(record);
    _writeAll(data);

    return EcoTrack.Utils.deepClone(record);
  }

  // ─── Challenges ─────────────────────────────────────────────────────

  /**
   * Get all challenges.
   * @returns {Array<Object>}
   */
  function getChallenges() {
    return get('challenges') || [];
  }

  /**
   * Update a challenge by id (shallow merge).
   *
   * @param {string} id   — Challenge ID.
   * @param {Object} data — Fields to merge.
   * @returns {boolean} True if the challenge was found and updated.
   */
  function updateChallenge(id, updates) {
    const data  = _readAll();
    const index = (data.challenges || []).findIndex(c => c.id === id);
    if (index === -1) return false;

    data.challenges[index] = { ...data.challenges[index], ...updates };
    _writeAll(data);
    return true;
  }

  // ─── Badges ─────────────────────────────────────────────────────────

  /**
   * Get all badges.
   * @returns {Array<Object>}
   */
  function getBadges() {
    return get('badges') || [];
  }

  /**
   * Unlock (add) a badge if not already present.
   *
   * @param {string} badgeId — Unique badge identifier.
   * @returns {boolean} True if newly unlocked, false if already owned.
   */
  function unlockBadge(badgeId) {
    const data = _readAll();
    data.badges = data.badges || [];

    if (data.badges.some(b => b.id === badgeId)) {
      return false; // already unlocked
    }

    data.badges.push({
      id:         badgeId,
      unlockedAt: new Date().toISOString()
    });
    _writeAll(data);
    return true;
  }

  // ─── Statistics ─────────────────────────────────────────────────────

  /**
   * Calculate aggregate statistics from logged activities.
   *
   * @returns {Object} Stats including totals, averages, and streaks.
   */
  function getStats() {
    const data       = _readAll();
    const activities = data.activities || [];
    const now        = new Date();

    // Today's activities
    const todayActivities = activities.filter(a => _isSameDay(a.timestamp, now));
    const todayCO2 = todayActivities.reduce((sum, a) => sum + (a.co2 || 0), 0);

    // This week (Mon–Sun)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const weekActivities = activities.filter(
      a => new Date(a.timestamp) >= startOfWeek
    );
    const weekCO2 = weekActivities.reduce((sum, a) => sum + (a.co2 || 0), 0);

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthActivities = activities.filter(
      a => new Date(a.timestamp) >= startOfMonth
    );
    const monthCO2 = monthActivities.reduce((sum, a) => sum + (a.co2 || 0), 0);

    // All time
    const totalCO2 = activities.reduce((sum, a) => sum + (a.co2 || 0), 0);

    // Daily average (based on distinct days with logs)
    const uniqueDays = new Set(
      activities.map(a => new Date(a.timestamp).toDateString())
    );
    const avgDaily = uniqueDays.size > 0 ? totalCO2 / uniqueDays.size : 0;

    return {
      today:         parseFloat(todayCO2.toFixed(2)),
      week:          parseFloat(weekCO2.toFixed(2)),
      month:         parseFloat(monthCO2.toFixed(2)),
      total:         parseFloat(totalCO2.toFixed(2)),
      avgDaily:      parseFloat(avgDaily.toFixed(2)),
      totalLogs:     activities.length,
      daysLogged:    uniqueDays.size,
      streak:        data.streak || { current: 0, longest: 0, lastLogDate: null }
    };
  }

  // ─── Streak ─────────────────────────────────────────────────────────

  /**
   * Get the current streak data.
   * @returns {Object} `{ current, longest, lastLogDate }`
   */
  function getStreak() {
    return get('streak') || { current: 0, longest: 0, lastLogDate: null };
  }

  /**
   * Update the daily logging streak.
   * Call this whenever a new activity is added.
   */
  function updateStreak() {
    const data   = _readAll();
    const streak = data.streak || { current: 0, longest: 0, lastLogDate: null };
    const today  = new Date();
    const todayStr = today.toDateString();

    if (streak.lastLogDate) {
      const lastDate    = new Date(streak.lastLogDate);
      const lastDateStr = lastDate.toDateString();

      if (todayStr === lastDateStr) {
        // Already logged today — no streak change
        return;
      }

      // Check if the last log was yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (lastDate.toDateString() === yesterday.toDateString()) {
        // Consecutive day — extend streak
        streak.current += 1;
      } else {
        // Streak broken — reset
        streak.current = 1;
      }
    } else {
      // Very first log
      streak.current = 1;
    }

    // Track longest streak ever
    streak.longest    = Math.max(streak.longest, streak.current);
    streak.lastLogDate = today.toISOString();

    data.streak = streak;
    _writeAll(data);
  }

  // ─── Settings ───────────────────────────────────────────────────────

  /**
   * Get user settings.
   * @returns {Object} Settings object.
   */
  function getSettings() {
    return get('settings') || EcoTrack.Utils.deepClone(DEFAULT_DATA.settings);
  }

  /**
   * Merge partial settings into the stored settings.
   *
   * @param {Object} settings — Partial settings to merge.
   */
  function updateSettings(settings) {
    const data = _readAll();
    data.settings = { ...data.settings, ...settings };
    _writeAll(data);
  }

  // ─── Import / Export ────────────────────────────────────────────────

  /**
   * Export the complete data store as a JSON string.
   * Includes an `_exportedAt` timestamp for provenance.
   *
   * @returns {string} JSON string.
   */
  function exportData() {
    const data = _readAll();
    data._exportedAt = new Date().toISOString();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from a JSON string, fully replacing the current store.
   * Performs basic validation before overwriting.
   *
   * @param {string} json — JSON string previously obtained from `exportData()`.
   * @returns {boolean} True on success, false on validation failure.
   */
  function importData(json) {
    try {
      const parsed = JSON.parse(json);

      // Minimal shape validation — must have at least profile + activities
      if (!parsed.profile || !Array.isArray(parsed.activities)) {
        console.error('[EcoTrack.Store] Import failed: invalid data shape.');
        return false;
      }

      // Merge with defaults so missing keys are filled in
      const merged = { ...EcoTrack.Utils.deepClone(DEFAULT_DATA), ...parsed };
      _writeAll(merged);

      console.info('[EcoTrack.Store] Data imported successfully.');
      return true;
    } catch (err) {
      console.error('[EcoTrack.Store] Import failed:', err);
      return false;
    }
  }

  /**
   * Wipe all EcoTrack data from localStorage and re-seed defaults.
   */
  function clearAllData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      init(); // re-seed with fresh defaults
      console.info('[EcoTrack.Store] All data cleared.');
    } catch (err) {
      console.error('[EcoTrack.Store] clearAllData() failed:', err);
    }
  }

  // ─── Onboarding ─────────────────────────────────────────────────────

  /**
   * Get onboarding data.
   * @returns {Object} `{ completed, answers }`
   */
  function getOnboardingData() {
    return get('onboarding') || { completed: false, answers: {} };
  }

  /**
   * Set onboarding data (shallow merge).
   *
   * @param {Object} data — Partial onboarding object to merge.
   */
  function setOnboardingData(onboarding) {
    const data = _readAll();
    data.onboarding = { ...data.onboarding, ...onboarding };
    _writeAll(data);
  }

  // ─── Public API ─────────────────────────────────────────────────────

  return Object.freeze({
    init,

    // Generic
    get,
    set,

    // Profile
    getUserProfile,
    setUserProfile,

    // Activities
    getActivities,
    addActivity,
    removeActivity,

    // Insights
    getInsights,
    addInsight,

    // Challenges
    getChallenges,
    updateChallenge,

    // Badges
    getBadges,
    unlockBadge,

    // Stats & Streaks
    getStats,
    getStreak,
    updateStreak,

    // Settings
    getSettings,
    updateSettings,

    // Import / Export
    exportData,
    importData,
    clearAllData,

    // Onboarding
    getOnboardingData,
    setOnboardingData
  });
})();
