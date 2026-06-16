/**
 * EcoTrack — Chat Assistant (EcoBot)
 *
 * Context-aware chat assistant that greets users by name, analyses
 * their footprint data, provides personalised recommendations,
 * answers questions, and keeps a conversation history.
 *
 * Depends on: EcoTrack.Utils, EcoTrack.Store, EcoTrack.Calculator, EcoTrack.Insights
 *
 * @namespace EcoTrack.Assistant
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.Assistant = (() => {
  'use strict';

  let chatHistory = [];

  // ─── Eco Fun Facts ───────────────────────────────────────────────────
  const FUN_FACTS = [
    "A single tree absorbs about 22 kg of CO₂ per year — and can absorb 1 tonne over its lifetime! 🌳",
    "If food waste were a country, it would be the third-largest emitter of greenhouse gases. 🗑️",
    "The internet produces roughly the same amount of CO₂ as the aviation industry. ✈️💻",
    "Producing 1 kg of beef requires about 15,000 litres of water. 🐄💧",
    "LEDs use 75% less energy and last 25 times longer than incandescent bulbs. 💡",
    "A round-trip transatlantic flight generates about 1.6 tonnes of CO₂ — nearly half a year's target! ✈️",
    "Cycling instead of driving just 10 km saves about 2.1 kg of CO₂. 🚲",
    "The fashion industry produces 10% of global carbon emissions — more than aviation and shipping combined! 👗",
    "A single email produces about 4g of CO₂. Emails with attachments? Around 50g. 📧",
    "Plant-based diets reduce food-related emissions by up to 73%. 🌱",
    "Composting food scraps reduces methane emissions from landfills by up to 50%. ♻️",
    "If every American home replaced one light bulb with an LED, it would save $600 million in energy costs. 💰",
    "Taking a 5-minute shower instead of 10 minutes saves about 0.5 kg CO₂. 🚿",
    "Buying secondhand clothing for just one year saves an average of 420 kg of CO₂. 👕",
    "A reusable water bottle saves an average of 156 plastic bottles per year per person. 💧",
    "Concrete production accounts for 8% of the world's CO₂ emissions. 🏗️",
    "The Paris Agreement target is 2 tonnes CO₂ per person per year by 2050. 🎯",
    "Carpooling with just one other person cuts your commute emissions in half. 🚗👥",
    "Cold water washing cleans clothes just as well and uses 90% less energy. 🧺",
    "Renewable energy is now cheaper than fossil fuels in most parts of the world. ☀️",
    "Bamboo absorbs 35% more CO₂ than equivalent stands of trees. 🎋",
    "The average smartphone has a carbon footprint of about 70 kg over its lifetime. 📱"
  ];

  // ─── Intent Matching ─────────────────────────────────────────────────
  const INTENTS = [
    { keywords: ['hello', 'hi', 'hey', 'morning', 'afternoon', 'evening', 'greetings'], intent: 'greeting' },
    { keywords: ['footprint', 'my carbon', 'how much', 'total', 'score', 'how am i doing', 'status'], intent: 'footprint' },
    { keywords: ['transport', 'car', 'drive', 'commute', 'flight', 'travel'], intent: 'category_transport' },
    { keywords: ['food', 'diet', 'eat', 'meal', 'meat', 'vegan', 'vegetarian'], intent: 'category_food' },
    { keywords: ['energy', 'electric', 'power', 'heating', 'ac', 'shower', 'water'], intent: 'category_energy' },
    { keywords: ['shopping', 'buy', 'purchase', 'clothes', 'online'], intent: 'category_shopping' },
    { keywords: ['digital', 'internet', 'streaming', 'email', 'screen'], intent: 'category_digital' },
    { keywords: ['tip', 'advice', 'suggest', 'recommend', 'help me', 'what should', 'how can'], intent: 'tip' },
    { keywords: ['compare', 'average', 'others', 'world', 'country', 'global'], intent: 'compare' },
    { keywords: ['goal', 'target', 'set goal', 'my goal'], intent: 'goal' },
    { keywords: ['challenge', 'mission', 'task'], intent: 'challenge' },
    { keywords: ['tree', 'trees', 'offset', 'plant'], intent: 'offset' },
    { keywords: ['fact', 'did you know', 'interesting', 'fun fact', 'tell me something'], intent: 'fact' },
    { keywords: ['what can you', 'help', 'commands', 'abilities', 'what do you do'], intent: 'help' },
    { keywords: ['badge', 'achievement', 'level', 'xp', 'points'], intent: 'gamification' },
    { keywords: ['streak', 'days', 'logging', 'consistency'], intent: 'streak' },
    { keywords: ['week', 'weekly', 'report', 'summary', 'progress'], intent: 'report' },
    { keywords: ['thank', 'thanks', 'great', 'awesome', 'cool', 'nice'], intent: 'thanks' }
  ];

  // ─── Core Functions ──────────────────────────────────────────────────

  function init() {
    loadChatHistory();
  }

  /**
   * Match user input to an intent.
   */
  function matchIntent(text) {
    const lower = text.toLowerCase().trim();
    for (const entry of INTENTS) {
      if (entry.keywords.some(kw => lower.includes(kw))) {
        return entry.intent;
      }
    }
    return 'unknown';
  }

  /**
   * Generate a response based on intent and user data.
   */
  function generateResponse(intent) {
    const profile = EcoTrack.Store.getUserProfile();
    const stats = EcoTrack.Store.getStats();
    const name = profile.name || 'Explorer';
    const streak = stats.streak;

    switch (intent) {
      case 'greeting':
        return getGreetingMessage();

      case 'footprint': {
        if (stats.totalLogs === 0) {
          return `You haven't logged any activities yet, ${name}! Head over to the **Log Activity** tab to start tracking your carbon footprint. 📝`;
        }
        const ecoScore = getEcoScore(stats);
        return `Here's your footprint summary, ${name}:\n\n` +
          `📊 **Today**: ${EcoTrack.Utils.formatNumber(stats.today, 1)} kg CO₂\n` +
          `📅 **This week**: ${EcoTrack.Utils.formatNumber(stats.week, 1)} kg CO₂\n` +
          `📆 **This month**: ${EcoTrack.Utils.formatNumber(stats.month, 1)} kg CO₂\n` +
          `📈 **Daily average**: ${EcoTrack.Utils.formatNumber(stats.avgDaily, 1)} kg CO₂\n` +
          `🌍 **Eco Score**: ${ecoScore}/100\n\n` +
          `You've logged ${stats.totalLogs} activities across ${stats.daysLogged} days. ${streak.current > 0 ? `🔥 ${streak.current}-day streak!` : ''}`;
      }

      case 'category_transport': return getCategoryResponse('transport', stats);
      case 'category_food': return getCategoryResponse('food', stats);
      case 'category_energy': return getCategoryResponse('energy', stats);
      case 'category_shopping': return getCategoryResponse('shopping', stats);
      case 'category_digital': return getCategoryResponse('digital', stats);

      case 'tip': {
        const tip = EcoTrack.Insights?.getContextualTip?.();
        const topRecs = EcoTrack.Insights?.getTopRecommendations?.(1) || [];
        let response = tip ? `💡 **Quick Tip**: ${tip}\n\n` : '';
        if (topRecs.length > 0) {
          const rec = topRecs[0];
          response += `🎯 **Top Recommendation**: ${rec.title}\n${rec.description}\n💚 Potential savings: ~${EcoTrack.Utils.formatNumber(rec.impactKg)} kg CO₂/year`;
        } else {
          response += "You're doing great! Keep logging activities and I'll generate personalised tips based on your patterns. 🌟";
        }
        return response;
      }

      case 'compare': {
        const country = (profile.country || 'global').toLowerCase();
        const averages = EcoTrack.Calculator.getCountryAverages();
        const countryAvg = averages[country] || averages['global'];
        const userYearly = stats.avgDaily * 365 / 1000;

        return `📊 **How you compare**:\n\n` +
          `🧑 **Your estimate**: ${EcoTrack.Utils.formatNumber(userYearly, 1)} tonnes CO₂/year\n` +
          `🌍 **${country.toUpperCase()} average**: ${EcoTrack.Utils.formatNumber(countryAvg, 1)} tonnes/year\n` +
          `🎯 **Paris target**: 2.0 tonnes/year\n\n` +
          (userYearly < countryAvg
            ? `You're below the ${country.toUpperCase()} average — well done! 🎉`
            : `You're above the ${country.toUpperCase()} average. Let's work on bringing that down! 💪`);
      }

      case 'goal': {
        const goals = EcoTrack.Store.get('goals') || { daily: 10, weekly: 70 };
        return `🎯 **Your current goals**:\n\n` +
          `📅 Daily: ${goals.daily} kg CO₂\n` +
          `📊 Weekly: ${goals.weekly} kg CO₂\n` +
          `📆 Monthly: ${goals.monthly || goals.daily * 30} kg CO₂\n\n` +
          `You can adjust your goals in **Settings**. The Paris Agreement target is about 5.5 kg CO₂/day per person.`;
      }

      case 'challenge': {
        const available = EcoTrack.Challenges?.getAvailableChallenges?.() || [];
        if (available.length === 0) return "You're already enrolled in all available challenges! 🏆";
        const rec = EcoTrack.Utils.getRandomItem(available);
        return `🏆 **Challenge suggestion**: ${rec.icon} **${rec.name}**\n\n` +
          `${rec.description}\n\n` +
          `Duration: ${rec.duration} days · Reward: +${rec.xp} XP\n\n` +
          `Head to the **Challenges** tab to join!`;
      }

      case 'offset': {
        const totalKg = stats.total;
        const trees = EcoTrack.Calculator.treesNeededToOffset(totalKg);
        return `🌳 **Tree Offset Calculator**:\n\n` +
          `Your total tracked emissions: ${EcoTrack.Utils.formatCO2(totalKg)}\n` +
          `Trees needed to offset: **${trees} trees**\n\n` +
          `One tree absorbs about 22 kg CO₂ per year. Consider supporting reforestation projects! 🌲`;
      }

      case 'fact':
        return `🌍 **Did you know?**\n\n${EcoTrack.Utils.getRandomItem(FUN_FACTS)}`;

      case 'help':
        return `👋 I'm **EcoBot**, your personal eco-assistant! Here's what I can do:\n\n` +
          `📊 **"What's my footprint?"** — See your carbon summary\n` +
          `💡 **"Give me a tip"** — Get personalised advice\n` +
          `🌍 **"How do I compare?"** — Compare to averages\n` +
          `🎯 **"What's my goal?"** — View your targets\n` +
          `🏆 **"Suggest a challenge"** — Get challenge recommendations\n` +
          `🌳 **"How many trees?"** — Calculate tree offset\n` +
          `🧠 **"Did you know?"** — Learn eco fun facts\n` +
          `📊 **"Weekly report"** — See your weekly summary\n` +
          `🚗🍽️⚡🛍️💻 **Ask about any category** — Deep-dive analysis\n\n` +
          `Just type naturally — I understand most eco-related questions! 🌿`;

      case 'gamification': {
        const levelInfo = EcoTrack.Challenges?.getLevelInfo?.(profile.xp || 0) || { level: 1, title: 'Eco Seedling', xp: 0 };
        const badges = EcoTrack.Store.getBadges().length;
        return `🎮 **Your Progress**:\n\n` +
          `⭐ Level ${levelInfo.level}: ${levelInfo.title}\n` +
          `✨ ${EcoTrack.Utils.formatNumber(levelInfo.xp)} XP earned\n` +
          `🎖️ ${badges} badges unlocked\n` +
          `🔥 ${streak.current}-day streak (best: ${streak.longest})\n\n` +
          `Keep logging and completing challenges to level up! 🚀`;
      }

      case 'streak':
        return `🔥 **Streak Status**:\n\n` +
          `Current streak: **${streak.current} days**\n` +
          `Longest streak: **${streak.longest} days**\n` +
          `Total days logged: **${stats.daysLogged}**\n\n` +
          (streak.current > 0 ? "Don't break the chain! 💪" : "Start logging today to begin your streak! 📝");

      case 'report':
        return generateWeeklyReport();

      case 'thanks':
        return `You're welcome, ${name}! 💚 I'm always here to help you reduce your carbon footprint. Keep up the great work! 🌿`;

      case 'unknown':
      default:
        return `I'm not sure I understand that, ${name}. Try asking me:\n\n` +
          `• "What's my footprint?"\n` +
          `• "Give me a tip"\n` +
          `• "How do I compare?"\n` +
          `• "Tell me a fun fact"\n` +
          `• "What can you do?"\n\n` +
          `I understand most eco-related questions! 🌱`;
    }
  }

  function getGreetingMessage() {
    const profile = EcoTrack.Store.getUserProfile();
    const stats = EcoTrack.Store.getStats();
    const greeting = EcoTrack.Utils.getGreeting();
    const name = profile.name || 'Explorer';
    const tip = EcoTrack.Insights?.getContextualTip?.() || 'Every small action counts!';

    let msg = `${greeting}, ${name}! 🌿 Welcome back to EcoTrack.\n\n`;

    if (stats.totalLogs > 0) {
      msg += `📊 Today's footprint: **${EcoTrack.Utils.formatNumber(stats.today, 1)} kg CO₂**\n`;
      msg += `🔥 Streak: ${stats.streak.current} days\n\n`;
    }

    msg += `💡 ${tip}`;
    return msg;
  }

  function getCategoryResponse(category, stats) {
    const activities = EcoTrack.Store.getActivities({ category });
    const total = activities.reduce((sum, a) => sum + (a.co2 || 0), 0);
    const icon = EcoTrack.Utils.getCategoryIcon(category);
    const advice = EcoTrack.Insights?.getCategoryAdvice?.(category) || [];

    let msg = `${icon} **${category.charAt(0).toUpperCase() + category.slice(1)} Analysis**:\n\n`;
    msg += `Total emissions: **${EcoTrack.Utils.formatCO2(total)}**\n`;
    msg += `Activities logged: **${activities.length}**\n\n`;

    if (advice.length > 0) {
      msg += `🎯 **Top tip**: ${advice[0].title}\n${advice[0].description}\n💚 Save ~${EcoTrack.Utils.formatNumber(advice[0].impactKg)} kg/year`;
    } else {
      msg += `Keep logging ${category} activities for personalised tips!`;
    }

    return msg;
  }

  function generateWeeklyReport() {
    const report = EcoTrack.Insights?.getWeeklyReport?.();
    if (!report) return "Log some activities first to generate a weekly report! 📊";

    return `📊 **Weekly Report**:\n\n` +
      `📈 Week total: **${EcoTrack.Utils.formatNumber(report.weekTotal, 1)} kg CO₂**\n` +
      `🎯 Goal: ${EcoTrack.Utils.formatNumber(report.weekGoal, 1)} kg CO₂ (${report.percentOfGoal}%)\n` +
      `📅 Daily average: ${EcoTrack.Utils.formatNumber(report.avgDaily, 1)} kg/day\n` +
      `🏷️ Highest category: ${report.highestCategory}\n` +
      `🔥 Streak: ${report.streak} days\n\n` +
      `${report.summary}`;
  }

  function getEcoScore(stats) {
    const profile = EcoTrack.Store.getUserProfile();
    const country = (profile.country || 'global').toLowerCase();
    const averages = EcoTrack.Calculator.getCountryAverages();
    const countryAvg = (averages[country] || averages['global']) * 1000 / 365;
    const target = 2000 / 365;

    if (stats.avgDaily <= target) return 100;
    if (stats.avgDaily >= countryAvg * 2) return 0;

    return Math.round(100 - ((stats.avgDaily - target) / (countryAvg * 2 - target)) * 100);
  }

  // ─── Chat UI ─────────────────────────────────────────────────────────

  function renderChat() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="page-container animate-fade-in" style="padding:0;height:100%;">
        <div class="card" style="height:calc(100vh - 120px);display:flex;flex-direction:column;margin:var(--space-4);">
          <div class="card-header" style="flex-shrink:0;">
            <h2>🤖 EcoBot — Your Eco Assistant</h2>
          </div>
          <div class="chat-messages" id="chat-messages" role="log" aria-label="Chat messages" aria-live="polite">
          </div>
          <div class="quick-replies" id="quick-replies">
            ${getQuickReplies().map(qr => `
              <button class="quick-reply-btn" onclick="EcoTrack.Assistant.sendMessage('${EcoTrack.Utils.sanitizeInput(qr)}')" aria-label="${qr}">
                ${EcoTrack.Utils.sanitizeInput(qr)}
              </button>
            `).join('')}
          </div>
          <div class="chat-input-area">
            <input type="text" class="chat-input" id="chat-input" 
                   placeholder="Ask me about your carbon footprint..." 
                   aria-label="Type your message"
                   autocomplete="off"
                   maxlength="500">
            <button class="chat-send-btn" id="chat-send-btn" 
                    aria-label="Send message" onclick="EcoTrack.Assistant.sendFromInput()">
              ➤
            </button>
          </div>
        </div>
      </div>
    `;

    // Set up input listeners
    const input = document.getElementById('chat-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendFromInput();
        }
      });
    }

    // Restore history or show greeting
    const container = document.getElementById('chat-messages');
    if (chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        appendBubble(msg.text, msg.role, false);
      });
      scrollToBottom();
    } else {
      // Send initial greeting
      const greeting = getGreetingMessage();
      addBotMessage(greeting, true);
    }
  }

  function sendFromInput() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    sendMessage(text);
  }

  function sendMessage(text) {
    if (!text || !text.trim()) return;

    // Add user message
    addUserMessage(text);

    // Process and respond with typing delay
    setTimeout(() => {
      const intent = matchIntent(text);
      const response = generateResponse(intent);
      addBotMessage(response, true);
    }, 500 + Math.random() * 800);
  }

  function addUserMessage(text) {
    chatHistory.push({ role: 'user', text, timestamp: new Date().toISOString() });
    appendBubble(text, 'user');
    saveChatHistory();
    scrollToBottom();
  }

  function addBotMessage(text, typing = false) {
    if (typing) {
      // Show typing indicator
      const container = document.getElementById('chat-messages');
      if (container) {
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-bubble bot';
        typingEl.id = 'typing-indicator';
        typingEl.innerHTML = `
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>`;
        container.appendChild(typingEl);
        scrollToBottom();

        // Replace with actual message after delay
        setTimeout(() => {
          typingEl.remove();
          chatHistory.push({ role: 'bot', text, timestamp: new Date().toISOString() });
          appendBubble(text, 'bot');
          saveChatHistory();
          scrollToBottom();
        }, 600 + Math.random() * 400);
      }
    } else {
      chatHistory.push({ role: 'bot', text, timestamp: new Date().toISOString() });
      appendBubble(text, 'bot');
      saveChatHistory();
      scrollToBottom();
    }
  }

  function appendBubble(text, role, animate = true) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    if (!animate) bubble.style.animation = 'none';

    // Simple markdown-like formatting
    let formatted = EcoTrack.Utils.sanitizeInput(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = formatted;
    container.appendChild(bubble);
  }

  function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  function getQuickReplies() {
    return [
      "What's my footprint?",
      "Give me a tip",
      "How do I compare?",
      "Did you know?",
      "Weekly report",
      "Suggest a challenge",
      "What can you do?"
    ];
  }

  function saveChatHistory() {
    try {
      // Keep only last 50 messages to prevent storage bloat
      const recent = chatHistory.slice(-50);
      EcoTrack.Store.set('chatHistory', recent);
    } catch { /* silently fail */ }
  }

  function loadChatHistory() {
    try {
      chatHistory = EcoTrack.Store.get('chatHistory') || [];
    } catch { chatHistory = []; }
  }

  // ─── Public API ──────────────────────────────────────────────────────
  return {
    init,
    renderChat,
    sendMessage,
    sendFromInput,
    addBotMessage,
    getGreetingMessage,
    matchIntent,
    generateResponse,
    getQuickReplies,
    FUN_FACTS
  };
})();
