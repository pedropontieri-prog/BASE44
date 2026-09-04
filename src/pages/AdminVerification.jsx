import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  MapPin
} from 'lucide-react';
import PageShell from '@/components/PageShell';
import VerificationBadge from '@/components/VerificationBadge';
import { Image } from '@/components/ui/image';
import { supabase } from '@/lib/supabase';

export default function AdminVerification() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');

      const { data, error: queryError } = await supabase
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
          photo_url,
          profile_photo_url,
          presentation_video_url,
          presentation_video_status,
          public_profile
        `)
        .in('verification_status', [
          'pending',
          'in_review',
          'needs_adjustments'
        ])
        .order('id', { ascending: false })
        .limit(50);

      if (queryError) {
        throw queryError;
      }

      setItems(data || []);
    } catch (err) {
      console.error('Erro ao carregar profissionais:', err);
      setError('Não foi possível carregar os profissionais para verificação.');
      setItems([]);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError('');

        const {
          data: { user: authUser },
          error: authError
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authUser) {
          setUser(null);
          return;
        }

        let currentUser = {
          id: authUser.id,
          email: authUser.email,
          role: authUser.user_metadata?.role || 'patient',
          full_name: authUser.user_metadata?.full_name || ''
        };

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!profileError && profile) {
          currentUser = {
            ...currentUser,
            ...profile
          };
        }

        setUser(currentUser);

        if (currentUser.role === 'admin') {
          await load();
        }
      } catch (err) {
        console.error('Erro ao verificar administrador:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const act = async (status) => {
    if (!selected || acting) return;

    setActing(true);
    setError('');

    try {
      const updateData = {
        verification_status: status
      };

      if (status === 'approved') {
        updateData.public_profile = true;
      } else {
        updateData.public_profile = false;
      }

      const { error: updateError } = await supabase
        .from('psychologists')
        .update(updateData)
        .eq('id', selected.id);

      if (updateError) {
        throw updateError;
      }

      if (selected.user_id) {
        const notification = {
          user_id: selected.user_id,
          category: 'verification',
          read: false,
          link: '/painel-profissional',
          title:
            status === 'approved'
              ? 'Perfil aprovado!'
              : status === 'needs_adjustments'
                ? 'Ajustes solicitados'
                : 'Verificação reprovada',
          body:
            status === 'approved'
              ? 'Seu perfil foi verificado e já está visível para pacientes.'
              : status === 'needs_adjustments'
                ? 'Nossa equipe revisou seu cadastro e solicitou alguns ajustes. Veja os detalhes no painel profissional.'
                : 'Nossa equipe revisou seu cadastro e o perfil não foi aprovado neste momento.'
        };

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notification);

        if (notificationError) {
          console.warn(
            'Não foi possível criar a notificação:',
            notificationError
          );
        }
      }

      setSelected(null);
      await load();
    } catch (err) {
      console.error('Erro ao atualizar verificação:', err);
      setError(
        err?.message ||
          'Não foi possível atualizar a verificação do profissional.'
      );
    } finally {
      setActing(false);
    }
  };

  const getPhoto = (professional) => {
    return (
      professional.profile_photo_url ||
      professional.photo_url ||
      ''
    );
  };

  const getName = (professional) => {
    return (
      professional.professional_name ||
      professional.full_name ||
      'Profissional'
    );
  };

  const getArrayText = (value) => {
    if (!value) return '';

    if (Array.isArray(value)) {
      return value.filter(Boolean).join(', ');
    }

    return String(value);
  };

  const getPrice = (professional) => {
    if (
      professional.session_price === null ||
      professional.session_price === undefined ||
      professional.session_price === ''
    ) {
      return '—';
    }

    const numericPrice = Number(professional.session_price);

    if (Number.isNaN(numericPrice)) {
      return String(professional.session_price);
    }

    return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
  };

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-20">
          <div className="h-64 animate-shimmer rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-500/10 mx-auto flex items-center justify-center text-red-500 mb-5">
            <XCircle size={30} />
          </div>

          <h1 className="text-2xl font-heading font-bold">
            Acesso restrito
          </h1>

          <p className="text-muted-foreground mt-2 text-sm">
            Esta área é exclusiva para administradores do EntreNós.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
          Verificação de profissionais
        </h1>

        <p className="text-muted-foreground text-sm mb-8">
          Revise CRP e informações antes de publicar o perfil.
        </p>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {selected ? (
          <div className="animate-fade-in">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5"
            >
              <ArrowLeft size={16} />
              Voltar à lista
            </button>

            <div className="card-elevated p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-muted shrink-0">
                  {getPhoto(selected) ? (
                    <Image
                      src={getPhoto(selected)}
                      fittingType="fill"
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary text-4xl font-bold">
                      {getName(selected).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-heading font-bold">
                    {getName(selected)}
                  </h2>

                  <p className="text-sm text-muted-foreground mt-1">
                    CRP {selected.crp_region || '—'}/
                    {selected.crp_number || '—'}
                  </p>

                  <div className="mt-2">
                    <VerificationBadge
                      status={selected.verification_status}
                      size="sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-muted-foreground">
                    {selected.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} />
                        {selected.city}
                        {selected.state
                          ? `/${selected.state}`
                          : ''}
                      </span>
                    )}

                    {user?.email && selected.user_id === user.id && (
                      <span>{user.email}</span>
                    )}

                    {selected.phone && (
                      <span>{selected.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                <Info
                  label="Formação"
                  value={selected.education}
                />

                <Info
                  label="Instituição"
                  value={selected.institution}
                />

                <Info
                  label="Ano de formação"
                  value={selected.graduation_year}
                />

                <Info
                  label="Experiência"
                  value={selected.experience}
                />

                <Info
                  label="Abordagens"
                  value={getArrayText(selected.approaches)}
                />

                <Info
                  label="Especialidades"
                  value={getArrayText(selected.specializations)}
                />

                <Info
                  label="Temas"
                  value={getArrayText(selected.topics)}
                />

                <Info
                  label="Público"
                  value={getArrayText(selected.audience)}
                />

                <Info
                  label="Modalidades"
                  value={getArrayText(selected.modalities)}
                />

                <Info
                  label="Idiomas"
                  value={getArrayText(selected.languages)}
                />

                <Info
                  label="Valor da sessão"
                  value={getPrice(selected)}
                />

                <Info
                  label="Duração"
                  value={
                    selected.session_duration
                      ? `${selected.session_duration} minutos`
                      : ''
                  }
                />

                <Info
                  label="Dias disponíveis"
                  value={getArrayText(selected.available_days)}
                />

                <Info
                  label="Horários disponíveis"
                  value={getArrayText(selected.available_slots)}
                />

                <Info
                  label="Política de cancelamento"
                  value={selected.cancellation_policy}
                />

                <Info
                  label="Endereço"
                  value={selected.address}
                />

                <div className="sm:col-span-2">
                  <Info
                    label="Sobre"
                    value={selected.bio}
                  />
                </div>
              </div>

              {selected.presentation_video_url && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Vídeo de apresentação
                  </p>

                  <video
                    src={selected.presentation_video_url}
                    controls
                    className="w-full max-h-80 rounded-xl bg-black"
                  />
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  onClick={() => act('approved')}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Aprovar
                </button>

                <button
                  type="button"
                  onClick={() => act('needs_adjustments')}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <AlertTriangle size={16} />
                  Solicitar ajustes
                </button>

                <button
                  type="button"
                  onClick={() => act('rejected')}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reprovar
                </button>

                {acting && (
                  <Loader2
                    size={18}
                    className="animate-spin text-muted-foreground"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="card-elevated p-10 text-center">
                <ShieldCheck
                  size={32}
                  className="text-emerald-500 mx-auto mb-3"
                />

                <p className="font-medium">
                  Tudo em dia!
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum profissional aguardando verificação.
                </p>
              </div>
            ) : (
              items.map((professional) => (
                <button
                  type="button"
                  key={professional.id}
                  onClick={() => setSelected(professional)}
                  className="card-elevated p-5 w-full text-left flex items-center gap-4 hover:shadow-glow transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted shrink-0">
                    {getPhoto(professional) ? (
                      <Image
                        src={getPhoto(professional)}
                        fittingType="fill"
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary font-bold">
                        {getName(professional)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {getName(professional)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      CRP {professional.crp_region || '—'}/
                      {professional.crp_number || '—'}
                      {' · '}
                      {professional.city || '—'}
                    </p>
                  </div>

                  <VerificationBadge
                    status={professional.verification_status}
                    size="sm"
                  />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Info({ label, value }) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="text-sm mt-0.5 whitespace-pre-line">
        {String(value)}
      </p>
    </div>
  );
}
