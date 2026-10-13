// ═══════════════════════════════════════════════════════════════════════════════
// LEAD IMPORT & DEDUPLICATION ENGINE (A-200 Super-User Depth §3.1)
//
// Compliant with RFC 4180 (CSV), RFC 6350 (vCard), and OWASP Formula Injection
// protections. Provides auto-mapping of heterogeneous columns and deduplication
// against both in-batch collisions and existing CRM records.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitizes any cell that might trigger Excel / Google Sheets formula injection.
 * When isPhone is true, legitimate international phone numbers (+63...) are preserved.
 */
function sanitizeFormulaInjection(value, isPhone = false) {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  // Legitimate international phone number (e.g. +63917..., +1-555...) is preserved only for phone fields
  if (isPhone && /^\+[\d\s\-().]+$/.test(s)) {
    return s;
  }
  if (/^[=+\-@\t\r]/.test(s)) {
    // Strip the dangerous prefix
    return s.replace(/^[=+\-@\t\r]+/, "").trim();
  }
  return s;
}

/**
 * Cleans phone strings for comparison (removes spaces, dashes, parens, leading plus).
 */
function normalizePhoneForComparison(phone) {
  if (!phone) return "";
  return String(phone).replace(/[^\d]/g, "");
}

/**
 * Robust RFC 4180 CSV parser handling quotes, escaped quotes, multiline cells, and CRLF/LF.
 */
export function parseCsvRows(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  // Strip UTF-8 BOM if present
  const text = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // End of quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
        i++;
        continue;
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Final cell and row if not ended in newline
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Maps raw header names to canonical schema properties.
 */
export function autoMapHeaders(headers = []) {
  const mapping = {};

  headers.forEach((header, index) => {
    const h = String(header).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!mapping.name && (/^(name|fullname|clientname|contactname|leadname|customer|buyer)$/.test(h) || h.includes("name"))) {
      mapping.name = index;
    } else if (!mapping.email && (/^(email|emailaddress|mail|contactemail)$/.test(h) || h.includes("email"))) {
      mapping.email = index;
    } else if (!mapping.phone && (/^(phone|mobile|tel|telephone|cell|contactnumber|cellphone)$/.test(h) || h.includes("phone") || h.includes("mobile"))) {
      mapping.phone = index;
    } else if (!mapping.propertyTitle && (/^(property|listing|propertytitle|unit|building|space|project)$/.test(h) || h.includes("property") || h.includes("listing"))) {
      mapping.propertyTitle = index;
    } else if (!mapping.budget && (/^(budget|price|amount|targetbudget|rent)$/.test(h) || h.includes("budget") || h.includes("price"))) {
      mapping.budget = index;
    } else if (!mapping.notes && (/^(notes|note|comments|comment|message|details|description|pitch)$/.test(h) || h.includes("note") || h.includes("comment"))) {
      mapping.notes = index;
    } else if (!mapping.status && (/^(status|stage|pipeline)$/.test(h))) {
      mapping.status = index;
    }
  });

  return mapping;
}

/**
 * Parses vCard 2.1 / 3.0 / 4.0 text blocks into structured lead records.
 */
export function parseVCardText(vcardText) {
  if (!vcardText || typeof vcardText !== "string") return [];
  const cards = [];
  const rawCards = vcardText.split(/BEGIN:VCARD/i).filter((s) => /END:VCARD/i.test(s));

  for (const raw of rawCards) {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let name = "";
    let email = "";
    let phone = "";
    let company = "";
    let notes = "";
    let propertyTitle = "";

    for (const line of lines) {
      if (/^FN/i.test(line)) {
        const val = line.substring(line.indexOf(":") + 1).trim();
        name = val.replace(/\\([,;\\])/g, "$1");
      } else if (!name && /^N/i.test(line)) {
        const parts = line.substring(line.indexOf(":") + 1).split(";").filter(Boolean);
        name = parts.reverse().join(" ").trim();
      } else if (/^EMAIL/i.test(line)) {
        const val = line.substring(line.indexOf(":") + 1).trim();
        if (!email) email = val;
      } else if (/^TEL/i.test(line)) {
        const val = line.substring(line.indexOf(":") + 1).trim();
        if (!phone) phone = val;
      } else if (/^ORG/i.test(line)) {
        company = line.substring(line.indexOf(":") + 1).replace(/\\([,;\\])/g, "$1").trim();
      } else if (/^NOTE/i.test(line)) {
        const noteVal = line.substring(line.indexOf(":") + 1).replace(/\\n/g, "\n").replace(/\\([,;\\])/g, "$1").trim();
        notes = noteVal;
        // Parse ScoutIt lead property hint if present
        const propMatch = noteVal.match(/ScoutIt lead\s*—\s*([^(\n]+)/i);
        if (propMatch) {
          propertyTitle = propMatch[1].trim();
        }
      }
    }

    if (name || email || phone) {
      cards.push({
        name: sanitizeFormulaInjection(name),
        email: email.trim().toLowerCase(),
        phone: sanitizeFormulaInjection(phone, true),
        company: sanitizeFormulaInjection(company),
        propertyTitle: sanitizeFormulaInjection(propertyTitle),
        notes: sanitizeFormulaInjection(notes),
        budget: "",
        status: "pending",
        source: "vcard_import",
      });
    }
  }

  return cards;
}

/**
 * Universal lead ingestion and deduplication processor.
 * Accepts raw string content (CSV or vCard) and an optional list of existing leads.
 */
export function detectAndParseLeads(rawContent, existingItems = []) {
  if (!rawContent || typeof rawContent !== "string" || !rawContent.trim()) {
    return { success: false, error: "The provided content is empty." };
  }

  const content = rawContent.trim();
  const isVCard = /BEGIN:VCARD/i.test(content);

  let rawLeads = [];

  if (isVCard) {
    rawLeads = parseVCardText(content);
    if (rawLeads.length === 0) {
      return { success: false, error: "No valid vCard contact records could be extracted." };
    }
  } else {
    // Parse as CSV
    const rows = parseCsvRows(content);
    if (rows.length === 0) {
      return { success: false, error: "No valid rows found in the CSV content." };
    }

    if (rows.length === 1) {
      return { success: false, error: "The CSV has a header but contains no data rows." };
    }

    const headers = rows[0];
    const mapping = autoMapHeaders(headers);

    // If no name, email, or phone matched, fallback to positional if columns <= 4
    if (mapping.name === undefined && mapping.email === undefined && mapping.phone === undefined) {
      mapping.name = 0;
      if (headers.length > 1) mapping.email = 1;
      if (headers.length > 2) mapping.phone = 2;
    }

    const dataRows = rows.slice(1);
    rawLeads = dataRows.map((row) => {
      const getVal = (idx, isPhone = false) => (idx !== undefined && row[idx] ? sanitizeFormulaInjection(row[idx], isPhone) : "");
      return {
        name: getVal(mapping.name),
        email: getVal(mapping.email).toLowerCase(),
        phone: getVal(mapping.phone, true),
        propertyTitle: getVal(mapping.propertyTitle),
        budget: getVal(mapping.budget),
        notes: getVal(mapping.notes),
        status: getVal(mapping.status) || "pending",
        source: "csv_import",
      };
    }).filter((r) => r.name || r.email || r.phone);

    if (rawLeads.length === 0) {
      return { success: false, error: "No records with at least a Name, Email, or Phone number were found." };
    }
  }

  // Deduplication check
  const existingEmails = new Set(
    existingItems
      .map((item) => (item.email || item.otherPartyEmail || item.contact?.email || "").toLowerCase().trim())
      .filter(Boolean)
  );

  const existingPhones = new Set(
    existingItems
      .map((item) => normalizePhoneForComparison(item.phone || item.contact?.phone || ""))
      .filter(Boolean)
  );

  const seenInBatchEmails = new Set();
  const seenInBatchPhones = new Set();

  let duplicateCount = 0;

  const processedRows = rawLeads.map((lead, idx) => {
    let isDuplicate = false;
    let duplicateReason = "";

    const normalizedEmail = lead.email ? lead.email.trim().toLowerCase() : "";
    const normalizedPhone = lead.phone ? normalizePhoneForComparison(lead.phone) : "";

    if (normalizedEmail) {
      if (existingEmails.has(normalizedEmail)) {
        isDuplicate = true;
        duplicateReason = `Email already exists in pipeline (${normalizedEmail})`;
      } else if (seenInBatchEmails.has(normalizedEmail)) {
        isDuplicate = true;
        duplicateReason = `Duplicate email within imported file (${normalizedEmail})`;
      }
      seenInBatchEmails.add(normalizedEmail);
    }

    if (!isDuplicate && normalizedPhone) {
      if (existingPhones.has(normalizedPhone)) {
        isDuplicate = true;
        duplicateReason = `Phone number already exists in pipeline (${lead.phone})`;
      } else if (seenInBatchPhones.has(normalizedPhone)) {
        isDuplicate = true;
        duplicateReason = `Duplicate phone number within imported file (${lead.phone})`;
      }
      seenInBatchPhones.add(normalizedPhone);
    }

    if (isDuplicate) {
      duplicateCount++;
    }

    return {
      ...lead,
      id: `imported-${Date.now()}-${idx}`,
      isDuplicate,
      duplicateReason,
    };
  });

  return {
    success: true,
    format: isVCard ? "vcard" : "csv",
    rows: processedRows,
    previewRows: processedRows.slice(0, 3),
    totalCount: processedRows.length,
    duplicateCount,
  };
}
