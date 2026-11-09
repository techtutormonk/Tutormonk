// Time zone helpers (no dependencies, works in the browser and on the server).
// Every class is stored in the database as a UTC instant. These helpers convert that instant to the wall-clock
// time of any IANA zone (Asia/Kolkata, America/New_York, ...) and back, daylight-saving included.

export interface TzOption { id: string; label: string; region: string }

const z = (id: string, label: string, region: string): TzOption => ({ id, label, region });

export const TIMEZONES: TzOption[] = [
  z('Asia/Kolkata', 'India - Mumbai / Delhi / Kolkata', 'India'),
  z('America/New_York', 'USA - New York / Eastern', 'USA & Canada'),
  z('America/Chicago', 'USA - Chicago / Central', 'USA & Canada'),
  z('America/Denver', 'USA - Denver / Mountain', 'USA & Canada'),
  z('America/Phoenix', 'USA - Arizona (no DST)', 'USA & Canada'),
  z('America/Los_Angeles', 'USA - Los Angeles / Pacific', 'USA & Canada'),
  z('America/Anchorage', 'USA - Alaska', 'USA & Canada'),
  z('Pacific/Honolulu', 'USA - Hawaii', 'USA & Canada'),
  z('America/Toronto', 'Canada - Toronto / Eastern', 'USA & Canada'),
  z('America/Winnipeg', 'Canada - Winnipeg / Central', 'USA & Canada'),
  z('America/Edmonton', 'Canada - Edmonton / Mountain', 'USA & Canada'),
  z('America/Vancouver', 'Canada - Vancouver / Pacific', 'USA & Canada'),
  z('America/Halifax', 'Canada - Halifax / Atlantic', 'USA & Canada'),
  z('America/St_Johns', 'Canada - Newfoundland', 'USA & Canada'),
  z('Europe/London', 'UK - London', 'Europe'),
  z('Europe/Dublin', 'Ireland - Dublin', 'Europe'),
  z('Europe/Paris', 'France - Paris (CET)', 'Europe'),
  z('Europe/Berlin', 'Germany - Berlin (CET)', 'Europe'),
  z('Europe/Amsterdam', 'Netherlands - Amsterdam', 'Europe'),
  z('Europe/Madrid', 'Spain - Madrid', 'Europe'),
  z('Europe/Rome', 'Italy - Rome', 'Europe'),
  z('Europe/Zurich', 'Switzerland - Zurich', 'Europe'),
  z('Europe/Athens', 'Greece - Athens (EET)', 'Europe'),
  z('Europe/Istanbul', 'Turkey - Istanbul', 'Europe'),
  z('Europe/Moscow', 'Russia - Moscow', 'Europe'),
  z('Asia/Dubai', 'UAE - Dubai / Abu Dhabi', 'Middle East'),
  z('Asia/Riyadh', 'Saudi Arabia - Riyadh', 'Middle East'),
  z('Asia/Qatar', 'Qatar - Doha', 'Middle East'),
  z('Asia/Kuwait', 'Kuwait', 'Middle East'),
  z('Asia/Bahrain', 'Bahrain', 'Middle East'),
  z('Asia/Muscat', 'Oman - Muscat', 'Middle East'),
  z('Asia/Karachi', 'Pakistan - Karachi', 'Asia'),
  z('Asia/Dhaka', 'Bangladesh - Dhaka', 'Asia'),
  z('Asia/Kathmandu', 'Nepal - Kathmandu', 'Asia'),
  z('Asia/Colombo', 'Sri Lanka - Colombo', 'Asia'),
  z('Asia/Bangkok', 'Thailand - Bangkok', 'Asia'),
  z('Asia/Singapore', 'Singapore', 'Asia'),
  z('Asia/Kuala_Lumpur', 'Malaysia - Kuala Lumpur', 'Asia'),
  z('Asia/Jakarta', 'Indonesia - Jakarta', 'Asia'),
  z('Asia/Manila', 'Philippines - Manila', 'Asia'),
  z('Asia/Hong_Kong', 'Hong Kong', 'Asia'),
  z('Asia/Shanghai', 'China - Shanghai', 'Asia'),
  z('Asia/Tokyo', 'Japan - Tokyo', 'Asia'),
  z('Asia/Seoul', 'South Korea - Seoul', 'Asia'),
  z('Australia/Sydney', 'Australia - Sydney / Melbourne (AEST)', 'Australia & NZ'),
  z('Australia/Melbourne', 'Australia - Melbourne', 'Australia & NZ'),
  z('Australia/Brisbane', 'Australia - Brisbane (no DST)', 'Australia & NZ'),
  z('Australia/Adelaide', 'Australia - Adelaide', 'Australia & NZ'),
  z('Australia/Darwin', 'Australia - Darwin', 'Australia & NZ'),
  z('Australia/Perth', 'Australia - Perth', 'Australia & NZ'),
  z('Pacific/Auckland', 'New Zealand - Auckland', 'Australia & NZ'),
  z('Africa/Cairo', 'Egypt - Cairo', 'Africa'),
  z('Africa/Lagos', 'Nigeria - Lagos', 'Africa'),
  z('Africa/Nairobi', 'Kenya - Nairobi', 'Africa'),
  z('Africa/Johannesburg', 'South Africa - Johannesburg', 'Africa'),
  z('America/Mexico_City', 'Mexico - Mexico City', 'Latin America'),
  z('America/Bogota', 'Colombia - Bogota', 'Latin America'),
  z('America/Sao_Paulo', 'Brazil - Sao Paulo', 'Latin America'),
  z('UTC', 'UTC', 'Other')
];

export const TZ_REGIONS = ['India', 'USA & Canada', 'Europe', 'Middle East', 'Asia', 'Australia & NZ', 'Africa', 'Latin America', 'Other'];

export const COUNTRIES: { name: string; tz: string }[] = [
  { name: 'India', tz: 'Asia/Kolkata' },
  { name: 'USA', tz: 'America/New_York' },
  { name: 'Canada', tz: 'America/Toronto' },
  { name: 'UK', tz: 'Europe/London' },
  { name: 'Australia', tz: 'Australia/Sydney' },
  { name: 'UAE', tz: 'Asia/Dubai' },
  { name: 'Saudi Arabia', tz: 'Asia/Riyadh' },
  { name: 'Qatar', tz: 'Asia/Qatar' },
  { name: 'Kuwait', tz: 'Asia/Kuwait' },
  { name: 'Singapore', tz: 'Asia/Singapore' },
  { name: 'Malaysia', tz: 'Asia/Kuala_Lumpur' },
  { name: 'New Zealand', tz: 'Pacific/Auckland' },
  { name: 'Germany', tz: 'Europe/Berlin' },
  { name: 'Ireland', tz: 'Europe/Dublin' },
  { name: 'South Africa', tz: 'Africa/Johannesburg' },
  { name: 'Nepal', tz: 'Asia/Kathmandu' },
  { name: 'Other', tz: 'UTC' }
];

const COUNTRY_ALIASES: Record<string, string> = {
  'united states': 'USA', 'united states of america': 'USA', 'us': 'USA', 'u.s.': 'USA', 'u.s.a.': 'USA', 'america': 'USA',
  'united kingdom': 'UK', 'england': 'UK', 'great britain': 'UK', 'britain': 'UK', 'scotland': 'UK', 'wales': 'UK',
  'united arab emirates': 'UAE', 'dubai': 'UAE', 'bharat': 'India', 'hindustan': 'India', 'aus': 'Australia', 'nz': 'New Zealand'
};

export const DEFAULT_TZ = 'Asia/Kolkata';

export function countryToTz(country?: string | null): string | null {
  const raw = (country || '').trim().toLowerCase();
  if (!raw) return null;
  const canon = COUNTRY_ALIASES[raw];
  const hit = COUNTRIES.find(c => c.name.toLowerCase() === (canon ? canon.toLowerCase() : raw));
  return hit && hit.name !== 'Other' ? hit.tz : null;
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();
const getDtf = (tz: string) => {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' });
    dtfCache.set(tz, f);
  }
  return f;
};

export function isValidTz(tz?: string | null): tz is string {
  if (!tz || typeof tz !== 'string') return false;
  try { getDtf(tz); return true; } catch { return false; }
}

export const browserTz = (): string => {
  try { const t = Intl.DateTimeFormat().resolvedOptions().timeZone; return isValidTz(t) ? t : DEFAULT_TZ; } catch { return DEFAULT_TZ; }
};

/** The stored profile timezone is 'UTC' by default for accounts nobody has set up, so 'UTC' means "not set". */
export function resolveTz(timezone?: string | null, country?: string | null): { tz: string; guessed: boolean } {
  if (isValidTz(timezone) && timezone !== 'UTC') return { tz: timezone, guessed: false };
  const c = countryToTz(country);
  if (c) return { tz: c, guessed: true };
  if (timezone === 'UTC') return { tz: 'UTC', guessed: true };
  return { tz: DEFAULT_TZ, guessed: true };
}

export interface Parts { y: number; m: number; d: number; h: number; mi: number; s: number; dow: number }
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock parts of an instant in a zone. m is 1-12, dow 0=Sunday. */
export function partsInTz(ms: number, tz: string): Parts {
  const o: Record<string, string> = {};
  for (const p of getDtf(tz).formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, dow: DOW[o.weekday] ?? 0 };
}

/** Offset of the zone from UTC at that instant, in minutes (India = 330). */
export function offsetMinutes(ms: number, tz: string): number {
  const p = partsInTz(ms, tz);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** Turns a wall-clock time in a zone (e.g. 5:00 PM in New York on 7 Nov) into the real UTC instant. */
export function wallToUtc(y: number, m: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const o1 = offsetMinutes(guess, tz);
  let t = guess - o1 * 60000;
  const o2 = offsetMinutes(t, tz);
  if (o2 !== o1) t = guess - o2 * 60000;
  return t;
}

const p2 = (n: number) => String(n).padStart(2, '0');
export const dayKeyOf = (ms: number, tz: string) => { const p = partsInTz(ms, tz); return `${p.y}-${p2(p.m)}-${p2(p.d)}`; };

/** 'YYYY-MM-DDTHH:mm' (what <input type="datetime-local"> uses) read as wall-clock time in `tz` -> UTC ISO string. */
export function localInputToIso(v: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || '');
  if (!m) return null;
  return new Date(wallToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], tz)).toISOString();
}

/** UTC instant -> 'YYYY-MM-DDTHH:mm' wall-clock string in `tz` for a datetime-local input. */
export function isoToLocalInput(v: any, tz: string): string {
  const p = partsInTz(new Date(v).getTime(), tz);
  return `${p.y}-${p2(p.m)}-${p2(p.d)}T${p2(p.h)}:${p2(p.mi)}`;
}

export function fmtTime(ms: number, tz: string): string {
  const p = partsInTz(ms, tz);
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${p2(p.mi)} ${p.h < 12 ? 'AM' : 'PM'}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS_SHORT = DAYS_SHORT;

export function fmtDate(ms: number, tz: string): string {
  const p = partsInTz(ms, tz);
  return `${DAYS_SHORT[p.dow]}, ${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}
export const fmtDateShort = (ms: number, tz: string) => { const p = partsInTz(ms, tz); return `${DAYS_SHORT[p.dow]} ${p.d} ${MONTHS[p.m - 1]}`; };

/** "IST", "EDT", "BST", "AEDT" ... falls back to "GMT+4". */
export function tzAbbr(ms: number, tz: string): string {
  if (tz === 'Asia/Kolkata') return 'IST';
  if (tz === 'UTC') return 'UTC';
  let last = '';
  for (const loc of ['en-US', 'en-GB', 'en-AU', 'en-CA']) {
    try {
      const n = new Intl.DateTimeFormat(loc, { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(ms)).find(x => x.type === 'timeZoneName')?.value || '';
      last = last || n;
      if (n && !/^(GMT|UTC)[+-]\d/.test(n)) return n;
    } catch { /* try next */ }
  }
  return last || tz;
}

export function offsetLabel(ms: number, tz: string): string {
  const o = offsetMinutes(ms, tz);
  const a = Math.abs(o);
  return `UTC${o < 0 ? '-' : '+'}${p2(Math.floor(a / 60))}:${p2(a % 60)}`;
}

export function cityLabel(tz: string): string {
  const hit = TIMEZONES.find(t => t.id === tz);
  if (hit) return hit.label.split(' - ').pop()!.replace(/\s*\(.*\)$/, '').split(' / ')[0];
  return (tz.split('/').pop() || tz).replace(/_/g, ' ');
}

/** "5:00 PM IST" */
export const fmtTimeZ = (ms: number, tz: string) => `${fmtTime(ms, tz)} ${tzAbbr(ms, tz)}`;

/** A class is at an "odd hour" for someone when it starts before 6 AM or ends after 11 PM their time. */
export function isOddHour(startMs: number, endMs: number, tz: string): boolean {
  const s = partsInTz(startMs, tz), e = partsInTz(endMs, tz);
  return s.h < 6 || e.h >= 23 || (e.h === 0 && e.mi > 0) || (e.h < s.h);
}

export const addDaysKey = (key: string, n: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${p2(t.getUTCMonth() + 1)}-${p2(t.getUTCDate())}`;
};
export const dowOfKey = (key: string): number => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
export const dayStartUtc = (key: string, tz: string): number => { const [y, m, d] = key.split('-').map(Number); return wallToUtc(y, m, d, 0, 0, tz); };
