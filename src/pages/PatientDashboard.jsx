import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, Video, MapPin, Heart, History, Bell, User, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { base44 } from '@/api/base44Client';

const menu = [
  { label: 'Início', icon: ArrowRight, path: '/painel' },
  { label: 'Próxima consulta', icon: Clock, path: '/painel' },
  { label: 'Histórico', icon: History, path: '/painel' },
  { label: 'Favoritos', icon: Heart, path: '/painel' },
  { label: 'Dados da conta', icon: User, path: '/painel' },
  { label: 'Privacidade', icon: Shield, path: '/privacidade' },
  { label: 'Notificações', icon: Bell, path: '/painel' },
];

export default function PatientDashboard() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(location.state?.confirmed || null);

  useEffect(() => {
    base44.entities.Appointment.filter({ status: 'scheduled' }, 'date', 10)
      .then(setAppointments)
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const next = appointments[0];

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Olá, bem-vindo(a) de volta 👋</h1>
          <p className="text-muted-foreground mt-1">Acompanhe suas consultas e cuide do seu bem-estar no seu ritmo.</p>
        </div>

        {confirmed && (
          <div className="mb-8 card-elevated p-6 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/5 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-lg">Consulta agendada com sucesso!</h3>
                <p className="text-sm text-muted-foreground mt-1">Você receberá um lembrete por e-mail antes do horário.</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <Info label="Profissional" value={confirmed.psychologistName} />
                  <Info label="Data" value={`${confirmed.day}, ${confirmed.slot}`} />
                  <Info label="Modalidade" value={confirmed.modality === 'online' ? 'Online (videochamada)' : 'Presencial'} />
                  {confirmed.modality === 'online' && (
                    <div className="sm:col-span-2">
                      <Link to={{ pathname: '/videochamada', search: `?name=${encodeURIComponent(confirmed.psychologistName)}&time=${confirmed.slot}` }} state={{ psychologistName: confirmed.psychologistName, time: confirmed.slot }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white font-semibold text-sm shadow-soft hover:shadow-glow transition-all">
                        <Video size={16} /> Entrar na videochamada
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Next appointment */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full gradient-brand opacity-10 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Próxima consulta</span>
                  {next ? (
                    <>
                      <h2 className="mt-2 text-xl font-heading font-bold">{next.psychologist_name}</h2>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><Calendar size={15} /> {next.date}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock size={15} /> {next.time}</span>
                        <span className="inline-flex items-center gap-1.5">{next.modality==='online' ? <><Video size={15} /> Online</> : <><MapPin size={15} /> Presencial</>}</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2">
                      <p className="text-muted-foreground">Você não tem consultas agendadas.</p>
                      <Link to="/encontrar" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white font-semibold text-sm">Encontrar psicólogo <ArrowRight size={15} /></Link>
                    </div>
                  )}
                </div>
              </div>
              {next && next.modality === 'online' && (
                <Link to="/videochamada" state={{ roomId: next.id, role: 'patient', psychologistName: next.psychologist_name, time: next.time }}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all">
                  <Video size={17} /> Entrar na sala
                </Link>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-heading font-semibold mb-4">Histórico de consultas</h3>
              {loading ? (
                <div className="space-y-3">{[0,1,2].map(i=><div key={i} className="h-16 animate-shimmer rounded-xl" />)}</div>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma consulta ainda. Quando você agendar, o histórico aparecerá aqui.</p>
              ) : (
                <div className="space-y-2">
                  {appointments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                      <div>
                        <p className="text-sm font-medium">{a.psychologist_name}</p>
                        <p className="text-xs text-muted-foreground">{a.date} · {a.time} · {a.modality==='online'?'Online':'Presencial'}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">{a.status==='scheduled'?'Agendada':a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-elevated p-5">
              <h3 className="font-heading font-semibold text-sm mb-3">Atalhos</h3>
              <div className="space-y-1">
                {menu.map((m, i) => (
                  <Link key={i} to={m.path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors text-foreground/80">
                    <m.icon size={16} className="text-primary" /> {m.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="card-elevated p-5 gradient-brand-soft">
              <Shield size={22} className="text-primary" />
              <h3 className="mt-3 font-heading font-semibold text-sm">Sua privacidade</h3>
              <p className="text-xs text-muted-foreground mt-1">Gerencie seus dados, consentimentos e sessões ativas.</p>
              <Link to="/privacidade" className="mt-3 text-xs font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">Abrir central <ArrowRight size={13} /></Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium mt-0.5">{value}</p></div>;
}
