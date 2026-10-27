import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Video,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

import PageShell from '@/components/PageShell';
import { supabase } from '@/lib/supabase';

export default function BookingConfirmation() {
  const location = useLocation();

  const {
    psychologist,
    day,
    dayLabel,
    slot,
    modality
  } = location.state || {};

  const [appointment, setAppointment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const attemptedRef = React.useRef(false);

  React.useEffect(() => {
    if (!psychologist || !day || !slot || !modality) {
      setLoading(false);
      return;
    }

    createAppointment();
  }, []);

  async function createAppointment() {
    if (attemptedRef.current) {
      return;
    }

    attemptedRef.current = true;
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError('Você precisa entrar na sua conta para agendar uma consulta.');
        return;
      }

      if (!psychologist?.id || !day || !slot || !modality) {
        setError('Faltam informações para concluir o agendamento. Volte ao perfil e escolha a data e o horário novamente.');
        return;
      }

      const duration = Number(psychologist.session_duration) || 50;
      const start = new Date(`${day}T${slot}:00`);

      if (Number.isNaN(start.getTime())) {
        setError('A data ou o horário selecionado é inválido. Escolha outro horário.');
        return;
      }

      if (start.getTime() <= Date.now()) {
        setError('Esse horário já passou. Volte ao perfil e escolha um horário futuro.');
        return;
      }

      const end = new Date(start.getTime() + duration * 60000);

      const { data, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          psychologist_id: psychologist.id,
          patient_id: user.id,
          psychologist_name: psychologistName,
          patient_name: user.user_metadata?.name || user.user_metadata?.full_name || user.email || 'Paciente',
          psychologist_photo: psychologist.profile_photo_url || psychologist.photo_url || '',
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          mode: modality,
          status: 'scheduled'
        })
        .select('*')
        .single();

      if (appointmentError) {
        console.error('Erro ao criar agendamento:', appointmentError);
        throw appointmentError;
      }

      setAppointment(data);
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
      const message = String(err?.message || '').toLowerCase();

      if (message.includes('row-level security') || message.includes('permission denied') || err?.code === '42501') {
        setError('O banco de dados bloqueou o agendamento. É necessário configurar as políticas de acesso (RLS) da tabela appointments no Supabase.');
      } else {
        setError(err?.message || 'Não foi possível confirmar o agendamento. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!psychologist) {
    return (
      <PageShell>
        <div className="text-center py-32">
          <p className="text-muted-foreground">
            Nenhum agendamento em andamento.
          </p>

          <Link
            to="/encontrar"
            className="mt-4 inline-block text-primary font-medium"
          >
            Encontrar psicólogo
          </Link>
        </div>
      </PageShell>
    );
  }

  const psychologistName =
    psychologist.professional_name ||
    psychologist.full_name ||
    'Profissional';

  const price =
    psychologist.session_price ??
    psychologist.price ??
    null;

  const duration =
    psychologist.session_duration ||
    50;

  const roomId =
    appointment?.id || null;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">

        <Link
          to={`/psicologo/${psychologist.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <div className="card-elevated p-8 text-center animate-scale-in">

          {loading ? (
            <>
              <div className="w-16 h-16 rounded-3xl bg-muted mx-auto mb-5 animate-pulse" />

              <h1 className="text-2xl font-heading font-bold">
                Confirmando sua consulta...
              </h1>

              <p className="text-muted-foreground mt-2">
                Aguarde enquanto registramos seu agendamento.
              </p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-500/15 mx-auto flex items-center justify-center mb-5">
                <Calendar
                  size={34}
                  className="text-red-600"
                />
              </div>

              <h1 className="text-2xl font-heading font-bold">
                Não foi possível confirmar
              </h1>

              <p className="text-muted-foreground mt-2">
                {error}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">

                <Link
                  to={`/psicologo/${psychologist.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all"
                >
                  Escolher outro horário
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/painel-paciente"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full glass-strong font-semibold hover:bg-white transition-all"
                >
                  Ir para meu painel
                </Link>

              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 mx-auto flex items-center justify-center mb-5">
                <CheckCircle2
                  size={34}
                  className="text-emerald-600"
                />
              </div>

              <h1 className="text-2xl font-heading font-bold">
                Tudo certo! Consulta confirmada.
              </h1>

              <p className="text-muted-foreground mt-2">
                Seu agendamento foi registrado. Você pode acompanhar os detalhes no painel e entrar na sala alguns minutos antes.
              </p>

              <div className="mt-7 text-left grid sm:grid-cols-2 gap-4 bg-muted/40 rounded-2xl p-5">

                <Detail
                  icon={Calendar}
                  label="Profissional"
                  value={psychologistName}
                />

                <Detail
                  icon={Clock}
                  label="Data e horário"
                  value={`${new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${day}T12:00:00`))}, ${slot}`}
                />

                <Detail
                  icon={
                    modality === 'online'
                      ? Video
                      : MapPin
                  }
                  label="Modalidade"
                  value={
                    modality === 'online'
                      ? 'Online (videochamada)'
                      : 'Presencial'
                  }
                />

                {modality === 'in_person' &&
                  psychologist.address && (
                    <Detail
                      icon={MapPin}
                      label="Endereço"
                      value={psychologist.address}
                    />
                  )}

                {price != null && (
                  <Detail
                    icon={Calendar}
                    label="Valor"
                    value={`R$ ${Number(price)
                      .toFixed(2)
                      .replace('.', ',')}`}
                  />
                )}

                <Detail
                  icon={Clock}
                  label="Duração"
                  value={`${duration} min`}
                />

              </div>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">

                {modality === 'online' && (
                  <Link
                    to="/videochamada"
                    state={{
                      roomId,
                      appointmentId: appointment?.id,
                      role: 'patient',
                      psychologistName,
                      time: slot
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all"
                  >
                    <Video size={17} />
                    Entrar na videochamada
                  </Link>
                )}

                <Link
                  to="/painel-paciente"
                  state={{
                    confirmed: {
                      appointmentId: appointment?.id,
                      psychologistName,
                      day,
                      slot,
                      modality,
                      roomId
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full glass-strong font-semibold hover:bg-white transition-all"
                >
                  Ir para meu painel
                  <ArrowRight size={17} />
                </Link>

              </div>
            </>
          )}

        </div>
      </div>
    </PageShell>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        size={18}
        className="text-primary mt-0.5 shrink-0"
      />

      <div>
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="text-sm font-medium mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
