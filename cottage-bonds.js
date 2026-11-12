// Trust, jealousy, unannounced visits, achievements and the morning recap.
// Pure state logic: index.html supplies the day, the residents and the dice, and shows the text.
const CottageBonds = (() => {
  const WINDOW = 7;               // days a date or a kiss stays "recent" gossip
  const DROP_REASONS = ['missYou', 'gift', 'help', 'news', 'jealous', 'apology'];
  const ACHIEVEMENTS = [
    {key:'firstDate', icon:'♥', color:'#e2708a'},
    {key:'birthday', icon:'✿', color:'#e7a23f'},
    {key:'visitSick', icon:'✚', color:'#6aa66e'},
    {key:'couple', icon:'❦', color:'#d0506a'},
    {key:'movedIn', icon:'⌂', color:'#b9864c'},
    {key:'dropIn', icon:'✉', color:'#6b8fc0'},
    {key:'honest', icon:'◎', color:'#7a7fb8'},
    {key:'trusted', icon:'✦', color:'#c99a3a'},
    {key:'heartbreak', icon:'☂', color:'#7d8a96'},
    {key:'week', icon:'☀', color:'#d99b45'},
    {key:'rareDate', icon:'★', color:'#c25e86', rare:true},
    {key:'clover', icon:'☘', color:'#4f9a55', rare:true},
    {key:'shootingStar', icon:'☄', color:'#4d5aa8', rare:true}
  ];
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const num = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;

  function load(saved, ids = [], today = 1) {
    const s = saved && typeof saved === 'object' ? saved : {};
    const map = (src, min, max) => Object.fromEntries(ids.map(id => [id, clamp(num(src?.[id]), min, max)]));
    const courtship = Array.isArray(s.courtship) ? s.courtship.filter(c => ids.includes(c?.id) && Number.isInteger(c.day) && c.day <= today).slice(-40) : [];
    const dropIn = s.dropIn && ids.includes(s.dropIn.id) && Number.isInteger(s.dropIn.day) && s.dropIn.day <= today ? {
      id: s.dropIn.id, day: s.dropIn.day, at: clamp(num(s.dropIn.at, 600), 0, 1440),
      reason: DROP_REASONS.includes(s.dropIn.reason) ? s.dropIn.reason : 'missYou',
      met: !!s.dropIn.met, missed: !!s.dropIn.missed, arrived: !!s.dropIn.arrived
    } : null;
    const achievements = {};
    for (const a of ACHIEVEMENTS) if (Number.isInteger(s.achievements?.[a.key])) achievements[a.key] = s.achievements[a.key];
    return {
      trust: map(s.trust, -100, 100), jealousy: map(s.jealousy, 0, 100), courtship,
      heard: Object.fromEntries(ids.filter(id => typeof s.heard?.[id] === 'string' && ids.includes(s.heard[id])).map(id => [id, s.heard[id]])),
      dropIn, achievements, fresh: Array.isArray(s.fresh) ? s.fresh.filter(k => achievements[k] != null) : [],
      shootingDay: num(s.shootingDay), notes: Array.isArray(s.notes) ? s.notes.filter(n => ids.includes(n?.id)).slice(-6) : [],
      report: s.report && Number.isInteger(s.report.day) ? s.report : null,
      dayStart: s.dayStart && typeof s.dayStart === 'object' ? s.dayStart : null
    };
  }

  function addTrust(s, id, delta) { if (id in s.trust) s.trust[id] = clamp(s.trust[id] + delta, -100, 100); }
  function addJealousy(s, id, delta) { if (id in s.jealousy) s.jealousy[id] = clamp(s.jealousy[id] + delta, 0, 100); }
  function trustWord(v) { return v >= 40 ? 'trustHigh' : v >= 12 ? 'trustMid' : v <= -25 ? 'trustLow' : v <= -8 ? 'trustWary' : 'trustNone'; }

  // A date, holding hands, a kiss, a confession. Courting more than one person at a time gets noticed.
  function court(s, id, kind, day) {
    s.courtship.push({id, kind, day});
    if (s.courtship.length > 40) s.courtship.shift();
  }
  function rivals(s, id, day) {
    return [...new Set(s.courtship.filter(c => c.id !== id && day - c.day < WINDOW).map(c => c.id))];
  }
  // Overnight the neighbours talk. Anyone you courted recently hears about the others.
  function spreadGossip(s, day, isClose) {
    const heard = [];
    const courted = [...new Set(s.courtship.filter(c => day - c.day < WINDOW).map(c => c.id))];
    for (const id of courted) {
      const others = rivals(s, id, day);
      if (!others.length || !isClose(id) || s.heard[id]) continue;
      s.heard[id] = others[others.length - 1];
      addJealousy(s, id, 25 + 10 * others.length);
      addTrust(s, id, -6);
      heard.push({id, rival: s.heard[id]});
    }
    return heard;
  }
  // You talked it through. Honesty costs a little trust now and earns some back.
  function answer(s, id, how) {
    const was = s.heard[id];
    delete s.heard[id];
    if (how === 'honest') { addJealousy(s, id, -30); addTrust(s, id, 4); }
    else if (how === 'soothe') { addJealousy(s, id, s.trust[id] >= 15 ? -25 : -8); }
    else { addTrust(s, id, -10); addJealousy(s, id, 10); }
    return was;
  }
  function newDay(s) {
    for (const id of Object.keys(s.jealousy)) s.jealousy[id] = Math.max(0, s.jealousy[id] - 10);
  }

  // At most one unannounced visit a day, at an hour that changes every day.
  function planDropIn(s, day, people, roll) {
    if (s.dropIn && s.dropIn.day === day) return s.dropIn;
    const eligible = people.filter(p => p.hearts >= 2 && !p.livesIn);
    s.dropIn = null;
    if (!eligible.length) return null;
    const weights = eligible.map(p => p.hearts + Math.max(0, s.trust[p.id] / 10) + s.jealousy[p.id] / 15);
    const total = weights.reduce((a, b) => a + b, 0);
    if (roll() > Math.min(.75, .25 + total / 60)) return null;
    let pickAt = roll() * total, chosen = eligible[0];
    for (let i = 0; i < eligible.length; i++) { pickAt -= weights[i]; if (pickAt <= 0) { chosen = eligible[i]; break; } }
    const reason = s.jealousy[chosen.id] >= 40 ? 'jealous' : s.trust[chosen.id] <= -15 ? 'apology' : chosen.hearts >= 6 && roll() < .5 ? 'missYou' : ['gift', 'help', 'news'][Math.floor(roll() * 3)];
    s.dropIn = {id: chosen.id, day, at: 9 * 60 + Math.floor(roll() * 11 * 60), reason, met: false, missed: false, arrived: false};
    return s.dropIn;
  }
  const calling = (s, id, day, time) => !!s.dropIn && s.dropIn.id === id && s.dropIn.day === day && !s.dropIn.met && !s.dropIn.missed && time >= s.dropIn.at && time < s.dropIn.at + 75;
  function meetDropIn(s) { if (s.dropIn) s.dropIn.met = true; return s.dropIn; }
  // Nobody answered the door: they leave a note instead.
  function missDropIn(s, day, time) {
    const d = s.dropIn;
    if (!d || d.met || d.missed || d.day !== day || time < d.at + 75) return null;
    d.missed = true;
    s.notes.push({id: d.id, day, reason: d.reason});
    if (s.notes.length > 6) s.notes.shift();
    addTrust(s, d.id, -2);
    return d;
  }

  function unlock(s, key, day) {
    if (s.achievements[key] != null || !ACHIEVEMENTS.some(a => a.key === key)) return false;
    s.achievements[key] = day; s.fresh.push(key);
    return true;
  }
  // Facts are read from the save, so achievements also catch up on old progress.
  function checkAchievements(s, facts, day) {
    const got = [];
    const rules = {
      firstDate: facts.dates > 0, birthday: facts.birthdays > 0, visitSick: facts.sickVisits > 0,
      couple: facts.couple, movedIn: facts.livesIn, dropIn: facts.dropIns > 0, rareDate: facts.rareDate,
      trusted: Object.values(s.trust).some(v => v >= 50), heartbreak: Object.values(s.jealousy).some(v => v >= 60), week: day >= 8
    };
    for (const [key, ok] of Object.entries(rules)) if (ok && unlock(s, key, day)) got.push(key);
    return got;
  }
  // Rare finds. The dice come from the caller.
  function rare(s, key, day, roll, chance) {
    if (s.achievements[key] != null || roll() >= chance) return false;
    return unlock(s, key, day);
  }

  // Morning recap of yesterday, built from numbers the game kept during the day.
  function startDay(s, day, pts) { s.dayStart = {day, pts: {...pts}}; }
  function recap(s, day, pts, extra = {}) {
    const start = s.dayStart?.day === day - 1 ? s.dayStart.pts : null;
    const changes = start ? Object.entries(pts).map(([id, v]) => ({id, delta: v - (start[id] ?? v)})).filter(c => c.delta) .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)) : [];
    s.report = {day: day - 1, changes: changes.slice(0, 3), note: s.notes.find(n => n.day === day - 1) || null,
      jealous: Object.entries(s.heard).map(([id, rival]) => ({id, rival})), ...extra};
    return s.report;
  }

  return {load, addTrust, addJealousy, trustWord, court, rivals, spreadGossip, answer, newDay, planDropIn, calling, meetDropIn, missDropIn,
    unlock, checkAchievements, rare, startDay, recap, ACHIEVEMENTS, DROP_REASONS};
})();
