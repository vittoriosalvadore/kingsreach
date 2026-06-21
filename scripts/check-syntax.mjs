#!/usr/bin/env node
// Syntax-checks the game's JavaScript without a browser.
//
// Kingsreach is build-less, so a typo silently breaks boot. This checks:
//   1. the inline ES module inside index.html (line numbers match index.html), and
//   2. every extracted ES module under ./src.
//
// Usage: node scripts/check-syntax.mjs [path/to/index.html]
// Exits 0 on success, 1 on any syntax error.

import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(process.argv[2] || join(root, 'index.html'));
const tmpPath = join(root, '__check.mjs'); // gitignored

let failed = false;

// node --check infers module type from extension; .js is treated as CommonJS,
// so `export` would error. Copy ESM sources to a temp .mjs and check that.
function checkModule(label, source) {
  writeFileSync(tmpPath, source);
  try {
    execFileSync(process.execPath, ['--check', tmpPath], { stdio: 'inherit' });
    console.log(`✓ ${label} parses cleanly`);
  } catch {
    console.error(`✗ Syntax error in ${label}`);
    failed = true;
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }
}

// 1) inline module in index.html — pad with blank lines so error line numbers match.
const html = readFileSync(htmlPath, 'utf8');
const m = html.match(/<script\s+type="module"\s*>([\s\S]*?)<\/script>/i);
if (!m) {
  console.error(`✗ No <script type="module"> found in ${htmlPath}`);
  process.exit(1);
}
const before = html.slice(0, m.index + m[0].indexOf(m[1]));
const lineOffset = before.split('\n').length - 1;
checkModule('index.html module (line numbers match index.html)', '\n'.repeat(lineOffset) + m[1]);

// 2) extracted modules under ./src
const srcDir = join(root, 'src');
if (existsSync(srcDir)) {
  for (const f of readdirSync(srcDir).filter(n => n.endsWith('.js')).sort()) {
    checkModule(`src/${f}`, readFileSync(join(srcDir, f), 'utf8'));
  }
}

process.exit(failed ? 1 : 0);
