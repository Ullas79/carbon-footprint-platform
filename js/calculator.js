/**
 * EcoTrack — Carbon Emission Calculator Module
 *
 * Houses all emission factors and provides functions to compute, compare,
 * and break down carbon footprints. Every factor is expressed in
 * kg CO₂e per unit (km, kg, kWh, item, hour, etc.).
 *
 * Depends on: EcoTrack.Utils (formatNumber)
 *
 * @namespace EcoTrack.Calculator
 */

window.EcoTrack = window.EcoTrack || {};

EcoTrack.Calculator = (() => {
  'use strict';

  // ─── Emission Factors (kg CO₂e per unit) ────────────────────────────
  // Sources: DEFRA, IEA, IPCC, Our World In Data (simplified averages).

  /**
   * Complete emission factor database, grouped by category.
   * Each entry maps an activity type to its per-unit CO₂e in kilograms.
   *
   * @type {Object<string, Object<string, number>>}
   */
  const EMISSION_FACTORS = Object.freeze({

    // ── Transport (per km) ───────────────────────────────────────────
    transport: Object.freeze({
      car_petrol:            0.21,
      car_diesel:            0.17,
      car_electric:          0.05,
      bus:                   0.089,
      train:                 0.041,
      subway:                0.033,
      flight_domestic:       0.255,
      flight_international:  0.195,
      motorcycle:            0.113,
      bicycle:               0,
      walking:               0,
      carpool:               0.105,
      taxi:                  0.21,
      ebike:                 0.005
    }),

    // ── Food (per kg / per unit) ─────────────────────────────────────
    food: Object.freeze({
      beef:              27.0,
      lamb:              39.2,
      pork:              12.1,
      chicken:            6.9,
      fish:               6.1,
      eggs:               4.8,
      dairy_milk:         3.2,   // per litre
      cheese:            13.5,
      rice:               2.7,
      vegetables:         2.0,
      fruits:             1.1,
      bread:              0.8,
      nuts:               0.3,
      coffee:             0.21,  // per cup
      tea:                0.02,  // per cup
      bottled_water:      0.16,  // per bottle
      vegan_meal:         0.7,   // per meal
      vegetarian_meal:    1.7,   // per meal
      average_meal:       2.5,   // per meal
      high_meat_meal:     7.2    // per meal
    }),

    // ── Energy (per kWh, m³, litre, etc.) ────────────────────────────
    energy: Object.freeze({
      electricity:        0.233, // global average per kWh
      natural_gas:        2.0,   // per m³
      heating_oil:        2.96,  // per litre
      lpg:                1.51,  // per litre
      solar:              0.02,  // per kWh
      wind:               0.01,  // per kWh
      ac_hour:            1.5,   // per hour
      heater_hour:        2.0,   // per hour
      washing_machine:    0.6,   // per load
      dishwasher:         1.0,   // per load
      dryer:              2.4,   // per load
      shower_5min:        0.525, // per occurrence
      bath:               1.7    // per occurrence
    }),

    // ── Shopping (per item / per order) ──────────────────────────────
    shopping: Object.freeze({
      clothing_item:      10,
      electronics_small:  50,
      electronics_large:  200,
      furniture:          100,
      plastic_bag:        0.033,
      online_order:       0.5
    }),

    // ── Digital (per email / per hour / per GB/month) ────────────────
    digital: Object.freeze({
      email:              0.004,
      video_streaming:    0.036,
      video_call:         0.156,
      cloud_storage:      0.2,   // per GB/month
      social_media:       0.02,
      gaming:             0.06,
      web_browsing:       0.02
    })
  });

  // ─── Unit Labels ────────────────────────────────────────────────────

  /**
   * Human-readable unit strings for every activity type.
   * @type {Object<string, Object<string, string>>}
   */
  const UNIT_LABELS = Object.freeze({
    transport: Object.freeze({
      car_petrol:           'km',
      car_diesel:           'km',
      car_electric:         'km',
      bus:                  'km',
      train:                'km',
      subway:               'km',
      flight_domestic:      'km',
      flight_international: 'km',
      motorcycle:           'km',
      bicycle:              'km',
      walking:              'km',
      carpool:              'km',
      taxi:                 'km',
      ebike:                'km'
    }),
    food: Object.freeze({
      beef:             'kg',
      lamb:             'kg',
      pork:             'kg',
      chicken:          'kg',
      fish:             'kg',
      eggs:             'kg',
      dairy_milk:       'litres',
      cheese:           'kg',
      rice:             'kg',
      vegetables:       'kg',
      fruits:           'kg',
      bread:            'kg',
      nuts:             'kg',
      coffee:           'cups',
      tea:              'cups',
      bottled_water:    'bottles',
      vegan_meal:       'meals',
      vegetarian_meal:  'meals',
      average_meal:     'meals',
      high_meat_meal:   'meals'
    }),
    energy: Object.freeze({
      electricity:      'kWh',
      natural_gas:      'm³',
      heating_oil:      'litres',
      lpg:              'litres',
      solar:            'kWh',
      wind:             'kWh',
      ac_hour:          'hours',
      heater_hour:      'hours',
      washing_machine:  'loads',
      dishwasher:       'loads',
      dryer:            'loads',
      shower_5min:      'times',
      bath:             'times'
    }),
    shopping: Object.freeze({
      clothing_item:     'items',
      electronics_small: 'items',
      electronics_large: 'items',
      furniture:         'items',
      plastic_bag:       'bags',
      online_order:      'orders'
    }),
    digital: Object.freeze({
      email:            'emails',
      video_streaming:  'hours',
      video_call:       'hours',
      cloud_storage:    'GB/month',
      social_media:     'hours',
      gaming:           'hours',
      web_browsing:     'hours'
    })
  });

  // ─── Human-Readable Names ──────────────────────────────────────────

  /**
   * Pretty-printed display names for activity types.
   * @type {Object<string, Object<string, string>>}
   */
  const DISPLAY_NAMES = Object.freeze({
    transport: Object.freeze({
      car_petrol:           'Car (Petrol)',
      car_diesel:           'Car (Diesel)',
      car_electric:         'Car (Electric)',
      bus:                  'Bus',
      train:                'Train',
      subway:               'Subway / Metro',
      flight_domestic:      'Domestic Flight',
      flight_international: 'International Flight',
      motorcycle:           'Motorcycle',
      bicycle:              'Bicycle',
      walking:              'Walking',
      carpool:              'Carpool',
      taxi:                 'Taxi / Rideshare',
      ebike:                'E-Bike'
    }),
    food: Object.freeze({
      beef:             'Beef',
      lamb:             'Lamb',
      pork:             'Pork',
      chicken:          'Chicken',
      fish:             'Fish',
      eggs:             'Eggs',
      dairy_milk:       'Dairy Milk',
      cheese:           'Cheese',
      rice:             'Rice',
      vegetables:       'Vegetables',
      fruits:           'Fruits',
      bread:            'Bread',
      nuts:             'Nuts',
      coffee:           'Coffee',
      tea:              'Tea',
      bottled_water:    'Bottled Water',
      vegan_meal:       'Vegan Meal',
      vegetarian_meal:  'Vegetarian Meal',
      average_meal:     'Average Meal',
      high_meat_meal:   'High Meat Meal'
    }),
    energy: Object.freeze({
      electricity:      'Electricity',
      natural_gas:      'Natural Gas',
      heating_oil:      'Heating Oil',
      lpg:              'LPG',
      solar:            'Solar Energy',
      wind:             'Wind Energy',
      ac_hour:          'Air Conditioning',
      heater_hour:      'Heater',
      washing_machine:  'Washing Machine',
      dishwasher:       'Dishwasher',
      dryer:            'Dryer',
      shower_5min:      '5-min Shower',
      bath:             'Bath'
    }),
    shopping: Object.freeze({
      clothing_item:     'Clothing',
      electronics_small: 'Small Electronics',
      electronics_large: 'Large Electronics',
      furniture:         'Furniture',
      plastic_bag:       'Plastic Bag',
      online_order:      'Online Order'
    }),
    digital: Object.freeze({
      email:            'Email',
      video_streaming:  'Video Streaming',
      video_call:       'Video Call',
      cloud_storage:    'Cloud Storage',
      social_media:     'Social Media',
      gaming:           'Gaming',
      web_browsing:     'Web Browsing'
    })
  });

  // ─── Country Averages (tonnes CO₂/year per person) ──────────────────

  /**
   * Average annual carbon footprints by country/region.
   * @type {Object<string, number>}
   */
  const COUNTRY_AVERAGES = Object.freeze({
    global:    4.8,
    us:       15.5,
    eu:        6.8,
    uk:        5.5,
    india:     1.9,
    china:     7.4,
    japan:     9.0,
    australia: 15.4,
    canada:   14.2,
    brazil:    2.2,
    germany:   8.9,
    france:    5.2
  });

  // ─── Core Calculation Functions ─────────────────────────────────────

  /**
   * Calculate the CO₂e for a single activity.
   *
   * @param {string} category — Category key (transport, food, …).
   * @param {string} type     — Activity type within that category.
   * @param {number} value    — Quantity in the relevant unit.
   * @returns {number} kg CO₂e, rounded to 3 decimals. Returns 0 on error.
   *
   * @example
   * calculateActivity('transport', 'car_petrol', 50); // 10.5
   */
  function calculateActivity(category, type, value) {
    try {
      const factor = EMISSION_FACTORS[category]?.[type];

      if (factor === undefined) {
        console.warn(`[EcoTrack.Calculator] Unknown activity: ${category}/${type}`);
        return 0;
      }

      const qty = Number(value);
      if (Number.isNaN(qty) || qty < 0) return 0;

      return parseFloat((factor * qty).toFixed(3));
    } catch (err) {
      console.error('[EcoTrack.Calculator] calculateActivity error:', err);
      return 0;
    }
  }

  /**
   * Sum CO₂e for an array of activities within a single day.
   *
   * @param {Array<Object>} activities — Each must have a `co2` field.
   * @returns {number} Total kg CO₂e for the day.
   */
  function calculateDailyFootprint(activities) {
    if (!Array.isArray(activities)) return 0;
    const total = activities.reduce((sum, a) => sum + (Number(a.co2) || 0), 0);
    return parseFloat(total.toFixed(3));
  }

  /**
   * Sum CO₂e for an array of activities spanning a month.
   *
   * @param {Array<Object>} activities — Each must have a `co2` field.
   * @returns {number} Total kg CO₂e for the month.
   */
  function calculateMonthlyFootprint(activities) {
    if (!Array.isArray(activities)) return 0;
    const total = activities.reduce((sum, a) => sum + (Number(a.co2) || 0), 0);
    return parseFloat(total.toFixed(3));
  }

  /**
   * Estimate yearly CO₂e from a monthly average.
   *
   * @param {number} monthlyAvg — Average monthly CO₂e in kg.
   * @returns {number} Estimated yearly CO₂e in kg.
   */
  function calculateYearlyEstimate(monthlyAvg) {
    return parseFloat(((Number(monthlyAvg) || 0) * 12).toFixed(2));
  }

  // ─── Onboarding Estimate ───────────────────────────────────────────

  /**
   * Estimate a user's annual carbon footprint from onboarding questionnaire
   * answers. This gives a rough baseline before they start logging.
   *
   * Expected answer keys (all optional, sensible defaults used):
   * - `transportMode`  : primary transport ('car_petrol', 'bus', 'train', …)
   * - `dailyCommute`   : round-trip km per day
   * - `flightsPerYear` : number of domestic-equivalent flights
   * - `flightAvgKm`    : average km per flight
   * - `dietType`       : 'vegan', 'vegetarian', 'average', 'high_meat'
   * - `mealsPerDay`    : number of meals (default 3)
   * - `electricityKwh` : monthly electricity in kWh
   * - `heatingType`    : 'natural_gas', 'electricity', 'heating_oil', 'lpg'
   * - `heatingMonths`  : months of heating per year
   * - `shoppingHabit`  : 'minimal', 'average', 'frequent'
   * - `screenHours`    : daily screen hours (digital footprint)
   *
   * @param {Object} answers — Questionnaire answers.
   * @returns {Object} `{ yearly, monthly, daily, breakdown }`
   */
  function calculateOnboardingFootprint(answers = {}) {
    try {
      let transport = 0;
      let food      = 0;
      let energy    = 0;
      let shopping  = 0;
      let digital   = 0;

      // ── Transport ──────────────────────────────────────────────
      const mode        = answers.transportMode || 'car_petrol';
      const dailyKm     = Number(answers.dailyCommute) || 0;
      const workDays    = 260; // ~5 days × 52 weeks
      const transportFactor = EMISSION_FACTORS.transport[mode] || 0.21;
      transport += transportFactor * dailyKm * workDays;

      // Flights
      const flights  = Number(answers.flightsPerYear) || 0;
      const flightKm = Number(answers.flightAvgKm) || 1000;
      transport += EMISSION_FACTORS.transport.flight_domestic * flightKm * flights;

      // ── Food ───────────────────────────────────────────────────
      const dietMap = {
        vegan:      'vegan_meal',
        vegetarian: 'vegetarian_meal',
        average:    'average_meal',
        high_meat:  'high_meat_meal'
      };
      const mealType   = dietMap[answers.dietType] || 'average_meal';
      const mealsPerDay = Number(answers.mealsPerDay) || 3;
      const mealFactor  = EMISSION_FACTORS.food[mealType] || 2.5;
      food = mealFactor * mealsPerDay * 365;

      // ── Energy ─────────────────────────────────────────────────
      const monthlyKwh = Number(answers.electricityKwh) || 250;
      energy += EMISSION_FACTORS.energy.electricity * monthlyKwh * 12;

      const heatingType   = answers.heatingType || 'natural_gas';
      const heatingMonths = Number(answers.heatingMonths) || 6;
      const heatingFactor = EMISSION_FACTORS.energy[heatingType] || 2.0;
      // Rough estimate: 80 units/month for heating
      energy += heatingFactor * 80 * heatingMonths;

      // ── Shopping ───────────────────────────────────────────────
      const shoppingMultiplier = {
        minimal:  0.5,
        average:  1.0,
        frequent: 2.0
      };
      const shopMul = shoppingMultiplier[answers.shoppingHabit] || 1.0;
      // Baseline: ~4 clothing + 2 small electronics + 1 large + 50 online orders
      shopping = (
        EMISSION_FACTORS.shopping.clothing_item     * 4  +
        EMISSION_FACTORS.shopping.electronics_small  * 2  +
        EMISSION_FACTORS.shopping.electronics_large  * 1  +
        EMISSION_FACTORS.shopping.online_order       * 50
      ) * shopMul;

      // ── Digital ────────────────────────────────────────────────
      const screenHours = Number(answers.screenHours) || 4;
      // Weighted blend of streaming, social, browsing
      const avgDigitalFactor =
        (EMISSION_FACTORS.digital.video_streaming +
         EMISSION_FACTORS.digital.social_media    +
         EMISSION_FACTORS.digital.web_browsing) / 3;
      digital = avgDigitalFactor * screenHours * 365;

      // ── Aggregate ──────────────────────────────────────────────
      const yearly = parseFloat(
        (transport + food + energy + shopping + digital).toFixed(2)
      );

      return {
        yearly,
        monthly:   parseFloat((yearly / 12).toFixed(2)),
        daily:     parseFloat((yearly / 365).toFixed(2)),
        breakdown: {
          transport: parseFloat(transport.toFixed(2)),
          food:      parseFloat(food.toFixed(2)),
          energy:    parseFloat(energy.toFixed(2)),
          shopping:  parseFloat(shopping.toFixed(2)),
          digital:   parseFloat(digital.toFixed(2))
        }
      };
    } catch (err) {
      console.error('[EcoTrack.Calculator] onboarding calculation failed:', err);
      return { yearly: 0, monthly: 0, daily: 0, breakdown: {} };
    }
  }

  // ─── Breakdown & Lookup ─────────────────────────────────────────────

  /**
   * Group activities by category and return absolute + percentage breakdown.
   *
   * @param {Array<Object>} activities — Activities with `category` and `co2`.
   * @returns {Object<string, { kg: number, percentage: number }>}
   *
   * @example
   * getCategoryBreakdown(myActivities);
   * // { transport: { kg: 12.5, percentage: 42.3 }, food: { … }, … }
   */
  function getCategoryBreakdown(activities) {
    if (!Array.isArray(activities) || activities.length === 0) return {};

    const totals   = {};
    let grandTotal = 0;

    for (const a of activities) {
      const cat = a.category || 'other';
      totals[cat] = (totals[cat] || 0) + (Number(a.co2) || 0);
      grandTotal += Number(a.co2) || 0;
    }

    const breakdown = {};
    for (const [cat, kg] of Object.entries(totals)) {
      breakdown[cat] = {
        kg:         parseFloat(kg.toFixed(2)),
        percentage: grandTotal > 0
          ? parseFloat(((kg / grandTotal) * 100).toFixed(1))
          : 0
      };
    }

    return breakdown;
  }

  /**
   * Return the list of activity types available for a category, each with
   * its display name, unit, and emission factor.
   *
   * @param {string} category — Category key.
   * @returns {Array<{ type: string, name: string, unit: string, factor: number }>}
   */
  function getActivityOptions(category) {
    const factors = EMISSION_FACTORS[category];
    if (!factors) return [];

    return Object.entries(factors).map(([type, factor]) => ({
      type,
      name:   DISPLAY_NAMES[category]?.[type] || type,
      unit:   UNIT_LABELS[category]?.[type]   || 'units',
      factor
    }));
  }

  /**
   * Return the human-readable unit label for an activity type.
   *
   * @param {string} category — Category key.
   * @param {string} type     — Activity type.
   * @returns {string} Unit label (e.g. 'km', 'kg', 'kWh').
   */
  function getUnit(category, type) {
    return UNIT_LABELS[category]?.[type] || 'units';
  }

  // ─── Comparison & Offset ────────────────────────────────────────────

  /**
   * Compare a user's yearly footprint to their country's average.
   *
   * @param {number} yearlyKg — User's annual CO₂e in **kg**.
   * @param {string} [country='global'] — Country key (lowercase).
   * @returns {Object} `{ userTonnes, averageTonnes, differencePercent, status }`
   */
  function compareToAverage(yearlyKg, country = 'global') {
    const userTonnes    = parseFloat(((Number(yearlyKg) || 0) / 1000).toFixed(2));
    const averageTonnes = COUNTRY_AVERAGES[country.toLowerCase()] || COUNTRY_AVERAGES.global;
    const diff          = userTonnes - averageTonnes;
    const diffPercent   = averageTonnes > 0
      ? parseFloat(((diff / averageTonnes) * 100).toFixed(1))
      : 0;

    let status;
    if (diffPercent <= -20)     status = 'excellent';
    else if (diffPercent <= 0)  status = 'good';
    else if (diffPercent <= 20) status = 'average';
    else                        status = 'high';

    return {
      userTonnes,
      averageTonnes,
      differencePercent: diffPercent,
      status
    };
  }

  /**
   * Estimate the number of trees required to offset a given CO₂ amount.
   * Rule of thumb: 1 mature tree absorbs ≈ 22 kg CO₂ per year.
   *
   * @param {number} kgCO2 — CO₂ in kilograms.
   * @returns {number} Number of trees (rounded up).
   */
  function treesNeededToOffset(kgCO2) {
    const CO2_PER_TREE_PER_YEAR = 22;
    const kg = Number(kgCO2) || 0;
    return Math.ceil(Math.max(0, kg) / CO2_PER_TREE_PER_YEAR);
  }

  /**
   * Return the full table of country averages.
   *
   * @returns {Object<string, number>} Country key → tonnes CO₂/year.
   */
  function getCountryAverages() {
    return { ...COUNTRY_AVERAGES };
  }

  // ─── Public API ─────────────────────────────────────────────────────

  return Object.freeze({
    // Emission factor data (read-only)
    EMISSION_FACTORS,
    UNIT_LABELS,
    DISPLAY_NAMES,
    COUNTRY_AVERAGES,

    // Core calculations
    calculateActivity,
    calculateDailyFootprint,
    calculateMonthlyFootprint,
    calculateYearlyEstimate,
    calculateOnboardingFootprint,

    // Breakdowns & lookups
    getCategoryBreakdown,
    getActivityOptions,
    getUnit,

    // Comparison
    compareToAverage,
    treesNeededToOffset,
    getCountryAverages
  });
})();
