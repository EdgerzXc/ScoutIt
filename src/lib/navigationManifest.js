/**
 * The one canonical description of the universal header menu.
 *
 * The menu used to be a hand-maintained list of <Link> elements inside the
 * header. Nothing could assert that its destinations existed, that its order
 * was deliberate, or that the signed-out variant matched the signed-in one.
 * Every entry here is route-checked by navigationManifest.test.js.
 */

export const PRIMARY_NAV_ENTRIES = Object.freeze([
  { id: "home", href: "/", label: "Home" },
  { id: "discover", href: "/discover", label: "Discover" },
  { id: "brokers", href: "/brokers", label: "Brokers" },
  { id: "photographers", href: "/photographers", label: "Photographers" },
  { id: "researchers", href: "/researchers", label: "Researchers" },
  { id: "event-planners", href: "/event-planners", label: "Event Planners" },
  { id: "wishlist", href: "/wishlist", label: "Your Board" },
  { id: "dashboard", href: "/dashboard", label: "Dashboard" },
  { id: "about", href: "/about", label: "About" },
]);

/**
 * The account row is the only entry whose destination depends on session
 * state. It is a display hint, not a permission: /profile and /dashboard
 * enforce their own access server-side, because a browser-held session marker
 * can never grant an account a capability.
 */
export const ACCOUNT_ENTRIES = Object.freeze({
  signedIn: Object.freeze({ id: "profile", href: "/profile", label: "My Profile" }),
  signedOut: Object.freeze({ id: "create-account", href: "/onboarding", label: "Create Account" }),
});

export function accountEntry(isSignedIn) {
  return isSignedIn ? ACCOUNT_ENTRIES.signedIn : ACCOUNT_ENTRIES.signedOut;
}

export function menuEntries(isSignedIn) {
  return [accountEntry(isSignedIn), ...PRIMARY_NAV_ENTRIES];
}
