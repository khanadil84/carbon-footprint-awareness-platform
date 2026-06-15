import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const dashboard = {
  timestamp: new Date().toISOString(),
  build: {},
  tests: {},
  benchmarks: {},
  coverage: {},
  security: { status: 'unknown', violations: [] },
  audit: { status: 'unknown' },
  bundle: {},
  cache: {},
  accessibility: { status: 'unknown', total: 0, passed: 0, failed: 0 },
  performance: { status: 'unknown', checks: [] },
  systemHealth: { status: 'unknown', score: 0 },
  analyticsLatency: { status: 'unknown', avgMs: null },
  recommendationLatency: { status: 'unknown', avgMs: null }
};

// Build timing
const buildStart = Date.now();
try {
  const buildOut = execSync('npm run build 2>&1', { cwd: root, timeout: 60000, encoding: 'utf-8' });
  const buildTime = Date.now() - buildStart;
  const buildMatch = buildOut.match(/built in ([\d.]+)s/);
  dashboard.build.status = 'success';
  dashboard.build.duration_ms = buildTime;
  dashboard.build.duration_s = buildMatch ? parseFloat(buildMatch[1]) : null;
  dashboard.build.output = buildOut;

  const files = [];
  for (const line of buildOut.split('\n')) {
    const m = line.match(/dist\/assets\/(\S+)\s+([\d.]+)\s*kB.*gzip:\s+([\d.]+)\s*kB/);
    if (m) files.push({ name: m[1], rawKB: parseFloat(m[2]), gzipKB: parseFloat(m[3]) });
  }
  dashboard.bundle.files = files;
  dashboard.bundle.totalJS_KB = files.filter(f => f.name.endsWith('.js')).reduce((s, f) => s + f.rawKB, 0);
  dashboard.bundle.totalCSS_KB = files.filter(f => f.name.endsWith('.css')).reduce((s, f) => s + f.rawKB, 0);
  dashboard.bundle.totalGzipJS_KB = files.filter(f => f.name.endsWith('.js')).reduce((s, f) => s + f.gzipKB, 0);
  dashboard.bundle.budgetPass = dashboard.bundle.totalGzipJS_KB < 180;
} catch (e) {
  dashboard.build.status = 'failed';
  dashboard.build.error = e.message;
}

// Test results
const testStart = Date.now();
try {
  const testOut = execSync('node scripts/run-all-tests.mjs 2>&1', { cwd: root, timeout: 180000, encoding: 'utf-8' });
  dashboard.tests.duration_ms = Date.now() - testStart;
  const lines = testOut.split('\n');
  const passLines = lines.filter(l => l.includes('... PASS'));
  const failLines = lines.filter(l => l.includes('... FAIL'));
  dashboard.tests.total = passLines.length + failLines.length;
  dashboard.tests.passed = passLines.length;
  dashboard.tests.failed = failLines.length;
  dashboard.tests.suites = {};
  for (const line of passLines) {
    const name = line.replace('... PASS', '').trim();
    dashboard.tests.suites[name] = 'pass';
  }
  for (const line of failLines) {
    const name = line.replace('... FAIL', '').trim();
    dashboard.tests.suites[name] = 'fail';
  }
} catch (e) {
  dashboard.tests.error = e.message;
}

// Coverage
try {
  const covOut = execSync('node scripts/check-coverage.mjs 60 2>&1', { cwd: root, timeout: 180000, encoding: 'utf-8' });
  for (const line of covOut.split('\n')) {
    const lineMatch = line.match(/Line coverage:\s+([\d.]+)%/);
    const branchMatch = line.match(/Branch coverage:\s+([\d.]+)%/);
    const funcMatch = line.match(/Function coverage:\s+([\d.]+)%/);
    if (lineMatch) dashboard.coverage.line = parseFloat(lineMatch[1]);
    if (branchMatch) dashboard.coverage.branch = parseFloat(branchMatch[1]);
    if (funcMatch) dashboard.coverage.func = parseFloat(funcMatch[1]);
  }
} catch {}

// Coverage gate check
try {
  const covReportPath = join(root, 'coverage-report.json');
  if (existsSync(covReportPath)) {
    const covReport = JSON.parse(readFileSync(covReportPath, 'utf-8'));
    dashboard.coverage.passed = covReport.passed;
  } else {
    dashboard.coverage.passed = dashboard.coverage.line >= 60;
  }
} catch {
  dashboard.coverage.passed = false;
}

// Security
try {
  const secOut = execSync('node scripts/check-security.mjs 2>&1', { cwd: root, timeout: 30000, encoding: 'utf-8' });
  dashboard.security.status = secOut.includes('[FAIL]') ? 'failed' : 'passed';
  for (const line of secOut.split('\n')) {
    if (line.includes('[FAIL]')) dashboard.security.violations.push(line.trim());
  }
} catch {
  dashboard.security.status = 'error';
}

// Benchmark / Performance
try {
  const benchSuites = ['analytics', 'aggregation', 'recommendation'];
  const benchFiles = ['analytics.bench.js', 'aggregation.bench.js', 'recommendation.bench.js'];
  dashboard.benchmarks.full = {};
  let anyFail = false;
  const allLatencies = { analytics: [], aggregation: [], recommendation: [] };
  for (let i = 0; i < benchSuites.length; i++) {
    const suite = benchSuites[i];
    const file = benchFiles[i];
    try {
      const out = execSync(`node benchmarks/${file} 2>&1`, { cwd: root, timeout: 120000, encoding: 'utf-8' });
      const lines = out.split('\n');
      let currentSize = null;
      for (const line of lines) {
        const sizeMatch = line.match(/---\s+(\d+)\s+activities\s+---/);
        if (sizeMatch) { currentSize = parseInt(sizeMatch[1]); continue; }
        const perfMatch = line.match(/^\s+([\w()\s]+?):\s+avg=([\d.]+)ms/);
        if (perfMatch && currentSize !== null) {
          const name = perfMatch[1].trim();
          const avg = parseFloat(perfMatch[2]);
          if (!dashboard.benchmarks.full[suite]) dashboard.benchmarks.full[suite] = [];
          dashboard.benchmarks.full[suite].push({ size: currentSize, name, avgMs: avg });
          allLatencies[suite].push(avg);
        }
      }
    } catch {
      dashboard.benchmarks.full[suite] = [{ error: true }];
      anyFail = true;
    }
  }
  const summaryParts = [];
  for (const suite of benchSuites) {
    const results = dashboard.benchmarks.full[suite];
    const ok = results && !results.some(r => r.error);
    summaryParts.push(`  bench: ${suite} ... ${ok ? 'OK' : 'FAIL'}`);
    if (!ok) anyFail = true;
  }
  dashboard.benchmarks.summary = summaryParts.join('; ');
  dashboard.performance.status = anyFail ? 'failed' : 'passed';
  dashboard.systemHealth.status = dashboard.performance.status;
  dashboard.systemHealth.score = dashboard.performance.status === 'passed' ? 100 : 50;
  if (allLatencies.analytics.length > 0) {
    dashboard.analyticsLatency.avgMs = allLatencies.analytics.reduce((s, v) => s + v, 0) / allLatencies.analytics.length;
    dashboard.analyticsLatency.status = dashboard.analyticsLatency.avgMs < 50 ? 'passed' : 'degraded';
  }
  if (allLatencies.aggregation.length > 0) {
    const aggAvg = allLatencies.aggregation.reduce((s, v) => s + v, 0) / allLatencies.aggregation.length;
    if (dashboard.analyticsLatency.avgMs === null) {
      dashboard.analyticsLatency.avgMs = aggAvg;
      dashboard.analyticsLatency.status = aggAvg < 50 ? 'passed' : 'degraded';
    } else {
      dashboard.analyticsLatency.avgMs = (dashboard.analyticsLatency.avgMs + aggAvg) / 2;
    }
  }
  if (allLatencies.recommendation.length > 0) {
    dashboard.recommendationLatency.avgMs = allLatencies.recommendation.reduce((s, v) => s + v, 0) / allLatencies.recommendation.length;
    dashboard.recommendationLatency.status = dashboard.recommendationLatency.avgMs < 30 ? 'passed' : 'degraded';
  }
} catch (e) {
  dashboard.performance.status = 'error';
}

// Audit
try {
  const auditOut = execSync('npm audit --json 2>&1', { cwd: root, timeout: 60000, encoding: 'utf-8' });
  const audit = JSON.parse(auditOut);
  dashboard.audit.vulnerabilities = audit.metadata?.vulnerabilities || {};
  dashboard.audit.status = (audit.metadata?.vulnerabilities?.high || 0) > 0 || (audit.metadata?.vulnerabilities?.critical || 0) > 0 ? 'failed' : 'passed';
} catch {
  dashboard.audit.status = 'error';
}

// Accessibility
try {
  const a11yOut = execSync('node tests/accessibility.test.js 2>&1', { cwd: root, timeout: 30000, encoding: 'utf-8' });
  const passMatch = a11yOut.match(/ℹ pass\s+(\d+)/);
  const failMatch = a11yOut.match(/ℹ fail\s+(\d+)/);
  dashboard.accessibility.total = passMatch ? parseInt(passMatch[1]) : 0;
  dashboard.accessibility.passed = passMatch ? parseInt(passMatch[1]) : 0;
  dashboard.accessibility.failed = failMatch ? parseInt(failMatch[1]) : 0;
  dashboard.accessibility.status = dashboard.accessibility.failed === 0 ? 'passed' : 'failed';
} catch {
  dashboard.accessibility.status = 'error';
}

// Analytics latency from benchmark
try {
  const analyticsLatencies = [];
  const recLatencies = [];
  if (dashboard.benchmarks.full) {
    for (const [suite, results] of Object.entries(dashboard.benchmarks.full)) {
      for (const r of results) {
        if (suite === 'analytics') analyticsLatencies.push(r.avgMs);
        if (suite === 'aggregation') analyticsLatencies.push(r.avgMs);
        if (suite === 'recommendation') recLatencies.push(r.avgMs);
      }
    }
  }
  if (analyticsLatencies.length > 0) {
    dashboard.analyticsLatency.avgMs = analyticsLatencies.reduce((s, v) => s + v, 0) / analyticsLatencies.length;
    dashboard.analyticsLatency.status = dashboard.analyticsLatency.avgMs < 50 ? 'passed' : 'degraded';
  }
  if (recLatencies.length > 0) {
    dashboard.recommendationLatency.avgMs = recLatencies.reduce((s, v) => s + v, 0) / recLatencies.length;
    dashboard.recommendationLatency.status = dashboard.recommendationLatency.avgMs < 30 ? 'passed' : 'degraded';
  }
} catch {
  dashboard.analyticsLatency.status = 'unknown';
  dashboard.recommendationLatency.status = 'unknown';
}

// Last verification
dashboard.lastVerification = new Date().toISOString();

// Bundle budget check
try {
  const budgetOut = execSync('node scripts/check-budget.mjs 2>&1', { cwd: root, timeout: 60000, encoding: 'utf-8' });
  dashboard.bundle.budgetPass = !budgetOut.includes('FAIL');
  dashboard.bundle.budgetOutput = budgetOut.split('\n').filter(l => l.includes('[')).join('\n');
} catch {
  dashboard.bundle.budgetPass = false;
}

// Write outputs
const jsonPath = join(root, 'engineering-dashboard.json');
writeFileSync(jsonPath, JSON.stringify(dashboard, null, 2));

const safe = (v, d = 'N/A') => v !== null && v !== undefined ? v : d;

const mdLines = [
  '# Engineering Dashboard',
  '',
  `Generated: ${dashboard.timestamp}`,
  '',
  '## Build',
  `Status: ${dashboard.build.status}`,
  `Duration: ${dashboard.build.duration_s ? dashboard.build.duration_s + 's' : 'N/A'}`,
  `Total JS (raw): ${dashboard.bundle.totalJS_KB?.toFixed(2)} KB`,
  `Total CSS (raw): ${dashboard.bundle.totalCSS_KB?.toFixed(2)} KB`,
  `Total JS (gzip): ${dashboard.bundle.totalGzipJS_KB?.toFixed(2)} KB`,
  `Bundle Budget: ${dashboard.bundle.budgetPass === true ? 'PASS' : dashboard.bundle.budgetPass === false ? 'FAIL' : 'N/A'}`,
  '',
  '## Tests',
  `Total Suites: ${dashboard.tests.total || 0}`,
  `Passed: ${dashboard.tests.passed || 0}`,
  `Failed: ${dashboard.tests.failed || 0}`,
  `Duration: ${((dashboard.tests.duration_ms || 0) / 1000).toFixed(1)}s`,
  '',
  '## Coverage',
  `Line: ${safe(dashboard.coverage.line)}%`,
  `Branch: ${safe(dashboard.coverage.branch)}%`,
  `Functions: ${safe(dashboard.coverage.func)}%`,
  `Gate: ${dashboard.coverage.passed ? 'PASS' : 'FAIL'}`,
  '',
  '## Security',
  `Status: ${dashboard.security.status}`,
  dashboard.security.violations.length > 0 ? `Violations: ${dashboard.security.violations.join(', ')}` : '',
  '',
  '## Audit',
  `Status: ${dashboard.audit.status}`,
  dashboard.audit.vulnerabilities ? `High: ${dashboard.audit.vulnerabilities.high || 0}, Critical: ${dashboard.audit.vulnerabilities.critical || 0}` : '',
  '',
  '## Accessibility',
  `Status: ${dashboard.accessibility.status}`,
  `Passed: ${dashboard.accessibility.passed} / ${dashboard.accessibility.total}`,
  '',
  '## Performance',
  `Status: ${dashboard.performance.status}`,
  `Benchmarks: ${dashboard.benchmarks.summary || 'N/A'}`,
  '',
  '## Cache',
  `Hit Rate: ${safe(dashboard.cache.hitRate)}%`,
  '',
  '## Latency',
  `Aggregation (avg): ${safe(dashboard.analyticsLatency.avgMs?.toFixed(2))} ms — ${dashboard.analyticsLatency.status}`,
  `Recommendation (avg): ${safe(dashboard.recommendationLatency.avgMs?.toFixed(2))} ms — ${dashboard.recommendationLatency.status}`,
  '',
  '## System Health',
  `Score: ${dashboard.systemHealth.score}/100`,
  `Status: ${dashboard.systemHealth.status}`,
  '',
  '## Benchmarks',
  dashboard.benchmarks.summary || 'N/A',
  '',
  `## Last Verification`,
  `${dashboard.lastVerification}`,
  ''
].filter(Boolean).join('\n');

const mdPath = join(root, 'engineering-dashboard.md');
writeFileSync(mdPath, mdLines);

console.log('Dashboard generated:');
console.log(`  engineering-dashboard.json`);
console.log(`  engineering-dashboard.md`);
