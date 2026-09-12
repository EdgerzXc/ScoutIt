// A-096: distinct tab title (root template appends "· ScoutIt").
export const metadata = { title: "Badges", alternates: { canonical: "/badges" } };

export default function BadgesRouteLayout({ children }) {
  return <>{children}</>;
}
