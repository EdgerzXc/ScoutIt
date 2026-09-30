// A-096: distinct tab title (root template appends "· ScoutIt").
export const metadata = {
  title: "Transit",
  description: "Manila transit infrastructure map connecting rail, hubs, and high-value districts across the metro.",
  alternates: { canonical: "/transit" },
};

export default function TransitRouteLayout({ children }) {
  return <>{children}</>;
}
