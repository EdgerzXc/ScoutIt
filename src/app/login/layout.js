// A-146: the login stub redirects to /onboarding — index the destination,
// never the redirect. Title with noindex, in that order.
export const metadata = { title: "Sign In", robots: { index: false, follow: true } };

export default function LoginRouteLayout({ children }) {
  return <>{children}</>;
}
