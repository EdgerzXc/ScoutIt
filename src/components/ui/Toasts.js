"use client";

import { useDashboard } from "../../context/DashboardContext";

// Stacked confirmation toasts. Sits above the mobile tab bar.
export default function Toasts() {
  const { toasts } = useDashboard();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-md">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-surface border border-gold-accent/50 text-on-surface rounded-full px-5 py-3 shadow-2xl flex items-center gap-3 text-sm font-working-title animate-[slideUp_0.3s_ease-out] w-auto max-w-full"
        >
          <span className="shrink-0">{t.icon}</span>
          <span className="truncate">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
