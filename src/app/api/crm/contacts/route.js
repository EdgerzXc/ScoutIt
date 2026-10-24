import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { contactRowFromInput, mergeContactFields, planContactMerge } from "@/lib/crmContactMerge";

export const dynamic = "force-dynamic";

const VALID_CONTACT_TYPES = Object.freeze([
  "prospective_tenant",
  "buyer",
  "broker_partner",
  "event_organizer",
  "investor",
  "other",
]);

const VALID_SOURCES = Object.freeze([
  "scoutit_inquiry",
  "csv_import",
  "manual_entry",
  "referral",
  "open_gate",
]);

const CONTACT_COLUMNS =
  "id, owner_user_id, full_name, email, phone, company_name, contact_type, source, requirements, created_at, updated_at";

// The merge reads the account's contacts to decide create-vs-update. Bounded
// so a pathological account cannot turn one import into an unbounded read.
const MAX_OWNER_CONTACTS = 5000;

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server error: missing service role configuration" },
        { status: 500 }
      );
    }

    const { data: contacts, error } = await supabaseAdmin
      .from("crm_contacts")
      .select(CONTACT_COLUMNS)
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[CRM CONTACTS API] GET error:", error);
      return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
    }

    return NextResponse.json({ contacts: contacts || [] });
  } catch (err) {
    console.error("[CRM CONTACTS API] GET unexpected error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server error: missing service role configuration" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const rawItems = Array.isArray(body?.contacts) ? body.contacts : [body];

    if (rawItems.length === 0 || !rawItems[0]) {
      return NextResponse.json({ error: "No contacts supplied" }, { status: 400 });
    }

    // Maximum 200 contacts per batch import
    if (rawItems.length > 200) {
      return NextResponse.json(
        { error: "Batch size limit exceeded. Maximum 200 contacts per import." },
        { status: 400 }
      );
    }

    const rowsToInsert = rawItems
      .filter((item) => item && (item.fullName || item.name || item.email || item.phone))
      .map((item) => {
        const rawType = String(item.contactType || item.contact_type || item.role || "prospective_tenant").toLowerCase();
        const contactType = VALID_CONTACT_TYPES.includes(rawType) ? rawType : "prospective_tenant";

        const rawSource = String(item.source || "csv_import").toLowerCase();
        const source = VALID_SOURCES.includes(rawSource) ? rawSource : "csv_import";

        return contactRowFromInput(
          {
            ...item,
            contactType,
            source,
            requirements:
              item.requirements && typeof item.requirements === "object"
                ? item.requirements
                : {
                    budget: item.budget ? Number(item.budget) || null : null,
                    propertyTitle: item.propertyTitle || null,
                    notes: item.notes || item.lastMessage || null,
                  },
          },
          userId
        );
      });

    if (rowsToInsert.length === 0) {
      return NextResponse.json({ error: "No valid contact rows to insert" }, { status: 400 });
    }

    // GAP-105: an `onConflict: "owner_user_id,email"` upsert cannot match the
    // table's partial expression index (owner_user_id, lower(email)) WHERE
    // email IS NOT NULL — PostgreSQL rejected every batch with 42P10 and the
    // import was lost. The merge is decided here instead: read the account's
    // contacts, plan create/update per row, then write each row.
    const { data: existingContacts, error: existingError } = await supabaseAdmin
      .from("crm_contacts")
      .select(CONTACT_COLUMNS)
      .eq("owner_user_id", userId)
      .limit(MAX_OWNER_CONTACTS);

    if (existingError) {
      console.error("[CRM CONTACTS API] POST existing read error:", existingError);
      return NextResponse.json({ error: sanitizeError(existingError) }, { status: 500 });
    }

    const plan = planContactMerge(existingContacts || [], rowsToInsert);

    const created = [];
    const updated = [];
    const failed = [];
    let skipped = 0;

    for (const step of plan) {
      if (step.action === "skip") {
        skipped += 1;
        continue;
      }

      if (step.action === "update") {
        const { data: updatedRow, error: updateError } = await supabaseAdmin
          .from("crm_contacts")
          .update(step.merged)
          .eq("id", step.existing.id)
          .eq("owner_user_id", userId)
          .select(CONTACT_COLUMNS)
          .maybeSingle();

        if (updateError || !updatedRow) {
          console.error("[CRM CONTACTS API] POST update error:", updateError);
          failed.push({ email: step.row.email || null, reason: "update_failed" });
          continue;
        }
        updated.push(updatedRow);
        continue;
      }

      const { data: insertedRow, error: insertError } = await supabaseAdmin
        .from("crm_contacts")
        .insert(step.merged)
        .select(CONTACT_COLUMNS)
        .maybeSingle();

      if (!insertError && insertedRow) {
        created.push(insertedRow);
        continue;
      }

      // A concurrent import may have taken the same email between the read
      // above and this write. The unique index is the truth: re-read the
      // winning row and merge onto it rather than failing the batch.
      if (insertError?.code === "23505" && step.merged.email) {
        const { data: winner } = await supabaseAdmin
          .from("crm_contacts")
          .select(CONTACT_COLUMNS)
          .eq("owner_user_id", userId)
          .eq("email", step.merged.email)
          .maybeSingle();

        if (winner) {
          const { data: mergedRow, error: mergeError } = await supabaseAdmin
            .from("crm_contacts")
            .update(mergeContactFields(winner, step.merged))
            .eq("id", winner.id)
            .eq("owner_user_id", userId)
            .select(CONTACT_COLUMNS)
            .maybeSingle();

          if (!mergeError && mergedRow) {
            updated.push(mergedRow);
            continue;
          }
        }
      }

      console.error("[CRM CONTACTS API] POST insert error:", insertError);
      failed.push({ email: step.row.email || null, reason: "insert_failed" });
    }

    const saved = created.length + updated.length;
    const contacts = [...created, ...updated];

    if (saved === 0 && failed.length > 0) {
      // Nothing was written. Saying "saved" here would be the lie this route
      // used to tell.
      return NextResponse.json(
        { error: "No leads were saved. Nothing changed in your CRM.", failed },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: saved,
      created: created.length,
      updated: updated.length,
      skipped,
      failed,
      contacts,
    });
  } catch (err) {
    console.error("[CRM CONTACTS API] POST unexpected error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
