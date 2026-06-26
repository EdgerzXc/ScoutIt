import { Handshake, Sparkles, RefreshCw } from "lucide-react";

// Plain-language explainer for the Connects economy. Dropped into every pricing
// page (where the "◈ X Connects / month" badges appear) so visitors understand
// what they're actually paying for before they subscribe.
const POINTS = [
  {
    icon: Handshake,
    title: "What a Connect does",
    body:
      "A Connect is spent on a meaningful action — reaching a broker or pitching an owner (1), or commissioning a photographer, researcher, or event planner (2). Browsing, saving, and reading intel are always free.",
  },
  {
    icon: Sparkles,
    title: "How you get them",
    body:
      "Every tier includes a monthly Connects allowance. You can also buy Connect packs anytime, or earn them by completing bounties. Purchased and earned Connects never expire.",
  },
  {
    icon: RefreshCw,
    title: "Monthly reset",
    body:
      "Your tier allowance refreshes on the 1st of each month — it doesn't roll over. Connects you bought or earned stay in your wallet until you use them.",
  },
];

export default function ConnectsExplainer() {
  return (
    <section className="connects-explainer z-10 relative w-full max-w-5xl mx-auto px-4 mt-24">
      <div className="rounded-2xl border border-gold-accent/20 bg-surface-alt/40 backdrop-blur-md p-8 md:p-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gold-accent font-mono font-bold text-lg">◈</span>
          <span className="vector-label text-gold-accent tracking-[0.3em] uppercase text-xs font-bold">
            Understanding Connects
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-working-title text-white mb-3">
          Connects are how you make contact.
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mb-8">
          ScoutIt monetizes connection, not discovery. You never pay to look —
          Connects are only spent when you reach out. Here's how they work.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-white/5 p-6 hover:border-gold-accent/30 transition-colors duration-300"
            >
              <div className="p-2.5 rounded-lg bg-gold-accent/10 w-fit mb-4">
                <Icon className="w-5 h-5 text-gold-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-working-title text-white mb-2">{title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
