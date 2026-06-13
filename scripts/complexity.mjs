import { readFileSync, readdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'src');

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full).forEach(f => files.push(f));
    else if (entry.isFile() && /\.(js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function countComplexity(body) {
  let n = 1;
  n += (body.match(/\bif\s*\(/g) || []).length;
  n += (body.match(/\belse\s+if\b/g) || []).length;
  n += (body.match(/\belse\b(?!\s+if)/g) || []).length;
  n += (body.match(/\bcase\s+/g) || []).length;
  n += (body.match(/\bcatch\s*\(/g) || []).length;
  n += (body.match(/\bfor\s*\(/g) || []).length;
  n += (body.match(/\bwhile\s*\(/g) || []).length;
  return n;
}

function extractFunctions(code) {
  const funcs = [];
  const fnRegex = /(?:export\s+)?(?:const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*(?:=>|{)|function\s+(\w+)\s*\([^)]*\)\s*{)/g;
  let m;
  while ((m = fnRegex.exec(code)) !== null) {
    const name = m[1] || m[2];
    const braceStart = code.indexOf('{', m.index + m[0].indexOf('{'));
    if (braceStart === -1) continue;
    let depth = 1, i = braceStart + 1;
    while (i < code.length && depth > 0) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') depth--;
      i++;
    }
    const body = code.slice(braceStart, i);
    funcs.push({ name, body, complexity: countComplexity(body), loc: body.split('\n').length });
  }
  return funcs;
}

const files = collectFiles(SRC);
const all = [];

for (const file of files) {
  const code = readFileSync(file, 'utf-8');
  for (const f of extractFunctions(code)) {
    all.push({ file: file.replace(SRC + '\\', 'src/').replace(/\\/g, '/'), name: f.name, complexity: f.complexity, loc: f.loc });
  }
}

all.sort((a, b) => b.complexity - a.complexity);
console.log('Top 20 most complex functions:');
console.log('='.repeat(80));
all.slice(0, 20).forEach((f, i) => {
  console.log(`${(i+1).toString().padStart(2)}. ${f.complexity.toString().padStart(3)}  ${f.file}:${f.name} (${f.loc} lines)`);
});
console.log('\nAll functions:');
console.log('='.repeat(80));
all.forEach((f, i) => console.log(`${(i+1).toString().padStart(2)}. ${f.complexity.toString().padStart(3)}  ${f.file}:${f.name} (${f.loc} lines)`));
