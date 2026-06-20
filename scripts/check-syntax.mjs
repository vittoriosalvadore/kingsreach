#!/usr/bin/env node
// Syntax-checks the inline ES module inside index.html.
//
// Kingsreach is a single-file game with no build step, so a typo anywhere in
// the module silently breaks boot in the browser. This extracts the
// `<script type="module">` body to a temp .mjs and runs `node --check` on it.
//
// Usage: node scripts/check-syntax.mjs [path/to/index.html]
// Exits 0 on success, 1 on a syntax error or if the module can't be found.

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(process.argv[2] || join(root, 'index.html'));
const tmpPath = join(root, '__check.mjs'); // gitignored

const html = readFileSync(htmlPath, 'utf8');

// The module is the only `<script type="module">` and contains no literal
// `</script>`, so a non-greedy match to the next closing tag is exact.
const m = html.match(/<script\s+type="module"\s*>([\s\S]*?)<\/script>/i);
if (!m) {
  console.error(`✗ No <script type="module"> found in ${htmlPath}`);
  process.exit(1);
}

// Pad with blank lines so node's error line numbers match index.html.
const before = html.slice(0, m.index + m[0].indexOf(m[1]));
const lineOffset = before.split('\n').length - 1;
const module = '\n'.repeat(lineOffset) + m[1];

writeFileSync(tmpPath, module);
try {
  execFileSync(process.execPath, ['--check', tmpPath], { stdio: 'inherit' });
  console.log(`✓ index.html module parses cleanly (${m[1].split('\n').length} lines)`);
} catch {
  console.error('✗ Syntax error in index.html module (line numbers match index.html)');
  process.exit(1);
} finally {
  try { unlinkSync(tmpPath); } catch {}
}
