const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const read = file => readFileSync(join(__dirname, '..', file), 'utf8');
const bonds = vm.runInNewContext(read('cottage-bonds.js') + '\nCottageBonds');
const ids = ['gy', 'xm', 'xy', 'jy', 'by'];
const seq = (...values) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };
const json = value => JSON.stringify(value);

test('courting two residents in the same week reaches both overnight, once', () => {
  const s = bonds.load(null, ids);
  bonds.court(s, 'gy', 'date', 3);
  bonds.court(s, 'xy', 'kiss', 4);
  const heard = bonds.spreadGossip(s, 5, () => true);
  assert.equal(json(heard), json([{id: 'gy', rival: 'xy'}, {id: 'xy', rival: 'gy'}]));
  assert.ok(s.jealousy.gy >= 35 && s.trust.gy < 0);
  assert.equal(bonds.spreadGossip(s, 6, () => true).length, 0);
  // A week later the old date no longer counts.
  const later = bonds.load(null, ids);
  bonds.court(later, 'gy', 'date', 1);
  bonds.court(later, 'xy', 'date', 9);
  assert.equal(bonds.spreadGossip(later, 9, () => true).length, 0);
  // Strangers don't care who you date.
  const strangers = bonds.load(null, ids);
  bonds.court(strangers, 'gy', 'date', 3); bonds.court(strangers, 'xy', 'date', 3);
  assert.equal(bonds.spreadGossip(strangers, 4, id => id === 'gy').length, 1);
});

test('answering honestly cools jealousy more than dodging, and dodging costs trust', () => {
  const make = () => { const s = bonds.load(null, ids); s.heard.gy = 'xy'; s.jealousy.gy = 60; return s; };
  const honest = make(), avoid = make(), soothe = make();
  assert.equal(bonds.answer(honest, 'gy', 'honest'), 'xy');
  bonds.answer(avoid, 'gy', 'avoid');
  bonds.answer(soothe, 'gy', 'soothe');
  assert.equal(honest.heard.gy, undefined);
  assert.ok(honest.jealousy.gy < soothe.jealousy.gy && soothe.jealousy.gy < avoid.jealousy.gy);
  assert.ok(honest.trust.gy > 0 && avoid.trust.gy < 0);
  bonds.newDay(avoid);
  assert.equal(avoid.jealousy.gy, 60);
});

test('a drop-in comes at most once a day, at a varying hour, and leaves a note when missed', () => {
  const s = bonds.load(null, ids);
  const people = [{id: 'gy', hearts: 1}, {id: 'xm', hearts: 6}, {id: 'xy', hearts: 4, livesIn: true}];
  const visit = bonds.planDropIn(s, 2, people, seq(0, .99, .3, .5));
  assert.equal(visit.id, 'xm');
  assert.ok(visit.at >= 540 && visit.at < 1200);
  assert.equal(bonds.planDropIn(s, 2, people, seq(.99)), visit);
  assert.equal(bonds.calling(s, 'xm', 2, visit.at - 1), false);
  assert.equal(bonds.calling(s, 'xm', 2, visit.at + 10), true);
  assert.equal(bonds.missDropIn(s, 2, visit.at + 30), null);
  assert.equal(bonds.missDropIn(s, 2, visit.at + 80).id, 'xm');
  assert.equal(bonds.calling(s, 'xm', 2, visit.at + 10), false);
  assert.equal(s.notes.at(-1).id, 'xm');
  assert.ok(s.trust.xm < 0);
  // A jealous resident comes to ask, not to chat.
  const jealous = bonds.load(null, ids);
  jealous.jealousy.xm = 50;
  assert.equal(bonds.planDropIn(jealous, 3, [{id: 'xm', hearts: 6}], seq(0, 0, .2)).reason, 'jealous');
  // Nobody who only just met you shows up uninvited.
  assert.equal(bonds.planDropIn(bonds.load(null, ids), 4, [{id: 'gy', hearts: 1}], seq(0)), null);
});

test('achievements read progress from the save, rare ones only on a lucky roll, and survive reload', () => {
  const s = bonds.load(null, ids);
  const got = bonds.checkAchievements(s, {dates: 1, birthdays: 0, sickVisits: 1, couple: false, livesIn: false, dropIns: 0, rareDate: false}, 3);
  assert.equal(json(got), json(['firstDate', 'visitSick']));
  assert.equal(bonds.checkAchievements(s, {dates: 1, sickVisits: 1}, 4).length, 0);
  assert.equal(bonds.rare(s, 'clover', 4, () => .5, .03), false);
  assert.equal(bonds.rare(s, 'clover', 4, () => .01, .03), true);
  assert.equal(bonds.rare(s, 'clover', 5, () => .01, .03), false);
  assert.equal(json(s.fresh), json(['firstDate', 'visitSick', 'clover']));
  const reloaded = bonds.load(JSON.parse(json(s)), ids, 6);
  assert.equal(reloaded.achievements.clover, 4);
  assert.equal(reloaded.fresh.length, 3);
  assert.ok(bonds.ACHIEVEMENTS.filter(a => a.rare).length >= 3);
});

test('the morning recap compares hearts with the start of yesterday and lists jealousy and notes', () => {
  const s = bonds.load(null, ids);
  bonds.startDay(s, 4, {gy: 10, xm: 30, xy: 5});
  s.heard.xm = 'gy';
  s.notes.push({id: 'xy', day: 4, reason: 'gift'});
  const r = bonds.recap(s, 5, {gy: 22, xm: 26, xy: 5});
  assert.equal(r.day, 4);
  assert.equal(json(r.changes), json([{id: 'gy', delta: 12}, {id: 'xm', delta: -4}]));
  assert.equal(json(r.jealous), json([{id: 'xm', rival: 'gy'}]));
  assert.equal(r.note.id, 'xy');
});

test('loading clamps bad values, drops unknown residents and future days', () => {
  const s = bonds.load({trust: {gy: 999, zz: 4}, jealousy: {xm: -5}, courtship: [{id: 'gy', day: 2}, {id: 'zz', day: 2}, {id: 'xm', day: 99}],
    dropIn: {id: 'gy', day: 3, at: 700, reason: 'weird'}, achievements: {firstDate: 2, fake: 1}}, ids, 5);
  assert.equal(s.trust.gy, 100);
  assert.equal(s.trust.zz, undefined);
  assert.equal(s.jealousy.xm, 0);
  assert.equal(s.courtship.length, 1);
  assert.equal(s.dropIn.reason, 'missYou');
  assert.equal(json(s.achievements), json({firstDate: 2}));
});

test('save manager v2 migrates a v1 save and keeps four morning snapshots', () => {
  const SaveManager = vm.runInNewContext(read('save-manager.js') + '\nSaveManager', {JSON, Date});
  const map = new Map(), storage = {getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v)};
  const valid = s => Number.isFinite(s.day) && Number.isFinite(s.time) && !!s.o && !!s.rel && !!s.inv;
  map.set('home', json({day: 3, time: 500, o: {}, rel: {}, inv: {}, saveVersion: 1}));
  assert.equal(SaveManager.load(storage, 'home', valid, (s, from) => ({...s, from})).from, 1);
  map.set('home', json({day: 3, time: 500, o: {}, rel: {}, inv: {}, saveVersion: 7}));
  assert.equal(SaveManager.load(storage, 'home', valid, s => s), null);
  for (let day = 1; day <= 5; day++) SaveManager.snapshot(storage, 'home', {day, time: 420, o: {}, rel: {}, inv: {}}, valid, {label: 'd-' + day, day});
  assert.equal(json(SaveManager.snapshots(storage, 'home').map(s => s.day)), '[2,3,4,5]');
  assert.equal(SaveManager.restore(storage, 'home', 1, valid).day, 3);
});
