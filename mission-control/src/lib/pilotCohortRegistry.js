import "server-only";

export const PILOT_ROLES = Object.freeze(["owner", "seeker", "broker", "provider"]);
export const PILOT_CONFIRMATIONS = Object.freeze({
  create: "CREATE PILOT COHORT",
  enroll: "ENROLL PILOT TESTER",
  activate: "ACTIVATE PILOT COHORT",
  close: "CLOSE PILOT COHORT",
  offboard: "OFFBOARD PILOT TESTER",
  confirmDeletion: "CONFIRM TESTER ACCOUNT DELETED",
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{2,47}$/;

function requiredUuid(value, label) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) throw new Error(`${label} must be a valid UUID.`);
  return normalized;
}

function optionalTimestamp(value, label) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${label} must be a valid date and time.`);
  return parsed.toISOString();
}

function assertResult(data, error, fallback) {
  if (error) throw new Error(error.message || fallback);
  if (!data) throw new Error(fallback);
  return data;
}

export function normalizePilotCohortInput(input) {
  const cohortKey = String(input.cohortKey || "").trim().toLowerCase();
  const name = String(input.name || "").trim();
  const startsAt = optionalTimestamp(input.startsAt, "Start time");
  const endsAt = optionalTimestamp(input.endsAt, "End time");
  if (!KEY_PATTERN.test(cohortKey)) throw new Error("Cohort key must be 3–48 lowercase letters, numbers, underscores, or hyphens.");
  if (name.length < 3 || name.length > 80) throw new Error("Cohort name must be 3–80 characters.");
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) throw new Error("End time must be after start time.");
  return { cohortKey, name, startsAt, endsAt };
}

export function normalizePilotEnrollmentInput(input) {
  const cohortId = requiredUuid(input.cohortId, "Cohort ID");
  const userId = requiredUuid(input.userId, "Tester user ID");
  const roles = [...new Set((input.roles || []).map((role) => String(role).trim().toLowerCase()))];
  if (!roles.length || roles.some((role) => !PILOT_ROLES.includes(role))) {
    throw new Error(`Choose at least one approved role: ${PILOT_ROLES.join(", ")}.`);
  }
  return { cohortId, userId, roles };
}

export async function loadPilotCohortRegistry(admin) {
  const [cohortsResponse, participantsResponse] = await Promise.all([
    admin.from("pilot_cohorts")
      .select("id, cohort_key, name, status, starts_at, ends_at, created_by, created_at, closed_at")
      .order("created_at", { ascending: false }),
    admin.from("pilot_participants")
      .select("cohort_id, user_id, roles, enrolled_by, enrolled_at, offboarded_by, offboarded_at, account_deleted_at, cleanup_note")
      .order("enrolled_at", { ascending: false }),
  ]);
  if (cohortsResponse.error) throw new Error(cohortsResponse.error.message || "Pilot cohorts could not be loaded.");
  if (participantsResponse.error) throw new Error(participantsResponse.error.message || "Pilot participants could not be loaded.");
  return { cohorts: cohortsResponse.data ?? [], participants: participantsResponse.data ?? [] };
}

export async function createPilotCohortRecord(admin, staffId, input) {
  const normalized = normalizePilotCohortInput(input);
  const response = await admin.from("pilot_cohorts").insert({
    cohort_key: normalized.cohortKey,
    name: normalized.name,
    starts_at: normalized.startsAt,
    ends_at: normalized.endsAt,
    created_by: requiredUuid(staffId, "Staff ID"),
  }).select("id, cohort_key, name, status, starts_at, ends_at").single();
  return assertResult(response.data, response.error, "Pilot cohort creation could not be verified.");
}

export async function enrollPilotParticipantRecord(admin, staffId, input) {
  const normalized = normalizePilotEnrollmentInput(input);
  const authResponse = await admin.auth.admin.getUserById(normalized.userId);
  if (authResponse.error || !authResponse.data?.user?.id) {
    throw new Error("No verified Supabase Auth user exists for that tester user ID.");
  }
  const cohortResponse = await admin.from("pilot_cohorts").select("id, status")
    .eq("id", normalized.cohortId).maybeSingle();
  const cohort = assertResult(cohortResponse.data, cohortResponse.error, "Pilot cohort was not found.");
  if (!['planned', 'active'].includes(cohort.status)) throw new Error("Only a planned or active cohort can accept testers.");

  const activeResponse = await admin.from("pilot_participants").select("cohort_id")
    .eq("user_id", normalized.userId).is("offboarded_at", null).maybeSingle();
  if (activeResponse.error) throw new Error(activeResponse.error.message);
  if (activeResponse.data) throw new Error("That tester already belongs to an active cohort.");

  const response = await admin.from("pilot_participants").insert({
    cohort_id: normalized.cohortId,
    user_id: normalized.userId,
    roles: normalized.roles,
    enrolled_by: requiredUuid(staffId, "Staff ID"),
  }).select("cohort_id, user_id, roles, enrolled_at").single();
  return assertResult(response.data, response.error, "Pilot enrollment could not be verified.");
}

export async function changePilotCohortStatusRecord(admin, staffId, input) {
  const cohortId = requiredUuid(input.cohortId, "Cohort ID");
  const command = String(input.command || "").trim();
  if (!['activate', 'close'].includes(command)) throw new Error("Unsupported cohort lifecycle command.");
  const currentResponse = await admin.from("pilot_cohorts")
    .select("id, status, starts_at, closed_at").eq("id", cohortId).maybeSingle();
  const current = assertResult(currentResponse.data, currentResponse.error, "Pilot cohort was not found.");
  if (command === "activate") {
    if (current.status !== "planned") throw new Error("Only a planned cohort can be activated.");
    const response = await admin.from("pilot_cohorts")
      .update({ status: "active", starts_at: current.starts_at || new Date().toISOString() })
      .eq("id", cohortId).eq("status", "planned").select("id, status, starts_at").single();
    return assertResult(response.data, response.error, "Pilot cohort activation could not be verified.");
  }

  if (!['planned', 'active'].includes(current.status)) throw new Error("Only a planned or active cohort can be closed.");
  const activeResponse = await admin.from("pilot_participants")
    .select("user_id", { count: "exact", head: true }).eq("cohort_id", cohortId).is("offboarded_at", null);
  if (activeResponse.error) throw new Error(activeResponse.error.message);
  if ((activeResponse.count ?? 0) > 0) throw new Error("Offboard every active tester before closing the cohort.");
  const response = await admin.from("pilot_cohorts")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", cohortId).in("status", ["planned", "active"])
    .select("id, status, closed_at").single();
  return assertResult(response.data, response.error, "Pilot cohort closure could not be verified.");
}

export async function offboardPilotParticipantRecord(admin, staffId, input) {
  const { cohortId, userId } = normalizePilotEnrollmentInput({ ...input, roles: ["owner"] });
  const response = await admin.from("pilot_participants").update({
    offboarded_by: requiredUuid(staffId, "Staff ID"),
    offboarded_at: new Date().toISOString(),
    cleanup_note: String(input.cleanupNote || "").trim() || null,
  }).eq("cohort_id", cohortId).eq("user_id", userId).is("offboarded_at", null)
    .select("cohort_id, user_id, offboarded_at").maybeSingle();
  return assertResult(response.data, response.error, "Active pilot participant was not found or offboarding could not be verified.");
}

function isExplicitUserNotFound(error) {
  return error?.status === 404 || error?.code === "user_not_found"
    || /user.*not found/i.test(String(error?.message || ""));
}

export async function confirmPilotAccountDeletionRecord(admin, input) {
  const cohortId = requiredUuid(input.cohortId, "Cohort ID");
  const userId = requiredUuid(input.userId, "Tester user ID");
  const participantResponse = await admin.from("pilot_participants")
    .select("cohort_id, user_id, offboarded_at, account_deleted_at")
    .eq("cohort_id", cohortId).eq("user_id", userId).maybeSingle();
  const participant = assertResult(participantResponse.data, participantResponse.error, "Pilot participant was not found.");
  if (!participant.offboarded_at) throw new Error("Offboard the tester before confirming account deletion.");
  if (participant.account_deleted_at) throw new Error("Account deletion was already confirmed.");

  const authResponse = await admin.auth.admin.getUserById(userId);
  if (authResponse.data?.user?.id) throw new Error("The Supabase Auth account still exists; deletion cannot be confirmed.");
  if (!isExplicitUserNotFound(authResponse.error)) throw new Error("Auth deletion state could not be proven. Try again after Supabase is reachable.");

  const response = await admin.from("pilot_participants")
    .update({ account_deleted_at: new Date().toISOString() })
    .eq("cohort_id", cohortId).eq("user_id", userId).is("account_deleted_at", null)
    .select("cohort_id, user_id, account_deleted_at").single();
  return assertResult(response.data, response.error, "Account-deletion evidence could not be verified.");
}

