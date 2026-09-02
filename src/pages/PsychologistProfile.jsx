import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Video, Building2, Star, Clock, Globe, Calendar, ArrowRight, ShieldCheck, MessageCircle, Heart } from 'lucide-react';
import PageShell from '@/components/PageShell';
import VerificationBadge from '@/components/VerificationBadge';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function PsychologistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modality, setModality] = useState('online');
  const [fav, setFav] = useState(false);

  useEffect(() => {
    base44.entities.Psychologist.get(id)
      .then(r => { setP(r); setLoading(false); })
      .catch(() => setLoading(false));
    base44.auth.isAuthenticated().then(ok => {
      if (!ok) return;
      base44.entities.Favorite.filter({ psychologist_id: id }).then(list => setFav(list.length > 0)).catch(() => {});
    });
  }, [id]);

  const toggleFav = async () => {
    try {
      const ok = await base44.auth.isAuthenticated();
      if (!ok) { navigate('/login'); return; }
      const list = await base44.entities.Favorite.filter({ psychologist_id: id });
      if (list.length > 0) { await base44.entities.Favorite.delete(list[0].id); setFav(false); }
      else { const u = await base44.auth.me(); await base44.entities.Favorite.create({ user_id: u.id, psychologist_id: id, psychologist_name: p?.professional_name || p?.full_name || '', psychologist_photo: p?.photo_url || '' }); setFav(true); }
    } catch (e) {}
  };

  if (loading) return <PageShell><div className="max-w-4xl mx-auto px-4 py-20"><div className="h-96 animate-shimmer rounded-3xl" /></div></PageShell>;
  if (!p) return <PageShell><div className="text-center py-32"><p className="text-muted-foreground">Profissional não encontrado.</p><Link to="/encontrar" className="mt-4 inline-block text-primary font-medium">Voltar à busca</Link></div></PageShell>;

  const handleSchedule = () => {
    if (!selectedSlot) return;
    navigate('/agendamento', { state: { psychologist: p, day: days[selectedDay], slot: selectedSlot, modality } });
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <Link to="/encontrar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} /> Voltar à busca
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: profile */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated p-7">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-muted shrink-0">
                  {p.photo_url ? <Image src={p.photo_url} fittingType="fill" className="w-full h-full" alt={p.professional_name} /> : <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-4xl font-heading font-bold text-primary">{(p.professional_name||p.full_name||'?').charAt(0)}</div>}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-heading font-bold">{p.professional_name || p.full_name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">CRP {p.crp_region}/{p.crp_number}</p>
                  <div className="mt-3"><VerificationBadge status={p.verification_status} size="md" showSub /></div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
                    {p.city && <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {p.city}/{p.state}</span>}
                    {p.rating != null && <span className="inline-flex items-center gap-1.5 text-amber-500"><Star size={15} className="fill-amber-400" /> {p.rating?.toFixed?.(1)}</span>}
                    {p.session_duration && <span className="inline-flex items-center gap-1.5"><Clock size={15} /> {p.session_duration} min</span>}
                    {p.languages?.length > 0 && <span className="inline-flex items-center gap-1.5"><Globe size={15} /> {p.languages.join(', ')}</span>}
                  </div>
                </div>
              </div>
            </div>

            {p.about && (
              <Section title="Sobre mim">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{p.about}</p>
              </Section>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <Section title="Abordagens">
                <Tags items={p.approaches} />
              </Section>
              <Section title="Especialidades">
                <Tags items={p.specialties} />
              </Section>
              <Section title="Público atendido">
                <Tags items={p.audience} />
              </Section>
              <Section title="Temas de atuação">
                <Tags items={p.themes} />
              </Section>
            </div>

            {p.education && (
              <Section title="Formação">
                <p className="text-sm text-muted-foreground leading-relaxed">{p.education}{p.institution ? ` — ${p.institution}` : ''}{p.graduation_year ? ` (${p.graduation_year})` : ''}</p>
              </Section>
            )}
            {p.experience && (
              <Section title="Experiência profissional">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{p.experience}</p>
              </Section>
            )}

            <Section title="Modalidades de atendimento">
              <div className="flex flex-wrap gap-3">
                {(p.modalities||[]).includes('online') && <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aqua/10 text-sm font-medium" style={{ color: 'hsl(178 60% 35%)' }}><Video size={16} /> Online</span>}
                {(p.modalities||[]).includes('in_person') && <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-soft text-primary text-sm font-medium"><Building2 size={16} /> Presencial{p.address ? ` · ${p.address}` : ''}</span>}
              </div>
            </Section>
          </div>

          {/* Right: scheduling */}
          <div className="lg:col-span-1">
            <div className="card-elevated p-6 sticky top-24">
              <div className="flex items-baseline justify-between">
                <h3 className="font-heading font-semibold">Agendar consulta</h3>
                {p.price ? <span className="text-lg font-bold">R$ {p.price.toFixed(2).replace('.', ',')}</span> : <span className="text-sm text-muted-foreground">Valor sob consulta</span>}
              </div>

              <div className="mt-5">
                <label className="text-xs font-medium text-muted-foreground">Modalidade</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {['online','in_person'].map(m => (
                    <button key={m} onClick={() => setModality(m)} disabled={!(p.modalities||[]).includes(m)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${modality===m ? 'gradient-brand text-white border-transparent shadow-soft' : 'border-border text-foreground/70 hover:bg-muted'} disabled:opacity-40 disabled:cursor-not-allowed`}>
                      {m==='online' ? 'Online' : 'Presencial'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="text-xs font-medium text-muted-foreground">Dias disponíveis</label>
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1">
                  {days.map((d, i) => (
                    <button key={d} onClick={() => { setSelectedDay(i); setSelectedSlot(null); }}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${selectedDay===i ? 'gradient-brand text-white border-transparent' : 'border-border text-foreground/70 hover:bg-muted'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="text-xs font-medium text-muted-foreground">Horários — {p.timezone || 'America/Sao_Paulo'}</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {slots.map(s => (
                    <button key={s} onClick={() => setSelectedSlot(s)}
                      className={`px-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${selectedSlot===s ? 'gradient-brand text-white border-transparent shadow-soft' : 'border-border text-foreground/70 hover:bg-muted'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSchedule} disabled={!selectedSlot}
                className="w-full mt-6 py-3.5 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                {selectedSlot ? `Confirmar ${days[selectedDay]} ${selectedSlot}` : 'Selecione um horário'} <ArrowRight size={17} />
              </button>

              <button onClick={toggleFav} className={`w-full mt-3 py-3 rounded-full text-sm font-semibold border transition-all inline-flex items-center justify-center gap-2 ${fav ? 'text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-500/10' : 'border-border text-foreground/70 hover:bg-muted'}`}>
                <Heart size={16} className={fav ? 'fill-rose-500' : ''} /> {fav ? 'Salvo' : 'Salvar profissional'}
              </button>

              <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-500" />
                <span>Cancelamento gratuito até 12h antes. Sessão de {p.session_duration || 50} min.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Section({ title, children }) {
  return (
    <div className="card-elevated p-6">
      <h2 className="font-heading font-semibold text-base mb-3">{title}</h2>
      {children}
    </div>
  );
}
function Tags({ items }) {
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground">Não informado.</p>;
  return <div className="flex flex-wrap gap-2">{items.map((t, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-violet-soft text-primary font-medium">{t}</span>)}</div>;
}
