import { execSync } from 'child_process';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const testsDir = join(root, 'tests');
const reportDir = join(root, 'test-reports');

if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

const suites = {
  unit: ['validation.unit.test.js', 'storage.unit.test.js', 'activityService.unit.test.js', 'analytics.unit.test.js', 'carbonScoreService.unit.test.js', 'goalService.unit.test.js', 'achievementService.unit.test.js', 'recommendationService.unit.test.js', 'settingsService.unit.test.js', 'exportService.unit.test.js'],
  chaos: ['chaos.test.js'],
  consistency: ['consistency.test.js'],
  regression: ['regression.test.js'],
  fuzz: ['fuzz.test.js'],
  mutation: ['mutation.test.js'],
  security: ['security.test.js'],
  property: ['property.test.js'],
  integration: ['integration.test.js'],
  accessibility: ['accessibility.test.js'],
  performance: ['performance.test.js'],
  core: ['validation.test.js', 'storage.test.js', 'activityService.test.js', 'activityAnalytics.test.js']
};

console.log('Generating test reports...\n');

for (const [group, groupFiles] of Object.entries(suites)) {
  let pass = 0;
  let fail = 0;
  let total = 0;
  const results = [];

  for (const file of groupFiles) {
    process.stdout.write(`  ${group}/${file} ... `);
    try {
      const out = execSync(`node ${join(testsDir, file)}`, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60000,
        env: { ...process.env, CHAOS_ROUNDS: '10', NO_COLOR: '1' }
      }).toString();

      const passMatch = out.match(/ℹ pass\s+(\d+)/);
      const failMatch = out.match(/ℹ fail\s+(\d+)/);
      const p = passMatch ? parseInt(passMatch[1]) : 0;
      const f = failMatch ? parseInt(failMatch[1]) : 0;
      pass += p;
      fail += f;
      total += p + f;
      results.push({ file, status: f === 0 ? 'pass' : 'fail', pass: p, fail: f });
      console.log(`${p} pass, ${f} fail`);
    } catch (e) {
      const out = e.stdout?.toString() || '';
      const passMatch = out.match(/ℹ pass\s+(\d+)/);
      const failMatch = out.match(/ℹ fail\s+(\d+)/);
      const p = passMatch ? parseInt(passMatch[1]) : 0;
      const f = failMatch ? parseInt(failMatch[1]) + 1 : 1;
      pass += p;
      fail += f;
      total += p + f;
      results.push({ file, status: 'fail', pass: p, fail: f });
      console.log(`${p} pass, ${f} fail (exit ${e.status})`);
    }
  }

  const junitCases = results.map(r =>
    r.status === 'pass'
      ? `  <testcase classname="${group}" name="${r.file}" time="0.0"/>`
      : `  <testcase classname="${group}" name="${r.file}" time="0.0"><failure message="${r.fail} failures in ${r.file}"/></testcase>`
  ).join('\n');

  const junit = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="${group}" tests="${total}" failures="${fail}" errors="0">`,
    junitCases,
    '</testsuite>'
  ].join('\n');

  writeFileSync(join(reportDir, `${group}-junit.xml`), junit);

  const summary = [
    `# ${group} Test Summary`,
    '',
    `Total: ${total} | Pass: ${pass} | Fail: ${fail}`,
    '',
    '| File | Result | Pass | Fail |',
    '|------|--------|------|------|',
    ...results.map(r => `| ${r.file} | ${r.status} | ${r.pass} | ${r.fail} |`),
    ''
  ].join('\n');

  writeFileSync(join(reportDir, `${group}-summary.md`), summary);
  console.log(`  => ${group}: ${total} tests, ${pass} pass, ${fail} fail`);
}

console.log('\nTest reports generated in test-reports/');
