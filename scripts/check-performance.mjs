import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const thresholds = {
  'analytics': [
    { size: 10, maxAvg: 1 },
    { size: 100, maxAvg: 5 },
    { size: 1000, maxAvg: 30 },
    { size: 5000, maxAvg: 150 }
  ],
  'aggregation': [
    { size: 10, maxAvg: 1 },
    { size: 100, maxAvg: 5 },
    { size: 1000, maxAvg: 30 },
    { size: 5000, maxAvg: 150 }
  ],
  'recommendation': [
    { size: 10, maxAvg: 5 },
    { size: 100, maxAvg: 15 },
    { size: 1000, maxAvg: 30 }
  ]
};

console.log('Running benchmarks...\n');
let exitCode = 0;
const allResults = [];
const mdLines = ['# Benchmark Results', '', '| Suite | Size | Function | Avg (ms) | Threshold (ms) | Status |', '|-------|------|----------|----------|----------------|--------|'];

for (const [suite, limits] of Object.entries(thresholds)) {
  process.stdout.write(`  bench: ${suite} ... `);
  try {
    const out = execSync(`node benchmarks/${suite}.bench.js`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120000,
      env: { ...process.env, NO_COLOR: '1' }
    }).toString();

    const lines = out.split('\n');
    let currentSize = null;
    let suiteOk = true;

    for (const line of lines) {
      const sizeMatch = line.match(/---\s+(\d+)\s+activities\s+---/);
      if (sizeMatch) {
        currentSize = parseInt(sizeMatch[1], 10);
        continue;
      }

      const perfMatch = line.match(/^\s+([\w()\s]+?):\s+avg=([\d.]+)ms/);
      if (perfMatch && currentSize !== null) {
        const benchName = perfMatch[1].trim();
        const avg = parseFloat(perfMatch[2]);

        let threshold = null;
        for (const limit of limits) {
          if (currentSize === limit.size) threshold = limit.maxAvg;
        }

        const status = threshold !== null && avg > threshold ? 'FAIL' : 'PASS';
        if (status === 'FAIL') { suiteOk = false; exitCode = 1; }

        const row = `| ${suite} | ${currentSize} | ${benchName} | ${avg.toFixed(2)} | ${threshold !== null ? threshold.toFixed(2) : '—'} | ${status} |`;
        mdLines.push(row);
        allResults.push({ suite, size: currentSize, name: benchName, avg, threshold, status });
      }
    }

    if (suiteOk) {
      console.log('OK');
    } else {
      console.log('');
    }
  } catch (e) {
    console.log('ERROR');
    console.log(`    ${e.stderr?.toString()?.split('\n')[0] || e.message}`);
    mdLines.push(`| ${suite} | — | — | — | — | ERROR |`);
    exitCode = 1;
  }
}

mdLines.push('');

const baselinePath = join(root, 'benchmark-baseline.json');
const current = { timestamp: Date.now(), sha: process.env.GITHUB_SHA || 'local', results: allResults };
writeFileSync(baselinePath, JSON.stringify(current, null, 2));

if (existsSync(join(root, 'benchmark-baseline.json')) && process.env.GITHUB_SHA) {
  mdLines.push('## Comparison with Previous Baseline', '');
  const prevRaw = readFileSync(join(root, 'benchmark-baseline.json'), 'utf-8');
  try {
    const prev = JSON.parse(prevRaw);
    if (prev.results && current.results) {
      mdLines.push('| Suite | Size | Function | Previous (ms) | Current (ms) | Delta |', '|-------|------|----------|---------------|---------------|-------|');
      for (const curr of current.results) {
        const match = prev.results.find(r => r.suite === curr.suite && r.size === curr.size && r.name === curr.name);
        if (match) {
          const delta = curr.avg - match.avg;
          const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : `${delta.toFixed(2)}`;
          mdLines.push(`| ${curr.suite} | ${curr.size} | ${curr.name} | ${match.avg.toFixed(2)} | ${curr.avg.toFixed(2)} | ${deltaStr} |`);
        }
      }
    }
  } catch {}
  mdLines.push('');
}

const md = mdLines.join('\n');
const mdPath = join(root, 'benchmark-results.md');
writeFileSync(mdPath, md);

if (exitCode === 0) {
  console.log('\nAll benchmarks within thresholds');
} else {
  console.log('\nSome benchmarks exceeded thresholds');
}
process.exit(exitCode);
