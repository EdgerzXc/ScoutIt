"use client";

import { useState } from "react";
import { CheckSquare } from "lucide-react";

// Client-side bulk-select wrapper.
//
// `items` is an array of { key, content } where `content` is a PRE-RENDERED
// node (e.g. a <UserRow /> or <PropertyCard /> built on the server). We take
// rendered nodes rather than a `renderItem` function because this is a Client
// Component and a Server Component cannot pass a plain function across the
// RSC boundary ("Functions cannot be passed directly to Client Components").
// The per-item "selected" highlight lives on the wrapper here (a ring), since
// the pre-rendered content can't receive the client-only `isSelected` state.
//
// `bulkActions` is [{ label, icon, className, requiresReason, fn }] where `fn`
// is a Server Action (those ARE allowed to cross the boundary).
export function BulkSelectManager({ items, bulkActions = [], itemName = "items" }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [bulkError, setBulkError] = useState(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.key)));
    }
  };

  const toggleItem = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const executeBulkAction = async (actionFn, reason = null) => {
    if (selectedIds.size === 0) return;

    setBulkError(null);
    setIsProcessing(true);
    try {
      await actionFn(Array.from(selectedIds), reason);
      setSelectedIds(new Set());
      setPendingAction(null);
      setRejectReason("");
    } catch {
      setBulkError("Failed to perform bulk action. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;

    if (action.requiresReason) {
      setBulkError(null);
      setPendingAction(action);
      setRejectReason("");
      return;
    }

    await executeBulkAction(action.fn, null);
  };

  const hasBulk = bulkActions.length > 0;

  return (
    <div className="relative pb-20">
      {/* List */}
      <div className="space-y-3">
        {items.length > 0 && hasBulk && (
          <div className="flex items-center px-2 py-1 text-sm text-white/70">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              {selectedIds.size === items.length ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}

        {items.map((item) => {
          const isSelected = selectedIds.has(item.key);
          return (
            <div key={item.key} className="flex gap-3">
              {hasBulk && (
                <div className="pt-5 pl-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(item.key)}
                    className="w-4 h-4 rounded border-white/20 bg-black/50 accent-[#E8AE3C]"
                  />
                </div>
              )}
              <div
                className={`flex-1 min-w-0 rounded-xl ${
                  isSelected ? "ring-1 ring-[#E8AE3C]/60" : ""
                }`}
              >
                {item.content}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-sm text-white/70 bg-[#121212] border border-white/5 rounded-xl p-8 text-center">
            No {itemName} found.
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      {hasBulk && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] border border-white/10 shadow-2xl rounded-2xl p-2 flex flex-col gap-2 z-50 animate-in slide-in-from-bottom-10 max-w-[95vw]">
          {bulkError && (
            <div role="alert" className="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {bulkError}
            </div>
          )}
          {pendingAction ? (
            <div className="flex flex-wrap items-center gap-2 px-2 py-1">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={`Reason for ${selectedIds.size} ${itemName}...`}
                aria-label="Bulk action reason"
                className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[#E8AE3C] min-w-[200px]"
              />
              <button
                type="button"
                onClick={() => executeBulkAction(pendingAction.fn, rejectReason.trim() || null)}
                disabled={isProcessing || !rejectReason.trim()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors disabled:opacity-50"
              >
                Confirm {pendingAction.label || "Action"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAction(null);
                  setRejectReason("");
                }}
                disabled={isProcessing}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 text-sm font-medium text-[#E8AE3C] bg-[#E8AE3C]/10 rounded-xl">
                {selectedIds.size} selected
              </div>
              <div className="flex items-center gap-2 pr-2">
                {bulkActions.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleBulkAction(action)}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${action.className || "bg-white/5 hover:bg-white/10 text-white"}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
