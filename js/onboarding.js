/**
 * EcoTrack Onboarding Wizard Module
 * 
 * A 5-step onboarding wizard that collects user profile data including
 * transportation habits, diet, home energy usage, and lifestyle factors.
 * Uses the collected data to calculate a baseline annual carbon footprint.
 * 
 * @module EcoTrack.Onboarding
 * @requires EcoTrack.Store
 * @requires EcoTrack.Utils
 * @requires EcoTrack.Calculator
 */
;(function(global) {
  'use strict';

  // Ensure namespace exists
  const EcoTrack = global.EcoTrack = global.EcoTrack || {};

  /* =========================================================================
   * CONSTANTS
   * ========================================================================= */

  /** Total number of onboarding steps */
  const TOTAL_STEPS = 5;

  /** Step titles for the progress indicator */
  const STEP_TITLES = [
    'Welcome',
    'Transportation',
    'Diet',
    'Home Energy',
    'Lifestyle'
  ];

  /** 
   * Country list with average annual CO2 per capita (metric tons).
   * Source: World Bank / Global Carbon Project estimates.
   */
  const COUNTRIES = [
    { code: 'US', name: 'United States', avgCO2: 14.7 },
    { code: 'GB', name: 'United Kingdom', avgCO2: 5.2 },
    { code: 'CA', name: 'Canada', avgCO2: 14.3 },
    { code: 'AU', name: 'Australia', avgCO2: 15.0 },
    { code: 'DE', name: 'Germany', avgCO2: 8.1 },
    { code: 'FR', name: 'France', avgCO2: 4.5 },
    { code: 'IN', name: 'India', avgCO2: 1.9 },
    { code: 'CN', name: 'China', avgCO2: 7.7 },
    { code: 'JP', name: 'Japan', avgCO2: 8.5 },
    { code: 'BR', name: 'Brazil', avgCO2: 2.0 },
    { code: 'MX', name: 'Mexico', avgCO2: 3.6 },
    { code: 'KR', name: 'South Korea', avgCO2: 11.6 },
    { code: 'ZA', name: 'South Africa', avgCO2: 7.5 },
    { code: 'NG', name: 'Nigeria', avgCO2: 0.6 },
    { code: 'SE', name: 'Sweden', avgCO2: 3.5 },
    { code: 'NO', name: 'Norway', avgCO2: 7.5 },
    { code: 'NL', name: 'Netherlands', avgCO2: 8.3 },
    { code: 'IT', name: 'Italy', avgCO2: 5.3 },
    { code: 'ES', name: 'Spain', avgCO2: 5.0 },
    { code: 'PK', name: 'Pakistan', avgCO2: 0.9 },
    { code: 'BD', name: 'Bangladesh', avgCO2: 0.5 },
    { code: 'RU', name: 'Russia', avgCO2: 11.4 },
    { code: 'AE', name: 'United Arab Emirates', avgCO2: 20.7 },
    { code: 'SA', name: 'Saudi Arabia', avgCO2: 16.1 },
    { code: 'OTHER', name: 'Other', avgCO2: 4.5 }
  ];

  /** Default answers used when the user chooses to skip onboarding */
  const DEFAULT_ANSWERS = {
    name: 'Eco Friend',
    country: 'US',
    transportMode: 'car',
    commuteDistance: 15,
    flightFrequency: 2,
    dietType: 'mixed',
    mealsPerDay: 3,
    localFoodPercent: 30,
    homeSize: 'medium',
    energySource: 'mixed',
    acHeatingUsage: 'moderate',
    renewablePercent: 10,
    shoppingFrequency: 'moderate',
    digitalUsageHours: 6,
    recyclingHabit: 'sometimes'
  };

  /* =========================================================================
   * MODULE STATE
   * ========================================================================= */

  /** Current wizard step (1-indexed) */
  let currentStep = 1;

  /** Collected user answers across all steps */
  let answers = {};

  /** Debounce timer reference for text inputs */
  let _debounceTimer = null;

  /* =========================================================================
   * ONBOARDING MODULE
   * ========================================================================= */

  EcoTrack.Onboarding = {

    /* -----------------------------------------------------------------------
     * Initialization
     * ----------------------------------------------------------------------- */

    /**
     * Initialize the onboarding wizard.
     * Checks if onboarding has already been completed. If so, redirects
     * to the dashboard. Otherwise, renders the first step.
     * 
     * @returns {void}
     */
    init() {
      try {
        const store = EcoTrack.Store;

        // Check if onboarding was previously completed
        const onboardingData = store ? store.getOnboardingData() : null;
        if (onboardingData && onboardingData.completed) {
          console.log('[Onboarding] Already completed — redirecting to dashboard.');
          this._navigateToDashboard();
          return;
        }

        // Reset state
        currentStep = 1;
        answers = {};

        // Load any partially-saved answers so the user can resume
        if (onboardingData && onboardingData.answers && Object.keys(onboardingData.answers).length > 0) {
          answers = onboardingData.answers;
          console.log('[Onboarding] Resuming from saved answers.');
        }

        // Render the first step
        this.renderStep(currentStep);
        console.log('[Onboarding] Wizard initialized.');
      } catch (err) {
        console.error('[Onboarding] init() failed:', err);
      }
    },

    /* -----------------------------------------------------------------------
     * Step Rendering
     * ----------------------------------------------------------------------- */

    /**
     * Render a specific step of the wizard into the #onboarding-container.
     * Generates the progress indicator, step content, and navigation buttons.
     * 
     * @param {number} stepNumber — Step to render (1–5)
     * @returns {void}
     */
    renderStep(stepNumber) {
      try {
        const container = document.getElementById('onboarding-container');
        if (!container) {
          console.warn('[Onboarding] #onboarding-container not found in DOM.');
          return;
        }

        // Clamp step number to valid range
        stepNumber = Math.max(1, Math.min(TOTAL_STEPS, stepNumber));
        currentStep = stepNumber;

        // Build the full wizard HTML wrapped in onboarding-card
        let html = '<div class="onboarding-card">';
        html += this._renderProgressIndicator(stepNumber);
        html += '<div class="onboarding-step fade-in" role="form" aria-label="' +
                this._escapeHtml(STEP_TITLES[stepNumber - 1]) + ' step">';

        // Delegate to the appropriate step renderer
        switch (stepNumber) {
          case 1: html += this._renderWelcomeStep(); break;
          case 2: html += this._renderTransportStep(); break;
          case 3: html += this._renderDietStep(); break;
          case 4: html += this._renderEnergyStep(); break;
          case 5: html += this._renderLifestyleStep(); break;
        }

        html += this._renderNavButtons(stepNumber);
        html += '</div>'; // .onboarding-step
        html += '</div>'; // .onboarding-card

        container.innerHTML = html;

        // Restore any previously-entered values for this step
        this._restoreValues(stepNumber);

        // Attach event listeners
        this._attachListeners(stepNumber);

        // Trigger entrance animation on next frame
        requestAnimationFrame(() => {
          const stepEl = container.querySelector('.onboarding-step');
          if (stepEl) stepEl.classList.add('active');
        });
      } catch (err) {
        console.error('[Onboarding] renderStep() failed:', err);
      }
    },

    /* -----------------------------------------------------------------------
     * Navigation
     * ----------------------------------------------------------------------- */

    /**
     * Validate the current step, save answers, and advance to the next step.
     * On the final step, triggers calculateBaseline → showResults.
     * 
     * @returns {void}
     */
    nextStep() {
      try {
        // Validate first
        if (!this.validateStep(currentStep)) return;

        // Collect and persist answers from current step
        this._collectAnswers(currentStep);
        this._persistAnswers();

        if (currentStep < TOTAL_STEPS) {
          // Animate out, then render next step
          this._animateTransition('left', () => {
            this.renderStep(currentStep + 1);
          });
        } else {
          // Final step — calculate baseline and show results
          this.calculateBaseline();
          this.showResults();
        }
      } catch (err) {
        console.error('[Onboarding] nextStep() failed:', err);
      }
    },

    /**
     * Navigate back to the previous step.
     * 
     * @returns {void}
     */
    prevStep() {
      try {
        if (currentStep > 1) {
          // Save current answers before going back
          this._collectAnswers(currentStep);
          this._persistAnswers();

          this._animateTransition('right', () => {
            this.renderStep(currentStep - 1);
          });
        }
      } catch (err) {
        console.error('[Onboarding] prevStep() failed:', err);
      }
    },

    /* -----------------------------------------------------------------------
     * Validation
     * ----------------------------------------------------------------------- */

    /**
     * Validate all required fields on the given step.
     * Highlights invalid fields and returns false if validation fails.
     * 
     * @param {number} step — Step number to validate
     * @returns {boolean} true if valid
     */
    validateStep(step) {
      try {
        // Clear previous error states
        document.querySelectorAll('.input--error, .field-error').forEach(el => el.classList.remove('input--error', 'field-error'));
        document.querySelectorAll('.input-error-text, .error-message').forEach(el => el.remove());

        let isValid = true;

        switch (step) {
          case 1:
            isValid = this._validateField('onboard-name', 'Please enter your name.', val => val.trim().length >= 1);
            isValid = this._validateField('onboard-country', 'Please select your country.', val => val !== '') && isValid;
            break;

          case 2:
            isValid = this._validateRadioGroup('transportMode', 'Please select a transport mode.');
            isValid = this._validateField('onboard-commute', 'Enter a valid distance (0–500 km).', val => {
              const n = parseFloat(val);
              return !isNaN(n) && n >= 0 && n <= 500;
            }) && isValid;
            isValid = this._validateField('onboard-flights', 'Enter a valid number of flights (0–100).', val => {
              const n = parseInt(val, 10);
              return !isNaN(n) && n >= 0 && n <= 100;
            }) && isValid;
            break;

          case 3:
            isValid = this._validateRadioGroup('dietType', 'Please select a diet type.');
            isValid = this._validateField('onboard-meals', 'Enter meals per day (1–10).', val => {
              const n = parseInt(val, 10);
              return !isNaN(n) && n >= 1 && n <= 10;
            }) && isValid;
            isValid = this._validateField('onboard-local-food', 'Enter a percentage (0–100).', val => {
              const n = parseInt(val, 10);
              return !isNaN(n) && n >= 0 && n <= 100;
            }) && isValid;
            break;

          case 4:
            isValid = this._validateRadioGroup('homeSize', 'Please select your home size.');
            isValid = this._validateField('onboard-energy-source', 'Please select an energy source.', val => val !== '') && isValid;
            isValid = this._validateRadioGroup('acHeating', 'Please select AC/heating usage.');
            isValid = this._validateField('onboard-renewable', 'Enter a percentage (0–100).', val => {
              const n = parseInt(val, 10);
              return !isNaN(n) && n >= 0 && n <= 100;
            }) && isValid;
            break;

          case 5:
            isValid = this._validateRadioGroup('shoppingFrequency', 'Please select shopping frequency.');
            isValid = this._validateField('onboard-digital', 'Enter hours (0–24).', val => {
              const n = parseFloat(val);
              return !isNaN(n) && n >= 0 && n <= 24;
            }) && isValid;
            isValid = this._validateRadioGroup('recycling', 'Please select a recycling habit.');
            break;
        }

        return isValid;
      } catch (err) {
        console.error('[Onboarding] validateStep() failed:', err);
        return false;
      }
    },

    /* -----------------------------------------------------------------------
     * Baseline Calculation
     * ----------------------------------------------------------------------- */

    /**
     * Use EcoTrack.Calculator (if available) plus internal estimates
     * to compute the user's annual CO2 baseline from onboarding answers.
     * Stores the result in answers.baselineKgCO2.
     * 
     * @returns {number} Estimated annual CO2 in kg
     */
    calculateBaseline() {
      try {
        let totalKg = 0;

        // ----- Transport -----
        const transportFactors = {
          car: 0.21,        // kg CO2 per km
          bus: 0.089,
          train: 0.041,
          bike: 0,
          walk: 0,
          motorcycle: 0.113,
          electric_car: 0.05
        };
        const mode = answers.transportMode || 'car';
        const dailyKm = parseFloat(answers.commuteDistance) || 15;
        const workingDays = 250; // approximate working days per year
        totalKg += (transportFactors[mode] || 0.21) * dailyKm * 2 * workingDays;

        // Flights: ~90 kg CO2 per average domestic flight, ~250 kg per international
        const flights = parseInt(answers.flightFrequency, 10) || 2;
        totalKg += flights * 250;

        // ----- Diet -----
        const dietFactors = {
          vegan: 1.5,       // kg CO2 per day
          vegetarian: 2.5,
          mixed: 3.9,
          'high-meat': 5.6
        };
        const diet = answers.dietType || 'mixed';
        const meals = parseInt(answers.mealsPerDay, 10) || 3;
        const mealRatio = meals / 3; // normalise relative to 3 meals/day
        const localPct = parseInt(answers.localFoodPercent, 10) || 30;
        // Local food reduces food-miles by an estimated factor
        const localReduction = 1 - (localPct / 100) * 0.15;
        totalKg += (dietFactors[diet] || 3.9) * mealRatio * 365 * localReduction;

        // ----- Home Energy -----
        const homeSizeFactors = { small: 0.7, medium: 1.0, large: 1.5 };
        const energySourceFactors = {
          electricity: 2500,
          gas: 3000,
          mixed: 2800,
          oil: 3500,
          renewable: 500
        };
        const acFactors = { low: 0.7, moderate: 1.0, high: 1.4 };

        const homeSize = answers.homeSize || 'medium';
        const energySrc = answers.energySource || 'mixed';
        const acUsage = answers.acHeatingUsage || 'moderate';
        const renewPct = parseInt(answers.renewablePercent, 10) || 10;

        let energyBase = energySourceFactors[energySrc] || 2800;
        energyBase *= homeSizeFactors[homeSize] || 1.0;
        energyBase *= acFactors[acUsage] || 1.0;
        energyBase *= (1 - renewPct / 100 * 0.8); // renewables offset up to 80%
        totalKg += energyBase;

        // ----- Lifestyle -----
        const shoppingFactors = { rarely: 200, moderate: 600, frequent: 1200 };
        const shopping = answers.shoppingFrequency || 'moderate';
        totalKg += shoppingFactors[shopping] || 600;

        // Digital: ~50 g CO2 per hour of internet use (data centres, devices)
        const digitalHours = parseFloat(answers.digitalUsageHours) || 6;
        totalKg += digitalHours * 0.05 * 365;

        // Recycling offset
        const recyclingFactors = { always: -200, sometimes: -80, rarely: -20, never: 0 };
        const recycling = answers.recyclingHabit || 'sometimes';
        totalKg += recyclingFactors[recycling] || -80;

        // Use Calculator module if available for a more precise figure
        if (EcoTrack.Calculator && typeof EcoTrack.Calculator.calculateYearlyEstimate === 'function') {
          const calcResult = EcoTrack.Calculator.calculateYearlyEstimate(answers);
          if (calcResult && typeof calcResult === 'number' && calcResult > 0) {
            totalKg = calcResult;
          }
        }

        // Round to nearest integer
        totalKg = Math.max(0, Math.round(totalKg));
        answers.baselineKgCO2 = totalKg;

        console.log('[Onboarding] Baseline calculated:', totalKg, 'kg CO2/year');
        return totalKg;
      } catch (err) {
        console.error('[Onboarding] calculateBaseline() failed:', err);
        answers.baselineKgCO2 = 4500; // fallback global average
        return 4500;
      }
    },

    /* -----------------------------------------------------------------------
     * Results Display
     * ----------------------------------------------------------------------- */

    /**
     * Show animated results screen with the user's baseline footprint
     * compared to their country's average and the global average.
     * 
     * @returns {void}
     */
    showResults() {
      try {
        const container = document.getElementById('onboarding-container');
        if (!container) return;

        const baseline = answers.baselineKgCO2 || 4500;
        const baselineTons = (baseline / 1000).toFixed(1);

        // Determine country average for comparison
        const countryData = COUNTRIES.find(c => c.code === answers.country) || { name: 'Global', avgCO2: 4.5 };
        const countryAvgKg = countryData.avgCO2 * 1000;
        const globalAvgKg = 4500;

        // Comparison percentages
        const vCountry = baseline < countryAvgKg
          ? Math.round((1 - baseline / countryAvgKg) * 100) + '% below'
          : Math.round((baseline / countryAvgKg - 1) * 100) + '% above';

        const vGlobal = baseline < globalAvgKg
          ? Math.round((1 - baseline / globalAvgKg) * 100) + '% below'
          : Math.round((baseline / globalAvgKg - 1) * 100) + '% above';

        // Determine an emoji based on footprint level
        let emoji = '🌍';
        if (baseline < 3000) emoji = '🌱';
        else if (baseline < 6000) emoji = '🌿';
        else if (baseline < 10000) emoji = '🌳';
        else emoji = '🏭';

        // Format numbers using Utils if available
        const fmt = (n) => {
          if (EcoTrack.Utils && typeof EcoTrack.Utils.formatNumber === 'function') {
            return EcoTrack.Utils.formatNumber(n);
          }
          return n.toLocaleString();
        };

        const html = `
          <div class="onboarding-card results-container fade-in" role="region" aria-label="Your carbon footprint results">
            <div class="onboarding-step-icon bounce-in" style="text-align: center; display: block; font-size: 3.5rem;">${emoji}</div>
            <h2 class="onboarding-title" style="text-align: center; font-size: 1.5rem; margin-bottom: var(--space-4);">Your Estimated Annual Footprint</h2>

            <div class="results-score count-up" data-target="${baseline}" aria-live="polite" style="text-align: center; font-size: 3.5rem; font-weight: 800; margin-bottom: var(--space-2);">
              <span id="results-counter">0</span>
              <span style="font-size: 1.25rem; font-weight: 500; font-family: var(--font-body); display: block; color: var(--eco-text-secondary); margin-top: var(--space-1); -webkit-text-fill-color: var(--eco-text-secondary);">kg CO₂ / year</span>
            </div>

            <p class="onboarding-description" style="text-align: center; margin-bottom: var(--space-6);">(${baselineTons} metric tons)</p>

            <div class="results-comparison" aria-label="Comparisons" style="margin-bottom: var(--space-6);">
              <div class="results-comparison-item">
                <span class="results-comparison-value" style="color: var(--eco-primary);">${(baseline / 1000).toFixed(1)}t</span>
                <span class="results-comparison-label">Your Score</span>
              </div>
              <div class="results-comparison-item">
                <span class="results-comparison-value">${(countryAvgKg / 1000).toFixed(1)}t</span>
                <span class="results-comparison-label">${this._escapeHtml(countryData.name)} avg</span>
                <span class="comparison-diff ${baseline <= countryAvgKg ? 'good' : 'bad'}" style="font-size: 0.65rem; display: block; margin-top: 4px; font-weight: 600; color: ${baseline <= countryAvgKg ? 'var(--eco-success)' : 'var(--eco-danger)'};">${vCountry}</span>
              </div>
              <div class="results-comparison-item">
                <span class="results-comparison-value">${(globalAvgKg / 1000).toFixed(1)}t</span>
                <span class="results-comparison-label">Global avg</span>
                <span class="comparison-diff ${baseline <= globalAvgKg ? 'good' : 'bad'}" style="font-size: 0.65rem; display: block; margin-top: 4px; font-weight: 600; color: ${baseline <= globalAvgKg ? 'var(--eco-success)' : 'var(--eco-danger)'};">${vGlobal}</span>
              </div>
            </div>

            <!-- Breakdown mini-chart placeholder -->
            <div class="results-breakdown" aria-label="Footprint breakdown" style="text-align: left; margin: var(--space-6) 0;">
              <h3 style="font-size: 1rem; font-weight: 600; color: var(--eco-text); margin-bottom: var(--space-4);">Category Breakdown</h3>
              <div id="results-breakdown-bars"></div>
            </div>

            <div class="onboarding-actions" style="margin-top: var(--space-6);">
              <button class="btn btn-primary btn-lg pulse" id="btn-start-tracking" aria-label="Start tracking your footprint">
                🚀 Start Tracking
              </button>
              <button class="btn btn-secondary" id="btn-retake" aria-label="Retake the onboarding quiz">
                🔄 Retake Quiz
              </button>
            </div>
          </div>`;

        container.innerHTML = html;

        // Animate the counter
        this._animateCounter('results-counter', baseline, 2000);

        // Render breakdown bars
        this._renderBreakdownBars();

        // Attach result-page buttons
        const startBtn = document.getElementById('btn-start-tracking');
        const retakeBtn = document.getElementById('btn-retake');
        if (startBtn) startBtn.addEventListener('click', () => this.complete());
        if (retakeBtn) retakeBtn.addEventListener('click', () => {
          currentStep = 1;
          answers = {};
          this.renderStep(1);
        });
      } catch (err) {
        console.error('[Onboarding] showResults() failed:', err);
      }
    },

    /* -----------------------------------------------------------------------
     * Completion & Skip
     * ----------------------------------------------------------------------- */

    /**
     * Save onboarding data to persistent storage, mark complete,
     * and redirect to the dashboard.
     * 
     * @returns {void}
     */
    complete() {
      try {
        const store = EcoTrack.Store;
        if (store) {
          // Mark onboarding as completed and save answers
          store.setOnboardingData({
            completed: true,
            answers: answers
          });

          // Save user profile using the Store's proper API
          // Lowercase country code to match calculator's COUNTRY_AVERAGES keys
          store.setUserProfile({
            name: answers.name || 'Eco Friend',
            country: (answers.country || 'global').toLowerCase(),
            joinDate: new Date().toISOString()
          });
        }
        console.log('[Onboarding] Complete. Redirecting to dashboard.');
        this._navigateToDashboard();
      } catch (err) {
        console.error('[Onboarding] complete() failed:', err);
      }
    },

    /**
     * Skip onboarding using default answers, calculate baseline,
     * and redirect to dashboard.
     * 
     * @returns {void}
     */
    skip() {
      try {
        answers = { ...DEFAULT_ANSWERS };
        this.calculateBaseline();
        this.complete();
        console.log('[Onboarding] Skipped with default answers.');
      } catch (err) {
        console.error('[Onboarding] skip() failed:', err);
      }
    },

    /* ===================================================================
     * PRIVATE HELPERS
     * =================================================================== */

    /**
     * Render the step progress indicator bar.
     * @private
     * @param {number} currentStepNum
     * @returns {string} HTML
     */
    _renderProgressIndicator(currentStepNum) {
      let html = '<div class="onboarding-progress" role="progressbar" aria-label="Onboarding progress" aria-valuenow="' + currentStepNum + '" aria-valuemin="1" aria-valuemax="' + TOTAL_STEPS + '">';
      for (let i = 1; i <= TOTAL_STEPS; i++) {
        const state = i < currentStepNum ? 'completed' : (i === currentStepNum ? 'active' : '');
        html += `<div class="onboarding-progress-step ${state}"></div>`;
      }
      html += '</div>';
      return html;
    },

    /* ----- Step 1: Welcome & Name ----- */

    /**
     * @private
     * @returns {string} HTML for step 1
     */
    _renderWelcomeStep() {
      // Build country <option> list
      let countryOptions = '<option value="">-- Select Country --</option>';
      COUNTRIES.forEach(c => {
        countryOptions += '<option value="' + c.code + '">' + this._escapeHtml(c.name) + '</option>';
      });

      return `
        <div class="step-header">
          <span class="onboarding-step-icon bounce-in">🌍</span>
          <h2 class="onboarding-title">Welcome to EcoTrack!</h2>
          <p class="onboarding-description">Let's understand your carbon footprint in just a few minutes.</p>
        </div>

        <div class="onboarding-field">
          <label for="onboard-name" id="label-name">What should we call you?</label>
          <input type="text" id="onboard-name" class="input" 
                 placeholder="Enter your name" maxlength="50"
                 aria-labelledby="label-name" aria-required="true" autocomplete="name" />
        </div>

        <div class="onboarding-field">
          <label for="onboard-country" id="label-country">Where do you live?</label>
          <select id="onboard-country" class="select" 
                  aria-labelledby="label-country" aria-required="true">
            ${countryOptions}
          </select>
          <small class="input-helper">This helps us compare your footprint to your country's average.</small>
        </div>

        <div class="skip-link" style="text-align: center; margin-top: var(--space-4);">
          <button class="btn btn-ghost btn-sm" id="btn-skip" aria-label="Skip onboarding and use defaults">
            Skip setup →
          </button>
        </div>`;
    },

    /* ----- Step 2: Transportation ----- */

    /**
     * @private
     * @returns {string} HTML for step 2
     */
    _renderTransportStep() {
      const modes = [
        { value: 'car', label: 'Car', icon: '🚗' },
        { value: 'electric_car', label: 'Electric Car', icon: '⚡' },
        { value: 'bus', label: 'Bus', icon: '🚌' },
        { value: 'train', label: 'Train', icon: '🚆' },
        { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
        { value: 'bike', label: 'Bicycle', icon: '🚲' },
        { value: 'walk', label: 'Walk', icon: '🚶' }
      ];

      let modeCards = '';
      modes.forEach(m => {
        modeCards += `
          <label class="option-card" tabindex="0" role="radio" aria-checked="false" aria-label="${m.label}">
            <input type="radio" name="transportMode" value="${m.value}" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;" />
            <span class="option-card-icon">${m.icon}</span>
            <span class="option-card-label">${m.label}</span>
          </label>`;
      });

      return `
        <div class="step-header">
          <span class="onboarding-step-icon bounce-in">🚗</span>
          <h2 class="onboarding-title">How Do You Get Around?</h2>
          <p class="onboarding-description">Tell us about your daily commute and travel habits.</p>
        </div>

        <div class="onboarding-field">
          <fieldset style="border: none; padding: 0; margin: 0;">
            <legend id="legend-transport" style="font-weight: 500; color: var(--eco-text); margin-bottom: var(--space-2);">Primary mode of transport</legend>
            <div class="options-grid" role="radiogroup" aria-labelledby="legend-transport">
              ${modeCards}
            </div>
          </fieldset>
        </div>

        <div class="onboarding-field">
          <label for="onboard-commute" id="label-commute">Daily commute distance (km)</label>
          <input type="number" id="onboard-commute" class="input"
                 min="0" max="500" step="1" placeholder="e.g. 20"
                 aria-labelledby="label-commute" aria-required="true" />
        </div>
        
        <div class="onboarding-field">
          <label for="onboard-flights" id="label-flights">Flights per year</label>
          <input type="number" id="onboard-flights" class="input"
                 min="0" max="100" step="1" placeholder="e.g. 4"
                 aria-labelledby="label-flights" aria-required="true" />
        </div>`;
    },

    /* ----- Step 3: Diet ----- */

    /**
     * @private
     * @returns {string} HTML for step 3
     */
    _renderDietStep() {
      const diets = [
        { value: 'vegan', label: 'Vegan', icon: '🌱', desc: 'No animal products' },
        { value: 'vegetarian', label: 'Vegetarian', icon: '🥗', desc: 'No meat, some dairy/eggs' },
        { value: 'mixed', label: 'Mixed', icon: '🍽️', desc: 'Balanced meat & veggies' },
        { value: 'high-meat', label: 'High Meat', icon: '🥩', desc: 'Meat at most meals' }
      ];

      let dietCards = '';
      diets.forEach(d => {
        dietCards += `
          <label class="option-card" tabindex="0" role="radio" aria-checked="false" aria-label="${d.label}: ${d.desc}">
            <input type="radio" name="dietType" value="${d.value}" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;" />
            <span class="option-card-icon">${d.icon}</span>
            <span class="option-card-label">${d.label}</span>
            <span class="option-card-desc">${d.desc}</span>
          </label>`;
      });

      return `
        <div class="step-header">
          <span class="onboarding-step-icon bounce-in">🥗</span>
          <h2 class="onboarding-title">What's on Your Plate?</h2>
          <p class="onboarding-description">Your diet is one of the biggest factors in your carbon footprint.</p>
        </div>

        <div class="onboarding-field">
          <fieldset style="border: none; padding: 0; margin: 0;">
            <legend id="legend-diet" style="font-weight: 500; color: var(--eco-text); margin-bottom: var(--space-2);">Diet type</legend>
            <div class="options-grid" role="radiogroup" aria-labelledby="legend-diet">
              ${dietCards}
            </div>
          </fieldset>
        </div>

        <div class="onboarding-field">
          <label for="onboard-meals" id="label-meals">Meals per day</label>
          <input type="number" id="onboard-meals" class="input"
                 min="1" max="10" step="1" placeholder="3"
                 aria-labelledby="label-meals" aria-required="true" />
        </div>
        
        <div class="onboarding-field">
          <label for="onboard-local-food" id="label-local">Local food percentage</label>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <input type="range" id="onboard-local-food" class="range"
                   min="0" max="100" step="5" value="30"
                   aria-labelledby="label-local" aria-required="true" style="flex: 1;" />
            <output for="onboard-local-food" id="local-food-output" class="range-output" style="font-family: var(--font-mono); font-weight: 600; min-width: 45px; text-align: right;">30%</output>
          </div>
        </div>`;
    },

    /* ----- Step 4: Home Energy ----- */

    /**
     * @private
     * @returns {string} HTML for step 4
     */
    _renderEnergyStep() {
      const sizes = [
        { value: 'small', label: 'Small', icon: '🏠', desc: 'Studio / 1-bed' },
        { value: 'medium', label: 'Medium', icon: '🏡', desc: '2-3 bedrooms' },
        { value: 'large', label: 'Large', icon: '🏘️', desc: '4+ bedrooms' }
      ];

      const acOptions = [
        { value: 'low', label: 'Low', icon: '❄️' },
        { value: 'moderate', label: 'Moderate', icon: '🌡️' },
        { value: 'high', label: 'High', icon: '🔥' }
      ];

      let sizeCards = '';
      sizes.forEach(s => {
        sizeCards += `
          <label class="option-card" tabindex="0" role="radio" aria-checked="false" aria-label="${s.label}: ${s.desc}">
            <input type="radio" name="homeSize" value="${s.value}" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;" />
            <span class="option-card-icon">${s.icon}</span>
            <span class="option-card-label">${s.label}</span>
            <span class="option-card-desc">${s.desc}</span>
          </label>`;
      });

      let acCards = '';
      acOptions.forEach(a => {
        acCards += `
          <label class="option-card" tabindex="0" role="radio" aria-checked="false" aria-label="AC/Heating usage: ${a.label}">
            <input type="radio" name="acHeating" value="${a.value}" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;" />
            <span class="option-card-icon">${a.icon}</span>
            <span class="option-card-label">${a.label}</span>
          </label>`;
      });

      return `
        <div class="step-header">
          <span class="onboarding-step-icon bounce-in">🏠</span>
          <h2 class="onboarding-title">Your Home Energy</h2>
          <p class="onboarding-description">Home energy is often the largest slice of your footprint pie.</p>
        </div>

        <div class="onboarding-field">
          <fieldset style="border: none; padding: 0; margin: 0;">
            <legend id="legend-home-size" style="font-weight: 500; color: var(--eco-text); margin-bottom: var(--space-2);">Home size</legend>
            <div class="options-grid" role="radiogroup" aria-labelledby="legend-home-size">
              ${sizeCards}
            </div>
          </fieldset>
        </div>

        <div class="onboarding-field">
          <label for="onboard-energy-source" id="label-energy">Primary energy source</label>
          <select id="onboard-energy-source" class="select"
                  aria-labelledby="label-energy" aria-required="true">
            <option value="">-- Select --</option>
            <option value="electricity">Electricity (grid)</option>
            <option value="gas">Natural Gas</option>
            <option value="mixed">Mixed (Electric + Gas)</option>
            <option value="oil">Oil / Heating Oil</option>
            <option value="renewable">Mostly Renewable</option>
          </select>
        </div>

        <div class="onboarding-field">
          <fieldset style="border: none; padding: 0; margin: 0;">
            <legend id="legend-ac" style="font-weight: 500; color: var(--eco-text); margin-bottom: var(--space-2);">AC / Heating usage</legend>
            <div class="options-grid" role="radiogroup" aria-labelledby="legend-ac">
              ${acCards}
            </div>
          </fieldset>
        </div>

        <div class="onboarding-field">
          <label for="onboard-renewable" id="label-renew">Renewable energy percentage</label>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <input type="range" id="onboard-renewable" class="range"
                   min="0" max="100" step="5" value="10"
                   aria-labelledby="label-renew" aria-required="true" style="flex: 1;" />
            <output for="onboard-renewable" id="renewable-output" class="range-output" style="font-family: var(--font-mono); font-weight: 600; min-width: 45px; text-align: right;">10%</output>
          </div>
        </div>`;
    },

    /* ----- Step 5: Lifestyle ----- */

    /**
     * @private
     * @returns {string} HTML for step 5
     */
    _renderLifestyleStep() {
      const shopOptions = [
        { value: 'rarely', label: 'Rarely', icon: '🛒', desc: 'A few times a year' },
        { value: 'moderate', label: 'Moderate', icon: '🛍️', desc: 'Monthly' },
        { value: 'frequent', label: 'Frequent', icon: '📦', desc: 'Weekly or more' }
      ];

      const recycleOptions = [
        { value: 'always', label: 'Always', icon: '♻️' },
        { value: 'sometimes', label: 'Sometimes', icon: '🔄' },
        { value: 'rarely', label: 'Rarely', icon: '🗑️' },
        { value: 'never', label: 'Never', icon: '❌' }
      ];

      let shopCards = '';
      shopOptions.forEach(s => {
        shopCards += `
          <label class="option-card" tabindex="0" role="radio" aria-checked="false" aria-label="Shopping frequency: ${s.label} - ${s.desc}">
            <input type="radio" name="shoppingFrequency" value="${s.value}" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;" />
            <span class="option-card-icon">${s.icon}</span>
            <span class="option-card-label">${s.label}</span>
            <span class="option-card-desc">${s.desc}</span>
          </label>`;
      });

      let recycleCards = '';
      recycleOptions.forEach(r => {
        recycleCards += `
          <label class="option-card" tabindex="0" role="radio" aria-checked="false" aria-label="Recycling: ${r.label}">
            <input type="radio" name="recycling" value="${r.value}" class="sr-only" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;" />
            <span class="option-card-icon">${r.icon}</span>
            <span class="option-card-label">${r.label}</span>
          </label>`;
      });

      return `
        <div class="step-header">
          <span class="onboarding-step-icon bounce-in">🌿</span>
          <h2 class="onboarding-title">Your Lifestyle</h2>
          <p class="onboarding-description">Almost there! A few more questions about your daily habits.</p>
        </div>

        <div class="onboarding-field">
          <fieldset style="border: none; padding: 0; margin: 0;">
            <legend id="legend-shopping" style="font-weight: 500; color: var(--eco-text); margin-bottom: var(--space-2);">Shopping frequency (non-grocery)</legend>
            <div class="options-grid" role="radiogroup" aria-labelledby="legend-shopping">
              ${shopCards}
            </div>
          </fieldset>
        </div>

        <div class="onboarding-field">
          <label for="onboard-digital" id="label-digital">Average daily screen / digital usage (hours)</label>
          <input type="number" id="onboard-digital" class="input"
                 min="0" max="24" step="0.5" placeholder="e.g. 6"
                 aria-labelledby="label-digital" aria-required="true" />
        </div>

        <div class="onboarding-field">
          <fieldset style="border: none; padding: 0; margin: 0;">
            <legend id="legend-recycle" style="font-weight: 500; color: var(--eco-text); margin-bottom: var(--space-2);">Recycling habits</legend>
            <div class="options-grid" role="radiogroup" aria-labelledby="legend-recycle">
              ${recycleCards}
            </div>
          </fieldset>
        </div>`;
    },

    /* ---- Navigation Buttons ---- */

    /**
     * Render Back / Next / Skip navigation buttons for a given step.
     * @private
     * @param {number} step
     * @returns {string} HTML
     */
    _renderNavButtons(step) {
      let html = '<div class="onboarding-actions">';

      if (step > 1) {
        html += '<button class="btn btn-secondary" id="btn-prev" aria-label="Go back to previous step">← Back</button>';
      } else {
        html += '<span></span>'; // spacer for flex alignment
      }

      if (step < TOTAL_STEPS) {
        html += '<button class="btn btn-primary" id="btn-next" aria-label="Continue to next step">Next →</button>';
      } else {
        html += '<button class="btn btn-primary btn-lg" id="btn-next" aria-label="See your results">See My Results 🎉</button>';
      }

      html += '</div>';
      return html;
    },

    /* ---- Event Listeners ---- */

    /**
     * Attach click / change listeners for the rendered step.
     * @private
     * @param {number} step
     */
    _attachListeners(step) {
      // Navigation
      const nextBtn = document.getElementById('btn-next');
      const prevBtn = document.getElementById('btn-prev');
      const skipBtn = document.getElementById('btn-skip');

      if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
      if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
      if (skipBtn) skipBtn.addEventListener('click', () => this.skip());

      // Option cards: clicking a card checks its inner radio and updates aria
      document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
          const radio = card.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            // Update aria-checked on siblings
            const group = card.closest('.options-grid');
            if (group) {
              group.querySelectorAll('.option-card').forEach(c => {
                c.classList.remove('selected');
                c.setAttribute('aria-checked', 'false');
              });
            }
            card.classList.add('selected');
            card.setAttribute('aria-checked', 'true');
          }
        });
        // Keyboard: pressing Enter or Space triggers click
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        });
      });

      // Range sliders — live output update
      const localFood = document.getElementById('onboard-local-food');
      const localOutput = document.getElementById('local-food-output');
      if (localFood && localOutput) {
        localFood.addEventListener('input', () => { localOutput.textContent = localFood.value + '%'; });
      }

      const renewable = document.getElementById('onboard-renewable');
      const renewOutput = document.getElementById('renewable-output');
      if (renewable && renewOutput) {
        renewable.addEventListener('input', () => { renewOutput.textContent = renewable.value + '%'; });
      }

      // Debounced text inputs — auto-save answers as user types
      document.querySelectorAll('.input[type="text"], .input[type="number"]').forEach(input => {
        input.addEventListener('input', () => {
          clearTimeout(_debounceTimer);
          _debounceTimer = setTimeout(() => {
            this._collectAnswers(currentStep);
            this._persistAnswers();
          }, 500);
        });
        input.addEventListener('focus', () => {
          input.select();
        });
      });
    },

    /* ---- Collect Answers ---- */

    /**
     * Read form values for the given step and store in the answers object.
     * @private
     * @param {number} step
     */
    _collectAnswers(step) {
      const val = (id) => {
        const el = document.getElementById(id);
        return el ? this._sanitize(el.value) : '';
      };
      const radio = (name) => {
        const checked = document.querySelector('input[name="' + name + '"]:checked');
        return checked ? checked.value : '';
      };

      switch (step) {
        case 1:
          answers.name = val('onboard-name');
          answers.country = val('onboard-country');
          break;
        case 2:
          answers.transportMode = radio('transportMode');
          answers.commuteDistance = val('onboard-commute');
          answers.flightFrequency = val('onboard-flights');
          break;
        case 3:
          answers.dietType = radio('dietType');
          answers.mealsPerDay = val('onboard-meals');
          answers.localFoodPercent = val('onboard-local-food');
          break;
        case 4:
          answers.homeSize = radio('homeSize');
          answers.energySource = val('onboard-energy-source');
          answers.acHeatingUsage = radio('acHeating');
          answers.renewablePercent = val('onboard-renewable');
          break;
        case 5:
          answers.shoppingFrequency = radio('shoppingFrequency');
          answers.digitalUsageHours = val('onboard-digital');
          answers.recyclingHabit = radio('recycling');
          break;
      }
    },

    /**
     * Restore previously entered values when re-rendering a step.
     * @private
     * @param {number} step
     */
    _restoreValues(step) {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== '') el.value = val;
      };
      const setRadio = (name, val) => {
        if (!val) return;
        const radio = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
        if (radio) {
          radio.checked = true;
          const card = radio.closest('.option-card');
          if (card) {
            card.classList.add('selected');
            card.setAttribute('aria-checked', 'true');
          }
        }
      };

      switch (step) {
        case 1:
          setVal('onboard-name', answers.name);
          setVal('onboard-country', answers.country);
          break;
        case 2:
          setRadio('transportMode', answers.transportMode);
          setVal('onboard-commute', answers.commuteDistance);
          setVal('onboard-flights', answers.flightFrequency);
          break;
        case 3:
          setRadio('dietType', answers.dietType);
          setVal('onboard-meals', answers.mealsPerDay);
          setVal('onboard-local-food', answers.localFoodPercent);
          // Update range output
          if (answers.localFoodPercent) {
            const out = document.getElementById('local-food-output');
            if (out) out.textContent = answers.localFoodPercent + '%';
          }
          break;
        case 4:
          setRadio('homeSize', answers.homeSize);
          setVal('onboard-energy-source', answers.energySource);
          setRadio('acHeating', answers.acHeatingUsage);
          setVal('onboard-renewable', answers.renewablePercent);
          if (answers.renewablePercent) {
            const out = document.getElementById('renewable-output');
            if (out) out.textContent = answers.renewablePercent + '%';
          }
          break;
        case 5:
          setRadio('shoppingFrequency', answers.shoppingFrequency);
          setVal('onboard-digital', answers.digitalUsageHours);
          setRadio('recycling', answers.recyclingHabit);
          break;
      }
    },

    /* ---- Validation Helpers ---- */

    /**
     * Validate a single input field.
     * @private
     * @param {string} id — Element ID
     * @param {string} message — Error message
     * @param {Function} testFn — Predicate receiving the value
     * @returns {boolean}
     */
    _validateField(id, message, testFn) {
      const el = document.getElementById(id);
      if (!el) return true; // element not on this step
      if (!testFn(el.value)) {
        el.classList.add('input--error');
        el.setAttribute('aria-invalid', 'true');
        const errSpan = document.createElement('span');
        errSpan.className = 'input-error-text';
        errSpan.setAttribute('role', 'alert');
        errSpan.textContent = message;
        el.parentNode.appendChild(errSpan);
        return false;
      }
      el.setAttribute('aria-invalid', 'false');
      return true;
    },

    /**
     * Validate that at least one radio in a group is selected.
     * @private
     * @param {string} name — Radio group name
     * @param {string} message — Error message
     * @returns {boolean}
     */
    _validateRadioGroup(name, message) {
      const checked = document.querySelector('input[name="' + name + '"]:checked');
      if (!checked) {
        const group = document.querySelector('input[name="' + name + '"]');
        if (group) {
          const container = group.closest('.options-grid') || group.closest('.onboarding-field');
          if (container) {
            container.classList.add('input--error');
            const errSpan = document.createElement('span');
            errSpan.className = 'input-error-text';
            errSpan.setAttribute('role', 'alert');
            errSpan.textContent = message;
            container.parentNode.appendChild(errSpan);
          }
        }
        return false;
      }
      return true;
    },

    /* ---- Animation Helpers ---- */

    /**
     * Animate a counter from 0 to target value.
     * @private
     * @param {string} elementId
     * @param {number} target
     * @param {number} durationMs
     */
    _animateCounter(elementId, target, durationMs) {
      const el = document.getElementById(elementId);
      if (!el) return;

      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);

        // Format with Utils or toLocaleString
        if (EcoTrack.Utils && typeof EcoTrack.Utils.formatNumber === 'function') {
          el.textContent = EcoTrack.Utils.formatNumber(current);
        } else {
          el.textContent = current.toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    },

    /**
     * Animate a step transition (slide left or right) then invoke callback.
     * @private
     * @param {string} direction — 'left' or 'right'
     * @param {Function} callback
     */
    _animateTransition(direction, callback) {
      const stepEl = document.querySelector('.onboarding-step');
      if (!stepEl) {
        callback();
        return;
      }
      stepEl.classList.add('slide-out-' + direction);
      // After animation completes, render new step
      setTimeout(callback, 300);
    },

    /**
     * Render horizontal breakdown bars for the results page.
     * @private
     */
    _renderBreakdownBars() {
      const container = document.getElementById('results-breakdown-bars');
      if (!container) return;

      // Approximate category breakdown from answers
      const transport = this._estimateCategory('transport');
      const diet = this._estimateCategory('diet');
      const energy = this._estimateCategory('energy');
      const lifestyle = this._estimateCategory('lifestyle');
      const total = transport + diet + energy + lifestyle || 1;

      const categories = [
        { name: 'Transport', value: transport, color: '#3b82f6', icon: '🚗' },
        { name: 'Diet', value: diet, color: '#10b981', icon: '🍽️' },
        { name: 'Home Energy', value: energy, color: '#f59e0b', icon: '🏠' },
        { name: 'Lifestyle', value: lifestyle, color: '#8b5cf6', icon: '🌿' }
      ];

      let html = '<div class="category-breakdown">';
      categories.forEach((cat, i) => {
        const pct = Math.round((cat.value / total) * 100);
        html += `
          <div class="category-card fade-in" style="animation-delay: ${i * 0.15}s; background: var(--eco-surface);">
            <div class="category-card-icon">${cat.icon}</div>
            <div class="category-card-name">${cat.name}</div>
            <div class="category-card-value" style="font-size: 1rem;">${Math.round(cat.value).toLocaleString()} kg</div>
            <div class="category-card-bar">
              <div class="category-card-bar-fill" style="width: ${pct}%; background-color: ${cat.color};"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--eco-text-muted); margin-top: 4px; font-weight: 500;">${pct}%</div>
          </div>`;
      });
      html += '</div>';

      container.innerHTML = html;
    },

    /**
     * Estimate kg CO2 for a single category from answers.
     * @private
     * @param {string} category
     * @returns {number}
     */
    _estimateCategory(category) {
      switch (category) {
        case 'transport': {
          const factors = { car: 0.21, electric_car: 0.05, bus: 0.089, train: 0.041, bike: 0, walk: 0, motorcycle: 0.113 };
          const mode = answers.transportMode || 'car';
          const km = parseFloat(answers.commuteDistance) || 15;
          const flights = parseInt(answers.flightFrequency, 10) || 2;
          return (factors[mode] || 0.21) * km * 2 * 250 + flights * 250;
        }
        case 'diet': {
          const factors = { vegan: 1.5, vegetarian: 2.5, mixed: 3.9, 'high-meat': 5.6 };
          const diet = answers.dietType || 'mixed';
          const meals = parseInt(answers.mealsPerDay, 10) || 3;
          const localPct = parseInt(answers.localFoodPercent, 10) || 30;
          return (factors[diet] || 3.9) * (meals / 3) * 365 * (1 - (localPct / 100) * 0.15);
        }
        case 'energy': {
          const sizeF = { small: 0.7, medium: 1.0, large: 1.5 };
          const srcF = { electricity: 2500, gas: 3000, mixed: 2800, oil: 3500, renewable: 500 };
          const acF = { low: 0.7, moderate: 1.0, high: 1.4 };
          let base = (srcF[answers.energySource] || 2800) *
                     (sizeF[answers.homeSize] || 1.0) *
                     (acF[answers.acHeatingUsage] || 1.0);
          base *= (1 - (parseInt(answers.renewablePercent, 10) || 10) / 100 * 0.8);
          return base;
        }
        case 'lifestyle': {
          const shopF = { rarely: 200, moderate: 600, frequent: 1200 };
          const recycleF = { always: -200, sometimes: -80, rarely: -20, never: 0 };
          const digital = (parseFloat(answers.digitalUsageHours) || 6) * 0.05 * 365;
          return (shopF[answers.shoppingFrequency] || 600) + digital +
                 (recycleF[answers.recyclingHabit] || -80);
        }
        default:
          return 0;
      }
    },

    /* ---- Utility Helpers ---- */

    /**
     * Persist current answers to EcoTrack.Store for resume support.
     * @private
     */
    _persistAnswers() {
      try {
        if (EcoTrack.Store) EcoTrack.Store.setOnboardingData({ answers: answers });
      } catch (e) { /* silent */ }
    },

    /**
     * Sanitize user input — strip HTML tags and trim.
     * @private
     * @param {string} str
     * @returns {string}
     */
    _sanitize(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/<[^>]*>/g, '').trim();
    },

    /**
     * Escape HTML entities for safe interpolation.
     * @private
     * @param {string} str
     * @returns {string}
     */
    _escapeHtml(str) {
      if (typeof str !== 'string') return '';
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return str.replace(/[&<>"']/g, c => map[c]);
    },

    /**
     * Navigate to the dashboard (or emit an event for an SPA router).
     * @private
     */
    _navigateToDashboard() {
      // Use the App controller's onboarding-complete hook (renders shell + navigates)
      if (EcoTrack.App && typeof EcoTrack.App.onOnboardingComplete === 'function') {
        EcoTrack.App.onOnboardingComplete();
      } else if (typeof window !== 'undefined') {
        // Fallback: reload page so App.init() picks up the completed flag
        window.location.reload();
      }
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
