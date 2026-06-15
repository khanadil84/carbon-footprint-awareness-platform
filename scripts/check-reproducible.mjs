import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync, readdirSync, statSync, existsSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function hashDirectory(dir) {
  const entries = [];
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        entries.push(full);
      }
    }
  }
  walk(dir);
  entries.sort();

  const hash = createHash('sha256');
  const relFiles = [];
  for (const file of entries) {
    const rel = file.slice(root.length + 1).replace(/\\/g, '/');
    const content = readFileSync(file);
    hash.update(`${rel}\0${content.length}\0`);
    hash.update(content);
    relFiles.push(rel);
  }
  return { hash: hash.digest('hex'), files: relFiles };
}

console.log('Reproducible Build Validation\n');

const dist = join(root, 'dist');
const hashes = [];

for (let attempt = 1; attempt <= 2; attempt++) {
  if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });

  process.stdout.write(`  Build ${attempt} ... `);
  execSync('npx vite build', { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
  console.log('done');

  const result = hashDirectory(dist);
  hashes.push(result);

  writeFileSync(join(root, `.build-${attempt}-hash.json`), JSON.stringify(result, null, 2));
}

// Restore dist from last build
if (!existsSync(dist)) {
  execSync('npx vite build', { cwd: root, stdio: 'ignore', timeout: 60000 });
}

console.log(`\n  Build 1 SHA256: ${hashes[0].hash}`);
console.log(`  Build 2 SHA256: ${hashes[1].hash}`);

if (hashes[0].hash === hashes[1].hash) {
  console.log('\n  BUILD REPRODUCIBLE: identical hashes');
  console.log(`  Files: ${hashes[0].files.length}`);
  console.log(`  Hash: ${hashes[0].hash}`);
  process.exit(0);
} else {
  console.log('\n  BUILD NOT REPRODUCIBLE: hashes differ');

  const set1 = new Set(hashes[0].files);
  const set2 = new Set(hashes[1].files);

  const only1 = hashes[0].files.filter(f => !set2.has(f));
  const only2 = hashes[1].files.filter(f => !set1.has(f));

  if (only1.length > 0) { console.log('\n  Only in build 1:'); for (const f of only1) console.log(`    ${f}`); }
  if (only2.length > 0) { console.log('\n  Only in build 2:'); for (const f of only2) console.log(`    ${f}`); }

  process.exit(1);
}
