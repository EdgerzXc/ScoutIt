/**
 * Client-side Storage & Synchronization for Saved Signals (Follow-up List)
 *
 * SCOUTIT ARCHITECTURAL RULE:
 * Saved follow-ups belong in:
 * 1. The Dashboard Workplace (/dashboard) for authenticated users.
 * 2. "Your Board" (/wishlist, Layer 06) for unauthenticated / offline users (and unified board).
 *
 * Signals should NEVER be stranded in a dead-end auth-gate inside Layer 02 Stratosphere.
 * When an unauthenticated visitor bookmarks a signal on Stratosphere Radar or feed,
 * it is safely stored in localStorage under `scoutit_saved_signals`. When they sign in,
 * it synchronizes cleanly to their account.
 */

export const SAVED_SIGNALS_STORAGE_KEY = "scoutit_saved_signals";

/**
 * Retrieve all signals saved locally on this browser / device.
 * @returns {Array<object>}
 */
export function getLocalSavedSignals() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_SIGNALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[savedSignalsClient] Error reading local saved signals:", err);
    return [];
  }
}

/**
 * Check if a signal is currently bookmarked locally.
 * @param {string} signalId
 * @returns {boolean}
 */
export function isSignalSavedLocally(signalId) {
  if (!signalId) return false;
  const list = getLocalSavedSignals();
  return list.some((s) => s.id === signalId);
}

/**
 * Save a signal snapshot locally on this browser / device.
 * Emits 'scoutit:signal-saved-changed' so all active views update reactively.
 * @param {object} signal
 * @returns {Array<object>} updated list
 */
export function saveSignalLocally(signal) {
  if (typeof window === "undefined" || !signal?.id) return [];
  try {
    const list = getLocalSavedSignals();
    const existingIndex = list.findIndex((s) => s.id === signal.id);

    const snapshot = {
      id: signal.id,
      title: signal.title || "Untitled Signal",
      signal_type: signal.signal_type || signal.signalType || "looking_for",
      category: signal.category || "commercial",
      city: signal.city || "",
      district: signal.district || "",
      building_name: signal.building_name || signal.buildingName || "",
      radiusKm: typeof signal.radiusKm === "number" ? signal.radiusKm : 0,
      requirements: signal.requirements || {},
      author_account_id: signal.author_account_id || null,
      author_scout_id: signal.author_scout_id || signal.authorScoutId || "SCOUT-????",
      trustTierLabel: signal.trustTierLabel || "",
      behavioralBadge: signal.behavioralBadge || "",
      behavioralScore: signal.behavioralScore ?? null,
      isAnonymous: Boolean(signal.isAnonymous),
      saved_at: new Date().toISOString(),
    };

    let updated;
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...updated[existingIndex], ...snapshot };
    } else {
      updated = [snapshot, ...list];
    }

    localStorage.setItem(SAVED_SIGNALS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("scoutit:signal-saved-changed", {
        detail: { signalId: signal.id, isSaved: true, signal: snapshot, offline: true },
      })
    );
    return updated;
  } catch (err) {
    console.warn("[savedSignalsClient] Error saving signal locally:", err);
    return getLocalSavedSignals();
  }
}

/**
 * Remove a signal bookmark locally on this browser / device.
 * Emits 'scoutit:signal-saved-changed' so all active views update reactively.
 * @param {string} signalId
 * @returns {Array<object>} updated list
 */
export function removeSignalLocally(signalId) {
  if (typeof window === "undefined" || !signalId) return [];
  try {
    const list = getLocalSavedSignals();
    const updated = list.filter((s) => s.id !== signalId);
    localStorage.setItem(SAVED_SIGNALS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("scoutit:signal-saved-changed", {
        detail: { signalId, isSaved: false, offline: true },
      })
    );
    return updated;
  } catch (err) {
    console.warn("[savedSignalsClient] Error removing local saved signal:", err);
    return getLocalSavedSignals();
  }
}

/**
 * Synchronize all locally saved signals to the server account once signed in.
 * Clears or keeps synchronized with server state.
 * @param {string} [accessToken]
 * @returns {Promise<{ syncedCount: number, error: string | null }>}
 */
export async function syncOfflineSignalsToAccount(accessToken) {
  const localList = getLocalSavedSignals();
  if (localList.length === 0) {
    return { syncedCount: 0, error: null };
  }

  let count = 0;
  const errors = [];

  for (const sig of localList) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`/api/community/signals/${encodeURIComponent(sig.id)}/save`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        count++;
      } else if (res.status !== 401) {
        const json = await res.json().catch(() => ({}));
        errors.push(json.error || `Signal ${sig.id} sync failed`);
      }
    } catch (err) {
      errors.push(err.message || `Signal ${sig.id} network error`);
    }
  }

  return {
    syncedCount: count,
    error: errors.length > 0 ? errors[0] : null,
  };
}
