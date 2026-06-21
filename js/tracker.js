/**
 * EcoTrack Tracker Module
 * =======================
 * Activity logging system that lets users record their daily carbon
 * footprint activities across five categories: Transport, Food,
 * Energy, Shopping, and Digital.
 *
 * @namespace EcoTrack.Tracker
 * @requires EcoTrack.Calculator
 * @requires EcoTrack.Store
 * @requires EcoTrack.Challenges
 * @requires EcoTrack.Utils
 */
window.EcoTrack = window.EcoTrack || {};

EcoTrack.Tracker = (() => {
  'use strict';

  // ──────────────────────────────────────────────────
  // Constants
  // ──────────────────────────────────────────────────

  /** Quick-log presets for one-tap activity logging. */
  const QUICK_LOGS = [
    { label: 'Drive to work', category: 'transport', type: 'car_petrol', value: 15, icon: '🚗' },
    { label: 'Bus ride',      category: 'transport', type: 'bus',        value: 10, icon: '🚌' },
    { label: 'Bike ride',     category: 'transport', type: 'bicycle',    value: 5,  icon: '🚲' },
    { label: 'Meat meal',     category: 'food',      type: 'average_meal',     value: 1, icon: '🍖' },
    { label: 'Veggie meal',   category: 'food',      type: 'vegetarian_meal',  value: 1, icon: '🥗' },
    { label: 'Vegan meal',    category: 'food',      type: 'vegan_meal',       value: 1, icon: '🌱' },
    { label: 'Shower',        category: 'energy',    type: 'shower_5min',      value: 1, icon: '🚿' },
    { label: 'Laundry',       category: 'energy',    type: 'washing_machine',  value: 1, icon: '👕' },
    { label: '1hr Streaming', category: 'digital',   type: 'video_streaming',  value: 1, icon: '📺' },
    { label: 'Online order',  category: 'shopping',  type: 'online_order',     value: 1, icon: '📦' },
  ];

  /** Category metadata — icons, colours, display names, unit labels, and
   *  the activity types each category supports. */
  const CATEGORIES = {
    transport: {
      name: 'Transport',
      icon: '🚗',
      color: '#3B82F6',
      unit: 'km',
      types: [
        { value: 'car_petrol',  label: 'Car (Petrol)' },
        { value: 'car_diesel',  label: 'Car (Diesel)' },
        { value: 'car_electric', label: 'Car (Electric)' },
        { value: 'bus',         label: 'Bus' },
        { value: 'train',       label: 'Train' },
        { value: 'bicycle',     label: 'Bicycle' },
        { value: 'walk',        label: 'Walking' },
        { value: 'flight_short', label: 'Flight (Short)' },
        { value: 'flight_long',  label: 'Flight (Long)' },
      ],
    },
    food: {
      name: 'Food',
      icon: '🍽️',
      color: '#F97316',
      unit: 'meals',
      types: [
        { value: 'average_meal',     label: 'Average Meal' },
        { value: 'vegetarian_meal',  label: 'Vegetarian Meal' },
        { value: 'vegan_meal',       label: 'Vegan Meal' },
        { value: 'beef_meal',        label: 'Beef Meal' },
        { value: 'chicken_meal',     label: 'Chicken Meal' },
        { value: 'fish_meal',        label: 'Fish Meal' },
      ],
    },
    energy: {
      name: 'Energy',
      icon: '⚡',
      color: '#EAB308',
      unit: 'sessions',
      types: [
        { value: 'electricity_kwh', label: 'Electricity (kWh)' },
        { value: 'natural_gas',     label: 'Natural Gas' },
        { value: 'heating_oil',     label: 'Heating Oil' },
        { value: 'shower_5min',     label: 'Shower (5 min)' },
        { value: 'washing_machine', label: 'Washing Machine' },
        { value: 'dishwasher',      label: 'Dishwasher' },
        { value: 'air_conditioning', label: 'AC (1 hr)' },
      ],
    },
    shopping: {
      name: 'Shopping',
      icon: '🛒',
      color: '#A855F7',
      unit: 'items',
      types: [
        { value: 'clothing_item',  label: 'Clothing Item' },
        { value: 'electronics',    label: 'Electronics' },
        { value: 'online_order',   label: 'Online Order' },
        { value: 'furniture',      label: 'Furniture' },
        { value: 'groceries',      label: 'Groceries Bag' },
      ],
    },
    digital: {
      name: 'Digital',
      icon: '💻',
      color: '#06B6D4',
      unit: 'hours',
      types: [
        { value: 'video_streaming', label: 'Video Streaming' },
        { value: 'video_call',      label: 'Video Call' },
        { value: 'web_browsing',    label: 'Web Browsing' },
        { value: 'cloud_storage',   label: 'Cloud Storage' },
        { value: 'email',           label: 'Emails (batch)' },
      ],
    },
  };

  /** CO₂ thresholds (kg) for heatmap day colouring. */
  const HEATMAP_THRESHOLDS = { low: 3, medium: 7 };

  // ──────────────────────────────────────────────────
  // Internal state
  // ──────────────────────────────────────────────────
  let _selectedCategory = 'transport';
  let _container = null;

  // ──────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────

  // Removed _escapeHtml, _startOfDay, _uid, _toast, _debounce in favour of EcoTrack.Utils

  // ──────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────

  return Object.freeze({

    /* ───── Initialisation ───── */

    /**
     * Set up the tracker module.
     * @param {string} [containerId='tracker-container'] - DOM id of the root element.
     */
    init() {
      try {
        _selectedCategory = 'transport';
        console.log('[EcoTrack.Tracker] Initialised.');
      } catch (err) {
        console.error('[EcoTrack.Tracker] init error:', err);
      }
    },

    /* ───── Full Page Render ───── */

    /**
     * Render the complete activity-logging page.
     * Includes category tabs, type selector, value input, quick log,
     * today's activity list, today's total, and a calendar heatmap.
     */
    renderTrackerPage() {
      const mainContent = document.getElementById('main-content');
      if (!mainContent) return;

      const todayActivities = this.getTodayActivities();
      const todayTotal = todayActivities.reduce((s, a) => s + (a.co2 || 0), 0);

      mainContent.innerHTML = `
        <div class="page-container animate-fade-in" role="region" aria-label="Activity Tracker">
          <!-- Page header -->
          <div class="page-header">
            <div>
              <h1 class="page-title">📝 Log Activity</h1>
              <p class="page-subtitle">Track your daily carbon footprint</p>
            </div>
            <!-- Today's total summary card -->
            <div class="card card--solid" style="padding: var(--space-3) var(--space-5); background: var(--eco-primary-ghost); border-color: rgba(16, 185, 129, 0.2); min-height: auto;" id="today-total">
              <span style="font-weight: 700; font-family: var(--font-mono); font-size: 1.25rem; color: var(--eco-primary);">${todayTotal.toFixed(2)} kg</span>
              <span style="font-size: 0.75rem; color: var(--eco-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: block;">Logged Today</span>
            </div>
          </div>

          <!-- Two column grid: form log on left, quick presets on right -->
          <div class="dashboard-grid-2" style="align-items: flex-start; margin-bottom: var(--space-6);">
            
            <!-- Left panel: Log Activity form -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <h2 class="card-header__title">➕ Log New Activity</h2>
              </div>
              <div class="card-body">
                <!-- Category tabs -->
                <div class="tracker-tabs" role="tablist" aria-label="Activity categories" style="margin-bottom: var(--space-4);">
                  ${Object.keys(CATEGORIES).map(cat => {
                    const c = CATEGORIES[cat];
                    const isActive = cat === _selectedCategory;
                    return `
                      <button
                        role="tab"
                        id="tab-${cat}"
                        class="tracker-tab ${isActive ? 'active' : ''}"
                        aria-selected="${isActive}"
                        aria-controls="panel-${cat}"
                        data-category="${EcoTrack.Utils.sanitizeInput(cat)}"
                        tabindex="${isActive ? 0 : -1}"
                      >
                        <span class="tracker-tab-icon">${c.icon}</span>
                        <span class="tracker-tab-label">${EcoTrack.Utils.sanitizeInput(c.name)}</span>
                      </button>`;
                  }).join('')}
                </div>

                <!-- Category panel (type selector + input) -->
                <div id="category-panel" role="tabpanel" aria-labelledby="tab-${EcoTrack.Utils.sanitizeInput(_selectedCategory)}">
                </div>
              </div>
            </div>

            <!-- Right panel: Quick log presets -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <h2 class="card-header__title">⚡ Quick Log Presets</h2>
              </div>
              <div class="card-body" id="quick-log-section" style="padding: var(--space-5);"></div>
            </div>

          </div>

          <!-- Second Grid: Today's activities and Heatmap -->
          <div class="dashboard-grid-2" style="align-items: flex-start;">
            
            <!-- Today's Activity List -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <h2 class="card-header__title">🕒 Today's Logs</h2>
              </div>
              <div class="card-body" id="activity-list" style="padding: 0;"></div>
            </div>

            <!-- Calendar Heatmap -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <h2 class="card-header__title">📅 Monthly Activity Heatmap</h2>
              </div>
              <div class="card-body" id="calendar-heatmap"></div>
            </div>

          </div>
        </div>
      `;

      // Bind category tab clicks + keyboard navigation
      this._bindCategoryTabs();

      // Render sub-sections
      this.renderCategoryTab(_selectedCategory);
      this.renderQuickLog();
      this.renderActivityList(todayActivities);
      this.renderCalendarHeatmap();
    },

    /* ───── Category Tab Rendering ───── */

    /**
     * Render the activity type selector, value input, and log button
     * for a specific category.
     * @param {string} category
     */
    renderCategoryTab(category) {
      const panel = document.getElementById('category-panel');
      if (!panel) return;

      const cat = CATEGORIES[category];
      if (!cat) return;

      _selectedCategory = category;

      panel.setAttribute('aria-labelledby', `tab-${category}`);
      panel.id = `panel-${category}`;

      panel.innerHTML = `
        <form id="log-form" aria-label="Log activity form">
          <!-- Activity type selector -->
          <div class="input-group" style="margin-bottom: var(--space-4);">
            <label for="activity-type" class="input-label">Activity Type</label>
            <select id="activity-type" class="select" aria-required="true">
              ${cat.types.map(t =>
                `<option value="${EcoTrack.Utils.sanitizeInput(t.value)}">${EcoTrack.Utils.sanitizeInput(t.label)}</option>`
              ).join('')}
            </select>
          </div>

          <!-- Value input -->
          <div class="input-group" style="margin-bottom: var(--space-5);">
            <label for="activity-value" class="input-label">
              Amount <span class="input-help">(${EcoTrack.Utils.sanitizeInput(cat.unit)})</span>
            </label>
            <input
              type="number"
              id="activity-value"
              class="input"
              min="0"
              step="any"
              placeholder="e.g. 10"
              aria-required="true"
              autocomplete="off"
            />
          </div>

          <!-- Log button -->
          <button type="submit" class="btn btn-primary" style="width: 100%;"
                  aria-label="Log this activity">
            ➕ Log Activity
          </button>
        </form>
      `;

      // Bind form submission
      const form = document.getElementById('log-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const typeEl  = document.getElementById('activity-type');
          const valueEl = document.getElementById('activity-value');
          const type    = typeEl ? typeEl.value.trim() : '';
          const value   = valueEl ? parseFloat(valueEl.value) : NaN;
          this.logActivity(category, type, value);
          if (valueEl) valueEl.value = '';
        });
      }

      // Debounced value input validation feedback
      const valueInput = document.getElementById('activity-value');
      if (valueInput) {
        valueInput.addEventListener('input', EcoTrack.Utils.debounce((e) => {
          const v = parseFloat(e.target.value);
          e.target.classList.toggle('input--error', isNaN(v) || v < 0);
        }, 250));
      }
    },

    /* ───── Activity Logging ───── */

    /**
     * Log an activity — the core operation of the tracker.
     *
     * 1. Validate & sanitise inputs
     * 2. Calculate CO₂ via EcoTrack.Calculator
     * 3. Create an activity record
     * 4. Persist via EcoTrack.Store
     * 5. Award XP, update streak, check badges
     * 6. Show toast notification
     * 7. Re-render UI
     *
     * @param {string} category - Activity category key.
     * @param {string} type     - Activity type key.
     * @param {number} value    - Numeric value (distance, meals, etc.).
     */
    logActivity(category, type, value) {
      try {
        // ── Input validation ──
        if (!CATEGORIES[category]) {
          EcoTrack.Utils.showToast('Invalid category.', 'error');
          return;
        }
        if (!CATEGORIES[category].types.find(t => t.value === type)) {
          EcoTrack.Utils.showToast('Invalid activity type.', 'error');
          return;
        }
        if (isNaN(value) || value <= 0) {
          EcoTrack.Utils.showToast('Please enter a positive number.', 'warning');
          return;
        }
        // Cap value to prevent unreasonable entries
        if (value > 10000) {
          EcoTrack.Utils.showToast('Value seems too high. Please double-check.', 'warning');
          return;
        }

        // ── Calculate CO₂ ──
        let co2 = 0;
        if (EcoTrack.Calculator && typeof EcoTrack.Calculator.calculate === 'function') {
          co2 = EcoTrack.Calculator.calculate(category, type, value);
        } else {
          console.warn('[EcoTrack.Tracker] Calculator not available — using 0 CO₂.');
        }

        // ── Build activity object ──
        const activity = {
          id: EcoTrack.Utils.generateId(),
          timestamp: new Date().toISOString(),
          category: category,
          type: type,
          value: value,
          unit: CATEGORIES[category].unit,
          co2: co2,
        };

        // ── Persist ──
        if (EcoTrack.Store && typeof EcoTrack.Store.addActivity === 'function') {
          EcoTrack.Store.addActivity(activity);
        }

        // ── Gamification hooks ──
        if (EcoTrack.Challenges) {
          if (typeof EcoTrack.Challenges.awardXP === 'function') {
            EcoTrack.Challenges.awardXP(10); // base XP per log
          }
          if (typeof EcoTrack.Challenges.checkBadges === 'function') {
            EcoTrack.Challenges.checkBadges();
          }
        }
        if (EcoTrack.Store && typeof EcoTrack.Store.updateStreak === 'function') {
          EcoTrack.Store.updateStreak();
        }

        // ── User feedback ──
        const label = this.getActivityLabel(category, type);
        EcoTrack.Utils.showToast(`Logged ${label}: ${co2.toFixed(2)} kg CO₂`, 'success');

        // ── Re-render affected sections ──
        this._refreshUI();
      } catch (err) {
        console.error('[EcoTrack.Tracker] logActivity error:', err);
        EcoTrack.Utils.showToast('Something went wrong. Please try again.', 'error');
      }
    },

    /* ───── Delete Activity ───── */

    /**
     * Remove an activity by id, then re-render the UI.
     * @param {string} id - Activity id.
     */
    deleteActivity(id) {
      try {
        if (EcoTrack.Store && typeof EcoTrack.Store.removeActivity === 'function') {
          EcoTrack.Store.removeActivity(id);
        } else if (EcoTrack.Store && typeof EcoTrack.Store.getActivities === 'function') {
          // Fallback: filter out manually and save
          const activities = EcoTrack.Store.getActivities().filter(a => a.id !== id);
          EcoTrack.Store.saveActivities(activities);
        }
        EcoTrack.Utils.showToast('Activity removed.', 'info');
        this._refreshUI();
      } catch (err) {
        console.error('[EcoTrack.Tracker] deleteActivity error:', err);
      }
    },

    /* ───── Filtering ───── */

    /**
     * Return activities logged today.
     * @returns {Object[]}
     */
    getTodayActivities() {
      try {
        const all = (EcoTrack.Store && typeof EcoTrack.Store.getActivities === 'function')
          ? EcoTrack.Store.getActivities()
          : [];
        const todayStart = EcoTrack.Utils.startOfDay();
        return all.filter(a => new Date(a.timestamp).getTime() >= todayStart);
      } catch (err) {
        console.error('[EcoTrack.Tracker] getTodayActivities error:', err);
        return [];
      }
    },

    /**
     * Return activities logged in the current week (Mon-Sun).
     * @returns {Object[]}
     */
    getWeekActivities() {
      try {
        const all = (EcoTrack.Store && typeof EcoTrack.Store.getActivities === 'function')
          ? EcoTrack.Store.getActivities()
          : [];
        const now = new Date();
        const dayOfWeek = now.getDay() || 7;            // Mon=1 … Sun=7
        const monday = new Date(EcoTrack.Utils.startOfDay(now));
        monday.setDate(monday.getDate() - dayOfWeek + 1);
        const mondayMs = monday.getTime();
        return all.filter(a => new Date(a.timestamp).getTime() >= mondayMs);
      } catch (err) {
        console.error('[EcoTrack.Tracker] getWeekActivities error:', err);
        return [];
      }
    },

    /* ───── Activity List Render ───── */

    /**
     * Render a scrollable list of activities with category icon, label,
     * value, CO₂, and a delete button.
     * @param {Object[]} activities
     */
    renderActivityList(activities) {
      const listEl = document.getElementById('activity-list');
      if (!listEl) return;

      if (!activities || activities.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding: var(--space-6);" role="status">
            <span class="empty-icon" aria-hidden="true">🌿</span>
            <p style="color: var(--eco-text-secondary); margin-top: var(--space-2);">No activities logged today. Start tracking!</p>
          </div>`;
        return;
      }

      // Sort most recent first
      const sorted = [...activities].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      listEl.innerHTML = `
        <ul class="activity-feed" role="list">
          ${sorted.map(a => {
            const cat = CATEGORIES[a.category] || {};
            const label = this.getActivityLabel(a.category, a.type);
            const time = new Date(a.timestamp).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            });
            return `
              <li class="activity-feed-item" role="listitem">
                <div class="activity-feed-icon" style="background-color: rgba(16, 185, 129, 0.1); color: ${cat.color || 'var(--eco-primary)'};">${cat.icon || '📌'}</div>
                <div class="activity-feed-info">
                  <div class="activity-feed-name">${EcoTrack.Utils.sanitizeInput(label)}</div>
                  <div class="activity-feed-meta">
                    ${a.value} ${EcoTrack.Utils.sanitizeInput(a.unit || '')} · ${time}
                  </div>
                </div>
                <span class="activity-feed-co2">${(a.co2 || 0).toFixed(1)} kg</span>
                <button class="activity-feed-delete"
                        aria-label="Delete ${EcoTrack.Utils.sanitizeInput(label)} activity"
                        data-id="${EcoTrack.Utils.sanitizeInput(a.id)}"
                        title="Remove">
                  🗑️
                </button>
              </li>`;
          }).join('')}
        </ul>
      `;

      // Bind delete buttons
      listEl.querySelectorAll('.activity-feed-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (id) this.deleteActivity(id);
        });
      });
    },

    /* ───── Calendar Heatmap ───── */

    /**
     * Render a month-view calendar heatmap where each day is coloured
     * by total CO₂ logged:
     *   🟢 green  = low  (≤ 3 kg)
     *   🟡 yellow = medium (3–7 kg)
     *   🔴 red    = high  (> 7 kg)
     */
    renderCalendarHeatmap() {
      const container = document.getElementById('calendar-heatmap');
      if (!container) return;

      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0

        // Aggregate CO₂ per day
        const all = (EcoTrack.Store && typeof EcoTrack.Store.getActivities === 'function')
          ? EcoTrack.Store.getActivities()
          : [];
        const dailyTotals = {};
        all.forEach(a => {
          const d = new Date(a.timestamp);
          if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            dailyTotals[day] = (dailyTotals[day] || 0) + (a.co2 || 0);
          }
        });

        // Month name
        const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Day-of-week headers
        const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        let cells = '';
        // Empty cells before the 1st
        for (let i = 0; i < firstDayIndex; i++) {
          cells += '<div class="calendar-day empty" aria-hidden="true"></div>';
        }
        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
          const total = dailyTotals[d] || 0;
          const isToday = d === now.getDate();
          let level = '0';
          if (total > 0 && total <= HEATMAP_THRESHOLDS.low) level = '1';
          else if (total > HEATMAP_THRESHOLDS.low && total <= HEATMAP_THRESHOLDS.medium) level = '2';
          else if (total > HEATMAP_THRESHOLDS.medium && total <= 12) level = '3';
          else if (total > 12) level = '4';

          cells += `
            <div class="calendar-day level-${level} ${isToday ? 'today' : ''}"
                 role="gridcell"
                 aria-label="${monthName.split(' ')[0]} ${d}: ${total.toFixed(1)} kg CO₂"
                 title="${d} ${monthName.split(' ')[0]} — ${total.toFixed(1)} kg CO₂"
                 style="display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 600; color: var(--eco-text-secondary);">
              <span>${d}</span>
            </div>`;
        }

        container.innerHTML = `
          <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--eco-text); margin-bottom: var(--space-3); text-align: center;">📅 ${EcoTrack.Utils.sanitizeInput(monthName)}</h3>
          
          <div class="calendar-heatmap" role="grid" aria-label="Calendar heatmap grid" style="margin: 0 auto var(--space-4) auto;">
            ${dayHeaders.map(h => `<div class="calendar-day-label" role="columnheader" style="font-weight: 600;">${h}</div>`).join('')}
            ${cells}
          </div>

          <div style="display: flex; justify-content: center; gap: var(--space-3); font-size: 0.7rem; color: var(--eco-text-secondary); margin-top: var(--space-2); flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <div class="calendar-day level-0" style="width: 12px; height: 12px; min-width: 12px; border-radius: 2px;"></div>
              <span>None</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div class="calendar-day level-1" style="width: 12px; height: 12px; min-width: 12px; border-radius: 2px;"></div>
              <span>&le; ${HEATMAP_THRESHOLDS.low}kg</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div class="calendar-day level-2" style="width: 12px; height: 12px; min-width: 12px; border-radius: 2px;"></div>
              <span>&le; ${HEATMAP_THRESHOLDS.medium}kg</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div class="calendar-day level-3" style="width: 12px; height: 12px; min-width: 12px; border-radius: 2px;"></div>
              <span>&le; 12kg</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div class="calendar-day level-4" style="width: 12px; height: 12px; min-width: 12px; border-radius: 2px;"></div>
              <span>&gt; 12kg</span>
            </div>
          </div>
        `;
      } catch (err) {
        console.error('[EcoTrack.Tracker] renderCalendarHeatmap error:', err);
        container.innerHTML = '<p>Unable to load calendar.</p>';
      }
    },

    /* ───── Quick Log ───── */

    /**
     * Render one-tap quick log buttons for common activities.
     */
    renderQuickLog() {
      const section = document.getElementById('quick-log-section');
      if (!section) return;

      section.innerHTML = `
        <div class="quick-actions" role="group" aria-label="Quick log buttons" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));">
          ${QUICK_LOGS.map(ql => `
            <button class="quick-action-btn"
                    data-category="${EcoTrack.Utils.sanitizeInput(ql.category)}"
                    data-type="${EcoTrack.Utils.sanitizeInput(ql.type)}"
                    data-value="${ql.value}"
                    aria-label="Quick log: ${EcoTrack.Utils.sanitizeInput(ql.label)}"
                    title="${EcoTrack.Utils.sanitizeInput(ql.label)} — ${ql.value} ${CATEGORIES[ql.category]?.unit || ''}">
              <span class="quick-action-icon" aria-hidden="true">${ql.icon}</span>
              <span class="quick-action-label">${EcoTrack.Utils.sanitizeInput(ql.label)}</span>
            </button>
          `).join('')}
        </div>
      `;

      // Bind click handlers
      section.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cat  = btn.getAttribute('data-category');
          const type = btn.getAttribute('data-type');
          const val  = parseFloat(btn.getAttribute('data-value'));
          this.logActivity(cat, type, val);
        });
      });
    },

    /* ───── Label Helper ───── */

    /**
     * Return a human-readable label for a given category + type pair.
     * @param {string} category
     * @param {string} type
     * @returns {string}
     */
    getActivityLabel(category, type) {
      const cat = CATEGORIES[category];
      if (!cat) return type || 'Unknown';
      const found = cat.types.find(t => t.value === type);
      return found ? found.label : type || 'Unknown';
    },

    /* ───── Internal Helpers ───── */

    /**
     * Bind click + keyboard events to category tab buttons.
     * Implements arrow-key navigation per WAI-ARIA tabs pattern.
     * @private
     */
    _bindCategoryTabs() {
      const tabs = document.querySelectorAll('.tracker-tab');
      const categoryKeys = Object.keys(CATEGORIES);

      tabs.forEach(tab => {
        // Click handler
        tab.addEventListener('click', () => {
          const cat = tab.getAttribute('data-category');
          if (cat) {
            this._activateTab(cat, tabs);
          }
        });

        // Keyboard: ArrowLeft / ArrowRight / Home / End
        tab.addEventListener('keydown', (e) => {
          const currentIdx = categoryKeys.indexOf(tab.getAttribute('data-category'));
          let newIdx = currentIdx;

          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            newIdx = (currentIdx + 1) % categoryKeys.length;
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            newIdx = (currentIdx - 1 + categoryKeys.length) % categoryKeys.length;
          } else if (e.key === 'Home') {
            newIdx = 0;
          } else if (e.key === 'End') {
            newIdx = categoryKeys.length - 1;
          } else {
            return; // ignore other keys
          }

          e.preventDefault();
          this._activateTab(categoryKeys[newIdx], tabs);
          const newTab = document.querySelector(`[data-category="${categoryKeys[newIdx]}"]`);
          if (newTab) newTab.focus();
        });
      });
    },

    /**
     * Visually and logically activate a category tab.
     * @param {string} category
     * @param {NodeList} tabs
     * @private
     */
    _activateTab(category, tabs) {
      tabs.forEach(t => {
        const isActive = t.getAttribute('data-category') === category;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
        t.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      this.renderCategoryTab(category);
    },

    /**
     * Refresh today's total, activity list, and heatmap after a
     * log or delete operation.
     * @private
     */
    _refreshUI() {
      const todayActivities = this.getTodayActivities();
      const todayTotal = todayActivities.reduce((s, a) => s + (a.co2 || 0), 0);

      // Update total counter
      const totalEl = document.getElementById('today-total');
      if (totalEl) {
        totalEl.innerHTML = `
          <span style="font-weight: 700; font-family: var(--font-mono); font-size: 1.25rem; color: var(--eco-primary);">${todayTotal.toFixed(2)} kg</span>
          <span style="font-size: 0.75rem; color: var(--eco-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: block;">Logged Today</span>
        `;
      }

      this.renderActivityList(todayActivities);
      this.renderCalendarHeatmap();
    },
  });
})();
