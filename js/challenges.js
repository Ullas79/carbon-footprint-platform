/**
 * EcoTrack — Challenges & Gamification Module
 *
 * Manages eco-challenges, achievement badges, XP/level system,
 * and celebration animations. Drives user engagement through
 * gamification.
 *
 * Depends on: EcoTrack.Utils, EcoTrack.Store
 *
 * @namespace EcoTrack.Challenges
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.Challenges = (() => {
  'use strict';

  // ─── Challenge Definitions ───────────────────────────────────────────
  const CHALLENGES = [
    { id: 'meatless-monday', name: 'Meatless Monday', description: 'Go meat-free every Monday for a month', category: 'food', duration: 28, target: 4, xp: 200, icon: '🥗' },
    { id: 'bike-week', name: 'Bike Week', description: 'Cycle to work for 5 consecutive days', category: 'transport', duration: 7, target: 5, xp: 300, icon: '🚴' },
    { id: 'power-down', name: 'Power Down Hour', description: 'Turn off all electronics for 1 hour daily for a week', category: 'energy', duration: 7, target: 7, xp: 150, icon: '🔌' },
    { id: 'zero-waste-week', name: 'Zero Waste Week', description: 'Produce zero non-recyclable waste for a week', category: 'shopping', duration: 7, target: 7, xp: 250, icon: '♻️' },
    { id: 'digital-detox', name: 'Digital Detox', description: 'Reduce screen time to under 2 hours for 3 days', category: 'digital', duration: 7, target: 3, xp: 100, icon: '📵' },
    { id: 'cold-shower', name: 'Cold Shower Challenge', description: 'Take cold showers for a week', category: 'energy', duration: 7, target: 7, xp: 200, icon: '🚿' },
    { id: 'local-food', name: 'Eat Local', description: 'Source all meals from local producers for a week', category: 'food', duration: 7, target: 21, xp: 250, icon: '🌾' },
    { id: 'public-transit', name: 'Transit Champion', description: 'Use only public transit for 2 weeks', category: 'transport', duration: 14, target: 10, xp: 350, icon: '🚇' },
    { id: 'tree-planter', name: 'Tree Planter', description: 'Plant or sponsor a tree', category: 'general', duration: 30, target: 1, xp: 500, icon: '🌳' },
    { id: 'eco-educator', name: 'Eco Educator', description: 'Share 5 eco tips with friends or family', category: 'general', duration: 14, target: 5, xp: 200, icon: '📚' },
    { id: 'water-saver', name: 'Water Saver', description: 'Reduce shower time to under 5 minutes for a week', category: 'energy', duration: 7, target: 7, xp: 150, icon: '💧' },
    { id: 'no-plastic', name: 'Plastic Free', description: 'Avoid single-use plastics for 2 weeks', category: 'shopping', duration: 14, target: 14, xp: 300, icon: '🚫' }
  ];

  // ─── Badge Definitions ───────────────────────────────────────────────
  const BADGES = [
    { id: 'first-log', name: 'First Step', description: 'Log your first activity', icon: '🌱' },
    { id: 'five-logs', name: 'Getting Started', description: 'Log 5 activities', icon: '📋' },
    { id: 'ten-logs', name: 'Active Tracker', description: 'Log 10 activities', icon: '📊' },
    { id: 'fifty-logs', name: 'Dedicated', description: 'Log 50 activities', icon: '🎯' },
    { id: 'century', name: 'Century Club', description: 'Log 100 activities', icon: '💯' },
    { id: 'week-streak', name: 'Week Warrior', description: '7-day logging streak', icon: '🔥' },
    { id: 'two-week-streak', name: 'Fortnight Focus', description: '14-day logging streak', icon: '⚡' },
    { id: 'month-streak', name: 'Monthly Master', description: '30-day logging streak', icon: '⭐' },
    { id: 'green-commuter', name: 'Green Commuter', description: 'Log 10 bike or walk trips', icon: '🚲' },
    { id: 'transit-rider', name: 'Transit Rider', description: 'Log 10 public transit trips', icon: '🚌' },
    { id: 'veggie-lover', name: 'Veggie Lover', description: 'Log 20 vegetarian or vegan meals', icon: '🥬' },
    { id: 'plant-pioneer', name: 'Plant Pioneer', description: 'Log 50 vegan meals', icon: '🌿' },
    { id: 'energy-saver', name: 'Energy Saver', description: 'Log 10 energy-saving activities', icon: '💡' },
    { id: 'eco-shopper', name: 'Eco Shopper', description: 'Go 7 days without logging new purchases', icon: '🛒' },
    { id: 'digital-minimalist', name: 'Digital Minimalist', description: 'Log under 2 hrs digital for 5 days', icon: '📱' },
    { id: 'first-challenge', name: 'Challenger', description: 'Complete your first challenge', icon: '🏅' },
    { id: 'five-challenges', name: 'Challenge Champion', description: 'Complete 5 challenges', icon: '🏆' },
    { id: 'carbon-cutter-10', name: 'Carbon Cutter', description: 'Reduce daily average by 10%', icon: '✂️' },
    { id: 'carbon-hero', name: 'Carbon Hero', description: 'Keep daily average under 10 kg for a week', icon: '🦸' },
    { id: 'tree-equivalent', name: 'Tree Hugger', description: 'Save 22 kg CO₂ (one tree\'s yearly absorption)', icon: '🌲' },
    { id: 'forest-maker', name: 'Forest Maker', description: 'Save 220 kg CO₂ (10 trees equivalent)', icon: '🌳' },
    { id: 'level-3', name: 'Growing Tree', description: 'Reach Level 3', icon: '🌴' },
    { id: 'level-5', name: 'Nature Guardian', description: 'Reach Level 5', icon: '🛡️' },
    { id: 'level-7', name: 'Climate Champion', description: 'Reach Level 7', icon: '🏅' },
    { id: 'level-10', name: 'Eco Legend', description: 'Reach Level 10', icon: '👑' },
    { id: 'all-categories', name: 'Well Rounded', description: 'Log activities in all 5 categories', icon: '🎪' },
    { id: 'weekend-logger', name: 'Weekend Warrior', description: 'Log on both Saturday and Sunday', icon: '📅' },
    { id: 'early-bird', name: 'Early Bird', description: 'Log an activity before 8 AM', icon: '🐦' },
    { id: 'night-owl', name: 'Night Owl', description: 'Log an activity after 10 PM', icon: '🦉' },
    { id: 'data-exporter', name: 'Data Keeper', description: 'Export your data', icon: '💾' },
    { id: 'zero-emission-day', name: 'Zero Day', description: 'Have a day with only zero-emission activities', icon: '🌍' }
  ];

  // ─── Level System ────────────────────────────────────────────────────
  const LEVELS = [
    { level: 1, title: 'Eco Seedling', minXP: 0, icon: '🌱' },
    { level: 2, title: 'Green Sprout', minXP: 100, icon: '🌿' },
    { level: 3, title: 'Growing Tree', minXP: 300, icon: '🌴' },
    { level: 4, title: 'Forest Guide', minXP: 600, icon: '🧭' },
    { level: 5, title: 'Nature Guardian', minXP: 1000, icon: '🛡️' },
    { level: 6, title: 'Earth Protector', minXP: 1500, icon: '🌏' },
    { level: 7, title: 'Climate Champion', minXP: 2100, icon: '🏆' },
    { level: 8, title: 'Eco Leader', minXP: 2800, icon: '👥' },
    { level: 9, title: 'Planet Hero', minXP: 3600, icon: '🦸' },
    { level: 10, title: 'Eco Legend', minXP: 4500, icon: '👑' }
  ];

  // ─── Initialization ──────────────────────────────────────────────────

  function init() {
    checkBadges();
  }

  // ─── Challenge Management ────────────────────────────────────────────

  function getActiveChallenges() {
    const stored = EcoTrack.Store.getChallenges();
    return stored.filter(c => c.status === 'active');
  }

  function getCompletedChallenges() {
    const stored = EcoTrack.Store.getChallenges();
    return stored.filter(c => c.status === 'completed');
  }

  function getAvailableChallenges() {
    const stored = EcoTrack.Store.getChallenges();
    const activeIds = stored.filter(c => c.status === 'active').map(c => c.id);
    return CHALLENGES.filter(c => !activeIds.includes(c.id));
  }

  function joinChallenge(challengeId) {
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return;

    const data = EcoTrack.Store._readAll ? EcoTrack.Store.get('challenges') || [] : EcoTrack.Store.getChallenges();
    
    // Check if already active
    if (data.some(c => c.id === challengeId && c.status === 'active')) {
      EcoTrack.Utils.showToast('Already participating in this challenge!', 'warning');
      return;
    }

    const record = {
      id: challengeId,
      name: challenge.name,
      icon: challenge.icon,
      xp: challenge.xp,
      target: challenge.target,
      progress: 0,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + challenge.duration * 86400000).toISOString()
    };

    data.push(record);
    EcoTrack.Store.set('challenges', data);
    awardXP(10); // XP for joining
    EcoTrack.Utils.showToast(`Joined "${challenge.name}"! ${challenge.icon}`, 'success');
  }

  function updateChallengeProgress(challengeId, increment = 1) {
    const challenges = EcoTrack.Store.getChallenges();
    const idx = challenges.findIndex(c => c.id === challengeId && c.status === 'active');
    if (idx === -1) return;

    challenges[idx].progress = Math.min(
      challenges[idx].progress + increment,
      challenges[idx].target
    );

    if (challenges[idx].progress >= challenges[idx].target) {
      challenges[idx].status = 'completed';
      challenges[idx].completedDate = new Date().toISOString();
      awardXP(challenges[idx].xp);
      showCelebration('challenge', challenges[idx]);
      checkBadges();
    }

    EcoTrack.Store.set('challenges', challenges);
  }

  // ─── XP & Level System ───────────────────────────────────────────────

  function awardXP(amount) {
    if (!amount || amount <= 0) return;

    const profile = EcoTrack.Store.getUserProfile();
    const oldLevel = getLevelInfo(profile.xp || 0);
    profile.xp = (profile.xp || 0) + amount;
    const newLevel = getLevelInfo(profile.xp);

    if (newLevel.level > oldLevel.level) {
      profile.level = newLevel.level;
      EcoTrack.Store.setUserProfile(profile);
      showCelebration('levelup', newLevel);
      checkBadges();
    } else {
      profile.level = newLevel.level;
      EcoTrack.Store.setUserProfile(profile);
    }
  }

  function getLevelInfo(xp) {
    let current = LEVELS[0];
    for (const level of LEVELS) {
      if (xp >= level.minXP) current = level;
      else break;
    }

    const nextLevel = LEVELS.find(l => l.level === current.level + 1);
    const nextXP = nextLevel ? nextLevel.minXP : current.minXP;
    const progressXP = xp - current.minXP;
    const neededXP = nextXP - current.minXP;
    const progressPercent = neededXP > 0 ? Math.min(Math.round((progressXP / neededXP) * 100), 100) : 100;

    return { ...current, xp, nextXP, progressXP, neededXP, progressPercent };
  }

  // ─── Badge System ────────────────────────────────────────────────────

  function checkBadges() {
    const activities = EcoTrack.Store.getActivities();
    const profile = EcoTrack.Store.getUserProfile();
    const streak = EcoTrack.Store.getStreak();
    const challenges = EcoTrack.Store.getChallenges();
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;

    // Count specific activity types
    const greenTrips = activities.filter(a =>
      a.category === 'transport' && ['bicycle', 'walking', 'ebike'].includes(a.type)
    ).length;
    const transitTrips = activities.filter(a =>
      a.category === 'transport' && ['bus', 'train', 'subway'].includes(a.type)
    ).length;
    const vegMeals = activities.filter(a =>
      a.category === 'food' && ['vegetarian_meal', 'vegan_meal'].includes(a.type)
    ).length;
    const veganMeals = activities.filter(a =>
      a.category === 'food' && a.type === 'vegan_meal'
    ).length;
    const categories = new Set(activities.map(a => a.category));

    // Check conditions
    const checks = [
      { id: 'first-log', met: activities.length >= 1 },
      { id: 'five-logs', met: activities.length >= 5 },
      { id: 'ten-logs', met: activities.length >= 10 },
      { id: 'fifty-logs', met: activities.length >= 50 },
      { id: 'century', met: activities.length >= 100 },
      { id: 'week-streak', met: streak.current >= 7 || streak.longest >= 7 },
      { id: 'two-week-streak', met: streak.current >= 14 || streak.longest >= 14 },
      { id: 'month-streak', met: streak.current >= 30 || streak.longest >= 30 },
      { id: 'green-commuter', met: greenTrips >= 10 },
      { id: 'transit-rider', met: transitTrips >= 10 },
      { id: 'veggie-lover', met: vegMeals >= 20 },
      { id: 'plant-pioneer', met: veganMeals >= 50 },
      { id: 'first-challenge', met: completedChallenges >= 1 },
      { id: 'five-challenges', met: completedChallenges >= 5 },
      { id: 'all-categories', met: categories.size >= 5 },
      { id: 'level-3', met: (profile.level || 1) >= 3 },
      { id: 'level-5', met: (profile.level || 1) >= 5 },
      { id: 'level-7', met: (profile.level || 1) >= 7 },
      { id: 'level-10', met: (profile.level || 1) >= 10 }
    ];

    for (const check of checks) {
      if (check.met) {
        const wasNew = EcoTrack.Store.unlockBadge(check.id);
        if (wasNew) {
          const badge = BADGES.find(b => b.id === check.id);
          if (badge) {
            awardXP(50);
            showCelebration('badge', badge);
          }
        }
      }
    }
  }

  // ─── Celebration ─────────────────────────────────────────────────────

  function showCelebration(type, data) {
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Celebration');

    let title = '', desc = '', icon = '';
    if (type === 'badge') {
      icon = data.icon;
      title = `Badge Unlocked! ${data.name}`;
      desc = data.description;
    } else if (type === 'levelup') {
      icon = data.icon;
      title = `Level Up! Level ${data.level}`;
      desc = `You are now a ${data.title}!`;
    } else if (type === 'challenge') {
      icon = data.icon;
      title = `Challenge Complete!`;
      desc = `${data.name} — +${data.xp} XP`;
    }

    overlay.innerHTML = `
      <div class="celebration-content">
        <div class="celebration-icon">${icon}</div>
        <h2 class="celebration-title">${EcoTrack.Utils.sanitizeInput(title)}</h2>
        <p class="celebration-desc">${EcoTrack.Utils.sanitizeInput(desc)}</p>
        <button class="btn btn-primary" onclick="this.closest('.celebration-overlay').remove()" aria-label="Close celebration">
          Awesome! 🎉
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => overlay.remove(), 5000);
  }

  // ─── Rendering ───────────────────────────────────────────────────────

  function renderChallengesPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const active = getActiveChallenges();
    const completed = getCompletedChallenges();
    const available = getAvailableChallenges();
    const profile = EcoTrack.Store.getUserProfile();
    const levelInfo = getLevelInfo(profile.xp || 0);

    mainContent.innerHTML = `
      <div class="page-container animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">🏆 Challenges & Badges</h1>
            <p class="page-subtitle">Complete challenges, earn badges, and level up!</p>
          </div>
        </div>

        <!-- Level Progress -->
        <div class="level-progress animate-fade-in stagger-1">
          <div class="level-badge-large">${levelInfo.icon}</div>
          <div class="level-info">
            <div class="level-title">Level ${levelInfo.level} — ${EcoTrack.Utils.sanitizeInput(levelInfo.title)}</div>
            <div class="level-xp-text">${EcoTrack.Utils.formatNumber(levelInfo.xp)} / ${EcoTrack.Utils.formatNumber(levelInfo.nextXP)} XP</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${levelInfo.progressPercent}%;background:linear-gradient(90deg,var(--eco-primary),var(--eco-accent));"></div>
            </div>
          </div>
        </div>

        <!-- Active Challenges -->
        ${active.length > 0 ? `
          <h2 style="color:var(--eco-text);margin-bottom:var(--space-4);">⚡ Active Challenges</h2>
          <div class="challenges-grid" style="margin-bottom:var(--space-6);">
            ${active.map((c, i) => {
              const pct = c.target > 0 ? Math.round((c.progress / c.target) * 100) : 0;
              return `
                <div class="challenge-card animate-fade-in stagger-${i + 2}">
                  <div class="challenge-card-header">
                    <span class="challenge-card-icon">${c.icon}</span>
                    <div>
                      <div class="challenge-card-title">${EcoTrack.Utils.sanitizeInput(c.name)}</div>
                      <div class="challenge-card-xp">+${c.xp} XP</div>
                    </div>
                  </div>
                  <div class="challenge-card-progress">
                    <div class="challenge-progress-text">
                      <span>${c.progress} / ${c.target}</span>
                      <span>${pct}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--eco-primary),var(--eco-accent));"></div>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-secondary" onclick="EcoTrack.Challenges.updateChallengeProgress('${c.id}')" aria-label="Log progress for ${EcoTrack.Utils.sanitizeInput(c.name)}">
                    ➕ Log Progress
                  </button>
                </div>`;
            }).join('')}
          </div>
        ` : ''}

        <!-- Available Challenges -->
        <h2 style="color:var(--eco-text);margin-bottom:var(--space-4);">🎯 Available Challenges</h2>
        <div class="challenges-grid" style="margin-bottom:var(--space-8);">
          ${available.map((c, i) => `
            <div class="challenge-card animate-fade-in stagger-${Math.min(i + 1, 10)}">
              <div class="challenge-card-header">
                <span class="challenge-card-icon">${c.icon}</span>
                <div>
                  <div class="challenge-card-title">${EcoTrack.Utils.sanitizeInput(c.name)}</div>
                  <div class="challenge-card-xp">+${c.xp} XP · ${c.duration} days</div>
                </div>
              </div>
              <div class="challenge-card-desc">${EcoTrack.Utils.sanitizeInput(c.description)}</div>
              <button class="btn btn-sm btn-primary" onclick="EcoTrack.Challenges.joinChallenge('${c.id}');EcoTrack.Challenges.renderChallengesPage();" aria-label="Join ${EcoTrack.Utils.sanitizeInput(c.name)} challenge">
                🚀 Join Challenge
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Completed Challenges -->
        ${completed.length > 0 ? `
          <h2 style="color:var(--eco-text);margin-bottom:var(--space-4);">✅ Completed (${completed.length})</h2>
          <div class="challenges-grid" style="margin-bottom:var(--space-8);">
            ${completed.map(c => `
              <div class="challenge-card" style="opacity:0.7;">
                <div class="challenge-card-header">
                  <span class="challenge-card-icon">${c.icon}</span>
                  <div>
                    <div class="challenge-card-title">${EcoTrack.Utils.sanitizeInput(c.name)}</div>
                    <div class="challenge-card-xp" style="color:var(--eco-success);">✅ Completed</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Badges Collection -->
        <h2 style="color:var(--eco-text);margin-bottom:var(--space-4);">🎖️ Badge Collection</h2>
        ${renderBadgesGrid()}
      </div>
    `;
  }

  function renderBadgesGrid() {
    const unlocked = EcoTrack.Store.getBadges().map(b => b.id);

    return `
      <div class="badges-grid">
        ${BADGES.map(badge => {
          const isUnlocked = unlocked.includes(badge.id);
          return `
            <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}" 
                 title="${EcoTrack.Utils.sanitizeInput(badge.description)}"
                 aria-label="${EcoTrack.Utils.sanitizeInput(badge.name)}: ${isUnlocked ? 'Unlocked' : 'Locked'}. ${EcoTrack.Utils.sanitizeInput(badge.description)}">
              <span class="badge-icon">${badge.icon}</span>
              <span class="badge-name">${EcoTrack.Utils.sanitizeInput(badge.name)}</span>
              <span class="badge-desc">${EcoTrack.Utils.sanitizeInput(badge.description)}</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  function renderLevelProgress() {
    const profile = EcoTrack.Store.getUserProfile();
    const info = getLevelInfo(profile.xp || 0);

    return `
      <div class="level-progress">
        <div class="level-badge-large">${info.icon}</div>
        <div class="level-info">
          <div class="level-title">Level ${info.level} — ${EcoTrack.Utils.sanitizeInput(info.title)}</div>
          <div class="level-xp-text">${EcoTrack.Utils.formatNumber(info.xp)} XP</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${info.progressPercent}%;background:linear-gradient(90deg,var(--eco-primary),var(--eco-accent));"></div>
          </div>
        </div>
      </div>`;
  }

  // ─── Badge Lookup ──────────────────────────────────────────────────
  function getBadgeInfo(badgeId) {
    return BADGES.find(b => b.id === badgeId) || null;
  }

  // ─── Public API ──────────────────────────────────────────────────────
  return Object.freeze({
    init,
    getActiveChallenges,
    getCompletedChallenges,
    getAvailableChallenges,
    joinChallenge,
    updateChallengeProgress,
    checkBadges,
    awardXP,
    getLevelInfo,
    getBadgeInfo,
    showCelebration,
    renderChallengesPage,
    renderBadgesGrid,
    renderLevelProgress,
    BADGES,
    CHALLENGES,
    LEVELS
  });
})();
