import React, { useEffect, useState } from 'react';
import { apiJson } from '../../utils/api';
import { ClassSession } from '../../types';
import { QuizSection } from './QuizSection';
import { DoubtsSection, MaterialsSection, ProgressSection } from './StudyTools';
import { TopicsSection } from './CalendarTopics';
import { ScheduleCalendar } from './ScheduleCalendar';

interface Props {
  user: { id: string; name: string; role: 'student' | 'tutor' | 'admin' };
  onLaunchClassroom: (s: ClassSession) => void;
}

const card = 'p-5 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-3';
const inp = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 w-full';
const btn = 'rounded-lg bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2';
const btn2 = 'rounded-lg bg-slate-800 border border-slate-600 text-xs px-3 py-2 text-white';
const when = (d: any) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-');

const toClassSession = (s: any): ClassSession => {
  const start = new Date(s.starts_at);
  const end = new Date(s.ends_at);
  const now = new Date();
  const live = s.status === 'scheduled' && start <= now && end >= now;
  return {
    id: String(s.id),
    subject: s.title || '1:1 Live Class',
    topic: s.is_demo ? 'Demo class' : 'Live class',
    tutorName: s.tutor_name,
    studentName: s.student_name,
    grade: '',
    date: start.toLocaleDateString(),
    time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: s.status === 'completed' ? 'Completed' : live ? 'Live Now' : 'Upcoming',
    durationMinutes: s.duration_min || 60,
    whiteboardNotes: s.notes || undefined
  };
};

export const LivePortal: React.FC<Props> = ({ user, onLaunchClassroom }) => {
  const isTutor = user.role === 'tutor';
  const isStudent = user.role === 'student';
  const [sessions, setSessions] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // tutor/student form state
  const [openId, setOpenId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [score, setScore] = useState('5');
  const [hwLink, setHwLink] = useState('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwNote, setHwNote] = useState('');
  const isUrl = (v: string) => { try { const u = new URL(v.trim()); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
  const resetHw = () => { setHwLink(''); setHwTitle(''); setHwNote(''); };
  const [hwForm, setHwForm] = useState({ enrollment_id: '', title: '', description: '', link_url: '', due_at: '' });
  const [subText, setSubText] = useState<Record<number, string>>({});
  const [grade, setGrade] = useState<Record<number, { g: string; f: string }>>({});

  const load = async () => {
    const [s, e, h, i, n] = await Promise.allSettled([
      apiJson<any[]>('/api/sessions'),
      apiJson<any[]>('/api/enrollments'),
      apiJson<any[]>('/api/homework'),
      isTutor ? Promise.resolve([] as any[]) : apiJson<any[]>('/api/invoices'),
      apiJson<any[]>('/api/notifications')
    ]);
    if (s.status === 'fulfilled') setSessions(s.value);
    if (e.status === 'fulfilled') setEnrollments(e.value);
    if (h.status === 'fulfilled') setHomework(h.value);
    if (i.status === 'fulfilled') setInvoices(i.value);
    if (n.status === 'fulfilled') setNotes(n.value);
    const failed = [s, e, h].find(x => x.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) setErr(failed.reason?.message || 'Could not load data');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  // keep notifications (e.g. "Class rescheduled") fresh without a page reload
  useEffect(() => {
    const t = setInterval(() => {
      apiJson<any[]>('/api/notifications').then(setNotes).catch(() => {});
      apiJson<any[]>('/api/sessions').then(setSessions).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const run = async (fn: () => Promise<any>, ok: string) => {
    setErr(null); setMsg(null);
    try { await fn(); setMsg(ok); await load(); return true; } catch (e: any) { setErr(e.message); return false; }
  };

  const now = Date.now();
  const upcoming = sessions.filter(s => s.status === 'scheduled' && new Date(s.ends_at).getTime() >= now)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const past = sessions.filter(s => !upcoming.includes(s));
  const next = upcoming[0];
  const hwSessionIds = new Set(homework.map(h => h.session_id).filter(Boolean));
  // homework is optional: a completed class without homework simply offers an "Add homework" button
  const needsHw = (s: any) => isTutor && s.status === 'completed' && !s.is_demo && !hwSessionIds.has(s.id);
  const unreadChanges = notes.filter(n => !n.is_read && /rescheduled|cancelled/i.test(n.title));

  const complete = (s: any) => {
    if (hwLink.trim() && !isUrl(hwLink)) { setErr('Homework link must be a valid link (https://...). Leave it empty if there is no link.'); return Promise.resolve(); }
    return run(() => apiJson(`/api/sessions/${s.id}/complete`, { method: 'POST', body: JSON.stringify({
      notes: text || undefined, homework_link: hwLink.trim() || undefined, homework_title: hwTitle || undefined, homework_description: hwNote || undefined
    }) }), 'Class completed.')
      .then(ok => { if (ok) { setText(''); resetHw(); setOpenId(null); } });
  };
  // classes completed earlier without any homework: tutor can still attach the link
  const addLateHomework = (s: any) => {
    if (hwLink.trim() && !isUrl(hwLink)) { setErr('Please paste a valid homework link (https://...).'); return Promise.resolve(); }
    if (!hwLink.trim() && !hwNote.trim()) { setErr('Add a homework link, some instructions, or both.'); return Promise.resolve(); }
    return run(() => apiJson('/api/homework', { method: 'POST', body: JSON.stringify({ session_id: s.id, link_url: hwLink.trim() || undefined, title: hwTitle || undefined, description: hwNote || undefined }) }), 'Homework added.')
      .then(ok => { if (ok) { resetHw(); setOpenId(null); } });
  };
  const remark = (s: any) => run(() => apiJson(`/api/sessions/${s.id}/remark`, { method: 'POST', body: JSON.stringify({ remark: text, understanding: Number(score) }) }), 'Remark saved.')
    .then(ok => { if (ok) { setText(''); setOpenId(null); } });

  const addHomework = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => apiJson('/api/homework', { method: 'POST', body: JSON.stringify({
      enrollment_id: Number(hwForm.enrollment_id), title: hwForm.title, description: hwForm.description, link_url: hwForm.link_url.trim() || undefined,
      due_at: hwForm.due_at ? new Date(hwForm.due_at).toISOString() : null
    }) }), 'Homework assigned.').then(ok => { if (ok) setHwForm({ enrollment_id: '', title: '', description: '', link_url: '', due_at: '' }); });
  };

  const submitHw = (h: any) => run(() => apiJson(`/api/homework/${h.id}/submit`, { method: 'POST', body: JSON.stringify({ text: subText[h.id] || '' }) }), 'Homework submitted.');
  const gradeHw = (h: any) => run(() => apiJson(`/api/homework/${h.id}/grade`, { method: 'POST', body: JSON.stringify({ grade: Number(grade[h.id]?.g), feedback: grade[h.id]?.f }) }), 'Homework graded.');
  const readNote = (id: number) => apiJson(`/api/notifications/${id}/read`, { method: 'POST', body: '{}' }).then(load).catch(() => {});

  if (loading) return <div className="text-slate-300 text-sm py-10 text-center">Loading your dashboard...</div>;

  const renderSession = (s: any, isPast = false) => (
    <div className="p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50 text-xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-white text-sm">{s.title}</div>
          <div className="text-slate-400">{when(s.starts_at)} &bull; {s.duration_min} min &bull; {isTutor ? `Student: ${s.student_name}` : `Tutor: ${s.tutor_name}`}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isPast && s.meet_link && <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1">Join Google Meet</a>}
          {!isPast && s.whiteboard_link && <a href={s.whiteboard_link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1">Join Whiteboard</a>}
          {!isPast && !s.meet_link && s.meeting_url && <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" className={btn}>Join class</a>}
          {!isPast && !s.meet_link && !s.whiteboard_link && !s.meeting_url && <span className="text-slate-500 self-center">Join link will be added by admin</span>}
          {isTutor && !isPast && <button className={btn2} onClick={() => { setOpenId(openId === s.id ? null : s.id); setText(''); resetHw(); }}>Complete / Remark</button>}
          {needsHw(s) && <button className={btn} onClick={() => { setOpenId(openId === s.id ? null : s.id); setText(''); resetHw(); }}>Add homework</button>}
          {isTutor && isPast && s.status === 'completed' && <button className={btn2} onClick={() => { setOpenId(openId === s.id ? null : s.id); setText(''); }}>Remark</button>}
        </div>
      </div>
      {isPast && <div className="text-slate-400">Status: <span className="text-amber-300">{s.status}</span>{s.notes ? ` - ${s.notes}` : ''}</div>}
      {openId === s.id && isTutor && (
        <div className="space-y-2 pt-1">
          <textarea className={inp} rows={3} placeholder="Class notes / remark for the student" value={text} onChange={e => setText(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-slate-300">Understanding (1-5)</label>
            <select className="bg-slate-900 border border-violet-500/30 rounded-lg px-2 py-1 text-white" value={score} onChange={e => setScore(e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select>
            <button className={btn2} disabled={!text.trim()} onClick={() => remark(s)}>Save remark</button>
          </div>
          {(s.status === 'scheduled' || needsHw(s)) && !s.is_demo && (
            <div className="p-3 rounded-lg bg-[#140b33] border border-amber-400/40 space-y-2">
              <div className="text-amber-300 font-bold">Homework (optional - add a link, text, or both)</div>
              <input className={inp} type="url" placeholder="https://drive.google.com/... (homework / worksheet link)" value={hwLink} onChange={e => setHwLink(e.target.value)} />
              <textarea className={inp} rows={2} placeholder="Homework text / instructions for the student" value={hwNote} onChange={e => setHwNote(e.target.value)} />
              <input className={inp} placeholder="Homework title (optional)" value={hwTitle} onChange={e => setHwTitle(e.target.value)} />
              {s.status === 'scheduled'
                ? <button className={btn} onClick={() => complete(s)}>{hwLink.trim() || hwNote.trim() ? 'Complete class & send homework' : 'Complete class (no homework)'}</button>
                : <button className={btn} disabled={!hwLink.trim() && !hwNote.trim()} onClick={() => addLateHomework(s)}>Save homework</button>}
            </div>
          )}
          {s.status === 'scheduled' && s.is_demo ? <button className={btn} onClick={() => complete(s)}>Mark demo completed</button> : null}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-900/90 via-[#221354] to-indigo-900 border border-amber-400/30">
        <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">{user.role} dashboard</div>
        <h2 className="text-2xl font-extrabold text-white">Welcome, {user.name}</h2>
        {next ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-200">Next class: <b className="text-white">{next.title}</b> &bull; {when(next.starts_at)} &bull; {isTutor ? next.student_name : next.tutor_name}</div>
            <div className="flex gap-2">
              {next.meet_link && <a href={next.meet_link} target="_blank" rel="noopener noreferrer" className={btn}>Join Google Meet</a>}
              {next.whiteboard_link && <a href={next.whiteboard_link} target="_blank" rel="noopener noreferrer" className={btn2}>Join Whiteboard</a>}
              {!next.meet_link && next.meeting_url && <a href={next.meeting_url} target="_blank" rel="noopener noreferrer" className={btn}>Join class</a>}
              {next.assignment_link && <a href={next.assignment_link} target="_blank" rel="noopener noreferrer" className={btn2}>Assignment link</a>}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-300">No class is scheduled yet. Your classes will appear here as soon as the Tutor Monk team schedules them.</p>
        )}
      </div>

      {unreadChanges.map(n => (
        <div key={n.id} className="text-sm text-amber-100 bg-amber-950/60 border border-amber-500/60 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <div><b>{n.title}:</b> {n.body}</div>
          <button className="text-amber-300 underline text-xs" onClick={() => readNote(n.id)}>Got it</button>
        </div>
      ))}

      {msg && <div className="text-sm text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-lg px-3 py-2">{msg}</div>}
      {err && <div className="text-sm text-red-300 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={card}>
            <h3 className="font-bold text-white">Upcoming classes ({upcoming.length})</h3>
            {upcoming.length === 0 && <p className="text-xs text-slate-400">Nothing scheduled.</p>}
            {upcoming.map(s => <React.Fragment key={s.id}>{renderSession(s)}</React.Fragment>)}
          </div>

          <div className={card}>
            <h3 className="font-bold text-white">Homework ({homework.length})</h3>
            {isTutor && (
              <form onSubmit={addHomework} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50">
                <select className={inp} value={hwForm.enrollment_id} onChange={e => setHwForm({ ...hwForm, enrollment_id: e.target.value })} required>
                  <option value="">Select student / course</option>
                  {enrollments.filter(x => x.status === 'active').map(x => <option key={x.id} value={x.id}>{x.student_name} - {x.course_title}</option>)}
                </select>
                <input className={inp} placeholder="Homework title" value={hwForm.title} onChange={e => setHwForm({ ...hwForm, title: e.target.value })} required />
                <input className={inp} placeholder="Instructions / homework text (optional)" value={hwForm.description} onChange={e => setHwForm({ ...hwForm, description: e.target.value })} />
                <input className={inp} type="url" placeholder="Homework link (optional)" value={hwForm.link_url} onChange={e => setHwForm({ ...hwForm, link_url: e.target.value })} />
                <input className={inp} type="datetime-local" value={hwForm.due_at} onChange={e => setHwForm({ ...hwForm, due_at: e.target.value })} />
                <button className={btn} type="submit">Assign homework</button>
              </form>
            )}
            {homework.length === 0 && <p className="text-xs text-slate-400">No homework yet.</p>}
            {homework.map(h => (
              <div key={h.id} className="p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50 text-xs space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="font-bold text-white text-sm">{h.title}</div>
                    <div className="text-slate-400">{h.description}{h.due_at ? ` - due ${when(h.due_at)}` : ''}{!isStudent ? ` - ${h.student_name}` : ''}</div>
                  </div>
                  <div className="text-amber-300 font-semibold">
                    {h.grade !== null && h.grade !== undefined ? `Graded: ${h.grade}/10` : h.submission_id ? 'Submitted' : 'Pending'}
                  </div>
                </div>
                {h.link_url && <a href={h.link_url} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold">Open homework link</a>}
                {h.feedback && <div className="text-emerald-300">Feedback: {h.feedback}</div>}
                {h.submission_text && !isStudent && <div className="text-slate-300 whitespace-pre-wrap">Answer: {h.submission_text}</div>}
                {isStudent && (h.grade === null || h.grade === undefined) && (
                  <div className="space-y-2">
                    <textarea className={inp} rows={2} placeholder="Write your answer / paste your work link" value={subText[h.id] ?? h.submission_text ?? ''} onChange={e => setSubText({ ...subText, [h.id]: e.target.value })} />
                    <button className={btn} onClick={() => submitHw(h)}>{h.submission_id ? 'Re-submit' : 'Submit homework'}</button>
                  </div>
                )}
                {isTutor && h.submission_id && (h.grade === null || h.grade === undefined) && (
                  <div className="flex flex-wrap gap-2">
                    <input className="w-24 bg-slate-900 border border-violet-500/30 text-white rounded-lg px-2 py-1" type="number" min="0" max="10" placeholder="Grade /10" value={grade[h.id]?.g || ''} onChange={e => setGrade({ ...grade, [h.id]: { g: e.target.value, f: grade[h.id]?.f || '' } })} />
                    <input className="flex-1 min-w-[140px] bg-slate-900 border border-violet-500/30 text-white rounded-lg px-2 py-1" placeholder="Feedback" value={grade[h.id]?.f || ''} onChange={e => setGrade({ ...grade, [h.id]: { g: grade[h.id]?.g || '', f: e.target.value } })} />
                    <button className={btn} disabled={grade[h.id]?.g === undefined || grade[h.id]?.g === ''} onClick={() => gradeHw(h)}>Save grade</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <QuizSection role={user.role} />

          <DoubtsSection role={user.role} enrollments={enrollments} />

          <MaterialsSection role={user.role} enrollments={enrollments} />

          <div className={card}>
            <h3 className="font-bold text-white">Past classes ({past.length})</h3>
            {past.length === 0 && <p className="text-xs text-slate-400">No past classes yet.</p>}
            {past.slice(0, 20).map(s => <React.Fragment key={s.id}>{renderSession(s, true)}</React.Fragment>)}
          </div>
        </div>

        <div className="space-y-6">
          <ScheduleCalendar role={user.role} sessions={sessions} actions={isTutor ? {
            reschedule: async (id, iso, reason) => { await apiJson(`/api/sessions/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ starts_at: iso, reason: reason || undefined }) }); setMsg('Class rescheduled. The student has been notified in their own time zone.'); await load(); },
            cancel: async (x, reason) => { await apiJson(`/api/sessions/${x.id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }); setMsg('Class cancelled.'); await load(); },
            restore: async id => { await apiJson(`/api/sessions/${id}/restore`, { method: 'POST', body: '{}' }); setMsg('Class restored.'); await load(); }
          } : undefined} />

          <TopicsSection role={user.role} enrollments={enrollments} />

          <ProgressSection role={user.role} sessions={sessions} homework={homework} enrollments={enrollments} />

          <div className={card}>
            <h3 className="font-bold text-white">{isTutor ? 'My students' : 'Courses & progress'}</h3>
            {enrollments.length === 0 && <p className="text-xs text-slate-400">No enrollment yet.</p>}
            {enrollments.map(x => {
              const pct = x.classes_total ? Math.min(100, Math.round((x.classes_used / x.classes_total) * 100)) : 0;
              return (
                <div key={x.id} className="text-xs space-y-1">
                  <div className="text-white font-semibold">{x.course_title}</div>
                  <div className="text-slate-400">{isTutor ? x.student_name : `Tutor: ${x.tutor_name}`}</div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} /></div>
                  <div className="text-slate-400">{x.classes_used} of {x.classes_total} classes done</div>
                  {x.assignment_link
                    ? <a href={x.assignment_link} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold">Open assignment link</a>
                    : <div className="text-slate-500">Assignment link will be added by admin.</div>}
                </div>
              );
            })}
          </div>

          {!isTutor && (
            <div className={card}>
              <h3 className="font-bold text-white">Invoices</h3>
              {invoices.length === 0 && <p className="text-xs text-slate-400">No invoices.</p>}
              {invoices.map(x => (
                <div key={x.id} className="text-xs flex justify-between gap-2 border-b border-indigo-900/40 pb-2">
                  <div><div className="text-white">{x.description || x.reference}</div><div className="text-slate-400">{x.reference}{x.due_date ? ` - due ${String(x.due_date).slice(0, 10)}` : ''}</div></div>
                  <div className="text-right"><div className="text-white">{x.currency} {x.amount}</div><div className={x.status === 'paid' ? 'text-emerald-400' : 'text-amber-300'}>{x.status}</div></div>
                </div>
              ))}
              <p className="text-[11px] text-slate-500">To pay, contact Tutor Monk on WhatsApp; your invoice is marked paid after confirmation.</p>
            </div>
          )}

          <div className={card}>
            <h3 className="font-bold text-white">Notifications</h3>
            {notes.length === 0 && <p className="text-xs text-slate-400">No notifications.</p>}
            {notes.slice(0, 10).map(n => (
              <div key={n.id} className={`text-xs ${n.is_read ? 'text-slate-500' : 'text-white'}`}>
                <div className="font-semibold">{n.title}</div>
                <div>{n.body}</div>
                {!n.is_read && <button className="text-amber-300 underline" onClick={() => readNote(n.id)}>Mark read</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePortal;
