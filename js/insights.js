/**
 * EcoTrack — Insights & Recommendation Engine
 *
 * Analyses the user's activity data and generates personalised,
 * context-aware recommendations ranked by CO₂ impact.
 * This is the "smart AI" brain of EcoTrack.
 *
 * Depends on: EcoTrack.Utils, EcoTrack.Store, EcoTrack.Calculator
 *
 * @namespace EcoTrack.Insights
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.Insights = (() => {
  'use strict';

  // ─── Recommendation Templates ────────────────────────────────────────
  const RECOMMENDATIONS = [
    // Transport
    { id: 'carpool', category: 'transport', title: 'Try Carpooling', description: 'Share rides with colleagues 2 days a week and cut your commute emissions in half on those days.', impactKg: 180, difficulty: 'easy', icon: '🚗', condition: (d) => getActivityTotal(d, 'transport', 'car_petrol') > 50 || getActivityTotal(d, 'transport', 'car_diesel') > 50 },
    { id: 'bike-commute', category: 'transport', title: 'Bike to Work', description: 'Swap your car commute for cycling even once a week. Great for health and the planet!', impactKg: 250, difficulty: 'medium', icon: '🚲', condition: (d) => getActivityTotal(d, 'transport', 'car_petrol') > 30 },
    { id: 'public-transit', category: 'transport', title: 'Switch to Public Transit', description: 'Buses and trains emit 60-80% less CO₂ per passenger-km than driving alone.', impactKg: 400, difficulty: 'medium', icon: '🚌', condition: (d) => getCategoryTotal(d, 'transport') > 100 },
    { id: 'ev-switch', category: 'transport', title: 'Consider an Electric Vehicle', description: 'EVs produce 50-70% fewer emissions than petrol cars, even accounting for electricity generation.', impactKg: 1200, difficulty: 'hard', icon: '⚡', condition: (d) => getActivityTotal(d, 'transport', 'car_petrol') > 200 },
    { id: 'reduce-flights', category: 'transport', title: 'Reduce Air Travel', description: 'One fewer round-trip flight can save more CO₂ than months of other changes.', impactKg: 800, difficulty: 'medium', icon: '✈️', condition: (d) => getActivityTotal(d, 'transport', 'flight_domestic') > 0 || getActivityTotal(d, 'transport', 'flight_international') > 0 },
    { id: 'walk-short', category: 'transport', title: 'Walk Short Distances', description: 'For trips under 2km, walking is faster than finding parking and produces zero emissions.', impactKg: 50, difficulty: 'easy', icon: '🚶', condition: () => true },

    // Food
    { id: 'meatless-day', category: 'food', title: 'One Meatless Day Per Week', description: 'Replacing one meat meal per week with a plant-based alternative saves significant emissions.', impactKg: 150, difficulty: 'easy', icon: '🥗', condition: (d) => getActivityTotal(d, 'food', 'high_meat_meal') > 0 || getActivityTotal(d, 'food', 'average_meal') > 5 },
    { id: 'reduce-beef', category: 'food', title: 'Reduce Beef Consumption', description: 'Beef has 5x the carbon footprint of chicken. Swapping beef for poultry makes a big difference.', impactKg: 300, difficulty: 'medium', icon: '🥩', condition: (d) => getActivityTotal(d, 'food', 'beef') > 0 || getActivityTotal(d, 'food', 'high_meat_meal') > 3 },
    { id: 'local-food', category: 'food', title: 'Buy Local & Seasonal', description: 'Locally grown, seasonal produce has a much lower transport footprint.', impactKg: 100, difficulty: 'easy', icon: '🌾', condition: () => true },
    { id: 'reduce-waste', category: 'food', title: 'Reduce Food Waste', description: 'The average household wastes 30% of food. Plan meals and use leftovers creatively.', impactKg: 200, difficulty: 'easy', icon: '🗑️', condition: () => true },
    { id: 'plant-based', category: 'food', title: 'Try Plant-Based Meals', description: 'Vegan meals produce 70% fewer emissions than meat-heavy meals on average.', impactKg: 350, difficulty: 'medium', icon: '🌱', condition: (d) => getCategoryTotal(d, 'food') > 50 },
    { id: 'less-coffee', category: 'food', title: 'Reduce Coffee Intake', description: 'Each cup of coffee produces 0.21 kg CO₂. Cutting one cup per day saves 77 kg/year.', impactKg: 77, difficulty: 'easy', icon: '☕', condition: (d) => getActivityTotal(d, 'food', 'coffee') > 5 },

    // Energy
    { id: 'led-bulbs', category: 'energy', title: 'Switch to LED Bulbs', description: 'LEDs use 75% less energy and last 25x longer than incandescent bulbs.', impactKg: 100, difficulty: 'easy', icon: '💡', condition: () => true },
    { id: 'thermostat', category: 'energy', title: 'Adjust Your Thermostat', description: 'Lowering heating by 1°C saves about 300 kg CO₂/year. Wear a sweater!', impactKg: 300, difficulty: 'easy', icon: '🌡️', condition: (d) => getActivityTotal(d, 'energy', 'heater_hour') > 5 },
    { id: 'cold-wash', category: 'energy', title: 'Wash Clothes in Cold Water', description: '90% of washing machine energy goes to heating water. Cold wash cleans just as well.', impactKg: 150, difficulty: 'easy', icon: '👕', condition: (d) => getActivityTotal(d, 'energy', 'washing_machine') > 2 },
    { id: 'shorter-shower', category: 'energy', title: 'Shorter Showers', description: 'Cutting shower time from 10 to 5 minutes halves your water heating emissions.', impactKg: 100, difficulty: 'easy', icon: '🚿', condition: (d) => getActivityTotal(d, 'energy', 'shower_5min') > 5 },
    { id: 'unplug', category: 'energy', title: 'Unplug Phantom Loads', description: 'Electronics on standby waste 5-10% of household electricity. Unplug or use power strips.', impactKg: 50, difficulty: 'easy', icon: '🔌', condition: () => true },
    { id: 'solar', category: 'energy', title: 'Consider Solar Panels', description: 'Rooftop solar can reduce your electricity emissions by 80-100%.', impactKg: 1500, difficulty: 'hard', icon: '☀️', condition: (d) => getCategoryTotal(d, 'energy') > 200 },
    { id: 'air-dry', category: 'energy', title: 'Air Dry Clothes', description: 'Skip the dryer and air dry. Each dryer load produces 2.4 kg CO₂.', impactKg: 120, difficulty: 'easy', icon: '🌬️', condition: (d) => getActivityTotal(d, 'energy', 'dryer') > 1 },
    { id: 'ac-optimize', category: 'energy', title: 'Optimize AC Usage', description: 'Setting AC to 25°C instead of 22°C saves ~30% energy. Use fans to supplement.', impactKg: 200, difficulty: 'easy', icon: '❄️', condition: (d) => getActivityTotal(d, 'energy', 'ac_hour') > 5 },

    // Shopping
    { id: 'buy-less', category: 'shopping', title: 'Buy Less, Choose Well', description: 'Each new clothing item produces ~10 kg CO₂. Buy quality over quantity.', impactKg: 200, difficulty: 'medium', icon: '🛍️', condition: (d) => getActivityTotal(d, 'shopping', 'clothing_item') > 1 },
    { id: 'secondhand', category: 'shopping', title: 'Buy Secondhand', description: 'Thrift stores and online marketplaces give items a second life with zero manufacturing emissions.', impactKg: 150, difficulty: 'easy', icon: '♻️', condition: () => true },
    { id: 'reusable-bags', category: 'shopping', title: 'Use Reusable Bags', description: 'A reusable bag replaces 500+ plastic bags over its lifetime.', impactKg: 15, difficulty: 'easy', icon: '👜', condition: (d) => getActivityTotal(d, 'shopping', 'plastic_bag') > 2 },
    { id: 'batch-orders', category: 'shopping', title: 'Batch Online Orders', description: 'Combining online orders reduces packaging and delivery emissions by up to 30%.', impactKg: 30, difficulty: 'easy', icon: '📦', condition: (d) => getActivityTotal(d, 'shopping', 'online_order') > 3 },

    // Digital
    { id: 'reduce-streaming', category: 'digital', title: 'Lower Streaming Quality', description: 'Streaming in SD instead of HD uses 4x less energy. You won\'t notice on small screens.', impactKg: 25, difficulty: 'easy', icon: '📺', condition: (d) => getActivityTotal(d, 'digital', 'video_streaming') > 10 },
    { id: 'digital-cleanup', category: 'digital', title: 'Clean Up Cloud Storage', description: 'Delete unused files and emails. Data centres use energy to store your forgotten photos.', impactKg: 10, difficulty: 'easy', icon: '🧹', condition: () => true },
    { id: 'screen-time', category: 'digital', title: 'Reduce Screen Time', description: 'Less screen time means less energy use and better wellbeing. Win-win!', impactKg: 20, difficulty: 'medium', icon: '📱', condition: (d) => getCategoryTotal(d, 'digital') > 5 }
  ];

  // ─── Seasonal Tips ───────────────────────────────────────────────────
  const SEASONAL_TIPS = {
    winter: [
      { title: 'Layer Up Instead of Heating', description: 'Wearing a warm sweater lets you lower the thermostat by 2°C.', icon: '🧣', impactKg: 200 },
      { title: 'Seal Window Drafts', description: 'Draft-proofing can reduce heating bills by 10-15%.', icon: '🪟', impactKg: 150 },
      { title: 'Use a Hot Water Bottle', description: 'An old-fashioned hot water bottle at night means less heating.', icon: '🫖', impactKg: 50 }
    ],
    spring: [
      { title: 'Start a Garden', description: 'Growing herbs and vegetables cuts food transport emissions to zero.', icon: '🌱', impactKg: 30 },
      { title: 'Bike Season!', description: 'Spring weather is perfect for cycling. Leave the car at home.', icon: '🚲', impactKg: 100 },
      { title: 'Spring Cleaning = Declutter', description: 'Donate unused items instead of buying new ones.', icon: '🧹', impactKg: 50 }
    ],
    summer: [
      { title: 'Optimize Your AC', description: 'Set AC to 25°C and use fans. Every degree cooler uses 8% more energy.', icon: '❄️', impactKg: 200 },
      { title: 'Air Dry Everything', description: 'Skip the dryer — summer sun and breeze dry clothes for free.', icon: '☀️', impactKg: 120 },
      { title: 'Staycation Over Flying', description: 'Explore locally instead of flying. Your wallet and the planet will thank you.', icon: '🏖️', impactKg: 800 }
    ],
    autumn: [
      { title: 'Prepare for Winter', description: 'Insulate your home now to save energy all winter.', icon: '🏠', impactKg: 300 },
      { title: 'Eat Seasonal Produce', description: 'Autumn harvest means local pumpkins, apples, and root vegetables.', icon: '🎃', impactKg: 50 },
      { title: 'Compost Fallen Leaves', description: 'Turn autumn leaves into nutrient-rich compost instead of sending to landfill.', icon: '🍂', impactKg: 20 }
    ]
  };

  // ─── Contextual Tips ─────────────────────────────────────────────────
  const TIME_TIPS = {
    morning: [
      'Consider biking to work today! 🚲',
      'Pack a homemade lunch to avoid packaging waste 🥗',
      'Turn off lights as you leave each room 💡'
    ],
    afternoon: [
      'Take a walking meeting instead of sitting in a conference room 🚶',
      'Use a reusable water bottle instead of buying plastic 💧',
      'Turn off your monitor during lunch break 🖥️'
    ],
    evening: [
      'Skip the dryer tonight — hang clothes to dry 👕',
      'Try a plant-based dinner recipe tonight 🌱',
      'Unplug chargers and electronics before bed 🔌'
    ]
  };

  let cachedInsights = [];

  // ─── Helper Functions ────────────────────────────────────────────────

  function getActivityTotal(activities, category, type) {
    return activities
      .filter(a => a.category === category && (!type || a.type === type))
      .reduce((sum, a) => sum + (a.co2 || 0), 0);
  }

  function getCategoryTotal(activities, category) {
    return activities
      .filter(a => a.category === category)
      .reduce((sum, a) => sum + (a.co2 || 0), 0);
  }

  function getSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4)  return 'spring';
    if (month >= 5 && month <= 7)  return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  // ─── Core Functions ──────────────────────────────────────────────────

  function init() {
    generateInsights();
  }

  /**
   * Analyse user data and generate personalised recommendations.
   * @returns {Array<Object>} Generated insights sorted by impact.
   */
  function generateInsights() {
    const activities = EcoTrack.Store.getActivities();
    const dismissed = EcoTrack.Store.get('dismissedInsights') || [];
    const completed = EcoTrack.Store.get('completedInsights') || [];

    const insights = RECOMMENDATIONS
      .filter(rec => {
        // Skip dismissed / completed insights
        if (dismissed.includes(rec.id) || completed.includes(rec.id)) return false;
        // Evaluate condition with user data
        try { return rec.condition(activities); } catch { return false; }
      })
      .map(rec => ({
        ...rec,
        status: 'new',
        generatedAt: new Date().toISOString()
      }))
      .sort((a, b) => b.impactKg - a.impactKg);

    cachedInsights = insights;
    return insights;
  }

  /**
   * Get top N recommendations sorted by impact.
   */
  function getTopRecommendations(count = 5) {
    if (cachedInsights.length === 0) generateInsights();
    return cachedInsights.slice(0, count);
  }

  /**
   * Analyse patterns in user data.
   */
  function analyzePatterns() {
    const activities = EcoTrack.Store.getActivities();
    const stats = EcoTrack.Store.getStats();
    const breakdown = EcoTrack.Calculator.getCategoryBreakdown(activities);

    // Find highest category
    let highestCategory = 'transport';
    let highestKg = 0;
    for (const [cat, data] of Object.entries(breakdown)) {
      if (data.kg > highestKg) {
        highestKg = data.kg;
        highestCategory = cat;
      }
    }

    // Find most frequent activity type
    const typeCounts = {};
    activities.forEach(a => {
      const key = `${a.category}:${a.type}`;
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    });
    const mostFrequent = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      highestCategory,
      highestCategoryKg: highestKg,
      breakdown,
      mostFrequentActivity: mostFrequent ? mostFrequent[0] : null,
      totalActivities: activities.length,
      avgDailyKg: stats.avgDaily,
      trend: stats.week > stats.avgDaily * 7 ? 'increasing' : 'decreasing'
    };
  }

  /**
   * Generate a weekly report.
   */
  function getWeeklyReport() {
    const stats = EcoTrack.Store.getStats();
    const goals = EcoTrack.Store.get('goals') || { weekly: 70 };
    const profile = EcoTrack.Store.getUserProfile();
    const patterns = analyzePatterns();

    const percentOfGoal = goals.weekly > 0 ? Math.round((stats.week / goals.weekly) * 100) : 0;
    const onTrack = percentOfGoal <= 100;

    return {
      weekTotal: stats.week,
      weekGoal: goals.weekly,
      percentOfGoal,
      onTrack,
      avgDaily: stats.avgDaily,
      highestCategory: patterns.highestCategory,
      streak: stats.streak.current,
      totalLogs: stats.totalLogs,
      summary: onTrack
        ? `Great job, ${profile.name || 'Explorer'}! You're at ${percentOfGoal}% of your weekly goal. Keep it up! 🎉`
        : `You're at ${percentOfGoal}% of your weekly goal. Focus on reducing ${patterns.highestCategory} emissions this week. 💪`
    };
  }

  /**
   * Get advice for a specific category.
   */
  function getCategoryAdvice(category) {
    if (cachedInsights.length === 0) generateInsights();
    return cachedInsights.filter(i => i.category === category);
  }

  /**
   * Get seasonal tips.
   */
  function getSeasonalTips() {
    const season = getSeason();
    return SEASONAL_TIPS[season] || SEASONAL_TIPS.winter;
  }

  /**
   * Get a random contextual tip based on time of day.
   */
  function getContextualTip() {
    const time = getTimeOfDay();
    const tips = TIME_TIPS[time] || TIME_TIPS.morning;
    return EcoTrack.Utils.getRandomItem(tips);
  }

  /**
   * Dismiss an insight so it won't be shown again.
   */
  function dismissInsight(insightId) {
    const dismissed = EcoTrack.Store.get('dismissedInsights') || [];
    if (!dismissed.includes(insightId)) {
      dismissed.push(insightId);
      EcoTrack.Store.set('dismissedInsights', dismissed);
    }
    cachedInsights = cachedInsights.filter(i => i.id !== insightId);
  }

  /**
   * Mark an insight as completed.
   */
  function completeInsight(insightId) {
    const completed = EcoTrack.Store.get('completedInsights') || [];
    if (!completed.includes(insightId)) {
      completed.push(insightId);
      EcoTrack.Store.set('completedInsights', completed);
      EcoTrack.Challenges?.awardXP?.(25);
      EcoTrack.Utils.showToast('Insight completed! +25 XP 🎉', 'success');
    }
    cachedInsights = cachedInsights.filter(i => i.id !== insightId);
  }

  // ─── Rendering ───────────────────────────────────────────────────────

  /**
   * Render insights panel for the dashboard (compact, top 3).
   */
  function renderInsightsPanel() {
    const top = getTopRecommendations(3);
    if (top.length === 0) {
      return `
        <div class="empty-state" style="padding: var(--space-6);">
          <span style="font-size:2rem;">🎉</span>
          <p style="color:var(--eco-text-secondary); margin-top:var(--space-2);">
            You're doing great! No new recommendations right now.
          </p>
        </div>`;
    }

    return top.map((insight, i) => `
      <div class="activity-feed-item animate-fade-in stagger-${i + 1}" data-insight-id="${insight.id}">
        <div class="activity-feed-icon">${insight.icon}</div>
        <div class="activity-feed-info">
          <div class="activity-feed-name">${EcoTrack.Utils.sanitizeInput(insight.title)}</div>
          <div class="activity-feed-meta">Save ~${EcoTrack.Utils.formatNumber(insight.impactKg)} kg CO₂/year</div>
        </div>
        <span class="insight-difficulty ${insight.difficulty}">${insight.difficulty}</span>
      </div>
    `).join('');
  }

  /**
   * Render the full insights page.
   */
  function renderDetailedInsights() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    generateInsights(); // Refresh
    const insights = cachedInsights;
    const seasonal = getSeasonalTips();
    const report = getWeeklyReport();
    const tip = getContextualTip();

    mainContent.innerHTML = `
      <div class="page-container animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">💡 Insights</h1>
            <p class="page-subtitle">Personalised recommendations to reduce your footprint</p>
          </div>
        </div>

        <!-- Weekly Report Card -->
        <div class="card animate-fade-in stagger-1" style="margin-bottom:var(--space-6);">
          <div class="card-header"><h2>📊 Weekly Report</h2></div>
          <div class="card-body">
            <p style="color:var(--eco-text-secondary);line-height:1.6;">
              ${EcoTrack.Utils.sanitizeInput(report.summary)}
            </p>
            <div class="dashboard-grid" style="margin-top:var(--space-4);">
              <div class="stat-card">
                <div class="stat-card-value">${EcoTrack.Utils.formatNumber(report.weekTotal, 1)}</div>
                <div class="stat-card-label">kg CO₂ this week</div>
              </div>
              <div class="stat-card">
                <div class="stat-card-value">${report.percentOfGoal}%</div>
                <div class="stat-card-label">of weekly goal</div>
              </div>
              <div class="stat-card">
                <div class="stat-card-value">🔥 ${report.streak}</div>
                <div class="stat-card-label">day streak</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contextual Tip -->
        <div class="card animate-fade-in stagger-2" style="margin-bottom:var(--space-6); border-left:3px solid var(--eco-primary);">
          <div class="card-body" style="display:flex;align-items:center;gap:var(--space-3);">
            <span style="font-size:1.5rem;">💡</span>
            <p style="color:var(--eco-text);margin:0;">${EcoTrack.Utils.sanitizeInput(tip)}</p>
          </div>
        </div>

        <!-- Personalised Recommendations -->
        <h2 style="color:var(--eco-text);margin-bottom:var(--space-4);">🎯 Personalised Recommendations</h2>
        ${insights.length > 0 ? `
          <div class="insights-grid" style="margin-bottom:var(--space-6);">
            ${insights.map((insight, i) => `
              <div class="insight-card animate-fade-in stagger-${Math.min(i + 3, 10)}" data-insight-id="${insight.id}">
                <div class="insight-card-header">
                  <div class="insight-card-icon">${insight.icon}</div>
                  <div>
                    <div class="insight-card-title">${EcoTrack.Utils.sanitizeInput(insight.title)}</div>
                    <div class="insight-card-category">${EcoTrack.Utils.getCategoryIcon(insight.category)} ${insight.category}</div>
                  </div>
                </div>
                <div class="insight-card-body">${EcoTrack.Utils.sanitizeInput(insight.description)}</div>
                <div class="insight-card-impact">
                  <span class="insight-impact-value">Save ~${EcoTrack.Utils.formatNumber(insight.impactKg)} kg CO₂/year</span>
                  <span class="insight-difficulty ${insight.difficulty}">${insight.difficulty}</span>
                </div>
                <div class="insight-actions">
                  <button class="btn btn-sm btn-primary" onclick="EcoTrack.Insights.completeInsight('${insight.id}')" aria-label="Mark ${EcoTrack.Utils.sanitizeInput(insight.title)} as completed">
                    ✅ Done
                  </button>
                  <button class="btn btn-sm btn-ghost" onclick="EcoTrack.Insights.dismissInsight('${insight.id}')" aria-label="Dismiss ${EcoTrack.Utils.sanitizeInput(insight.title)}">
                    Dismiss
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state" style="padding:var(--space-8);text-align:center;">
            <span style="font-size:3rem;">🎉</span>
            <h3 style="color:var(--eco-text);margin-top:var(--space-3);">All Caught Up!</h3>
            <p style="color:var(--eco-text-secondary);">You've reviewed all recommendations. Log more activities to get new ones!</p>
          </div>
        `}

        <!-- Seasonal Tips -->
        <h2 style="color:var(--eco-text);margin-bottom:var(--space-4);">🌿 Seasonal Tips — ${getSeason().charAt(0).toUpperCase() + getSeason().slice(1)}</h2>
        <div class="insights-grid">
          ${seasonal.map((tip, i) => `
            <div class="insight-card animate-fade-in stagger-${i + 1}">
              <div class="insight-card-header">
                <div class="insight-card-icon">${tip.icon}</div>
                <div class="insight-card-title">${EcoTrack.Utils.sanitizeInput(tip.title)}</div>
              </div>
              <div class="insight-card-body">${EcoTrack.Utils.sanitizeInput(tip.description)}</div>
              <div class="insight-card-impact">
                <span class="insight-impact-value">Save ~${EcoTrack.Utils.formatNumber(tip.impactKg)} kg CO₂/year</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ─── Public API ──────────────────────────────────────────────────────
  return {
    init,
    generateInsights,
    getTopRecommendations,
    analyzePatterns,
    getWeeklyReport,
    getCategoryAdvice,
    getSeasonalTips,
    getContextualTip,
    dismissInsight,
    completeInsight,
    renderInsightsPanel,
    renderDetailedInsights
  };
})();
