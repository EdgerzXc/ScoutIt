import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { siteUrl } from "@/lib/siteUrl";

async function publicProfileMetadata(username) {
  if (!supabaseAdmin || !username) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);

  let { data: profile, error } = await supabaseAdmin
    .from("public_profiles")
    .select("id, display_name, headline, is_example_account")
    .eq(isUuid ? "id" : "display_name", username)
    .maybeSingle();

  if (isUuid && !error && !profile) {
    ({ data: profile, error } = await supabaseAdmin
      .from("public_profiles")
      .select("id, display_name, headline, is_example_account")
      .eq("display_name", username)
      .maybeSingle());
  }

  if (error || !profile) return null;

  const { data: pilotParticipant } = await supabaseAdmin
    .from("pilot_participants")
    .select("user_id")
    .eq("user_id", profile.id)
    .is("offboarded_at", null)
    .maybeSingle();

  return {
    profile,
    isPilotParticipant: Boolean(pilotParticipant?.user_id),
  };
}

export async function generateMetadata({ params }) {
  const { username: encodedUsername } = await params;
  let username = encodedUsername;
  try {
    username = decodeURIComponent(encodedUsername);
  } catch {
    // The page will handle malformed or missing profiles without leaking data.
  }

  const resolved = await publicProfileMetadata(username);
  const canonical = siteUrl(`/profile/${encodeURIComponent(resolved?.profile?.id || username || "")}`);

  // ── Indexability is an ALLOWLIST, and the default is no ─────────────────
  // Owner ruling 2026-08-16: index only profiles that are real AND explicitly
  // made public by the person. Everything else — samples, private profiles,
  // pilot identities, and any name that does not resolve — stays out.
  //
  // Written as "index only when every condition is affirmatively true" rather
  // than "noindex when something is wrong", because a negative check fails
  // open: an unexpected value passes it (Standing Rule 6). Before this change
  // an unresolved username returned metadata with NO robots directive at all,
  // which is indexable by default — the exact failure that rule describes.
  const NOINDEX = { index: false, follow: true };

  if (!resolved) {
    return {
      title: "Profile · ScoutIt",
      alternates: { canonical },
      robots: NOINDEX,
    };
  }

  const { profile, isPilotParticipant } = resolved;

  // Reaching this point already proves `is_profile_public = true`, because the
  // `public_profiles` view itself filters on it (plus not shadowbanned and not
  // archived). The view is the gate; this only adds what the view exposes
  // rather than enforces.
  const isRealPerson = profile.is_example_account !== true;
  const isIndexable = isRealPerson && !isPilotParticipant;

  return {
    title: `${profile.display_name} · ScoutIt Profile`,
    description: profile.headline || "A public ScoutIt member profile.",
    alternates: { canonical },
    robots: isIndexable ? { index: true, follow: true } : NOINDEX,
  };
}

export default function PublicProfileLayout({ children }) {
  return children;
}
