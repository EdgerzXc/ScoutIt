export const BADGE_DEFINITIONS = {
  PIONEER_BROKER: {
    id: "PIONEER_BROKER",
    name: "Pioneer Advisor",
    description: "One of the first 20 brokers to join ScoutIt. Secures a massive lifetime discount on the Cluster Strategist tier.",
    max_slots: 20,
    claimed: 14,
    status: "ACTIVE",
    color: "var(--intel-blue, var(--sapphire))",
    perks: {
      discount: true,
      priority_support: true
    }
  },
  PIONEER_OWNER: {
    id: "PIONEER_OWNER",
    name: "Pioneer Landlord",
    description: "One of the first 20 owners/developers on the platform. Secures accelerated 3D map generation.",
    max_slots: 20,
    claimed: 8,
    status: "ACTIVE",
    color: "var(--green)",
    perks: {
      discount: true,
      priority_support: true
    }
  },
  PIONEER_CREATOR: {
    id: "PIONEER_CREATOR",
    name: "Pioneer Creator",
    description: "One of the first 20 visual architects to capture spaces for ScoutIt.",
    max_slots: 20,
    claimed: 19,
    status: "ACTIVE",
    color: "var(--bg)",
    perks: {
      discount: true,
      priority_support: true
    }
  },
  FOUNDING_SEEKER: {
    id: "FOUNDING_SEEKER",
    name: "Founding Seeker",
    description: "The original beta testers of the ScoutIt intelligence platform. Secured free lifetime access to the Spatial Vault.",
    max_slots: 100,
    claimed: 100,
    status: "SOLD_OUT",
    color: "var(--accent)",
    perks: {
      free_access: true
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
      admin_access: true
    }
  }
};

export const hasBadge = (userBadges, badgeId) => {
  if (!userBadges || !Array.isArray(userBadges)) return false;
  return userBadges.some(badge => badge.id === badgeId);
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
