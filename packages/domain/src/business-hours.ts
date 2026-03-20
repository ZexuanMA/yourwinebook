/**
 * Business hours calculation logic, shared across Web and Mobile.
 *
 * Input: structured hours JSON + current time
 * Output: open / closed / closing-soon status
 */

export interface DayHours {
  open: string;   // "HH:MM"
  close: string;  // "HH:MM"
}

export type HoursMap = Partial<Record<DayOfWeek, DayHours>>;

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type BusinessStatus = "open" | "closed" | "closing-soon";

const DAY_MAP: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Convert "HH:MM" to minutes since midnight.
 */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Determine business status from hours JSONB and current time.
 *
 * Handles cross-day hours (e.g., open 18:00, close 02:00 = next day).
 * "closing-soon" = within 30 minutes of closing.
 *
 * @param hours  Structured business hours or null/empty
 * @param now    Current Date (defaults to new Date())
 * @returns      { status, nextChange? } where nextChange is descriptive text
 */
export function getBusinessStatus(
  hours: HoursMap | null | undefined,
  now: Date = new Date()
): { status: BusinessStatus; opensAt?: string; closesAt?: string } {
  if (!hours || Object.keys(hours).length === 0) {
    return { status: "closed" };
  }

  const jsDay = now.getDay(); // 0=Sun, 1=Mon...
  const currentDay = DAY_MAP[jsDay];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check today's hours
  const todayHours = hours[currentDay];
  if (todayHours) {
    const openMin = toMinutes(todayHours.open);
    const closeMin = toMinutes(todayHours.close);

    if (closeMin > openMin) {
      // Normal same-day hours (e.g., 10:00-21:00)
      if (currentMinutes >= openMin && currentMinutes < closeMin) {
        const status: BusinessStatus =
          closeMin - currentMinutes <= 30 ? "closing-soon" : "open";
        return { status, closesAt: todayHours.close };
      }
    } else {
      // Cross-day hours (e.g., 18:00-02:00)
      // Open from openMin to midnight, then midnight to closeMin next day
      if (currentMinutes >= openMin) {
        return { status: "open", closesAt: todayHours.close };
      }
    }
  }

  // Check if previous day had cross-day hours that extend into today
  const prevDayIndex = (jsDay + 6) % 7;
  const prevDay = DAY_MAP[prevDayIndex];
  const prevHours = hours[prevDay];
  if (prevHours) {
    const prevOpen = toMinutes(prevHours.open);
    const prevClose = toMinutes(prevHours.close);
    if (prevClose < prevOpen && currentMinutes < prevClose) {
      // Still within previous day's cross-day hours
      const status: BusinessStatus =
        prevClose - currentMinutes <= 30 ? "closing-soon" : "open";
      return { status, closesAt: prevHours.close };
    }
  }

  // Not currently open, find when it opens next
  if (todayHours) {
    const openMin = toMinutes(todayHours.open);
    if (currentMinutes < openMin) {
      return { status: "closed", opensAt: todayHours.open };
    }
  }

  return { status: "closed" };
}
