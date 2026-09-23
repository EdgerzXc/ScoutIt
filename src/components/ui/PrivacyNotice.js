// A-150 — one shared privacy-disclosure line for every form that collects
// personal contact data (RA 10173 §11, RULES rule 30). Rendered adjacent to
// the submit control so the promise is seen before the tap, not after.
//
// One component, not five copies, so the wording cannot drift per form.
// Inline styles, not a stylesheet: the five call sites use five different
// styling systems, and a shared class would inherit five different parents.

export const PRIVACY_POLICY_PATH = "/privacy";

export default function PrivacyNotice() {
  return (
    <p
      className="scoutit-privacy-notice"
      style={{
        margin: "10px 0 0",
        fontSize: 12,
        lineHeight: 1.6,
        textAlign: "center",
        color: "var(--text-muted, #888)",
      }}
    >
      By submitting, you agree to our{" "}
      <a
        href={PRIVACY_POLICY_PATH}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--accent, var(--accent))", textDecoration: "underline" }}
      >
        Privacy Policy
      </a>
      .
    </p>
  );
}
