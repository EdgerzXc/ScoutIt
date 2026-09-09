const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function disputeAge(createdAt, now = new Date()) {
  const opened = new Date(createdAt);
  const current = new Date(now);
  if (!createdAt || Number.isNaN(opened.getTime()) || Number.isNaN(current.getTime())) return null;

  const elapsed = Math.max(0, current.getTime() - opened.getTime());
  const days = Math.floor(elapsed / DAY_MS);
  if (days >= 1) return { label: `Open ${days}d`, overdue: days >= 7 };

  const hours = Math.floor(elapsed / HOUR_MS);
  if (hours >= 1) return { label: `Open ${hours}h`, overdue: false };

  const minutes = Math.floor(elapsed / (60 * 1000));
  return { label: `Open ${minutes}m`, overdue: false };
}
