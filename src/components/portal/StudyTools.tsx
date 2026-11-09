import React, { useEffect, useState } from 'react';
import { apiJson } from '../../utils/api';

const card = 'p-5 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-3';
const inp = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 w-full';
const btn = 'rounded-lg bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 disabled:opacity-50';
const when = (d: any) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-');

type Role = 'student' | 'tutor' | 'admin';

/* ---------------- Doubts: student asks, tutor replies ---------------- */
export const DoubtsSection: React.FC<{ role: Role; enrollments: any[] }> = ({ role, enrollments }) => {
  const isStudent = role === 'student';
  const [doubts, setDoubts] = useState<any[]>([]);
  const [enrId, setEnrId] = useState('');
  const [q, setQ] = useState('');
  const [reply, setReply] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => apiJson<any[]>('/api/doubts').then(setDoubts).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setMsg(null);
    try {
      await apiJson('/api/doubts', { method: 'POST', body: JSON.stringify({ enrollment_id: Number(enrId), question: q }) });
      setQ(''); setMsg('Doubt sent to your tutor.'); await load();
    } catch (e: any) { setErr(e.message); }
  };
  const answer = async (id: number) => {
    setErr(null); setMsg(null);
    try {
      await apiJson(`/api/doubts/${id}/answer`, { method: 'POST', body: JSON.stringify({ answer: reply[id] }) });
      setReply({ ...reply, [id]: '' }); setMsg('Reply sent.'); await load();
    } catch (e: any) { setErr(e.message); }
  };

  const openCount = doubts.filter(d => d.status === 'open').length;
  return (
    <div className={card}>
      <h3 className="font-bold text-white">Doubts {isStudent ? `(${doubts.length})` : `(${openCount} open)`}</h3>
      {msg && <div className="text-sm text-emerald-300">{msg}</div>}
      {err && <div className="text-sm text-red-300">{err}</div>}
      {isStudent && (
        <form onSubmit={ask} className="space-y-2 p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50">
          <select className={inp} value={enrId} onChange={e => setEnrId(e.target.value)} required>
            <option value="">Select course / tutor</option>
            {enrollments.filter(x => x.status === 'active').map(x => <option key={x.id} value={x.id}>{x.course_title} ({x.tutor_name})</option>)}
          </select>
          <textarea className={inp} rows={2} placeholder="Type your doubt..." value={q} onChange={e => setQ(e.target.value)} required />
          <button className={btn} type="submit">Ask doubt</button>
        </form>
      )}
      {doubts.length === 0 && <p className="text-xs text-slate-400">No doubts yet.</p>}
      {doubts.map(d => (
        <div key={d.id} className="p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50 text-xs space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-slate-400">{isStudent ? `Tutor: ${d.tutor_name || '-'}` : `Student: ${d.student_name}`} &bull; {when(d.created_at)}</span>
            <span className={d.status === 'answered' ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>{d.status}</span>
          </div>
          <div className="text-white text-sm whitespace-pre-wrap">{d.question}</div>
          {d.answer && <div className="text-emerald-300 whitespace-pre-wrap">Reply: {d.answer}</div>}
          {!isStudent && d.status === 'open' && (
            <div className="flex gap-2 pt-1">
              <input className={inp} placeholder="Write reply" value={reply[d.id] || ''} onChange={e => setReply({ ...reply, [d.id]: e.target.value })} />
              <button className={btn} disabled={!(reply[d.id] || '').trim()} onClick={() => answer(d.id)}>Reply</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ---------------- Study materials: tutor adds link, student opens ---------------- */
export const MaterialsSection: React.FC<{ role: Role; enrollments: any[] }> = ({ role, enrollments }) => {
  const isTutor = role === 'tutor';
  const [items, setItems] = useState<any[]>([]);
  const [f, setF] = useState({ course_id: '', title: '', file_url: '', description: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => apiJson<any[]>('/api/resources').then(setItems).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  const courses = [...new Map(enrollments.map(x => [x.course_id, x.course_title])).entries()];
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setMsg(null);
    try {
      await apiJson('/api/resources', { method: 'POST', body: JSON.stringify({ ...f, course_id: Number(f.course_id) }) });
      setF({ course_id: '', title: '', file_url: '', description: '' }); setMsg('Material shared with your students.'); await load();
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className={card}>
      <h3 className="font-bold text-white">Study materials ({items.length})</h3>
      {msg && <div className="text-sm text-emerald-300">{msg}</div>}
      {err && <div className="text-sm text-red-300">{err}</div>}
      {isTutor && (
        <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50">
          <select className={inp} value={f.course_id} onChange={e => setF({ ...f, course_id: e.target.value })} required>
            <option value="">Select course</option>
            {courses.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
          </select>
          <input className={inp} placeholder="Title (e.g. Algebra notes)" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required />
          <input className={inp} type="url" placeholder="Link (Google Drive / PDF / video)" value={f.file_url} onChange={e => setF({ ...f, file_url: e.target.value })} required />
          <input className={inp} placeholder="Short note (optional)" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
          <button className={btn} type="submit">Share material</button>
        </form>
      )}
      {items.length === 0 && <p className="text-xs text-slate-400">No materials yet.</p>}
      {items.map(r => (
        <div key={r.id} className="p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold text-white text-sm">{r.title}</div>
            <div className="text-slate-400">{r.description || ''}{r.tutor_name ? ` \u2022 ${r.tutor_name}` : ''} &bull; {when(r.created_at)}</div>
          </div>
          <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold">Open</a>
        </div>
      ))}
    </div>
  );
};

/* ---------------- Progress: classes, homework, quizzes ---------------- */
export const ProgressSection: React.FC<{ role: Role; sessions: any[]; homework: any[]; enrollments: any[] }> = ({ role, sessions, homework, enrollments }) => {
  const isStudent = role === 'student';
  const [quizAvg, setQuizAvg] = useState<{ avg: number; n: number } | null>(null);
  useEffect(() => {
    if (!isStudent) return;
    apiJson<any[]>('/api/quizzes').then(rows => {
      const done = rows.filter(r => r.score !== null && r.score !== undefined);
      setQuizAvg(done.length ? { avg: Math.round(done.reduce((a, r) => a + Number(r.score), 0) / done.length), n: done.length } : { avg: 0, n: 0 });
    }).catch(() => undefined);
  }, [isStudent]);

  const stat = (studentId: number | null) => {
    const ss = sessions.filter(s => studentId === null || s.student_id === studentId);
    const hw = homework.filter(h => studentId === null || h.student_id === studentId);
    const done = ss.filter(s => s.status === 'completed').length;
    const missed = ss.filter(s => s.status === 'no_show' || s.status === 'cancelled').length;
    const held = done + missed;
    const graded = hw.filter(h => h.grade !== null && h.grade !== undefined);
    return {
      done, attendance: held ? Math.round((done / held) * 100) : null,
      hwTotal: hw.length, hwSubmitted: hw.filter(h => h.submission_id).length,
      hwAvg: graded.length ? (graded.reduce((a, h) => a + Number(h.grade), 0) / graded.length).toFixed(1) : null
    };
  };

  const box = (label: string, value: React.ReactNode) => (
    <div className="p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50 text-center">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );

  if (isStudent) {
    const st = stat(null);
    return (
      <div className={card}>
        <h3 className="font-bold text-white">My progress</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {box('Classes done', st.done)}
          {box('Attendance', st.attendance === null ? '-' : `${st.attendance}%`)}
          {box('Homework avg', st.hwAvg === null ? '-' : `${st.hwAvg}/10`)}
          {box('Quiz avg', quizAvg && quizAvg.n ? `${quizAvg.avg}%` : '-')}
        </div>
        <p className="text-[11px] text-slate-500">Homework submitted: {st.hwSubmitted} of {st.hwTotal}.</p>
      </div>
    );
  }

  // tutor: one row per student, weak students highlighted
  const studs = [...new Map(enrollments.map(x => [x.student_id, x.student_name])).entries()];
  return (
    <div className={card}>
      <h3 className="font-bold text-white">Student progress</h3>
      {studs.length === 0 && <p className="text-xs text-slate-400">No students yet.</p>}
      {studs.map(([id, name]) => {
        const st = stat(Number(id));
        const weak = (st.attendance !== null && st.attendance < 75) || (st.hwAvg !== null && Number(st.hwAvg) < 5) || (st.hwTotal - st.hwSubmitted >= 3);
        return (
          <div key={id} className="p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50 text-xs flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-bold text-white text-sm">{name} {weak && <span className="ml-1 px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">Needs attention</span>}</div>
              <div className="text-slate-400">{st.done} classes &bull; attendance {st.attendance === null ? '-' : `${st.attendance}%`}</div>
            </div>
            <div className="text-slate-300 text-right">
              <div>Homework: {st.hwSubmitted}/{st.hwTotal} submitted</div>
              <div>Avg grade: {st.hwAvg === null ? '-' : `${st.hwAvg}/10`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
