// A-096: distinct tab title (root template appends "· ScoutIt").
// A-146: staff surface — robots.txt disallow is not noindex if linked;
// defense in depth with the meta tag.
export const metadata = { title: "Admin Console", robots: { index: false, follow: false } };

export default function AdminRouteLayout({ children }) {
  return <>{children}</>;
}
