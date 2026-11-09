import React from 'react';
import { TIMEZONES, TZ_REGIONS, browserTz, isValidTz } from '../../utils/timezone';

const inp = 'bg-slate-900 border border-violet-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 w-full';

/** Timezone dropdown. `pinned` options (e.g. "Student's time", "Teacher's time") are shown first. */
export const TzSelect: React.FC<{
  value: string;
  onChange: (tz: string) => void;
  pinned?: { id: string; label: string }[];
  className?: string;
}> = ({ value, onChange, pinned = [], className }) => {
  const known = new Set([...TIMEZONES.map(t => t.id), ...pinned.map(p => p.id)]);
  const device = browserTz();
  const extra = [value, device].filter((t, i, a) => isValidTz(t) && !known.has(t) && a.indexOf(t) === i);
  return (
    <select className={className || inp} value={value} onChange={e => onChange(e.target.value)}>
      {pinned.length > 0 && (
        <optgroup label="Suggested">
          {pinned.map(p => <option key={p.id + p.label} value={p.id}>{p.label}</option>)}
        </optgroup>
      )}
      {extra.length > 0 && (
        <optgroup label="Other">
          {extra.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </optgroup>
      )}
      {TZ_REGIONS.map(r => (
        <optgroup key={r} label={r}>
          {TIMEZONES.filter(t => t.region === r).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
};
