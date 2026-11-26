// In-app WebViews (TapTap H5 among them) may refuse localStorage or clear it with
// the cache. The save then goes to the host's tap.setStorageSync, or localStorage,
// after a probe; with neither, the game is still playable for the visit.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const read = name => readFileSync(join(__dirname, '..', name), 'utf8');
const storageSource = read('cottage-storage.js'), saveSource = read('save-manager.js');
const LIVE = 'homelove-save-v1', DEV = 'homelove-save-dev';
const bytes = value => Buffer.byteLength(String(value));

// TapTap documents 1MB per key and 10MB in total for tap.setStorageSync.
function fakeTap({perKey = 1024 * 1024, total = 10 * 1024 * 1024} = {}) {
  const data = new Map();
  const used = () => { let n = 0; for (const [k, v] of data) n += bytes(k) + bytes(v); return n; };
  return {
    data,
    getStorageSync: key => data.has(key) ? data.get(key) : '',
    setStorageSync(key, value) {
      value = String(value);
      if (bytes(value) > perKey) throw Object.assign(new Error('setStorageSync:fail exceed max size'), {errMsg: 'setStorageSync:fail exceed max size'});
      const old = data.has(key) ? bytes(key) + bytes(data.get(key)) : 0;
      if (used() - old + bytes(key) + bytes(value) > total) throw Object.assign(new Error('setStorageSync:fail storage full'), {errMsg: 'setStorageSync:fail storage full'});
      data.set(key, value);
    },
    removeStorageSync: key => { data.delete(key); },
  };
}
function memoryLocal(initial = []) {
  const data = new Map(initial);
  return {data, getItem: k => data.has(k) ? data.get(k) : null, setItem: (k, v) => { data.set(k, String(v)); }, removeItem: k => { data.delete(k); }};
}
// One page load: cottage-storage.js and save-manager.js in a fresh context.
function load(globals, setup) {
  const context = vm.createContext({console, ...globals});
  if (setup) setup(context);
  vm.runInContext(storageSource + '\n' + saveSource + '\nthis.CottageStorage=CottageStorage;this.SaveManager=SaveManager;', context);
  return {storage: context.CottageStorage, saves: context.SaveManager, store: context.SaveManager.getStorage()};
}
const valid = s => Number.isFinite(s.day) && !!s.rel;
const game = (day, extra = {}) => ({day, time: 480, rel: {gy: {pts: day}}, ...extra});

test('in a browser the save stays in localStorage', () => {
  const localStorage = memoryLocal();
  const page = load({localStorage});
  assert.equal(page.storage.kind, 'local');
  assert.equal(page.storage.persistent, true);
  assert.equal(page.saves.save(page.store, LIVE, game(3), valid), true);
  assert.equal(load({localStorage}).saves.load(load({localStorage}).store, LIVE, valid).day, 3);
  assert.deepEqual([...localStorage.data.keys()], [LIVE], 'the probe leaves nothing behind');
});

test('inside TapTap the save, snapshots and settings go through tap.setStorageSync and survive a restart', () => {
  const tap = fakeTap(), localStorage = memoryLocal();
  const first = load({tap, localStorage});
  assert.equal(first.storage.kind, 'tap');
  assert.equal(first.saves.save(first.store, LIVE, game(2), valid), true);
  assert.equal(first.saves.save(first.store, LIVE, game(3), valid), true);
  assert.equal(first.saves.snapshot(first.store, LIVE, game(3), valid, {label: 'd-3', day: 3}), true);
  first.store.setItem('homelove-lang', 'ja');
  assert.deepEqual([...localStorage.data.keys()], [], 'nothing is written to localStorage');

  const second = load({tap, localStorage});
  assert.equal(second.saves.load(second.store, LIVE, valid).day, 3);
  assert.equal(JSON.parse(second.store.getItem(LIVE + ':backup')).day, 2, 'the previous save is the backup');
  assert.equal(second.saves.snapshots(second.store, LIVE).length, 1);
  assert.equal(second.store.getItem('homelove-lang'), 'ja');
});

test('a save larger than one TapTap key is chunked and read back exactly', () => {
  const tap = fakeTap(), page = load({tap});
  const diary = '今天和顾言在池塘边钓鱼，钓到一条小鲤鱼。'.repeat(30000);
  assert.ok(bytes(diary) > 1024 * 1024);
  assert.equal(page.saves.save(page.store, LIVE, game(4, {diary}), valid), true);
  for (const value of tap.data.values()) assert.ok(bytes(value) <= 1024 * 1024, 'every key stays under 1MB');
  const chunks = () => [...tap.data.keys()].filter(k => k.startsWith(LIVE + '#'));
  assert.ok(chunks().length > 1, 'the save spans several keys');
  assert.equal(load({tap}).saves.load(load({tap}).store, LIVE, valid).diary, diary);

  page.store.setItem(LIVE, JSON.stringify(game(5)));
  assert.equal(chunks().length, 1, 'chunks of the replaced value are released');
  page.store.removeItem(LIVE);
  assert.equal(page.store.getItem(LIVE), null);
  assert.equal(chunks().length, 0);
});

test('a full TapTap store keeps the save it had and reports the failure', () => {
  const tap = fakeTap({total: 300000}), page = load({tap});
  assert.equal(page.saves.save(page.store, LIVE, game(1), valid), true);
  const before = new Set(tap.data.keys());
  assert.equal(page.saves.save(page.store, LIVE, game(2, {diary: 'x'.repeat(400000)}), valid), false);
  assert.equal(load({tap}).saves.load(load({tap}).store, LIVE, valid).day, 1);
  assert.deepEqual(new Set(tap.data.keys()), before, 'no half-written copy is left');
});

test('a TapTap store that refuses writes, or does not read back, falls through to localStorage', () => {
  const refusing = fakeTap();
  refusing.setStorageSync = () => { throw new Error('setStorageSync:fail'); };
  assert.equal(load({tap: refusing, localStorage: memoryLocal()}).storage.kind, 'local');
  const forgetful = fakeTap();
  forgetful.getStorageSync = () => '';
  assert.equal(load({tap: forgetful, localStorage: memoryLocal()}).storage.kind, 'local');
});

test('with no store that reads back, the game is playable for the visit and says it cannot save', () => {
  const localStorage = memoryLocal();
  localStorage.getItem = () => null;
  const page = load({localStorage});
  assert.equal(page.storage.kind, 'memory');
  assert.equal(page.storage.persistent, false);
  assert.equal(page.saves.save(page.store, LIVE, game(2), valid), true);
  assert.equal(page.saves.load(page.store, LIVE, valid).day, 2);
  const again = load({localStorage});
  assert.equal(again.saves.load(again.store, LIVE, valid), null);

  const throwing = load({}, context => Object.defineProperty(context, 'localStorage', {get() { throw new Error('SecurityError'); }}));
  assert.equal(throwing.storage.kind, 'memory');
  // The game shows the notice once, when the player first presses Start.
  const input = read('js/input.js');
  assert.match(input, /if\(!helloShown\)\{helloShown=true;\s*if\(typeof CottageStorage!=='undefined'&&!CottageStorage\.persistent\)setTimeout\(\(\)=>notify\(tr\('storageUnavailable'\)\)/);
  for (const lang of ['zh', 'en', 'ja']) assert.match(read(`lang/${lang}.js`), /"storageUnavailable": "[^"]+"/);
});

test('a browser save in the same WebView comes into TapTap storage once', () => {
  const browserSave = JSON.stringify(game(6, {saveVersion: 2}));
  const localStorage = memoryLocal([[LIVE, browserSave], [LIVE + ':backup', JSON.stringify(game(5))], ['homelove-sound', 'off'], ['unrelated', 'x']]);
  const tap = fakeTap(), first = load({tap, localStorage});
  assert.equal(first.saves.load(first.store, LIVE, valid).day, 6);
  assert.equal(first.store.getItem('homelove-sound'), 'off');
  assert.equal(first.store.getItem('unrelated'), null);
  // Starting over inside TapTap does not bring the browser save back.
  first.store.removeItem(LIVE);
  first.store.removeItem(LIVE + ':backup');
  const second = load({tap, localStorage});
  assert.equal(second.saves.load(second.store, LIVE, valid), null);
  assert.equal(localStorage.data.get(LIVE), browserSave, 'the browser copy is left alone');
});

test('the test-mode save and the real save stay apart in every store', () => {
  for (const globals of [{tap: fakeTap()}, {localStorage: memoryLocal()}, {}]) {
    const page = load(globals);
    page.saves.save(page.store, LIVE, game(7), valid);
    page.saves.save(page.store, DEV, game(99), valid);
    assert.equal(page.saves.load(page.store, LIVE, valid).day, 7, page.storage.kind);
    assert.equal(page.saves.load(page.store, DEV, valid).day, 99, page.storage.kind);
  }
  // dev.html is index.html with data-mode="test", which picks the dev key.
  assert.match(read('js/state.js'), /const LS=document\.body\.dataset\.mode==='test'\?'homelove-save-dev':'homelove-save-v1';/);
  assert.match(read('dev.html'), /<body data-mode="test">/);
  assert.equal(read('dev.html').replace('<title>[DEV] ', '<title>').replace('<body data-mode="test">', '<body>').replace(/<script src="dev\/panel\.js[^"]*"><\/script>\n/, ''), read('index.html'), 'dev.html is regenerated from index.html');
});

test('no script reaches localStorage directly any more', () => {
  const sources = ['js/core.js', 'js/audio.js', 'js/hud.js', 'js/state.js', 'js/main.js', 'js/diary.js', 'js/relationships.js', 'dev/panel.js'];
  for (const name of sources) assert.doesNotMatch(read(name), /\blocalStorage\./, name);
});
