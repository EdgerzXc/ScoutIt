"use client";

import { useState } from "react";
import { Search } from "lucide-react";

// Each column owns a SET of statuses, not one id.
//
// This used to be `filteredDeals.filter(d => d.status === col.id)` — an exact
// match against five hardcoded ids. Any deal whose status wasn't one of those
// five simply did not render, anywhere on the board, with no empty state and
// no error. `invited`, `pitching`, `reported` and `expired` were already
// disappearing that way before `withdrawn` existed.
//
// A board that silently drops rows is worse than one that shows them in an
// imperfect column: the owner counts their pipeline and the number is wrong,
// with nothing on screen to suggest why.
const COLUMNS = [
  { id: "connected", ownerLabel: "New Inquiry", brokerLabel: "Connected", statuses: ["connected", "pitching"] },
  { id: "pending", ownerLabel: "Reviewing", brokerLabel: "Pitched", statuses: ["pending", "invited"] },
  { id: "accepted", ownerLabel: "Accepted", brokerLabel: "Accepted", statuses: ["accepted", "active"] },
  { id: "closed", ownerLabel: "Closed Won", brokerLabel: "Closed Won", statuses: ["closed"] },
  { id: "declined", ownerLabel: "Passed", brokerLabel: "Declined", statuses: ["declined", "withdrawn", "expired", "reported"] },
];

// Anything genuinely unrecognised lands in the last column rather than
// vanishing, so a new status added elsewhere in the app degrades visibly.
const KNOWN_STATUSES = new Set(COLUMNS.flatMap((c) => c.statuses));
const FALLBACK_COLUMN_ID = "declined";

const columnIdFor = (status) => {
  if (!KNOWN_STATUSES.has(status)) return FALLBACK_COLUMN_ID;
  return COLUMNS.find((c) => c.statuses.includes(status)).id;
};

export default function KanbanBoard({ deals, viewingAs, onStatusChange, onDealClick }) {
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState(null);

  const filteredDeals = deals.filter(deal => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (deal.propertyTitle && deal.propertyTitle.toLowerCase().includes(q)) ||
      (deal.otherParty && deal.otherParty.toLowerCase().includes(q))
    );
  });

  const getStatusColor = (status) => {
    if (status === "accepted" || status === "active" || status === "closed") return "bg-success/5 border-success/20";
    if (status === "declined" || status === "withdrawn" || status === "expired" || status === "reported") return "bg-error/5 border-error/20";
    if (status === "connected" || status === "pending" || status === "pitching" || status === "invited") return "bg-gold-accent/5 border-gold-accent/20";
    return "bg-surface-alt border-surface-variant";
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
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
    <div className="flex flex-col h-full">
      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Search deals..." 
            className="w-full bg-surface-alt border border-surface-variant rounded-full pl-11 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map(col => {
          const colDeals = filteredDeals.filter(d => columnIdFor(d.status) === col.id);
          
          return (
            <div 
              key={col.id} 
              className="flex-shrink-0 w-80 bg-surface/50 border border-surface-variant rounded-lg p-3 flex flex-col snap-start"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-label-caps text-xs tracking-widest uppercase text-text-secondary">
                  {viewingAs === "owner" ? col.ownerLabel : col.brokerLabel}
                </h3>
                <span className="text-xs bg-surface-alt text-text-muted px-2 py-0.5 rounded-full">{colDeals.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {colDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => onDealClick(deal)}
                    className={`p-4 rounded-lg cursor-grab active:cursor-grabbing border transition duration-200 ease-out
                      ${getStatusColor(deal.status)}
                      ${draggingId === deal.id 
                        ? "opacity-40 scale-[0.98] border-gold-accent shadow-none" 
                        : "hover:-translate-y-[2px] active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_15px_rgba(232,174,60,0.12)] hover:border-gold-accent/40"}
                      bg-surface/80 backdrop-blur-sm
                    `}
                  >
                    <div className="font-working-title text-sm text-on-surface mb-1 truncate font-medium">{deal.propertyTitle}</div>
                    <div className="text-xs text-text-secondary mb-3 flex items-center justify-between font-mono">
                      <span>{deal.otherParty}</span>
                      <span className="capitalize text-gold-accent/80">{deal.myRole}</span>
                    </div>
                    {deal.lastMessage && (
                      <div className="text-xs text-text-muted truncate italic border-t border-surface-variant/40 pt-2 mt-2">
                        &quot;{deal.lastMessage}&quot;
                      </div>
                    )}
                  </div>
                ))}
                
                {colDeals.length === 0 && (
                  <div className="h-24 border border-dashed border-surface-variant/60 rounded-lg flex items-center justify-center text-text-muted text-xs font-mono tracking-wider uppercase bg-surface/20 hover:border-gold-accent/40 transition">
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
