export default function ProfileProvenanceBadge({ isPilotParticipant = false }) {
  if (!isPilotParticipant) return null;
  return (
    <span
      title="This profile belongs to an invited tester and contains sample public data"
      className="inline-flex items-center rounded-full border border-gold-accent/35 bg-gold-accent/10 px-3 py-1 font-mono text-[9px] uppercase leading-none tracking-[0.15em] text-gold-accent"
    >
      Sample profile &mdash; for human testing
    </span>
  );
}
