"use client";

import { useState } from "react";
import { Search, AlertTriangle, Calendar, ShieldCheck } from "lucide-react";
import { PIPELINE_COLUMNS as COLUMNS, columnIdForDeal } from "@/lib/deals/dealStages";

export { columnIdForDeal, COLUMNS };

export default function KanbanBoard({ deals = [], viewingAs = "owner", onStatusChange, onDealClick, appointments = [] }) {
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState(null);

  const viewingDealIds = new Set(
    appointments
      .filter((a) => a.deal_id && (a.status === "pending" || a.status === "confirmed"))
      .map((a) => a.deal_id)
  );

  const enhancedDeals = deals.map((d) => ({
    ...d,
    hasViewingScheduled: Boolean(d.hasViewingScheduled || viewingDealIds.has(d.id)),
  }));

  const filteredDeals = enhancedDeals.filter((deal) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (deal.propertyTitle && deal.propertyTitle.toLowerCase().includes(q)) ||
      (deal.otherParty && deal.otherParty.toLowerCase().includes(q)) ||
      (deal.otherPartyEmail && deal.otherPartyEmail.toLowerCase().includes(q))
    );
  });

  // Super-User Depth (A-200 §3.2): Unit Collision Detection
  // Counts active inquiries referencing the same unitId to prevent double-leasing.
  const activeDealsWithUnit = filteredDeals.filter(
    (d) => d.unitId && !["declined", "withdrawn", "expired", "reported"].includes(d.status)
  );
  const unitInquiryCounts = activeDealsWithUnit.reduce((acc, d) => {
    acc[d.unitId] = (acc[d.unitId] || 0) + 1;
    return acc;
  }, {});

  const getStatusColor = (status, hasViewingScheduled) => {
    if (hasViewingScheduled && !["accepted", "active", "closed", "declined", "withdrawn"].includes(status)) {
      return "bg-gold-accent/10 border-gold-accent/40";
    }
    if (status === "accepted" || status === "active" || status === "closed") return "bg-success/5 border-success/20";
    if (status === "declined" || status === "withdrawn" || status === "expired" || status === "reported") return "bg-error/5 border-error/20";
    if (status === "connected" || status === "pending" || status === "pitching" || status === "invited" || status === "inbound") return "bg-gold-accent/5 border-gold-accent/20";
    return "bg-surface-alt border-surface-variant";
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    if (dealId && onStatusChange) {
      onStatusChange(dealId, columnId);
    }
  };

  return (
    <div className="flex h-full flex-col font-body">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="search"
            aria-label="Search deals"
            placeholder="Search deals..."
            className="min-h-11 w-full !rounded-full border border-surface-variant !bg-surface-alt !py-2 !pl-11 !pr-4 font-body text-base text-on-surface transition-colors duration-200 ease-out placeholder:text-text-muted focus:border-gold-accent focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map((col) => {
          const colDeals = filteredDeals.filter((d) => columnIdForDeal(d) === col.id);

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-80 max-w-[85vw] bg-surface/50 border border-surface-variant rounded-lg p-3 flex flex-col snap-start"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-label-caps text-label-caps uppercase text-text-secondary">
                  {viewingAs === "owner" ? col.ownerLabel : col.brokerLabel}
                </h3>
                <span className="rounded-full bg-surface-alt px-2 py-0.5 font-body text-sm font-medium text-text-muted tabular-nums">
                  {colDeals.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {colDeals.map((deal) => {
                  const collisionCount = deal.unitId ? unitInquiryCounts[deal.unitId] : 0;
                  // A-234: an imported lead is a contact record, not a
                  // platform conversation. It has no deal to open, no stage
                  // to drag and no messages — so it is not draggable and not
                  // clickable. Its details are on the card instead of hidden
                  // behind a panel that has nothing to show.
                  const isImported = Boolean(deal.isImportedContact);

                  return (
                    <div
                      key={deal.id}
                      draggable={!isImported}
                      onDragStart={(e) => !isImported && handleDragStart(e, deal.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={() => !isImported && onDealClick(deal)}
                      title={isImported ? "Imported lead: stored as a contact record" : undefined}
                      className={`p-4 rounded-lg border transition duration-200 ease-out
                        ${isImported ? "cursor-default" : "cursor-grab active:cursor-grabbing"}
                        ${getStatusColor(deal.status, deal.hasViewingScheduled)}
                        ${draggingId === deal.id
                          ? "opacity-40 scale-[0.98] border-gold-accent shadow-none"
                          : isImported
                            ? "border-surface-variant"
                            : "hover:-translate-y-[2px] active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(var(--bg-rgb),0.5),0_0_15px_rgba(var(--accent-rgb),0.12)] hover:border-gold-accent/40"}
                        bg-surface/80 backdrop-blur-sm
                      `}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="font-body text-base font-semibold text-on-surface break-words truncate">
                          {deal.propertyTitle}
                        </div>
                        {isImported ? (
                          <span className="shrink-0 px-2 py-0.5 rounded border border-surface-variant bg-surface-alt text-text-secondary text-xs font-mono font-bold uppercase tracking-wider">
                            Imported
                          </span>
                        ) : deal.open_gate_inbound && (
                          <span className="shrink-0 px-2 py-0.5 rounded border border-gold-accent/40 bg-gold-accent/10 text-gold-accent text-xs font-mono font-bold uppercase tracking-wider">
                            GATE
                          </span>
                        )}
                      </div>

                      <div className="mb-2 flex items-center justify-between gap-3 font-body text-sm text-text-secondary">
                        <span className="min-w-0 truncate">{deal.otherParty}</span>
                        <span className="shrink-0 whitespace-nowrap font-label-caps text-label-caps uppercase text-gold-accent/80">
                          {deal.myRole}
                        </span>
                      </div>

                      {/* An imported lead's contact details live on the card:
                          there is no conversation panel to open them from. */}
                      {isImported && (deal.otherPartyEmail || deal.otherPartyPhone) && (
                        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-text-muted">
                          {deal.otherPartyEmail && (
                            <span className="min-w-0 truncate">{deal.otherPartyEmail}</span>
                          )}
                          {deal.otherPartyPhone && <span>{deal.otherPartyPhone}</span>}
                        </div>
                      )}

                      {/* Viewing Scheduled Indicator */}
                      {deal.hasViewingScheduled && (
                        <div className="mb-2 flex items-center gap-1.5 px-2 py-1 rounded bg-gold-accent/10 border border-gold-accent/30 text-xs font-mono text-gold-accent">
                          <Calendar size={12} className="shrink-0 text-gold-accent" />
                          <span>Viewing Appointment Confirmed</span>
                        </div>
                      )}

                      {/* Super-User Depth: Unit Collision Alert */}
                      {collisionCount > 1 && (
                        <div className="mb-2 flex items-center gap-1.5 px-2 py-1 rounded bg-amber-950/40 border border-amber-600/40 text-xs font-mono text-amber-300">
                          <AlertTriangle size={12} className="shrink-0 text-amber-400" />
                          <span>{collisionCount} active inquiries on this unit</span>
                        </div>
                      )}

                      {deal.lastMessage && (
                        <div className="mt-2 truncate border-t border-surface-variant/40 pt-2 font-body text-sm italic text-text-muted">
                          &quot;{deal.lastMessage}&quot;
                        </div>
                      )}
                    </div>
                  );
                })}

                {colDeals.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-surface-variant/60 bg-surface/20 font-label-caps text-label-caps uppercase text-text-muted transition-colors duration-200 ease-out hover:border-gold-accent/40">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
