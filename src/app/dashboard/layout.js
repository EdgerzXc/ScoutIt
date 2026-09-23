// A-096: distinct tab title (root template appends "· ScoutIt").
// A-146: private workspace — noindex with the title, never title-only.
export const metadata = { title: "Dashboard", robots: { index: false, follow: true } };

export default function DashboardRouteLayout({ children }) {
  return <>{children}</>;
}
