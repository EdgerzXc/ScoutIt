/**
 * ScoutIt VIA Intelligence, Qualified Visit Telemetry & Broker Performance Analytics (A-186 Phase 3)
 *
 * Implements the telemetry, anti-abuse filtering, and performance aggregation logic
 * defined in _SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/VIA_CONTACT_ATTRIBUTION_AND_ROUTING.md
 * (§30 Analytics, §31 Raw Clicks Rule, §32 Qualified Visit, §33-34 Feedback Loop, §35 Anti-Abuse).
 *
 * Fundamental Invariant:
 * Raw clicks are analytics signals only, NEVER major ranking signals.
 * Only verified qualified demand generation and authentic transaction outcomes
 * feed back into the organic behavioral reputation score.
 */

export const TELEMETRY_THRESHOLDS = Object.freeze({
  MIN_QUALIFIED_DWELL_SECONDS: 15,
  MIN_QUALIFIED_SCROLL_DEPTH_PERCENT: 30,
  RETURNED_VISIT_MIN_DWELL_SECONDS: 10,
  VELOCITY_WINDOW_MS: 60 * 1000, // 60 seconds
  MAX_VELOCITY_CLICKS_PER_WINDOW: 5,
});

export const QUALIFICATION_REASONS = Object.freeze({
  INQUIRY_INITIATED: "INQUIRY_INITIATED",
  ENGAGED_DWELL_AND_SCROLL: "ENGAGED_DWELL_AND_SCROLL",
  INTERACTED_WITH_UNITS: "INTERACTED_WITH_UNITS",
  INTERACTED_WITH_MEDIA: "INTERACTED_WITH_MEDIA",
  USED_VALUATION_TOOLS: "USED_VALUATION_TOOLS",
  QUALIFIED_RETURNED_VISITOR: "QUALIFIED_RETURNED_VISITOR",
});

export const DISQUALIFICATION_FLAGS = Object.freeze({
  BOT_CRAWLER_DISQUALIFIED: "BOT_CRAWLER_DISQUALIFIED",
  SELF_CLICK_FILTERED: "SELF_CLICK_FILTERED",
  VELOCITY_SPAM_FILTERED: "VELOCITY_SPAM_FILTERED",
  INSUFFICIENT_ENGAGEMENT: "INSUFFICIENT_ENGAGEMENT",
  IMMEDIATE_BOUNCE: "IMMEDIATE_BOUNCE",
});

const BOT_USER_AGENT_REGEX = /bot|crawler|spider|headlesschrome|puppeteer|selenium|phantomjs|slurp|bingbot|googlebot|yandex|duckduckbot|baiduspider/i;

/**
 * Checks whether a given user agent string matches common crawler or headless automation patterns.
 *
 * @param {string} [userAgent]
 * @returns {boolean}
 */
export function isBotUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return false;
  return BOT_USER_AGENT_REGEX.test(userAgent);
}

/**
 * Checks whether an incoming visit originates from the promoter themselves (self-referral).
 *
 * @param {Object} params
 * @param {string|null} [params.visitorId]
 * @param {string|null} [params.visitorUserId]
 * @param {string|null} [params.visitorProfileId]
 * @param {string|null} [params.promoterId]
 * @param {string|null} [params.promoterUserId]
 * @param {string|null} [params.promoterSlug]
 * @returns {boolean}
 */
export function isSelfClick({
  visitorId = null,
  visitorUserId = null,
  visitorProfileId = null,
  promoterId = null,
  promoterUserId = null,
  promoterSlug = null,
} = {}) {
  // If signed-in visitor account matches promoter's user account
  if (visitorUserId && promoterUserId && String(visitorUserId).toLowerCase() === String(promoterUserId).toLowerCase()) {
    return true;
  }

  // If visitor profile ID matches promoter's ID
  if (visitorProfileId && promoterId && String(visitorProfileId).toLowerCase() === String(promoterId).toLowerCase()) {
    return true;
  }

  // If visitor ID or user ID equals promoter ID or slug
  const normPromoter = promoterId ? String(promoterId).toLowerCase() : null;
  const normSlug = promoterSlug ? String(promoterSlug).toLowerCase() : null;

  if (visitorUserId && (visitorUserId.toLowerCase() === normPromoter || visitorUserId.toLowerCase() === normSlug)) {
    return true;
  }

  if (visitorId && (visitorId.toLowerCase() === normPromoter || visitorId.toLowerCase() === normSlug)) {
    return true;
  }

  return false;
}

/**
 * Evaluates anti-abuse conditions for an incoming telemetry signal or click event.
 *
 * @param {Object} params
 * @param {string} [params.userAgent]
 * @param {string} [params.ipAddress]
 * @param {string} [params.visitorId]
 * @param {string} [params.visitorUserId]
 * @param {string} [params.visitorProfileId]
 * @param {string} [params.promoterId]
 * @param {string} [params.promoterUserId]
 * @param {string} [params.promoterSlug]
 * @param {Array<number>} [params.recentClickTimestamps] - Timestamps of clicks from same visitor/IP in epoch ms
 * @param {number} [params.now]
 * @returns {Object} { isAllowed, isBot, isSelfClick, isVelocitySpam, flags }
 */
export function evaluateAntiAbuse({
  userAgent = "",
  ipAddress = "",
  visitorId = null,
  visitorUserId = null,
  visitorProfileId = null,
  promoterId = null,
  promoterUserId = null,
  promoterSlug = null,
  recentClickTimestamps = [],
  now = Date.now(),
} = {}) {
  const flags = [];
  const isBot = isBotUserAgent(userAgent);
  if (isBot) {
    flags.push(DISQUALIFICATION_FLAGS.BOT_CRAWLER_DISQUALIFIED);
  }

  const selfClick = isSelfClick({
    visitorId,
    visitorUserId,
    visitorProfileId,
    promoterId,
    promoterUserId,
    promoterSlug,
  });
  if (selfClick) {
    flags.push(DISQUALIFICATION_FLAGS.SELF_CLICK_FILTERED);
  }

  // Check click velocity / spam flooding
  let isVelocitySpam = false;
  if (Array.isArray(recentClickTimestamps) && recentClickTimestamps.length >= TELEMETRY_THRESHOLDS.MAX_VELOCITY_CLICKS_PER_WINDOW) {
    const windowStart = now - TELEMETRY_THRESHOLDS.VELOCITY_WINDOW_MS;
    const clicksInWindow = recentClickTimestamps.filter((ts) => ts >= windowStart);
    if (clicksInWindow.length >= TELEMETRY_THRESHOLDS.MAX_VELOCITY_CLICKS_PER_WINDOW) {
      isVelocitySpam = true;
      flags.push(DISQUALIFICATION_FLAGS.VELOCITY_SPAM_FILTERED);
    }
  }

  const isAllowed = !isBot && !selfClick && !isVelocitySpam;

  return {
    isAllowed,
    isBot,
    isSelfClick: selfClick,
    isVelocitySpam,
    flags,
  };
}

/**
 * Evaluates whether a property visit meets the criteria of a Qualified VIA Visit.
 *
 * Section 31 & 32:
 * Raw clicks are never qualified.
 * Must demonstrate intentional engagement:
 * - Direct intent (opened inquiry), OR
 * - Dwell time >= 15s AND (scroll depth >= 30% OR unit interaction OR media engagement OR tool use), OR
 * - Returned visit with dwell time >= 10s.
 *
 * @param {Object} params
 * @param {number} [params.dwellTimeSeconds]
 * @param {number} [params.scrollDepthPercent]
 * @param {boolean} [params.interactedWithUnits]
 * @param {boolean} [params.interactedWithMedia]
 * @param {boolean} [params.usedTools]
 * @param {boolean} [params.openedInquiry]
 * @param {boolean} [params.returnedVisit]
 * @param {Object|null} [params.antiAbuseResult]
 * @returns {Object} { isQualified, qualificationScore, reasons, disqualificationFlags }
 */
export function evaluateVisitQualification({
  dwellTimeSeconds = 0,
  scrollDepthPercent = 0,
  interactedWithUnits = false,
  interactedWithMedia = false,
  usedTools = false,
  openedInquiry = false,
  returnedVisit = false,
  antiAbuseResult = null,
} = {}) {
  const disqualificationFlags = [];
  const reasons = [];

  // Check anti-abuse filters first
  if (antiAbuseResult && !antiAbuseResult.isAllowed) {
    disqualificationFlags.push(...antiAbuseResult.flags);
    return {
      isQualified: false,
      qualificationScore: 0,
      reasons: [],
      disqualificationFlags,
    };
  }

  // Immediate bounce filter
  if (dwellTimeSeconds < 3 && !openedInquiry) {
    disqualificationFlags.push(DISQUALIFICATION_FLAGS.IMMEDIATE_BOUNCE);
    return {
      isQualified: false,
      qualificationScore: 0,
      reasons: [],
      disqualificationFlags,
    };
  }

  let isQualified = false;
  let score = 0;

  // Dwell time score: up to 35 points (maxed at 60 seconds)
  const dwellScore = Math.min(35, Math.round((Math.max(0, dwellTimeSeconds) / 60) * 35));
  score += dwellScore;

  // Scroll depth score: up to 20 points
  const scrollScore = Math.min(20, Math.round((Math.max(0, scrollDepthPercent) / 100) * 20));
  score += scrollScore;

  // Engagement bonuses
  if (interactedWithUnits) {
    score += 15;
    reasons.push(QUALIFICATION_REASONS.INTERACTED_WITH_UNITS);
  }
  if (interactedWithMedia) {
    score += 10;
    reasons.push(QUALIFICATION_REASONS.INTERACTED_WITH_MEDIA);
  }
  if (usedTools) {
    score += 10;
    reasons.push(QUALIFICATION_REASONS.USED_VALUATION_TOOLS);
  }

  // Explicit Inquiry: highest confidence signal
  if (openedInquiry) {
    score += 30;
    reasons.push(QUALIFICATION_REASONS.INQUIRY_INITIATED);
    isQualified = true;
  }

  // Engaged browsing threshold: dwell >= 15s AND (scroll >= 30% OR substantive interaction)
  const hasMetDwell = dwellTimeSeconds >= TELEMETRY_THRESHOLDS.MIN_QUALIFIED_DWELL_SECONDS;
  const hasMetScroll = scrollDepthPercent >= TELEMETRY_THRESHOLDS.MIN_QUALIFIED_SCROLL_DEPTH_PERCENT;
  const hasInteracted = interactedWithUnits || interactedWithMedia || usedTools;

  if (hasMetDwell && (hasMetScroll || hasInteracted)) {
    isQualified = true;
    if (!reasons.includes(QUALIFICATION_REASONS.ENGAGED_DWELL_AND_SCROLL)) {
      reasons.push(QUALIFICATION_REASONS.ENGAGED_DWELL_AND_SCROLL);
    }
  }

  // Returned visitor threshold
  if (returnedVisit && dwellTimeSeconds >= TELEMETRY_THRESHOLDS.RETURNED_VISIT_MIN_DWELL_SECONDS) {
    score += 15;
    reasons.push(QUALIFICATION_REASONS.QUALIFIED_RETURNED_VISITOR);
    isQualified = true;
  }

  if (!isQualified) {
    disqualificationFlags.push(DISQUALIFICATION_FLAGS.INSUFFICIENT_ENGAGEMENT);
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    isQualified,
    qualificationScore: isQualified ? finalScore : Math.min(30, finalScore),
    reasons,
    disqualificationFlags,
  };
}

/**
 * Calculates behavioral standing score delta for a broker based on verified outcomes.
 *
 * Section 33 & 34:
 * Raw traffic is NOT a ranking signal and gives zero score reward.
 * Positive standing is earned ONLY through verified conversion outcomes and high response rate.
 * Negative standing occurs if a broker generates inquiries but ghosts or ignores them.
 *
 * @param {Object} params
 * @param {number} params.qualifiedVisits
 * @param {number} params.inquiriesInitiated
 * @param {number} params.inquiriesAccepted
 * @param {number} params.dealsClosed
 * @param {number} [params.responseRate] - 0 to 1
 * @param {number} [params.botDisqualifiedRatio] - 0 to 1
 * @returns {Object} { behavioralScoreDelta, status, feedbackNotes }
 */
export function calculateBehavioralFeedbackDelta({
  qualifiedVisits = 0,
  inquiriesInitiated = 0,
  inquiriesAccepted = 0,
  dealsClosed = 0,
  responseRate = null,
  botDisqualifiedRatio = 0,
} = {}) {
  const notes = [];
  let scoreDelta = 0;

  // Rule: Raw clicks alone give 0 points
  if (inquiriesInitiated === 0 && dealsClosed === 0) {
    return {
      behavioralScoreDelta: 0,
      status: "NEUTRAL",
      feedbackNotes: ["Qualified demand logged. Outcomes required for standing adjustments."],
    };
  }

  // If inquiries were initiated, check response performance
  const actualResponseRate = responseRate !== null
    ? responseRate
    : inquiriesInitiated > 0
      ? inquiriesAccepted / inquiriesInitiated
      : 1;

  if (inquiriesInitiated >= 3) {
    if (actualResponseRate >= 0.85) {
      scoreDelta += 2.5;
      notes.push("High inquiry responsiveness (+2.5)");
    } else if (actualResponseRate < 0.5) {
      scoreDelta -= 3.0;
      notes.push("Low inquiry responsiveness penalty (-3.0)");
    }
  }

  // Closed deals through VIA provide meaningful standing credit
  if (dealsClosed > 0) {
    const dealBonus = Math.min(10, dealsClosed * 2.0);
    scoreDelta += dealBonus;
    notes.push(`Verified transaction closures (+${dealBonus.toFixed(1)})`);
  }

  // Suspicious traffic pattern warning
  if (botDisqualifiedRatio > 0.5) {
    notes.push("Elevated crawler/bot ratio observed. Standing adjustments throttled.");
    scoreDelta = Math.min(0, scoreDelta); // Cannot earn positive standing while traffic is suspicious
  }

  let status = "NEUTRAL";
  if (scoreDelta > 0) status = "POSITIVE";
  if (scoreDelta < 0) status = "ATTENTION_REQUIRED";

  return {
    behavioralScoreDelta: Math.round(scoreDelta * 10) / 10,
    status,
    feedbackNotes: notes,
  };
}

/**
 * Aggregates complete broker performance metrics and conversion funnels across VIA attributions,
 * routing decisions, and deal inquiries.
 *
 * @param {Object} params
 * @param {Array<Object>} [params.attributions] - List of via_attributions records
 * @param {Array<Object>} [params.routingDecisions] - List of via_routing_decisions records
 * @param {Array<Object>} [params.deals] - List of deals initiated via VIA
 * @param {Array<Object>} [params.clicks] - Raw click telemetry events if available
 * @returns {Object} Structured broker VIA performance summary
 */
export function aggregateBrokerViaMetrics({
  attributions = [],
  routingDecisions = [],
  deals = [],
  clicks = [],
} = {}) {
  const attrList = Array.isArray(attributions) ? attributions : [];
  const routingList = Array.isArray(routingDecisions) ? routingDecisions : [];
  const dealsList = Array.isArray(deals) ? deals : [];
  const clicksList = Array.isArray(clicks) ? clicks : [];

  // Filter bot and self-clicks from click stream
  let botClicks = 0;
  let selfClicks = 0;
  let velocitySpam = 0;

  for (const c of clicksList) {
    if (c.is_bot || isBotUserAgent(c.user_agent)) botClicks++;
    if (c.is_self_click) selfClicks++;
    if (c.is_velocity_spam) velocitySpam++;
  }

  const rawClicks = clicksList.length > 0 ? clicksList.length : attrList.length;
  const filteredClicks = Math.max(0, rawClicks - botClicks - selfClicks - velocitySpam);

  // Unique visitors
  const uniqueVisitorSet = new Set(attrList.map((a) => a.visitor_id).filter(Boolean));
  const uniqueVisitors = uniqueVisitorSet.size;

  // Qualified visits
  const qualifiedVisits = attrList.filter((a) => a.is_qualified === true).length;

  // Inquiries and decisions
  const inquiriesInitiated = routingList.filter((r) => r.routing_reason === "VIA_ATTRIBUTION").length;
  const inquiriesAccepted = dealsList.filter((d) => d.status && d.status !== "declined" && d.status !== "cancelled").length;
  const viewingsScheduled = dealsList.filter((d) => d.stage === "viewing" || d.stage === "negotiation" || d.stage === "closed").length;
  const dealsClosed = dealsList.filter((d) => d.stage === "closed" || d.status === "completed").length;

  // Conversion rates (safe divide)
  const qualificationRate = filteredClicks > 0 ? Math.round((qualifiedVisits / filteredClicks) * 1000) / 1000 : 0;
  const inquiryRate = qualifiedVisits > 0 ? Math.round((inquiriesInitiated / qualifiedVisits) * 1000) / 1000 : 0;
  const acceptanceRate = inquiriesInitiated > 0 ? Math.round((inquiriesAccepted / inquiriesInitiated) * 1000) / 1000 : 0;
  const closeRate = inquiriesInitiated > 0 ? Math.round((dealsClosed / inquiriesInitiated) * 1000) / 1000 : 0;

  const botRatio = rawClicks > 0 ? botClicks / rawClicks : 0;

  // Behavioral standing calculation
  const feedback = calculateBehavioralFeedbackDelta({
    qualifiedVisits,
    inquiriesInitiated,
    inquiriesAccepted,
    dealsClosed,
    botDisqualifiedRatio: botRatio,
  });

  return {
    funnel: {
      rawClicks,
      filteredClicks,
      uniqueVisitors,
      qualifiedVisits,
      inquiriesInitiated,
      inquiriesAccepted,
      viewingsScheduled,
      dealsClosed,
    },
    conversionRates: {
      qualificationRate,
      inquiryRate,
      acceptanceRate,
      closeRate,
    },
    antiAbuse: {
      botClicksFiltered: botClicks,
      selfClicksFiltered: selfClicks,
      velocitySpamFiltered: velocitySpam,
      botRatio: Math.round(botRatio * 100) / 100,
    },
    behavioralFeedback: feedback,
  };
}

/**
 * Server-side helper to record a qualified visit status into Supabase.
 *
 * @param {Object} supabaseAdmin
 * @param {Object} params
 * @param {string} params.propertyId
 * @param {string} params.visitorId
 * @param {Object} params.qualificationResult
 * @returns {Promise<Object>} { ok: boolean, updated: boolean }
 */
export async function recordQualifiedVisitTelemetry(supabaseAdmin, {
  propertyId,
  visitorId,
  qualificationResult,
} = {}) {
  if (!supabaseAdmin || !propertyId || !visitorId) {
    return { ok: false, reason: "missing_parameters" };
  }

  if (!qualificationResult?.isQualified) {
    return { ok: true, updated: false, reason: "not_qualified" };
  }

  try {
    const { error } = await supabaseAdmin
      .from("via_attributions")
      .update({
        is_qualified: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq("property_id", propertyId)
      .eq("visitor_id", visitorId);

    if (error) {
      console.warn("[viaTelemetry] Qualified status update skipped or unmigrated:", error.message);
      return { ok: true, updated: false, fallback: true };
    }

    return { ok: true, updated: true };
  } catch (err) {
    console.error("[viaTelemetry] Exception updating qualification:", err);
    return { ok: false, reason: "database_error" };
  }
}
