import React from 'react';

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground/70 mt-1">{hint}</span>}
    </label>
  );
}

export function TextInput(props) {
  const { className, ...rest } = props;
  return <input {...rest} className={`w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${className || ''}`} />;
}

export function TextArea(props) {
  const { className, rows, ...rest } = props;
  return <textarea {...rest} rows={rows || 3} className={`w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${className || ''}`} />;
}

export function SelectField({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
      <option value="">{placeholder || 'Selecione'}</option>
      {options.map(o => <option key={typeof o === 'string' ? o : o.v} value={typeof o === 'string' ? o : o.v}>{typeof o === 'string' ? o : o.l}</option>)}
    </select>
  );
}

export function ChipGroup({ options, value, onChange }) {
  const val = value || [];
  const toggle = (opt) => onChange(val.includes(opt) ? val.filter(x => x !== opt) : [...val, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = val.includes(opt);
        return (
          <button type="button" key={opt} onClick={() => toggle(opt)} className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${active ? 'gradient-brand text-white shadow-soft' : 'glass-strong text-foreground/70 hover:bg-white'}`}>{opt === 'online' ? 'Online' : opt === 'in_person' ? 'Presencial' : opt}</button>
        );
      })}
    </div>
  );
}
