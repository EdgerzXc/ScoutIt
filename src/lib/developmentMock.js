const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PUBLIC_E2E_FLAG = process.env.NEXT_PUBLIC_SCOUTIT_E2E;
export const DEVELOPMENT_MOCK_STORAGE_KEY = "scoutit_dev_user";

export function isDevelopmentMockId(userId) {
  return typeof userId === "string" && /^master-dev(?:$|[-_])/.test(userId.trim());
}

export function isDevelopmentMockAllowed({
  e2eFlag = PUBLIC_E2E_FLAG || process.env.SCOUTIT_E2E,
  hostname = "",
  userId = "",
} = {}) {
  const localHost = LOCAL_DEVELOPMENT_HOSTS.has(String(hostname).toLowerCase());
  const explicitE2EFixture = e2eFlag === "1";
  return localHost && explicitE2EFixture && isDevelopmentMockId(userId);
}

export function readDevelopmentMockUser(storage, runtime = {}) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(DEVELOPMENT_MOCK_STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return isDevelopmentMockAllowed({ ...runtime, userId: user?.id }) ? user : null;
  } catch {
    return null;
  }
}
