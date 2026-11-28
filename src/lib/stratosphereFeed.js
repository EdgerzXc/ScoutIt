export const SIGNALS_PATH = "/stratosphere/signals";

const FILTER_KEYS = ["role", "stage", "place", "signalQ", "signalType", "spaceType", "color", "signal"];

export function stratosphereFeedHref(params, destination = "signals") {
  const filters = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params?.get(key);
    if (value) filters.set(key, value);
  }
  if (destination === "community") filters.set("source", "community");
  if (destination === "map") filters.set("mode", "map");
  const pathname = destination === "map" ? "/stratosphere" : SIGNALS_PATH;
  return filters.size ? `${pathname}?${filters}` : pathname;
}
