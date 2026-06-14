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

  highlight: (state) => {
    const d = Metrics.diagnostics(state);
    const lines = [
      '=== Operational Metrics ===',
      `Health Score: ${d.health.healthScore}/100 (${d.health.invariantPassed ? 'ALL INVARIANTS PASSED' : 'INVARIANTS FAILING'})`,
      `Recovery Count: ${d.recovered}`,
      `Total Telemetry Events: ${d.telemetry.totalEvents}`,
      `Cache Hits: ${d.performance.cacheHits || 0}, Misses: ${d.performance.cacheMisses || 0}`,
      `Full Recomputes: ${d.performance.fullRecomputes || 0}, Incremental: ${d.performance.incrementalUpdates || 0}`,
      '--- Invariants ---'
    ];
    for (const inv of d.invariants) {
      lines.push(`  ${inv.name}: ${inv.pass ? 'PASS' : 'FAIL'} (${inv.detail})`);
    }
    lines.push('--- Telemetry Breakdown ---');
    const events = d.health.telemetry.events || {};
    for (const [name, count] of Object.entries(events)) {
      if (count > 0) lines.push(`  ${name}: ${count}`);
    }
    return lines.join('\n');
  }
};
