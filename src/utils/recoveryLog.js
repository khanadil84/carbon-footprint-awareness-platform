const MAX_HISTORY = 500;
const eventLog = [];

export const SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
});

export const RecoveryLog = {
  record: ({ subsystem, failure, repairAction, recoverySuccess, invariantVerification, severity = SEVERITY.INFO }) => {
    const entry = {
      timestamp: new Date().toISOString(),
      subsystem: subsystem || 'unknown',
      failure: failure || 'unknown',
      repairAction: repairAction || 'none',
      recoverySuccess: recoverySuccess !== undefined ? recoverySuccess : true,
      invariantVerification: invariantVerification !== undefined ? invariantVerification : true,
      severity
    };
    eventLog.push(entry);
    if (eventLog.length > MAX_HISTORY) eventLog.shift();
    return entry;
  },

  getRecoveryHistory: ({ subsystem, severity, limit, after } = {}) => {
    let results = [...eventLog];
    if (subsystem) results = results.filter(entry => entry.subsystem === subsystem);
    if (severity) results = results.filter(entry => entry.severity === severity);
    if (limit) results = results.slice(-limit);
    if (after) {
      const cutoffTime = new Date(after).getTime();
      results = results.filter(entry => new Date(entry.timestamp).getTime() > cutoffTime);
    }
    return results;
  },

  getRecoverySummary: () => {
    const total = eventLog.length;
    const successful = eventLog.filter(entry => entry.recoverySuccess).length;
    const failed = total - successful;
    const bySubsystem = {};
    const bySeverity = {};
    for (const entry of eventLog) {
      bySubsystem[entry.subsystem] = (bySubsystem[entry.subsystem] || 0) + 1;
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
    }
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : 'N/A',
      bySubsystem,
      bySeverity,
      lastRecovery: total > 0 ? eventLog[eventLog.length - 1].timestamp : null
    };
  },

  clear: () => { eventLog.length = 0; },

  get length() { return eventLog.length; }
};
