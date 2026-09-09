// A-096: distinct tab title (root template appends "· ScoutIt").
export const metadata = { title: "Admin Console" };

export default function AdminRouteLayout({ children }) {
  return <>{children}</>;
}
