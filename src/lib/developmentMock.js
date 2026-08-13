const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PUBLIC_E2E_FLAG = process.env.NEXT_PUBLIC_SCOUTIT_E2E;

export function isDevelopmentMockId(userId) {
  return typeof userId === "string" && /^master-dev(?:$|[-_])/.test(userId.trim());
}

export function isDevelopmentMockAllowed({
  nodeEnv = process.env.NODE_ENV,
  e2eFlag = PUBLIC_E2E_FLAG || process.env.SCOUTIT_E2E,
  hostname = "",
  userId = "",
} = {}) {
  const localHost = LOCAL_DEVELOPMENT_HOSTS.has(String(hostname).toLowerCase());
  const nonProductionRuntime = nodeEnv === "development" || e2eFlag === "1";
  return localHost && nonProductionRuntime && isDevelopmentMockId(userId);
}

export function readDevelopmentMockUser(storage, runtime = {}) {
  if (!storage) return null;

  try {
    const raw = storage.getItem("scoutit_user");
    const user = raw ? JSON.parse(raw) : null;
    return isDevelopmentMockAllowed({ ...runtime, userId: user?.id }) ? user : null;
  } catch {
    return null;
  }
}
