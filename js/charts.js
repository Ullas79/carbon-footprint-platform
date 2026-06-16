/**
 * EcoTrack Charts Module
 * ======================
 * Chart.js wrapper providing consistent chart creation, theming,
 * and lifecycle management for all EcoTrack visualizations.
 *
 * @namespace EcoTrack.Charts
 * @requires Chart.js (loaded via CDN)
 * @requires EcoTrack (global namespace)
 */
;(function (global) {
  'use strict';

  // ──────────────────────────────────────────────────
  // Ensure the global namespace exists
  // ──────────────────────────────────────────────────
  const EcoTrack = global.EcoTrack || (global.EcoTrack = {});

  // ──────────────────────────────────────────────────
  // Constants
  // ──────────────────────────────────────────────────

  /**
   * Consistent colour palette mapped to activity categories.
   * Each entry has a solid colour and a translucent variant for fills.
   * @type {Object.<string, {solid: string, alpha: string}>}
   */
  const CATEGORY_COLORS = {
    transport: { solid: '#3B82F6', alpha: 'rgba(59,130,246,0.35)' },   // blue
    food:      { solid: '#F97316', alpha: 'rgba(249,115,22,0.35)' },   // orange
    energy:    { solid: '#EAB308', alpha: 'rgba(234,179,8,0.35)' },    // yellow
    shopping:  { solid: '#A855F7', alpha: 'rgba(168,85,247,0.35)' },   // purple
    digital:   { solid: '#06B6D4', alpha: 'rgba(6,182,212,0.35)' },    // cyan
  };

  /** Category labels with emoji prefixes for chart legends. */
  const CATEGORY_LABELS = {
    transport: '🚗 Transport',
    food:      '🍽️ Food',
    energy:    '⚡ Energy',
    shopping:  '🛒 Shopping',
    digital:   '💻 Digital',
  };

  /** Default green accent used for single-series charts. */
  const ACCENT_GREEN = '#22C55E';
  const ACCENT_GREEN_ALPHA = 'rgba(34,197,94,0.25)';

  // ──────────────────────────────────────────────────
  // Internal state — stores live Chart.js instances
  // keyed by canvas element id for deterministic cleanup.
  // ──────────────────────────────────────────────────
  /** @type {Map<string, Chart>} */
  const _instances = new Map();

  // ──────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────

  /**
   * Safely retrieve a 2D canvas context by element id.
   * @param {string} canvasId - The id attribute of the <canvas> element.
   * @returns {CanvasRenderingContext2D|null}
   */
  function _getCtx(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) {
      console.warn(`[EcoTrack.Charts] Canvas #${canvasId} not found.`);
      return null;
    }
    return el.getContext('2d');
  }

  /**
   * Destroy any pre-existing chart on the same canvas to avoid
   * the "Canvas is already in use" warning from Chart.js.
   * @param {string} canvasId
   */
  function _destroyExisting(canvasId) {
    if (_instances.has(canvasId)) {
      _instances.get(canvasId).destroy();
      _instances.delete(canvasId);
    }
  }

  /**
   * Build a vertical linear gradient for line-chart area fills.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} colorTop  - RGBA colour at the top.
   * @param {string} [colorBottom='rgba(34,197,94,0)'] - RGBA colour at the bottom.
   * @returns {CanvasGradient}
   */
  function _buildGradient(ctx, colorTop, colorBottom = 'rgba(34,197,94,0)') {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, colorBottom);
    return gradient;
  }

  // ──────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────

  EcoTrack.Charts = {

    /* ───── Initialisation ───── */

    /**
     * Apply global Chart.js defaults (dark theme, Inter font, green palette).
     * Should be called once after Chart.js is loaded.
     */
    init() {
      try {
        if (typeof Chart === 'undefined') {
          console.error('[EcoTrack.Charts] Chart.js is not loaded. Skipping init.');
          return;
        }

        // Typography
        Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
        Chart.defaults.font.size = 12;

        // Dark theme axis / grid colours
        Chart.defaults.color = '#94A3B8';         // slate-400
        Chart.defaults.borderColor = '#334155';    // slate-700

        // Legend styling — use dot-style point markers
        Chart.defaults.plugins.legend.labels.usePointStyle = true;

        // Tooltip styling — match dark card aesthetic
        Chart.defaults.plugins.tooltip.backgroundColor  = '#1E293B';   // slate-800
        Chart.defaults.plugins.tooltip.borderColor       = '#475569';   // slate-600
        Chart.defaults.plugins.tooltip.borderWidth        = 1;
        Chart.defaults.plugins.tooltip.cornerRadius       = 8;
        Chart.defaults.plugins.tooltip.padding            = 12;
        Chart.defaults.plugins.tooltip.titleFont          = { weight: '600' };
        Chart.defaults.plugins.tooltip.bodyFont           = { size: 13 };

        // Responsiveness
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;

        console.log('[EcoTrack.Charts] Initialised with dark-theme defaults.');
      } catch (err) {
        console.error('[EcoTrack.Charts] init error:', err);
      }
    },

    /* ───── Donut Chart ───── */

    /**
     * Create a category-breakdown donut chart.
     *
     * @param {string} canvasId - Canvas element id.
     * @param {Object} data - Data keyed by category name.
     * @param {number} data.transport - kg CO₂ for transport.
     * @param {number} data.food      - kg CO₂ for food.
     * @param {number} data.energy    - kg CO₂ for energy.
     * @param {number} data.shopping  - kg CO₂ for shopping.
     * @param {number} data.digital   - kg CO₂ for digital.
     * @returns {Chart|null} The Chart.js instance, or null on failure.
     */
    createDonutChart(canvasId, data) {
      try {
        const ctx = _getCtx(canvasId);
        if (!ctx) return null;
        _destroyExisting(canvasId);

        const categories = Object.keys(CATEGORY_COLORS);
        const values = categories.map(c => (data[c] || 0));
        const totalCO2 = values.reduce((s, v) => s + v, 0).toFixed(1);

        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: categories.map(c => CATEGORY_LABELS[c]),
            datasets: [{
              data: values,
              backgroundColor: categories.map(c => CATEGORY_COLORS[c].solid),
              hoverBackgroundColor: categories.map(c => CATEGORY_COLORS[c].alpha),
              borderColor: '#0F172A',   // slate-900 gap between segments
              borderWidth: 3,
              hoverOffset: 8,
            }],
          },
          options: {
            cutout: '68%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 16,
                  color: '#CBD5E1',
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => this.formatTooltip(context),
                },
              },
            },
            animation: {
              animateRotate: true,
              duration: 800,
              easing: 'easeOutQuart',
            },
          },
          plugins: [
            // Centre text plugin — renders total CO₂ inside the donut hole
            {
              id: 'donutCenterText',
              afterDraw(chart) {
                const { width, height, ctx: c } = chart;
                c.save();
                // Large number
                c.font = "bold 22px 'Inter', sans-serif";
                c.fillStyle = '#F1F5F9';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText(`${totalCO2}`, width / 2, height / 2 - 10);
                // Sub-label
                c.font = "12px 'Inter', sans-serif";
                c.fillStyle = '#94A3B8';
                c.fillText('kg CO₂', width / 2, height / 2 + 14);
                c.restore();
              },
            },
          ],
        });

        _instances.set(canvasId, chart);
        return chart;
      } catch (err) {
        console.error('[EcoTrack.Charts] createDonutChart error:', err);
        return null;
      }
    },

    /* ───── Line Chart ───── */

    /**
     * Create a trend line chart (e.g. daily CO₂ over 30 days).
     *
     * @param {string} canvasId - Canvas element id.
     * @param {Object} data
     * @param {string[]} data.labels   - Date labels for x-axis.
     * @param {number[]} data.values   - kg CO₂ values.
     * @param {number}  [data.target]  - Optional daily target (shown as dashed line).
     * @returns {Chart|null}
     */
    createLineChart(canvasId, data) {
      try {
        const ctx = _getCtx(canvasId);
        if (!ctx) return null;
        _destroyExisting(canvasId);

        const gradient = _buildGradient(ctx, ACCENT_GREEN_ALPHA);

        const datasets = [
          {
            label: 'CO₂ (kg)',
            data: data.values,
            borderColor: ACCENT_GREEN,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,          // smooth curves
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: ACCENT_GREEN,
            pointBorderColor: '#0F172A',
            pointBorderWidth: 2,
            borderWidth: 2.5,
          },
        ];

        // Optional dashed target line
        if (typeof data.target === 'number') {
          datasets.push({
            label: 'Target',
            data: new Array(data.labels.length).fill(data.target),
            borderColor: '#F87171',          // red-400
            borderDash: [8, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          });
        }

        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.labels,
            datasets,
          },
          options: {
            scales: {
              x: {
                grid: { display: false },
                ticks: { maxRotation: 45, maxTicksLimit: 10 },
              },
              y: {
                beginAtZero: true,
                grid: { color: '#1E293B' },
                ticks: {
                  callback: (v) => `${v} kg`,
                },
              },
            },
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} kg CO₂`,
                },
              },
              legend: {
                labels: { padding: 12 },
              },
            },
            animation: {
              duration: 1000,
              easing: 'easeOutCubic',
            },
          },
        });

        _instances.set(canvasId, chart);
        return chart;
      } catch (err) {
        console.error('[EcoTrack.Charts] createLineChart error:', err);
        return null;
      }
    },

    /* ───── Stacked Bar Chart ───── */

    /**
     * Create a stacked bar chart colour-coded by category.
     *
     * @param {string} canvasId - Canvas element id.
     * @param {Object} data
     * @param {string[]} data.labels - Time period labels (e.g. week names).
     * @param {Object.<string, number[]>} data.series - Values per category.
     * @param {number} [data.average] - Optional average line overlay.
     * @returns {Chart|null}
     */
    createBarChart(canvasId, data) {
      try {
        const ctx = _getCtx(canvasId);
        if (!ctx) return null;
        _destroyExisting(canvasId);

        const categories = Object.keys(CATEGORY_COLORS);

        // Build one dataset per category
        const datasets = categories
          .filter(c => data.series && data.series[c])
          .map(c => ({
            label: CATEGORY_LABELS[c],
            data: data.series[c],
            backgroundColor: CATEGORY_COLORS[c].solid,
            hoverBackgroundColor: CATEGORY_COLORS[c].alpha,
            borderRadius: 4,
            borderSkipped: false,
          }));

        // Optional average annotation line
        if (typeof data.average === 'number') {
          datasets.push({
            label: 'Average',
            data: new Array(data.labels.length).fill(data.average),
            type: 'line',
            borderColor: '#F87171',
            borderDash: [6, 3],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            order: 0,           // draw on top
          });
        }

        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets,
          },
          options: {
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
              },
              y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: '#1E293B' },
                ticks: {
                  callback: (v) => `${v} kg`,
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => this.formatTooltip(context),
                },
              },
              legend: {
                position: 'bottom',
                labels: { padding: 14 },
              },
            },
            animation: {
              duration: 800,
              easing: 'easeOutQuart',
            },
          },
        });

        _instances.set(canvasId, chart);
        return chart;
      } catch (err) {
        console.error('[EcoTrack.Charts] createBarChart error:', err);
        return null;
      }
    },

    /* ───── Horizontal Comparison Bar ───── */

    /**
     * Create a horizontal comparison bar showing the user's value vs
     * country average vs Paris Agreement target.
     *
     * @param {string} canvasId    - Canvas element id.
     * @param {number} userValue   - User's CO₂ (kg or tonnes).
     * @param {number} averageValue - Country average.
     * @param {number} targetValue  - Paris target.
     * @returns {Chart|null}
     */
    createComparisonBar(canvasId, userValue, averageValue, targetValue) {
      try {
        const ctx = _getCtx(canvasId);
        if (!ctx) return null;
        _destroyExisting(canvasId);

        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['You', 'Country Avg', 'Paris Target'],
            datasets: [{
              data: [userValue, averageValue, targetValue],
              backgroundColor: [
                ACCENT_GREEN,                          // user (green)
                CATEGORY_COLORS.transport.solid,       // avg  (blue)
                '#F87171',                             // target (red-400)
              ],
              borderRadius: 6,
              barThickness: 28,
            }],
          },
          options: {
            indexAxis: 'y',           // horizontal bars
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: '#1E293B' },
                ticks: {
                  callback: (v) => `${v} kg`,
                },
              },
              y: {
                grid: { display: false },
                ticks: {
                  font: { size: 14, weight: '500' },
                },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.parsed.x.toFixed(2)} kg CO₂`,
                },
              },
            },
            animation: {
              duration: 900,
              easing: 'easeOutQuart',
            },
          },
        });

        _instances.set(canvasId, chart);
        return chart;
      } catch (err) {
        console.error('[EcoTrack.Charts] createComparisonBar error:', err);
        return null;
      }
    },

    /* ───── Chart Lifecycle ───── */

    /**
     * Update an existing chart with new data without full re-creation.
     *
     * @param {Chart} chart   - The Chart.js instance.
     * @param {Object} newData
     * @param {string[]} [newData.labels]   - Updated labels.
     * @param {Array<{data: number[]}>} [newData.datasets] - Updated dataset values.
     */
    updateChart(chart, newData) {
      try {
        if (!chart) return;

        if (newData.labels) {
          chart.data.labels = newData.labels;
        }

        if (newData.datasets) {
          newData.datasets.forEach((ds, i) => {
            if (chart.data.datasets[i]) {
              chart.data.datasets[i].data = ds.data;
            }
          });
        }

        chart.update('active');   // 'active' = animate only changed data
      } catch (err) {
        console.error('[EcoTrack.Charts] updateChart error:', err);
      }
    },

    /**
     * Destroy a chart instance and remove it from the internal registry.
     * @param {string} chartId - The canvas element id used when creating the chart.
     */
    destroyChart(chartId) {
      try {
        if (_instances.has(chartId)) {
          _instances.get(chartId).destroy();
          _instances.delete(chartId);
        }
      } catch (err) {
        console.error('[EcoTrack.Charts] destroyChart error:', err);
      }
    },

    /**
     * Destroy ALL chart instances. Useful on page navigation.
     */
    destroyAll() {
      _instances.forEach((chart, id) => {
        try { chart.destroy(); } catch (_) { /* swallow */ }
      });
      _instances.clear();
    },

    /* ───── Utility ───── */

    /**
     * Return the consistent category colour palette.
     * @returns {Object.<string, {solid: string, alpha: string}>}
     */
    getChartColors() {
      return { ...CATEGORY_COLORS };
    },

    /**
     * Custom tooltip label formatter.
     * Shows "Category: X.XX kg CO₂ (YY%)" for donut / bar charts.
     *
     * @param {Object} context - Chart.js tooltip context item.
     * @returns {string}
     */
    formatTooltip(context) {
      try {
        const label = context.label || context.dataset.label || '';
        const value = (context.parsed.y ?? context.parsed ?? context.raw ?? 0);
        const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

        // If the chart has a meta total (donut) compute percentage
        if (context.chart && context.chart.config.type === 'doughnut') {
          const total = context.dataset.data.reduce((s, v) => s + v, 0);
          const pct = total > 0 ? ((numericValue / total) * 100).toFixed(1) : 0;
          return `${label}: ${numericValue.toFixed(2)} kg CO₂ (${pct}%)`;
        }

        return `${label}: ${numericValue.toFixed(2)} kg CO₂`;
      } catch (_) {
        return '';
      }
    },

    /**
     * Get a reference to a live chart instance by canvas id.
     * @param {string} canvasId
     * @returns {Chart|undefined}
     */
    getInstance(canvasId) {
      return _instances.get(canvasId);
    },
  };

})(typeof window !== 'undefined' ? window : globalThis);
