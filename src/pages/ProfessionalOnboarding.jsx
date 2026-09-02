import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Briefcase,
  Calendar,
  Camera,
  Video,
  ShieldCheck,
  Loader2
} from 'lucide-react';

import PageShell from '@/components/PageShell';
import { base44 } from '@/api/base44Client';
import {
  Field,
  TextInput,
  TextArea,
  SelectField,
  ChipGroup
} from '@/components/onboarding/FormFields';
import { Image } from '@/components/ui/image';

const STEPS = [
  { key: 'personal', label: 'Pessoal', icon: User },
  { key: 'professional', label: 'Profissional', icon: Briefcase },
  { key: 'service', label: 'Atendimento', icon: Calendar },
  { key: 'photo', label: 'Foto', icon: Camera },
  { key: 'video', label: 'Vídeo', icon: Video },
  { key: 'review', label: 'Revisão', icon: ShieldCheck },
];

const SPEC_OPTS = [
  'Ansiedade',
  'Depressão',
  'Relacionamentos',
  'Autoestima',
  'Luto',
  'Trauma',
  'TDAH',
  'Terapia de casal',
  'Adolescentes',
  'Estresse',
  'Fobias',
  'Pânico',
  'Autoconhecimento',
  'Burnout',
  'Comportamento alimentar'
];

const APPROACH_OPTS = [
  'TCC',
  'Psicanálise',
  'Humanista',
  'Jungiana',
  'Sistêmica',
  'Gestalt',
  'ACT',
  'Mindfulness',
  'Integração'
];

const THEME_OPTS = [
  'Ansiedade',
  'Depressão',
  'Relacionamentos',
  'Luto',
  'Trauma',
  'TDAH',
  'Estresse',
  'Autoestima',
  'Sexualidade',
  'Carreira',
  'Família',
  'Adicções'
];

const AUDIENCE_OPTS = [
  'Adultos',
  'Adolescentes',
  'Crianças',
  'Casais',
  'Idosos'
];

const LANG_OPTS = [
  'Português',
  'Inglês',
  'Espanhol',
  'Libras',
  'Francês'
];

const DAY_OPTS = [
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
  'Dom'
];

const SLOT_OPTS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
];

const REGION_OPTS = Array.from(
  { length: 15 },
  (_, i) => ({
    v: String(i + 1).padStart(2, '0'),
    l: `CRP ${String(i + 1).padStart(2, '0')}`
  })
);

const DEFAULTS = {
  full_name: '',
  professional_name: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  gender: '',

  crp_number: '',
  crp_region: '',
  education: '',
  institution: '',
  graduation_year: '',

  specializations: [],
  approaches: [],
  specialties: [],
  themes: [],
  modalities: ['online'],
  languages: ['Português'],
  audience: ['Adultos'],
  experience: '',

  price: 0,
  session_duration: 50,
  available_days: [],
  available_slots: [],
  cancellation_policy: '',
  address: '',
  about: '',

  photo_url: '',
  video_url: '',
};

export default function ProfessionalOnboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULTS);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => {
        if (!u) return;

        setData((current) => ({
          ...current,
          email: u.email || current.email,
          full_name:
            u.full_name || current.full_name || '',
        }));
      })
      .catch(() => {
        // Usuário não está logado.
        // O formulário continua funcionando.
      });
  }, []);

  const set = (key, value) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validate = () => {
    if (step === 0) {
      return (
        data.full_name.trim() &&
        data.email.trim() &&
        data.city.trim() &&
        data.state.trim()
      );
    }

    if (step === 1) {
      return (
        data.crp_number.trim() &&
        data.crp_region
      );
    }

    if (step === 2) {
      return (
        (data.modalities || []).length > 0
      );
    }

    if (step === 3) {
      return !!data.photo_url;
    }

    return true;
  };

  /*
   * UPLOAD DE ARQUIVO
   *
   * Esta versão permite selecionar o arquivo
   * e mostrar a prévia imediatamente.
   */
  const upload = async (file, key) => {
    if (!file) return;

    // Limita tamanho da foto
    if (
      key === 'photo_url' &&
      file.size > 5 * 1024 * 1024
    ) {
      alert('A foto deve ter no máximo 5 MB.');
      return;
    }

    // Limita tamanho do vídeo
    if (
      key === 'video_url' &&
      file.size > 50 * 1024 * 1024
    ) {
      alert('O vídeo deve ter no máximo 50 MB.');
      return;
    }

    setUploading(true);

    try {
      /*
       * Cria uma URL temporária para mostrar
       * a imagem/vídeo selecionado.
       */
      const file_url = URL.createObjectURL(file);

      set(key, file_url);
    } catch (error) {
      console.error(
        'Erro ao carregar arquivo:',
        error
      );

      alert(
        'Não foi possível carregar o arquivo.'
      );
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!data.email.trim()) {
      alert('Informe seu e-mail.');
      setStep(0);
      return;
    }

    if (!data.full_name.trim()) {
      alert('Informe seu nome completo.');
      setStep(0);
      return;
    }

    if (!data.crp_number.trim()) {
      alert('Informe seu número do CRP.');
      setStep(1);
      return;
    }

    if (!data.crp_region) {
      alert('Selecione a região do CRP.');
      setStep(1);
      return;
    }

    if (!data.photo_url) {
      alert('Envie uma foto profissional.');
      setStep(3);
      return;
    }

    setSubmitting(true);

    try {
      /*
       * Mantém a estrutura atual do projeto.
       */
      await base44.entities.Psychologist.create({
        ...data,

        verification_status: 'pending',

        video_status: data.video_url
          ? 'pending'
          : 'approved',

        rating: 5,
      });

      setDone(true);

    } catch (error) {
      console.error(
        'Erro ao cadastrar profissional:',
        error
      );

      alert(
        'Não foi possível enviar o cadastro. Verifique os dados e tente novamente.'
      );

    } finally {
      setSubmitting(false);
    }
  };

  /*
   * TELA DE SUCESSO
   */
  if (done) {
    return (
      <PageShell>

        <div className="max-w-xl mx-auto px-4 pt-20 pb-20 text-center">

          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 mx-auto flex items-center justify-center mb-6 animate-scale-in">

            <Check
              size={40}
              className="text-emerald-600"
            />

          </div>

          <h1 className="text-2xl font-heading font-bold">
            Cadastro enviado!
          </h1>

          <p className="text-muted-foreground mt-3">
            Recebemos seu perfil. Nossa equipe vai
            revisar seu CRP e suas informações
            profissionais. Você receberá uma
            notificação quando for aprovado(a).
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">

            <Link
              to="/painel-profissional"
              className="px-6 py-3 rounded-full gradient-brand text-white font-semibold"
            >
              Ir para meu painel
            </Link>

            <Link
              to="/"
              className="px-6 py-3 rounded-full glass-strong font-semibold"
            >
              Voltar ao início
            </Link>

          </div>

        </div>

      </PageShell>
    );
  }

  return (
    <PageShell>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

        {/* CABEÇALHO */}

        <div className="text-center mb-8">

          <h1 className="text-3xl font-heading font-bold">
            Cadastro profissional
          </h1>

          <p className="text-muted-foreground mt-2 text-sm">
            Conte um pouco sobre você. Leva poucos minutos.
          </p>

        </div>

        {/* ETAPAS */}

        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 gap-1">

          {STEPS.map((s, i) => {

            const Icon = s.icon;

            return (
              <div
                key={s.key}
                className="flex items-center gap-2 shrink-0"
              >

                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    i < step
                      ? 'bg-emerald-500 text-white'
                      : i === step
                      ? 'gradient-brand text-white shadow-soft'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >

                  {i < step ? (
                    <Check size={16} />
                  ) : (
                    <Icon size={16} />
                  )}

                </div>

                <span
                  className={`text-xs font-medium hidden sm:block ${
                    i === step
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>

                {i < STEPS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      i < step
                        ? 'bg-emerald-500'
                        : 'bg-border'
                    }`}
                  />
                )}

              </div>
            );

          })}

        </div>

        {/* CARD */}

        <div
          className="card-elevated p-6 sm:p-8 animate-fade-in"
          key={step}
        >

          {step === 0 && (
            <StepPersonal
              data={data}
              set={set}
            />
          )}

          {step === 1 && (
            <StepProfessional
              data={data}
              set={set}
            />
          )}

          {step === 2 && (
            <StepService
              data={data}
              set={set}
            />
          )}

          {step === 3 && (
            <StepPhoto
              data={data}
              upload={upload}
              uploading={uploading}
            />
          )}

          {step === 4 && (
            <StepVideo
              data={data}
              upload={upload}
              uploading={uploading}
            />
          )}

          {step === 5 && (
            <StepReview
              data={data}
            />
          )}

        </div>

        {/* NAVEGAÇÃO */}

        <div className="mt-6 flex items-center justify-between">

          <button
            type="button"
            onClick={() =>
              setStep((current) =>
                Math.max(0, current - 1)
              )
            }
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all"
          >

            <ArrowLeft size={16} />

            Voltar

          </button>

          {step < STEPS.length - 1 ? (

            <button
              type="button"
              onClick={() => {
                if (validate()) {
                  setStep(
                    (current) => current + 1
                  );
                }
              }}
              disabled={!validate()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft disabled:opacity-40 transition-all"
            >

              Continuar

              <ArrowRight size={16} />

            </button>

          ) : (

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft disabled:opacity-40 transition-all"
            >

              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Enviando...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Enviar para verificação
                </>
              )}

            </button>

          )}

        </div>

      </div>

    </PageShell>
  );
}


/* =====================================================
   ETAPA 1 — DADOS PESSOAIS
===================================================== */

function StepPersonal({ data, set }) {
  return (
    <div className="space-y-4">

      <h2 className="font-heading font-semibold text-lg">
        Dados pessoais
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">

        <Field label="Nome completo *">

          <TextInput
            value={data.full_name}
            onChange={(e) =>
              set(
                'full_name',
                e.target.value
              )
            }
            placeholder="Seu nome completo"
          />

        </Field>

        <Field
          label="Nome profissional"
          hint="Como quer ser conhecido(a)"
        >

          <TextInput
            value={data.professional_name}
            onChange={(e) =>
              set(
                'professional_name',
                e.target.value
              )
            }
            placeholder="Dra. Maria Silva"
          />

        </Field>

        <Field label="E-mail *">

          <TextInput
            value={data.email}
            onChange={(e) =>
              set(
                'email',
                e.target.value
              )
            }
            type="email"
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
          />

        </Field>

        <Field label="Telefone">

          <TextInput
            value={data.phone}
            onChange={(e) =>
              set(
                'phone',
                e.target.value
              )
            }
            placeholder="(11) 99999-9999"
            type="tel"
          />

        </Field>

        <Field label="Cidade *">

          <TextInput
            value={data.city}
            onChange={(e) =>
              set(
                'city',
                e.target.value
              )
            }
            placeholder="São Paulo"
          />

        </Field>

        <Field label="Estado *">

          <TextInput
            value={data.state}
            onChange={(e) =>
              set(
                'state',
                e.target.value
              )
            }
            placeholder="SP"
            maxLength={2}
          />

        </Field>

        <Field label="Gênero (opcional)">

          <TextInput
            value={data.gender}
            onChange={(e) =>
              set(
                'gender',
                e.target.value
              )
            }
          />

        </Field>

      </div>

    </div>
  );
}


/* =====================================================
   ETAPA 2 — DADOS PROFISSIONAIS
===================================================== */

function StepProfessional({ data, set }) {
  return (
    <div className="space-y-4">

      <h2 className="font-heading font-semibold text-lg">
        Dados profissionais
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">

        <Field label="Número do CRP *">

          <TextInput
            value={data.crp_number}
            onChange={(e) =>
              set(
                'crp_number',
                e.target.value
              )
            }
            placeholder="00000"
          />

        </Field>

        <Field label="Região do CRP *">

          <SelectField
            value={data.crp_region}
            onChange={(value) =>
              set(
                'crp_region',
                value
              )
            }
            options={REGION_OPTS}
            placeholder="Selecione"
          />

        </Field>

        <Field label="Formação">

          <TextInput
            value={data.education}
            onChange={(e) =>
              set(
                'education',
                e.target.value
              )
            }
            placeholder="Psicologia"
          />

        </Field>

        <Field label="Instituição">

          <TextInput
            value={data.institution}
            onChange={(e) =>
              set(
                'institution',
                e.target.value
              )
            }
          />

        </Field>

        <Field label="Ano de formação">

          <TextInput
            value={data.graduation_year}
            onChange={(e) =>
              set(
                'graduation_year',
                e.target.value
              )
            }
            placeholder="2018"
          />

        </Field>

      </div>

      <Field label="Especializações">

        <ChipGroup
          options={SPEC_OPTS}
          value={data.specializations}
          onChange={(value) =>
            set(
              'specializations',
              value
            )
          }
        />

      </Field>

      <Field label="Abordagens terapêuticas">

        <ChipGroup
          options={APPROACH_OPTS}
          value={data.approaches}
          onChange={(value) =>
            set(
              'approaches',
              value
            )
          }
        />

      </Field>

      <Field label="Especialidades">

        <ChipGroup
          options={SPEC_OPTS}
          value={data.specialties}
          onChange={(value) =>
            set(
              'specialties',
              value
            )
          }
        />

      </Field>

      <Field label="Temas de atuação">

        <ChipGroup
          options={THEME_OPTS}
          value={data.themes}
          onChange={(value) =>
            set(
              'themes',
              value
            )
          }
        />

      </Field>

      <Field label="Público atendido">

        <ChipGroup
          options={AUDIENCE_OPTS}
          value={data.audience}
          onChange={(value) =>
            set(
              'audience',
              value
            )
          }
        />

      </Field>

      <Field label="Idiomas">

        <ChipGroup
          options={LANG_OPTS}
          value={data.languages}
          onChange={(value) =>
            set(
              'languages',
              value
            )
          }
        />

      </Field>

      <Field label="Experiência profissional">

        <TextArea
          value={data.experience}
          onChange={(e) =>
            set(
              'experience',
              e.target.value
            )
          }
          rows={3}
          placeholder="Conte sobre sua trajetória"
        />

      </Field>

    </div>
  );
}


/* =====================================================
   ETAPA 3 — ATENDIMENTO
===================================================== */

function StepService({ data, set }) {
  return (
    <div className="space-y-4">

      <h2 className="font-heading font-semibold text-lg">
        Atendimento
      </h2>

      <Field label="Modalidades *">

        <ChipGroup
          options={[
            'online',
            'in_person'
          ]}
          value={data.modalities}
          onChange={(value) =>
            set(
              'modalities',
              value
            )
          }
        />

      </Field>

      <div className="grid sm:grid-cols-2 gap-4">

        <Field label="Valor da sessão (R$)">

          <TextInput
            type="number"
            value={data.price}
            onChange={(e) =>
              set(
                'price',
                Number(e.target.value)
              )
            }
            placeholder="200"
            min="0"
          />

        </Field>

        <Field label="Duração (min)">

          <TextInput
            type="number"
            value={data.session_duration}
            onChange={(e) =>
              set(
                'session_duration',
                Number(e.target.value)
              )
            }
            min="1"
          />

        </Field>

      </div>

      <Field label="Dias disponíveis">

        <ChipGroup
          options={DAY_OPTS}
          value={data.available_days}
          onChange={(value) =>
            set(
              'available_days',
              value
            )
          }
        />

      </Field>

      <Field label="Horários disponíveis">

        <ChipGroup
          options={SLOT_OPTS}
          value={data.available_slots}
          onChange={(value) =>
            set(
              'available_slots',
              value
            )
          }
        />

      </Field>

      <Field label="Endereço (se presencial)">

        <TextInput
          value={data.address}
          onChange={(e) =>
            set(
              'address',
              e.target.value
            )
          }
          placeholder="Rua, número, cidade"
        />

      </Field>

      <Field label="Política de cancelamento">

        <TextArea
          value={data.cancellation_policy}
          onChange={(e) =>
            set(
              'cancellation_policy',
              e.target.value
            )
          }
          rows={2}
        />

      </Field>

      <Field label="Sobre mim">

        <TextArea
          value={data.about}
          onChange={(e) =>
            set(
              'about',
              e.target.value
            )
          }
          rows={4}
          placeholder="Apresente-se para seus pacientes"
        />

      </Field>

    </div>
  );
}


/* =====================================================
   ETAPA 4 — FOTO
===================================================== */

function StepPhoto({
  data,
  upload,
  uploading
}) {
  return (
    <div className="space-y-5">

      <h2 className="font-heading font-semibold text-lg">
        Foto profissional
      </h2>

      <p className="text-sm text-muted-foreground">
        Adicione uma foto profissional para
        o seu perfil.
      </p>

      <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center">

        {data.photo_url ? (

          <div className="flex flex-col items-center gap-4">

            <div className="w-40 h-40 rounded-3xl overflow-hidden bg-muted">

              <img
                src={data.photo_url}
                className="w-full h-full object-cover"
                alt="Prévia da foto profissional"
              />

            </div>

            <div className="flex gap-3">

              <label className="px-4 py-2 rounded-full bg-muted text-sm font-medium hover:bg-muted/70 cursor-pointer">

                Trocar foto

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    upload(
                      e.target.files?.[0],
                      'photo_url'
                    )
                  }
                  disabled={uploading}
                />

              </label>

              <button
                type="button"
                onClick={() =>
                  window.confirm(
                    'Remover esta foto?'
                  ) &&
                  setTimeout(() => {}, 0)
                }
                className="px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Remover
              </button>

            </div>

          </div>

        ) : (

          <label className="cursor-pointer flex flex-col items-center gap-3">

            <div className="w-16 h-16 rounded-2xl gradient-brand-soft flex items-center justify-center text-primary">

              <Camera size={26} />

            </div>

            <span className="text-sm font-medium">

              {uploading
                ? 'Carregando foto...'
                : 'Enviar foto'}

            </span>

            <span className="text-xs text-muted-foreground">
              JPG, PNG ou WEBP · Máximo 5 MB
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) =>
                upload(
                  e.target.files?.[0],
                  'photo_url'
                )
              }
              disabled={uploading}
            />

          </label>

        )}

      </div>

      <div className="bg-muted/40 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">

        <p className="font-medium text-foreground">
          Orientações
        </p>

        <p>
          Envie uma foto recente, nítida e
          profissional do seu rosto.
        </p>

        <ul className="list-disc pl-4 space-y-0.5">

          <li>
            Rosto visível e boa iluminação
          </li>

          <li>
            Sem filtros ou imagens geradas por IA
          </li>

          <li>
            Sem fotos de terceiros
          </li>

          <li>
            Boa qualidade
          </li>

        </ul>

      </div>

    </div>
  );
}


/* =====================================================
   ETAPA 5 — VÍDEO
===================================================== */

function StepVideo({
  data,
  upload,
  uploading
}) {
  return (
    <div className="space-y-5">

      <h2 className="font-heading font-semibold text-lg">

        Vídeo de apresentação

        <span className="text-xs font-normal text-muted-foreground">
          {' '}(opcional)
        </span>

      </h2>

      <p className="text-sm text-muted-foreground">
        Apresente-se em até 60 segundos.
        Esse vídeo passa por moderação antes
        de aparecer publicamente.
      </p>

      <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center">

        {data.video_url ? (

          <div className="flex flex-col items-center gap-4">

            <video
              src={data.video_url}
              controls
              className="max-h-60 rounded-xl bg-black w-full"
            />

            <label className="text-xs text-primary font-medium hover:underline cursor-pointer">

              Trocar vídeo

              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) =>
                  upload(
                    e.target.files?.[0],
                    'video_url'
                  )
                }
                disabled={uploading}
              />

            </label>

          </div>

        ) : (

          <label className="cursor-pointer flex flex-col items-center gap-3">

            <div className="w-16 h-16 rounded-2xl gradient-brand-soft flex items-center justify-center text-primary">

              <Video size={26} />

            </div>

            <span className="text-sm font-medium">

              {uploading
                ? 'Carregando vídeo...'
                : 'Enviar vídeo'}

            </span>

            <span className="text-xs text-muted-foreground">
              MP4, WEBM ou MOV · Máximo 50 MB
            </span>

            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) =>
                upload(
                  e.target.files?.[0],
                  'video_url'
                )
              }
              disabled={uploading}
            />

          </label>

        )}

      </div>

    </div>
  );
}


/* =====================================================
   ETAPA 6 — REVISÃO
===================================================== */

function StepReview({ data }) {

  const rows = [
    ['Nome', data.full_name],

    [
      'Nome profissional',
      data.professional_name
    ],

    [
      'E-mail',
      data.email
    ],

    [
      'Telefone',
      data.phone
    ],

    [
      'CRP',
      `${data.crp_region}/${data.crp_number}`
    ],

    [
      'Cidade',
      `${data.city}/${data.state}`
    ],

    [
      'Formação',
      data.education
    ],

    [
      'Instituição',
      data.institution
    ],

    [
      'Abordagens',
      (data.approaches || []).join(', ')
    ],

    [
      'Especialidades',
      (data.specialties || []).join(', ')
    ],

    [
      'Modalidades',
      (data.modalities || []).join(', ')
    ],

    [
      'Público',
      (data.audience || []).join(', ')
    ],

    [
      'Idiomas',
      (data.languages || []).join(', ')
    ],

    [
      'Valor',
      data.price
        ? `R$ ${data.price}`
        : '—'
    ],

    [
      'Dias',
      (data.available_days || []).join(', ')
    ],

    [
      'Horários',
      (data.available_slots || []).join(', ')
    ],

    [
      'Foto',
      data.photo_url
        ? 'Enviada'
        : '—'
    ],

    [
      'Vídeo',
      data.video_url
        ? 'Enviado'
        : '—'
    ],
  ];

  return (
    <div className="space-y-4">

      <h2 className="font-heading font-semibold text-lg">
        Revise suas informações
      </h2>

      <p className="text-sm text-muted-foreground">
        Confira antes de enviar para verificação.
        Você poderá editar depois.
      </p>

      <div className="rounded-2xl bg-muted/40 divide-y divide-border">

        {rows.map(([key, value]) =>
          value ? (

            <div
              key={key}
              className="flex justify-between gap-4 px-4 py-2.5 text-sm"
            >

              <span className="text-muted-foreground">
                {key}
              </span>

              <span className="font-medium text-right break-all">
                {value}
              </span>

            </div>

          ) : null
        )}

      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-violet-soft/40 rounded-xl p-3">

        <ShieldCheck
          size={14}
          className="shrink-0 mt-0.5 text-primary"
        />

        <span>
          Seu perfil será analisado pela equipe
          EntreNós. Após a aprovação, ficará
          visível para pacientes com o selo
          de verificação.
        </span>

      </div>

    </div>
  );
}
