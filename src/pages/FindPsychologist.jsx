import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import PageShell from '@/components/PageShell';
import PsychologistCard from '@/components/PsychologistCard';
import { supabase } from '@/lib/supabase';

const specialtyOptions = [
  'Ansiedade',
  'Depressão',
  'Relacionamentos',
  'Autoestima',
  'Luto',
  'Trauma',
  'TDAH',
  'Terapia de casal',
  'Adolescentes',
  'Estresse',
];

const approachOptions = [
  'TCC',
  'Psicanálise',
  'Humanista',
  'Jungiana',
  'Sistêmica',
  'Gestalt',
  'ACT',
  'Mindfulness',
];

const audienceOptions = [
  'Adultos',
  'Adolescentes',
  'Crianças',
  'Casais',
  'Idosos',
];

const modalityOptions = [
  {
    v: 'online',
    l: 'Online',
  },
  {
    v: 'in_person',
    l: 'Presencial',
  },
];

const INITIAL_FILTERS = {
  specialty: '',
  approach: '',
  modality: '',
  city: '',
  maxPrice: '',
  audience: '',
};

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function arrayIncludesIgnoreCase(array, value) {
  const target = normalizeText(value);

  if (!target) {
    return true;
  }

  return array.some(
    (item) => normalizeText(item) === target
  );
}

export default function FindPsychologist() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPsychologists();
  }, []);

  async function loadPsychologists() {
    setLoading(true);
    setError('');

    try {
      const { data, error: supabaseError } = await supabase
        .from('psychologists')
        .select(`
          id,
          user_id,
          professional_name,
          crp_number,
          crp_region,
          verification_status,
          education,
          specializations,
          approaches,
          experience,
          topics,
          modalities,
          languages,
          audience,
          city,
          state,
          session_price,
          session_duration,
          bio,
          profile_photo_url,
          photo_url,
          presentation_video_url,
          presentation_video_status,
          public_profile
        `)
        .eq('verification_status', 'approved')
        .eq('public_profile', true)
        .order('professional_name', {
          ascending: true,
        })
        .limit(60);

      if (supabaseError) {
        console.error(
          'Erro ao buscar psicólogos:',
          supabaseError
        );

        setError(
          'Não foi possível carregar os profissionais.'
        );

        setAll([]);
        return;
      }

      setAll(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        'Erro inesperado ao buscar psicólogos:',
        err
      );

      setError(
        'Não foi possível carregar os profissionais.'
      );

      setAll([]);
    } finally {
      setLoading(false);
    }
  }

  const results = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return all.filter((psychologist) => {
      const specializations = toArray(
        psychologist.specializations
      );

      const approaches = toArray(
        psychologist.approaches
      );

      const topics = toArray(
        psychologist.topics
      );

      const modalities = toArray(
        psychologist.modalities
      );

      const languages = toArray(
        psychologist.languages
      );

      const audience = toArray(
        psychologist.audience
      );

      const searchableValues = [
        psychologist.professional_name,
        psychologist.education,
        psychologist.experience,
        psychologist.bio,
        psychologist.city,
        psychologist.state,
        psychologist.crp_number,
        psychologist.crp_region,
        ...specializations,
        ...approaches,
        ...topics,
        ...modalities,
        ...languages,
        ...audience,
      ];

      const searchableText = normalizeText(
        searchableValues
          .filter(
            (value) =>
              value !== null &&
              value !== undefined
          )
          .join(' ')
      );

      if (
        normalizedQuery &&
        !searchableText.includes(normalizedQuery)
      ) {
        return false;
      }

      if (
        filters.specialty &&
        !arrayIncludesIgnoreCase(
          specializations,
          filters.specialty
        )
      ) {
        return false;
      }

      if (
        filters.approach &&
        !arrayIncludesIgnoreCase(
          approaches,
          filters.approach
        )
      ) {
        return false;
      }

      if (filters.modality) {
        const hasModality = modalities.some(
          (item) =>
            normalizeText(item) ===
            normalizeText(filters.modality)
        );

        if (!hasModality) {
          return false;
        }
      }

      if (
        filters.audience &&
        !arrayIncludesIgnoreCase(
          audience,
          filters.audience
        )
      ) {
        return false;
      }

      if (filters.city) {
        const psychologistCity = normalizeText(
          psychologist.city
        );

        const selectedCity = normalizeText(
          filters.city
        );

        if (
          !psychologistCity.includes(
            selectedCity
          )
        ) {
          return false;
        }
      }

      if (filters.maxPrice) {
        const price = Number(
          psychologist.session_price
        );

        const maxPrice = Number(
          filters.maxPrice
        );

        if (
          !Number.isFinite(price) ||
          !Number.isFinite(maxPrice)
        ) {
          return false;
        }

        if (price > maxPrice) {
          return false;
        }
      }

      return true;
    });
  }, [all, query, filters]);

  const activeCount = Object.values(filters).filter(
    Boolean
  ).length;

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      ...INITIAL_FILTERS,
    });
  }

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">

        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">
            Encontre um psicólogo
          </h1>

          <p className="mt-3 text-muted-foreground">
            Profissionais verificados, prontos para conversar
            com você. Comece no seu ritmo.
          </p>
        </div>

        <div className="flex gap-3 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Nome, especialidade ou cidade..."
              className="w-full pl-11 pr-4 py-3.5 rounded-full glass-strong border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFilters((current) => !current)
            }
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full glass-strong border border-border text-sm font-medium hover:bg-white transition-all relative"
          >
            <SlidersHorizontal size={16} />

            Filtros

            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-brand text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="max-w-3xl mx-auto mt-4 glass-strong rounded-2xl p-6 animate-fade-in border border-border">
            <div className="grid sm:grid-cols-2 gap-5">

              <Field label="Especialidade">
                <Select
                  value={filters.specialty}
                  onChange={(value) =>
                    updateFilter(
                      'specialty',
                      value
                    )
                  }
                  options={specialtyOptions}
                  placeholder="Todas"
                />
              </Field>

              <Field label="Abordagem">
                <Select
                  value={filters.approach}
                  onChange={(value) =>
                    updateFilter(
                      'approach',
                      value
                    )
                  }
                  options={approachOptions}
                  placeholder="Todas"
                />
              </Field>

              <Field label="Modalidade">
                <Select
                  value={filters.modality}
                  onChange={(value) =>
                    updateFilter(
                      'modality',
                      value
                    )
                  }
                  options={modalityOptions}
                  placeholder="Ambas"
                />
              </Field>

              <Field label="Público atendido">
                <Select
                  value={filters.audience}
                  onChange={(value) =>
                    updateFilter(
                      'audience',
                      value
                    )
                  }
                  options={audienceOptions}
                  placeholder="Todos"
                />
              </Field>

              <Field label="Cidade">
                <input
                  type="text"
                  value={filters.city}
                  onChange={(event) =>
                    updateFilter(
                      'city',
                      event.target.value
                    )
                  }
                  placeholder="Ex: São Paulo"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </Field>

              <Field
                label={`Valor máximo: ${
                  filters.maxPrice
                    ? `R$ ${filters.maxPrice}`
                    : 'qualquer'
                }`}
              >
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="50"
                  value={
                    filters.maxPrice || 500
                  }
                  onChange={(event) =>
                    updateFilter(
                      'maxPrice',
                      event.target.value
                    )
                  }
                  className="w-full accent-[hsl(258_70%_56%)]"
                />

                <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                  <span>R$ 0</span>
                  <span>R$ 250</span>
                  <span>R$ 500</span>
                </div>
              </Field>
            </div>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline"
              >
                <X size={13} />

                Limpar filtros
              </button>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Buscando profissionais...'
              : `${results.length} profissional(is) encontrado(s)`}
          </p>
        </div>

        {error && !loading && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadPsychologists}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="card-elevated p-5 h-56 animate-shimmer rounded-2xl"
              />
            ))}
          </div>
        )}

        {!loading &&
          !error &&
          results.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl gradient-brand-soft mx-auto flex items-center justify-center text-primary mb-4">
                <Search size={28} />
              </div>

              <h3 className="font-heading font-semibold text-lg">
                Nenhum profissional com esses critérios
              </h3>

              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Tente ajustar os filtros ou explore nossa
                triagem para descobrir por onde começar.
              </p>

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          results.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {results.map(
                (psychologist, index) => (
                  <PsychologistCard
                    key={psychologist.id}
                    psychologist={psychologist}
                    index={index}
                  />
                )
              )}
            </div>
          )}
      </div>
    </PageShell>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
      </label>

      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <option value="">
        {placeholder}
      </option>

      {options.map((option) => {
        const isObject =
          typeof option === 'object' &&
          option !== null;

        const optionValue = isObject
          ? option.v
          : option;

        const optionLabel = isObject
          ? option.l
          : option;

        return (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        );
      })}
    </select>
  );
}
