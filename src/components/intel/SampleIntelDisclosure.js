export default function SampleIntelDisclosure({ compact = false }) {
  const spacing = compact ? "m-0 px-1.5 py-0.5" : "mb-3 px-2 py-1";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-sm border border-gold-accent/40 bg-gold-accent/10
        font-mono text-[var(--type-floor)] font-bold uppercase leading-snug tracking-[0.1em]
        text-gold-accent ${spacing}`}
      title="Illustrative editorial content retained for human testing"
    >
      Sample data &mdash; for human testing
    </span>
  );
}
