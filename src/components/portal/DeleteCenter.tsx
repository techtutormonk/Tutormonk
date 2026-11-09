import React, { useEffect, useState } from 'react';
import { apiJson } from '../../utils/api';

const card = 'p-5 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-3';
const btn2 = 'rounded-lg bg-slate-800 border border-slate-600 text-xs px-3 py-2 text-white disabled:opacity-50';
const btnDel = 'rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-2 disabled:opacity-50';
const inp = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400';

interface Cat { key: string; label: string; count: number }

// Admin-only: browse every kind of data and delete single items, selected items, or everything of a type.
export const DeleteCenter: React.FC = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [active, setActive] = useState<Cat | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadCats = async () => {
    try { setCats(await apiJson<Cat[]>('/api/admin/records')); } catch (e: any) { setErr(e.message); }
  };
  const open = async (c: Cat) => {
    setActive(c); setPicked([]); setQ(''); setMsg(null); setErr(null); setRows([]);
    try { setRows(await apiJson<any[]>(`/api/admin/records/${c.key}`)); } catch (e: any) { setErr(e.message); }
  };
  useEffect(() => { loadCats(); }, []);

  const refresh = async () => { await loadCats(); if (active) await open({ ...active }); };

  const delOne = async (r: any) => {
    if (!active) return;
    if (!window.confirm(`Delete "${r.title}"?\n\nThis also removes data linked to it and cannot be undone.`)) return;
    setBusy(true); setErr(null);
    try {
      await apiJson(`/api/admin/records/${active.key}/${r.id}`, { method: 'DELETE' });
      setMsg('Deleted.');
      setRows(rows.filter(x => x.id !== r.id)); setPicked(picked.filter(x => x !== r.id));
      loadCats();
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  const delSelected = async () => {
    if (!active || !picked.length) return;
    if (!window.confirm(`Delete ${picked.length} selected item(s)? This cannot be undone.`)) return;
    setBusy(true); setErr(null);
    try {
      const r = await apiJson<any>(`/api/admin/records/${active.key}/delete-many`, { method: 'POST', body: JSON.stringify({ ids: picked }) });
      setMsg(`${r.deleted} item(s) deleted.`);
      await refresh();
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  const delAll = async () => {
    if (!active) return;
    const typed = window.prompt(`This will delete ALL ${active.count} item(s) in "${active.label}" and anything linked to them.\n\nType DELETE to confirm.`);
    if (typed !== 'DELETE') return;
    setBusy(true); setErr(null);
    try {
      const r = await apiJson<any>(`/api/admin/records/${active.key}/delete-many`, { method: 'POST', body: JSON.stringify({ all: true, confirm: 'DELETE' }) });
      setMsg(`${r.deleted} item(s) deleted.`);
      await refresh();
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  const shown = rows.filter(r => `${r.title} ${r.sub}`.toLowerCase().includes(q.toLowerCase()));
  const allShownPicked = shown.length > 0 && shown.every(r => picked.includes(r.id));

  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-bold text-white">Delete Center</h3>
        <p className="text-xs text-slate-400">Choose a type of data, then delete one item, selected items, or everything of that type. Deleting also removes data linked to it (for example a student's results, or a course's classes). This cannot be undone. Your own admin account is always protected.</p>
        {msg && <div className="text-sm text-emerald-300">{msg}</div>}
        {err && <div className="text-sm text-red-300 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex flex-wrap gap-2">
          {cats.map(c => (
            <button key={c.key} onClick={() => open(c)}
              className={`px-3 py-1.5 rounded-lg border text-xs ${active?.key === c.key ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold' : 'bg-slate-900 border-violet-500/30 text-slate-200 hover:border-amber-400'}`}>
              {c.label} <span className="opacity-70">({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-white text-sm">{active.label} ({rows.length}{rows.length >= 500 ? '+' : ''})</h4>
            <div className="flex flex-wrap gap-2 items-center">
              <input className={inp + ' !py-1.5 text-xs w-44'} placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
              <button className={btn2} disabled={!shown.length}
                onClick={() => setPicked(allShownPicked ? picked.filter(id => !shown.some(r => r.id === id)) : Array.from(new Set([...picked, ...shown.map(r => r.id)])))}>
                {allShownPicked ? 'Unselect all' : 'Select all'}
              </button>
              <button className={btnDel} disabled={busy || !picked.length} onClick={delSelected}>Delete selected ({picked.length})</button>
              <button className={btnDel} disabled={busy || !rows.length} onClick={delAll}>Delete ALL</button>
            </div>
          </div>
          {rows.length === 0 && <p className="text-xs text-slate-400">Nothing here.</p>}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {shown.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#1a0f40] border border-indigo-800/50 text-xs">
                <input type="checkbox" checked={picked.includes(r.id)} onChange={() => setPicked(picked.includes(r.id) ? picked.filter(x => x !== r.id) : [...picked, r.id])} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{r.title || `#${r.id}`}</div>
                  <div className="text-slate-400 truncate">{r.sub || '-'}{r.created_at ? ` \u2022 ${new Date(r.created_at).toLocaleString()}` : ''}</div>
                </div>
                <button className={btnDel} disabled={busy} onClick={() => delOne(r)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteCenter;
