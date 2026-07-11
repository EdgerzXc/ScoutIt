"use client";

import { useEffect, useState, useCallback } from "react";
import { getSession } from "../../lib/authClient";

// Owner-side review surface for operator-initiated delegation handshakes
// (SCOUTIT_MASTER_BUILD_SPEC.md §9.2). Mirrors BrokerMode's incoming-handshake
// accept/decline visual language and OwnerMode's "Invite an advisor" card
// styling — deliberately kept separate from InventoryGridManager.js rather
// than growing that component further.
export default function DelegationRequests({ propertyId, units, onDelegated }) {
  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeDealId, setActiveDealId] = useState(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const params = new URLSearchParams({ propertyId });
      const res = await fetch(`/api/dashboard/units/delegate?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch (e) {
      console.error("Failed to load delegation requests", e);
    } finally {
      setLoaded(true);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const availableUnits = (units || []).filter((u) => !u.operatorId);

  const toggleUnit = (id) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const respond = async (dealId, action, unitIds = []) => {
    setBusy(true);
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const res = await fetch("/api/dashboard/units/delegate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ dealId, unitIds, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Delegation action failed", data.error);
        return;
      }
      setActiveDealId(null);
      setSelectedUnitIds(new Set());
      await load();
      if (onDelegated) onDelegated();
    } finally {
      setBusy(false);
    }
  };

  if (!loaded || requests.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3 mb-2">
      <div className="flex items-center justify-between">
        <h3 className="font-working-title text-base text-on-surface">Operator Requests</h3>
        <span className="bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] px-2 py-1 rounded-sm tracking-wider">
          {requests.length} PENDING
        </span>
      </div>

      {requests.map((req) => (
        <div key={req.dealId} className="bg-[#121110] border border-surface-variant rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">
              Incoming Handshake
            </span>
            <span className="text-[10px] text-text-muted font-working-title">
              {new Date(req.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-on-surface mb-1">
            <span className="text-gold-accent font-bold">{req.operatorDisplayName}</span> wants to operate units in this building.
          </p>
          {req.message && <p className="text-xs text-text-secondary mb-3">{req.message}</p>}

          {activeDealId !== req.dealId ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                className="bg-gold-accent text-background font-working-title font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                onClick={() => setActiveDealId(req.dealId)}
              >
                Accept &amp; Pick Units
              </button>
              <button
                type="button"
                disabled={busy}
                className="border border-surface-variant text-text-secondary hover:text-error hover:border-error px-5 py-2 rounded transition-colors text-sm font-working-title disabled:opacity-50"
                onClick={() => respond(req.dealId, "decline")}
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="border-t border-surface-variant pt-3 mt-2">
              <p className="text-xs text-text-secondary mb-2">
                Select which units to hand over to {req.operatorDisplayName}. Units already delegated elsewhere are not shown.
              </p>
              {availableUnits.length === 0 ? (
                <p className="text-xs text-text-muted italic">No undelegated units available on this property yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableUnits.map((u) => (
                    <label
                      key={u.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs cursor-pointer transition-colors ${
                        selectedUnitIds.has(u.id)
                          ? "border-gold-accent bg-gold-accent/10 text-gold-accent"
                          : "border-surface-variant text-text-secondary hover:border-gold-accent/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-gold-accent"
                        checked={selectedUnitIds.has(u.id)}
                        onChange={() => toggleUnit(u.id)}
                      />
                      {u.name || "Unnamed unit"}
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || selectedUnitIds.size === 0}
                  className="bg-gold-accent text-background font-working-title font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                  onClick={() => respond(req.dealId, "accept", [...selectedUnitIds])}
                >
                  Confirm Delegation ({selectedUnitIds.size})
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="border border-surface-variant text-text-secondary hover:text-on-surface px-5 py-2 rounded transition-colors text-sm font-working-title disabled:opacity-50"
                  onClick={() => { setActiveDealId(null); setSelectedUnitIds(new Set()); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
