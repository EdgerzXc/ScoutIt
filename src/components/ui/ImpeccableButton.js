import { forwardRef } from "react";

export const ImpeccableButton = forwardRef(({ children, className = "", variant = "primary", isLoading, ...props }, ref) => {
  const baseClasses = "flex justify-center items-center rounded px-5 py-3.5 font-sans text-[13px] font-semibold tracking-[0.1em] uppercase transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-gold-accent text-[#0e0e0e] hover:bg-[#e6a600] shadow-[0_0_15px_rgba(232,174,60,0.15)]",
    secondary: "bg-[#1a1a1a] text-white border border-white/10 hover:bg-[#262626] hover:border-white/20",
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
