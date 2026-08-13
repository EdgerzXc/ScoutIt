import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { siteUrl } from "@/lib/siteUrl";

async function publicProfileMetadata(username) {
  if (!supabaseAdmin || !username) return null;

  const { data: profile, error } = await supabaseAdmin
    .from("public_profiles")
    .select("id, display_name, headline")
    .eq("display_name", username)
    .maybeSingle();

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
  const canonical = siteUrl(`/profile/${encodeURIComponent(username || "")}`);
  if (!resolved) {
    return {
      title: "Profile · ScoutIt",
      alternates: { canonical },
    };
  }

  const { profile, isPilotParticipant } = resolved;
  return {
    title: `${profile.display_name} · ScoutIt Profile`,
    description: profile.headline || "A public ScoutIt member profile.",
    alternates: { canonical },
    ...(isPilotParticipant
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default function PublicProfileLayout({ children }) {
  return children;
}
