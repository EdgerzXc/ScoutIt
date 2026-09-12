// A-096: distinct tab title (root template appends "· ScoutIt").
export const metadata = { title: "Enterprise", alternates: { canonical: "/enterprise" } };

export default function EnterpriseRouteLayout({ children }) {
  return <>{children}</>;
}
