# 🌿 EcoTrack — Carbon Footprint Awareness Platform

> **Challenge Vertical**: Carbon Footprint Awareness Platform  
> **Hackathon**: PromptWars Virtual — Challenge 3

---

## 📋 Overview

**EcoTrack** is a comprehensive, fully client-side Carbon Footprint Awareness Platform that helps individuals **understand**, **track**, and **reduce** their carbon footprint through personalized insights, AI-driven recommendations, and gamified eco-challenges.

Built as a single-page application with zero server dependencies, EcoTrack runs entirely in the browser and stores all data locally via `localStorage` — ensuring complete privacy and instant deployment.

### 🎯 Key Highlights

- **Smart Onboarding Wizard** — Establishes baseline carbon footprint in 5 easy steps
- **Interactive Dashboard** — Beautiful charts and metrics visualizing your environmental impact
- **Daily Activity Logger** — Track emissions across 5 categories with 40+ activity types
- **AI-Powered EcoBot** — Context-aware chat assistant providing personalized recommendations
- **Gamification System** — Challenges, badges, streaks, and XP levels to drive engagement
- **Fully Accessible** — WCAG 2.1 AA compliant with keyboard navigation, screen reader support, and high contrast mode

---

## 🧠 Approach & Logic

### Architecture

EcoTrack follows a **modular SPA architecture** using vanilla JavaScript with a namespace pattern (`EcoTrack.*`). This approach was chosen for:

1. **Zero build step** — No bundler, transpiler, or framework overhead
2. **Instant deployment** — Static files served directly via GitHub Pages
3. **Minimal footprint** — The app itself has a tiny carbon footprint (< 2MB total)
4. **Maximum compatibility** — Works in all modern browsers without polyfills

### Carbon Calculation Methodology

Emission factors are sourced from authoritative databases:
- **UK DEFRA/DESNZ** GHG Conversion Factors (2024)
- **IEA** global electricity emission factors
- **Poore & Nemecek (2018)** food emission data via Our World in Data
- **Carbon Trust** digital activity estimates

All calculations use **kg CO₂e** (carbon dioxide equivalent) and cover:

| Category | Activities Tracked | Example Factors |
|----------|-------------------|-----------------|
| 🚗 Transport | 14 types | Car: 0.21 kg/km, Bus: 0.089 kg/km, Flight: 0.255 kg/km |
| 🍽️ Food | 20 types | Beef: 27 kg/kg, Vegan meal: 0.7 kg/meal |
| ⚡ Energy | 13 types | Electricity: 0.233 kWh, Shower: 0.525 per 5min |
| 🛍️ Shopping | 6 types | Clothing: 10 kg/item, Electronics: 50 kg/item |
| 💻 Digital | 7 types | Streaming: 0.036 kg/hr, Email: 0.004 kg/email |

### Smart Recommendation Engine

The EcoBot assistant uses a **rule-based AI system** that:

1. **Analyzes user data** — Identifies highest-emission categories and activities
2. **Generates personalized tips** — Calculates exact CO₂ savings for each recommendation
3. **Considers context** — Time of day, season, recent activities, and user's country
4. **Prioritizes by impact** — Ranks recommendations by potential CO₂ reduction
5. **Tracks engagement** — Remembers shown/dismissed tips to avoid repetition

### Gamification Design

Based on research into behavioral psychology and sustainability apps:
- **Streaks** — Leverage loss aversion for daily habit formation
- **Levels & XP** — Visual progress with 10 eco-themed ranks
- **Badges** — 30+ achievements across all categories
- **Challenges** — 12 time-limited missions with measurable goals
- **Impact Visualization** — Convert CO₂ to trees, showing tangible impact

---

## 🏗️ How It Works

### User Journey

```
1. ONBOARD → 2. UNDERSTAND → 3. TRACK → 4. REDUCE → 5. CELEBRATE
     ↓              ↓              ↓          ↓            ↓
  5-step        Dashboard      Log daily    AI-powered   Badges &
  wizard        & charts      activities   insights     challenges
```

### 1. Onboarding (5 steps)
- Enter name and country
- Answer questions about transport, diet, energy, and lifestyle
- Receive instant baseline calculation with comparison to national averages

### 2. Dashboard
- **Eco Score** — 0-100 rating based on footprint vs. Paris Agreement target
- **Carbon Gauge** — Visual meter showing daily/weekly progress
- **Category Breakdown** — Donut chart showing emission sources
- **Trend Chart** — 30-day line chart tracking progress over time
- **Comparison Bar** — Your footprint vs. country average vs. Paris target

### 3. Activity Logging
- Choose from 60+ activities across 5 categories
- Quick-log presets for common daily activities
- Calendar heatmap showing historical data
- Real-time CO₂ calculation as you log

### 4. Smart Insights
- Personalized recommendations ranked by impact
- Seasonal and time-based contextual tips
- Category-specific deep-dive analysis
- Weekly progress reports

### 5. Gamification
- Join eco-challenges (Meatless Monday, Bike Week, etc.)
- Earn XP and level up from Seedling to Eco Legend
- Collect 30+ achievement badges
- Maintain daily logging streaks

---

## 🛡️ Security & Privacy

- **No server, no tracking** — All data stays in your browser's `localStorage`
- **No external APIs** — Zero network requests for user data
- **Input sanitization** — All user inputs are sanitized to prevent XSS
- **CSP-ready** — Content Security Policy compatible
- **Data export/import** — Full control over your data with JSON export

---

## ♿ Accessibility

EcoTrack is built with accessibility as a core requirement:

- **WCAG 2.1 AA compliant**
- **Full keyboard navigation** — Tab, Enter, Escape, Arrow keys
- **Screen reader optimized** — ARIA labels, roles, live regions
- **Skip navigation** link for keyboard users
- **High contrast mode** for visual impairment
- **Reduced motion** mode respecting `prefers-reduced-motion`
- **Adjustable font sizes** (Small, Normal, Large, Extra Large)
- **Touch targets** ≥ 44x44px for mobile accessibility
- **Semantic HTML** — Proper heading hierarchy, landmarks, and elements
- **Focus indicators** — Visible, high-contrast focus rings

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic structure with ARIA |
| **CSS3** | Custom properties, Grid, Flexbox, animations |
| **Vanilla JavaScript** | ES6+ with namespace pattern |
| **Chart.js v4** | Responsive, accessible charts (CDN) |
| **localStorage** | Client-side data persistence |
| **Google Fonts** | Inter, Outfit, JetBrains Mono |
| **GitHub Pages** | Zero-config deployment |

---

## 📁 Project Structure

```
carbon-footprint-platform/
├── index.html              # SPA entry point
├── css/
│   ├── variables.css       # Design tokens (colors, spacing, typography)
│   ├── base.css            # CSS reset, typography, global styles
│   ├── components.css      # Reusable UI components (30+ components)
│   ├── layout.css          # App shell, sidebar, responsive grid
│   ├── dashboard.css       # Dashboard-specific styles
│   ├── animations.css      # 18+ keyframe animations
│   └── accessibility.css   # A11y overrides, focus styles, high contrast
├── js/
│   ├── utils.js            # 20+ utility functions
│   ├── store.js            # localStorage data management
│   ├── calculator.js       # 60+ emission factors & calculations
│   ├── accessibility.js    # Keyboard detection, focus trapping, ARIA
│   ├── charts.js           # Chart.js configuration & wrapper
│   ├── onboarding.js       # 5-step onboarding wizard
│   ├── dashboard.js        # Dashboard rendering & eco score
│   ├── tracker.js          # Activity logging & calendar
│   ├── insights.js         # AI recommendation engine
│   ├── challenges.js       # Gamification (challenges, badges, XP)
│   ├── assistant.js        # EcoBot chat assistant
│   └── app.js              # Main controller, routing, initialization
├── assets/
│   └── favicon.svg         # Eco-themed leaf favicon
├── README.md               # This file
└── LICENSE                  # MIT License
```

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No server or build tools required

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/carbon-footprint-platform.git
   ```
2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```
3. Navigate to `http://localhost:8000`

### Deployment (GitHub Pages)
1. Push code to GitHub
2. Go to **Settings** → **Pages**
3. Set source to **main branch**, root directory
4. Your site will be live at `https://YOUR_USERNAME.github.io/carbon-footprint-platform/`

---

## 🧪 Testing

### Built-in Test Suite
Open the browser console and run:
```javascript
EcoTrack.App.runTests()
```

This validates:
- Utility function correctness
- Emission calculation accuracy
- Data store persistence
- Input sanitization security
- Country average data integrity

### Manual Testing Checklist
- [ ] Complete onboarding wizard (all 5 steps)
- [ ] Verify dashboard renders with charts
- [ ] Log activities across all 5 categories
- [ ] Test EcoBot responses to various queries
- [ ] Join and progress through a challenge
- [ ] Toggle dark/light mode
- [ ] Test keyboard-only navigation
- [ ] Verify responsive design (320px → 1440px)
- [ ] Export and re-import data
- [ ] Test with a screen reader

---

## 📊 Evaluation Coverage

| Criteria | Implementation |
|----------|---------------|
| **Code Quality** | Modular architecture, JSDoc comments, consistent naming, CSS custom properties, clean separation of concerns |
| **Security** | No external data transmission, XSS prevention via input sanitization, CSP-ready, zero server dependencies |
| **Efficiency** | Single CDN dependency (Chart.js), lazy rendering, debounced inputs, < 2MB total size, instant load times |
| **Testing** | Built-in assertion suite, manual test checklist, console-based validation |
| **Accessibility** | WCAG 2.1 AA, ARIA labels, keyboard nav, screen reader support, high contrast, reduced motion, adjustable fonts |

---

## 📝 Assumptions

1. **Emission factors** are global averages from 2023-2024 data. Real-world emissions vary by location, season, and specific equipment.
2. **Food emissions** represent averages across production methods. Organic, local, and seasonal variations are not individually calculated.
3. **Digital emissions** are estimated based on average data center efficiency and may vary significantly by provider.
4. **User data** is stored only in `localStorage` — clearing browser data will erase all progress. Export functionality is provided as a backup.
5. **Country averages** represent per-capita territorial emissions and may differ from consumption-based accounting.

---

## 📚 Data Sources

- [UK DEFRA GHG Conversion Factors](https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting)
- [Our World in Data — CO₂ Emissions](https://ourworldindata.org/co2-emissions)
- [IEA — Global Energy & CO₂ Status Report](https://www.iea.org/)
- [Poore & Nemecek (2018) — Food Emissions](https://science.sciencemag.org/content/360/6392/987)
- [Carbon Trust — Digital Emissions](https://www.carbontrust.com/)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  Built with 💚 for a greener future
  <br>
  <strong>EcoTrack</strong> — One action at a time
</p>
