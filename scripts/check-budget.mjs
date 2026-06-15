import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist', 'assets');

const budgets = {
  totalJS: { raw: 500000, gzip: 180000 },
  totalCSS: { raw: 40000, gzip: 12000 },
  mainJS: { raw: 350000, gzip: 120000 },
  mainCSS: { raw: 30000, gzip: 8000 }
};

console.log('Bundle Budget Check\n');

let totalRawJS = 0;
let totalGzipJS = 0;
let totalRawCSS = 0;
let totalGzipCSS = 0;
let mainJS = 0;
let mainCSS = 0;
let mainJSGzip = 0;
let mainCSSGzip = 0;

const files = [];
const buildOutput = execSync('npx vite build 2>&1', { cwd: root, encoding: 'utf-8', timeout: 60000 });
console.log(buildOutput);

for (const line of buildOutput.split('\n')) {
  const match = line.match(/dist\/assets\/(\S+)\s+([\d.]+)\s*kB.*gzip:\s+([\d.]+)\s*kB/);
  if (match) {
    const [_, name, rawSize, gzipSize] = match;
    const raw = parseFloat(rawSize);
    const gzip = parseFloat(gzipSize);
    files.push({ name, rawKB: raw, gzipKB: gzip });

    if (name.endsWith('.js')) {
      totalRawJS += raw * 1024;
      totalGzipJS += gzip * 1024;
      if (name.startsWith('index-')) {
        mainJS = raw * 1024;
        mainJSGzip = gzip * 1024;
      }
    } else if (name.endsWith('.css')) {
      totalRawCSS += raw * 1024;
      totalGzipCSS += gzip * 1024;
      if (name.startsWith('index-')) {
        mainCSS = raw * 1024;
        mainCSSGzip = gzip * 1024;
      }
    }
  }
}

const checks = [
  { name: 'Total JS (raw)', value: totalRawJS, limit: budgets.totalJS.raw, unit: 'bytes' },
  { name: 'Total JS (gzip)', value: totalGzipJS, limit: budgets.totalJS.gzip, unit: 'bytes' },
  { name: 'Total CSS (raw)', value: totalRawCSS, limit: budgets.totalCSS.raw, unit: 'bytes' },
  { name: 'Total CSS (gzip)', value: totalGzipCSS, limit: budgets.totalCSS.gzip, unit: 'bytes' },
  { name: 'Main JS (raw)', value: mainJS, limit: budgets.mainJS.raw, unit: 'bytes' },
  { name: 'Main JS (gzip)', value: mainJSGzip, limit: budgets.mainJS.gzip, unit: 'bytes' },
  { name: 'Main CSS (raw)', value: mainCSS, limit: budgets.mainCSS.raw, unit: 'bytes' },
  { name: 'Main CSS (gzip)', value: mainCSSGzip, limit: budgets.mainCSS.gzip, unit: 'bytes' }
];

let exitCode = 0;
for (const check of checks) {
  const status = check.value <= check.limit ? 'PASS' : 'FAIL';
  const pct = ((check.value / check.limit) * 100).toFixed(1);
  console.log(`  [${status}] ${check.name}: ${(check.value / 1024).toFixed(2)} KB / ${(check.limit / 1024).toFixed(2)} KB (${pct}%)`);
  if (status === 'FAIL') exitCode = 1;
}

if (exitCode === 0) {
  console.log('\nBundle budget: ALL PASS');
} else {
  console.log('\nBundle budget: SOME EXCEEDED');
}

const baselinePath = join(root, 'budget-baseline.json');
const baseline = { timestamp: Date.now(), files, totals: { totalRawJS, totalGzipJS, totalRawCSS, totalGzipCSS, mainJS, mainJSGzip, mainCSS, mainCSSGzip } };
if (existsSync(baselinePath)) {
  const prev = JSON.parse(readFileSync(baselinePath, 'utf-8'));
  console.log('\nSize diff from previous baseline:');
  const diff = baseline.totals.totalRawJS - prev.totals.totalRawJS;
  const diffSign = diff >= 0 ? '+' : '';
  console.log(`  Total JS: ${diffSign}${(diff / 1024).toFixed(2)} KB`);
}
writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));

process.exit(exitCode);
