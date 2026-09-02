import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, MapPin, Video, Building2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import PsychologistCard from '@/components/PsychologistCard';
import { base44 } from '@/api/base44Client';

const specialtyOptions = ['Ansiedade', 'Depressão', 'Relacionamentos', 'Autoestima', 'Luto', 'Trauma', 'TDAH', 'Terapia de casal', 'Adolescentes', 'Estresse'];
const approachOptions = ['TCC', 'Psicanálise', 'Humanista', 'Jungiana', 'Sistêmica', 'Gestalt', 'ACT', 'Mindfulness'];
const audienceOptions = ['Adultos', 'Adolescentes', 'Crianças', 'Casais', 'Idosos'];

export default function FindPsychologist() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ specialty: '', approach: '', modality: '', city: '', maxPrice: '', audience: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Psychologist.filter({ verification_status: 'approved' }, '-rating', 60)
      .then(r => { setAll(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    return all.filter(p => {
      if (query) {
        const q = query.toLowerCase();
        const hay = `${p.full_name} ${p.professional_name || ''} ${p.specialties?.join(' ') || ''} ${p.approaches?.join(' ') || ''} ${p.city || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.specialty && !(p.specialties || []).includes(filters.specialty)) return false;
      if (filters.approach && !(p.approaches || []).includes(filters.approach)) return false;
      if (filters.modality && !(p.modalities || []).includes(filters.modality)) return false;
      if (filters.audience && !(p.audience || []).includes(filters.audience)) return false;
      if (filters.city && !((p.city || '').toLowerCase()).includes(filters.city.toLowerCase())) return false;
      if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [all, query, filters]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Encontre um psicólogo</h1>
          <p className="mt-3 text-muted-foreground">Profissionais verificados, prontos para conversar com você. Comece no seu ritmo.</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nome, especialidade ou cidade..."
              className="w-full pl-11 pr-4 py-3.5 rounded-full glass-strong border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full glass-strong border border-border text-sm font-medium hover:bg-white transition-all relative"
          >
            <SlidersHorizontal size={16} /> Filtros
            {activeCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-brand text-white text-[10px] font-bold flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="max-w-3xl mx-auto mt-4 glass-strong rounded-2xl p-6 animate-fade-in border border-border">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Especialidade">
                <Select value={filters.specialty} onChange={v => setFilters({...filters, specialty: v})} options={specialtyOptions} placeholder="Todas" />
              </Field>
              <Field label="Abordagem">
                <Select value={filters.approach} onChange={v => setFilters({...filters, approach: v})} options={approachOptions} placeholder="Todas" />
              </Field>
              <Field label="Modalidade">
                <Select value={filters.modality} onChange={v => setFilters({...filters, modality: v})} options={[{v:'online',l:'Online'},{v:'in_person',l:'Presencial'}]} placeholder="Ambas" />
              </Field>
              <Field label="Público atendido">
                <Select value={filters.audience} onChange={v => setFilters({...filters, audience: v})} options={audienceOptions} placeholder="Todos" />
              </Field>
              <Field label="Cidade">
                <input value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} placeholder="Ex: São Paulo" className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </Field>
              <Field label={`Valor máximo: ${filters.maxPrice ? 'R$ '+filters.maxPrice : 'qualquer'}`}>
                <input type="range" min="0" max="500" step="50" value={filters.maxPrice || 0} onChange={e => setFilters({...filters, maxPrice: e.target.value})} className="w-full accent-[hsl(258_70%_56%)]" />
              </Field>
            </div>
            {activeCount > 0 && (
              <button onClick={() => setFilters({ specialty: '', approach: '', modality: '', city: '', maxPrice: '', audience: '' })} className="mt-4 text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline">
                <X size={13} /> Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{loading ? 'Buscando profissionais...' : `${results.length} profissional(is) encontrado(s)`}</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            {[0,1,2,3,4,5].map(i => <div key={i} className="card-elevated p-5 h-56 animate-shimmer rounded-2xl" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl gradient-brand-soft mx-auto flex items-center justify-center text-primary mb-4"><Search size={28} /></div>
            <h3 className="font-heading font-semibold text-lg">Nenhum profissional com esses critérios</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Tente ajustar os filtros ou explore nossa triagem para descobrir por onde começar.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            {results.map((p, i) => <PsychologistCard key={p.id} psychologist={p} index={i} />)}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>{children}</div>;
}
function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={typeof o === 'string' ? o : o.v} value={typeof o === 'string' ? o : o.v}>{typeof o === 'string' ? o : o.l}</option>)}
    </select>
  );
}
