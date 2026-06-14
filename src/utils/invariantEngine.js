const registry = [];
const results = new Map();

const VALID_TYPES = ['Car', 'Bus', 'Train', 'Flight', 'Electricity', 'Food', 'Waste'];

const checkIdUniqueness = (activities) => {
  const counts = new Map();
  for (let i = 0; i < activities.length; i++) {
    const id = activities[i].id;
    if (id === undefined || id === null) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  const duplicates = [];
  for (const [id, count] of counts) if (count > 1) duplicates.push(id);
  return { pass: duplicates.length === 0, detail: duplicates.length ? `duplicate ids: ${duplicates.join(',')}` : 'ok' };
};

const checkEmissionsNonNegative = (activities) => {
  for (let i = 0; i < activities.length; i++) {
    if (activities[i].co2 < 0) return { pass: false, detail: `negative co2 at index ${i}: ${activities[i].co2}` };
  }
  return { pass: true, detail: 'ok' };
};

const checkValidDates = (activities) => {
  for (let i = 0; i < activities.length; i++) {
    const d = new Date(activities[i].date);
    if (isNaN(d.getTime())) return { pass: false, detail: `invalid date at index ${i}: ${activities[i].date}` };
  }
  return { pass: true, detail: 'ok' };
};

const checkValidTypes = (activities) => {
  for (let i = 0; i < activities.length; i++) {
    if (!VALID_TYPES.includes(activities[i].type)) return { pass: false, detail: `invalid type at index ${i}: ${activities[i].type}` };
  }
  return { pass: true, detail: 'ok' };
};

const checkScoreRange = (scoreObj) => {
  if (!scoreObj || scoreObj.score === undefined) return { pass: true, detail: 'no score provided' };
  if (scoreObj.score < 0 || scoreObj.score > 100 || !Number.isInteger(scoreObj.score)) {
    return { pass: false, detail: `score out of range: ${scoreObj.score}` };
  }
  return { pass: true, detail: 'ok' };
};

const checkAggregationConsistency = (activities, agg) => {
  if (!agg) return { pass: true, detail: 'no aggregation provided' };
  let sum = 0;
  for (let i = 0; i < activities.length; i++) sum += Number(activities[i].co2) || 0;
  if (Math.abs(agg.totalSum - sum) > 0.001) {
    return { pass: false, detail: `totalSum ${agg.totalSum} !== sum of co2 ${sum}` };
  }
  return { pass: true, detail: 'ok' };
};

const checkGoalConsistency = (goal) => {
  if (!goal) return { pass: true, detail: 'no goal' };
  if (goal.targetKg && (typeof goal.targetKg !== 'number' || goal.targetKg <= 0)) {
    return { pass: false, detail: `invalid goal targetKg: ${goal.targetKg}` };
  }
  return { pass: true, detail: 'ok' };
};

export const InvariantEngine = {
  register: (name, fn) => { registry.push({ name, fn }); },

  assertInvariant: (condition, message) => {
    if (!condition) throw new Error(`Invariant violation: ${message}`);
  },

  verify: (name, ...args) => {
    const checker = registry.find(r => r.name === name);
    if (!checker) throw new Error(`Unknown invariant: ${name}`);
    const r = checker.fn(...args);
    results.set(name, { ...r, checkedAt: Date.now() });
    return r;
  },

  verifyAll: (state) => {
    const output = {};
    for (const { name, fn } of registry) {
      const args = state[name] !== undefined ? [state[name]] : [state.activities, state.aggregation];
      const r = fn(...args);
      results.set(name, { ...r, checkedAt: Date.now() });
      output[name] = r;
    }
    return output;
  },

  verifySystemInvariants: (activities, aggregation, scoreObj, goal) => {
    const r = {};
    r.idUniqueness = checkIdUniqueness(activities);
    r.emissionsNonNegative = checkEmissionsNonNegative(activities);
    r.validDates = checkValidDates(activities);
    r.validTypes = checkValidTypes(activities);
    r.scoreRange = checkScoreRange(scoreObj);
    r.aggregationConsistency = checkAggregationConsistency(activities, aggregation);
    r.goalConsistency = checkGoalConsistency(goal);
    for (const [k, v] of Object.entries(r)) results.set(k, { ...v, checkedAt: Date.now() });
    return r;
  },

  report: () => {
    const out = [];
    for (const [name, r] of results) out.push({ name, ...r });
    return out;
  },

  passed: () => {
    for (const [, r] of results) if (!r.pass) return false;
    return true;
  },

  reset: () => { results.clear(); }
};

InvariantEngine.register('idUniqueness', checkIdUniqueness);
InvariantEngine.register('emissionsNonNegative', checkEmissionsNonNegative);
InvariantEngine.register('validDates', checkValidDates);
InvariantEngine.register('validTypes', checkValidTypes);
InvariantEngine.register('scoreRange', checkScoreRange);
InvariantEngine.register('aggregationConsistency', checkAggregationConsistency);
InvariantEngine.register('goalConsistency', checkGoalConsistency);
