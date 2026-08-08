"use client";

// ═══════════════════════════════════════════════════════════════
// PROPERTY SECTION EDITOR — one editor, two homes
//
// Mounted by BOTH Mission Control (staff, any property) and Owner Mode (owner,
// own property). Shared on purpose: two separate editors would drift, and the
// field list is long enough that drift means one side quietly loses fields.
//
// It renders from src/lib/propertyFieldRegistry.js, so:
//   • labels are DERIVED — a new Airtable field shows up automatically with a
//     readable name instead of silently missing from the UI
//   • the ~71 category fields that don't apply to this property are HIDDEN
//     (a restaurant never shows Commercial rent rows)
//   • internal staff fields are separated from public ones, and are only
//     rendered at all when the caller is staff
//   • gated fields are labelled so staff can see what a free visitor cannot
//
// SAVES ARE PER SECTION. Each section posts only its own fields and the server
// merges, so saving "Commercial" cannot wipe "Location". That also keeps each
// request small enough to stay well inside Vercel's function ceiling.
//
// MOBILE FIRST (project standing directive): single column by default, with one
// `min-width: 700px` enhancement to two columns. Inputs are 16px minimum so
// iOS does not zoom on focus.
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import { groupFields, VISIBILITY } from "@/lib/propertyFieldRegistry";

const GOLD = "#E8AE3C";
const GOLD_DIM = "#6E531A";
const EMPTY_DETAILS = {};

/** Long-form keys that deserve a textarea rather than a single-line input. */
const LONG_TEXT = /notes|story|summary|description|rules|terms|config|policy|accessibility|equipment|breakdown/i;

export default function PropertySectionEditor({
  property,
  category,
  isStaff = false,
  onSaved,
  endpoint = "/api/admin/property",
  authToken,
}) {
  const details = useMemo(() => property?.details ?? EMPTY_DETAILS, [property?.details]);
  const [draft, setDraft] = useState({});
  const [savingSection, setSavingSection] = useState(null);
  const [status, setStatus] = useState({});

  // Group the keys this property actually has. Category filtering happens in
  // the registry so this component holds no field knowledge of its own.
  const sections = useMemo(() => {
    const grouped = groupFields(Object.keys(details), { category });
    if (!isStaff) delete grouped.internal;
    // Stable order: real sections alphabetically, staff-only last.
    return Object.entries(grouped).sort(([a], [b]) => {
      if (a === "internal") return 1;
      if (b === "internal") return -1;
      return a.localeCompare(b);
    });
  }, [details, category, isStaff]);

  // IMPORTANT: read and write by `field.key` (the ORIGINAL details key), not
  // `field.name` (the canonical Airtable name). A record storing `ac_charges`
  // must be saved back to `ac_charges` — writing to `CM_AC_Charges` instead
  // would create a second key and leave the stale original still published.
  const valueFor = useCallback(
    (key) => (key in draft ? draft[key] : (details[key] ?? "")),
    [draft, details],
  );

  const isDirty = useCallback(
    (fields) => fields.some((f) => f.key in draft && draft[f.key] !== (details[f.key] ?? "")),
    [draft, details],
  );

  async function saveSection(sectionName, fields) {
    // Send ONLY this section's changed fields. The server merges into the rest.
    const payload = {};
    for (const field of fields) {
      if (field.key in draft) payload[field.key] = draft[field.key];
    }
    if (!Object.keys(payload).length) return;

    setSavingSection(sectionName);
    setStatus((s) => ({ ...s, [sectionName]: null }));
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ id: property.id, details: payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      setStatus((s) => ({
        ...s,
        // A warning is not a failure — the data saved, the public mirror lagged.
        [sectionName]: { ok: true, message: json.warning || "Saved" },
      }));
      // Clear only this section from the draft so other unsaved edits survive.
      setDraft((d) => {
        const next = { ...d };
        for (const field of fields) delete next[field.key];
        return next;
      });
      onSaved?.(json.property);
    } catch (err) {
      setStatus((s) => ({ ...s, [sectionName]: { ok: false, message: err.message } }));
    } finally {
      setSavingSection(null);
    }
  }

  if (!property) return null;
  if (!sections.length) {
    return (
      <p className="empty">
        No editable fields recorded for this listing yet.
        <style jsx>{`
          .empty { color: #777; font-size: 0.9rem; padding: 1rem 0; }
        `}</style>
      </p>
    );
  }

  return (
    <div className="editor">
      {sections.map(([sectionName, fields]) => {
        const staffOnly = sectionName === "internal";
        const dirty = isDirty(fields);
        const state = status[sectionName];
        return (
          <section key={sectionName} className={staffOnly ? "sec staff" : "sec"}>
            <header>
              <h3>{staffOnly ? "Staff only — never public" : sectionName}</h3>
              <button
                type="button"
                disabled={!dirty || savingSection === sectionName}
                onClick={() => saveSection(sectionName, fields)}
              >
                {savingSection === sectionName ? "Saving…" : dirty ? "Save section" : "Saved"}
              </button>
            </header>

            {state && (
              <p className={state.ok ? "msg ok" : "msg err"} role="status">
                {state.message}
              </p>
            )}

            <div className="grid">
              {fields.map((field) => (
                <label key={field.key} className="field">
                  <span className="lbl">
                    {field.label}
                    {field.visibility === VISIBILITY.DEEP_INTEL && (
                      <em title="Only visible to Solar tier and above">· paid</em>
                    )}
                    {field.visibility === VISIBILITY.VAULT && (
                      <em title="Only visible to Cluster tier and above">· vault</em>
                    )}
                  </span>
                  {field.isMachine ? (
                    <textarea
                      rows={4}
                      className="mono"
                      value={
                        typeof valueFor(field.key) === "string"
                          ? valueFor(field.key)
                          : JSON.stringify(valueFor(field.key), null, 2)
                      }
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                      }
                    />
                  ) : LONG_TEXT.test(field.name) ? (
                    <textarea
                      rows={3}
                      value={valueFor(field.key)}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      value={valueFor(field.key)}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        );
      })}

      <style jsx>{`
        /* Mobile first: phone is the base case, one enhancement at 700px. */
        .editor { display: flex; flex-direction: column; gap: 1.25rem; }
        .sec {
          border: 1px solid #222;
          border-radius: 10px;
          padding: 1rem;
          background: #101010;
        }
        .sec.staff { border-color: ${GOLD_DIM}; background: #14110a; }
        header {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        h3 {
          margin: 0;
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: ui-monospace, monospace;
          color: ${GOLD};
        }
        button {
          background: transparent;
          border: 1px solid ${GOLD_DIM};
          color: ${GOLD};
          font-family: ui-monospace, monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.55rem 0.9rem;
          border-radius: 6px;
          /* 44px min touch target on phones. */
          min-height: 44px;
          cursor: pointer;
        }
        button:disabled { opacity: 0.4; cursor: default; }
        .msg { font-size: 0.78rem; margin: 0 0 0.75rem; }
        .msg.ok { color: #7cc47c; }
        .msg.err { color: #d98080; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 0.85rem; }
        .field { display: flex; flex-direction: column; gap: 0.3rem; }
        .lbl {
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-family: ui-monospace, monospace;
          color: var(--text-secondary);
        }
        .lbl em { color: ${GOLD_DIM}; font-style: normal; margin-left: 0.3rem; }
        input, textarea {
          background: var(--bg);
          border: 1px solid var(--border-solid);
          color: #ededed;
          border-radius: 6px;
          padding: 0.7rem;
          /* 16px prevents iOS Safari zooming in on focus. */
          font-size: 16px;
          width: 100%;
          box-sizing: border-box;
        }
        input:focus, textarea:focus { outline: none; border-color: ${GOLD}; }
        textarea { resize: vertical; }
        .mono { font-family: ui-monospace, monospace; font-size: 13px; }

        @media (min-width: 700px) {
          .grid { grid-template-columns: 1fr 1fr; }
          .field:has(textarea) { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  );
}
