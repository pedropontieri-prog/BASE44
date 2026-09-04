import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Users,
  ShieldCheck,
  ArrowRight,
  Bell,
  Settings,
  Wallet,
  AlertCircle,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import PageShell from '@/components/PageShell';
import VerificationBadge from '@/components/VerificationBadge';
import { Image } from '@/components/ui/image';
import { supabase } from '@/lib/supabase';

function getPsychologistName(profile) {
  return (
    profile?.professional_name ||
    profile?.full_name ||
    'Psicólogo'
  );
}

function getStatusLabel(status) {
  const labels = {
    scheduled: 'Agendada',
    confirmed: 'Confirmada',
    pending: 'Pendente',
    completed: 'Realizada',
    cancelled: 'Cancelada',
    canceled: 'Cancelada',
    no_show: 'Não compareceu',
  };

  return labels[status] || status || 'Agendada';
}

function getStatusClass(status) {
  if (
    status === 'cancelled' ||
    status === 'canceled'
  ) {
    return 'bg-red-50 text-red-600 dark:bg-red-500/10';
  }

  if (status === 'completed') {
    return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10';
  }

  if (status === 'pending') {
    return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10';
  }

  return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10';
}

function getAppointmentDate(appointment) {
  if (!appointment) {
    return null;
  }

  if (
    appointment.scheduled_at
  ) {
    const date = new Date(
      appointment.scheduled_at
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (
    appointment.starts_at
  ) {
    const date = new Date(
      appointment.starts_at
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (appointment.date) {
    const time =
      appointment.time ||
      appointment.slot ||
      '00:00';

    const date = new Date(
      `${appointment.date}T${time}:00`
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }

    const fallback = new Date(
      appointment.date
    );

    if (!Number.isNaN(fallback.getTime())) {
      return fallback;
    }
  }

  return null;
}

export default function PsychologistDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setProfile(null);
        setAppointments([]);
        setError(
          'Sua sessão não foi encontrada. Faça login novamente.'
        );
        return;
      }

      /*
       * Busca o perfil profissional do usuário logado.
       */
      const {
        data: psychologist,
        error: psychologistError,
      } = await supabase
        .from('psychologists')
        .select(`
          id,
          user_id,
          professional_name,
          crp_number,
          crp_region,
          verification_status,
          education,
          institution,
          graduation_year,
          specializations,
          approaches,
          specialties,
          experience,
          topics,
          modalities,
          languages,
          audience,
          city,
          state,
          phone,
          gender,
          session_price,
          session_duration,
          available_days,
          available_slots,
          cancellation_policy,
          address,
          bio,
          about,
          photo_url,
          profile_photo_url,
          presentation_video_url,
          presentation_video_status,
          public_profile
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (psychologistError) {
        throw psychologistError;
      }

      if (!psychologist) {
        setProfile(null);
        setAppointments([]);
        return;
      }

      setProfile(psychologist);

      /*
       * Busca somente as consultas vinculadas
       * ao psicólogo logado.
       *
       * A coluna esperada é psychologist_id.
       */
      const {
        data: appointmentData,
        error: appointmentsError,
      } = await supabase
        .from('appointments')
        .select('*')
        .eq(
          'psychologist_id',
          psychologist.id
        )
        .order('date', {
          ascending: true,
        })
        .order('time', {
          ascending: true,
        })
        .limit(100);

      if (appointmentsError) {
        throw appointmentsError;
      }

      setAppointments(
        Array.isArray(appointmentData)
          ? appointmentData
          : []
      );
    } catch (loadError) {
      console.error(
        'Erro ao carregar painel profissional:',
        loadError
      );

      setError(
        'Não foi possível carregar seu painel profissional.'
      );

      setProfile(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!mounted) {
        return;
      }

      await loadDashboard();
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const todays = useMemo(() => {
    return appointments
      .filter((appointment) => {
        return (
          appointment.date === today &&
          (
            appointment.status ===
              'scheduled' ||
            appointment.status ===
              'confirmed'
          )
        );
      })
      .sort((a, b) => {
        return String(
          a.time || ''
        ).localeCompare(
          String(b.time || '')
        );
      });
  }, [appointments, today]);

  const upcoming = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        const status =
          appointment.status;

        if (
          status === 'cancelled' ||
          status === 'canceled' ||
          status === 'completed' ||
          status === 'no_show'
        ) {
          return false;
        }

        const date =
          getAppointmentDate(
            appointment
          );

        if (!date) {
          return appointment.date >= today;
        }

        return date >= now;
      })
      .sort((a, b) => {
        const dateA =
          getAppointmentDate(a);

        const dateB =
          getAppointmentDate(b);

        if (!dateA && !dateB) {
          return 0;
        }

        if (!dateA) {
          return 1;
        }

        if (!dateB) {
          return -1;
        }

        return (
          dateA.getTime() -
          dateB.getTime()
        );
      });
  }, [appointments, today]);

  const next = upcoming[0];

  const completeness = useMemo(() => {
    if (!profile) {
      return 0;
    }

    const checks = [
      Boolean(profile.professional_name),
      Boolean(profile.crp_number),
      Boolean(
        profile.about ||
        profile.bio
      ),
      Boolean(
        profile.photo_url ||
        profile.profile_photo_url
      ),
      Array.isArray(profile.approaches) &&
        profile.approaches.length > 0,
      (
        Array.isArray(
          profile.specialties
        ) &&
        profile.specialties.length > 0
      ) ||
        (
          Array.isArray(
            profile.specializations
          ) &&
          profile.specializations.length > 0
        ),
      Array.isArray(
        profile.available_days
      ) &&
        profile.available_days.length > 0,
      Array.isArray(
        profile.available_slots
      ) &&
        profile.available_slots.length > 0,
    ];

    const completed =
      checks.filter(Boolean).length;

    return Math.round(
      (completed / checks.length) * 100
    );
  }, [profile]);

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-20">
          <div className="h-64 animate-shimmer rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-20 text-center">

          <div className="w-16 h-16 rounded-3xl gradient-brand-soft mx-auto flex items-center justify-center text-primary mb-5">
            <ShieldCheck size={30} />
          </div>

          <h1 className="text-2xl font-heading font-bold">
            Você ainda não tem um perfil profissional
          </h1>

          <p className="text-muted-foreground mt-2">
            Crie seu perfil para começar a atender
            pelo EntreNós.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          <Link
            to="/cadastro-profissional"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold"
          >
            Iniciar cadastro
            <ArrowRight size={17} />
          </Link>

        </div>
      </PageShell>
    );
  }

  const psychologistName =
    getPsychologistName(profile);

  const photo =
    profile.photo_url ||
    profile.profile_photo_url ||
    '';

  const verificationStatus =
    profile.verification_status ||
    'pending';

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">

          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">
              Olá, {psychologistName}
            </h1>

            <p className="text-muted-foreground mt-1 text-sm">
              Bem-vindo(a) ao seu painel profissional.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
              />
              Atualizar
            </button>

            <VerificationBadge
              status={verificationStatus}
              size="md"
            />

          </div>
        </div>

        {error && (
          <div className="mb-6 card-elevated p-4 border-red-200 bg-red-50 dark:bg-red-500/5 flex items-center gap-3">
            <AlertCircle
              size={20}
              className="text-red-500 shrink-0"
            />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {verificationStatus !== 'approved' && (
          <div className="mb-6 card-elevated p-5 border-amber-200 bg-amber-50/60 dark:bg-amber-500/5 flex items-start gap-3">

            <AlertCircle
              size={20}
              className="text-amber-500 shrink-0 mt-0.5"
            />

            <div>
              <p className="font-medium text-sm">
                {verificationStatus ===
                'pending'
                  ? 'Perfil em análise'
                  : verificationStatus ===
                    'needs_adjustments'
                  ? 'Ajustes solicitados'
                  : 'Verificação necessária'}
              </p>

              <p className="text-xs text-muted-foreground mt-0.5">
                {verificationStatus ===
                'pending'
                  ? 'Nossa equipe está revisando seu CRP e informações. Você será notificado(a) ao ser aprovado(a).'
                  : verificationStatus ===
                    'needs_adjustments'
                  ? 'Existem informações que precisam ser ajustadas antes da aprovação.'
                  : 'Complete sua verificação para disponibilizar seu perfil.'}
              </p>
            </div>

          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <div className="card-elevated p-6 relative overflow-hidden">

              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full gradient-brand opacity-10 blur-2xl" />

              <div className="relative">

                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Próxima consulta
                </span>

                {next ? (
                  <>
                    <h2 className="mt-2 text-xl font-heading font-bold">
                      {next.patient_name ||
                        next.patientName ||
                        'Paciente'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-muted-foreground">

                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={15} />
                        {next.date ||
                          'Data não informada'}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={15} />
                        {next.time ||
                          next.slot ||
                          'Horário não informado'}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        {next.modality ===
                        'online' ? (
                          <>
                            <Video size={15} />
                            Online
                          </>
                        ) : (
                          <>
                            <MapPin size={15} />
                            Presencial
                          </>
                        )}
                      </span>

                    </div>

                    {next.modality ===
                      'online' && (
                      <Link
                        to="/videochamada"
                        state={{
                          roomId:
                            next.id,
                          appointmentId:
                            next.id,
                          role: 'psychologist',
                          psychologistName:
                            psychologistName,
                          time:
                            next.time ||
                            next.slot ||
                            '',
                        }}
                        className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all"
                      >
                        <Video size={17} />
                        Entrar na próxima consulta
                      </Link>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-muted-foreground text-sm">
                    Você não tem consultas agendadas.
                  </p>
                )}

              </div>
            </div>

            <div className="card-elevated p-6">

              <h3 className="font-heading font-semibold mb-4">
                Consultas de hoje
              </h3>

              {todays.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma consulta para hoje.
                </p>
              ) : (
                <div className="space-y-2">

                  {todays.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted transition-colors"
                    >

                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {appointment.patient_name ||
                            appointment.patientName ||
                            'Paciente'}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {appointment.time ||
                            appointment.slot ||
                            'Horário não informado'}
                          {' · '}
                          {appointment.modality ===
                          'online'
                            ? 'Online'
                            : 'Presencial'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">

                        {appointment.modality ===
                          'online' && (
                          <Link
                            to="/videochamada"
                            state={{
                              roomId:
                                appointment.id,
                              appointmentId:
                                appointment.id,
                              role:
                                'psychologist',
                              psychologistName:
                                psychologistName,
                              time:
                                appointment.time ||
                                appointment.slot ||
                                '',
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-brand text-white text-xs font-medium"
                          >
                            <Video size={13} />
                            Entrar
                          </Link>
                        )}

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          {getStatusLabel(
                            appointment.status
                          )}
                        </span>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

            <div className="card-elevated p-6">

              <h3 className="font-heading font-semibold mb-4">
                Agenda
              </h3>

              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sua agenda está vazia.
                </p>
              ) : (
                <div className="space-y-2">

                  {upcoming
                    .slice(0, 15)
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted transition-colors"
                      >

                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {appointment.patient_name ||
                              appointment.patientName ||
                              'Paciente'}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {appointment.date ||
                              'Data não informada'}
                            {' · '}
                            {appointment.time ||
                              appointment.slot ||
                              'Horário não informado'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">

                          {appointment.modality ===
                            'online' && (
                            <Link
                              to="/videochamada"
                              state={{
                                roomId:
                                  appointment.id,
                                appointmentId:
                                  appointment.id,
                                role:
                                  'psychologist',
                                psychologistName:
                                  psychologistName,
                                time:
                                  appointment.time ||
                                  appointment.slot ||
                                  '',
                              }}
                              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-brand text-white text-xs font-medium"
                            >
                              <Video size={13} />
                              Entrar
                            </Link>
                          )}

                          <span className="text-xs px-2.5 py-1 rounded-full bg-violet-soft text-primary">
                            {appointment.modality ===
                            'online'
                              ? 'Online'
                              : 'Presencial'}
                          </span>

                        </div>

                      </div>
                    ))}

                </div>
              )}

            </div>

          </div>

          <div className="space-y-6">

            <div className="card-elevated p-5">

              <h3 className="font-heading font-semibold text-sm mb-3">
                Perfil público
              </h3>

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted shrink-0">

                  {photo ? (
                    <Image
                      src={photo}
                      fittingType="fill"
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary font-bold">
                      {psychologistName
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                </div>

                <div className="min-w-0">

                  <p className="text-sm font-medium truncate">
                    {psychologistName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    CRP{' '}
                    {profile.crp_region ||
                      ''}
                    {profile.crp_region &&
                    profile.crp_number
                      ? '/'
                      : ''}
                    {profile.crp_number ||
                      'Não informado'}
                  </p>

                </div>

              </div>

              <div className="mt-4">

                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    Completude do perfil
                  </span>

                  <span>
                    {completeness}%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full gradient-brand transition-all"
                    style={{
                      width: `${completeness}%`,
                    }}
                  />
                </div>

              </div>

              {verificationStatus ===
                'approved' &&
                profile.public_profile && (
                  <Link
                    to={`/psicologo/${profile.id}`}
                    className="mt-4 text-xs font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Ver meu perfil público
                    <ArrowRight size={13} />
                  </Link>
                )}

              {verificationStatus !==
                'approved' && (
                <Link
                  to="/cadastro-profissional"
                  className="mt-4 text-xs font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Editar perfil
                  <ArrowRight size={13} />
                </Link>
              )}

            </div>

            <div className="card-elevated p-5">

              <h3 className="font-heading font-semibold text-sm mb-3">
                Atalhos
              </h3>

              <div className="space-y-1">

                <Link
                  to="/painel-profissional"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors text-foreground/80"
                >
                  <Users
                    size={16}
                    className="text-primary"
                  />
                  Pacientes
                </Link>

                <Link
                  to="/painel-profissional"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors text-foreground/80"
                >
                  <Wallet
                    size={16}
                    className="text-primary"
                  />
                  Financeiro
                </Link>

                <Link
                  to="/notificacoes"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors text-foreground/80"
                >
                  <Bell
                    size={16}
                    className="text-primary"
                  />
                  Notificações
                </Link>

                <Link
                  to="/painel-profissional"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors text-foreground/80"
                >
                  <Settings
                    size={16}
                    className="text-primary"
                  />
                  Configurações
                </Link>

              </div>

            </div>

            <div className="card-elevated p-5 gradient-brand-soft">

              <ShieldCheck
                size={22}
                className="text-primary"
              />

              <h3 className="mt-3 font-heading font-semibold text-sm">
                Status da verificação
              </h3>

              <p className="text-xs text-muted-foreground mt-1">
                {verificationStatus ===
                'approved'
                  ? 'Seu perfil está verificado e pode ser exibido publicamente.'
                  : verificationStatus ===
                    'pending'
                  ? 'Seu perfil está aguardando análise da equipe.'
                  : 'Verifique seu perfil para começar a aparecer para pacientes.'}
              </p>

            </div>

          </div>

        </div>
      </div>
    </PageShell>
  );
}
