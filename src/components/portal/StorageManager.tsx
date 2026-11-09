import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Download, RefreshCw, Terminal, Send, Table, Eye, EyeOff, Copy, Check, Play } from 'lucide-react';
import { authFetch } from '../../utils/api';

interface StorageStatus {
  connected: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  latencyMs: number;
  tablesCount: number;
  tables: Array<{ name: string; rowCount: number; engine: string }>;
  lastError: string | null;
}

const card = 'p-5 sm:p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-4';
const inp = 'w-full bg-[#0d0622] border border-indigo-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400';
const lbl = 'block text-xs font-bold text-slate-300 mb-1';

export const StorageManager: React.FC = () => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [sql, setSql] = useState('SELECT * FROM leads ORDER BY id DESC LIMIT 5;');
  const [result, setResult] = useState<any | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await authFetch('/api/database/status');
      if (res.ok) {
        const d: StorageStatus = await res.json();
        setStatus(d);
        if (d.host) setHost(d.host);
        if (d.port) setPort(String(d.port));
        if (d.user) setUser(d.user);
        if (d.database) setDatabase(d.database);
      }
    } catch { /* ignore */ }
  };
  useEffect(() => { fetchStatus(); }, []);

  const post = async (url: string, body?: any) => {
    const res = await authFetch(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  };

  const testConnection = async () => {
    setBusy(true); setNote(null);
    try {
      const { data } = await post('/api/database/test-connection', { host, port, user, password, database });
      setNote(data.success
        ? { ok: true, text: `Connection successful (${data.latencyMs} ms, server ${data.serverVersion || 'unknown'}).` }
        : { ok: false, text: `Connection failed: ${data.error || 'unknown error'}${data.hint ? ` — ${data.hint}` : ''}` });
    } catch (e: any) { setNote({ ok: false, text: e.message }); }
    setBusy(false);
  };

  const saveAndConnect = async () => {
    setBusy(true); setNote(null);
    try {
      const { ok, data } = await post('/api/database/config', { host, port, user, password, database });
      const r = data?.result;
      setNote(ok && r?.connected ? { ok: true, text: r.message || 'Connected.' } : { ok: false, text: r?.message || data?.error || 'Could not connect.' });
      await fetchStatus();
    } catch (e: any) { setNote({ ok: false, text: e.message }); }
    setBusy(false);
  };

  const runSetup = async () => {
    setBusy(true); setNote(null);
    try {
      const { ok, data } = await post('/api/database/migrate');
      setNote(ok && data.success ? { ok: true, text: `Setup complete (${data.count} statements verified).` } : { ok: false, text: data?.error || 'Setup failed.' });
      await fetchStatus();
    } catch (e: any) { setNote({ ok: false, text: e.message }); }
    setBusy(false);
  };

  const copyEnv = () => {
    navigator.clipboard.writeText(`DB_HOST=${host}\nDB_PORT=${port}\nDB_USER=${user}\nDB_PASSWORD=${password || 'your_password'}\nDB_NAME=${database}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const runQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sql.trim()) return;
    setRunning(true); setResult(null); setSqlError(null);
    try {
      const res = await authFetch('/api/database/query', { method: 'POST', body: JSON.stringify({ sql }) });
      const data = await res.json();
      res.ok ? setResult(data) : setSqlError(data.error || 'Query failed');
    } catch (err: any) { setSqlError(err.message); }
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white">Data Storage</h3>
              <p className="text-xs text-slate-400">Connection, schema and data tools for the portal.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status?.connected ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'}`}>
              {status?.connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {status?.connected ? `Connected • ${status.latencyMs} ms` : 'Not connected'}
            </span>
            <button onClick={fetchStatus} className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-slate-300" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        {status?.lastError && <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-lg px-3 py-2">{status.lastError}</div>}
      </div>

      {/* Connection */}
      <div className={card}>
        <h3 className="font-bold text-white">Connection settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={lbl}>Host</label><input className={inp} value={host} onChange={e => setHost(e.target.value)} /></div>
          <div><label className={lbl}>Port</label><input className={inp} value={port} onChange={e => setPort(e.target.value)} /></div>
          <div><label className={lbl}>Database name</label><input className={inp} value={database} onChange={e => setDatabase(e.target.value)} /></div>
          <div><label className={lbl}>Username</label><input className={inp} value={user} onChange={e => setUser(e.target.value)} /></div>
          <div className="sm:col-span-2">
            <label className={lbl}>Password</label>
            <div className="relative">
              <input className={inp + ' pr-10'} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Database password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={testConnection} disabled={busy} className="px-4 py-2 rounded-xl bg-indigo-900 border border-indigo-700 text-white text-xs font-bold disabled:opacity-50">Test connection</button>
          <button onClick={saveAndConnect} disabled={busy} className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-50">Save &amp; connect</button>
          <button onClick={copyEnv} className="px-4 py-2 rounded-xl bg-indigo-950 border border-indigo-800 text-slate-200 text-xs font-bold flex items-center gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}Copy environment settings
          </button>
        </div>
        {note && <div className={`text-xs rounded-lg px-3 py-2 border ${note.ok ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800' : 'text-rose-300 bg-rose-950/60 border-rose-800'}`}>{note.text}</div>}
      </div>

      {/* Schema */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white">Database schema</h3>
            <p className="text-xs text-slate-400">Creates any missing tables and columns. Existing data is never removed.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={runSetup} disabled={busy} className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"><Play className="w-3.5 h-3.5" />Run setup</button>
            <button onClick={() => window.open('/api/database/schema-sql', '_blank')} className="px-4 py-2 rounded-xl bg-indigo-900 border border-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Download SQL</button>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className={card}>
        <div className="flex items-center gap-2"><Table className="w-5 h-5 text-indigo-400" /><h3 className="font-bold text-white">Tables ({status?.tables?.length || 0})</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {status?.tables?.map(t => (
            <button key={t.name} onClick={() => setSql(`SELECT * FROM ${t.name} LIMIT 10;`)} className="text-left p-3 rounded-2xl bg-[#1b1043] border border-indigo-800/60 hover:border-amber-400/60 flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-white">{t.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950 text-emerald-400 font-mono">{t.rowCount} rows</span>
            </button>
          ))}
        </div>
      </div>

      {/* Query console */}
      <div className={card}>
        <div className="flex items-center gap-2"><Terminal className="w-5 h-5 text-amber-400" /><div><h3 className="font-bold text-white">Data viewer</h3><p className="text-xs text-slate-400">Read-only queries (SELECT, SHOW, DESCRIBE).</p></div></div>
        <form onSubmit={runQuery} className="space-y-3">
          <textarea value={sql} onChange={e => setSql(e.target.value)} rows={3} className="w-full bg-[#0d0622] border border-indigo-800 rounded-2xl p-4 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400" />
          <div className="flex justify-end"><button type="submit" disabled={running} className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"><Send className="w-3.5 h-3.5" />{running ? 'Running...' : 'Run query'}</button></div>
        </form>
        {sqlError && <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-mono">{sqlError}</div>}
        {result && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400">{result.rows?.length || 0} rows • {result.durationMs} ms</div>
            <div className="overflow-auto rounded-xl border border-indigo-800/80 bg-[#0d0622] max-h-64">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-indigo-950/80 text-amber-300"><tr>{result.rows?.[0] && Object.keys(result.rows[0]).map((c: string) => <th key={c} className="px-3 py-2 whitespace-nowrap">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-indigo-950 text-slate-300">
                  {result.rows?.map((r: any, i: number) => <tr key={i}>{Object.values(r).map((v: any, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageManager;
