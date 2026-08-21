import { forwardRef } from "react";

export const ImpeccableInput = forwardRef(({ label, className = "", ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      {label && (
        <label className="font-label-caps text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`bg-[var(--surface2)] border border-[var(--border)] rounded px-3.5 py-3 text-[var(--text-primary)] font-sans text-sm transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.25)] placeholder-[var(--text-muted)] ${className}`}
        {...props}
      />
    </div>
  );
});
ImpeccableInput.displayName = "ImpeccableInput";

export const ImpeccableTextArea = forwardRef(({ label, className = "", ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      {label && (
        <label className="font-label-caps text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`bg-[var(--surface2)] border border-[var(--border)] rounded px-3.5 py-3 text-[var(--text-primary)] font-sans text-sm transition-all duration-200 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.25)] placeholder-[var(--text-muted)] resize-y min-h-[100px] ${className}`}
        {...props}
      />
    </div>
  );
});
ImpeccableTextArea.displayName = "ImpeccableTextArea";
