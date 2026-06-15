import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testsDir = join(__dirname, '..', 'tests');
const files = readdirSync(testsDir).filter(f => f.endsWith('.test.js'));
let exitCode = 0;

console.log(`Found ${files.length} test files\n`);

for (const file of files) {
  const filePath = join(testsDir, file);
  process.stdout.write(`  ${file} ... `);
  try {
    execSync(`node ${filePath}`, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000, env: { ...process.env, CHAOS_ROUNDS: '10' } });
    console.log('PASS');
  } catch (e) {
    console.log('FAIL');
    const out = e.stdout?.toString() || '';
    const err = e.stderr?.toString() || '';
    const lines = (out + err).split('\n').filter(l => l.trim());
    const failLines = lines.filter(l => l.includes('fail') || l.includes('FAIL') || l.includes('Error') || l.includes('AssertionError'));
    for (const l of failLines.slice(0, 5)) {
      console.log(`    ${l.trim()}`);
    }
    exitCode = 1;
  }
}

console.log(`\n${exitCode === 0 ? 'All tests passed' : 'Some tests failed'}`);
process.exit(exitCode);
