const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const read = name => readFileSync(path.join(__dirname, '..', name), 'utf8');
const source = read('memory-album.js');
const gameSource = require('./game-source.cjs')(read('index.html'));
const residents = ['gy', 'xm'];

function runtime(stubs = {}) {
  const context = vm.createContext(stubs);
  vm.runInContext(source + '\nthis.album = MemoryAlbum;', context);
  return context;
}

test('older event cards appear with their original dates and details', () => {
  const {album} = runtime();
  const life = {gy: {
    cards: {firstDate: 4, rareDate: 7, birthday: 2, visitSick: 6, neighborRequest: 3},
    firstDate: {place: 'pond', day: 4},
    rareDatePlace: 'home',
    firstGift: {day: 1, item: 'cookie'},
    fishingInvitation: {catch: {day: 9, kind: 'moonfish', time: 1190, size: 20}},
  }};
  const cards = JSON.parse(JSON.stringify(album.collect(residents, life, album.load())));
  assert.deepEqual(cards.map(({kind}) => kind), [
    'sharedFishing', 'rareDate', 'visitSick', 'firstDate', 'neighborRequest', 'birthday', 'firstGift',
  ]);
  assert.equal(cards[0].info.size, 20);
  assert.equal(cards[1].place, 'home');
  assert.equal(cards[3].place, 'pond');
  assert.equal(cards.at(-1).info.item, 'cookie');
});

test('the cottage frame keeps its original image and recognition across saves', () => {
  const {album} = runtime();
  const framed = {key: 'gy:firstDate', day: 2, resident: 'gy', postcard: false,
    image: 'data:image/png;base64,aW1hZ2U=', noticed: true};
  const restored = album.load(JSON.parse(JSON.stringify({framed})), residents, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.framed)), framed);
  assert.equal(album.load({}, residents, 4).framed, null);
  assert.equal(album.load({framed}, residents, 1).framed, null);
  assert.equal(album.load({framed: {...framed, image: 'https://example.com/img.png'}}, residents, 4).framed, null);
});

test('overnight delivery rotates familiar residents and stays unique across reloads', () => {
  const state = {
    day: 1, picked: [], garden: [], pets: [],
    rel: {gy: {met: true}, xm: {met: false}},
  };
  let choices, opened;
  const context = runtime({
    state, ALBUM_RESIDENTS: residents, NPCS: [], npcs: residents.map(id => ({id})), flowers: [],
    CottageActivities: {grow() {}}, rememberMissedOccasions() {},
    objName: id => id, nm: n => n.id, tr: (key, args) => args?.n ?? key,
    talk(_name, lines, options) { assert.equal(lines[0], 'gy'); choices = options; },
    openAlbum(tab) { opened = tab; }, checkNeighborMail() {}, bondsNewDay() {},
  });
  state.album = context.album.load();
  for (const [start, end] of [['function newDay(', 'function wakeAtBed('],
    ['function deliverAlbumPostcard(', 'function checkNeighborMail(']]) {
    vm.runInContext(gameSource.slice(gameSource.indexOf(start), gameSource.indexOf(end)), context);
  }

  context.newDay(420);
  assert.equal(state.album.postcards.length, 0);
  context.newDay(420);
  context.deliverAlbumPostcard();
  assert.equal(state.album.postcards.length, 1);
  context.checkMail();
  choices[0].fn();
  assert.equal(opened, 'postcards');
  state.album.seen.push(context.album.postcardKey(state.album.postcards[0]));
  state.album = context.album.load(JSON.parse(JSON.stringify(state.album)), residents, state.day);
  assert.equal(context.unreadAlbumPostcard(), undefined);

  state.rel.xm.met = true;
  while (state.day < 15) context.newDay(420);
  assert.deepEqual(Array.from(state.album.postcards, card => [card.day, card.resident, card.variant]), [
    [3, 'gy', 0], [6, 'xm', 0], [9, 'gy', 1], [12, 'xm', 1],
  ]);
});
