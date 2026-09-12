// A-096: distinct tab title (root template appends "· ScoutIt").
export const metadata = { title: "Transit", alternates: { canonical: "/transit" } };

export default function TransitRouteLayout({ children }) {
  return <>{children}</>;
}
