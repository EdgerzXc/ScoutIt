/**
 * The one canonical description of the universal header menu.
 *
 * The menu used to be a hand-maintained list of <Link> elements inside the
 * header. Nothing could assert that its destinations existed, that its order
 * was deliberate, or that the signed-out variant matched the signed-in one.
 * Every entry here is route-checked by navigationManifest.test.js.
 */

export const NAVIGATION_GROUPS = Object.freeze([
  Object.freeze({ id: "account", label: "Account" }),
  Object.freeze({ id: "explore", label: "Explore" }),
  Object.freeze({ id: "workspace", label: "Workspace" }),
  Object.freeze({ id: "help", label: "Help" }),
]);

export const PRIMARY_NAV_ENTRIES = Object.freeze([
  { id: "settings", href: "/settings", label: "Settings", group: "account" },
  { id: "home", href: "/", label: "Home", group: "explore" },
  { id: "discover", href: "/discover", label: "Discover", group: "explore" },
  { id: "brokers", href: "/brokers", label: "Brokers", group: "explore" },
  { id: "photographers", href: "/photographers", label: "Photographers", group: "explore" },
  { id: "researchers", href: "/researchers", label: "Researchers", group: "explore" },
  { id: "event-planners", href: "/event-planners", label: "Event Planners", group: "explore" },
  { id: "wishlist", href: "/wishlist", label: "Your Board", group: "workspace" },
  { id: "dashboard", href: "/dashboard", label: "Dashboard", group: "workspace" },
  { id: "about", href: "/about", label: "About ScoutIt", group: "help" },
  { id: "contact", href: "/contact", label: "Contact & Support", group: "help" },
]);

/**
 * The account row is the only entry whose destination depends on session
 * state. It is a display hint, not a permission: /profile and /dashboard
 * enforce their own access server-side, because a browser-held session marker
 * can never grant an account a capability.
 */
export const ACCOUNT_ENTRIES = Object.freeze({
  signedIn: Object.freeze({ id: "profile", href: "/profile", label: "My Profile", group: "account" }),
  signedOut: Object.freeze({ id: "create-account", href: "/onboarding", label: "Create Account", group: "account" }),
});

export function accountEntry(isSignedIn) {
  return isSignedIn ? ACCOUNT_ENTRIES.signedIn : ACCOUNT_ENTRIES.signedOut;
}

export function menuEntries(isSignedIn) {
  return [accountEntry(isSignedIn), ...PRIMARY_NAV_ENTRIES];
}

export function menuGroups(isSignedIn) {
  const entries = menuEntries(isSignedIn);
  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    entries: entries.filter((entry) => entry.group === group.id),
  })).filter((group) => group.entries.length > 0);
}
