"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

const COLUMNS = [
  { id: "connected", ownerLabel: "New Inquiry", brokerLabel: "Connected" },
  { id: "pending", ownerLabel: "Reviewing", brokerLabel: "Pitched" },
  { id: "accepted", ownerLabel: "Accepted", brokerLabel: "Accepted" },
  { id: "closed", ownerLabel: "Closed Won", brokerLabel: "Closed Won" },
  { id: "declined", ownerLabel: "Passed", brokerLabel: "Declined" }
];

export default function KanbanBoard({ deals, viewingAs, onStatusChange, onDealClick }) {
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState(null);

  // ⚡ Bolt Optimization: Memoize filtering and bucket deals by status in a single pass 
  // to avoid O(N) filter and O(5*N) column filters on every render, especially when typing in search.
  const dealsByColumn = useMemo(() => {
    const buckets = COLUMNS.reduce((acc, col) => {
      acc[col.id] = [];
      return acc;
    }, {});
    
    const q = search.toLowerCase();
    
    deals.forEach(deal => {
      // 1. Filter
      if (search) {
        const matches = (deal.propertyTitle && deal.propertyTitle.toLowerCase().includes(q)) ||
                        (deal.otherParty && deal.otherParty.toLowerCase().includes(q));
        if (!matches) return;
      }
      
      // 2. Bucket
      if (buckets[deal.status]) {
        buckets[deal.status].push(deal);
      }
    });
    
    return buckets;
  }, [deals, search]);

  const getStatusColor = (status) => {
    if (status === "accepted" || status === "closed") return "bg-success/5 border-success/20";
    if (status === "declined") return "bg-error/5 border-error/20";
    if (status === "connected" || status === "pending") return "bg-gold-accent/5 border-gold-accent/20";
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
            className="w-full bg-surface-alt border border-surface-variant rounded-full pl-11 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map(col => {
          const colDeals = dealsByColumn[col.id] || [];
          
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
                    className={`p-4 rounded-lg cursor-grab active:cursor-grabbing transition-all border
                      ${getStatusColor(deal.status)}
                      ${draggingId === deal.id ? "opacity-50" : "hover:-translate-y-[3px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.4),0_0_15px_rgba(247,198,78,0.1)] hover:border-gold-accent/50"}
                      bg-gradient-to-br from-[#1a1917] to-[#111110]
                    `}
                  >
                    <div className="font-working-title text-sm text-on-surface mb-1 truncate">{deal.propertyTitle}</div>
                    <div className="text-xs text-text-secondary mb-3 flex items-center justify-between">
                      <span>{deal.otherParty}</span>
                      <span className="capitalize">{deal.myRole}</span>
                    </div>
                    {deal.lastMessage && (
                      <div className="text-xs text-text-muted truncate italic border-t border-surface-variant pt-2 mt-2">
                        &quot;{deal.lastMessage}&quot;
                      </div>
                    )}
                  </div>
                ))}
                
                {colDeals.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-surface-variant/50 rounded-lg flex items-center justify-center text-text-muted text-xs font-working-title">
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
