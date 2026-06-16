/**
 * EcoTrack Dashboard Module
 * =========================
 * Renders the main dashboard view — the central hub where users see
 * their carbon footprint at a glance: eco score, gauges, charts,
 * comparisons, challenges, and insights.
 *
 * @namespace EcoTrack.Dashboard
 * @requires EcoTrack.Store
 * @requires EcoTrack.Charts
 * @requires EcoTrack.Tracker
 * @requires EcoTrack.Challenges
 * @requires EcoTrack.Insights
 * @requires EcoTrack.Utils
 */
;(function (global) {
  'use strict';

  const EcoTrack = global.EcoTrack || (global.EcoTrack = {});

  // ──────────────────────────────────────────────────
  // Constants
  // ──────────────────────────────────────────────────

  /** Paris Agreement target: ≈ 2.0 tonnes CO₂/year ≈ 5.48 kg/day. */
  const PARIS_TARGET_YEARLY_TONNES = 2.0;
  const PARIS_TARGET_DAILY_KG      = (PARIS_TARGET_YEARLY_TONNES * 1000) / 365; // ~5.48

  /** Approximate world / country average (configurable). */
  const COUNTRY_AVG_YEARLY_TONNES = 8.0;                // ~global avg ≈ 4.7, US ≈ 15
  const COUNTRY_AVG_DAILY_KG      = (COUNTRY_AVG_YEARLY_TONNES * 1000) / 365;

  /** Category metadata for stat cards and charts. */
  const CATEGORY_META = {
    transport: { icon: '🚗', name: 'Transport', color: '#3B82F6' },
    food:      { icon: '🍽️', name: 'Food',      color: '#F97316' },
    energy:    { icon: '⚡', name: 'Energy',    color: '#EAB308' },
    shopping:  { icon: '🛒', name: 'Shopping',  color: '#A855F7' },
    digital:   { icon: '💻', name: 'Digital',   color: '#06B6D4' },
  };

  /** Quick-action presets (mirrors tracker quick-logs). */
  const QUICK_ACTIONS = [
    { label: 'Drive',      category: 'transport', type: 'car_petrol',       value: 15, icon: '🚗' },
    { label: 'Bus',        category: 'transport', type: 'bus',              value: 10, icon: '🚌' },
    { label: 'Meat meal',  category: 'food',      type: 'average_meal',     value: 1,  icon: '🍖' },
    { label: 'Veggie',     category: 'food',      type: 'vegetarian_meal',  value: 1,  icon: '🥗' },
    { label: 'Shower',     category: 'energy',    type: 'shower_5min',      value: 1,  icon: '🚿' },
    { label: 'Streaming',  category: 'digital',   type: 'video_streaming',  value: 1,  icon: '📺' },
  ];

  // ──────────────────────────────────────────────────
  // Internal state
  // ──────────────────────────────────────────────────
  let _container = null;

  // ──────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────

  /**
   * Sanitise a string for safe HTML insertion.
   * @param {string} str
   * @returns {string}
   */
  function _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /**
   * Retrieve all activities from the store (safe wrapper).
   * @returns {Object[]}
   */
  function _allActivities() {
    return (EcoTrack.Store && typeof EcoTrack.Store.getActivities === 'function')
      ? EcoTrack.Store.getActivities()
      : [];
  }

  /**
   * Return the start-of-day timestamp (ms) for a Date.
   * @param {Date} [date=new Date()]
   * @returns {number}
   */
  function _startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /**
   * Get the user profile from the store, or a sensible default.
   * @returns {{ name: string, level: number, xp: number, xpToNext: number }}
   */
  function _profile() {
    if (EcoTrack.Store && typeof EcoTrack.Store.getUserProfile === 'function') {
      return EcoTrack.Store.getUserProfile() || {};
    }
    return {};
  }

  /**
   * Animate a number counting up. Delegates to EcoTrack.Utils when available.
   * @param {HTMLElement} el - Target element.
   * @param {number} end    - Target value.
   * @param {number} [duration=800]
   */
  function _animateNumber(el, end, duration = 800) {
    if (EcoTrack.Utils && typeof EcoTrack.Utils.animateCounter === 'function') {
      EcoTrack.Utils.animateCounter(el, 0, end, duration);
      return;
    }
    // Simple fallback
    const start = 0;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = start + (end - start) * progress;
      el.textContent = value.toFixed(value >= 100 ? 0 : 1);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ──────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────

  EcoTrack.Dashboard = {

    /* ───── Initialisation ───── */

    /**
     * Set up the dashboard module and perform initial render.
     * @param {string} [containerId='dashboard-container']
     */
    init() {
      try {
        // Ensure Charts module defaults are applied
        if (EcoTrack.Charts && typeof EcoTrack.Charts.init === 'function') {
          EcoTrack.Charts.init();
        }

        console.log('[EcoTrack.Dashboard] Initialised.');
      } catch (err) {
        console.error('[EcoTrack.Dashboard] init error:', err);
      }
    },

    /* ═══════════════════════════════════════════════
     *  FULL DASHBOARD RENDER
     * ═══════════════════════════════════════════════ */

    /**
     * Render the complete dashboard view with all sections.
     */
    renderDashboard() {
      const mainContent = document.getElementById('main-content');
      if (!mainContent) return;

      mainContent.innerHTML = `
        <div class="page-container animate-fade-in" role="main" aria-label="EcoTrack Dashboard">

          <!-- 1. Hero section & 2. Carbon budget gauge in top grid -->
          <div class="dashboard-grid-2" style="margin-bottom: var(--space-6);">
            <div class="card dashboard-hero" id="dash-hero" aria-label="Welcome and eco score" style="margin-bottom: 0;"></div>
            <div class="card carbon-gauge" id="dash-gauge" aria-label="Carbon gauge"></div>
          </div>

          <!-- 3. Category breakdown -->
          <div class="card" style="margin-bottom: var(--space-6);">
            <div class="card-header">
              <h2 class="card-header__title">📊 This Week by Category</h2>
            </div>
            <div class="card-body" id="dash-categories"></div>
          </div>

          <!-- 4. Trend chart & 5. Comparison -->
          <div class="dashboard-grid-2" style="margin-bottom: var(--space-6);">
            <div class="card" style="min-height: 320px;">
              <div class="card-header"><h2 class="card-header__title">📈 30-Day Trend</h2></div>
              <div class="card-body" id="dash-trend"></div>
            </div>
            <div class="card" style="min-height: 320px;">
              <div class="card-header"><h2 class="card-header__title">⚖️ How You Compare</h2></div>
              <div class="card-body" id="dash-comparison"></div>
            </div>
          </div>

          <!-- 6. Quick actions -->
          <div class="card" style="margin-bottom: var(--space-6);">
            <div class="card-header"><h2 class="card-header__title">⚡ Quick Actions</h2></div>
            <div class="card-body" id="dash-quick"></div>
          </div>

          <!-- 7. Active challenges & 8. Recent activity -->
          <div class="dashboard-grid-2" style="margin-bottom: var(--space-6);">
            <div class="card">
              <div class="card-header"><h2 class="card-header__title">🏆 Active Challenges</h2></div>
              <div class="card-body" id="dash-challenges"></div>
            </div>
            <div class="card">
              <div class="card-header"><h2 class="card-header__title">🕒 Recent Activity</h2></div>
              <div class="card-body" id="dash-recent" style="padding: 0;"></div>
            </div>
          </div>

          <!-- 9. Insights & 10. Streak/Badges -->
          <div class="dashboard-grid-2">
            <div class="card">
              <div class="card-header"><h2 class="card-header__title">💡 Insights & Tips</h2></div>
              <div class="card-body" id="dash-insights" style="padding: 0;"></div>
            </div>
            <div class="card">
              <div class="card-header"><h2 class="card-header__title">🔥 Streak & Badges</h2></div>
              <div class="card-body" id="dash-streak"></div>
            </div>
          </div>

        </div>
      `;

      // Render each section
      this.renderHeroSection();
      this.renderCarbonGauge();
      this.renderCategoryCards();
      this.renderTrendChart();
      this.renderComparisonSection();
      this.renderQuickActions();
      this.renderChallenges();
      this.renderRecentActivity();
      this.renderInsights();
      this.renderStreakDisplay();
    },

    /* ═══════════════════════════════════════════════
     *  SECTION RENDERERS
     * ═══════════════════════════════════════════════ */

    /* ───── 1. Hero Section ───── */

    /**
     * Welcome message, eco score with animated counter,
     * and level progress bar.
     */
    renderHeroSection() {
      const section = document.getElementById('dash-hero');
      if (!section) return;

      const profile = _profile();
      const name    = _esc(profile.name || 'Eco Explorer');
      const score   = this.getEcoScore();

      // Time-based greeting
      const hour = new Date().getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';

      let levelTitle = 'Eco Seedling';
      if (EcoTrack.Challenges && typeof EcoTrack.Challenges.getLevelInfo === 'function') {
        const info = EcoTrack.Challenges.getLevelInfo(profile.xp || 0);
        levelTitle = info.title || levelTitle;
      }

      section.innerHTML = `
        <div class="hero-greeting">
          <div>${greeting}, <span>${name}</span>! 🌍</div>
          <p class="hero-subtitle">You are on your way to becoming an Eco Legend. Level ${profile.level || 1} · ${levelTitle}</p>
        </div>

        <div class="eco-score" aria-label="Eco Score: ${score} out of 100">
          <div class="eco-score-value" id="eco-score-value">${score}</div>
          <div class="eco-score-label">Eco Score</div>
        </div>
      `;

      // Animate the eco score counter
      const scoreEl = document.getElementById('eco-score-value');
      if (scoreEl) _animateNumber(scoreEl, score, 1000);
    },

    /* ───── 2. Carbon Gauge ───── */

    /**
     * Large SVG circular gauge showing today's or this week's CO₂
     * compared against a daily target derived from the Paris Agreement.
     */
    renderCarbonGauge() {
      const section = document.getElementById('dash-gauge');
      if (!section) return;

      // Compute today's CO₂
      const todayStart = _startOfDay();
      const todayActivities = _allActivities().filter(
        a => new Date(a.timestamp).getTime() >= todayStart
      );
      const todayCO2 = todayActivities.reduce((s, a) => s + (a.co2 || 0), 0);
      const target = PARIS_TARGET_DAILY_KG;

      // Percentage of target used (cap at 200% for visual)
      const pct = Math.min((todayCO2 / target) * 100, 200);
      // SVG arc calculation — radius 80, circumference ≈ 502.65
      const radius = 80;
      const circumference = 2 * Math.PI * radius;
      const arcLength = (Math.min(pct, 100) / 100) * circumference;

      // Class: standard → warning → danger
      let gaugeStateClass = '';
      if (pct > 60 && pct <= 100) gaugeStateClass = 'warning';
      if (pct > 100) gaugeStateClass = 'danger';

      section.innerHTML = `
        <div class="gauge-container" style="max-width: 170px; margin: 0 auto;" aria-label="Carbon gauge: ${todayCO2.toFixed(1)} of ${target.toFixed(1)} kg target">
          <svg viewBox="0 0 200 200" role="img" aria-hidden="true" style="width: 100%; height: 100%;">
            <!-- Background circle -->
            <circle cx="100" cy="100" r="${radius}" class="gauge-bg" fill="none" stroke-width="12" />
            <!-- Foreground arc -->
            <circle cx="100" cy="100" r="${radius}" class="gauge-fill ${gaugeStateClass}" fill="none" stroke-width="12"
                    stroke-dasharray="${arcLength} ${circumference}" stroke-linecap="round"
                    transform="rotate(-90 100 100)" />
            <text x="100" y="105" text-anchor="middle" class="gauge-center-text" id="gauge-value">${todayCO2.toFixed(1)}</text>
            <text x="100" y="130" text-anchor="middle" class="gauge-center-unit">kg CO₂</text>
          </svg>
        </div>
        <div class="gauge-label">
          ${pct <= 100
            ? `✅ You've used <strong>${pct.toFixed(0)}%</strong> of your daily budget (${target.toFixed(1)} kg).`
            : `⚠️ Budget exceeded by <strong>${(todayCO2 - target).toFixed(1)} kg</strong>.`
          }
        </div>
      `;

      // Animate gauge value
      const valEl = document.getElementById('gauge-value');
      if (valEl) _animateNumber(valEl, todayCO2, 900);
    },

    /* ───── 3. Category Cards + Donut ───── */

    /**
     * Grid of stat cards per category and a donut chart showing
     * the category breakdown.
     */
    renderCategoryCards() {
      const section = document.getElementById('dash-categories');
      if (!section) return;

      // Aggregate CO₂ by category for current week
      const weekStart = (() => {
        const d = new Date();
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })();

      const weekActivities = _allActivities().filter(
        a => new Date(a.timestamp).getTime() >= weekStart
      );

      const categoryTotals = {};
      Object.keys(CATEGORY_META).forEach(c => { categoryTotals[c] = 0; });
      weekActivities.forEach(a => {
        if (categoryTotals.hasOwnProperty(a.category)) {
          categoryTotals[a.category] += (a.co2 || 0);
        }
      });

      const totalWeek = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

      section.innerHTML = `
        <div class="grid-2" style="grid-template-columns: 1fr 2fr; align-items: center; gap: var(--space-6);">
          <!-- Donut chart -->
          <div class="chart-container chart-container-square" style="max-width: 250px;">
            <canvas id="category-donut" aria-label="Category breakdown donut chart"
                    role="img" width="250" height="250"></canvas>
          </div>
          <!-- Stat cards -->
          <div class="category-breakdown" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-4);">
            ${Object.keys(CATEGORY_META).map(cat => {
              const m = CATEGORY_META[cat];
              const val = categoryTotals[cat] || 0;
              const pct = totalWeek > 0 ? ((val / totalWeek) * 100).toFixed(0) : 0;
              return `
                <div class="category-card" aria-label="${m.name}: ${val.toFixed(2)} kg CO₂ (${pct}%)">
                  <span class="category-card-icon" aria-hidden="true">${m.icon}</span>
                  <div class="category-card-name">${_esc(m.name)}</div>
                  <div class="category-card-value">${val.toFixed(1)} kg</div>
                  <div class="category-card-bar">
                    <div class="category-card-bar-fill" style="width: ${pct}%; background-color: ${m.color};"></div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      `;

      // Create donut chart via Charts module
      if (EcoTrack.Charts && typeof EcoTrack.Charts.createDonutChart === 'function') {
        EcoTrack.Charts.createDonutChart('category-donut', categoryTotals);
      }
    },

    /* ───── 4. Trend Chart (30 days) ───── */

    /**
     * Line chart showing daily CO₂ over the last 30 days.
     * @private — called from renderDashboard.
     */
    renderTrendChart() {
      const section = document.getElementById('dash-trend');
      if (!section) return;

      section.innerHTML = `
        <div class="chart-container">
          <canvas id="trend-line" aria-label="30-day CO₂ trend chart"
                  role="img" style="width: 100%; height: 100%;"></canvas>
        </div>
      `;

      // Build last 30 days data
      const labels = [];
      const values = [];
      const all = _allActivities();
      const now = new Date();

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = _startOfDay(d);
        const dayEnd   = dayStart + 86400000; // +24 h

        const dayLabel = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        labels.push(dayLabel);

        const dayTotal = all
          .filter(a => {
            const t = new Date(a.timestamp).getTime();
            return t >= dayStart && t < dayEnd;
          })
          .reduce((s, a) => s + (a.co2 || 0), 0);
        values.push(parseFloat(dayTotal.toFixed(2)));
      }

      if (EcoTrack.Charts && typeof EcoTrack.Charts.createLineChart === 'function') {
        EcoTrack.Charts.createLineChart('trend-line', {
          labels,
          values,
          target: PARIS_TARGET_DAILY_KG,
        });
      }
    },

    /* ───── 5. Comparison Section ───── */

    /**
     * Render a horizontal comparison bar: You vs Country Avg vs Paris Target.
     */
    renderComparisonSection() {
      const section = document.getElementById('dash-comparison');
      if (!section) return;

      // Weekly CO₂ → annualised
      const weekActivities = (EcoTrack.Tracker && typeof EcoTrack.Tracker.getWeekActivities === 'function')
        ? EcoTrack.Tracker.getWeekActivities()
        : [];
      const weekTotal = weekActivities.reduce((s, a) => s + (a.co2 || 0), 0);
      const annualisedTonnes = ((weekTotal / 7) * 365) / 1000;

      const maxVal = Math.max(annualisedTonnes, COUNTRY_AVG_YEARLY_TONNES, PARIS_TARGET_YEARLY_TONNES);
      const userPct = ((annualisedTonnes / maxVal) * 100).toFixed(0);
      const avgPct = ((COUNTRY_AVG_YEARLY_TONNES / maxVal) * 100).toFixed(0);
      const targetPct = ((PARIS_TARGET_YEARLY_TONNES / maxVal) * 100).toFixed(0);

      section.innerHTML = `
        <div class="comparison-section" aria-label="Comparison with averages">
          <div class="comparison-bar-container" style="margin-bottom: var(--space-4);">
            <div class="comparison-bar-label">
              <span class="comparison-bar-name">You (Estimated Annualized)</span>
              <span class="comparison-bar-value">${annualisedTonnes.toFixed(1)} t CO₂</span>
            </div>
            <div class="comparison-bar-track">
              <div class="comparison-bar-fill user" style="width: ${userPct}%;">${userPct}%</div>
            </div>
          </div>

          <div class="comparison-bar-container" style="margin-bottom: var(--space-4);">
            <div class="comparison-bar-label">
              <span class="comparison-bar-name">Country Average</span>
              <span class="comparison-bar-value">${COUNTRY_AVG_YEARLY_TONNES.toFixed(1)} t CO₂</span>
            </div>
            <div class="comparison-bar-track">
              <div class="comparison-bar-fill average" style="width: ${avgPct}%;">${avgPct}%</div>
            </div>
          </div>

          <div class="comparison-bar-container">
            <div class="comparison-bar-label">
              <span class="comparison-bar-name">Paris Agreement Target</span>
              <span class="comparison-bar-value">${PARIS_TARGET_YEARLY_TONNES.toFixed(1)} t CO₂</span>
            </div>
            <div class="comparison-bar-track">
              <div class="comparison-bar-fill target" style="width: ${targetPct}%;">${targetPct}%</div>
            </div>
          </div>
        </div>
      `;
    },

    /* ───── 6. Quick Actions ───── */

    /**
     * Grid of quick-action buttons that log activities directly
     * from the dashboard.
     */
    renderQuickActions() {
      const section = document.getElementById('dash-quick');
      if (!section) return;

      section.innerHTML = `
        <div class="quick-actions" role="group" aria-label="Quick action buttons">
          ${QUICK_ACTIONS.map(qa => `
            <button class="quick-action-btn"
                    data-category="${_esc(qa.category)}"
                    data-type="${_esc(qa.type)}"
                    data-value="${qa.value}"
                    aria-label="Quick log: ${_esc(qa.label)}"
                    title="${_esc(qa.label)}">
              <span class="quick-action-icon" aria-hidden="true">${qa.icon}</span>
              <span class="quick-action-label">${_esc(qa.label)}</span>
            </button>
          `).join('')}
        </div>
      `;

      section.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (EcoTrack.Tracker && typeof EcoTrack.Tracker.logActivity === 'function') {
            EcoTrack.Tracker.logActivity(
              btn.dataset.category,
              btn.dataset.type,
              parseFloat(btn.dataset.value)
            );
            // Refresh dashboard data after logging
            this.updateDashboard();
          }
        });
      });
    },

    /* ───── 7. Active Challenges ───── */

    /**
     * Render progress cards for active challenges.
     */
    renderChallenges() {
      const section = document.getElementById('dash-challenges');
      if (!section) return;

      let challenges = [];
      if (EcoTrack.Challenges && typeof EcoTrack.Challenges.getActiveChallenges === 'function') {
        challenges = EcoTrack.Challenges.getActiveChallenges() || [];
      }

      if (challenges.length === 0) {
        section.innerHTML = `
          <p class="dash__empty" style="padding: var(--space-4); text-align: center;">No active challenges. Check the Challenges page!</p>
        `;
        return;
      }

      section.innerHTML = `
        <div class="challenges-grid" style="grid-template-columns: 1fr; gap: var(--space-3);">
          ${challenges.slice(0, 3).map(ch => {
            const pct = ch.target > 0 ? Math.min((ch.progress / ch.target) * 100, 100).toFixed(0) : 0;
            return `
              <div class="challenge-card" aria-label="${_esc(ch.title)}: ${pct}% complete" style="padding: var(--space-4);">
                <div class="challenge-card-header" style="margin-bottom: var(--space-2); display: flex; align-items: center; gap: var(--space-2);">
                  <span class="challenge-card-icon" style="font-size: 1.5rem;">${ch.icon}</span>
                  <div class="challenge-card-title" style="font-weight: 600;">${_esc(ch.title)}</div>
                </div>
                <div class="challenge-card-progress">
                  <div class="challenge-progress-text">
                    <span>${ch.progress} / ${ch.target}</span>
                    <span>${pct}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${pct}%;"></div>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      `;
    },

    /* ───── 8. Recent Activity ───── */

    /**
     * Timeline of the last 5 logged activities.
     */
    renderRecentActivity() {
      const section = document.getElementById('dash-recent');
      if (!section) return;

      const all = _allActivities()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      if (all.length === 0) {
        section.innerHTML = `
          <p class="dash__empty" style="padding: var(--space-4); text-align: center;">No activities logged yet. Start tracking!</p>
        `;
        return;
      }

      section.innerHTML = `
        <ul class="activity-feed" role="list">
          ${all.map(a => {
            const meta = CATEGORY_META[a.category] || {};
            const label = (EcoTrack.Tracker && typeof EcoTrack.Tracker.getActivityLabel === 'function')
              ? EcoTrack.Tracker.getActivityLabel(a.category, a.type)
              : (a.type || 'Activity');
            const timeAgo = _relativeTime(a.timestamp);
            return `
              <li class="activity-feed-item" role="listitem">
                <div class="activity-feed-icon" style="background-color: rgba(16, 185, 129, 0.1); color: ${meta.color || 'var(--eco-primary)'};">${meta.icon || '📌'}</div>
                <div class="activity-feed-info">
                  <div class="activity-feed-name">${_esc(label)}</div>
                  <div class="activity-feed-meta">${_esc(timeAgo)}</div>
                </div>
                <span class="activity-feed-co2">${(a.co2 || 0).toFixed(1)} kg</span>
              </li>`;
          }).join('')}
        </ul>
      `;
    },

    /* ───── 9. Insights Panel ───── */

    /**
     * Top 3 recommendations from EcoTrack.Insights.
     */
    renderInsights() {
      const section = document.getElementById('dash-insights');
      if (!section) return;

      let html = '';
      if (EcoTrack.Insights && typeof EcoTrack.Insights.renderInsightsPanel === 'function') {
        html = EcoTrack.Insights.renderInsightsPanel();
      } else {
        const tips = [
          { icon: '🚴', title: 'Cycle for short trips', text: 'Try cycling for trips under 5 km to cut transport emissions.' },
          { icon: '🥗', title: 'Swap one meat meal', text: 'Swap one meat meal per week for a plant-based alternative.' },
          { icon: '💡', title: 'Unplug devices', text: 'Unplug devices when not in use to reduce phantom energy loads.' },
        ];
        html = `<ul class="activity-feed" role="list">
          ${tips.map(tip => `
            <li class="activity-feed-item" role="listitem">
              <div class="activity-feed-icon">${tip.icon}</div>
              <div class="activity-feed-info">
                <div class="activity-feed-name">${_esc(tip.title)}</div>
                <div class="activity-feed-meta">${_esc(tip.text)}</div>
              </div>
            </li>
          `).join('')}
        </ul>`;
      }
      section.innerHTML = html;
    },

    /* ───── 10. Streak & Badges ───── */

    /**
     * Current logging streak (🔥) and recently earned badges.
     */
    renderStreakDisplay() {
      const section = document.getElementById('dash-streak');
      if (!section) return;

      // Streak
      let streak = 0;
      if (EcoTrack.Store && typeof EcoTrack.Store.getStreak === 'function') {
        const streakData = EcoTrack.Store.getStreak();
        streak = (streakData && typeof streakData === 'object') ? (streakData.current || 0) : (streakData || 0);
      }

      // Badges
      let badges = [];
      if (EcoTrack.Store && typeof EcoTrack.Store.getBadges === 'function') {
        badges = EcoTrack.Store.getBadges() || [];
      }
      // Resolve badge metadata from Challenges module
      const resolvedBadges = badges.map(b => {
        const info = (EcoTrack.Challenges && typeof EcoTrack.Challenges.getBadgeInfo === 'function')
          ? EcoTrack.Challenges.getBadgeInfo(b.id) : null;
        return {
          name: info?.name || b.id || 'Badge',
          icon: info?.icon || '🏅'
        };
      });
      const recentBadges = resolvedBadges.slice(-5);

      section.innerHTML = `
        <div class="streak-display" style="margin-bottom: var(--space-4);">
          <span class="streak-fire" aria-hidden="true">🔥</span>
          <div>
            <span class="streak-count" id="streak-count">${streak}</span>
            <span class="streak-label">day streak</span>
          </div>
        </div>
        <h3 style="font-size: 0.85rem; color: var(--eco-text-secondary); margin-bottom: var(--space-3); font-weight: 600;">Recent Badges</h3>
        <div class="badges-grid" style="grid-template-columns: repeat(5, 1fr); gap: var(--space-2);">
          ${recentBadges.length > 0
            ? recentBadges.map(b => `
                <div class="badge-item unlocked" title="${_esc(b.name)}" style="padding: var(--space-2); min-height: auto;">
                  <span class="badge-icon" style="font-size: 1.5rem; margin-bottom: 0;">${b.icon}</span>
                </div>
              `).join('')
            : '<p class="dash__empty" style="grid-column: span 5; text-align: center; font-size: 0.85rem;">No badges earned yet. Keep going!</p>'
          }
        </div>
      `;

      // Animate streak
      const streakEl = document.getElementById('streak-count');
      if (streakEl && streak > 0) _animateNumber(streakEl, streak, 700);
    },

    /* ═══════════════════════════════════════════════
     *  UPDATE & UTILITY
     * ═══════════════════════════════════════════════ */

    /**
     * Refresh all dashboard data and re-render dynamic sections
     * without a full page rebuild.
     */
    updateDashboard() {
      try {
        this.renderHeroSection();
        this.renderCarbonGauge();
        this.renderCategoryCards();
        this.renderTrendChart();
        this.renderComparisonSection();
        this.renderChallenges();
        this.renderRecentActivity();
        this.renderInsights();
        this.renderStreakDisplay();
      } catch (err) {
        console.error('[EcoTrack.Dashboard] updateDashboard error:', err);
      }
    },

    /**
     * Calculate a 0–100 eco score based on the user's annualised
     * carbon footprint vs the Paris target.
     *
     * Scoring:
     *   100  = at or below Paris target (2.0 t/year)
     *   0    = at 2× country average
     *   Linear interpolation in between
     *
     * @returns {number} Eco score (0–100, integer).
     */
    getEcoScore() {
      try {
        // Use this week's data to estimate annual footprint
        const weekActivities = (EcoTrack.Tracker && typeof EcoTrack.Tracker.getWeekActivities === 'function')
          ? EcoTrack.Tracker.getWeekActivities()
          : [];
        const weekCO2 = weekActivities.reduce((s, a) => s + (a.co2 || 0), 0);
        const annualTonnes = ((weekCO2 / 7) * 365) / 1000;

        const best  = PARIS_TARGET_YEARLY_TONNES;        // 2.0 t → score 100
        const worst = COUNTRY_AVG_YEARLY_TONNES * 2;     // 16.0 t → score 0

        if (annualTonnes <= best) return 100;
        if (annualTonnes >= worst) return 0;

        // Linear interpolation
        const score = ((worst - annualTonnes) / (worst - best)) * 100;
        return Math.round(Math.max(0, Math.min(100, score)));
      } catch (err) {
        console.error('[EcoTrack.Dashboard] getEcoScore error:', err);
        return 50; // safe default
      }
    },
  };

  // ──────────────────────────────────────────────────
  // Private utility — relative time display
  // ──────────────────────────────────────────────────

  /**
   * Convert an ISO timestamp to a human-readable relative string.
   * @param {string} isoString
   * @returns {string}
   */
  function _relativeTime(isoString) {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const mins  = Math.floor(diff / 60000);
      if (mins < 1)   return 'just now';
      if (mins < 60)  return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24)   return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch (_) {
      return '';
    }
  }

})(typeof window !== 'undefined' ? window : globalThis);
