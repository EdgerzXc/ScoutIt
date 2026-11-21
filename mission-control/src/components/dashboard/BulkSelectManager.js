"use client";

import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { CheckSquare } from "lucide-react";

export const QueueFeedbackContext = createContext(null);

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
  const [feedback, setFeedback] = useState("");
  const [completedIds, setCompletedIds] = useState(new Set());
  const feedbackRegion = useRef(null);
  const visibleItems = items.filter(({ key }) => !completedIds.has(key));

  useEffect(() => {
    if (feedback) feedbackRegion.current?.scrollIntoView({ block: "nearest" });
  }, [feedback]);

  useEffect(() => {
    const currentIds = new Set(items.map(({ key }) => key));
    setCompletedIds((previous) => {
      const remaining = [...previous].filter((id) => currentIds.has(id));
      return remaining.length === previous.size ? previous : new Set(remaining);
    });
  }, [items]);

  const showResult = useCallback((message, savedIds = []) => {
    setFeedback(message);
    if (savedIds.length) {
      setCompletedIds((previous) => new Set([...previous, ...savedIds]));
      const saved = new Set(savedIds);
      setSelectedIds((previous) => new Set([...previous].filter((id) => !saved.has(id))));
    }
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleItems.length && visibleItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((item) => item.key)));
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

  const handleBulkAction = async (actionFn, requiresReason = false) => {
    if (selectedIds.size === 0) return;

    let reason = null;
    if (requiresReason) {
      reason = window.prompt(`Enter a reason for this bulk action on ${selectedIds.size} ${itemName}:`);
      if (!reason) return; // cancelled
    }

    setIsProcessing(true);
    setFeedback("");
    try {
      const result = await actionFn(Array.from(selectedIds), reason);
      if (result?.message) showResult(result.message, result.savedIds);
      if (Array.isArray(result?.retryIds)) setSelectedIds(new Set(result.retryIds));
      else if (!result?.message) setSelectedIds(new Set());
    } catch {
      setFeedback("The bulk action could not be completed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasBulk = bulkActions.length > 0;

  return (
    <QueueFeedbackContext value={showResult}>
    <div className="relative pb-20">
      {/* List */}
      <div className="space-y-3">
        <div ref={feedbackRegion} role="status" aria-atomic="true" className={feedback ? "rounded-lg border border-white/10 px-4 py-3 text-sm text-white/90" : "sr-only"}>
          {feedback}
        </div>
        {visibleItems.length > 0 && hasBulk && (
          <div className="flex items-center px-2 py-1 text-sm text-white/70">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              {selectedIds.size === visibleItems.length ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}

        {visibleItems.map((item) => {
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

        {visibleItems.length === 0 && (
          <div className="text-sm text-white/70 bg-[#121212] border border-white/5 rounded-xl p-8 text-center">
            No {itemName} found.
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      {hasBulk && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] border border-white/10 shadow-2xl rounded-2xl p-2 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10">
          <div className="px-4 py-2 text-sm font-medium text-[#E8AE3C] bg-[#E8AE3C]/10 rounded-xl">
            {selectedIds.size} selected
          </div>
          <div className="flex items-center gap-2 pr-2">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleBulkAction(action.fn, action.requiresReason)}
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
    </QueueFeedbackContext>
  );
}
