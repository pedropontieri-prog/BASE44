import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Users, ShieldCheck, ArrowRight, Bell, Settings, Wallet, AlertCircle, MapPin } from 'lucide-react';
import PageShell from '@/components/PageShell';
import VerificationBadge from '@/components/VerificationBadge';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';

export default function PsychologistDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        const profiles = await base44.entities.Psychologist.filter({ user_id: u.id });
        if (profiles.length) {
          const p = profiles[0];
          setProfile(p);
          const appts = await base44.entities.Appointment.filter({ psychologist_id: p.id }, 'date', 30);
          setAppointments(appts);
        }
      } catch (e) { } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <PageShell><div className="max-w-6xl mx-auto px-4 pt-10 pb-20"><div className="h-64 animate-shimmer rounded-2xl" /></div></PageShell>;

  if (!profile) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-20 text-center">
          <div className="w-16 h-16 rounded-3xl gradient-brand-soft mx-auto flex items-center justify-center text-primary mb-5"><ShieldCheck size={30} /></div>
          <h1 className="text-2xl font-heading font-bold">Você ainda não tem um perfil profissional</h1>
          <p className="text-muted-foreground mt-2">Crie seu perfil para começar a atender pelo EntreNós.</p>
          <Link to="/cadastro-profissional" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold">Iniciar cadastro <ArrowRight size={17} /></Link>
        </div>
      </PageShell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todays = appointments.filter(a => a.date === today && a.status === 'scheduled');
  const next = appointments.find(a => a.status === 'scheduled' && a.date >= today);
  const upcoming = appointments.filter(a => a.status === 'scheduled');
  const completeness = [profile.full_name, profile.crp_number, profile.about, profile.photo_url, profile.approaches?.length, profile.specialties?.length, profile.available_days?.length, profile.available_slots?.length].filter(Boolean).length;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">Olá, {profile.professional_name || profile.full_name} 👋</h1>
            <p className="text-muted-foreground mt-1 text-sm">Bem-vindo(a) ao seu painel profissional.</p>
          </div>
          <VerificationBadge status={profile.verification_status} size="md" />
        </div>

        {profile.verification_status !== 'approved' && (
          <div className="mb-6 card-elevated p-5 border-amber-200 bg-amber-50/60 dark:bg-amber-500/5 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{profile.verification_status === 'pending' ? 'Perfil em análise' : profile.verification_status === 'needs_adjustments' ? 'Ajustes solicitados' : 'Verificação necessária'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.verification_status === 'pending' ? 'Nossa equipe está revisando seu CRP e informações. Você será notificado(a) ao ser aprovado(a).' : 'Veja as observações e reenvie para análise.'}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full gradient-brand opacity-10 blur-2xl" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Próxima consulta</span>
              {next ? (
                <>
                  <h2 className="mt-2 text-xl font-heading font-bold">{next.patient_name}</h2>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Calendar size={15} /> {next.date}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock size={15} /> {next.time}</span>
                    <span className="inline-flex items-center gap-1.5">{next.modality === 'online' ? <><Video size={15} /> Online</> : <><MapPin size={15} /> Presencial</>}</span>
                  </div>
                  {next.modality === 'online' && (
                    <Link to="/videochamada" state={{ roomId: next.id, role: 'psychologist', psychologistName: profile.professional_name || profile.full_name, time: next.time }} className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all">
                      <Video size={17} /> Entrar na próxima consulta
                    </Link>
                  )}
                </>
              ) : <p className="mt-2 text-muted-foreground text-sm">Você não tem consultas agendadas.</p>}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-heading font-semibold mb-4">Consultas de hoje</h3>
              {todays.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma consulta para hoje.</p> : (
                <div className="space-y-2">
                  {todays.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                      <div><p className="text-sm font-medium">{a.patient_name}</p><p className="text-xs text-muted-foreground">{a.time} · {a.modality === 'online' ? 'Online' : 'Presencial'}</p></div>
                      {a.modality === 'online' && <Link to="/videochamada" state={{ roomId: a.id, role: 'psychologist', time: a.time }} className="text-xs font-medium text-primary">Entrar</Link>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-heading font-semibold mb-4">Agenda</h3>
              {upcoming.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sua agenda está vazia.</p> : (
                <div className="space-y-2">
                  {upcoming.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                      <div><p className="text-sm font-medium">{a.patient_name}</p><p className="text-xs text-muted-foreground">{a.date} · {a.time}</p></div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-violet-soft text-primary">{a.modality === 'online' ? 'Online' : 'Presencial'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-elevated p-5">
              <h3 className="font-heading font-semibold text-sm mb-3">Perfil público</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted shrink-0">
                  {profile.photo_url ? <Image src={profile.photo_url} fittingType="fill" className="w-full h-full" /> : <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary font-bold">{(profile.professional_name || profile.full_name || '?').charAt(0)}</div>}
                </div>
                <div className="min-w-0"><p className="text-sm font-medium truncate">{profile.professional_name || profile.full_name}</p><p className="text-xs text-muted-foreground">CRP {profile.crp_region}/{profile.crp_number}</p></div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Completude do perfil</span><span>{Math.round(completeness / 8 * 100)}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-brand transition-all" style={{ width: `${completeness / 8 * 100}%` }} /></div>
              </div>
              {profile.verification_status === 'approved' && <Link to={`/psicologo/${profile.id}`} className="mt-4 text-xs font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">Ver meu perfil público <ArrowRight size={13} /></Link>}
            </div>

            <div className="card-elevated p-5">
              <h3 className="font-heading font-semibold text-sm mb-3">Atalhos</h3>
              <div className="space-y-1">
                {[{ label: 'Pacientes', icon: Users }, { label: 'Financeiro', icon: Wallet }, { label: 'Notificações', icon: Bell, to: '/notificacoes' }, { label: 'Configurações', icon: Settings }].map((m, i) => (
                  <Link key={i} to={m.to || '/painel-profissional'} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors text-foreground/80"><m.icon size={16} className="text-primary" /> {m.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
