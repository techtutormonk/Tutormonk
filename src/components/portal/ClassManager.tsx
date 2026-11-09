import React, { useEffect, useState } from 'react';
import { apiJson } from '../../utils/api';
import { TopicsSection } from './CalendarTopics';
import { ScheduleCalendar } from './ScheduleCalendar';
import { TzSelect } from './TzSelect';
import { browserTz, cityLabel, DEFAULT_TZ, dayKeyOf, fmtDate, fmtTimeZ, isOddHour, isoToLocalInput, localInputToIso, resolveTz, tzAbbr } from '../../utils/timezone';
import { generateOccurrences, MAX_OCCURRENCES } from '../../utils/recurrence';

const box = 'bg-violet-950/40 p-4 rounded-2xl border border-violet-500/20 space-y-3';
const inp = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 w-full';
const btn = 'rounded-lg bg-amber-400 text-slate-950 font-bold text-sm px-3 py-2';
const fmt = (d: any) => (d ? `${fmtDate(new Date(d).getTime(), browserTz())}, ${fmtTimeZ(new Date(d).getTime(), browserTz())}` : '-');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const btn2 = 'rounded-lg bg-slate-800 border border-slate-600 text-white text-xs px-2.5 py-1.5';
const todayStr = () => dayKeyOf(Date.now(), DEFAULT_TZ);
interface AssignRow { tutor_id: string; course_id: string; classes_total: string }
const emptyRow = (): AssignRow => ({ tutor_id: '', course_id: '', classes_total: '10' });

export function ClassManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // forms
  const [enrStudent, setEnrStudent] = useState('');
  const [rows, setRows] = useState<AssignRow[]>([emptyRow()]);
  // recurring schedule
  const [repeat, setRepeat] = useState(false);
  const [rec, setRec] = useState<{ startDate: string; days: number[]; time: string; times: Record<number, string>; endType: 'count' | 'until'; count: string; until: string; interval: string }>(
    { startDate: todayStr(), days: [], time: '17:00', times: {}, endType: 'count', count: '12', until: '', interval: '1' });
  // per-class overrides
  // The zone the admin is typing times in. Default India; switch to the student's zone to type e.g. "5 PM New York".
  const [entryTz, setEntryTz] = useState<string>(DEFAULT_TZ);
  const [moveTz, setMoveTz] = useState<string>(DEFAULT_TZ);
  const [moveId, setMoveId] = useState<number | null>(null);
  const [moveAt, setMoveAt] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [alId, setAlId] = useState<number | null>(null);
  const [alVal, setAlVal] = useState('');
  const [cls, setCls] = useState({ enrollment_id: '', title: '', starts_at: '', duration_min: '60', meeting_url: '', meet_link: '', whiteboard_link: '' });
  const [crs, setCrs] = useState({ title: '', country: '', category: '', grade_band: '', price: '', currency: 'INR' });
  const [editId, setEditId] = useState<number | null>(null);
  const [lk, setLk] = useState({ meet_link: '', whiteboard_link: '' });
  const [inv, setInv] = useState({ student_id: '', amount: '', description: '', due_date: '', currency: 'INR' });

  const load = async () => {
    const [s, t, c, e, se, iv] = await Promise.allSettled([
      apiJson<any[]>('/api/users?role=student'),
      apiJson<any[]>('/api/users?role=tutor'),
      apiJson<any[]>('/api/courses'),
      apiJson<any[]>('/api/enrollments'),
      apiJson<any[]>('/api/sessions'),
      apiJson<any[]>('/api/invoices')
    ]);
    if (s.status === 'fulfilled') setStudents(s.value);
    if (t.status === 'fulfilled') setTutors(t.value);
    if (c.status === 'fulfilled') setCourses(c.value);
    if (e.status === 'fulfilled') setEnrollments(e.value);
    if (se.status === 'fulfilled') setSessions(se.value);
    if (iv.status === 'fulfilled') setInvoices(iv.value);
  };
  useEffect(() => { load(); }, []);

  const run = async (fn: () => Promise<any>, ok: string) => {
    setErr(null); setMsg(null);
    try { await fn(); if (ok) setMsg(ok); await load(); } catch (e: any) { setErr(e.message); }
  };

  const addAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    const items = rows.filter(r => r.tutor_id && r.course_id);
    if (!enrStudent) return setErr('Select a student.');
    if (!items.length) return setErr('Add at least one teacher with a course.');
    const keys = items.map(r => `${r.tutor_id}-${r.course_id}`);
    if (new Set(keys).size !== keys.length) return setErr('The same teacher and course is listed twice.');
    run(async () => {
      const r: any = await apiJson('/api/enrollments/bulk', { method: 'POST', body: JSON.stringify({
        student_id: Number(enrStudent),
        assignments: items.map(x => ({ tutor_id: Number(x.tutor_id), course_id: Number(x.course_id), classes_total: Number(x.classes_total) || 10 }))
      }) });
      setRows([emptyRow()]);
      setMsg(`${r.created.length} teacher assignment(s) added${r.skipped.length ? `, ${r.skipped.length} already existed` : ''}.`);
    }, '');
  };

  const setEnrollmentStatus = (id: number, status: string) =>
    run(() => apiJson(`/api/enrollments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }), status === 'cancelled' ? 'Assignment removed.' : 'Assignment updated.');

  const selEn = enrollments.find(x => String(x.id) === cls.enrollment_id);
  const selStudentTz = selEn ? resolveTz(students.find(u => u.id === selEn.student_id)?.timezone, students.find(u => u.id === selEn.student_id)?.country).tz : null;
  const selTutorTz = selEn ? resolveTz(tutors.find(u => u.id === selEn.tutor_id)?.timezone, tutors.find(u => u.id === selEn.tutor_id)?.country).tz : null;
  const tzPinned = [
    { id: DEFAULT_TZ, label: 'India time (IST)' },
    ...(selTutorTz && selTutorTz !== DEFAULT_TZ ? [{ id: selTutorTz, label: `Teacher's time (${cityLabel(selTutorTz)})` }] : []),
    ...(selStudentTz && selStudentTz !== DEFAULT_TZ && selStudentTz !== selTutorTz ? [{ id: selStudentTz, label: `Student's time (${cityLabel(selStudentTz)})` }] : [])
  ];
  // shows the same class time in India and in the student's country
  const both = (ms: number) => {
    const parts = [`${fmtDate(ms, DEFAULT_TZ)}, ${fmtTimeZ(ms, DEFAULT_TZ)}`];
    if (selStudentTz && selStudentTz !== DEFAULT_TZ) parts.push(`Student (${cityLabel(selStudentTz)}): ${fmtDate(ms, selStudentTz)}, ${fmtTimeZ(ms, selStudentTz)}${isOddHour(ms, ms + (Number(cls.duration_min) || 60) * 60000, selStudentTz) ? ' - odd hour' : ''}`);
    return parts.join('  |  ');
  };
  // existing (not cancelled) classes that overlap the new ones, for the same teacher or the same student
  const clashes = (starts: number[]) => {
    const dur = (Number(cls.duration_min) || 60) * 60000;
    if (!selEn) return [] as any[];
    return sessions.filter(x => x.status === 'scheduled' && (x.tutor_id === selEn.tutor_id || x.student_id === selEn.student_id) &&
      starts.some(t => t < new Date(x.ends_at).getTime() && t + dur > new Date(x.starts_at).getTime()));
  };
  const occurrences = React.useMemo(() => generateOccurrences({
    timeZone: entryTz,
    startDate: rec.startDate,
    slots: rec.days.map(d => ({ day: d, time: rec.times[d] || rec.time })),
    end: rec.endType === 'count' ? { type: 'count', count: Number(rec.count) || 1 } : { type: 'until', until: rec.until },
    intervalWeeks: Number(rec.interval) || 1
  }), [rec]);

  const addClass = (e: React.FormEvent) => {
    e.preventDefault();
    const en = enrollments.find(x => String(x.id) === cls.enrollment_id);
    if (!en) return setErr('Select an enrollment first.');
    if (repeat) {
      if (!rec.days.length) return setErr('Select at least one day of the week.');
      if (rec.endType === 'until' && !rec.until) return setErr('Select the end date.');
      if (!occurrences.length) return setErr('No classes match this schedule.');
      const c2 = clashes(occurrences.map(d => d.getTime()));
      if (c2.length && !window.confirm(`${c2.length} existing class(es) clash with this schedule (first: ${c2[0].student_name} with ${c2[0].tutor_name} at ${fmt(c2[0].starts_at)}).\nSchedule anyway?`)) return;
      return run(() => apiJson('/api/sessions/recurring', { method: 'POST', body: JSON.stringify({
        enrollment_id: en.id, tutor_id: en.tutor_id, student_id: en.student_id,
        title: cls.title || en.course_title,
        duration_min: Number(cls.duration_min) || 60,
        meet_link: cls.meet_link, whiteboard_link: cls.whiteboard_link,
        occurrences: occurrences.map(d => d.toISOString()),
        rule: { timeZone: entryTz, days: rec.days, time: rec.time, times: rec.times, end: rec.endType === 'count' ? { count: Number(rec.count) } : { until: rec.until }, intervalWeeks: Number(rec.interval) || 1, startDate: rec.startDate }
      }) }), `${occurrences.length} recurring classes scheduled.`);
    }
    if (!cls.starts_at) return setErr('Select date and time.');
    const iso = localInputToIso(cls.starts_at, entryTz);   // time typed in the chosen zone -> UTC
    if (!iso) return setErr('Select a valid date and time.');
    const c1 = clashes([new Date(iso).getTime()]);
    if (c1.length && !window.confirm(`Clash: ${c1.map(x => `${x.student_name} with ${x.tutor_name} at ${fmt(x.starts_at)}`).join('; ')}.\nSchedule anyway?`)) return;
    run(() => apiJson('/api/sessions', { method: 'POST', body: JSON.stringify({
      enrollment_id: en.id, tutor_id: en.tutor_id, student_id: en.student_id,
      title: cls.title || en.course_title,
      starts_at: iso,
      duration_min: Number(cls.duration_min) || 60,
      meeting_url: cls.meeting_url,
      meet_link: cls.meet_link,
      whiteboard_link: cls.whiteboard_link
    }) }), 'Class scheduled.');
  };

  const addCourse = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => apiJson('/api/courses', { method: 'POST', body: JSON.stringify({ ...crs, price: Number(crs.price) || 0 }) }), 'Course added.')
      .then(() => setCrs({ title: '', country: '', category: '', grade_band: '', price: '', currency: 'INR' }));
  };

  const addInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => apiJson('/api/invoices', { method: 'POST', body: JSON.stringify({
      student_id: Number(inv.student_id), amount: Number(inv.amount), description: inv.description, due_date: inv.due_date || null, currency: inv.currency
    }) }), 'Invoice created.');
  };

  const saveLinks = (id: number) =>
    run(() => apiJson(`/api/sessions/${id}/links`, { method: 'PATCH', body: JSON.stringify(lk) }), 'Meet / whiteboard links saved.')
      .then(() => setEditId(null));

  const rescheduleClass = (id: number) => {
    if (!moveAt || !localInputToIso(moveAt, moveTz)) return setErr('Select the new date and time.');
    run(() => apiJson(`/api/sessions/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ starts_at: localInputToIso(moveAt, moveTz), reason: moveReason.trim() || undefined }) }), 'Class rescheduled. The student and the tutor have been notified.')
      .then(() => { setMoveId(null); setMoveReason(''); });
  };
  const saveAssignmentLink = (id: number) =>
    run(() => apiJson(`/api/enrollments/${id}/assignment-link`, { method: 'PATCH', body: JSON.stringify({ assignment_link: alVal.trim() }) }), 'Permanent assignment link saved.')
      .then(() => setAlId(null));
  const cancelClass = (x: any) => {
    const reason = window.prompt(`Cancel the class on ${fmt(x.starts_at)}? Enter a reason (optional):`);
    if (reason === null) return;
    run(() => apiJson(`/api/sessions/${x.id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }), 'Class cancelled. Future classes in the series are unchanged.');
  };
  const restoreClass = (id: number) => run(() => apiJson(`/api/sessions/${id}/restore`, { method: 'POST', body: '{}' }), 'Class restored.');
  const stopSeries = (x: any) => {
    if (!window.confirm('Cancel ALL upcoming classes of this recurring series?')) return;
    run(async () => { const r: any = await apiJson(`/api/series/${x.series_id}/cancel-future`, { method: 'POST', body: '{}' }); setMsg(`${r.cancelled} upcoming class(es) cancelled.`); }, '');
  };

  const markPaid = (id: number) => run(() => apiJson(`/api/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify({ method: 'Manual' }) }), 'Invoice marked paid.');

  return (
    <div className="space-y-4">
      {msg && <div className="text-sm text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-lg px-3 py-2">{msg}</div>}
      {err && <div className="text-sm text-red-300 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Assign teachers */}
        <form onSubmit={addAssignments} className={box}>
          <h3 className="font-bold text-white">1. Assign teachers to a student</h3>
          <p className="text-[11px] text-slate-400">A student can have several teachers at the same time, one per subject or slot.</p>
          <select className={inp} value={enrStudent} onChange={e => setEnrStudent(e.target.value)} required>
            <option value="">Select student</option>
            {students.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
          {enrStudent && (
            <div className="text-[11px] text-slate-300">
              Current teachers: {enrollments.filter(x => String(x.student_id) === enrStudent && ['active', 'paused'].includes(x.status)).map(x => `${x.tutor_name} (${x.course_title})`).join(', ') || 'none yet'}
            </div>
          )}
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_auto] gap-2 items-center">
              <select className={inp} value={r.tutor_id} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, tutor_id: e.target.value } : x))}>
                <option value="">Teacher</option>
                {tutors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select className={inp} value={r.course_id} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, course_id: e.target.value } : x))}>
                <option value="">Course / subject</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input className={inp} type="number" min="1" title="Total classes" value={r.classes_total} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, classes_total: e.target.value } : x))} />
              {rows.length > 1 ? <button type="button" className={btn2} onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button> : <span />}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn2} onClick={() => setRows([...rows, emptyRow()])}>+ Add another teacher</button>
            <button className={btn} type="submit">Save assignments</button>
          </div>
        </form>

        {/* 2. Schedule class */}
        <form onSubmit={addClass} className={box}>
          <h3 className="font-bold text-white">2. Schedule classes</h3>
          <select className={inp} value={cls.enrollment_id} onChange={e => setCls({ ...cls, enrollment_id: e.target.value })} required>
            <option value="">Select enrollment</option>
            {enrollments.filter(x => x.status === 'active').map(x => <option key={x.id} value={x.id}>{x.student_name} - {x.course_title} ({x.tutor_name})</option>)}
          </select>
          <input className={inp} placeholder="Class title (optional)" value={cls.title} onChange={e => setCls({ ...cls, title: e.target.value })} />
          <label className="text-[11px] text-slate-400 block">I am typing the time in
            <TzSelect value={entryTz} onChange={setEntryTz} pinned={tzPinned} />
          </label>
          {selEn && selStudentTz && selStudentTz !== entryTz && (
            <div className="text-[11px] text-slate-400">Student is in {cityLabel(selStudentTz)} ({tzAbbr(Date.now(), selStudentTz)}). Their time is shown below before you save.</div>
          )}
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} /> Repeat weekly (recurring classes)
          </label>
          {!repeat && <input className={inp} type="datetime-local" value={cls.starts_at} onChange={e => setCls({ ...cls, starts_at: e.target.value })} required />}
          {!repeat && cls.starts_at && localInputToIso(cls.starts_at, entryTz) && (
            <div className="text-[11px] text-emerald-300 break-words">{both(new Date(localInputToIso(cls.starts_at, entryTz)!).getTime())}</div>
          )}
          {repeat && (
            <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-violet-500/20">
              <div className="text-xs font-bold text-slate-300">Repeat on</div>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d, i) => (
                  <button type="button" key={d} onClick={() => setRec({ ...rec, days: rec.days.includes(i) ? rec.days.filter(x => x !== i) : [...rec.days, i] })}
                    className={`px-2.5 py-1 rounded-lg text-xs border ${rec.days.includes(i) ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold' : 'bg-slate-900 text-slate-200 border-violet-500/30'}`}>{d}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-slate-400">Default time<input className={inp} type="time" value={rec.time} onChange={e => setRec({ ...rec, time: e.target.value })} /></label>
                <label className="text-[11px] text-slate-400">Starting from<input className={inp} type="date" value={rec.startDate} onChange={e => setRec({ ...rec, startDate: e.target.value })} /></label>
              </div>
              {rec.days.length > 1 && (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400">Different time for a day (optional)</div>
                  <div className="flex flex-wrap gap-2">
                    {[...rec.days].sort().map(d => (
                      <label key={d} className="text-[11px] text-slate-300 flex items-center gap-1">{DAYS[d]}
                        <input className={inp + ' !w-auto !py-1'} type="time" value={rec.times[d] || rec.time} onChange={e => setRec({ ...rec, times: { ...rec.times, [d]: e.target.value } })} />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-slate-400">Every
                  <select className={inp} value={rec.interval} onChange={e => setRec({ ...rec, interval: e.target.value })}>
                    <option value="1">week</option><option value="2">2 weeks</option><option value="3">3 weeks</option><option value="4">4 weeks</option>
                  </select>
                </label>
                <label className="text-[11px] text-slate-400">Ends
                  <select className={inp} value={rec.endType} onChange={e => setRec({ ...rec, endType: e.target.value as 'count' | 'until' })}>
                    <option value="count">After a number of classes</option><option value="until">On a date</option>
                  </select>
                </label>
              </div>
              {rec.endType === 'count'
                ? <input className={inp} type="number" min="1" max={MAX_OCCURRENCES} placeholder="Number of classes" value={rec.count} onChange={e => setRec({ ...rec, count: e.target.value })} />
                : <input className={inp} type="date" min={rec.startDate} value={rec.until} onChange={e => setRec({ ...rec, until: e.target.value })} />}
              <div className="text-[11px] text-emerald-300">
                {occurrences.length
                  ? `${occurrences.length} classes • first: ${both(occurrences[0].getTime())} • last: ${fmt(occurrences[occurrences.length - 1])}`
                  : 'Select days and an end condition to preview the schedule.'}
              </div>
            </div>
          )}
          <input className={inp} type="number" min="15" max="240" placeholder="Duration (minutes)" value={cls.duration_min} onChange={e => setCls({ ...cls, duration_min: e.target.value })} />
          <input className={inp} placeholder="Google Meet Link" value={cls.meet_link} onChange={e => setCls({ ...cls, meet_link: e.target.value })} />
          <input className={inp} placeholder="Whiteboard Link" value={cls.whiteboard_link} onChange={e => setCls({ ...cls, whiteboard_link: e.target.value })} />
          <button className={btn} type="submit">{repeat ? `Schedule ${occurrences.length || ""} recurring classes` : "Schedule class"}</button>
        </form>

        {/* 3. Course */}
        <form onSubmit={addCourse} className={box}>
          <h3 className="font-bold text-white">3. Add course</h3>
          <input className={inp} placeholder="Course title" value={crs.title} onChange={e => setCrs({ ...crs, title: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Country" value={crs.country} onChange={e => setCrs({ ...crs, country: e.target.value })} />
            <input className={inp} placeholder="Category" value={crs.category} onChange={e => setCrs({ ...crs, category: e.target.value })} />
            <input className={inp} placeholder="Grade band" value={crs.grade_band} onChange={e => setCrs({ ...crs, grade_band: e.target.value })} />
            <input className={inp} type="number" placeholder="Price" value={crs.price} onChange={e => setCrs({ ...crs, price: e.target.value })} />
          </div>
          <button className={btn} type="submit">Add course</button>
        </form>

        {/* 4. Invoice */}
        <form onSubmit={addInvoice} className={box}>
          <h3 className="font-bold text-white">4. Create invoice</h3>
          <select className={inp} value={inv.student_id} onChange={e => setInv({ ...inv, student_id: e.target.value })} required>
            <option value="">Select student</option>
            {students.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} type="number" min="1" placeholder="Amount" value={inv.amount} onChange={e => setInv({ ...inv, amount: e.target.value })} required />
            <select className={inp} value={inv.currency} onChange={e => setInv({ ...inv, currency: e.target.value })}>
              <option>INR</option><option>USD</option><option>AUD</option><option>GBP</option><option>CAD</option>
            </select>
          </div>
          <input className={inp} placeholder="Description" value={inv.description} onChange={e => setInv({ ...inv, description: e.target.value })} />
          <input className={inp} type="date" value={inv.due_date} onChange={e => setInv({ ...inv, due_date: e.target.value })} />
          <button className={btn} type="submit">Create invoice</button>
        </form>
      </div>

      <ScheduleCalendar role="admin" sessions={sessions} actions={{
        reschedule: async (id, iso, reason) => { await apiJson(`/api/sessions/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ starts_at: iso, reason: reason || undefined }) }); setMsg('Class rescheduled. The student and the teacher have been notified in their own time zones.'); await load(); },
        cancel: async (x, reason) => { await apiJson(`/api/sessions/${x.id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }); setMsg('Class cancelled.'); await load(); },
        restore: async id => { await apiJson(`/api/sessions/${id}/restore`, { method: 'POST', body: '{}' }); setMsg('Class restored.'); await load(); }
      }} />
      <TopicsSection role="admin" enrollments={enrollments} />

      {/* Lists */}
      <div className="overflow-x-auto bg-slate-900/60 rounded-2xl border border-violet-500/20">
        <div className="px-4 pt-3 font-bold text-white text-sm">Enrollments ({enrollments.length})</div>
        <table className="w-full text-xs text-left text-slate-200">
          <thead className="uppercase text-slate-400"><tr><th className="px-4 py-2">Student</th><th className="px-4 py-2">Course</th><th className="px-4 py-2">Tutor</th><th className="px-4 py-2">Classes</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 min-w-[220px]">Permanent assignment link</th><th className="px-4 py-2"></th></tr></thead>
          <tbody className="divide-y divide-violet-900/20">
            {enrollments.map(x => <tr key={x.id}><td className="px-4 py-2">{x.student_name}</td><td className="px-4 py-2">{x.course_title}</td><td className="px-4 py-2">{x.tutor_name}</td><td className="px-4 py-2">{x.classes_used}/{x.classes_total}</td><td className="px-4 py-2">{x.status}</td>
              <td className="px-4 py-2">
                {alId === x.id ? (
                  <div className="space-y-1">
                    <input className={inp} placeholder="https://drive.google.com/... (leave empty to clear)" value={alVal} onChange={e => setAlVal(e.target.value)} />
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold" onClick={() => saveAssignmentLink(x.id)}>Save</button>
                      <button className={btn2} onClick={() => setAlId(null)}>Close</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {x.assignment_link ? <a href={x.assignment_link} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">Open link</a> : <span className="text-slate-500">none</span>}
                    <button className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => { setAlId(x.id); setAlVal(x.assignment_link || ''); }}>{x.assignment_link ? 'Edit' : 'Add'}</button>
                  </div>
                )}
              </td>
              <td className="px-4 py-2 text-right whitespace-nowrap space-x-1">
                {x.status === 'active' && <button className={btn2} onClick={() => setEnrollmentStatus(x.id, 'paused')}>Pause</button>}
                {x.status === 'paused' && <button className={btn2} onClick={() => setEnrollmentStatus(x.id, 'active')}>Resume</button>}
                {['active', 'paused'].includes(x.status) && <button className={btn2} onClick={() => window.confirm('Remove this teacher from the student?') && setEnrollmentStatus(x.id, 'cancelled')}>Remove</button>}
              </td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto bg-slate-900/60 rounded-2xl border border-violet-500/20">
        <div className="px-4 pt-3 font-bold text-white text-sm">Classes ({sessions.length})</div>
        <table className="w-full text-xs text-left text-slate-200">
          <thead className="uppercase text-slate-400"><tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Title</th><th className="px-4 py-2">Student</th><th className="px-4 py-2">Tutor</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Meet / Whiteboard links</th><th className="px-4 py-2">Actions</th></tr></thead>
          <tbody className="divide-y divide-violet-900/20">
            {sessions.map(x => (
              <tr key={x.id}>
                <td className={`px-4 py-2 ${x.status === 'cancelled' ? 'line-through text-slate-500' : ''}`}>{fmt(x.starts_at)}{x.rescheduled ? <span className="ml-1 text-amber-300 no-underline">(moved)</span> : null}
                  {(() => { const z = resolveTz(x.student_timezone, x.student_country).tz; return z !== browserTz() ? <div className="text-[10px] text-amber-200 no-underline">Student: {fmtTimeZ(new Date(x.starts_at).getTime(), z)} ({cityLabel(z)})</div> : null; })()}</td>
                <td className="px-4 py-2">{x.title}{x.series_id ? <span className="ml-1 text-[10px] text-violet-300">↻ series</span> : null}</td><td className="px-4 py-2">{x.student_name}</td><td className="px-4 py-2">{x.tutor_name}</td>
                <td className="px-4 py-2">{x.status}{x.cancel_reason ? <div className="text-[10px] text-slate-400">{x.cancel_reason}</div> : null}</td>
                <td className="px-4 py-2 min-w-[240px]">
                  {editId === x.id ? (
                    <div className="space-y-1">
                      <input className={inp} placeholder="Google Meet link" value={lk.meet_link} onChange={e => setLk({ ...lk, meet_link: e.target.value })} />
                      <input className={inp} placeholder="Whiteboard link" value={lk.whiteboard_link} onChange={e => setLk({ ...lk, whiteboard_link: e.target.value })} />
                      <div className="flex gap-2">
                        <button className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold" onClick={() => saveLinks(x.id)}>Save</button>
                        <button className="px-2 py-1 rounded bg-slate-800 border border-slate-600" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={x.meet_link ? 'text-emerald-300' : 'text-slate-500'}>Meet: {x.meet_link ? 'added' : 'none'}</span>
                      <span className={x.whiteboard_link ? 'text-emerald-300' : 'text-slate-500'}>Board: {x.whiteboard_link ? 'added' : 'none'}</span>
                      <button className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => { setEditId(x.id); setLk({ meet_link: x.meet_link || '', whiteboard_link: x.whiteboard_link || '' }); }}>Edit</button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 min-w-[200px]">
                  {moveId === x.id ? (
                    <div className="space-y-1">
                      <TzSelect value={moveTz} onChange={t => { if (moveAt) { const iso = localInputToIso(moveAt, moveTz); if (iso) setMoveAt(isoToLocalInput(iso, t)); } setMoveTz(t); }}
                        pinned={[{ id: DEFAULT_TZ, label: 'India time (IST)' }, ...(x.student_timezone || x.student_country ? [{ id: resolveTz(x.student_timezone, x.student_country).tz, label: `Student's time (${cityLabel(resolveTz(x.student_timezone, x.student_country).tz)})` }] : [])]} />
                      <input className={inp} type="datetime-local" value={moveAt} onChange={e => setMoveAt(e.target.value)} />
                      <input className={inp} placeholder="Reason (optional, sent in the notification)" value={moveReason} onChange={e => setMoveReason(e.target.value)} />
                      <div className="flex gap-1">
                        <button className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold" onClick={() => rescheduleClass(x.id)}>Move</button>
                        <button className={btn2} onClick={() => setMoveId(null)}>Close</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {x.status === 'scheduled' && <button className={btn2} onClick={() => { setMoveId(x.id); setMoveAt(isoToLocalInput(x.starts_at, moveTz)); }}>Reschedule</button>}
                      {x.status === 'scheduled' && <button className={btn2} onClick={() => cancelClass(x)}>Cancel</button>}
                      {x.status === 'cancelled' && new Date(x.starts_at) > new Date() && <button className={btn2} onClick={() => restoreClass(x.id)}>Restore</button>}
                      {x.series_id && x.status === 'scheduled' && <button className={btn2} onClick={() => stopSeries(x)}>Stop series</button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto bg-slate-900/60 rounded-2xl border border-violet-500/20">
        <div className="px-4 pt-3 font-bold text-white text-sm">Invoices ({invoices.length})</div>
        <table className="w-full text-xs text-left text-slate-200">
          <thead className="uppercase text-slate-400"><tr><th className="px-4 py-2">Ref</th><th className="px-4 py-2">Student</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr></thead>
          <tbody className="divide-y divide-violet-900/20">
            {invoices.map(x => (
              <tr key={x.id}>
                <td className="px-4 py-2">{x.reference}</td>
                <td className="px-4 py-2">{students.find(s => s.id === x.student_id)?.name || x.student_id}</td>
                <td className="px-4 py-2">{x.currency} {x.amount}</td>
                <td className="px-4 py-2">{x.status}</td>
                <td className="px-4 py-2 text-right">{x.status !== 'paid' && <button onClick={() => markPaid(x.id)} className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Mark paid</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
