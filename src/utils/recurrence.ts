// Expands a weekly recurrence rule into concrete start times.
// The times are wall-clock times in `timeZone` (the zone the admin typed them in), so "5:00 PM India time" stays at
// 5:00 PM India time, and "6:00 PM New York" stays at 6:00 PM New York even when daylight saving starts or ends.
import { browserTz, wallToUtc } from './timezone';

export interface RecurrenceRule {
  startDate: string;                 // yyyy-mm-dd (first day on which a class may occur), a date in `timeZone`
  slots: { day: number; time: string }[]; // day: 0=Sunday..6=Saturday, time: "HH:MM" (24h)
  end: { type: 'count'; count: number } | { type: 'until'; until: string }; // until: yyyy-mm-dd (inclusive)
  intervalWeeks?: number;            // 1 = every week, 2 = every other week
  timeZone?: string;                 // IANA zone the days/times are written in (default: this browser's zone)
}

export const MAX_OCCURRENCES = 200;

const parseDate = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
};

export function generateOccurrences(rule: RecurrenceRule): Date[] {
  const start = parseDate(rule.startDate);
  if (!start || !rule.slots.length) return [];
  const tz = rule.timeZone || browserTz();
  const interval = Math.max(1, Math.floor(rule.intervalWeeks || 1));
  const untilP = rule.end.type === 'until' ? parseDate(rule.end.until) : null;
  if (rule.end.type === 'until' && !untilP) return [];
  const limit = rule.end.type === 'count' ? Math.min(Math.max(1, Math.floor(rule.end.count)), MAX_OCCURRENCES) : MAX_OCCURRENCES;

  // pure calendar arithmetic on dates (UTC midnight used only as a date container)
  const startDay = Date.UTC(start.y, start.m - 1, start.d);
  const untilDay = untilP ? Date.UTC(untilP.y, untilP.m - 1, untilP.d) : null;
  const weekStart = startDay - new Date(startDay).getUTCDay() * 86400000; // Sunday of the start week
  const slots = [...rule.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const out: Date[] = [];

  for (let w = 0; out.length < limit && w < 520; w += interval) {
    for (const sl of slots) {
      const [hh, mm] = sl.time.split(':').map(Number);
      if (isNaN(hh) || isNaN(mm)) continue;
      const dayMs = weekStart + (w * 7 + sl.day) * 86400000;
      if (dayMs < startDay) continue;
      if (untilDay !== null && dayMs > untilDay) return out;
      const dt = new Date(dayMs);
      out.push(new Date(wallToUtc(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), hh, mm, tz)));
      if (out.length >= limit) break;
    }
  }
  return out;
}
