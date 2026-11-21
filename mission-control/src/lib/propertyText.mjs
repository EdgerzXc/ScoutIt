export function stripPropertyTags(value) {
  let text = "";
  let inTag = false;
  let quote = null;
  for (const character of value) {
    if (!inTag) {
      if (character === "<") {
        inTag = true;
        text += " ";
      } else if (character !== ">") {
        text += character;
      }
    } else if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      inTag = false;
    }
  }
  return text.replace(/\s+/g, " ").trim();
}

export function sanitizePropertyDetails(value) {
  if (typeof value === "string") return stripPropertyTags(value);
  if (Array.isArray(value)) return value.map(sanitizePropertyDetails);
  if (value && typeof value === "object") {
    const detail = {};
    for (const [key, item] of Object.entries(value)) {
      const name = stripPropertyTags(key);
      if (name && !["__proto__", "prototype", "constructor"].includes(name)) {
        detail[name] = sanitizePropertyDetails(item);
      }
    }
    return detail;
  }
  return value;
}
