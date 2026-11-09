import React, { useState } from 'react';
import { apiJson } from '../../utils/api';

interface Props {
  forced?: boolean;          // true = user logged in with a temporary password and must change it
  onDone: () => void;
  onClose?: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ forced, onDone, onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (next.length < 8) return setErr('New password must be at least 8 characters.');
    if (next !== again) return setErr('New passwords do not match.');
    setBusy(true);
    try {
      await apiJson('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, new_password: next })
      });
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400';

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-[#140b33] border border-violet-600/40 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-extrabold text-white">{forced ? 'Set your new password' : 'Change password'}</h3>
        {forced && <p className="text-xs text-amber-300">You logged in with a temporary password. Please choose your own password to continue.</p>}
        <input className={input} type="password" placeholder={forced ? 'Temporary password' : 'Current password'} value={current} onChange={e => setCurrent(e.target.value)} required />
        <input className={input} type="password" placeholder="New password (min 8 characters)" value={next} onChange={e => setNext(e.target.value)} required />
        <input className={input} type="password" placeholder="Repeat new password" value={again} onChange={e => setAgain(e.target.value)} required />
        {err && <div className="text-xs text-red-300 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-sm py-2">{busy ? 'Saving...' : 'Save password'}</button>
          {!forced && onClose && <button type="button" onClick={onClose} className="px-4 rounded-lg bg-slate-800 border border-slate-600 text-sm">Cancel</button>}
        </div>
      </form>
    </div>
  );
};
