// Shared by offline API mocks, source scanners and map-network probes.
export function isUrlOnHost(value, expectedHost, { subdomains = false } = {}) {
  try {
    const host = new URL(String(value)).hostname;
    return host === expectedHost || (subdomains && host.endsWith(`.${expectedHost}`));
  } catch {
    return false;
  }
}

export function escapeRegExpLiteral(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
