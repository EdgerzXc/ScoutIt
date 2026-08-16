// ═══════════════════════════════════════════════════════════════════════
// PAGE GUIDES — what the guide says depends on where you are standing
//
// WHAT THIS REPLACES
// ------------------
// A single four-card `WIZARD_STEPS` constant inside FloatingToolbox.js: The
// Descent, Space Directory, Roles & Connects, Your Profile. The same four
// cards appeared on every page in the product, with no owner or broker
// variant.
//
// That is why it did not land. It explained ScoutIt in general to someone who
// was standing on one specific screen with one specific question — and the
// densest screen in the product, the property page, got no more help than the
// homepage.
//
// ONE SOURCE, NOT PARALLEL COPIES
// -------------------------------
// Every surface resolves through `guideForPath` below. This is the same rule
// §1.5 sets for the navigation manifest: header, mobile nav and future
// surfaces consume one approved source rather than drifting copies. Adding a
// guide means adding an entry here, never a second constant somewhere else.
//
// ROLE VARIANTS
// -------------
// `byRole` is consulted first and falls back to `steps`. The role passed in
// MUST come from the verified Supabase session and server-approved roles —
// never from `scoutit_user` localStorage, which is a browser-only flag and not
// an authorization signal (§1.5 sets the identical rule for navigation, and
// Standing Rule 5: a gate the client evaluates is a suggestion).
//
// Passing no role is fine and is the normal signed-out case: the reader gets
// the role-neutral copy, which is written to stand on its own.
// ═══════════════════════════════════════════════════════════════════════

/**
 * @typedef {{ glyph: string, title: string, body: string }} GuideStep
 * @typedef {{ id: string, label: string, steps: GuideStep[], byRole?: Record<string, GuideStep[]> }} PageGuide
 */

/** The fallback. Deliberately still useful — it is what a stranger sees. */
const DEFAULT_GUIDE = {
  id: "default",
  label: "ScoutIt",
  steps: [
    {
      glyph: "◈",
      title: "The Descent",
      body: "ScoutIt is structured as layers — Stratosphere down to Core. Each layer reveals a deeper dimension of a space. Start at the top and descend before you commit.",
    },
    {
      glyph: "◉",
      title: "Space Directory",
      body: "Every property, office, and venue lives at /property. Filter by sector, location, and aesthetic. Use Proximity Radar to find spaces within a radius of any point on the map.",
    },
    {
      glyph: "◐",
      title: "Roles & Connects",
      body: "Your role shapes what you see. Brokers build Scout Ratings through verified closings. Providers showcase portfolios. Seekers track saved spaces. Connects are the platform currency.",
    },
    {
      glyph: "◑",
      title: "Your Profile",
      body: "Your public profile is opt-in. Toggle visibility per role. Seeker activity and your Connects balance are always private — never visible to anyone but you.",
    },
  ],
};

/**
 * The property page. Authored first and in the most detail, because it is the
 * surface the owner named and the densest screen in the product: chapters,
 * lenses, the reach ring, camera controls, the Vault, and a Connect that costs
 * something real.
 */
const PROPERTY_GUIDE = {
  id: "property",
  label: "This space",
  steps: [
    {
      glyph: "◈",
      title: "Read it in chapters",
      body: "This page is a sequence, not a list. The Space, Location, Life Here, Where To — each chapter answers one question. Use the rail to jump, or just keep going down.",
    },
    {
      glyph: "◎",
      title: "The map has four lenses",
      body: "Tactical, Command, Flood and Transit show the same place with different meaning. The map never moves when you switch — only what it is telling you changes.",
    },
    {
      glyph: "⟳",
      title: "Look around in 3D",
      body: "Two fingers twist to spin the city. The ▲▼ buttons tilt your view up and down. Lost your bearings? Tap the compass and it snaps back to facing north.",
    },
    {
      glyph: "◍",
      title: "The ring is reach, not distance",
      body: "The dashed circle shows how far you can actually get from this address — the label tells you whether that is walking minutes or a straight-line radius. They are not the same thing.",
    },
    {
      glyph: "◆",
      title: "What a Connect buys",
      body: "A Connect opens a private thread with whoever holds this space. It buys a conversation about a property — never someone's identity. Names appear only after both sides accept.",
    },
  ],
  byRole: {
    owner: [
      {
        glyph: "◈",
        title: "This is what buyers see",
        body: "You are looking at your listing exactly as a seeker does. Anything unclear here is unclear to them — the chapters below are the order they read it in.",
      },
      {
        glyph: "◉",
        title: "Completeness is ranking",
        body: "Empty chapters read as an unfinished listing. Photos, units, and verified details are what move a space up the directory and keep it there.",
      },
      {
        glyph: "◆",
        title: "Enquiries reach you here",
        body: "When someone spends a Connect on this space, it lands in your dashboard inbox as a private thread. Your contact details stay hidden until you accept.",
      },
      {
        glyph: "◐",
        title: "Freshness is a promise",
        body: "Listings go stale and we will ask you to confirm this one is still accurate. Confirming keeps it visible; ignoring it eventually does not.",
      },
    ],
    broker: [
      {
        glyph: "◈",
        title: "Know it before you are asked",
        body: "Everything a seeker can see about this space is on this page. Read the Location and Where To chapters before a viewing — that is where the questions come from.",
      },
      {
        glyph: "◎",
        title: "The lenses are your brief",
        body: "Flood history, transit reach and the surrounding mix are on the map, not buried in a PDF. Switching lenses is faster than answering from memory.",
      },
      {
        glyph: "◆",
        title: "Representation and routing",
        body: "Leads on a space route to its active roster. Being attached to a property is what puts you in that routing — it is not automatic from viewing the page.",
      },
      {
        glyph: "◑",
        title: "Your rating is earned here",
        body: "Scout Ratings come from verified closings, not activity. A completed handshake on a real deal is what moves it.",
      },
    ],
  },
};

/** Surfaces keyed by the first path segment that identifies them. */
const GUIDES = {
  property: PROPERTY_GUIDE,

  discover: {
    id: "discover",
    label: "Discover",
    steps: [
      {
        glyph: "◉",
        title: "Filter, then narrow",
        body: "Start broad — sector and city — then tighten. The result count updates as you go, so you can tell when a filter has cut too far.",
      },
      {
        glyph: "◍",
        title: "Proximity Radar",
        body: "Drop a point on the map and set a radius to find every space within reach of somewhere that matters — an office, a school, a client.",
      },
      {
        glyph: "◆",
        title: "Save as you go",
        body: "Anything you save lands on Your Board, where you can compare spaces side by side instead of holding six tabs open.",
      },
    ],
  },

  dashboard: {
    id: "dashboard",
    label: "Your workspace",
    steps: [
      {
        glyph: "◈",
        title: "Everyone starts as a seeker",
        body: "The dashboard opens in Buyer mode because every account is a space seeker first. Other modes appear as you take on those roles.",
      },
      {
        glyph: "◆",
        title: "The inbox is the deal",
        body: "Conversations live attached to the space they are about, so a thread always carries its own context. Nothing important happens over email.",
      },
      {
        glyph: "◑",
        title: "Private by default",
        body: "Your saved spaces, your activity and your Connects balance are yours alone. Nothing here is visible to another user unless you publish it.",
      },
    ],
  },

  wishlist: {
    id: "wishlist",
    label: "Your Board",
    steps: [
      {
        glyph: "◆",
        title: "Your shortlist, side by side",
        body: "Everything you saved, in one place, so you can compare rather than remember. Saving is private — nobody is told you looked.",
      },
      {
        glyph: "◐",
        title: "Share a board, not your account",
        body: "You can share a board with someone by link. They see the spaces you chose and nothing else about you.",
      },
    ],
  },
};

/**
 * Resolve the guide for a path.
 *
 * Matched on the first path segment, so `/property/[slug]` and
 * `/property/[slug]/unit/[id]` both get the property guide — a reader deep in a
 * unit page has more questions about this surface, not fewer.
 *
 * @param {string} pathname
 * @param {string|null} [role] Verified role. Never a localStorage value.
 * @returns {PageGuide & { steps: GuideStep[] }}
 */
export function guideForPath(pathname, role = null) {
  const segment = String(pathname || "").split("?")[0].split("/").filter(Boolean)[0];
  const guide = GUIDES[segment] || DEFAULT_GUIDE;
  const steps = (role && guide.byRole?.[role]) || guide.steps;
  return { ...guide, steps };
}

export { DEFAULT_GUIDE, GUIDES };
export default guideForPath;
