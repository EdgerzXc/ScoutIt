// A-096: the sign-up route gets a real tab name first — a browser tab,
// bookmark, and shared link that all read the root fallback is the most
// commercially visible instance of this defect.
export const metadata = { title: "Create Account" };

export default function OnboardingRouteLayout({ children }) {
  return <>{children}</>;
}
