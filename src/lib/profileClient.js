import { supabase } from './supabaseClient';

// ── PROFILE UPSERT ────────────────────────────────────────────────────────────
// Called on /profile page load. Syncs localStorage user data into Supabase.
export async function upsertProfile(localUser) {
  const profile = {
    id: localUser.id,
    display_name: localUser.name || null,
    location: localUser.publicProfile?.location || null,
    headline: localUser.publicProfile?.headline || null,
    bio: localUser.publicProfile?.bio || null,
    firm: localUser.publicProfile?.firm || null,
    service: localUser.publicProfile?.service || null,
    prc_license: localUser.broker?.prcLicense || null,
    provider_type: localUser.providerType || null,
    provider_availability: localUser.provider?.availability ?? true,
    member_since: localUser.created_at || new Date().toISOString(),
    subscription_tier: localUser.tier || localUser.subscription_tier || 'starry',
    connects_balance: localUser.connects_balance ?? 0,
    active_roles: localUser.tags || [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();

  return { data, error };
}

// ── OWN PROFILE LOAD ──────────────────────────────────────────────────────────
export async function loadOwnProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

// ── PUBLIC PROFILE LOAD ───────────────────────────────────────────────────────
// Explicitly excludes connects_balance — enforced at query level.
export async function loadPublicProfile(displayName) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'id, display_name, avatar_url, location, headline, bio, firm, service, ' +
      'member_since, subscription_tier, active_roles, provider_type, ' +
      'provider_availability, is_profile_public, is_example_account'
    )
    .eq('display_name', displayName)
    .eq('is_profile_public', true)
    .maybeSingle();
  if (error || !data) return { data, error };

  // user_badges is own-rows-only under RLS, so an anon-client read returns []
  // for every visitor. Badges on a PUBLIC profile are public-display data —
  // fetch them via the service-role public-profile route instead (which only
  // serves is_profile_public profiles). Best-effort: a failed badge fetch
  // never blocks the profile itself.
  let badgeRows = [];
  try {
    const res = await fetch(`/api/profile/public-roles?userId=${encodeURIComponent(data.id)}`);
    if (res.ok) {
      const payload = await res.json();
      badgeRows = payload.badges || [];
    }
  } catch (badgeErr) {
    console.error('Failed to load public badges', badgeErr);
  }

  return {
    data: { ...data, badges: badgeRows.map((b) => ({ id: b.badge_id, minted_at: b.earned_at })) },
    error: null,
  };
}

// ── PUBLIC PROVIDER DIRECTORY ─────────────────────────────────────────────────
// Powers /researchers and /photographers. RLS only exposes rows with
// is_profile_public = true to the anon client, so this is public data by
// definition. Same field discipline as loadPublicProfile — never
// connects_balance.
export async function loadPublicProviders(providerType) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'id, display_name, avatar_url, location, headline, bio, service, ' +
      'subscription_tier, provider_availability, is_example_account'
    )
    .eq('provider_type', providerType)
    .eq('is_profile_public', true)
    .eq('is_shadowbanned', false)
    .order('display_name', { ascending: true });
  return { data: data || [], error };
}

// ── PUBLIC ROLES (for viewing someone else's profile) ─────────────────────────
// privacy_settings is own-rows-only under RLS (correctly, since the 2026-07-09
// reset), so a visitor can't read the target's public_roles directly — the
// server route returns just that one display-control field, and only for
// public profiles.
export async function loadPublicRoles(userId) {
  try {
    const res = await fetch(`/api/profile/public-roles?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return { publicRoles: [], error: null };
    const data = await res.json();
    return { publicRoles: data.publicRoles || [], error: null };
  } catch (error) {
    console.error("Failed to load public roles", error);
    return { publicRoles: [], error };
  }
}

// ── PRIVACY SETTINGS ──────────────────────────────────────────────────────────
export async function loadPrivacySettings(userId) {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    const defaults = {
      user_id: userId,
      anonymous_browsing: false,
      anonymous_byline: false,
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

export async function updatePrivacySettings(userId, patch) {
  const { data, error } = await supabase
    .from('privacy_settings')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();
  return { data, error };
}

export async function updateProfilePublic(userId, isPublic) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_profile_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return { error };
}

// ── BROKER PROFILE ────────────────────────────────────────────────────────────
export async function loadBrokerProfile(userId) {
  const { data, error } = await supabase
    .from('broker_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
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
export async function loadResearcherProfile(userId) {
  const { data, error } = await supabase
    .from('researcher_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
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

// ── SEEKER SAVED COUNT ────────────────────────────────────────────────────────
// Private only — reads from saved_intel for own profile view.
export async function loadSeekerSavedCount(userId) {
  const { count, error } = await supabase
    .from('saved_intel')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return { count: count ?? 0, error };
}

// ── OWNER LISTINGS ────────────────────────────────────────────────────────────
// Private only — reads from properties for own profile view.
export async function loadOwnerListings(userId) {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, location, type, pipeline_status, verified, completeness_score, created_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  // Map to the expected shape for OwnerPanel
  const mappedData = (data || []).map(p => ({
    id: p.id,
    title: p.title,
    location: p.location,
    type: p.type,
    verified: !!p.verified,
    completeness_score: p.completeness_score ?? 50
  }));

  return { data: mappedData, error };
}

// ── OWNER INQUIRY COUNT ───────────────────────────────────────────────────────
// Private only — counts deals against owner's properties.
export async function loadOwnerInquiryCount(propertyIds) {
  if (!propertyIds?.length) return { count: 0, error: null };
  const { count, error } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .in('property_id', propertyIds);
  return { count: count ?? 0, error };
}

// ── INCREMENT PROFILE VIEWS ───────────────────────────────────────────────────
export async function incrementBrokerProfileViews(userId) {
  const { data, error } = await supabase.functions.invoke('increment_profile_views', {
    body: { user_id: userId },
  });
  return { data, error };
}
