import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog } from "@/lib/auditTrail";
import { sanitizeError } from "@/lib/sanitizeError";

const VALID_ROLES = Object.freeze([
  "owner",
  "salesperson",
  "operator",
  "photographer",
  "designer",
  "broker",
]);

function sanitizeString(val, maxLen = 160) {
  if (typeof val !== "string") return "";
  return val.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server database client unavailable." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : "";
    const data = body.data || {};

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(", ")}` },
        { status: 400 },
      );
    }

    const roleUpdates = {};
    const auditMetadata = { role };

    if (role === "owner") {
      const entityType = ["corporate", "individual"].includes(data.ownerEntityType)
        ? data.ownerEntityType
        : "individual";
      const nextOfKinName = sanitizeString(data.nextOfKinName);
      const nextOfKinRelationship = sanitizeString(data.nextOfKinRelationship);
      const nextOfKinPhone = sanitizeString(data.nextOfKinPhone);

      if (!nextOfKinName || nextOfKinName.length < 2) {
        return NextResponse.json(
          { error: "Next of Kin / Co-Manager full name is required for asset continuity." },
          { status: 400 },
        );
      }
      if (!nextOfKinRelationship || nextOfKinRelationship.length < 2) {
        return NextResponse.json(
          { error: "Relationship to owner / asset is required (e.g. Co-Owner, Spouse, Managing Partner)." },
          { status: 400 },
        );
      }
      if (!nextOfKinPhone || nextOfKinPhone.replace(/\D/g, "").length < 7) {
        return NextResponse.json(
          { error: "A valid emergency contact phone or WhatsApp number is required." },
          { status: 400 },
        );
      }

      roleUpdates.owner_entity_type = entityType;
      roleUpdates.next_of_kin_name = nextOfKinName;
      roleUpdates.next_of_kin_relationship = nextOfKinRelationship;
      roleUpdates.next_of_kin_phone = nextOfKinPhone;
      auditMetadata.ownerEntityType = entityType;
      auditMetadata.nextOfKinName = nextOfKinName;
      auditMetadata.nextOfKinRelationship = nextOfKinRelationship;
      auditMetadata.nextOfKinPhone = nextOfKinPhone;
    } else if (role === "salesperson") {
      const supervisingBrokerName = sanitizeString(data.supervisingBrokerName);
      const supervisingBrokerPrc = sanitizeString(data.supervisingBrokerPrc);
      const salespersonAccreditation = sanitizeString(data.salespersonAccreditation);

      if (!supervisingBrokerName || supervisingBrokerName.length < 2) {
        return NextResponse.json(
          { error: "Supervising Broker Name or Brokerage Firm is required under R.A. 9646." },
          { status: 400 },
        );
      }
      if (!supervisingBrokerPrc || supervisingBrokerPrc.replace(/\D/g, "").length < 5) {
        return NextResponse.json(
          { error: "Valid PRC License # of your Supervising Broker is required." },
          { status: 400 },
        );
      }
      if (!salespersonAccreditation || salespersonAccreditation.length < 3) {
        return NextResponse.json(
          { error: "PRC / DTI Salesperson Accreditation number is required." },
          { status: 400 },
        );
      }

      roleUpdates.supervising_broker_name = supervisingBrokerName;
      roleUpdates.supervising_broker_prc = supervisingBrokerPrc;
      roleUpdates.salesperson_accreditation = salespersonAccreditation;
      auditMetadata.supervisingBrokerName = supervisingBrokerName;
      auditMetadata.supervisingBrokerPrc = supervisingBrokerPrc;
      auditMetadata.salespersonAccreditation = salespersonAccreditation;
    } else if (role === "operator") {
      const operatingEntity = sanitizeString(data.operatingEntity);
      const managedComplex = sanitizeString(data.managedComplex);
      const escalationPhone = sanitizeString(data.escalationPhone);

      if (!operatingEntity || operatingEntity.length < 2) {
        return NextResponse.json(
          { error: "Operating entity or management company name is required." },
          { status: 400 },
        );
      }
      if (!managedComplex || managedComplex.length < 2) {
        return NextResponse.json(
          { error: "Primary managed building or complex name is required." },
          { status: 400 },
        );
      }
      if (!escalationPhone || escalationPhone.replace(/\D/g, "").length < 7) {
        return NextResponse.json(
          { error: "Operations desk or escalation contact phone is required." },
          { status: 400 },
        );
      }

      roleUpdates.operating_entity = operatingEntity;
      roleUpdates.managed_complex = managedComplex;
      roleUpdates.escalation_phone = escalationPhone;
      auditMetadata.operatingEntity = operatingEntity;
      auditMetadata.managedComplex = managedComplex;
      auditMetadata.escalationPhone = escalationPhone;
    } else if (role === "photographer") {
      const gearDescription = sanitizeString(data.gearDescription);
      const portfolioUrl = sanitizeString(data.portfolioUrl, 255);
      const locationCoverage = sanitizeString(data.locationCoverage);

      if (!gearDescription || gearDescription.length < 3) {
        return NextResponse.json(
          { error: "Please list your primary camera / drone / staging gear." },
          { status: 400 },
        );
      }
      if (!portfolioUrl || portfolioUrl.length < 3) {
        return NextResponse.json(
          { error: "Portfolio URL, Instagram handle, or website link is required." },
          { status: 400 },
        );
      }

      roleUpdates.gear_description = gearDescription;
      roleUpdates.portfolio_url = portfolioUrl;
      roleUpdates.location_coverage = locationCoverage || null;
      roleUpdates.provider_type = "photographer";
      auditMetadata.gearDescription = gearDescription;
      auditMetadata.portfolioUrl = portfolioUrl;
      auditMetadata.locationCoverage = locationCoverage;
    } else if (role === "designer") {
      const designSpecialty = sanitizeString(data.designSpecialty);
      const lookbookUrl = sanitizeString(data.lookbookUrl, 255);
      const studioName = sanitizeString(data.studioName);

      if (!designSpecialty || designSpecialty.length < 2) {
        return NextResponse.json(
          { error: "Specialty (e.g. Spatial Staging, Commercial Pop-ups, Luxury Events) is required." },
          { status: 400 },
        );
      }
      if (!lookbookUrl || lookbookUrl.length < 3) {
        return NextResponse.json(
          { error: "Lookbook or portfolio URL is required." },
          { status: 400 },
        );
      }

      roleUpdates.design_specialty = designSpecialty;
      roleUpdates.lookbook_url = lookbookUrl;
      roleUpdates.studio_name = studioName || null;
      roleUpdates.provider_type = "designer";
      auditMetadata.designSpecialty = designSpecialty;
      auditMetadata.lookbookUrl = lookbookUrl;
      auditMetadata.studioName = studioName;
    } else if (role === "broker") {
      const rawLicense = sanitizeString(data.prcLicense);
      const digits = rawLicense.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 8) {
        return NextResponse.json(
          { error: "Brokers must provide a valid 7- or 8-digit PRC license number." },
          { status: 400 },
        );
      }
      roleUpdates.prc_license = digits;
      roleUpdates.prc_verified = false;
      roleUpdates.prc_verified_at = null;
      auditMetadata.prcLicense = digits;
      auditMetadata.prcVerified = false;
    }

    // Retrieve existing profile to preserve held roles and ensure buyer is always included
    const { data: existingProfile, error: fetchErr } = await supabaseAdmin
      .from("user_profiles")
      .select("id, active_roles, role, primary_mode, adult_eligibility_status, archived_at, is_shadowbanned")
      .eq("id", userId)
      .maybeSingle();

    if (fetchErr) {
      console.error("[ACTIVATE_ROLE] Profile fetch failed:", fetchErr);
      return NextResponse.json({ error: "Failed to verify current profile." }, { status: 500 });
    }

    if (existingProfile?.archived_at || existingProfile?.is_shadowbanned === true) {
      return NextResponse.json(
        { error: "Forbidden: Account is restricted from activating roles." },
        { status: 403 },
      );
    }

    if (existingProfile?.adult_eligibility_status === "underage") {
      return NextResponse.json(
        { error: "Forbidden: 18+ adult legal capacity is required to activate platform roles." },
        { status: 403 },
      );
    }

    const existingRoles = Array.isArray(existingProfile?.active_roles)
      ? existingProfile.active_roles
      : [];

    // Invariant: buyer / seeker is always active and preserved for every account
    const extraRoles = role === "photographer" || role === "designer" ? [role, "provider"] : [role];
    const consolidatedActiveRoles = Array.from(new Set([...existingRoles, ...extraRoles, "buyer"]));

    const fullPayload = {
      ...roleUpdates,
      active_roles: consolidatedActiveRoles,
      updated_at: new Date().toISOString(),
    };

    let { error: updateErr } = await supabaseAdmin
      .from("user_profiles")
      .update(fullPayload)
      .eq("id", userId);

    if (updateErr) {
      // Graceful fallback if specific new schema column has not yet been migrated in production
      console.warn("[ACTIVATE_ROLE] Full update had schema notice, falling back to core fields:", updateErr.message);
      const corePayload = {
        active_roles: consolidatedActiveRoles,
        updated_at: new Date().toISOString(),
      };
      if (roleUpdates.provider_type) corePayload.provider_type = roleUpdates.provider_type;
      if (roleUpdates.prc_license) {
        corePayload.prc_license = roleUpdates.prc_license;
        corePayload.prc_verified = false;
        corePayload.prc_verified_at = null;
      }

      const { error: coreErr } = await supabaseAdmin
        .from("user_profiles")
        .update(corePayload)
        .eq("id", userId);

      if (coreErr) {
        console.error("[ACTIVATE_ROLE] Core profile update failed:", coreErr);
        return NextResponse.json({ error: "Failed to update profile roles." }, { status: 500 });
      }
    }

    await writeAuditLog(supabaseAdmin, {
      action: "ROLE_ACTIVATED",
      tableName: "user_profiles",
      recordId: userId,
      userId,
      metadata: auditMetadata,
    });

    return NextResponse.json({
      success: true,
      role,
      activeRoles: consolidatedActiveRoles,
      message: `${role} workspace successfully activated.`,
    });
  } catch (err) {
    console.error("[ACTIVATE_ROLE] Unhandled error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to activate role.") },
      { status: 500 },
    );
  }
}
