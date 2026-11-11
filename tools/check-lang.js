#!/usr/bin/env node
/* Checks that a language pack matches lang/zh.js: same keys, same array lengths,
   same {placeholders} in every string. Usage: node tools/check-lang.js en */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(code) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'lang', code + '.js'), 'utf8'), ctx);
  const pack = ctx.window.HL_LANG && ctx.window.HL_LANG[code];
  if (!pack) throw new Error(`lang/${code}.js did not define window.HL_LANG.${code}`);
  return pack;
}

const holes = s => (s.match(/\{[a-z]+\}/g) || []).sort().join(',');
const errors = [];
function walk(a, b, where) {
  if (typeof a === 'string') {
    if (typeof b !== 'string') return errors.push(`${where}: expected a string`);
    if (!b.trim()) errors.push(`${where}: empty string`);
    if (holes(a) !== holes(b)) errors.push(`${where}: placeholders ${holes(a) || '(none)'} vs ${holes(b) || '(none)'}`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return errors.push(`${where}: expected an array`);
    if (a.length !== b.length) errors.push(`${where}: length ${a.length} vs ${b.length}`);
    a.forEach((v, i) => walk(v, b[i], `${where}[${i}]`));
    return;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return errors.push(`${where}: expected an object`);
    for (const k of Object.keys(a)) {
      if (where === 'meta') continue;
      if (!(k in b)) errors.push(`${where}.${k}: missing`);
      else walk(a[k], b[k], `${where}.${k}`);
    }
    for (const k of Object.keys(b)) if (!(k in a)) errors.push(`${where}.${k}: not in zh.js`);
  }
}

const code = process.argv[2];
if (!code) { console.error('Usage: node tools/check-lang.js <code>'); process.exit(2); }
const zh = load('zh'), other = load(code);
for (const k of Object.keys(zh)) {
  if (k === 'meta') continue;
  if (!(k in other)) errors.push(`${k}: missing`); else walk(zh[k], other[k], k);
}
if (!other.meta || other.meta.code !== code) errors.push(`meta.code should be "${code}"`);
if (errors.length) { console.log(errors.join('\n')); console.log(`\n${errors.length} problem(s)`); process.exit(1); }
console.log(`lang/${code}.js OK`);
