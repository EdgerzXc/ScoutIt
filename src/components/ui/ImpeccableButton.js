import { forwardRef } from "react";

export const ImpeccableButton = forwardRef(({ children, className = "", variant = "primary", isLoading, ...props }, ref) => {
  const baseClasses = "flex justify-center items-center rounded px-5 py-3.5 font-sans text-[13px] font-semibold tracking-[0.1em] uppercase transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-gold-accent text-[var(--bg,#0e0e0e)] hover:bg-[var(--accent-bright,#e6a600)] shadow-[var(--shadow-glow-soft)]",
    secondary: "bg-[var(--surface2)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent-border)]",
    danger: "bg-error/10 text-error border border-error/20 hover:bg-error/20"
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        children
      )}
    </button>
  );
});
ImpeccableButton.displayName = "ImpeccableButton";
