import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const threshold = parseFloat(process.argv[2] || '60');

console.log(`Coverage threshold: ${threshold}%\n`);

const testFiles = [
  'validation.unit.test.js', 'storage.unit.test.js', 'activityService.unit.test.js',
  'analytics.unit.test.js', 'carbonScoreService.unit.test.js', 'goalService.unit.test.js',
  'achievementService.unit.test.js', 'recommendationService.unit.test.js',
  'settingsService.unit.test.js', 'exportService.unit.test.js',
  'regression.test.js', 'fuzz.test.js', 'mutation.test.js', 'security.test.js',
  'property.test.js', 'integration.test.js', 'chaos.test.js', 'consistency.test.js'
];

const args = testFiles.map(f => `tests/${f}`).join(' ');

console.log('Running coverage...\n');
try {
  const out = execSync(`node --experimental-test-coverage --test ${args}`, {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 180000,
    env: { ...process.env, CHAOS_ROUNDS: '10', NO_COLOR: '1' }
  }).toString();

  const lines = out.split('\n');
  let lineCov = null;
  let branchCov = null;
  let funcCov = null;

  for (const line of lines) {
    const match = line.match(/all files\s*\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (match) {
      lineCov = parseFloat(match[1]);
      branchCov = parseFloat(match[2]);
      funcCov = parseFloat(match[3]);
      break;
    }
  }

  const report = {
    threshold,
    line: lineCov,
    branch: branchCov,
    functions: funcCov,
    passed: lineCov !== null && lineCov >= threshold,
    timestamp: new Date().toISOString()
  };

  const reportPath = join(root, 'coverage-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (lineCov === null) {
    console.log('Could not parse coverage report');
    process.exit(1);
  }

  console.log(`Line coverage:      ${lineCov.toFixed(2)}%`);
  console.log(`Branch coverage:    ${branchCov.toFixed(2)}%`);
  console.log(`Function coverage:  ${funcCov.toFixed(2)}%`);

  if (lineCov < threshold) {
    console.log(`\nFAIL: Line coverage ${lineCov.toFixed(2)}% < ${threshold}%`);
    console.log(`JSON report written to coverage-report.json`);
    process.exit(1);
  }

  console.log(`\nCoverage check passed (≥${threshold}%)`);
  console.log(`JSON report written to coverage-report.json`);
  process.exit(0);
} catch (e) {
  const stderr = e.stderr?.toString() || '';
  const stdout = e.stdout?.toString() || '';
  console.error('Coverage command failed');
  if (stderr) console.error(stderr.slice(0, 500));
  if (stdout) console.error(stdout.slice(-500));
  process.exit(1);
}
