export const SATISFACTION_LEVELS = Object.freeze(["angry", "sad", "smile", "happy"]);
export const MIN_SATISFACTION_SAMPLE = 5;

const LEVEL_SET = new Set(SATISFACTION_LEVELS);

export function isSatisfactionLevel(value) {
  return typeof value === "string" && LEVEL_SET.has(value);
}

function isCountableResponse(row) {
  return Boolean(
    row
      && row.moderation_state === "approved"
      && row.consent_granted === true
      && !row.withdrawn_at
      && !row.disputed_at
      && row.qualifying_handshake_id
      && isSatisfactionLevel(row.satisfaction_level),
  );
}

export function buildSatisfactionSignal(rows = []) {
  const distribution = { angry: 0, sad: 0, smile: 0, happy: 0 };

  for (const row of Array.isArray(rows) ? rows : []) {
    if (isCountableResponse(row)) distribution[row.satisfaction_level] += 1;
  }

  const positiveCount = distribution.smile + distribution.happy;
  const total = SATISFACTION_LEVELS.reduce((sum, level) => sum + distribution[level], 0);

  return {
    state: total >= MIN_SATISFACTION_SAMPLE ? "published" : "building",
    total,
    positiveCount,
    positiveShare: total >= MIN_SATISFACTION_SAMPLE
      ? Math.round((positiveCount / total) * 100)
      : null,
    distribution,
  };
}
