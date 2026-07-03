/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import InventoryGridManager from "./InventoryGridManager";
import { getSession } from "../../lib/authClient";
import { useDashboard } from "../../context/DashboardContext";

// Operator's "Operated Spaces" dashboard (SCOUTIT_MASTER_BUILD_SPEC.md §9.2/§9.6):
// a filtered view showing only units delegated to this user, grouped by
// building, never the rest of any building they don't own. Reuses
// InventoryGridManager in its restricted "operator" mode rather than forking
// a second grid component.
export default function OperatorMode() {
  const { addToast } = useDashboard();
  const [buildings, setBuildings] = useState(null); // null = loading
  const buildingsRef = useRef(buildings);
  useEffect(() => { buildingsRef.current = buildings; }, [buildings]);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const res = await fetch("/api/dashboard/operator/units", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (res.ok) {
        setBuildings(data.buildings || []);
      } else {
        console.error("Failed to load operated spaces", data.error);
        setBuildings([]);
      }
    } catch (e) {
      console.error("Failed to load operated spaces", e);
      setBuildings([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveBuildingUnits = async (propertyId, units) => {
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const res = await fetch("/api/dashboard/operator/units", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ propertyId, units }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("Couldn't save your changes — check your connection.", "❌");
        return;
      }
      if (data.warning) addToast(data.warning, "⚠️");
      // Reconcile this one building's slice with the server's authoritative state.
      setBuildings((prev) =>
        (prev || []).map((b) => (b.propertyId === propertyId ? { ...b, units: data.units } : b))
      );
    } catch (e) {
      console.error("Failed to save operated unit changes", e);
      addToast("Couldn't save your changes — check your connection.", "❌");
    }
  };

  const updateBuildingLocal = (propertyId, newUnits) => {
    setBuildings((prev) =>
      (prev || []).map((b) => (b.propertyId === propertyId ? { ...b, units: newUnits } : b))
    );
  };

  if (buildings === null) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <span className="text-text-muted font-working-title animate-pulse">Loading operated spaces…</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">
          Operator Dashboard
        </span>
        <h1 className="font-display-md text-3xl md:text-4xl text-on-surface">Operated Spaces</h1>
        <p className="text-sm text-text-secondary mt-2 max-w-2xl">
          Units delegated to you across every building you operate. You can rename units, manage their
          photos, and set availability here — everything else about the building stays with its owner.
        </p>
      </div>

      {buildings.length === 0 ? (
        <div className="bg-[#121110] border border-dashed border-surface-variant rounded-lg p-16 flex flex-col items-center text-center gap-2">
          <p className="text-text-secondary text-sm">
            No units have been delegated to you yet.
          </p>
          <p className="text-xs text-text-muted max-w-md">
            Find a building you would like to operate, open its property page, and use{" "}
            <span className="text-gold-accent">Request to Operate This Building</span> to reach out to
            the owner.
          </p>
        </div>
      ) : (
        buildings.map((b) => (
          <div key={b.propertyId} className="bg-[#121110] border border-surface-variant rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-working-title text-lg text-on-surface">{b.propertyTitle || "Untitled Building"}</h2>
              {b.propertySlug && (
                <Link
                  href={`/property/${b.propertySlug}`}
                  className="text-xs text-text-secondary hover:text-gold-accent transition-colors"
                >
                  View property page →
                </Link>
              )}
            </div>
            <InventoryGridManager
              mode="operator"
              isPro={true}
              units={b.units}
              onChange={(newUnits) => updateBuildingLocal(b.propertyId, newUnits)}
              onAutoSave={(newUnits) => saveBuildingUnits(b.propertyId, newUnits)}
            />
          </div>
        ))
      )}
    </div>
  );
}
