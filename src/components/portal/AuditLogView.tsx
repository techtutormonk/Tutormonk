import React, { useEffect, useState } from 'react';
import { apiJson } from '../../utils/api';

export const AuditLogView: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { apiJson<any[]>('/api/audit-logs').then(setRows).catch(e => setErr(e.message)); }, []);

  const f = rows.filter(r => `${r.user_name} ${r.action} ${r.entity}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <input className="bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm w-full sm:w-72" placeholder="Search user or action" value={q} onChange={e => setQ(e.target.value)} />
      {err && <div className="text-sm text-red-300">{err}</div>}
      <div className="overflow-x-auto bg-slate-900/60 rounded-2xl border border-violet-500/20">
        <table className="w-full text-xs text-left text-slate-200">
          <thead className="uppercase text-slate-400"><tr><th className="px-4 py-2">When</th><th className="px-4 py-2">User</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Item</th></tr></thead>
          <tbody className="divide-y divide-violet-900/20">
            {f.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{r.user_name || '-'} <span className="text-slate-500">{r.user_role}</span></td>
                <td className="px-4 py-2 text-amber-300">{r.action}</td>
                <td className="px-4 py-2">{r.entity}{r.entity_id ? ` #${r.entity_id}` : ''}</td>
              </tr>
            ))}
            {f.length === 0 && <tr><td colSpan={4} className="px-4 py-5 text-center text-slate-400">No entries.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AuditLogView;
