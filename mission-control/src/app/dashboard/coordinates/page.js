import { redirect } from "next/navigation";
import { MapPin, MapPinOff, Crosshair } from "lucide-react";

import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { loadFlaggedCoordinates, setVerifiedCoordinates } from "./actions";

// POSITION QUEUE
//
// Owners never enter coordinates. Every pin on the public site is geocoded from
// a line of location text, and that inference is frequently only good to the
// level of a district — "BGC, Taguig" resolves to the centre of an area, not to
// a building. Accepted silently, that produces a map that looks precise and is
// not.
//
// Anything the geocoder could not place at building level lands here, worst
// first, for a human to put the pin where the building actually is.

export const dynamic = "force-dynamic";

function precisionLabel(row) {
  if (!row.hasPosition) return { text: "No position", tone: "bad" };
  const p = row.geo?.precision;
  if (p === "coarse") return { text: "Area centre", tone: "bad" };
  if (p === "approximate") return { text: "Approximate", tone: "warn" };
  return { text: "Unverified", tone: "warn" };
}

export default async function CoordinatesPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/auth");
  if (staff.tier < TIERS.AGENT) redirect("/dashboard");

  const { rows, error } = await loadFlaggedCoordinates();

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <Crosshair className="w-4 h-4" />
          <h1 className="font-mono text-xs tracking-[0.12em] uppercase">Position Queue</h1>
        </div>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Owners never type coordinates — every pin is geocoded from the listing&apos;s location
          text. Anything the geocoder could not place at building level is held here rather than
          published as if it were precise. Put the pin on the building and it stops being a guess.
        </p>
      </header>

      {error && (
        <div className="rounded border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
          Could not read listings: {error}
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-8 text-center">
          <MapPin className="w-5 h-5 mx-auto text-emerald-400 mb-3" />
          <p className="text-sm text-neutral-300">Every listing is placed to building level.</p>
          <p className="text-xs text-neutral-500 mt-1">Nothing needs a human here.</p>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row) => {
          const label = precisionLabel(row);
          return (
            <div key={row.id} className="rounded border border-neutral-800 bg-neutral-950 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {row.hasPosition ? (
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <MapPinOff className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-sm text-neutral-100 truncate">{row.title || row.slug || row.id}</span>
                    <span
                      className={`font-mono text-[12px] tracking-widest uppercase px-2 py-0.5 rounded border ${
                        label.tone === "bad"
                          ? "border-red-900 text-red-300 bg-red-950/40"
                          : "border-amber-900 text-amber-300 bg-amber-950/40"
                      }`}
                    >
                      {label.text}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mt-1">
                    Location text: <span className="text-neutral-300">{row.location || "— none —"}</span>
                  </p>

                  {row.geo?.reason && (
                    <p className="text-xs text-neutral-500 mt-1">{row.geo.reason}</p>
                  )}
                  {row.geo?.placeName && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Geocoder matched: {row.geo.placeName}
                    </p>
                  )}
                  {row.point && (
                    <p className="font-mono text-[12px] text-neutral-500 mt-1">
                      Current: {row.point.lat.toFixed(6)}, {row.point.lng.toFixed(6)}
                    </p>
                  )}
                </div>

                {/* Deliberately a plain form: the value being corrected is the
                    one thing on the page that must be exact, so it is typed and
                    submitted rather than dragged. */}
                <form action={setVerifiedCoordinates} className="flex flex-wrap items-center gap-2 shrink-0">
                  <input type="hidden" name="id" value={row.id} />
                  <input
                    name="lat"
                    inputMode="decimal"
                    placeholder="latitude"
                    defaultValue={row.point?.lat ?? ""}
                    aria-label={`Latitude for ${row.title || row.slug}`}
                    className="w-32 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 font-mono text-xs text-neutral-100 placeholder:text-neutral-400"
                  />
                  <input
                    name="lng"
                    inputMode="decimal"
                    placeholder="longitude"
                    defaultValue={row.point?.lng ?? ""}
                    aria-label={`Longitude for ${row.title || row.slug}`}
                    className="w-32 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 font-mono text-xs text-neutral-100 placeholder:text-neutral-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-[12px] tracking-widest uppercase"
                  >
                    Verify
                  </button>
                  {row.slug && (
                    <a
                      href={`https://www.scoutit.space/property/${row.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded border border-neutral-700 text-neutral-300 font-mono text-[12px] tracking-widest uppercase hover:border-amber-700"
                    >
                      View
                    </a>
                  )}
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
