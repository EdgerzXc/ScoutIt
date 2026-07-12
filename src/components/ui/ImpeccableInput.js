import { forwardRef } from "react";

export const ImpeccableInput = forwardRef(({ label, className = "", ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      {label && (
        <label className="font-label-caps text-[11px] font-semibold text-[#f0ede8]/80 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`bg-[#0e0e0e] border border-white/10 rounded px-3.5 py-3 text-white font-sans text-sm transition-all duration-200 outline-none focus:border-gold-accent focus:shadow-[0_0_0_1px_rgba(232,174,60,0.2)] placeholder-white/30 ${className}`}
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
        <label className="font-label-caps text-[11px] font-semibold text-[#f0ede8]/80 uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`bg-[#0e0e0e] border border-white/10 rounded px-3.5 py-3 text-white font-sans text-sm transition-all duration-200 outline-none focus:border-gold-accent focus:shadow-[0_0_0_1px_rgba(232,174,60,0.2)] placeholder-white/30 resize-y min-h-[100px] ${className}`}
        {...props}
      />
    </div>
  );
});
ImpeccableTextArea.displayName = "ImpeccableTextArea";
