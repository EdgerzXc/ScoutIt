const QUESTIT_ROOTS = ["/api/questit", "/api/v1/questit"];

/** Match only the QuestIT roots and their descendants, never a near-prefix. */
export function isQuestItPath(pathname) {
  return QUESTIT_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  );
}

/**
 * QuestIT is parked until its data and spend controls are ready. A missing or
 * false flag must therefore deny access; only an explicit boolean true opens it.
 */
export function shouldBlockQuestIt(pathname, flags) {
  return isQuestItPath(pathname) && flags?.ai_search !== true;
}
