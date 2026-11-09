import React, { useEffect, useMemo, useState } from 'react';
import { apiJson } from '../../utils/api';

type Role = 'student' | 'tutor' | 'admin';

const card = 'p-5 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-3';
const inp = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 w-full';
const btn = 'rounded-lg bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2';
const btn2 = 'rounded-lg bg-slate-800 border border-slate-600 text-xs px-3 py-2 text-white';

/* ---------------- Topics covered: only the TUTOR adds; student + tutor (+ admin) see ---------------- */
export const TopicsSection: React.FC<{ role: Role; enrollments: any[] }> = ({ role, enrollments }) => {
  const [topics, setTopics] = useState<any[]>([]);
  const [form, setForm] = useState({ enrollment_id: '', subject: '', topic: '', covered_on: new Date().toISOString().slice(0, 10) });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const isTutor = role === 'tutor';

  const load = () => apiJson<any[]>('/api/topics').then(setTopics).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  const mine = enrollments.filter(e => e.status === 'active');
  const pick = (id: string) => {
    const e = mine.find(x => String(x.id) === id);
    setForm(f => ({ ...f, enrollment_id: id, subject: e ? e.course_title : '' }));
  };

  const add = async (ev: React.FormEvent) => {
    ev.preventDefault(); setErr(null); setMsg(null);
    try {
      await apiJson('/api/topics', { method: 'POST', body: JSON.stringify({ ...form, enrollment_id: Number(form.enrollment_id) }) });
      setMsg('Topic saved. The student can see it now.');
      setForm(f => ({ ...f, topic: '' }));
      load();
    } catch (e: any) { setErr(e.message); }
  };
  const remove = async (id: number) => {
    if (!window.confirm('Remove this topic?')) return;
    try { await apiJson(`/api/topics/${id}`, { method: 'DELETE' }); load(); } catch (e: any) { setErr(e.message); }
  };

  // group: student -> subject -> topics (students only see their own, so the student level is hidden for them)
  const grouped = useMemo(() => {
    const m = new Map<string, Map<string, any[]>>();
    for (const t of topics) {
      const sk = t.student_name; const sub = m.get(sk) || new Map<string, any[]>();
      sub.set(t.subject, [...(sub.get(t.subject) || []), t]); m.set(sk, sub);
    }
    return m;
  }, [topics]);

  return (
    <div className={card}>
      <h3 className="font-bold text-white">Topics covered ({topics.length})</h3>
      {isTutor && (
        <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50">
          <select className={inp} value={form.enrollment_id} onChange={e => pick(e.target.value)} required>
            <option value="">Select student / subject</option>
            {mine.map(x => <option key={x.id} value={x.id}>{x.student_name} - {x.course_title}</option>)}
          </select>
          <input className={inp} placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
          <input className={inp} placeholder="Topic completed (e.g. Quadratic equations)" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required />
          <input className={inp} type="date" value={form.covered_on} onChange={e => setForm({ ...form, covered_on: e.target.value })} />
          <button className={btn} type="submit">Mark topic completed</button>
        </form>
      )}
      {msg && <div className="text-xs text-emerald-300">{msg}</div>}
      {err && <div className="text-xs text-red-300">{err}</div>}
      {topics.length === 0 && <p className="text-xs text-slate-400">{isTutor ? 'No topic added yet.' : 'No topic has been marked completed yet.'}</p>}
      <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
        {[...grouped.entries()].map(([student, subjects]) => (
          <div key={student} className="space-y-1">
            {role !== 'student' && <div className="text-sm font-bold text-white">{student}</div>}
            {[...subjects.entries()].map(([subject, list]) => (
              <div key={subject} className="text-xs p-2 rounded-lg bg-[#1a0f40] border border-indigo-800/40">
                <div className="text-amber-300 font-bold">{subject} <span className="text-slate-500 font-normal">({list.length} topics)</span></div>
                <ul className="mt-1 space-y-1">
                  {list.map(t => (
                    <li key={t.id} className="flex justify-between gap-2 text-slate-200">
                      <span>&#10003; {t.topic}{t.note ? <span className="text-slate-500"> - {t.note}</span> : null}</span>
                      <span className="text-slate-500 whitespace-nowrap">
                        {String(t.covered_on).slice(0, 10)}
                        {isTutor && <button className="ml-2 text-red-300 underline" onClick={() => remove(t.id)}>remove</button>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
