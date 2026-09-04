import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
Calendar,
Clock,
Video,
MapPin,
Heart,
History,
Bell,
User,
Shield,
ArrowRight,
CheckCircle2,
BookHeart,
RefreshCw,
} from 'lucide-react';
import PageShell from '@/components/PageShell';
import { supabase } from '@/lib/supabase';

const menu = [
{
label: 'Início',
icon: ArrowRight,
path: '/painel',
},
{
label: 'Próxima consulta',
icon: Clock,
path: '/painel',
},
{
label: 'Histórico',
icon: History,
path: '/painel',
},
{
label: 'Favoritos',
icon: Heart,
path: '/favoritos',
},
{
label: 'Meu diário',
icon: BookHeart,
path: '/diario',
},
{
label: 'Dados da conta',
icon: User,
path: '/painel',
},
{
label: 'Privacidade',
icon: Shield,
path: '/privacidade',
},
{
label: 'Notificações',
icon: Bell,
path: '/notificacoes',
},
];

function getAppointmentDate(appointment) {
if (!appointment) {
return null;
}

if (appointment.scheduled_at) {
const date = new Date(appointment.scheduled_at);

```
if (!Number.isNaN(date.getTime())) {
  return date;
}
```

}

if (appointment.starts_at) {
const date = new Date(appointment.starts_at);

```
if (!Number.isNaN(date.getTime())) {
  return date;
}
```

}

if (appointment.date) {
const dateString = String(appointment.date);

```
const timeString =
  appointment.time ||
  appointment.slot ||
  '00:00';

const normalizedTime =
  String(timeString).length === 5
    ? String(timeString) + ':00'
    : String(timeString);

const date = new Date(
  String(dateString) + 'T' + normalizedTime
);

if (!Number.isNaN(date.getTime())) {
  return date;
}

const fallback = new Date(dateString);

if (!Number.isNaN(fallback.getTime())) {
  return fallback;
}
```

}

return null;
}

function formatDate(date) {
if (!date) {
return 'Data não informada';
}

return new Intl.DateTimeFormat('pt-BR', {
day: '2-digit',
month: '2-digit',
year: 'numeric',
}).format(date);
}

function formatDateLong(date) {
if (!date) {
return 'Data não informada';
}

return new Intl.DateTimeFormat('pt-BR', {
weekday: 'long',
day: '2-digit',
month: 'long',
year: 'numeric',
}).format(date);
}

function formatTime(date, appointment) {
if (appointment?.time) {
return String(appointment.time).slice(0, 5);
}

if (appointment?.slot) {
return String(appointment.slot).slice(0, 5);
}

if (date) {
return new Intl.DateTimeFormat('pt-BR', {
hour: '2-digit',
minute: '2-digit',
hour12: false,
}).format(date);
}

return 'Horário não informado';
}

function getPsychologistName(appointment) {
return (
appointment?.psychologist_name ||
appointment?.psychologistName ||
appointment?.professional_name ||
appointment?.professionalName ||
appointment?.psychologist?.professional_name ||
appointment?.psychologist?.name ||
'Psicólogo'
);
}

function getAppointmentTime(appointment) {
const date = getAppointmentDate(appointment);

return formatTime(date, appointment);
}

function getAppointmentModality(appointment) {
return String(
appointment?.modality ||
appointment?.mode ||
appointment?.type ||
'online'
).toLowerCase();
}

function isOnlineAppointment(appointment) {
const modality = getAppointmentModality(appointment);

return (
modality === 'online' ||
modality === 'video' ||
modality === 'videochamada'
);
}

function getStatusLabel(status) {
const labels = {
scheduled: 'Agendada',
confirmed: 'Confirmada',
completed: 'Realizada',
cancelled: 'Cancelada',
canceled: 'Cancelada',
pending: 'Pendente',
no_show: 'Não compareceu',
};

return (
labels[String(status || '').toLowerCase()] ||
status ||
'Agendada'
);
}

function getStatusClass(status) {
const normalizedStatus =
String(status || '').toLowerCase();

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

function getAppointmentId(appointment) {
return (
appointment?.id ||
appointment?.appointment_id ||
appointment?.appointmentId ||
null
);
}

function getRoomId(appointment) {
return (
appointment?.room_id ||
appointment?.roomId ||
getAppointmentId(appointment)
);
}

async function fetchAppointments(userId) {
const attempts = [
{
column: 'patient_id',
value: userId,
},
{
column: 'user_id',
value: userId,
},
];

let lastError = null;

for (const attempt of attempts) {
const result = await supabase
.from('appointments')
.select('*')
.eq(attempt.column, attempt.value);

```
if (!result.error) {
  const data = Array.isArray(result.data)
    ? result.data
    : [];

  return data.sort((a, b) => {
    const dateA = getAppointmentDate(a);
    const dateB = getAppointmentDate(b);

    if (!dateA && !dateB) {
      return 0;
    }

    if (!dateA) {
      return 1;
    }

    if (!dateB) {
      return -1;
    }

    return dateA.getTime() - dateB.getTime();
  });
}

lastError = result.error;

const message = String(
  result.error.message || ''
).toLowerCase();

const shouldTryNext =
  message.includes(attempt.column) ||
  message.includes('column') ||
  message.includes('does not exist') ||
  result.error.code === '42703';

if (!shouldTryNext) {
  throw result.error;
}
```

}

throw (
lastError ||
new Error(
'Não foi possível carregar as consultas.'
)
);
}

function getFriendlyError(error) {
const message = String(
error?.message || ''
).toLowerCase();

if (
message.includes('jwt') ||
message.includes('session') ||
message.includes('not authenticated') ||
message.includes('unauthorized')
) {
return 'Sua sessão expirou. Faça login novamente.';
}

if (
message.includes('row-level security') ||
message.includes('permission denied')
) {
return 'Você não tem permissão para visualizar suas consultas.';
}

if (
message.includes('appointments') &&
(
message.includes('relation') ||
message.includes('does not exist')
)
) {
return 'A tabela de consultas não foi encontrada no banco de dados.';
}

if (
message.includes('patient_id') ||
message.includes('user_id')
) {
return 'Não foi possível identificar o paciente desta consulta.';
}

return 'Não foi possível carregar suas consultas. Tente novamente.';
}

export default function PatientDashboard() {
const location = useLocation();

const [appointments, setAppointments] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const [confirmed, setConfirmed] = useState(
location.state?.confirmed || null
);

useEffect(() => {
setConfirmed(
location.state?.confirmed || null
);
}, [location.state]);

const loadAppointments = useCallback(async () => {
setLoading(true);
setError('');

```
try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    setAppointments([]);
    setError(
      'Sua sessão não foi encontrada. Faça login novamente.'
    );
    return;
  }

  const data = await fetchAppointments(user.id);

  setAppointments(data);
} catch (loadError) {
  console.error(
    'Erro ao carregar consultas:',
    loadError
  );

  console.error(
    'Mensagem do Supabase:',
    loadError?.message
  );

  console.error(
    'Detalhes do Supabase:',
    loadError?.details
  );

  console.error(
    'Código do Supabase:',
    loadError?.code
  );

  setAppointments([]);
  setError(
    getFriendlyError(loadError)
  );
} finally {
  setLoading(false);
}
```

}, []);

useEffect(() => {
loadAppointments();
}, [loadAppointments]);

const now = new Date();

const upcomingAppointments = useMemo(() => {
return appointments
.filter((appointment) => {
const status = String(
appointment?.status || ''
).toLowerCase();

```
    const cancelled =
      status === 'cancelled' ||
      status === 'canceled';

    if (cancelled) {
      return false;
    }

    const date =
      getAppointmentDate(appointment);

    if (!date) {
      return true;
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
```

}, [appointments, now]);

const historyAppointments = useMemo(() => {
return appointments
.filter((appointment) => {
const status = String(
appointment?.status || ''
).toLowerCase();

```
    if (
      status === 'completed' ||
      status === 'cancelled' ||
      status === 'canceled' ||
      status === 'no_show'
    ) {
      return true;
    }

    const date =
      getAppointmentDate(appointment);

    if (!date) {
      return false;
    }

    return date < now;
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
      dateB.getTime() -
      dateA.getTime()
    );
  });
```

}, [appointments, now]);

const next = upcomingAppointments[0];

const getVideoLinkState = (appointment) => {
return {
roomId: getRoomId(appointment),
appointmentId:
getAppointmentId(appointment),
role: 'patient',
psychologistName:
getPsychologistName(appointment),
time:
getAppointmentTime(appointment),
date:
appointment?.date ||
(
getAppointmentDate(appointment)
? getAppointmentDate(appointment).toISOString()
: ''
),
};
};

return ( <PageShell> <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

```
    <div className="mb-8">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold">
        Olá, bem-vindo(a) de volta
      </h1>

      <p className="text-muted-foreground mt-1">
        Acompanhe suas consultas e cuide do seu
        bem-estar no seu ritmo.
      </p>
    </div>

    {confirmed && (
      <div className="mb-8 card-elevated p-6 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/5 animate-scale-in">
        <div className="flex items-start gap-4">

          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2
              size={24}
              className="text-emerald-600"
            />
          </div>

          <div className="flex-1">

            <h3 className="font-heading font-semibold text-lg">
              Consulta agendada com sucesso!
            </h3>

            <p className="text-sm text-muted-foreground mt-1">
              Você receberá um lembrete por
              e-mail antes do horário.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">

              <Info
                label="Profissional"
                value={
                  confirmed.psychologistName ||
                  confirmed.professionalName ||
                  'Psicólogo'
                }
              />

              <Info
                label="Data"
                value={
                  confirmed.day ||
                  confirmed.date ||
                  'Não informada'
                }
              />

              <Info
                label="Horário"
                value={
                  confirmed.slot ||
                  confirmed.time ||
                  'Não informado'
                }
              />

              <Info
                label="Modalidade"
                value={
                  confirmed.modality === 'online'
                    ? 'Online (videochamada)'
                    : 'Presencial'
                }
              />

              {confirmed.modality === 'online' && (
                <div className="sm:col-span-2">

                  <Link
                    to="/videochamada"
                    state={{
                      roomId:
                        confirmed.roomId ||
                        confirmed.appointmentId ||
                        confirmed.id ||
                        null,

                      appointmentId:
                        confirmed.appointmentId ||
                        confirmed.id ||
                        null,

                      role: 'patient',

                      psychologistName:
                        confirmed.psychologistName ||
                        confirmed.professionalName ||
                        'Psicólogo',

                      time:
                        confirmed.slot ||
                        confirmed.time ||
                        '',
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white font-semibold text-sm shadow-soft hover:shadow-glow transition-all"
                  >
                    <Video size={16} />
                    Entrar na videochamada
                  </Link>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    )}

    {error && (
      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-500/5 p-5">

        <div className="flex items-center justify-between gap-4">

          <div className="min-w-0">

            <p className="text-sm font-medium text-red-700">
              Não foi possível carregar suas consultas.
            </p>

            <p className="text-xs text-red-600 mt-1 break-words">
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={loadAppointments}
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? 'animate-spin'
                  : ''
              }
            />

            Atualizar
          </button>

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

            {loading ? (
              <div className="mt-4 space-y-3">

                <div className="h-6 w-52 animate-shimmer rounded-lg" />

                <div className="h-4 w-full max-w-md animate-shimmer rounded-lg" />

              </div>
            ) : next ? (
              <>

                <h2 className="mt-2 text-xl font-heading font-bold">
                  {getPsychologistName(next)}
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  {formatDateLong(
                    getAppointmentDate(next)
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-muted-foreground">

                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={15} />

                    {formatDate(
                      getAppointmentDate(next)
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={15} />

                    {getAppointmentTime(next)}
                  </span>

                  <span className="inline-flex items-center gap-1.5">

                    {isOnlineAppointment(next) ? (
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

                {isOnlineAppointment(next) && (
                  <Link
                    to="/videochamada"
                    state={getVideoLinkState(next)}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all"
                  >
                    <Video size={17} />
                    Entrar na sala
                  </Link>
                )}

              </>
            ) : (
              <div className="mt-2">

                <p className="text-muted-foreground">
                  Você não tem consultas agendadas.
                </p>

                <Link
                  to="/encontrar"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white font-semibold text-sm"
                >
                  Encontrar psicólogo
                  <ArrowRight size={15} />
                </Link>

              </div>
            )}

          </div>
        </div>

        <div className="card-elevated p-6">

          <div className="flex items-center justify-between gap-4 mb-4">

            <h3 className="font-heading font-semibold">
              Próximas consultas
            </h3>

            <button
              type="button"
              onClick={loadAppointments}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline disabled:opacity-50"
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

          </div>

          {loading ? (
            <div className="space-y-3">

              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-shimmer rounded-xl"
                />
              ))}

            </div>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma consulta próxima.
            </p>
          ) : (
            <div className="space-y-2">

              {upcomingAppointments
                .slice(0, 5)
                .map((appointment, index) => (
                  <AppointmentItem
                    key={
                      getAppointmentId(
                        appointment
                      ) ||
                      'upcoming-' + index
                    }
                    appointment={appointment}
                  />
                ))}

            </div>
          )}

        </div>

        <div className="card-elevated p-6">

          <h3 className="font-heading font-semibold mb-4">
            Histórico de consultas
          </h3>

          {loading ? (
            <div className="space-y-3">

              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-shimmer rounded-xl"
                />
              ))}

            </div>
          ) : historyAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum histórico de consultas disponível.
            </p>
          ) : (
            <div className="space-y-2">

              {historyAppointments
                .slice(0, 10)
                .map((appointment, index) => (
                  <AppointmentItem
                    key={
                      getAppointmentId(
                        appointment
                      ) ||
                      'history-' + index
                    }
                    appointment={appointment}
                    history
                  />
                ))}

            </div>
          )}

        </div>

      </div>

      <div className="space-y-6">

        <div className="card-elevated p-5">

          <h3 className="font-heading font-semibold text-sm mb-3">
            Atalhos
          </h3>

          <div className="space-y-1">

            {menu.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label + '-' + item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors text-foreground/80"
                >
                  <Icon
                    size={16}
                    className="text-primary"
                  />

                  {item.label}
                </Link>
              );
            })}

          </div>

        </div>

        <Link
          to="/diario"
          className="block card-elevated p-5 hover:shadow-glow transition-all group"
        >

          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">

            <BookHeart
              size={22}
              className="text-primary"
            />

          </div>

          <h3 className="mt-4 font-heading font-semibold text-sm">
            Meu diário
          </h3>

          <p className="text-xs text-muted-foreground mt-1">
            Um espaço privado para registrar seus
            pensamentos e sentimentos.
          </p>

          <span className="mt-3 text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Abrir diário
            <ArrowRight size={13} />
          </span>

        </Link>

        <div className="card-elevated p-5 gradient-brand-soft">

          <Shield
            size={22}
            className="text-primary"
          />

          <h3 className="mt-3 font-heading font-semibold text-sm">
            Sua privacidade
          </h3>

          <p className="text-xs text-muted-foreground mt-1">
            Gerencie seus dados, consentimentos e
            sessões ativas.
          </p>

          <Link
            to="/privacidade"
            className="mt-3 text-xs font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            Abrir central
            <ArrowRight size={13} />
          </Link>

        </div>

      </div>

    </div>
  </div>
</PageShell>
```

);
}

function AppointmentItem({
appointment,
history = false,
}) {
const status =
appointment?.status ||
'scheduled';

const appointmentDate =
getAppointmentDate(appointment);

const appointmentId =
getAppointmentId(appointment);

const online =
isOnlineAppointment(appointment);

const canEnter =
!history &&
online &&
status !== 'cancelled' &&
status !== 'canceled';

return ( <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted transition-colors">

```
  <div className="min-w-0">

    <p className="text-sm font-medium truncate">
      {getPsychologistName(appointment)}
    </p>

    <p className="text-xs text-muted-foreground mt-0.5">

      {formatDate(appointmentDate)}

      {' · '}

      {getAppointmentTime(appointment)}

      {' · '}

      {online
        ? 'Online'
        : 'Presencial'}

    </p>

  </div>

  <div className="flex items-center gap-2 shrink-0">

    {canEnter && (
      <Link
        to="/videochamada"
        state={{
          roomId:
            getRoomId(appointment),

          appointmentId,

          role: 'patient',

          psychologistName:
            getPsychologistName(
              appointment
            ),

          time:
            getAppointmentTime(
              appointment
            ),

          date:
            appointment?.date ||
            (
              appointmentDate
                ? appointmentDate.toISOString()
                : ''
            ),
        }}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-brand text-white text-xs font-medium"
      >
        <Video size={13} />
        Entrar
      </Link>
    )}

    <span
      className={
        'text-xs px-2.5 py-1 rounded-full ' +
        getStatusClass(status)
      }
    >
      {getStatusLabel(status)}
    </span>

  </div>
</div>
```

);
}

function Info({
label,
value,
}) {
return ( <div>

```
  <p className="text-xs text-muted-foreground">
    {label}
  </p>

  <p className="font-medium mt-0.5">
    {value || 'Não informado'}
  </p>

</div>
```

);
}
