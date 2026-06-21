/**
 * EcoTrack Test Runner & Test Suites
 * Implements a lightweight BDD-style test framework (describe, it, expect)
 * and runs 70+ assertions across all platform modules.
 */

const TestRunner = (() => {
  'use strict';

  const suites = [];
  let currentSuite = null;
  let passedCount = 0;
  let failedCount = 0;
  let currentTestFailed = false;
  let currentTestAssertions = 0;
  const reports = [];

  function describe(suiteName, fn) {
    const suite = {
      name: suiteName,
      tests: [],
      beforeEach: null,
      afterEach: null
    };
    suites.push(suite);
    currentSuite = suite;
    fn();
    currentSuite = null;
  }

  function beforeEach(fn) {
    if (currentSuite) currentSuite.beforeEach = fn;
  }

  function afterEach(fn) {
    if (currentSuite) currentSuite.afterEach = fn;
  }

  function it(testName, fn) {
    if (currentSuite) {
      currentSuite.tests.push({
        name: testName,
        fn: fn
      });
    }
  }

  function expect(actual) {
    return {
      toBe(expected, message = '') {
        currentTestAssertions++;
        if (actual === expected) {
          // Pass
        } else {
          currentTestFailed = true;
          throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toBeCloseTo(expected, precision = 2, message = '') {
        currentTestAssertions++;
        const diff = Math.abs(actual - expected);
        const threshold = Math.pow(10, -precision) / 2;
        if (diff < threshold) {
          // Pass
        } else {
          currentTestFailed = true;
          throw new Error(`${message || 'Assertion failed'}: expected close to ${expected} (diff < ${threshold}), got ${actual}`);
        }
      },
      toBeTruthy(message = '') {
        currentTestAssertions++;
        if (actual) {
          // Pass
        } else {
          currentTestFailed = true;
          throw new Error(`${message || 'Assertion failed'}: expected truthy, got ${actual}`);
        }
      },
      toBeFalsy(message = '') {
        currentTestAssertions++;
        if (!actual) {
          // Pass
        } else {
          currentTestFailed = true;
          throw new Error(`${message || 'Assertion failed'}: expected falsy, got ${actual}`);
        }
      },
      toThrow(message = '') {
        currentTestAssertions++;
        let threw = false;
        try {
          actual();
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          currentTestFailed = true;
          throw new Error(`${message || 'Assertion failed'}: expected function to throw`);
        }
      },
      toContain(item, message = '') {
        currentTestAssertions++;
        if (Array.isArray(actual) && actual.includes(item)) {
          // Pass
        } else if (typeof actual === 'string' && actual.includes(item)) {
          // Pass
        } else {
          currentTestFailed = true;
          throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
        }
      }
    };
  }

  async function run() {
    passedCount = 0;
    failedCount = 0;
    reports.length = 0;

    for (const suite of suites) {
      const suiteReport = {
        name: suite.name,
        tests: []
      };
      reports.push(suiteReport);

      for (const test of suite.tests) {
        currentTestFailed = false;
        currentTestAssertions = 0;
        let errorMessage = null;

        try {
          if (suite.beforeEach) await suite.beforeEach();
          await test.fn();
          if (suite.afterEach) await suite.afterEach();
        } catch (err) {
          currentTestFailed = true;
          errorMessage = err.message || err.toString();
        }

        if (currentTestFailed) {
          failedCount++;
          suiteReport.tests.push({
            name: test.name,
            passed: false,
            error: errorMessage,
            assertions: currentTestAssertions
          });
        } else {
          passedCount++;
          suiteReport.tests.push({
            name: test.name,
            passed: true,
            assertions: currentTestAssertions
          });
        }
      }
    }

    return {
      passed: passedCount,
      failed: failedCount,
      reports: reports
    };
  }

  return {
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
    run
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// --- 1. Utils Module ---
TestRunner.describe('EcoTrack.Utils Module', () => {
  TestRunner.it('should format numbers with commas and decimals correctly', () => {
    TestRunner.expect(EcoTrack.Utils.formatNumber(1234.56, 1)).toBe('1,234.6');
    TestRunner.expect(EcoTrack.Utils.formatNumber(1234567, 0)).toBe('1,234,567');
    TestRunner.expect(EcoTrack.Utils.formatNumber(NaN)).toBe('0');
    TestRunner.expect(EcoTrack.Utils.formatNumber(undefined)).toBe('0');
    TestRunner.expect(EcoTrack.Utils.formatNumber(0, 2)).toBe('0.00');
  });

  TestRunner.it('should format CO2 values with human-friendly units', () => {
    TestRunner.expect(EcoTrack.Utils.formatCO2(12.34)).toBe('12.3 kg CO₂');
    TestRunner.expect(EcoTrack.Utils.formatCO2(0)).toBe('0.0 kg CO₂');
    TestRunner.expect(EcoTrack.Utils.formatCO2(1000)).toBe('1.0 tonnes CO₂');
    TestRunner.expect(EcoTrack.Utils.formatCO2(2540.6)).toBe('2.5 tonnes CO₂');
    TestRunner.expect(EcoTrack.Utils.formatCO2(NaN)).toBe('0 kg CO₂');
  });

  TestRunner.it('should format dates as expected and handle invalid dates', () => {
    TestRunner.expect(EcoTrack.Utils.formatDate('2026-06-21')).toBe('Jun 21, 2026');
    TestRunner.expect(EcoTrack.Utils.formatDate('invalid-date')).toBe('');
    TestRunner.expect(EcoTrack.Utils.formatDate(null)).toBe('');
  });

  TestRunner.it('should format relative dates correctly', () => {
    const now = Date.now();
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 1000)).toBe('just now');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 45 * 1000)).toBe('45 seconds ago');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 60 * 1000)).toBe('1 minute ago');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 15 * 60 * 1000)).toBe('15 minutes ago');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 60 * 60 * 1000)).toBe('1 hour ago');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 5 * 60 * 60 * 1000)).toBe('5 hours ago');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 24 * 60 * 60 * 1000)).toBe('yesterday');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate(now - 3 * 24 * 60 * 60 * 1000)).toBe('3 days ago');
    TestRunner.expect(EcoTrack.Utils.formatRelativeDate('invalid')).toBe('');
  });

  TestRunner.it('should generate unique IDs', () => {
    const id1 = EcoTrack.Utils.generateId();
    const id2 = EcoTrack.Utils.generateId();
    TestRunner.expect(typeof id1).toBe('string');
    TestRunner.expect(id1.length > 5).toBeTruthy();
    TestRunner.expect(id1 !== id2).toBeTruthy();
  });

  TestRunner.it('should sanitize input strings to prevent HTML injection / XSS', () => {
    const evil = '<script>alert("xss")</script>';
    const safe = EcoTrack.Utils.sanitizeInput(evil);
    TestRunner.expect(safe.indexOf('<script>')).toBe(-1);
    TestRunner.expect(safe.indexOf('&lt;script&gt;')).toBe(0);
    TestRunner.expect(EcoTrack.Utils.sanitizeInput(null)).toBe('');
    TestRunner.expect(EcoTrack.Utils.sanitizeInput(123)).toBe('');
  });

  TestRunner.it('should clamp numbers to borders correctly', () => {
    TestRunner.expect(EcoTrack.Utils.clamp(5, 0, 10)).toBe(5);
    TestRunner.expect(EcoTrack.Utils.clamp(-10, 0, 10)).toBe(0);
    TestRunner.expect(EcoTrack.Utils.clamp(20, 0, 10)).toBe(10);
    TestRunner.expect(EcoTrack.Utils.clamp('5', 0, 10)).toBe(5);
    TestRunner.expect(EcoTrack.Utils.clamp(NaN, 0, 10)).toBe(0);
  });

  TestRunner.it('should linearly interpolate values (lerp)', () => {
    TestRunner.expect(EcoTrack.Utils.lerp(10, 20, 0.5)).toBe(15);
    TestRunner.expect(EcoTrack.Utils.lerp(10, 20, 0)).toBe(10);
    TestRunner.expect(EcoTrack.Utils.lerp(10, 20, 1)).toBe(20);
    TestRunner.expect(EcoTrack.Utils.lerp(10, 20, -0.5)).toBe(10); // clamps t to 0
    TestRunner.expect(EcoTrack.Utils.lerp(10, 20, 1.5)).toBe(20);  // clamps t to 1
  });

  TestRunner.it('should calculate start of day timestamp', () => {
    const d = new Date();
    const ts = EcoTrack.Utils.startOfDay(d);
    const expected = new Date(d);
    expected.setHours(0, 0, 0, 0);
    TestRunner.expect(ts).toBe(expected.getTime());
  });

  TestRunner.it('should clone JSON objects (deepClone)', () => {
    const orig = { a: 1, b: { c: [2, 3] } };
    const clone = EcoTrack.Utils.deepClone(orig);
    TestRunner.expect(clone.a).toBe(1);
    TestRunner.expect(clone.b.c[0]).toBe(2);
    TestRunner.expect(clone !== orig).toBeTruthy();
    TestRunner.expect(clone.b !== orig.b).toBeTruthy();
  });
});

// --- 2. Calculator Module ---
TestRunner.describe('EcoTrack.Calculator Module', () => {
  TestRunner.it('should calculate correct CO2 emissions for transport', () => {
    const co2 = EcoTrack.Calculator.calculateActivity('transport', 'car_petrol', 10);
    TestRunner.expect(co2).toBeCloseTo(2.1); // 10 km * 0.21 kg/km
    
    const bike = EcoTrack.Calculator.calculateActivity('transport', 'bicycle', 10);
    TestRunner.expect(bike).toBe(0); // 0 emission
  });

  TestRunner.it('should compare food diet impact correctly', () => {
    const vegan = EcoTrack.Calculator.calculateActivity('food', 'vegan_meal', 1);
    const mixed = EcoTrack.Calculator.calculateActivity('food', 'high_meat_meal', 1);
    TestRunner.expect(vegan < mixed).toBeTruthy('Vegan meal CO2 should be less than high meat meal CO2');
  });

  TestRunner.it('should handle invalid/edge cases gracefully', () => {
    const invalidCat = EcoTrack.Calculator.calculateActivity('spaceships', 'rocket', 1);
    TestRunner.expect(invalidCat).toBe(0);

    const invalidType = EcoTrack.Calculator.calculateActivity('transport', 'ufo', 10);
    TestRunner.expect(invalidType).toBe(0);

    const zeroValue = EcoTrack.Calculator.calculateActivity('transport', 'car_petrol', 0);
    TestRunner.expect(zeroValue).toBe(0);

    const negativeValue = EcoTrack.Calculator.calculateActivity('transport', 'car_petrol', -10);
    TestRunner.expect(negativeValue).toBe(0);
  });

  TestRunner.it('should correctly fetch country averages', () => {
    const avgs = EcoTrack.Calculator.getCountryAverages();
    TestRunner.expect(avgs.us > avgs.india).toBeTruthy('US average should be higher than India average');
    TestRunner.expect(avgs.global > 0).toBeTruthy('Global average must be positive');
  });

  TestRunner.it('should compare user annual footprint to country average', () => {
    const comp = EcoTrack.Calculator.compareToAverage(5500, 'uk');
    TestRunner.expect(comp.userTonnes).toBe(5.5);
    TestRunner.expect(comp.averageTonnes).toBe(5.5); // UK avg in country list is 5.5
    TestRunner.expect(comp.differencePercent).toBe(0);
    TestRunner.expect(comp.status).toBe('good');
  });

  TestRunner.it('should calculate trees needed to offset CO2 emissions', () => {
    // 22 kg per tree per year
    TestRunner.expect(EcoTrack.Calculator.treesNeededToOffset(220)).toBe(10);
    TestRunner.expect(EcoTrack.Calculator.treesNeededToOffset(0)).toBe(0);
    TestRunner.expect(EcoTrack.Calculator.treesNeededToOffset(-50)).toBe(0);
  });
});

// --- 3. Store Module ---
TestRunner.describe('EcoTrack.Store Module', () => {
  const TEST_ACTIVITY = {
    id: 'test-act-123',
    timestamp: new Date().toISOString(),
    category: 'food',
    type: 'vegetarian_meal',
    value: 1,
    unit: 'meals',
    co2: 1.5
  };

  TestRunner.beforeEach(() => {
    // Clean up test data
    localStorage.removeItem('ecotrack_data');
    localStorage.removeItem('ecotrack_activities');
    localStorage.removeItem('ecotrack_userProfile');
    localStorage.removeItem('ecotrack_streak');
    localStorage.removeItem('ecotrack_badges');
    EcoTrack.Store.init();
  });

  TestRunner.afterEach(() => {
    localStorage.removeItem('ecotrack_data');
    localStorage.removeItem('ecotrack_activities');
    localStorage.removeItem('ecotrack_userProfile');
    localStorage.removeItem('ecotrack_streak');
    localStorage.removeItem('ecotrack_badges');
    EcoTrack.Store.init();
  });

  TestRunner.it('should set and get local storage items with prefix', () => {
    EcoTrack.Store.set('__test_key__', { foo: 'bar' });
    const val = EcoTrack.Store.get('__test_key__');
    TestRunner.expect(val.foo).toBe('bar');
    localStorage.removeItem('ecotrack___test_key__');
  });

  TestRunner.it('should add, get and delete activities successfully', () => {
    EcoTrack.Store.addActivity(TEST_ACTIVITY);
    const list = EcoTrack.Store.getActivities();
    TestRunner.expect(list.length).toBe(1);
    TestRunner.expect(list[0].id).toBe('test-act-123');

    EcoTrack.Store.removeActivity('test-act-123');
    const list2 = EcoTrack.Store.getActivities();
    TestRunner.expect(list2.length).toBe(0);
  });

  TestRunner.it('should update and retrieve streak statistics', () => {
    EcoTrack.Store.updateStreak();
    const streak = EcoTrack.Store.getStreak();
    TestRunner.expect(typeof streak).toBe('object');
    TestRunner.expect(streak.current >= 0).toBeTruthy();
  });

  TestRunner.it('should save and get user profile settings', () => {
    EcoTrack.Store.setUserProfile({ name: 'Alice', country: 'de' });
    const profile = EcoTrack.Store.getUserProfile();
    TestRunner.expect(profile.name).toBe('Alice');
    TestRunner.expect(profile.country).toBe('de');
  });

  TestRunner.it('should clear all data properly', () => {
    EcoTrack.Store.addActivity(TEST_ACTIVITY);
    EcoTrack.Store.setUserProfile({ name: 'Bob' });
    
    EcoTrack.Store.clearAllData();
    
    TestRunner.expect(EcoTrack.Store.getActivities().length).toBe(0);
    TestRunner.expect(EcoTrack.Store.getUserProfile() && EcoTrack.Store.getUserProfile().name === '').toBeTruthy();
  });
});

// --- 4. Tracker Module ---
TestRunner.describe('EcoTrack.Tracker Module', () => {
  TestRunner.beforeEach(() => {
    localStorage.removeItem('ecotrack_data');
    localStorage.removeItem('ecotrack_activities');
    EcoTrack.Store.init();
  });

  TestRunner.it('should return empty list when no activities logged today', () => {
    const list = EcoTrack.Tracker.getTodayActivities();
    TestRunner.expect(list.length).toBe(0);
  });

  TestRunner.it('should resolve human-friendly labels for activities', () => {
    TestRunner.expect(EcoTrack.Tracker.getActivityLabel('transport', 'car_petrol')).toBe('Car (Petrol)');
    TestRunner.expect(EcoTrack.Tracker.getActivityLabel('transport', 'bus')).toBe('Bus');
    TestRunner.expect(EcoTrack.Tracker.getActivityLabel('invalid', 'ufo')).toBe('ufo');
  });

  TestRunner.it('should log activities successfully', () => {
    EcoTrack.Tracker.logActivity('transport', 'bus', 15);
    const today = EcoTrack.Tracker.getTodayActivities();
    TestRunner.expect(today.length).toBe(1);
    TestRunner.expect(today[0].category).toBe('transport');
    TestRunner.expect(today[0].type).toBe('bus');
    TestRunner.expect(today[0].value).toBe(15);
  });
});

// --- 5. Challenges Module ---
TestRunner.describe('EcoTrack.Challenges Module', () => {
  TestRunner.beforeEach(() => {
    localStorage.removeItem('ecotrack_data');
    localStorage.removeItem('ecotrack_challenges');
    localStorage.removeItem('ecotrack_userProfile');
    EcoTrack.Store.init();
    EcoTrack.Challenges.init();
  });

  TestRunner.it('should return level info based on XP points', () => {
    const lvl1 = EcoTrack.Challenges.getLevelInfo(0);
    TestRunner.expect(lvl1.level).toBe(1);
    TestRunner.expect(lvl1.progressPercent).toBe(0);

    const lvl2 = EcoTrack.Challenges.getLevelInfo(150); // level 2 starts at 100 XP
    TestRunner.expect(lvl2.level).toBe(2);
    TestRunner.expect(lvl2.progressPercent).toBe(25); // (150-100)/(300-100) = 50/200 = 25%
  });

  TestRunner.it('should retrieve badges details', () => {
    const badge = EcoTrack.Challenges.getBadgeInfo('first-log');
    TestRunner.expect(badge !== null).toBeTruthy();
    TestRunner.expect(badge.name).toBe('First Step');
  });

  TestRunner.it('should allow joining challenges and tracking active list', () => {
    const initial = EcoTrack.Challenges.getActiveChallenges().length;
    
    // Join a challenge from the available list
    const avail = EcoTrack.Challenges.getAvailableChallenges();
    if (avail.length > 0) {
      const targetId = avail[0].id;
      EcoTrack.Challenges.joinChallenge(targetId);
      
      const active = EcoTrack.Challenges.getActiveChallenges();
      TestRunner.expect(active.length).toBe(initial + 1);
      TestRunner.expect(active.some(c => c.id === targetId)).toBeTruthy();
      
      // Attempt duplicate join
      EcoTrack.Challenges.joinChallenge(targetId);
      TestRunner.expect(EcoTrack.Challenges.getActiveChallenges().length).toBe(initial + 1);
    }
  });
});

// --- 6. Insights Module ---
TestRunner.describe('EcoTrack.Insights Module', () => {
  TestRunner.beforeEach(() => {
    localStorage.removeItem('ecotrack_data');
    localStorage.removeItem('ecotrack_activities');
    EcoTrack.Store.init();
    EcoTrack.Insights.init();
  });

  TestRunner.it('should generate basic insights recommendations', () => {
    const recs = EcoTrack.Insights.getTopRecommendations();
    TestRunner.expect(Array.isArray(recs)).toBeTruthy();
  });

  TestRunner.it('should allow dismissing insights', () => {
    EcoTrack.Insights.generateInsights();
    const before = EcoTrack.Insights.getTopRecommendations();
    if (before.length > 0) {
      const targetId = before[0].id;
      EcoTrack.Insights.dismissInsight(targetId);
      const after = EcoTrack.Insights.getTopRecommendations();
      TestRunner.expect(after.some(r => r.id === targetId)).toBeFalsy();
    }
  });

  TestRunner.it('should return seasonal tips', () => {
    const tips = EcoTrack.Insights.getSeasonalTips();
    TestRunner.expect(tips.length > 0).toBeTruthy();
  });

  TestRunner.it('should generate a weekly report summary', () => {
    const report = EcoTrack.Insights.getWeeklyReport();
    TestRunner.expect(typeof report).toBe('object');
    TestRunner.expect(report.weekTotal).toBe(0); // since no activities logged
  });
});

// --- 7. Assistant Module ---
TestRunner.describe('EcoTrack.Assistant Module', () => {
  TestRunner.it('should match intent keywords accurately', () => {
    TestRunner.expect(EcoTrack.Assistant.matchIntent('hello there')).toBe('greeting');
    TestRunner.expect(EcoTrack.Assistant.matchIntent('tell me a fun fact')).toBe('fact');
    TestRunner.expect(EcoTrack.Assistant.matchIntent('how is my carbon score?')).toBe('footprint');
    TestRunner.expect(EcoTrack.Assistant.matchIntent('what is the meaning of life?')).toBe('unknown'); // defaults to unknown
  });

  TestRunner.it('should generate response text for matched intents', () => {
    const greetingRes = EcoTrack.Assistant.generateResponse('greeting');
    TestRunner.expect(typeof greetingRes).toBe('string');
    TestRunner.expect(greetingRes.length > 0).toBeTruthy();

    const factRes = EcoTrack.Assistant.generateResponse('fact');
    TestRunner.expect(factRes.includes('Did you know?')).toBeTruthy();
  });
});
