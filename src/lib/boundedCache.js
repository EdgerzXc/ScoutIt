// ─────────────────────────────────────────────────────────────────────────
// BOUNDED IN-PROCESS CACHE (LRU)
// Master Action Plan §1.0B — "Cap the geocodeCache"
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────
// `new Map()` used as a process-lifetime cache is only safe when its key
// space is closed. `cmsCache.js` keyed its geocode cache on `p.location` —
// a free-text string that ultimately originates from listing input. A
// stream of unique location strings grows the Map without limit and, worse,
// spends one Mapbox call per novel key, which exhausts the geocoding rate
// limit for every real visitor.
//
// A bound turns both failure modes into a bounded one: memory is capped,
// and the eviction is the cheapest possible (least recently used).
//
// This is deliberately dependency-free. `lru-cache` would work, but this
// cache needs exactly get/set/has with a size cap, and a Map already
// preserves insertion order — re-inserting on read gives correct LRU
// semantics in a dozen lines.
// ─────────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_ENTRIES = 500;

export class BoundedCache {
  /**
   * @param {object}  [options]
   * @param {number}  [options.maxEntries] hard cap on retained keys
   * @param {number}  [options.ttlMs]      optional per-entry expiry
   */
  constructor({ maxEntries = DEFAULT_MAX_ENTRIES, ttlMs = 0 } = {}) {
    this.maxEntries = Math.max(1, Number(maxEntries) || DEFAULT_MAX_ENTRIES);
    this.ttlMs = Math.max(0, Number(ttlMs) || 0);
    this.map = new Map();
  }

  get size() {
    return this.map.size;
  }

  #isExpired(entry) {
    return this.ttlMs > 0 && Date.now() - entry.storedAt > this.ttlMs;
  }

  has(key) {
    const entry = this.map.get(key);
    if (entry === undefined) return false;
    if (this.#isExpired(entry)) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  get(key) {
    const entry = this.map.get(key);
    if (entry === undefined) return undefined;
    if (this.#isExpired(entry)) {
      this.map.delete(key);
      return undefined;
    }
    // Re-insert so this key becomes the most recently used.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, storedAt: Date.now() });

    // Map iteration order is insertion order, so the first key is the LRU.
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      this.map.delete(oldest.value);
    }
    return this;
  }

  delete(key) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

export default BoundedCache;
