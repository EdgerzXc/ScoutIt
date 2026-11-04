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
      if (q === syn || q.startsWith(syn + " ") || q.endsWith(" " + syn) || q.includes(" " + syn + " ")) {
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

  const lines = text
    .split(/\r?\n|;/)
    .map(l => l.trim())
    .filter(Boolean);

  const updates = [];
  let currentProperty = properties.length === 1 ? properties[0] : null;

  for (const line of lines) {
    // 1. Check if line represents a property header
    const matchedProp = properties.find(p => 
      p.title && line.toLowerCase().includes(p.title.toLowerCase())
    );
    if (matchedProp) {
      currentProperty = matchedProp;
      continue;
    }

    const prop = currentProperty || (properties.length === 1 ? properties[0] : null);

    // 2. Check for Unit number pattern: e.g. "1201", "Unit 1201", "3B", "PH-A"
    const unitMatch = line.match(/(?:unit\s+)?([0-9]{2,4}[A-Za-z]?|[A-Za-z]-[0-9]+)\b/i);
    const unitIdentifier = unitMatch ? unitMatch[1] : null;

    // Remove unit identifier from line to prevent unit number from colliding with price
    let remainingLine = line;
    if (unitIdentifier) {
      remainingLine = line.replace(new RegExp(`(?:unit\\s+)?${unitIdentifier}\\b`, 'i'), '').trim();
    }

    // 3. Check for Status change: available, vacant, occupied, reserved
    const statusMatch = remainingLine.match(/\b(available|vacant|bakante|occupied|reserved|taken|rented)\b/i);
    if (statusMatch) {
      const rawStatus = statusMatch[1].toLowerCase();
      const normalizedStatus = (rawStatus === "occupied" || rawStatus === "taken" || rawStatus === "rented") 
        ? "occupied" 
        : (rawStatus === "reserved" ? "pending" : "available");

      updates.push({
        id: "up_" + Math.random().toString(36).slice(2, 8),
        propertyId: prop?.id || null,
        propertyTitle: prop?.title || "All Properties",
        unitIdentifier,
        field: "status",
        fieldLabel: FIELD_LABELS.status,
        newValue: normalizedStatus,
        displayValue: normalizedStatus.toUpperCase(),
        confidence: 0.95,
        rawLine: line
      });
      continue;
    }

    // 4. Check for Price / Rent update: e.g. "rent 45k", "price: 45000", "45000 / mo"
    const priceMatch = remainingLine.match(/(?:rent|price|rate|arkila)?\s*[:=]?\s*(?:php|p|₱)?\s*([0-9.]+[\s]*(?:[kKmM]|,\d{3})*)\b/i);
    if (priceMatch) {
      const parsedNum = parseShorthandNumber(priceMatch[1]);
      if (parsedNum && parsedNum > 100) {
        updates.push({
          id: "up_" + Math.random().toString(36).slice(2, 8),
          propertyId: prop?.id || null,
          propertyTitle: prop?.title || (properties.length === 1 ? properties[0].title : "Select Property"),
          unitIdentifier,
          field: "price_php",
          fieldLabel: FIELD_LABELS.price_php,
          newValue: parsedNum,
          displayValue: formatPhp(parsedNum),
          confidence: 0.9,
          rawLine: line
        });
        continue;
      }
    }

    // 5. Check for Parking update: e.g. "parking 5000" or "parking: 2 slots"
    const parkingMatch = line.match(/(?:parking|park|slots?)\s*[:=]?\s*(?:php|p|₱)?\s*([0-9.]+[\s]*(?:[kKmM]|,\d{3})*)/i);
    if (parkingMatch) {
      const parsedVal = parseShorthandNumber(parkingMatch[1]);
      if (parsedVal != null) {
        updates.push({
          id: "up_" + Math.random().toString(36).slice(2, 8),
          propertyId: prop?.id || null,
          propertyTitle: prop?.title || (properties.length === 1 ? properties[0].title : "Select Property"),
          unitIdentifier: null, // Property-level parking
          field: "parking_slots",
          fieldLabel: FIELD_LABELS.parking_slots,
          newValue: parsedVal,
          displayValue: parsedVal > 50 ? formatPhp(parsedVal) : `${parsedVal} Slots`,
          confidence: 0.85,
          rawLine: line
        });
        continue;
      }
    }

    // 6. Check for Contact Phone update: e.g. "contact: 09171234567"
    const phoneMatch = line.match(/(?:contact|phone|mobile|viber)\s*[:=]?\s*(\+?[\d\s-]{7,15})/i);
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
        confidence: 0.9,
        rawLine: line
      });
    }
  }

  return updates;
}
