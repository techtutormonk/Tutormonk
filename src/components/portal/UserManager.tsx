import React, { useEffect, useState } from 'react';
import { apiJson } from '../../utils/api';
import { TzSelect } from './TzSelect';
import { COUNTRIES, cityLabel, fmtTimeZ, resolveTz } from '../../utils/timezone';

interface UserRow { id: number; role: string; name: string; email: string; phone: string | null; active: number; country?: string | null; timezone?: string | null }

export function UserManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('India');
  const [tz, setTz] = useState('Asia/Kolkata');
  const [editTzId, setEditTzId] = useState<number | null>(null);
  const [editTz, setEditTz] = useState('Asia/Kolkata');
  const [editCountry, setEditCountry] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try { setUsers(await apiJson<UserRow[]>('/api/users')); } catch (e: any) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      const d = await apiJson('/api/users', { method: 'POST', body: JSON.stringify({ role, name, email, phone, country, timezone: tz, password: password || undefined, grade: role === 'student' ? grade : undefined }) });
      setMsg(`User created. Email: ${email} | Temporary password: ${d.tempPassword}  (copy it now, it is shown only once)`);
      setName(''); setEmail(''); setPhone(''); setGrade(''); setPassword('');
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const pickCountry = (c: string) => { setCountry(c); const hit = COUNTRIES.find(x => x.name === c); if (hit) setTz(hit.tz); };
  const saveTz = async (u: UserRow) => {
    setErr(null); setMsg(null);
    try {
      await apiJson(`/api/users/${u.id}/timezone`, { method: 'PATCH', body: JSON.stringify({ timezone: editTz, country: editCountry || undefined }) });
      setMsg(`Timezone saved for ${u.name}. Their classes now show at the right local time.`); setEditTzId(null); load();
    } catch (e: any) { setErr(e.message); }
  };

  const reset = async (u: UserRow) => {
    if (!confirm(`Reset password for ${u.name}?`)) return;
    setErr(null); setMsg(null);
    try {
      const d = await apiJson(`/api/users/${u.id}/reset-password`, { method: 'POST', body: JSON.stringify({}) });
      setMsg(`New temporary password for ${u.email}: ${d.tempPassword}  (copy it now, it is shown only once)`);
    } catch (e: any) { setErr(e.message); }
  };

  const toggle = async (u: UserRow) => {
    try {
      await apiJson(`/api/users/${u.id}/active`, { method: 'PATCH', body: JSON.stringify({ active: !u.active }) });
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const input = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400';

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-violet-950/40 p-4 rounded-2xl border border-violet-500/20 grid grid-cols-1 sm:grid-cols-4 gap-2">
        <select value={role} onChange={e => setRole(e.target.value)} className={input}>
          <option value="student">Student</option>
          <option value="tutor">Tutor</option>
          <option value="admin">Admin</option>
        </select>
        <input className={input} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
        <input className={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className={input} placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <input className={input} type="text" placeholder="Password (optional, min 8 - else auto)" value={password} onChange={e => setPassword(e.target.value)} />
        {role === 'student' && <input className={input} placeholder="Grade (e.g. Grade 8)" value={grade} onChange={e => setGrade(e.target.value)} />}
        <select className={input} value={country} onChange={e => pickCountry(e.target.value)} title="Country">
          {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <div className="sm:col-span-2"><TzSelect value={tz} onChange={setTz} className={input + ' w-full'} /></div>
        <button type="submit" className="rounded-lg bg-amber-400 text-slate-950 font-bold text-sm px-3 py-2">Create user</button>
      </form>

      {msg && <div className="text-sm text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded-lg px-3 py-2 break-all">{msg}</div>}
      {err && <div className="text-sm text-red-300 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">{err}</div>}

      <div className="overflow-x-auto bg-slate-900/60 rounded-2xl border border-violet-500/20">
        <table className="w-full text-sm text-left text-slate-200">
          <thead className="text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Country / Timezone</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-violet-900/20">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.name}{!u.active && <span className="ml-2 text-xs text-rose-400">(disabled)</span>}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 min-w-[230px]">
                  {editTzId === u.id ? (
                    <div className="space-y-1">
                      <select className={input + ' w-full'} value={editCountry} onChange={e => { setEditCountry(e.target.value); const h = COUNTRIES.find(x => x.name === e.target.value); if (h) setEditTz(h.tz); }}>
                        <option value="">Country</option>{COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <TzSelect value={editTz} onChange={setEditTz} className={input + ' w-full'} />
                      <div className="flex gap-1">
                        <button className="text-xs px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold" onClick={() => saveTz(u)}>Save</button>
                        <button className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-600" onClick={() => setEditTzId(null)}>Close</button>
                      </div>
                    </div>
                  ) : (() => {
                    const r = resolveTz(u.timezone, u.country);
                    return (
                      <div className="text-xs flex items-center gap-2">
                        <span>{u.country || '-'} &bull; {cityLabel(r.tz)} <span className="text-slate-400">({fmtTimeZ(Date.now(), r.tz)} now)</span>{r.guessed && <span className="ml-1 text-amber-300">(assumed)</span>}</span>
                        <button className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => { setEditTzId(u.id); setEditTz(r.tz); setEditCountry(u.country || ''); }}>Edit</button>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => reset(u)} className="text-xs px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">Reset password</button>
                  <button onClick={() => toggle(u)} className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-600">{u.active ? 'Disable' : 'Enable'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
