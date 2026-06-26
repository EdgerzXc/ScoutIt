// Server-side metadata wrapper for the client-rendered pricing hub.
export const metadata = {
  title: "Pricing & Tiers",
  description:
    "Cosmic tiers for every role on ScoutIt — Starry, Solar, Cluster, Universe. We monetize access, intelligence, visibility, and connection, never the act of discovery.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing & Tiers · ScoutIt",
    description:
      "Cosmic tiers for every role — Seeker, Owner, Broker, Photographer. View per-role plans and multi-role bundles.",
  },
};

export default function PricingLayout({ children }) {
  return children;
}
