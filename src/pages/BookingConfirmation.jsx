import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Video, MapPin, Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { base44 } from '@/api/base44Client';

export default function BookingConfirmation() {
  const location = useLocation();
  const { psychologist, day, slot, modality } = location.state || {};
  const [roomId, setRoomId] = React.useState(null);

  React.useEffect(() => {
    if (!psychologist) return;
    base44.entities.Appointment.create({
      psychologist_id: psychologist.id,
      psychologist_name: psychologist.professional_name || psychologist.full_name,
      patient_name: 'Você',
      date: day, time: slot, modality,
      address: modality === 'in_person' ? psychologist.address : '',
      duration: psychologist.session_duration || 50,
      price: psychologist.price || 0,
      status: 'scheduled',
    }).then(r => setRoomId(r.id)).catch(() => {});
  }, []);

  if (!psychologist) {
    return <PageShell><div className="text-center py-32"><p className="text-muted-foreground">Nenhum agendamento em andamento.</p><Link to="/encontrar" className="mt-4 inline-block text-primary font-medium">Encontrar psicólogo</Link></div></PageShell>;
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <Link to={`/psicologo/${psychologist.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8"><ArrowLeft size={16} /> Voltar</Link>

        <div className="card-elevated p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 mx-auto flex items-center justify-center mb-5">
            <CheckCircle2 size={34} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold">Tudo certo! Consulta confirmada.</h1>
          <p className="text-muted-foreground mt-2">Enviamos a confirmação para o seu e-mail. Você pode entrar na sala alguns minutos antes.</p>

          <div className="mt-7 text-left grid sm:grid-cols-2 gap-4 bg-muted/40 rounded-2xl p-5">
            <Detail icon={Calendar} label="Profissional" value={psychologist.professional_name || psychologist.full_name} />
            <Detail icon={Clock} label="Data e horário" value={`${day}, ${slot}`} />
            <Detail icon={modality==='online'?Video:MapPin} label="Modalidade" value={modality==='online'?'Online (videochamada)':'Presencial'} />
            {modality==='in_person' && psychologist.address && <Detail icon={MapPin} label="Endereço" value={psychologist.address} />}
            {psychologist.price && <Detail icon={Calendar} label="Valor" value={`R$ ${psychologist.price.toFixed(2).replace('.',',')}`} />}
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            {modality === 'online' && (
              <Link to="/videochamada" state={{ roomId, role: 'patient', psychologistName: psychologist.professional_name||psychologist.full_name, time: slot }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all">
                <Video size={17} /> Entrar na videochamada
              </Link>
            )}
            <Link to="/painel" state={{ confirmed: { psychologistName: psychologist.professional_name||psychologist.full_name, day, slot, modality, roomId } }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full glass-strong font-semibold hover:bg-white transition-all">
              Ir para meu painel <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Detail({ icon: Icon, label, value }) {
  return <div className="flex items-start gap-3"><Icon size={18} className="text-primary mt-0.5 shrink-0" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium mt-0.5">{value}</p></div></div>;
}
