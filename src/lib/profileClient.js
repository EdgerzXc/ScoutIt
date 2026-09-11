import { supabase } from './supabaseClient';
import { anonymityShieldDefaultsOn } from './entitlements';

// ── PROFILE SYNC — RETIRED (A-138) ────────────────────────────────────────────
// `upsertProfile` copied the browser's `scoutit_user` into the account on every
// /profile visit. It reverted Settings edits, blanked any field the copy lacked,
// and let an editable browser copy re-add a gated role past A-137's licence
// check. My Profile now reads the account (loadOwnProfile) and nothing writes
// profile fields from browser state. Do not reintroduce it.

// ── OWN PROFILE LOAD ──────────────────────────────────────────────────────────
// A-138: named columns, never `*`. One column later restricted for the browser
// would otherwise fail the whole read with 42501 and take the page down.
// Every column here was confirmed readable by `authenticated` on 2026-09-11.
const OWN_PROFILE_COLUMNS =
  'id, display_name, avatar_url, subscription_tier, active_roles, provider_type, ' +
  'location, headline, bio, firm, service, member_since, is_profile_public, ' +
  'provider_availability, prc_verified, prc_license, is_example_account';

export async function loadOwnProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(OWN_PROFILE_COLUMNS)
    .eq('id', userId)
    .single();
  return { data, error };
}

// ── PUBLIC PROFILE LOAD ───────────────────────────────────────────────────────
// Reads the `public_profiles` VIEW, never the base table (NEW_IDEAS.md §43).
//
// This previously said "excludes connects_balance — enforced at query level".
// A query is not enforcement. RLS is row-level, so the old
// `USING (is_profile_public = true)` policy let any browser console select ANY
// column of any public profile — connects_balance, moderation_note (internal
// staff commentary), is_shadowbanned, role. The app asking nicely for safe
// columns changed nothing.
//
// The view is now the only path a browser has to another user's profile, and
// the sensitive columns are not in it. Do not "optimise" this back to the base
// table.
export async function loadPublicProfile(identifier) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier || "");
  let { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq(isUuid ? 'id' : 'display_name', identifier)
    .maybeSingle();
  // Legacy display-name URLs remain readable, but every newly emitted and
  // canonical URL uses the immutable profile id to avoid name drift/collision.
  if (isUuid && !error && !data) {
    ({ data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('display_name', identifier)
      .maybeSingle());
  }
  if (error || !data) return { data, error };

  // user_badges is own-rows-only under RLS, so an anon-client read returns []
  // for every visitor. Badges on a PUBLIC profile are public-display data —
  // fetch them via the service-role public-profile route instead (which only
  // serves is_profile_public profiles). Best-effort: a failed badge fetch
  // never blocks the profile itself.
  let badgeRows = [];
  let isPilotParticipant = false;
  try {
    const res = await fetch(`/api/profile/public-roles?userId=${encodeURIComponent(data.id)}`);
    if (res.ok) {
      const payload = await res.json();
      badgeRows = payload.badges || [];
      isPilotParticipant = payload.isPilotParticipant === true;
    }
  } catch (badgeErr) {
    console.error('Failed to load public badges', badgeErr);
  }

  return {
    data: { ...data, is_pilot_participant: isPilotParticipant, badges: badgeRows.map((b) => ({ id: b.badge_id, minted_at: b.earned_at })) },
    error: null,
  };
}

// ── PUBLIC PROVIDER DIRECTORY ─────────────────────────────────────────────────
// Powers /researchers and /photographers. RLS only exposes rows with
// is_profile_public = true to the anon client, so this is public data by
// definition. Same field discipline as loadPublicProfile — never
// connects_balance.
export async function loadPublicProviders(providerType) {
  // The view already filters is_profile_public, shadowbanned and archived —
  // three conditions that had to be repeated correctly at every call site
  // before, and were not. loadPublicProfile checked two of them; this checked
  // three; nothing checked archived_at.
  const { data, error } = await supabase
    .from('public_profiles')
    .select(
      'id, display_name, avatar_url, location, headline, bio, service, ' +
      'subscription_tier, provider_availability, is_example_account'
    )
    .eq('provider_type', providerType)
    .order('display_name', { ascending: true });
  if (error || typeof window === "undefined") return { data: data || [], error };
  const enriched = await Promise.all((data || []).map(async (profile) => {
    const provenance = await loadPublicRoles(profile.id);
    return {
      ...profile,
      is_pilot_participant: provenance.isPilotParticipant === true,
      badges: (provenance.badges || []).map((badge) => ({ id: badge.badge_id, minted_at: badge.earned_at })),
    };
  }));
  return { data: enriched, error: null };
}

// ── PUBLIC ROLES (for viewing someone else's profile) ─────────────────────────
// privacy_settings is own-rows-only under RLS (correctly, since the 2026-07-09
// reset), so a visitor can't read the target's public_roles directly — the
// server route returns just that one display-control field, and only for
// public profiles.
export async function loadPublicRoles(userId) {
  try {
    const res = await fetch(`/api/profile/public-roles?userId=${encodeURIComponent(userId)}`);
    // A-091: a failed read resolves pilot to false everywhere downstream, so
    // the failure must travel as an error, not as a silent null — every
    // reader treats false as "ordinary person". (All current readers only
    // display on an explicit === true, so this changes no rendering today.)
    if (!res.ok) return { publicRoles: [], isPilotParticipant: false, error: new Error(`public-roles unavailable (${res.status})`) };
    const data = await res.json();
    return { publicRoles: data.publicRoles || [], badges: data.badges || [], isPilotParticipant: data.isPilotParticipant === true, error: null };
  } catch (error) {
    console.error("Failed to load public roles", error);
    return { publicRoles: [], badges: [], isPilotParticipant: false, error };
  }
}

// ── PRIVACY SETTINGS ──────────────────────────────────────────────────────────
//
// ── ANONYMITY SHIELD (NEW_IDEAS.md §46.8) ──
// Owner ruling 2026-08-06: the shield is FREE FOR EVERYONE; Cluster+ only
// changes whether it starts switched ON.
//
// So the tier is consulted exactly once — HERE, when the row is first created
// — and never again. Every user can toggle these fields freely afterwards
// regardless of tier. If you ever find a tier check guarding the toggle
// itself, that is a bug: it would mean charging for privacy.
//
// ⚠️ ONLY ON FIRST CREATION. An existing row is returned untouched. Silently
// rewriting someone's stored privacy preference on a later page load — even
// to the safer value — is changing their settings without asking.
export async function loadPrivacySettings(userId, { tier = null, role = null } = {}) {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    // Falls back to `false` when tier/role weren't supplied — the safe,
    // unsurprising default, and exactly what every caller got before.
    const shieldOn = tier ? anonymityShieldDefaultsOn(tier, role) : false;
    const defaults = {
      user_id: userId,
      anonymous_browsing: shieldOn,
      anonymous_byline: shieldOn,
      public_roles: [],
      connects_balance_visible: false,
    };
    const { data: created, error: createErr } = await supabase
      .from('privacy_settings')
      .insert(defaults)
      .select()
      .single();
    return { data: created, error: createErr };
  }
  return { data, error };
}

// A-135: `updatePrivacySettings` (a browser-direct upsert of privacy_settings)
// was removed with the /profile privacy control it served. Every privacy write
// now goes through /api/user/privacy-settings, so there is one writer.

// U-026: this used to write `is_profile_public` straight from the browser.
// U-022 made it server-only by grant, so since 2026-09-04 the write has been
// refused with 42501 while `PrivacyControls` flipped the switch and reported
// success — a privacy control that says "you are public" when the database
// still says private. Standing Rule 5 in the other direction: the browser
// cannot be the one to assert a visibility state.
//
// `/api/user/privacy-settings` already owned this column server-side and was
// simply not being used from here. `userId` is no longer a parameter of the
// write — the route resolves the caller from the session, so a client cannot
// name whose profile it is changing.
export async function updateProfilePublic(userId, isPublic) {
  try {
    const { getSession } = await import('./authClient');
    const { data: { session } } = await getSession();
    if (!session) return { error: new Error('Session expired. Sign in again to change this.') };

    const res = await fetch('/api/user/privacy-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ isProfilePublic: isPublic }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: new Error(data.error || 'Could not update profile visibility.') };

    // The route re-reads the row, so this is the stored value, not the asked-for
    // one. The caller renders from it.
    return { error: null, isProfilePublic: data?.settings?.isProfilePublic === true };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Could not update profile visibility.') };
  }
}

// ── BROKER PROFILE ────────────────────────────────────────────────────────────
export async function loadBrokerProfile(userId, { createIfMissing = true } = {}) {
  const { data, error } = await supabase
    .from('broker_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116' && createIfMissing) {
    const { data: created, error: createErr } = await supabase
      .from('broker_profiles')
      .insert({ user_id: userId })
      .select()
      .single();
    return { data: created, error: createErr };
  }
  return { data, error };
}

// ── RESEARCHER PROFILE ────────────────────────────────────────────────────────
export async function loadResearcherProfile(userId, { createIfMissing = true } = {}) {
  const { data, error } = await supabase
    .from('researcher_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116' && createIfMissing) {
    const { data: created, error: createErr } = await supabase
      .from('researcher_profiles')
      .insert({ user_id: userId })
      .select()
      .single();
    return { data: created, error: createErr };
  }
  return { data, error };
}

// ── PHOTOGRAPHER PROJECTS ─────────────────────────────────────────────────────
// Reads from the existing `projects` table (provider_id is their user ID).
export async function loadPhotographerProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, cover_image, status, created_at')
    .eq('provider_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

// Seeker / Owner private-panel loaders were removed with those panels (A-138):
// they repeated the dashboard's numbers on a page that shows how others see you.

// ── INCREMENT PROFILE VIEWS ───────────────────────────────────────────────────
export async function incrementBrokerProfileViews(userId) {
  const { data, error } = await supabase.functions.invoke('increment_profile_views', {
    body: { user_id: userId },
  });
  return { data, error };
}
