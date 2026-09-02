import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import PageShell from '@/components/PageShell';
import VerificationBadge from '@/components/VerificationBadge';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';

export default function AdminVerification() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    const list = await base44.entities.Psychologist.filter({ verification_status: { $in: ['pending', 'in_review', 'needs_adjustments'] } }, '-created_date', 50);
    setItems(list);
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u.role === 'admin') await load();
      } catch (e) { } finally { setLoading(false); }
    })();
  }, []);

  const act = async (status) => {
    if (!selected) return;
    setActing(true);
    try {
      await base44.entities.Psychologist.update(selected.id, { verification_status: status });
      if (selected.user_id) {
        await base44.entities.Notification.create({
          user_id: selected.user_id, category: 'verification', read: false, link: '/painel-profissional',
          title: status === 'approved' ? 'Perfil aprovado!' : status === 'needs_adjustments' ? 'Ajustes solicitados' : 'Verificação reprovada',
          body: status === 'approved' ? 'Seu perfil foi verificado e já está visível para pacientes.' : 'Nossa equipe revisou seu cadastro. Veja detalhes no painel.',
        }).catch(() => { });
      }
      setSelected(null);
      await load();
    } catch (e) { } finally { setActing(false); }
  };

  if (loading) return <PageShell><div className="max-w-5xl mx-auto px-4 pt-10 pb-20"><div className="h-64 animate-shimmer rounded-2xl" /></div></PageShell>;

  if (!user || user.role !== 'admin') {
    return <PageShell><div className="max-w-2xl mx-auto px-4 pt-20 pb-20 text-center">
      <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-500/10 mx-auto flex items-center justify-center text-red-500 mb-5"><XCircle size={30} /></div>
      <h1 className="text-2xl font-heading font-bold">Acesso restrito</h1>
      <p className="text-muted-foreground mt-2 text-sm">Esta área é exclusiva para administradores do EntreNós.</p>
    </div></PageShell>;
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Verificação de profissionais</h1>
        <p className="text-muted-foreground text-sm mb-8">Revise CRP e informações antes de publicar o perfil.</p>

        {selected ? (
          <div className="animate-fade-in">
            <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5"><ArrowLeft size={16} /> Voltar à lista</button>
            <div className="card-elevated p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-muted shrink-0">
                  {selected.photo_url ? <Image src={selected.photo_url} fittingType="fill" className="w-full h-full" /> : <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary text-4xl font-bold">{(selected.professional_name || selected.full_name || '?').charAt(0)}</div>}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-heading font-bold">{selected.professional_name || selected.full_name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">CRP {selected.crp_region}/{selected.crp_number}</p>
                  <div className="mt-2"><VerificationBadge status={selected.verification_status} size="sm" /></div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-muted-foreground">
                    {selected.city && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {selected.city}/{selected.state}</span>}
                    {selected.email && <span>{selected.email}</span>}
                    {selected.phone && <span>{selected.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                <Info label="Formação" value={selected.education} />
                <Info label="Instituição" value={selected.institution} />
                <Info label="Ano de formação" value={selected.graduation_year} />
                <Info label="Experiência" value={selected.experience} />
                <Info label="Abordagens" value={(selected.approaches || []).join(', ')} />
                <Info label="Especialidades" value={(selected.specialties || []).join(', ')} />
                <Info label="Público" value={(selected.audience || []).join(', ')} />
                <Info label="Modalidades" value={(selected.modalities || []).join(', ')} />
                <Info label="Valor" value={selected.price ? `R$ ${selected.price.toFixed(2).replace('.', ',')}` : '—'} />
                <Info label="Sobre" value={selected.about} />
              </div>
              {selected.video_url && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Vídeo de apresentação (pendente moderação)</p>
                  <video src={selected.video_url} controls className="w-full max-h-80 rounded-xl bg-black" />
                </div>
              )}
              <div className="mt-7 flex flex-wrap gap-3 items-center">
                <button onClick={() => act('approved')} disabled={acting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"><CheckCircle2 size={16} /> Aprovar</button>
                <button onClick={() => act('needs_adjustments')} disabled={acting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"><AlertTriangle size={16} /> Solicitar ajustes</button>
                <button onClick={() => act('rejected')} disabled={acting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold disabled:opacity-50"><XCircle size={16} /> Reprovar</button>
                {acting && <Loader2 size={18} className="animate-spin text-muted-foreground" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="card-elevated p-10 text-center"><ShieldCheck size={32} className="text-emerald-500 mx-auto mb-3" /><p className="font-medium">Tudo em dia!</p><p className="text-sm text-muted-foreground mt-1">Nenhum profissional aguardando verificação.</p></div>
            ) : items.map(p => (
              <button key={p.id} onClick={() => setSelected(p)} className="card-elevated p-5 w-full text-left flex items-center gap-4 hover:shadow-glow transition-all">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted shrink-0">
                  {p.photo_url ? <Image src={p.photo_url} fittingType="fill" className="w-full h-full" /> : <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary font-bold">{(p.professional_name || p.full_name || '?').charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0"><p className="font-medium truncate">{p.professional_name || p.full_name}</p><p className="text-xs text-muted-foreground">CRP {p.crp_region}/{p.crp_number} · {p.city || '—'}</p></div>
                <VerificationBadge status={p.verification_status} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm mt-0.5">{value}</p></div>;
}
