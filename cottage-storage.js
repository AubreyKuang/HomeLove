/* Where the save, the language and the sound switch live.
   In-app WebViews (the TapTap H5 host among them) may refuse localStorage or
   clear it with the WebView cache. Each store is trusted only after a probe value
   is written and read back unchanged:

     tap.setStorageSync → localStorage → this visit only

   The save is read synchronously while the scripts load, so IndexedDB, which only
   answers asynchronously, is not on the list. Every store looks like localStorage
   (getItem / setItem / removeItem), which is what SaveManager expects. */
const CottageStorage = (() => {
  const PROBE = 'homelove-probe';
  const IMPORTED = 'homelove-imported';
  // Keys a browser visit may have left in localStorage; they come along into tap storage once.
  const KEYS = ['homelove-save-v1', 'homelove-save-dev', 'homelove-lang', 'homelove-sound'];
  const SUFFIXES = ['', ':backup', ':snapshots'];
  // TapTap allows 1MB per key and 10MB in all. 200k UTF-16 units stay under 1MB as UTF-8.
  const CHUNK = 200000;
  const quiet = fn => { try { return fn(); } catch { return null; } };
  const token = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // A value is stored as chunks first and a small manifest under its own key last,
  // so a write cut short leaves the previous value readable.
  function tapStore() {
    const tap = globalThis.tap;
    if (typeof tap?.setStorageSync !== 'function' || typeof tap.getStorageSync !== 'function') return null;
    const raw = key => {
      const value = tap.getStorageSync(key);
      return value === '' || value === undefined || value === null ? null : String(value);
    };
    const drop = key => typeof tap.removeStorageSync === 'function' ? tap.removeStorageSync(key) : tap.setStorageSync(key, '');
    const manifest = head => {
      const meta = quiet(() => JSON.parse(head));
      return meta && meta.homelove === 'chunks' && typeof meta.rev === 'string' && Number.isInteger(meta.n) ? meta : null;
    };
    const dropChunks = meta => { for (let i = 0; i < meta.n; i++) quiet(() => drop(meta.key + '#' + meta.rev + ':' + i)); };
    return {
      kind: 'tap',
      getItem(key) {
        const head = raw(key);
        if (head === null) return null;
        const meta = manifest(head);
        if (!meta) return head;
        let value = '';
        for (let i = 0; i < meta.n; i++) {
          const part = raw(key + '#' + meta.rev + ':' + i);
          if (part === null && meta.n > 1) throw new Error('Save chunk missing');
          value += part ?? '';
        }
        return value;
      },
      setItem(key, value) {
        value = String(value);
        const prior = manifest(raw(key) ?? '');
        const meta = { homelove: 'chunks', rev: token(), n: Math.max(1, Math.ceil(value.length / CHUNK)) };
        try {
          for (let i = 0; i < meta.n; i++) tap.setStorageSync(key + '#' + meta.rev + ':' + i, value.slice(i * CHUNK, (i + 1) * CHUNK));
          tap.setStorageSync(key, JSON.stringify(meta));
        } catch (error) {
          dropChunks({ ...meta, key });
          throw error;
        }
        if (prior) dropChunks({ ...prior, key });
      },
      removeItem(key) {
        const prior = manifest(raw(key) ?? '');
        drop(key);
        if (prior) dropChunks({ ...prior, key });
      },
    };
  }
  function localStore() {
    const ls = quiet(() => globalThis.localStorage);
    if (!ls || typeof ls.setItem !== 'function') return null;
    return {
      kind: 'local',
      getItem: key => ls.getItem(key),
      setItem: (key, value) => { ls.setItem(key, value); },
      removeItem: key => { ls.removeItem(key); },
    };
  }
  function memoryStore() {
    const data = new Map();
    return {
      kind: 'memory',
      getItem: key => data.has(key) ? data.get(key) : null,
      setItem: (key, value) => { data.set(key, String(value)); },
      removeItem: key => { data.delete(key); },
    };
  }
  function works(store) {
    if (!store) return false;
    try {
      const value = '屋' + token();
      store.setItem(PROBE, value);
      const back = store.getItem(PROBE);
      store.removeItem(PROBE);
      return back === value;
    } catch {
      return false;
    }
  }
  // The first time the game opens inside TapTap, a save from a browser visit in the
  // same WebView comes along. Afterwards tap storage is the only copy that counts.
  function importOnce(tap, local) {
    if (!works(local) || quiet(() => tap.getItem(IMPORTED))) return;
    for (const key of KEYS) for (const suffix of SUFFIXES) {
      const name = key + suffix, value = quiet(() => local.getItem(name));
      if (value !== null && value !== undefined && quiet(() => tap.getItem(name)) === null) quiet(() => tap.setItem(name, value));
    }
    quiet(() => tap.setItem(IMPORTED, '1'));
  }

  function pick() {
    const tap = quiet(tapStore), local = quiet(localStore);
    if (works(tap)) {
      importOnce(tap, local);
      return tap;
    }
    return works(local) ? local : memoryStore();
  }

  const store = pick();
  return {
    store,
    kind: store.kind,
    // false when nothing survives a reload: the game says so once and keeps going.
    persistent: store.kind !== 'memory',
  };
})();
