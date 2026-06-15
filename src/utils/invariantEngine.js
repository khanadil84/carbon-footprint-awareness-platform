import { ACTIVITY_TYPES } from '../config/constants.js';

const registeredChecks = [];
const lastResults = new Map();

const checkIdUniqueness = (activities) => {
  const idCounts = new Map();
  for (const activity of activities) {
    if (activity.id === undefined || activity.id === null) continue;
    idCounts.set(activity.id, (idCounts.get(activity.id) || 0) + 1);
  }
  const duplicates = [];
  for (const [id, count] of idCounts) {
    if (count > 1) duplicates.push(id);
  }
  const hasDuplicates = duplicates.length > 0;
  return {
    pass: !hasDuplicates,
    detail: hasDuplicates ? `duplicate ids: ${duplicates.join(',')}` : 'ok'
  };
};

const checkEmissionsNonNegative = (activities) => {
  for (const activity of activities) {
    if (activity.co2 < 0) {
      return { pass: false, detail: `negative co2: ${activity.co2}` };
    }
  }
  return { pass: true, detail: 'ok' };
};

const checkValidDates = (activities) => {
  for (const activity of activities) {
    const date = new Date(activity.date);
    if (isNaN(date.getTime())) {
      return { pass: false, detail: `invalid date: ${activity.date}` };
    }
  }
  return { pass: true, detail: 'ok' };
};

const checkValidTypes = (activities) => {
  for (const activity of activities) {
    if (!ACTIVITY_TYPES.includes(activity.type)) {
      return { pass: false, detail: `invalid type: ${activity.type}` };
    }
  }
  return { pass: true, detail: 'ok' };
};

const checkScoreRange = (scoreObject) => {
  if (!scoreObject || scoreObject.score === undefined) return { pass: true, detail: 'no score provided' };
  const isValid = scoreObject.score >= 0 && scoreObject.score <= 100 && Number.isInteger(scoreObject.score);
  return {
    pass: isValid,
    detail: isValid ? 'ok' : `score out of range: ${scoreObject.score}`
  };
};

const checkAggregationConsistency = (activities, aggregation) => {
  if (!aggregation) return { pass: true, detail: 'no aggregation provided' };
  const computedSum = activities.reduce((sum, activity) => sum + (Number(activity.co2) || 0), 0);
  const matches = Math.abs(aggregation.totalSum - computedSum) <= 0.001;
  return {
    pass: matches,
    detail: matches ? 'ok' : `totalSum ${aggregation.totalSum} !== computed sum ${computedSum}`
  };
};

const checkGoalConsistency = (goal) => {
  if (!goal) return { pass: true, detail: 'no goal' };
  const isValid = !goal.targetKg || (typeof goal.targetKg === 'number' && goal.targetKg > 0);
  return {
    pass: isValid,
    detail: isValid ? 'ok' : `invalid goal target: ${goal.targetKg}`
  };
};

const register = (name, checkFn) => {
  registeredChecks.push({ name, checkFn });
};

register('idUniqueness', checkIdUniqueness);
register('emissionsNonNegative', checkEmissionsNonNegative);
register('validDates', checkValidDates);
register('validTypes', checkValidTypes);
register('scoreRange', checkScoreRange);
register('aggregationConsistency', checkAggregationConsistency);
register('goalConsistency', checkGoalConsistency);

const recordResult = (name, result) => {
  lastResults.set(name, { ...result, checkedAt: Date.now() });
  return result;
};

export const InvariantEngine = {
  register,

  verify: (name, ...args) => {
    const check = registeredChecks.find(c => c.name === name);
    if (!check) throw new Error(`Unknown invariant: ${name}`);
    const result = check.checkFn(...args);
    return recordResult(name, result);
  },

  verifyAll: (state) => {
    const output = {};
    for (const { name, checkFn } of registeredChecks) {
      const args = state[name] !== undefined ? [state[name]] : [state.activities, state.aggregation];
      const result = checkFn(...args);
      recordResult(name, result);
      output[name] = result;
    }
    return output;
  },

  verifySystemInvariants: (activities, aggregation, scoreObject, goal) => {
    const results = {};
    results.idUniqueness = recordResult('idUniqueness', checkIdUniqueness(activities));
    results.emissionsNonNegative = recordResult('emissionsNonNegative', checkEmissionsNonNegative(activities));
    results.validDates = recordResult('validDates', checkValidDates(activities));
    results.validTypes = recordResult('validTypes', checkValidTypes(activities));
    results.scoreRange = recordResult('scoreRange', checkScoreRange(scoreObject));
    results.aggregationConsistency = recordResult('aggregationConsistency', checkAggregationConsistency(activities, aggregation));
    results.goalConsistency = recordResult('goalConsistency', checkGoalConsistency(goal));
    return results;
  },

  report: () => {
    const entries = [];
    for (const [name, result] of lastResults) entries.push({ name, ...result });
    return entries;
  },

  passed: () => {
    for (const [, result] of lastResults) if (!result.pass) return false;
    return true;
  },

  reset: () => { lastResults.clear(); }
};
