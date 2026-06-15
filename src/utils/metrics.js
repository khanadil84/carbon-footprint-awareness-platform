import { Telemetry } from './telemetry.js';
import { SystemHealthService } from './systemHealth.js';
import { InvariantEngine } from './invariantEngine.js';
import { Perf } from './perf.js';

export const Metrics = {
  diagnostics: () => {
    const health = SystemHealthService.diagnostics();
    const perf = Perf.report();
    return {
      health,
      performance: perf,
      telemetry: Telemetry.summary(),
      invariants: InvariantEngine.report(),
      recovered: SystemHealthService.recoveryCount(),
      timestamp: Date.now()
    };
  },

  highlight: () => {
    const diagnostics = Metrics.diagnostics();
    const lines = [
      '=== Operational Metrics ===',
      `Health Score: ${diagnostics.health.healthScore}/100 (${diagnostics.health.invariantPassed ? 'ALL INVARIANTS PASSED' : 'INVARIANTS FAILING'})`,
      `Recovery Count: ${diagnostics.recovered}`,
      `Total Telemetry Events: ${diagnostics.telemetry.totalEvents}`,
      `Cache Hits: ${diagnostics.performance.cacheHits || 0}, Misses: ${diagnostics.performance.cacheMisses || 0}`,
      `Full Recomputes: ${diagnostics.performance.fullRecomputes || 0}, Incremental: ${diagnostics.performance.incrementalUpdates || 0}`,
      '--- Invariants ---'
    ];
    for (const entry of diagnostics.invariants) {
      lines.push(`  ${entry.name}: ${entry.pass ? 'PASS' : 'FAIL'} (${entry.detail})`);
    }
    lines.push('--- Telemetry Breakdown ---');
    const events = diagnostics.health.telemetry.events || {};
    for (const [name, count] of Object.entries(events)) {
      if (count > 0) lines.push(`  ${name}: ${count}`);
    }
    return lines.join('\n');
  }
};
