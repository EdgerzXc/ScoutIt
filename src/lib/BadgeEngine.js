/**
 * ScoutIt Badge Engine
 * 
 * Centralized utility for handling all badge-related logic (Discounts, Access, Capabilities).
 * Also acts as the master directory for the public Badge Registry.
 */

export const BADGE_DEFINITIONS = {
  PIONEER_BROKER: {
    id: "PIONEER_BROKER",
    name: "Pioneer Advisor",
    description: "One of the first 20 brokers to join ScoutIt. Secures a massive lifetime discount on the Cluster Strategist tier.",
    max_slots: 20,
    claimed: 14, // Mocked for now; in production, this is queried from Supabase
    status: "ACTIVE", // ACTIVE | SOLD_OUT | EXPIRED
    color: "#60A5FA", // Sapphire Blue
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
    color: "#34D399", // Emerald Green
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
    color: "#0d0d0d", // Obsidian Black
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
    color: "#E8AE3C", // ScoutIt Gold
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
    color: "#F87171", // Ruby Red
    perks: {
      admin_access: true
    }
  }
};

/**
 * Validates if a user possesses a specific badge.
 * @param {Array} userBadges - Array of badge objects from Supabase e.g. [{id: "PIONEER_BROKER"}]
 * @param {String} badgeId - The badge ID to check against.
 * @returns {Boolean}
 */
export const hasBadge = (userBadges, badgeId) => {
  if (!userBadges || !Array.isArray(userBadges)) return false;
  return userBadges.some(badge => badge.id === badgeId);
};

/**
 * Calculates the final price for a subscription tier based on user badges.
 */
export const applyBadgeDiscounts = (userBadges, tierId, basePrice) => {
  if (tierId === "CLUSTER_STRATEGIST" && hasBadge(userBadges, "PIONEER_BROKER")) {
    return 1999;
  }
  if (tierId === "CLUSTER_DEVELOPER" && hasBadge(userBadges, "PIONEER_OWNER")) {
    return 2499; 
  }
  return basePrice;
};

/**
 * Gets all badges as an array, optionally filtered by status.
 */
export const getAllBadges = (statusFilter = null) => {
  const badges = Object.values(BADGE_DEFINITIONS);
  if (statusFilter) {
    return badges.filter(b => b.status === statusFilter);
  }
  return badges;
};

/**
 * Gets the number of remaining slots for an active badge.
 */
export const getRemainingSlots = (badgeId) => {
  const def = BADGE_DEFINITIONS[badgeId];
  if (!def) return 0;
  return Math.max(0, def.max_slots - def.claimed);
};
