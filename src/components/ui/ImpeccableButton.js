import { forwardRef } from "react";

// ---------------------------------------------------------------------------
// THE SUBMIT CONTROL FOR PAID ACTIONS — A-016
//
// InquiryModal, UnitInquiryModal and OperatorRequestModal all render this as
// the button that reads "Spend 1 Connect". It is the last thing between a
// double-click and a double charge, so its states are load-bearing rather than
// decorative.
//
// -- WHAT WAS WRONG --------------------------------------------------------
// 1. The spinner REPLACED the children. A ~200px button collapsed to ~16px the
//    instant it was pressed -- a visible jolt on every send -- and the
//    accessible name disappeared along with the text, so a screen-reader user
//    who reached the button mid-submit heard an unnamed button.
// 2. `disabled={...}` was written BEFORE `{...props}`. JSX resolves duplicate
//    props left to right and the last one wins, so any caller passing
//    `disabled` silently overrode the in-flight guard on a paid action. It
//    worked only because no caller happened to pass it.
// 3. `transition-all` animated every animatable property, including colour,
//    shadow and layout-affecting ones.
// 4. `animate-spin` ran regardless of prefers-reduced-motion.
// ---------------------------------------------------------------------------

const BASE_CLASSES = [
  "relative flex justify-center items-center rounded px-5 py-3.5",
  "font-sans text-[13px] font-semibold tracking-[0.1em] uppercase",
  // Named properties only. The press feedback and the hover colour are the two
  // things that should move; nothing else here should animate at all.
  "transition-[transform,background-color,border-color,opacity] duration-200 ease-out",
  "active:scale-[0.97]",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
].join(" ");

const VARIANTS = {
  primary:
    "bg-gold-accent text-[var(--bg,#0e0e0e)] hover:bg-[var(--accent-bright,#e6a600)] shadow-[var(--shadow-glow-soft)]",
  secondary:
    "bg-[var(--surface2)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent-border)]",
  danger: "bg-error/10 text-error border border-error/20 hover:bg-error/20",
};

export const ImpeccableButton = forwardRef(
  ({ children, className = "", variant = "primary", isLoading, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${BASE_CLASSES} ${VARIANTS[variant]} ${className}`}
        // The spread comes FIRST so the two lines below always win. A caller
        // cannot re-enable a button that is mid-flight, and cannot claim it is
        // idle while it is loading.
        {...props}
        disabled={isLoading || props.disabled}
        aria-busy={isLoading ? "true" : undefined}
      >
        {/* The label stays mounted and keeps reserving its width. Hiding it
            with opacity rather than unmounting it is what stops the button
            from resizing, and keeps the accessible name intact throughout. */}
        <span
          className={
            isLoading
              ? "opacity-0 transition-opacity duration-150 ease-out"
              : "opacity-100 transition-opacity duration-150 ease-out"
          }
        >
          {children}
        </span>

        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            {/* aria-hidden: the button already announces itself as busy, so the
                spinner would only add noise for a screen reader. */}
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
            />
          </span>
        )}
      </button>
    );
  }
);

ImpeccableButton.displayName = "ImpeccableButton";
