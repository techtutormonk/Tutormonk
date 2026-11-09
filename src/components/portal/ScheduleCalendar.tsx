import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiJson } from '../../utils/api';
import {
  addDaysKey, browserTz, cityLabel, dayKeyOf, dayStartUtc, dowOfKey, fmtDate, fmtDateShort, fmtTime, fmtTimeZ,
  isOddHour, isoToLocalInput, localInputToIso, MONTHS_LONG, offsetLabel, offsetMinutes, partsInTz, resolveTz, tzAbbr, WEEKDAYS_SHORT
} from '../../utils/timezone';
import { TzSelect } from './TzSelect';

type Role = 'student' | 'tutor' | 'admin';
type View = 'week' | 'month' | 'day' | 'agenda';

export interface CalendarActions {
  reschedule?: (id: number, isoUtc: string, reason: string) => Promise<void>;
  cancel?: (s: any, reason: string) => Promise<void>;
  restore?: (id: number) => Promise<void>;
}

interface Ev { s: any; id: number; st: number; en: number; stz: string; ttz: string; sGuess: boolean; hue: number; live: boolean }

const card = 'p-4 sm:p-5 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-3';
const inp = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400';
const btn = 'rounded-lg bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2';
const btn2 = 'rounded-lg bg-slate-800 border border-slate-600 text-xs px-3 py-2 text-white';
const HOUR_H = 60;
const HUES = [262, 190, 340, 38, 150, 210, 12, 290, 80, 170];
const TZ_KEY = 'tm_cal_tz';

const keyParts = (k: string) => { const [y, m, d] = k.split('-').map(Number); return { y, m, d }; };
const keyLabel = (k: string) => { const p = keyParts(k); return `${p.d} ${MONTHS_LONG[p.m - 1].slice(0, 3)}`; };
const hour12 = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;

// Overlapping classes are placed side by side
function layout<T extends { a: number; b: number }>(items: T[]): (T & { col: number; cols: number })[] {
  const sorted = [...items].sort((x, y) => x.a - y.a || y.b - x.b);
  const out: (T & { col: number; cols: number })[] = [];
  let cluster: (T & { col: number; cols: number })[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => { cluster.forEach(c => { c.cols = Math.max(1, colEnds.length); }); out.push(...cluster); cluster = []; colEnds = []; };
  for (const it of sorted) {
    if (cluster.length && it.a >= clusterEnd) flush();
    let col = colEnds.findIndex(e => e <= it.a);
    if (col === -1) { col = colEnds.length; colEnds.push(it.b); } else colEnds[col] = it.b;
    cluster.push({ ...it, col, cols: 1 });
    clusterEnd = Math.max(clusterEnd, it.b);
  }
  flush();
  return out;
}

export const ScheduleCalendar: React.FC<{ role: Role; sessions: any[]; actions?: CalendarActions; initialView?: View }> = ({ role, sessions, actions, initialView }) => {
  const readTz = () => { try { return localStorage.getItem(TZ_KEY) || ''; } catch { return ''; } };
  const [tz, setTzState] = useState<string>(() => readTz() || browserTz());
  const [profileTz, setProfileTz] = useState<string | null>(null);
  const [view, setView] = useState<View>(() => initialView || (typeof window !== 'undefined' && window.innerWidth < 700 ? 'agenda' : 'week'));
  const [cursor, setCursor] = useState<string>(() => dayKeyOf(Date.now(), readTz() || browserTz()));
  const [fStudent, setFStudent] = useState('');
  const [fTutor, setFTutor] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [sel, setSel] = useState<Ev | null>(null);
  const [tzMsg, setTzMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const setTz = (t: string) => { setTzState(t); try { localStorage.setItem(TZ_KEY, t); } catch { /* ignore */ } };

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    apiJson<{ user: any }>('/api/auth/me').then(r => {
      const p = resolveTz(r.user?.timezone, r.user?.country);
      if (!p.guessed) { setProfileTz(p.tz); if (!readTz()) setTzState(p.tz); }
    }).catch(() => undefined);
  }, []);

  const todayKey = dayKeyOf(now, tz);

  /* ---------- events ---------- */
  const all: Ev[] = useMemo(() => sessions.map(s => {
    const st = new Date(s.starts_at).getTime(), en = new Date(s.ends_at).getTime();
    const sr = resolveTz(s.student_timezone, s.student_country);
    const hueKey = role === 'student' ? Number(s.tutor_id) : Number(s.student_id);
    return {
      s, id: s.id, st, en, stz: sr.tz, sGuess: sr.guessed, ttz: resolveTz(s.tutor_timezone, s.tutor_country).tz,
      hue: HUES[Math.abs(hueKey || 0) % HUES.length], live: s.status === 'scheduled' && st <= now && en >= now
    };
  }).filter(e => !isNaN(e.st) && !isNaN(e.en)), [sessions, role, now]);

  const students = useMemo(() => [...new Map(all.map(e => [String(e.s.student_id), e.s.student_name])).entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]))), [all]);
  const tutors = useMemo(() => [...new Map(all.map(e => [String(e.s.tutor_id), e.s.tutor_name])).entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]))), [all]);

  const events = useMemo(() => all.filter(e =>
    (showCancelled || e.s.status !== 'cancelled') &&
    (!fStudent || String(e.s.student_id) === fStudent) &&
    (!fTutor || String(e.s.tutor_id) === fTutor)
  ).sort((a, b) => a.st - b.st), [all, showCancelled, fStudent, fTutor]);

  const byDay = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of events) { const k = dayKeyOf(e.st, tz); m.set(k, [...(m.get(k) || []), e]); }
    return m;
  }, [events, tz]);

  /* ---------- range for the current view ---------- */
  const weekStart = addDaysKey(cursor, -((dowOfKey(cursor) + 6) % 7)); // weeks start on Monday
  const monthStart = (() => { const p = keyParts(cursor); return `${p.y}-${String(p.m).padStart(2, '0')}-01`; })();
  const range: string[] = useMemo(() => {
    if (view === 'day') return [cursor];
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i));
    if (view === 'agenda') return Array.from({ length: 14 }, (_, i) => addDaysKey(cursor, i));
    const gridStart = addDaysKey(monthStart, -((dowOfKey(monthStart) + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => addDaysKey(gridStart, i));
  }, [view, cursor, weekStart, monthStart]);

  const inPeriod = useMemo(() => {
    const keys = view === 'month' ? range.filter(k => k.slice(0, 7) === monthStart.slice(0, 7)) : range;
    return keys.flatMap(k => byDay.get(k) || []);
  }, [view, range, byDay, monthStart]);
  const hours = inPeriod.filter(e => e.s.status !== 'cancelled').reduce((a, e) => a + (e.en - e.st) / 3600000, 0);

  const go = (dir: -1 | 1) => {
    if (view === 'week') setCursor(addDaysKey(cursor, 7 * dir));
    else if (view === 'day') setCursor(addDaysKey(cursor, dir));
    else if (view === 'agenda') setCursor(addDaysKey(cursor, 14 * dir));
    else { const p = keyParts(monthStart); const d = new Date(Date.UTC(p.y, p.m - 1 + dir, 1)); setCursor(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`); }
  };

  const title = (() => {
    if (view === 'month') { const p = keyParts(monthStart); return `${MONTHS_LONG[p.m - 1]} ${p.y}`; }
    if (view === 'day') return fmtDate(dayStartUtc(cursor, tz) + 3600000 * 12, tz);
    const a = range[0], b = range[range.length - 1];
    return `${keyLabel(a)} - ${keyLabel(b)} ${keyParts(b).y}`;
  })();

  /* ---------- time grid (week / day) ---------- */
  const columns = useMemo(() => {
    if (view !== 'week' && view !== 'day') return [];
    return range.map(key => {
      const ds = dayStartUtc(key, tz), de = dayStartUtc(addDaysKey(key, 1), tz);
      const items = events.filter(e => e.st < de && e.en > ds).map(e => {
        const a = e.st >= ds ? partsInTz(e.st, tz).h * 60 + partsInTz(e.st, tz).mi : 0;
        let b = e.en <= de ? partsInTz(e.en, tz).h * 60 + partsInTz(e.en, tz).mi : 1440;
        if (b <= a) b = 1440;
        return { e, a, b: Math.max(b, a + 28) };
      });
      return { key, items: layout(items) };
    });
  }, [events, range, tz, view]);

  useEffect(() => {
    if ((view !== 'week' && view !== 'day') || !scrollRef.current) return;
    const mins = columns.flatMap(c => c.items.map(i => i.a));
    const target = mins.length ? Math.max(0, Math.min(...mins) / 60 - 1) : (range.includes(todayKey) ? Math.max(0, partsInTz(now, tz).h - 1) : 8);
    scrollRef.current.scrollTop = target * HOUR_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursor, tz, fStudent, fTutor, showCancelled]);

  /* ---------- world clock: where the students are right now ---------- */
  const clocks = useMemo(() => {
    if (role === 'student') return [];
    const m = new Map<string, Set<string>>();
    for (const e of all) if (e.s.status === 'scheduled' && e.en >= now - 3600000) m.set(e.stz, (m.get(e.stz) || new Set()).add(String(e.s.student_id)));
    return [...m.entries()].map(([z, set]) => ({ tz: z, n: set.size })).sort((a, b) => offsetMinutes(now, b.tz) - offsetMinutes(now, a.tz)).slice(0, 10);
  }, [all, now, role]);

  /* ---------- small renderers ---------- */
  const who = (e: Ev) => role === 'student' ? e.s.tutor_name : e.s.student_name;
  const sub = (e: Ev) => role === 'admin' ? `with ${e.s.tutor_name}` : e.s.title;
  const colors = (e: Ev) => ({ background: `hsl(${e.hue} 55% 26%)`, borderColor: `hsl(${e.hue} 85% 65%)` });
  const cancelled = (e: Ev) => e.s.status === 'cancelled';
  const done = (e: Ev) => e.s.status === 'completed';
  const showStudentTz = (e: Ev) => role !== 'student' && e.stz !== tz;
  const studentLocal = (e: Ev) => `${fmtTimeZ(e.st, e.stz)}`;

  const chip = (e: Ev, compact = false) => (
    <button key={e.id} onClick={() => setSel(e)} title={`${who(e)} - ${e.s.title || ''}`}
      className={`w-full text-left rounded-md border-l-4 px-1.5 py-0.5 text-[11px] leading-tight text-white truncate ${cancelled(e) ? 'opacity-45 line-through' : done(e) ? 'opacity-70' : ''} ${e.live ? 'ring-2 ring-amber-300' : ''}`}
      style={colors(e)}>
      {fmtTime(e.st, tz).replace(':00', '')} {who(e)}{compact ? '' : ''}
    </button>
  );

  const grid = (
    <div className="overflow-x-auto rounded-xl border border-indigo-900/60">
      <div style={{ minWidth: view === 'day' ? 360 : 780 }}>
        <div className="flex bg-[#1a0f40] border-b border-indigo-900/60 sticky top-0 z-10">
          <div className="w-12 shrink-0" />
          {columns.map(c => {
            const p = keyParts(c.key);
            const isToday = c.key === todayKey;
            return (
              <button key={c.key} onClick={() => { setCursor(c.key); setView('day'); }}
                className={`flex-1 py-2 text-center text-xs border-l border-indigo-900/40 ${isToday ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                {WEEKDAYS_SHORT[dowOfKey(c.key)]} <span className={isToday ? 'px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950' : ''}>{p.d}</span>
              </button>
            );
          })}
        </div>
        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 560 }}>
          <div className="flex relative" style={{ height: 24 * HOUR_H }}>
            <div className="w-12 shrink-0 relative text-[10px] text-slate-500">
              {Array.from({ length: 24 }, (_, h) => h).map(h => <div key={h} className="absolute right-1.5" style={{ top: h * HOUR_H - 6 }}>{h === 0 ? '' : hour12(h)}</div>)}
            </div>
            {columns.map(c => (
              <div key={c.key} className={`flex-1 relative border-l border-indigo-900/40 ${c.key === todayKey ? 'bg-indigo-500/5' : ''}`}
                style={{ backgroundImage: 'linear-gradient(to bottom, rgba(129,140,248,.14) 1px, transparent 1px)', backgroundSize: `100% ${HOUR_H}px` }}>
                {c.key === todayKey && (
                  <div className="absolute left-0 right-0 z-20 border-t-2 border-red-500 pointer-events-none" style={{ top: ((partsInTz(now, tz).h * 60 + partsInTz(now, tz).mi) / 60) * HOUR_H }}>
                    <span className="absolute -left-1 -top-1.5 w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                )}
                {c.items.map(({ e, a, b, col, cols }) => {
                  const h = ((b - a) / 60) * HOUR_H - 2;
                  return (
                    <button key={e.id} onClick={() => setSel(e)}
                      className={`absolute text-left overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-white text-[11px] leading-tight ${cancelled(e) ? 'opacity-45' : done(e) ? 'opacity-70' : ''} ${e.live ? 'ring-2 ring-amber-300' : ''}`}
                      style={{ ...colors(e), top: (a / 60) * HOUR_H + 1, height: h, left: `calc(${(col / cols) * 100}% + 1px)`, width: `calc(${100 / cols}% - 3px)` }}>
                      <div className={`font-bold truncate ${cancelled(e) ? 'line-through' : ''}`}>{fmtTime(e.st, tz)} {who(e)}</div>
                      {h >= 40 && (showStudentTz(e)
                        ? <div className="truncate text-amber-200">Student: {studentLocal(e)}</div>
                        : <div className="truncate opacity-80">{sub(e)}</div>)}
                      {h >= 56 && showStudentTz(e) && <div className="truncate opacity-80">{sub(e)}</div>}
                      {done(e) && h >= 30 && <div className="text-emerald-300">Done</div>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const month = (
    <div className="overflow-x-auto rounded-xl border border-indigo-900/60">
      <div style={{ minWidth: 640 }}>
        <div className="grid grid-cols-7 bg-[#1a0f40] text-center text-[11px] text-slate-400 py-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {range.map(k => {
            const list = byDay.get(k) || [];
            const inMonth = k.slice(0, 7) === monthStart.slice(0, 7);
            return (
              <div key={k} className={`min-h-[92px] border-t border-l border-indigo-900/40 p-1 space-y-0.5 ${inMonth ? '' : 'opacity-40'} ${k === todayKey ? 'bg-indigo-500/10' : ''}`}>
                <button onClick={() => { setCursor(k); setView('day'); }} className={`text-[11px] ${k === todayKey ? 'px-1.5 rounded-full bg-amber-400 text-slate-950 font-bold' : 'text-slate-300'}`}>{keyParts(k).d}</button>
                {list.slice(0, 3).map(e => chip(e))}
                {list.length > 3 && <button onClick={() => { setCursor(k); setView('day'); }} className="text-[10px] text-amber-300">+{list.length - 3} more</button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const agenda = (
    <div className="space-y-3">
      {range.every(k => !(byDay.get(k) || []).length) && <p className="text-xs text-slate-400">No classes in these 14 days.</p>}
      {range.map(k => {
        const list = byDay.get(k) || [];
        if (!list.length) return null;
        return (
          <div key={k} className="space-y-1">
            <div className={`text-[11px] font-bold uppercase tracking-wide ${k === todayKey ? 'text-emerald-300' : 'text-amber-300'}`}>{fmtDate(dayStartUtc(k, tz) + 43200000, tz)}{k === todayKey ? ' - Today' : ''}</div>
            {list.map(e => (
              <button key={e.id} onClick={() => setSel(e)} className={`w-full text-left flex gap-3 text-xs p-2.5 rounded-xl border-l-4 border bg-[#1a0f40] border-indigo-800/40 ${cancelled(e) ? 'opacity-50' : ''} ${e.live ? 'ring-2 ring-amber-300' : ''}`} style={{ borderLeftColor: `hsl(${e.hue} 85% 65%)` }}>
                <div className="w-24 shrink-0">
                  <div className="text-white font-bold">{fmtTime(e.st, tz)}</div>
                  <div className="text-slate-500">{fmtTime(e.en, tz)} {tzAbbr(e.st, tz)}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-white font-semibold truncate ${cancelled(e) ? 'line-through' : ''}`}>{who(e)}{e.live && <span className="ml-2 text-amber-300">LIVE NOW</span>}{e.s.rescheduled ? <span className="ml-2 text-amber-300 font-normal">(rescheduled)</span> : null}{cancelled(e) ? <span className="ml-2 text-red-300 font-normal">(cancelled)</span> : null}{done(e) ? <span className="ml-2 text-emerald-300 font-normal">(done)</span> : null}</div>
                  <div className="text-slate-400 truncate">{e.s.title}{role === 'admin' ? ` - Teacher: ${e.s.tutor_name}` : ''}</div>
                  {showStudentTz(e) && <div className="text-amber-200">Student time: {fmtDateShort(e.st, e.stz)}, {studentLocal(e)} ({cityLabel(e.stz)}){isOddHour(e.st, e.en, e.stz) ? ' - odd hour' : ''}</div>}
                </div>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-white">Class calendar {role === 'admin' ? '(all students)' : ''}</h3>
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          {(['day', 'week', 'month', 'agenda'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs capitalize ${view === v ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-white'}`}>{v === 'agenda' ? 'List' : v}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={btn2} onClick={() => go(-1)} aria-label="Previous">&lsaquo;</button>
        <button className={btn2} onClick={() => setCursor(todayKey)}>Today</button>
        <button className={btn2} onClick={() => go(1)} aria-label="Next">&rsaquo;</button>
        <div className="text-sm font-bold text-white ml-1">{title}</div>
        <div className="text-[11px] text-slate-400 ml-auto">{inPeriod.length} classes &bull; {hours.toFixed(hours % 1 ? 1 : 0)} hrs</div>
      </div>

      <div className="flex flex-wrap items-end gap-2 p-2.5 rounded-xl bg-[#1a0f40] border border-indigo-800/50">
        <label className="text-[11px] text-slate-400 space-y-0.5 block min-w-[200px] flex-1">
          Show times in
          <TzSelect value={tz} onChange={setTz} className={inp + ' w-full'} pinned={[{ id: browserTz(), label: `My device (${cityLabel(browserTz())}, ${tzAbbr(now, browserTz())})` }, ...(profileTz ? [{ id: profileTz, label: `My profile (${cityLabel(profileTz)})` }] : [])]} />
        </label>
        {role !== 'student' && students.length > 1 && (
          <label className="text-[11px] text-slate-400 space-y-0.5 block">Student
            <select className={inp + ' block'} value={fStudent} onChange={e => setFStudent(e.target.value)}>
              <option value="">All students</option>{students.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
          </label>
        )}
        {role === 'admin' && tutors.length > 1 && (
          <label className="text-[11px] text-slate-400 space-y-0.5 block">Teacher
            <select className={inp + ' block'} value={fTutor} onChange={e => setFTutor(e.target.value)}>
              <option value="">All teachers</option>{tutors.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 pb-2"><input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} /> Show cancelled</label>
        {role !== 'admin' && tz !== profileTz && (
          <button className={btn2} onClick={async () => { try { await apiJson('/api/me/timezone', { method: 'PATCH', body: JSON.stringify({ timezone: tz }) }); setProfileTz(tz); setTzMsg('Saved as your timezone.'); } catch (e: any) { setTzMsg(e.message); } }}>Save as my timezone</button>
        )}
      </div>
      {tzMsg && <div className="text-[11px] text-emerald-300">{tzMsg}</div>}

      {clocks.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">Students' local time right now</div>
          <div className="flex flex-wrap gap-1.5">
            {clocks.map(c => {
              const night = partsInTz(now, c.tz).h < 6 || partsInTz(now, c.tz).h >= 22;
              return (
                <div key={c.tz} className={`px-2 py-1 rounded-lg text-[11px] border ${night ? 'bg-slate-900 border-slate-600 text-slate-300' : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-100'}`}>
                  <span className="font-bold">{cityLabel(c.tz)}</span> {fmtTime(now, c.tz)} {tzAbbr(now, c.tz)} <span className="text-slate-500">({c.n} student{c.n > 1 ? 's' : ''})</span>{night ? ' - night' : ''}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {events.length === 0 && <p className="text-xs text-slate-400">No classes scheduled yet.</p>}
      {(view === 'week' || view === 'day') && grid}
      {view === 'month' && month}
      {view === 'agenda' && agenda}

      {sel && <ClassDetails ev={sel} role={role} tz={tz} actions={actions} onClose={() => setSel(null)} />}
    </div>
  );
};

/* ---------------- class details: same class in every time zone ---------------- */
const ClassDetails: React.FC<{ ev: Ev; role: Role; tz: string; actions?: CalendarActions; onClose: () => void }> = ({ ev, role, tz, actions, onClose }) => {
  const { s, st, en, stz, ttz } = ev;
  const [mode, setMode] = useState<'' | 'move' | 'cancel'>('');
  const [moveVal, setMoveVal] = useState('');
  const [moveTz, setMoveTz] = useState(ttz);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canEdit = (role === 'admin' || role === 'tutor') && !!actions;
  const upcoming = s.status === 'scheduled';

  const row = (label: string, z: string, extra?: string) => {
    const odd = isOddHour(st, en, z);
    return (
      <div className="flex flex-wrap items-start justify-between gap-x-3 py-1.5 border-b border-indigo-900/40 last:border-0">
        <div className="text-slate-400 w-24 shrink-0">{label}<div className="text-[10px] text-slate-500">{cityLabel(z)}</div></div>
        <div className="flex-1 text-right sm:text-left">
          <div className="text-white font-bold">{fmtTime(st, z)} - {fmtTime(en, z)} <span className="text-amber-300">{tzAbbr(st, z)}</span></div>
          <div className="text-slate-400">{fmtDate(st, z)} &bull; {offsetLabel(st, z)}{extra ? ` ${extra}` : ''}{odd ? ' \u2022 odd hour (night / early morning)' : ''}</div>
        </div>
      </div>
    );
  };

  const moveIso = moveVal ? localInputToIso(moveVal, moveTz) : null;
  const moveMs = moveIso ? new Date(moveIso).getTime() : null;
  const dur = en - st;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr(null);
    try { await fn(); onClose(); } catch (e: any) { setErr(e.message || 'Something went wrong'); } finally { setBusy(false); }
  };

  const join = s.meet_link || s.meeting_url;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#140b33] border border-indigo-800 p-5 space-y-3 text-xs" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-bold text-white">{s.title || 'Class'}</div>
            <div className="text-slate-300">
              {role !== 'student' && <>Student: <span className="text-white font-semibold">{s.student_name}</span>{s.student_country ? ` (${s.student_country})` : ''} &bull; </>}
              {role !== 'tutor' && <>Teacher: <span className="text-white font-semibold">{s.tutor_name}</span></>}
            </div>
          </div>
          <button className={btn2} onClick={onClose}>Close</button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={`px-2 py-0.5 rounded-full border ${s.status === 'cancelled' ? 'border-red-500/50 text-red-300' : s.status === 'completed' ? 'border-emerald-500/50 text-emerald-300' : ev.live ? 'border-amber-400 text-amber-300' : 'border-indigo-500/50 text-indigo-200'}`}>{ev.live ? 'Live now' : s.status}</span>
          {s.rescheduled ? <span className="px-2 py-0.5 rounded-full border border-amber-500/50 text-amber-300">Rescheduled</span> : null}
          {s.series_id ? <span className="px-2 py-0.5 rounded-full border border-violet-500/50 text-violet-300">Weekly series</span> : null}
          <span className="px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">{Math.round(dur / 60000)} min</span>
        </div>
        {s.cancel_reason && <div className="text-slate-400">Reason: {s.cancel_reason}</div>}

        <div className="rounded-xl bg-[#1a0f40] border border-indigo-800/50 px-3">
          {row(role === 'tutor' ? 'You (teacher)' : 'Teacher', ttz)}
          {row(role === 'student' ? 'You (student)' : 'Student', stz, ev.sGuess ? '(assumed from country)' : '')}
          {tz !== ttz && tz !== stz && row('Calendar view', tz)}
        </div>
        {ev.sGuess && role === 'admin' && <div className="text-[11px] text-slate-500">Student timezone is not set. Set the exact one in Users so every time here is exact.</div>}

        <div className="flex flex-wrap gap-2">
          {join && upcoming && <a href={join} target="_blank" rel="noopener noreferrer" className={btn}>Join class</a>}
          {s.whiteboard_link && <a href={s.whiteboard_link} target="_blank" rel="noopener noreferrer" className={btn2}>Whiteboard</a>}
          {s.assignment_link && <a href={s.assignment_link} target="_blank" rel="noopener noreferrer" className={btn2}>Assignment</a>}
        </div>

        {canEdit && (
          <div className="space-y-2 pt-1">
            {mode === '' && (
              <div className="flex flex-wrap gap-2">
                {upcoming && actions!.reschedule && <button className={btn2} onClick={() => { setMode('move'); setMoveVal(isoToLocalInput(s.starts_at, moveTz)); }}>Reschedule</button>}
                {upcoming && actions!.cancel && <button className={btn2} onClick={() => setMode('cancel')}>Cancel class</button>}
                {s.status === 'cancelled' && st > Date.now() && actions!.restore && <button className={btn2} disabled={busy} onClick={() => run(() => actions!.restore!(s.id))}>Restore class</button>}
              </div>
            )}
            {mode === 'move' && (
              <div className="space-y-2 p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50">
                <div className="font-bold text-white">New date and time</div>
                <label className="block text-[11px] text-slate-400">I am typing the time in
                  <TzSelect value={moveTz} onChange={t => { const cur = moveIso; setMoveTz(t); if (cur) setMoveVal(isoToLocalInput(cur, t)); }}
                    pinned={[{ id: ttz, label: `Teacher's time (${cityLabel(ttz)}, ${tzAbbr(st, ttz)})` }, { id: stz, label: `Student's time (${cityLabel(stz)}, ${tzAbbr(st, stz)})` }]} />
                </label>
                <input className={inp + ' w-full'} type="datetime-local" value={moveVal} onChange={e => setMoveVal(e.target.value)} />
                {moveMs && (
                  <div className="text-[11px] text-emerald-300 space-y-0.5">
                    <div>Teacher: {fmtDate(moveMs, ttz)}, {fmtTimeZ(moveMs, ttz)}</div>
                    <div>Student: {fmtDate(moveMs, stz)}, {fmtTimeZ(moveMs, stz)}{isOddHour(moveMs, moveMs + dur, stz) ? ' - odd hour for the student' : ''}</div>
                  </div>
                )}
                <input className={inp + ' w-full'} placeholder="Reason (optional, sent in the notification)" value={reason} onChange={e => setReason(e.target.value)} />
                <div className="flex gap-2">
                  <button className={btn} disabled={busy || !moveIso} onClick={() => run(() => actions!.reschedule!(s.id, moveIso!, reason.trim()))}>Move class</button>
                  <button className={btn2} onClick={() => setMode('')}>Back</button>
                </div>
              </div>
            )}
            {mode === 'cancel' && (
              <div className="space-y-2 p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50">
                <input className={inp + ' w-full'} placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} />
                <div className="flex gap-2">
                  <button className={btn} disabled={busy} onClick={() => run(() => actions!.cancel!(s, reason.trim()))}>Yes, cancel this class</button>
                  <button className={btn2} onClick={() => setMode('')}>Back</button>
                </div>
              </div>
            )}
            {err && <div className="text-red-300">{err}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
