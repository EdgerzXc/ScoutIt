/**
 * Property Update Parser & Synonym Resolver
 * 
 * Provides deterministic shorthand number formatting (45k -> 45,000),
 * synonym resolution for Philippine and international real estate terms,
 * and heuristic extraction for natural-language/pasted inventory notes.
 */

export const SYNONYM_MAP = {
  price_php: ["rent", "price", "rate", "monthly", "arkila", "magkano", "rent/mo", "lease", "fee"],
  status: ["status", "availability", "available", "vacant", "occupied", "bakante", "reserved", "empty", "taken"],
  parking_slots: ["parking", "park", "slots", "slot", "car", "garage", "parkingan"],
  contact_number: ["contact", "phone", "number", "cell", "mobile", "call", "viber", "tel"],
  sqm: ["sqm", "size", "floor area", "area", "dimension", "sukat", "sqm area"]
};

export const FIELD_LABELS = {
  price_php: "Monthly Rent / Price",
  status: "Availability Status",
  parking_slots: "Parking Slots / Fee",
  contact_number: "Contact Number",
  sqm: "Floor Area (sqm)"
};

/**
 * Parses shorthand currency/number expressions into standard numbers:
 * '45k' -> 45000
 * '1.5m' -> 1500000
 * '₱45,000' -> 45000
 * '45000' -> 45000
 */
export function parseShorthandNumber(input) {
  if (typeof input === "number") return input;
  if (!input || typeof input !== "string") return null;

  const cleaned = input.trim().replace(/^[₱pP(Php)(PHP)\s$]+/, "").replace(/,/g, "");
  
  // Check for 'k' / 'K' (thousands)
  const kMatch = cleaned.match(/^([0-9.]+)\s*[kK]$/);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    return isNaN(val) ? null : Math.round(val * 1000);
  }

  // Check for 'm' / 'M' (millions)
  const mMatch = cleaned.match(/^([0-9.]+)\s*[mM]$/);
  if (mMatch) {
    const val = parseFloat(mMatch[1]);
    return isNaN(val) ? null : Math.round(val * 1000000);
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Format a number as Philippine Peso representation
 */
export function formatPhp(amount) {
  if (amount == null || isNaN(amount)) return "₱0";
  return "₱" + Number(amount).toLocaleString("en-PH");
}

/**
 * Identifies if a query string matches a known field synonym.
 */
export function matchFieldFromQuery(query) {
  if (!query || typeof query !== "string") return null;
  const q = query.trim().toLowerCase();

  for (const [field, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const syn of synonyms) {
      const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|[\\s,;:])${escaped}(?:[\\s,;:=]|$)`, "i").test(q)) {
        return field;
      }
    }
  }
  return null;
}

/**
 * Deterministically parses natural-language text or pasted rows into structured updates.
 * 
 * @param {string} text - The raw pasted text or command sentence
 * @param {Array} properties - The list of properties the owner manages
 * @returns {Array} List of proposed updates
 */
export function parseHeuristicUpdates(text, properties = []) {
  if (!text || typeof text !== "string") return [];

  const rawLines = text
    .split(/\r?\n|;/)
    .map(l => l.trim())
    .filter(Boolean);

  const updates = [];
  let currentProperty = properties.length === 1 ? properties[0] : null;

  for (const rawLine of rawLines) {
    // 1. Check if line represents a property header
    const matchedProp = properties.find(p => 
      p.title && rawLine.toLowerCase().includes(p.title.toLowerCase())
    );
    if (matchedProp) {
      currentProperty = matchedProp;
      continue;
    }

    const prop = currentProperty || (properties.length === 1 ? properties[0] : null);

    // 2. Extract line-level unit identifier if explicitly labeled or line starts with unit
    // Disallow unit if number is immediately followed by sqm, parking, php/k/m, or phone digits
    let lineUnit = null;
    const explicitUnit = rawLine.match(/\b(?:unit|room|suite|flr|floor|#)\s*([0-9]{1,4}[A-Za-z]?|[A-Za-z]-[0-9]+)\b/i);
    if (explicitUnit) {
      lineUnit = explicitUnit[1];
    } else {
      // Only match at start of line if NOT followed by sqm, slots, phone, or price indicators
      const startUnit = rawLine.match(/^([0-9]{2,4}[A-Za-z]?|[A-Za-z]-[0-9]+)(?!\s*(?:sqm|sq\.?m|m2|slots?|cars?|k\b|m\b|\d{5,}))\b[:\s-]*/i);
      if (startUnit) {
        lineUnit = startUnit[1];
      }
    }

    // Split line into clauses if comma-separated (e.g. "rent: 45k, 120 sqm, parking 5000, call 09171234567")
    const clauses = rawLine.split(/(?<!\d),(?!\d{3}\b)\s*|\s*,\s*(?=[a-zA-Z]|\d+\s*sqm)/i).map(s => s.trim()).filter(Boolean);

    for (const clause of clauses) {
      // Check for clause-local unit if not established at line level
      let clauseUnit = lineUnit;
      if (!clauseUnit) {
        const clauseExpUnit = clause.match(/\b(?:unit|room|suite|#)\s*([0-9]{1,4}[A-Za-z]?|[A-Za-z]-[0-9]+)\b/i);
        if (clauseExpUnit) {
          clauseUnit = clauseExpUnit[1];
        }
      }

      // Remove unit from clause so unit numbers don't collide with values
      let workingClause = clause;
      if (clauseUnit) {
        workingClause = clause.replace(new RegExp(`(?:(?:unit|room|suite|#)\\s*)?${clauseUnit}\\b[:\\s-]*`, 'i'), '').trim();
      }

      // (A) Check Phone / Contact FIRST (prevents phone numbers becoming multi-billion rent)
      const phoneMatch = workingClause.match(/(?:contact|phone|mobile|cell|viber|call|tel)\s*[:=]?\s*(\+?[\d\s-]{7,15})\b/i) ||
                         workingClause.match(/\b(09\d{9}|\+63\d{10})\b/);
      if (phoneMatch) {
        const phone = phoneMatch[1].trim();
        updates.push({
          id: "up_" + Math.random().toString(36).slice(2, 8),
          propertyId: prop?.id || null,
          propertyTitle: prop?.title || (properties.length === 1 ? properties[0].title : "Select Property"),
          unitIdentifier: null,
          field: "contact_number",
          fieldLabel: FIELD_LABELS.contact_number,
          newValue: phone,
          displayValue: phone,
          confidence: 0.95,
          rawLine: rawLine
        });
        continue;
      }

      // (B) Check Parking Slots / Fee SECOND (prevents parking fees becoming unit rent)
      const parkingMatch = workingClause.match(/(?:parking|park|parkingan|garage)\s*[:=]?\s*(?:php|p|₱)?\s*([0-9.]+[\s]*(?:[kKmM]|,\d{3})*)\s*(?:slots?|cars?|fee)?\b/i) ||
                           workingClause.match(/\b([0-9]+)\s*(?:parking\s*)?slots?\b/i);
      if (parkingMatch) {
        const parsedVal = parseShorthandNumber(parkingMatch[1]);
        if (parsedVal != null) {
          updates.push({
            id: "up_" + Math.random().toString(36).slice(2, 8),
            propertyId: prop?.id || null,
            propertyTitle: prop?.title || (properties.length === 1 ? properties[0].title : "Select Property"),
            unitIdentifier: null,
            field: "parking_slots",
            fieldLabel: FIELD_LABELS.parking_slots,
            newValue: parsedVal,
            displayValue: parsedVal > 50 ? formatPhp(parsedVal) : `${parsedVal} Slots`,
            confidence: 0.9,
            rawLine: rawLine
          });
          continue;
        }
      }

      // (C) Check Sqm / Floor Area THIRD (adds missing floor area branch)
      const sqmMatch = workingClause.match(/(?:(?:size|floor\s*area|area|dimension|sukat)\s*[:=]?\s*)?([0-9.]+)\s*(?:sqm|sq\.?m|m2|sq\s*meters?)\b/i) ||
                       workingClause.match(/(?:size|floor\s*area|area|dimension|sukat)\s*[:=]?\s*([0-9.]+)\b/i);
      if (sqmMatch) {
        const sqmVal = parseFloat(sqmMatch[1]);
        if (!isNaN(sqmVal) && sqmVal > 0) {
          updates.push({
            id: "up_" + Math.random().toString(36).slice(2, 8),
            propertyId: prop?.id || null,
            propertyTitle: prop?.title || (properties.length === 1 ? properties[0].title : "Select Property"),
            unitIdentifier: clauseUnit,
            field: "sqm",
            fieldLabel: FIELD_LABELS.sqm,
            newValue: sqmVal,
            displayValue: `${sqmVal} sqm`,
            confidence: 0.9,
            rawLine: rawLine
          });
          continue;
        }
      }

      // (D) Check Status FOURTH
      const statusMatch = workingClause.match(/\b(available|vacant|bakante|occupied|reserved|taken|rented|empty)\b/i);
      if (statusMatch) {
        const rawStatus = statusMatch[1].toLowerCase();
        const normalizedStatus = (rawStatus === "occupied" || rawStatus === "taken" || rawStatus === "rented") 
          ? "occupied" 
          : (rawStatus === "reserved" ? "pending" : "available");

        updates.push({
          id: "up_" + Math.random().toString(36).slice(2, 8),
          propertyId: prop?.id || null,
          propertyTitle: prop?.title || "All Properties",
          unitIdentifier: clauseUnit,
          field: "status",
          fieldLabel: FIELD_LABELS.status,
          newValue: normalizedStatus,
          displayValue: normalizedStatus.toUpperCase(),
          confidence: 0.95,
          rawLine: rawLine
        });
        continue;
      }

      // (E) Check Price / Rent FIFTH (catch-all for price/rent)
      const priceMatch = workingClause.match(/(?:rent|price|rate|monthly|arkila|magkano|lease|fee)?\s*[:=]?\s*(?:php|p|₱)?\s*([0-9.]+[\s]*(?:[kKmM]|,\d{3})*)\b/i);
      if (priceMatch) {
        const parsedNum = parseShorthandNumber(priceMatch[1]);
        if (parsedNum && parsedNum > 100) {
          updates.push({
            id: "up_" + Math.random().toString(36).slice(2, 8),
            propertyId: prop?.id || null,
            propertyTitle: prop?.title || (properties.length === 1 ? properties[0].title : "Select Property"),
            unitIdentifier: clauseUnit,
            field: "price_php",
            fieldLabel: FIELD_LABELS.price_php,
            newValue: parsedNum,
            displayValue: formatPhp(parsedNum),
            confidence: 0.9,
            rawLine: rawLine
          });
          continue;
        }
      }
    }
  }

  return updates;
}
