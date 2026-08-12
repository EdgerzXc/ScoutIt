const PLACEHOLDER_NAME = /^(?:test[-_\s]*)?(?:unit|space|room|area|zone)[-_\s#]*[a-z0-9]+$/i;
const LONG_NUMBER = /^\d{7,}$/;

function hasValue(value) {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === "object") return Object.values(value).some(hasValue);
  return true;
}

export function classifySampleChildSpace(unit) {
  const name = String(unit?.name || "").trim();
  const substantive = [unit?.size, unit?.price, unit?.photo, unit?.image, unit?.photos,
    unit?.features, unit?.details, unit?.subdivision_scenarios].some(hasValue);
  if (!name && !substantive) return { invalid: true, reason: "empty_child" };
  if (PLACEHOLDER_NAME.test(name) || LONG_NUMBER.test(name)) return { invalid: true, reason: "placeholder_name" };
  return { invalid: false, reason: "retained" };
}

export function cleanSampleChildSpaces(units) {
  const source = Array.isArray(units) ? units : [];
  const retained = [];
  const removed = [];
  source.forEach((unit, index) => {
    const classification = classifySampleChildSpace(unit);
    const entry = { unit, index, reason: classification.reason };
    if (classification.invalid) removed.push(entry); else retained.push(entry);
  });
  return { retained: retained.map((entry) => entry.unit), removed };
}

