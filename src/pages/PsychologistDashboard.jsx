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
  const normalizedStatus = String(
    status || ''
  ).toLowerCase();

  const labels = {
    scheduled: 'Agendada',
    confirmed: 'Confirmada',
    pending: 'Pendente',
    completed: 'Realizada',
    cancelled: 'Cancelada',
    canceled: 'Cancelada',
    no_show: 'Não compareceu',
  };

  return (
    labels[normalizedStatus] ||
    status ||
    'Agendada'
  );
}

function getStatusClass(status) {
  const normalizedStatus = String(
    status || ''
  ).toLowerCase();

  if (
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'canceled'
  ) {
    return 'bg-red-50 text-red-600 dark:bg-red-500/10';
  }

  if (normalizedStatus === 'completed') {
    return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10';
  }

  if (normalizedStatus === 'pending') {
    return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10';
  }

  return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10';
}

function getAppointmentDate(appointment) {
  if (!appointment) {
    return null;
  }

  if (appointment.scheduled_at) {
    const date = new Date(
      appointment.scheduled_at
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (appointment.starts_at) {
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

    const normalizedTime =
      String(time).length === 5
        ? `${String(time)}:00`
        : String(time);

    const date = new Date(
      `${appointment.date}T${normalizedTime}`
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

function getRoomId(appointment) {
  return (
    appointment?.room_id ||
    appointment?.roomId ||
    appointment?.id ||
    null
  );
}

function getAppointmentTime(appointment) {
  if (appointment?.time) {
    return String(
      appointment.time
    ).slice(0, 5);
  }

  if (appointment?.slot) {
    return String(
      appointment.slot
    ).slice(0, 5);
  }

  const date =
    getAppointmentDate(appointment);

  if (date) {
    return new Intl.DateTimeFormat(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    ).format(date);
  }

  return 'Horário não informado';
}

function isOnlineAppointment(appointment) {
  const modality = String(
    appointment?.modality ||
      appointment?.mode ||
      appointment?.type ||
      ''
  ).toLowerCase();

  return (
    modality === 'online' ||
    modality === 'video' ||
    modality === 'videochamada'
  );
}

export default function PsychologistDashboard() {
  const [profile, setProfile] =
    useState(null);

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [appointmentsWarning, setAppointmentsWarning] =
    useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');
    setAppointmentsWarning('');

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
       * O perfil profissional é buscado somente
       * pelo user_id do usuário autenticado.
       *
       * select("*") evita que uma coluna ausente
       * na tabela faça a consulta inteira falhar.
       */
      const {
        data: psychologist,
        error: psychologistError,
      } = await supabase
        .from('psychologists')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (psychologistError) {
        console.error(
          'Erro ao buscar perfil profissional:',
          psychologistError
        );

        throw psychologistError;
      }

      if (!psychologist) {
        setProfile(null);
        setAppointments([]);

        return;
      }

      /*
       * IMPORTANTE:
       * O perfil já foi encontrado.
       *
       * A partir daqui, qualquer problema na agenda
       * NÃO pode apagar o perfil profissional.
       */
      setProfile(psychologist);

      /*
       * A agenda é secundária.
       *
       * Não usamos order("date") ou order("time")
       * porque isso pode quebrar caso o schema da
       * tabela utilize outros nomes de campos.
       */
      try {
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
          .limit(100);

        if (appointmentsError) {
          console.error(
            'Erro ao carregar atendimentos:',
            appointmentsError
          );

          setAppointments([]);
          setAppointmentsWarning(
            'Não foi possível carregar sua agenda no momento.'
          );
        } else {
          setAppointments(
            Array.isArray(appointmentData)
              ? appointmentData
              : []
          );
        }
      } catch (appointmentsError) {
        console.error(
          'Erro inesperado na agenda:',
          appointmentsError
        );

        setAppointments([]);
        setAppointmentsWarning(
          'Não foi possível carregar sua agenda no momento.'
        );
      }
    } catch (loadError) {
      console.error(
        'Erro ao carregar painel profissional:',
        loadError
      );

      console.error(
        'Mensagem:',
        loadError?.message
      );

      console.error(
        'Código:',
        loadError?.code
      );

      setError(
        loadError?.message ||
          'Não foi possível carregar seu perfil profissional.'
      );

      setProfile(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const todays = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const status = String(
          appointment?.status || ''
        ).toLowerCase();

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

        if (date) {
          return (
            date.toISOString().slice(0, 10) ===
            today
          );
        }

        return (
          String(
            appointment?.date || ''
          ) === today
        );
      })
      .sort((a, b) => {
        return getAppointmentTime(a).localeCompare(
          getAppointmentTime(b)
        );
      });
  }, [appointments, today]);

  const upcoming = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        const status = String(
          appointment?.status || ''
        ).toLowerCase();

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
          return (
            String(
              appointment?.date || ''
            ) >= today
          );
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
      Boolean(
        profile.professional_name ||
        profile.full_name
      ),

      Boolean(
        profile.crp_number
      ),

      Boolean(
        profile.about ||
        profile.bio
      ),

      Boolean(
        profile.photo_url ||
        profile.profile_photo_url
      ),

      Array.isArray(
        profile.approaches
      ) &&
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
      (
        completed /
        checks.length
      ) * 100
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
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="max-w-lg w-full rounded-2xl border bg-white p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />

            <h1 className="text-2xl font-bold text-slate-900">
              Você ainda não tem um perfil profissional
            </h1>

            <p className="mt-3 text-gray-600">
              Crie seu perfil para começar a atender pelo EntreNós.
            </p>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 text-left break-words">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/cadastro-profissional"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700"
              >
                Iniciar cadastro
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-slate-500">
              Painel profissional
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Olá, {getPsychologistName(profile)}
            </h1>

            <div className="mt-2">
              <VerificationBadge
                status={
                  profile.verification_status
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboard}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <Link
              to="/notificacoes"
              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              <Bell className="w-5 h-5" />
            </Link>

            <Link
              to="/configuracoes"
              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {appointmentsWarning && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            {appointmentsWarning}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Calendar className="w-6 h-6 mb-3 text-slate-700" />

            <p className="text-sm text-slate-500">
              Hoje
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {todays.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Users className="w-6 h-6 mb-3 text-slate-700" />

            <p className="text-sm text-slate-500">
              Próximos atendimentos
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {upcoming.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <ShieldCheck className="w-6 h-6 mb-3 text-slate-700" />

            <p className="text-sm text-slate-500">
              Verificação
            </p>

            <div className="mt-2">
              <VerificationBadge
                status={
                  profile.verification_status
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Wallet className="w-6 h-6 mb-3 text-slate-700" />

            <p className="text-sm text-slate-500">
              Perfil completo
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {completeness}%
            </p>
          </div>
        </div>

        {next && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-sm text-slate-500">
                  Próximo atendimento
                </p>

                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {next.patient_name ||
                    next.patientName ||
                    'Paciente'}
                </h2>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4" />

                    {getAppointmentDate(next)
                      ? new Intl.DateTimeFormat(
                          'pt-BR'
                        ).format(
                          getAppointmentDate(next)
                        )
                      : next.date ||
                        'Data não informada'}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4" />

                    {getAppointmentTime(next)}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    {isOnlineAppointment(next) ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}

                    {isOnlineAppointment(next)
                      ? 'Online'
                      : 'Presencial'}
                  </span>
                </div>
              </div>

              {isOnlineAppointment(next) && (
                <Link
                  to={`/sala/${getRoomId(next)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700"
                >
                  Entrar na sala
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Próximos atendimentos
            </h2>

            <Link
              to="/agenda"
              className="text-sm inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              Ver agenda
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Nenhum atendimento próximo.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming
                .slice(0, 8)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          {appointment.patient_name ||
                            appointment.patientName ||
                            'Paciente'}
                        </h3>

                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          {getStatusLabel(
                            appointment.status
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                        <span>
                          {getAppointmentDate(
                            appointment
                          )
                            ? new Intl.DateTimeFormat(
                                'pt-BR'
                              ).format(
                                getAppointmentDate(
                                  appointment
                                )
                              )
                            : appointment.date ||
                              'Data não informada'}
                        </span>

                        <span>
                          {getAppointmentTime(
                            appointment
                          )}
                        </span>

                        <span>
                          {isOnlineAppointment(
                            appointment
                          )
                            ? 'Online'
                            : 'Presencial'}
                        </span>
                      </div>
                    </div>

                    {isOnlineAppointment(
                      appointment
                    ) && (
                      <Link
                        to={`/sala/${getRoomId(
                          appointment
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50"
                      >
                        <Video className="w-4 h-4" />
                        Sala
                      </Link>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
