import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src');

const patterns = [
  { name: 'dangerouslySetInnerHTML', regex: /dangerouslySetInnerHTML/g },
  { name: 'eval', regex: /(?<![.\w])eval\s*\(/g },
  { name: 'Function constructor', regex: /new\s+Function\s*\(/g },
  { name: 'document.write', regex: /document\.write\s*\(/g },
  { name: 'inline event handlers', regex: /\s(on\w+)=['"]/g }
];

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!entry.startsWith('.')) files.push(...collectFiles(full));
    } else if (full.endsWith('.js') || full.endsWith('.jsx')) {
      files.push(full);
    }
  }
  return files;
}

console.log('Security scan: src/\n');
let exitCode = 0;

const files = collectFiles(srcDir);
for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const relPath = file.slice(root.length + 1).replace(/\\/g, '/');

  for (const { name, regex } of patterns) {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      console.log(`  [FAIL] ${relPath}:${lineNum} — ${name} detected`);
      exitCode = 1;
    }
  }
}

const cspConfig = join(srcDir, 'config', 'securityConfig.js');
try {
  const cspContent = readFileSync(cspConfig, 'utf-8');
  if (!cspContent.includes('Content-Security-Policy') && !cspContent.includes('CSP') && !cspContent.includes('csp')) {
    console.log('  [WARN] No CSP configuration found in securityConfig.js');
  }
} catch {
  console.log('  [WARN] securityConfig.js not found — CSP not verifiable');
}

const cspHtml = join(root, 'index.html');
try {
  const html = readFileSync(cspHtml, 'utf-8');
  if (!html.includes('Content-Security-Policy') && !html.includes('http-equiv="Content-Security-Policy"')) {
    console.log('  [WARN] No CSP meta tag or header in index.html');
  }
} catch {}

if (exitCode === 0) {
  console.log('  No unsafe patterns detected');
}

process.exit(exitCode);
