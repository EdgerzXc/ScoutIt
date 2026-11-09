export const BADGE_DEFINITIONS = {
  PIONEER_BROKER: {
    id: "PIONEER_BROKER",
    name: "Pioneer Advisor",
    description: "One of the first 25 verified luxury brokers on ScoutIt. Holds a permanent, transferable Founding Charter seat.",
    max_slots: 25,
    claimed: 14,
    status: "ACTIVE",
    color: "var(--intel-blue, var(--sapphire))",
    perks: {
      queue_priority: true,
      discount_pct: 50,
      priority_support: true,
      monthly_connects: 50,
      white_label_pdf: true,
      charter_seal: true,
      alpha_notes: true,
      is_transferable: true,
    }
  },
  PIONEER_OWNER: {
    id: "PIONEER_OWNER",
    name: "Pioneer Landlord",
    description: "One of the first 20 trophy asset developers and landlords on ScoutIt. Holds a permanent, transferable Founding Charter seat.",
    max_slots: 20,
    claimed: 8,
    status: "ACTIVE",
    color: "var(--green)",
    perks: {
      queue_priority: true,
      discount_pct: 50,
      priority_support: true,
      monthly_connects: 50,
      white_label_pdf: true,
      charter_seal: true,
      alpha_notes: true,
      is_transferable: true,
    }
  },
  PIONEER_CREATOR: {
    id: "PIONEER_CREATOR",
    name: "Pioneer Creator",
    description: "One of the first 15 premier visual architects and spatial photographers on ScoutIt.",
    max_slots: 15,
    claimed: 12,
    status: "ACTIVE",
    color: "var(--tier-platinum)",
    perks: {
      priority_bounties: true,
      priority_support: true,
      monthly_connects: 25,
      charter_seal: true,
      alpha_notes: true,
      is_transferable: true,
    }
  },
  FOUNDING_SEEKER: {
    id: "FOUNDING_SEEKER",
    name: "Founding Seeker",
    description: "The original 100 accredited luxury seekers and investors on ScoutIt. Permanent Spatial Vault privileges.",
    max_slots: 100,
    claimed: 100,
    status: "SOLD_OUT",
    color: "var(--accent)",
    perks: {
      free_vault_access: true,
      priority_support: true,
      monthly_connects: 25,
      charter_seal: true,
      alpha_notes: true,
      is_transferable: true,
    }
  },
  ALPHA_CARTOGRAPHER: {
    id: "ALPHA_CARTOGRAPHER",
    name: "Alpha Cartographer",
    description: "Mapped the very first 50 properties into the ScoutIt engine before public launch.",
    max_slots: 5,
    claimed: 5,
    status: "SOLD_OUT",
    color: "var(--red)",
    perks: {
      admin_access: true,
      charter_seal: true,
    }
  }
};

export const PIONEER_PERKS = Object.freeze({
  PIONEER_BROKER: BADGE_DEFINITIONS.PIONEER_BROKER.perks,
  PIONEER_OWNER: BADGE_DEFINITIONS.PIONEER_OWNER.perks,
  PIONEER_CREATOR: BADGE_DEFINITIONS.PIONEER_CREATOR.perks,
  FOUNDING_SEEKER: BADGE_DEFINITIONS.FOUNDING_SEEKER.perks,
  ALPHA_CARTOGRAPHER: BADGE_DEFINITIONS.ALPHA_CARTOGRAPHER.perks,
});

export const hasBadge = (userBadges, badgeId) => {
  if (!userBadges || !Array.isArray(userBadges)) return false;
  return userBadges.some(badge => (badge?.badge_id || badge?.id) === badgeId);
};

export const isPioneerBadge = (badgeId) => {
  if (!badgeId || typeof badgeId !== "string") return false;
  return badgeId.startsWith("PIONEER_") || badgeId === "FOUNDING_SEEKER";
};

export const hasAnyPioneerBadge = (userBadges) => {
  if (!userBadges || !Array.isArray(userBadges)) return false;
  return userBadges.some(b => {
    const id = typeof b === "string" ? b : (b?.badge_id || b?.id);
    return isPioneerBadge(id);
  });
};

export const getPioneerBadge = (userBadges) => {
  if (!userBadges || !Array.isArray(userBadges)) return null;
  return userBadges.find(b => isPioneerBadge(b?.badge_id || b?.id)) || null;
};

export const formatCharterSeatLabel = (seatNumber) => {
  if (seatNumber === null || seatNumber === undefined) return null;
  const num = Number(seatNumber);
  if (!Number.isFinite(num) || num <= 0) return null;
  return `Charter #${String(num).padStart(3, "0")}`;
};

export const resolveUserPerks = (userBadges, catalog = BADGE_DEFINITIONS) => {
  const perks = {
    queuePriority: false,
    queue_priority: false,
    discountPct: 0,
    discount_pct: 0,
    rate_lock_percent: 0,
    monthlyConnects: 0,
    monthly_connects: 0,
    whiteLabelPdf: false,
    white_label_pdf: false,
    charterSeal: false,
    charter_seal: false,
    gold_seal: false,
    prioritySupport: false,
    priority_support: false,
    support_sla_hours: 0,
    alphaNotes: false,
    alpha_notes: false,
    freeVaultAccess: false,
    free_vault_access: false,
    isTransferable: false,
    is_transferable: false,
    priorityBounties: false,
    priority_bounties: false,
  };

  if (!userBadges || !Array.isArray(userBadges)) return perks;

  for (const b of userBadges) {
    const badgeId = typeof b === "string" ? b : (b?.badge_id || b?.id);
    const def = catalog?.[badgeId];
    if (!def?.perks) continue;

    const p = def.perks;
    if (p.queue_priority) {
      perks.queuePriority = true;
      perks.queue_priority = true;
    }
    if (p.discount_pct && p.discount_pct > perks.discountPct) {
      perks.discountPct = p.discount_pct;
      perks.discount_pct = p.discount_pct;
      perks.rate_lock_percent = p.discount_pct;
    }
    if (p.monthly_connects) {
      perks.monthlyConnects += p.monthly_connects;
      perks.monthly_connects += p.monthly_connects;
    }
    if (p.white_label_pdf) {
      perks.whiteLabelPdf = true;
      perks.white_label_pdf = true;
    }
    if (p.charter_seal) {
      perks.charterSeal = true;
      perks.charter_seal = true;
      perks.gold_seal = true;
    }
    if (p.priority_support) {
      perks.prioritySupport = true;
      perks.priority_support = true;
      perks.support_sla_hours = 4;
    }
    if (p.alpha_notes) {
      perks.alphaNotes = true;
      perks.alpha_notes = true;
    }
    if (p.free_vault_access) {
      perks.freeVaultAccess = true;
      perks.free_vault_access = true;
    }
    if (p.is_transferable) {
      perks.isTransferable = true;
      perks.is_transferable = true;
    }
    if (p.priority_bounties) {
      perks.priorityBounties = true;
      perks.priority_bounties = true;
    }

    // Copy any dynamic/custom database perks
    for (const [key, val] of Object.entries(p)) {
      if (!(key in perks)) {
        perks[key] = val;
      }
    }
  }

  return perks;
};

export const TRUST_BADGES = {
  OWNER_VERIFIED: {
    id: "OWNER_VERIFIED",
    name: "Owner Verified",
    icon: "🛡️",
    badgeType: "trust",
    description: "Property authority, corporate registration, and ownership verified directly with land title records.",
    criteria: "Owner government ID, notarized deed/authority, and corporate registration submitted.",
    color: "var(--accent)"
  },
  AVAILABILITY_CONFIRMED: {
    id: "AVAILABILITY_CONFIRMED",
    name: "Availability Confirmed",
    icon: "✓",
    badgeType: "trust",
    description: "Unit inventory and lease availability as last confirmed by the owner or listing broker.",
    criteria: "Owner or authorized listing broker confirms current unit status.",
    color: "var(--green)"
  },
  FLOOR_PLAN_VERIFIED: {
    id: "FLOOR_PLAN_VERIFIED",
    name: "Floor Plan Verified",
    icon: "📐",
    badgeType: "trust",
    description: "Architectural dimensions and unit measurements verified against CAD blueprints.",
    criteria: "Architectural CAD drawings, measurement scan, or as-built plan verified.",
    color: "var(--intel-blue, var(--sapphire))"
  },
  IDENTITY_VERIFIED: {
    id: "IDENTITY_VERIFIED",
    name: "Identity Verified",
    icon: "👤",
    badgeType: "trust",
    description: "Professional PRC broker license or company officer credentials verified.",
    criteria: "PRC real estate broker license or government corporate filings validated.",
    color: "var(--intel-purple, var(--amethyst))"
  },
  AUTHORIZED_REPRESENTATION: {
    id: "AUTHORIZED_REPRESENTATION",
    name: "Authorized Mandate",
    icon: "🤝",
    badgeType: "trust",
    description: "Direct written representation agreement signed between owner and broker.",
    criteria: "Mutual digital handshake or exclusive/non-exclusive authority letter on file.",
    color: "var(--intel-pink, var(--red))"
  }
};

export const getBadgeDetails = (badgeId) => {
  if (!badgeId) return null;
  return BADGE_DEFINITIONS[badgeId] || TRUST_BADGES[badgeId] || null;
};
