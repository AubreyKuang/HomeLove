const CottageActivities = (() => {
  const crops = {
    berry: {days: 2, regrow: 1},
    carrot: {days: 1},
    pumpkin: {days: 3}
  };
  const fish = {
    fish: {min: 10, max: 24},
    carp: {min: 22, max: 52},
    moonfish: {min: 16, max: 36}
  };
  const seed = crop => ({crop, growth: 0, watered: false});
  const ripe = plot => !!plot && plot.growth >= crops[plot.crop].days;

  function loadGarden(garden, legacy) {
    return Array.from({length: 12}, (_, i) => {
      if (Array.isArray(garden) && garden.length === 12) {
        const plot = garden[i];
        if (!plot || !Object.hasOwn(crops, plot.crop)) return null;
        return {
          crop: plot.crop,
          growth: Number.isInteger(plot.growth) ? Math.max(0, Math.min(crops[plot.crop].days, plot.growth)) : 0,
          watered: plot.watered === true
        };
      }
      if (Array.isArray(legacy) && legacy.length === 12) {
        return {...seed('berry'), growth: legacy[i] ? 1 : 2};
      }
      return i < 2 ? {...seed('berry'), growth: 2} : null;
    });
  }

  function grow(garden) {
    for (const plot of garden) {
      if (!plot) continue;
      if (plot.watered && !ripe(plot)) plot.growth++;
      plot.watered = false;
    }
  }

  function pickCrop(garden, index) {
    const plot = garden[index];
    if (!ripe(plot)) return null;
    const {days, regrow} = crops[plot.crop];
    garden[index] = regrow ? {...seed(plot.crop), growth: days - regrow} : null;
    return plot.crop;
  }

  function rollCatch(spot, night, bait, roll) {
    const star = night ? .12 : .025;
    const species = night
      ? (spot === 'reeds' ? .18 : .28) + (bait ? .13 : 0)
      : (spot === 'reeds' ? .09 : .23) + (bait ? .15 : 0);
    const shell = bait ? .08 : .19;
    if (roll < star) return 'star';
    if (roll < star + species) return night ? 'moonfish' : 'carp';
    return roll < star + species + shell ? 'shell' : 'fish';
  }

  function loadFishLog(log) {
    const entries = [];
    for (const [kind, size] of Object.entries(fish)) {
      const entry = log?.[kind];
      if (Number.isInteger(entry?.count) && entry.count > 0 &&
          Number.isInteger(entry.firstDay) && entry.firstDay > 0 &&
          Number.isInteger(entry.best) && entry.best >= size.min && entry.best <= size.max) {
        entries.push([kind, {count: entry.count, firstDay: entry.firstDay, best: entry.best}]);
      }
    }
    return Object.fromEntries(entries);
  }

  function logFish(log, kind, day, roll) {
    if (!Object.hasOwn(fish, kind)) return null;
    const {min, max} = fish[kind];
    const size = min + Math.floor(roll * (max - min + 1));
    const previous = log[kind];
    const record = !previous || size > previous.best;
    log[kind] = {
      count: (previous?.count || 0) + 1,
      firstDay: previous?.firstDay ?? day,
      best: record ? size : previous.best
    };
    return {size, record};
  }

  return {crops, fish, seed, ripe, loadGarden, grow, pickCrop, rollCatch, loadFishLog, logFish};
})();
