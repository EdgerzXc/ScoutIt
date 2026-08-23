import { PROFESSIONAL_CATEGORIES } from "./professionalDirectory";

const SOURCES = new Set(["airtable", "supabase"]);

export function validateSavedProfessional(input) {
  const professionalKey = typeof input?.professionalKey === "string" ? input.professionalKey.trim() : "";
  const category = typeof input?.category === "string" ? input.category.trim() : "";
  const source = typeof input?.source === "string" ? input.source.trim() : "";
  if (!professionalKey || professionalKey.length > 240) return { error: "Invalid professional key" };
  if (!PROFESSIONAL_CATEGORIES[category]) return { error: "Invalid professional category" };
  if (!SOURCES.has(source) || PROFESSIONAL_CATEGORIES[category].source !== source) return { error: "Invalid professional source" };
  return { value: { professionalKey, category, source } };
}
