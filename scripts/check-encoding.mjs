#!/usr/bin/env node
/**
 * Guards user-visible copy against the Windows-1252 mojibake and stray BOMs that
 * previously reached production screens. Run by lint and build.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = ['src', 'public', 'scripts', 'README.md', 'package.json'];
const extensions = /\.(?:tsx?|md|css|json|html|js|mjs)$/i;
const skipDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
]);

// Common UTF-8-as-Windows-1252 sequences plus the replacement character and BOM.
const forbidden = [
  { label: 'replacement character', value: '\uFFFD' },
  { label: 'UTF-8 BOM', value: '\uFEFF' },
  { label: 'mojibake prefix', value: '\u00e2\u20ac' },
  { label: 'mojibake middle dot', value: '\u00c2\u00b7' },
  { label: 'mojibake accented prefix', value: '\u00c3' },
  { label: 'mojibake replacement', value: '\u00ef\u00bf\u00bd' },
];

function* files(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    if (extensions.test(path)) yield path;
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue;
    yield* files(join(path, entry.name));
  }
}

const failures = [];
for (const root of roots) {
  let candidates;
  try {
    candidates = files(root);
  } catch {
    continue;
  }
  for (const file of candidates) {
    const text = readFileSync(file, 'utf8');
    for (const rule of forbidden) {
      let index = text.indexOf(rule.value);
      while (index !== -1) {
        const before = text.slice(0, index);
        const line = before.split('\n').length;
        const column = index - before.lastIndexOf('\n');
        failures.push({
          file: relative(process.cwd(), file),
          line,
          column,
          label: rule.label,
        });
        index = text.indexOf(rule.value, index + rule.value.length);
      }
    }
  }
}

if (failures.length === 0) {
  console.log('Encoding guard: no mojibake or BOM markers found.');
  process.exit(0);
}

console.error(`Encoding guard: found ${failures.length} issue(s).`);
for (const failure of failures.slice(0, 50)) {
  console.error(`  ${failure.file}:${failure.line}:${failure.column} ${failure.label}`);
}
if (failures.length > 50) console.error(`  ...and ${failures.length - 50} more`);
process.exit(1);
