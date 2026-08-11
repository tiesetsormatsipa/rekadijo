/**
 * Store open/closed logic
 * ────────────────────────
 * Uses the branch's weekly OperatingHour rows against the current time.
 * Times are stored as "HH:mm" 24-hour strings and compared in local
 * server time — sufficient for a single-country (South Africa) deployment.
 * If RekaDijo ever operates across timezones, store an IANA timezone per
 * branch and convert before comparing.
 */

export type OperatingHourLite = { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean };

export type OpenStatus =
  | { isOpen: true; closesAt: string }
  | { isOpen: false; opensAt: string | null; opensToday: boolean };

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function resolveOpenStatus(hours: OperatingHourLite[], now: Date = new Date()): OpenStatus {
  const dayOfWeek = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const today = hours.find((h) => h.dayOfWeek === dayOfWeek);

  if (today && !today.isClosed) {
    const open = timeStringToMinutes(today.openTime);
    const close = timeStringToMinutes(today.closeTime);
    if (nowMinutes >= open && nowMinutes < close) {
      return { isOpen: true, closesAt: today.closeTime };
    }
    if (nowMinutes < open) {
      return { isOpen: false, opensAt: today.openTime, opensToday: true };
    }
  }

  // Find the next open day (up to 7 days ahead)
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (dayOfWeek + offset) % 7;
    const entry = hours.find((h) => h.dayOfWeek === nextDay);
    if (entry && !entry.isClosed) {
      return { isOpen: false, opensAt: entry.openTime, opensToday: false };
    }
  }

  return { isOpen: false, opensAt: null, opensToday: false };
}

export function formatOpenStatus(status: OpenStatus): string {
  if (status.isOpen) return `Open now · closes ${status.closesAt}`;
  if (status.opensAt) return status.opensToday ? `Closed · opens ${status.opensAt} today` : `Closed · opens ${status.opensAt}`;
  return "Closed";
}
