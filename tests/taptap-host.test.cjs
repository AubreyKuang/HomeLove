// The TapTap H5 host is detected but never asked to log in, and nothing is fetched:
// the fonts, language packs and scripts all ship with the game.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const read = name => readFileSync(join(__dirname, '..', name), 'utf8');
const source = read('js/taptap.js');
function run(globals) {
  const classes = new Set(), listeners = {};
  const context = vm.createContext({document: {documentElement: {classList: {add: c => classes.add(c)}}},
    addEventListener: (name, fn) => { listeners[name] = fn; }, ...globals});
  vm.runInContext(source + '\nthis.TapTapHost=TapTapHost;', context);
  return {context, classes, listeners, host: context.TapTapHost};
}

test('outside TapTap the module stays inert', () => {
  const {host, classes} = run({});
  assert.equal(host.inHost, false);
  assert.equal(classes.size, 0);
});

test('inside TapTap the page is marked, without logging in or sending anything', () => {
  const calls = [];
  let onHide = null;
  const tap = {setStorageSync() {}, getStorageSync() {}, login() { calls.push('login'); }, onHide(fn) { onHide = fn; }};
  const {host, classes} = run({tap});
  assert.equal(host.inHost, true);
  assert.ok(classes.has('taptap-host'));
  assert.deepEqual(calls, [], 'tap.login is never called');
  let saved = 0;
  host.onHide(() => saved++);
  onHide();
  assert.equal(saved, 1, 'going to the background saves the game');
  assert.doesNotMatch(source, /\.login\(|fetch\(|XMLHttpRequest|sendBeacon/);
});

test('a host injected after the scripts ran is picked up on load', () => {
  const {context, host, classes, listeners} = run({});
  context.tap = {getSystemInfoSync() {}};
  listeners.load();
  assert.equal(host.inHost, true);
  assert.ok(classes.has('taptap-host'));
});

test('buttons that download a file are left out inside the host', () => {
  assert.match(read('js/core.js'), /const canDownload=\(\)=>typeof TapTapHost==='undefined'\|\|!TapTapHost\.inHost;/);
  assert.match(read('js/album.js'), /if\(canDownload\(\)\)page\.append\(keep\);/);
  assert.match(read('js/diary.js'), /if\(canDownload\(\)\)section\.append\(backup\);/);
  assert.match(read('js/relationships.js'), /if\(open&&canDownload\(\)\)\{const save=/);
  assert.match(read('js/interaction.js'), /\.\.\.\(canDownload\(\)\?\[\{label:tr\('projectArtSave'\)/);
});

test('the page loads nothing from the network', () => {
  for (const name of ['index.html', 'dev.html', 'style.css']) {
    const page = read(name);
    assert.doesNotMatch(page, /https?:\/\//, name + ' has no outside URL');
  }
  const css = read('style.css');
  const fonts = [...css.matchAll(/@font-face\{font-family:"([^"]+)";src:url\("([^"]+)"\)/g)];
  assert.deepEqual(fonts.map(m => m[1]).sort(), ['DotGothic16', 'Pixelify Sans', 'Silkscreen', 'ZCOOL KuaiLe']);
  for (const [, family, file] of fonts) {
    const body = readFileSync(join(__dirname, '..', file));
    assert.equal(body.subarray(0, 4).toString('latin1'), 'wOF2', family + ' is a WOFF2 font');
  }
  for (const family of ['ZCOOLKuaiLe', 'DotGothic16', 'PixelifySans', 'Silkscreen'])
    assert.match(read(`fonts/${family}-OFL.txt`), /SIL Open Font License, Version 1\.1/);
});
