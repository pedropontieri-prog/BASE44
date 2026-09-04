import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Loader2,
  X,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

import {
  Field,
  TextInput,
  TextArea,
  SelectField,
  ChipGroup,
} from "@/components/onboarding/FormFields";

const STEPS = [
  { key: "personal", label: "Pessoal", icon: User },
  {
    key: "professional",
    label: "Profissional",
    icon: Briefcase,
  },
  {
    key: "service",
    label: "Atendimento",
    icon: Calendar,
  },
  {
    key: "photo",
    label: "Foto",
    icon: Camera,
  },
  {
    key: "video",
    label: "Vídeo",
    icon: Video,
  },
  {
    key: "review",
    label: "Revisão",
    icon: ShieldCheck,
  },
];

const SPEC_OPTS = [
  "Ansiedade",
  "Depressão",
  "Relacionamentos",
  "Autoestima",
  "Luto",
  "Trauma",
  "TDAH",
  "Terapia de casal",
  "Adolescentes",
  "Estresse",
  "Fobias",
  "Pânico",
  "Autoconhecimento",
  "Burnout",
  "Comportamento alimentar",
];

const APPROACH_OPTS = [
  "TCC",
  "Psicanálise",
  "Humanista",
  "Jungiana",
  "Sistêmica",
  "Gestalt",
  "ACT",
  "Mindfulness",
  "Integração",
];

const THEME_OPTS = [
  "Ansiedade",
  "Depressão",
  "Relacionamentos",
  "Luto",
  "Trauma",
  "TDAH",
  "Estresse",
  "Autoestima",
  "Sexualidade",
  "Carreira",
  "Família",
  "Adicções",
];

const AUDIENCE_OPTS = [
  "Adultos",
  "Adolescentes",
  "Crianças",
  "Casais",
  "Idosos",
];

const LANG_OPTS = [
  "Português",
  "Inglês",
  "Espanhol",
  "Libras",
  "Francês",
];

const DAY_OPTS = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom",
];

const SLOT_OPTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const REGION_OPTS = Array.from(
  { length: 15 },
  (_, i) => ({
    v: String(i + 1).padStart(2, "0"),
    l: `CRP ${String(i + 1).padStart(2, "0")}`,
  })
);

const DEFAULTS = {
  full_name: "",
  professional_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  gender: "",

  crp_number: "",
  crp_region: "",
  education: "",
  institution: "",
  graduation_year: "",

  specializations: [],
  approaches: [],
  specialties: [],
  themes: [],
  modalities: ["online"],
  languages: ["Português"],
  audience: ["Adultos"],
  experience: "",

  price: 0,
  session_duration: 50,
  available_days: [],
  available_slots: [],
  cancellation_policy: "",
  address: "",
  about: "",

  photo_url: "",
  video_url: "",
};

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULTS);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  /*
   * Carrega a sessão apenas para descobrir
   * quem está autenticado.
   *
   * Não usamos ausência inicial de sessão como
   * "sessão expirada" sem antes verificar o estado
   * real do Auth.
   */
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError) {
          console.error(
            "Erro ao carregar usuário:",
            userError
          );

          setUser(null);
          return;
        }

        if (!currentUser) {
          setUser(null);
          return;
        }

        setUser(currentUser);

        setData((current) => ({
          ...current,
          email:
            currentUser.email ||
            current.email,
          full_name:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            current.full_name,
        }));
      } catch (err) {
        console.error(
          "Erro ao carregar autenticação:",
          err
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    loadUser();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);

          setData((current) => ({
            ...current,
            email:
              session.user.email ||
              current.email,
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              current.full_name,
          }));

          setError("");
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const set = (key, value) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validate = () => {
    if (step === 0) {
      return Boolean(
        data.full_name?.trim() &&
          data.email?.trim() &&
          data.city?.trim() &&
          data.state?.trim()
      );
    }

    if (step === 1) {
      return Boolean(
        data.crp_number?.trim() &&
          data.crp_region
      );
    }

    if (step === 2) {
      return (
        Array.isArray(data.modalities) &&
        data.modalities.length > 0
      );
    }

    if (step === 3) {
      return Boolean(data.photo_url);
    }

    return true;
  };

  const getAuthenticatedUser = async () => {
    /*
     * Não confie somente no estado React.
     * Busca novamente no Supabase antes de salvar.
     */
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(
        "Não foi possível validar sua conta."
      );
    }

    if (!authData?.user) {
      throw new Error(
        "Você precisa estar conectado para continuar."
      );
    }

    return authData.user;
  };

  const upload = async (file, key) => {
    if (!file || uploading) return;

    setError("");

    const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

    const PHOTO_TYPES = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    const VIDEO_TYPES = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (key === "photo_url") {
      if (!PHOTO_TYPES.includes(file.type)) {
        setError(
          "Formato de foto não permitido. Use JPG, PNG ou WEBP."
        );
        return;
      }

      if (file.size > MAX_PHOTO_SIZE) {
        setError(
          "A foto deve ter no máximo 10 MB."
        );
        return;
      }
    }

    if (key === "video_url") {
      if (!VIDEO_TYPES.includes(file.type)) {
        setError(
          "Formato de vídeo não permitido. Use MP4, WEBM ou MOV."
        );
        return;
      }

      if (file.size > MAX_VIDEO_SIZE) {
        setError(
          "O vídeo deve ter no máximo 100 MB."
        );
        return;
      }
    }

    setUploading(true);

    try {
      const authenticatedUser =
        await getAuthenticatedUser();

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "file";

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      const folder =
        key === "photo_url"
          ? `professionals/${authenticatedUser.id}/photos`
          : `professionals/${authenticatedUser.id}/videos`;

      const filePath =
        `${folder}/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("profiles")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          }
        );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicData,
      } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      if (!publicData?.publicUrl) {
        throw new Error(
          "Não foi possível gerar a URL do arquivo."
        );
      }

      set(
        key,
        publicData.publicUrl
      );
    } catch (err) {
      console.error(
        "Erro no upload:",
        err
      );

      setError(
        err?.message ||
          "Não foi possível enviar o arquivo."
      );
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (submitting || uploading) return;

    setError("");

    if (!data.full_name?.trim()) {
      setError("Informe seu nome completo.");
      setStep(0);
      return;
    }

    if (!data.email?.trim()) {
      setError("Informe seu e-mail.");
      setStep(0);
      return;
    }

    if (!data.city?.trim()) {
      setError("Informe sua cidade.");
      setStep(0);
      return;
    }

    if (!data.state?.trim()) {
      setError("Informe seu estado.");
      setStep(0);
      return;
    }

    if (!data.crp_number?.trim()) {
      setError("Informe seu número do CRP.");
      setStep(1);
      return;
    }

    if (!data.crp_region) {
      setError("Selecione a região do CRP.");
      setStep(1);
      return;
    }

    if (
      !Array.isArray(data.modalities) ||
      data.modalities.length === 0
    ) {
      setError(
        "Selecione pelo menos uma modalidade."
      );
      setStep(2);
      return;
    }

    if (!data.photo_url) {
      setError(
        "Envie uma foto profissional."
      );
      setStep(3);
      return;
    }

    setSubmitting(true);

    try {
      const authenticatedUser =
        await getAuthenticatedUser();

      const psychologistData = {
        user_id: authenticatedUser.id,

        professional_name:
          data.professional_name?.trim() ||
          data.full_name.trim(),

        crp_number:
          data.crp_number.trim(),

        crp_region:
          data.crp_region,

        education:
          data.education?.trim() || null,

        institution:
          data.institution?.trim() || null,

        graduation_year:
          data.graduation_year
            ? Number(data.graduation_year)
            : null,

        specializations:
          Array.isArray(data.specializations)
            ? data.specializations
            : [],

        approaches:
          Array.isArray(data.approaches)
            ? data.approaches
            : [],

        experience:
          data.experience?.trim() || null,

        topics:
          Array.isArray(data.themes)
            ? data.themes
            : [],

        modalities:
          Array.isArray(data.modalities)
            ? data.modalities
            : [],

        languages:
          Array.isArray(data.languages)
            ? data.languages
            : [],

        audience:
          Array.isArray(data.audience)
            ? data.audience
            : [],

        city:
          data.city.trim(),

        state:
          data.state
            .trim()
            .toUpperCase(),

        phone:
          data.phone?.trim() || null,

        gender:
          data.gender?.trim() || null,

        session_price:
          Number(data.price) || 0,

        session_duration:
          Number(data.session_duration) || 50,

        available_days:
          Array.isArray(data.available_days)
            ? data.available_days
            : [],

        available_slots:
          Array.isArray(data.available_slots)
            ? data.available_slots
            : [],

        cancellation_policy:
          data.cancellation_policy?.trim() ||
          null,

        address:
          data.address?.trim() || null,

        bio:
          data.about?.trim() || null,

        profile_photo_url:
          data.photo_url,

        presentation_video_url:
          data.video_url || null,

        presentation_video_status:
          data.video_url
            ? "pending"
            : "approved",

        verification_status:
          "pending",

        public_profile:
          false,
      };

      /*
       * Primeiro verifica se já existe cadastro
       * profissional para esse usuário.
       */
      const {
        data: existing,
        error: findError,
      } = await supabase
        .from("psychologists")
        .select("id")
        .eq(
          "user_id",
          authenticatedUser.id
        )
        .maybeSingle();

      if (findError) {
        throw findError;
      }

      if (existing?.id) {
        const {
          error: updateError,
        } = await supabase
          .from("psychologists")
          .update(
            psychologistData
          )
          .eq(
            "id",
            existing.id
          )
          .eq(
            "user_id",
            authenticatedUser.id
          );

        if (updateError) {
          throw updateError;
        }
      } else {
        const {
          error: insertError,
        } = await supabase
          .from("psychologists")
          .insert(
            psychologistData
          );

        if (insertError) {
          throw insertError;
        }
      }

      setDone(true);
    } catch (err) {
      console.error(
        "Erro ao salvar cadastro profissional:",
        err
      );

      const message =
        err?.message ||
        "Não foi possível enviar seu cadastro.";

      setError(message);

      /*
       * Só redireciona para login quando realmente
       * não existe usuário autenticado.
       */
      if (
        message
          .toLowerCase()
          .includes("conectado")
      ) {
        setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: {
              from:
                "/cadastro-profissional",
            },
          });
        }, 1200);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2
              size={32}
              className="animate-spin mx-auto mb-4"
            />

            <p className="text-sm text-muted-foreground">
              Verificando sua conta profissional...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * Esse é o ponto mais importante:
   * usuário não autenticado não recebe "sessão expirada".
   *
   * Ele recebe uma opção para criar a conta profissional.
   */
  if (!user) {
    return (
      <PageShell>
        <div className="max-w-xl mx-auto px-4 pt-16 pb-20">
          <div className="card-elevated p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 mx-auto flex items-center justify-center mb-6">
              <Briefcase
                size={38}
                className="text-primary"
              />
            </div>

            <h1 className="text-2xl font-heading font-bold">
              Cadastro profissional
            </h1>

            <p className="text-muted-foreground mt-3 leading-relaxed">
              Para cadastrar seu perfil profissional,
              primeiro precisamos criar sua conta.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <Link
                to="/cadastro-profissional/criar-conta"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold"
              >
                Criar conta profissional
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full glass-strong font-semibold"
              >
                Já tenho conta
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell>
        <div className="max-w-xl mx-auto px-4 pt-20 pb-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 mx-auto flex items-center justify-center mb-6">
            <Check
              size={40}
              className="text-emerald-600"
            />
          </div>

          <h1 className="text-2xl font-heading font-bold">
            Cadastro enviado!
          </h1>

          <p className="text-muted-foreground mt-3">
            Recebemos seu perfil profissional.
            Nossa equipe vai revisar seu CRP e
            suas informações antes da publicação.
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold">
            Cadastro profissional
          </h1>

          <p className="text-muted-foreground mt-2 text-sm">
            Complete seu perfil para solicitar a
            verificação profissional.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
            <X
              size={18}
              className="shrink-0 mt-0.5"
            />

            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;

            return (
              <div
                key={s.key}
                className="flex items-center gap-2 shrink-0"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i < step
                      ? "bg-emerald-500 text-white"
                      : i === step
                      ? "gradient-brand text-white shadow-soft"
                      : "bg-muted text-muted-foreground"
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
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>

                {i <
                  STEPS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      i < step
                        ? "bg-emerald-500"
                        : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

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
              set={set}
            />
          )}

          {step === 4 && (
            <StepVideo
              data={data}
              upload={upload}
              uploading={uploading}
              set={set}
            />
          )}

          {step === 5 && (
            <StepReview data={data} />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setStep((current) =>
                Math.max(
                  0,
                  current - 1
                )
              )
            }
            disabled={
              step === 0 ||
              uploading ||
              submitting
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-muted"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          {step <
          STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                setError("");

                if (validate()) {
                  setStep(
                    (current) =>
                      current + 1
                  );

                  return;
                }

                if (step === 0) {
                  setError(
                    "Preencha nome, e-mail, cidade e estado."
                  );
                }

                if (step === 1) {
                  setError(
                    "Informe o CRP e a região."
                  );
                }

                if (step === 2) {
                  setError(
                    "Selecione pelo menos uma modalidade."
                  );
                }

                if (step === 3) {
                  setError(
                    "Envie uma foto profissional."
                  );
                }
              }}
              disabled={
                !validate() ||
                uploading ||
                submitting
              }
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft disabled:opacity-40"
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={
                submitting ||
                uploading
              }
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft disabled:opacity-40"
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
                "full_name",
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
                "professional_name",
                e.target.value
              )
            }
            placeholder="Dra. Maria Silva"
          />
        </Field>

        <Field label="E-mail *">
          <TextInput
            type="email"
            value={data.email}
            onChange={(e) =>
              set(
                "email",
                e.target.value
              )
            }
            autoComplete="email"
            readOnly
          />
        </Field>

        <Field label="Telefone">
          <TextInput
            type="tel"
            value={data.phone}
            onChange={(e) =>
              set(
                "phone",
                e.target.value
              )
            }
            placeholder="(11) 99999-9999"
          />
        </Field>

        <Field label="Cidade *">
          <TextInput
            value={data.city}
            onChange={(e) =>
              set(
                "city",
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
                "state",
                e.target.value.toUpperCase()
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
                "gender",
                e.target.value
              )
            }
          />
        </Field>
      </div>
    </div>
  );
}

function StepProfessional({ data, set }) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading font-semibold text-lg">
        Dados profissionais
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Número do CRP *">
          <TextInput
            value={data.crp_number}
            onChange={(e) =>
              set(
                "crp_number",
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
                "crp_region",
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
                "education",
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
                "institution",
                e.target.value
              )
            }
            placeholder="Nome da instituição"
          />
        </Field>

        <Field label="Ano de formação">
          <TextInput
            type="number"
            value={data.graduation_year}
            onChange={(e) =>
              set(
                "graduation_year",
                e.target.value
              )
            }
            placeholder="2020"
          />
        </Field>

        <Field label="Experiência">
          <TextInput
            value={data.experience}
            onChange={(e) =>
              set(
                "experience",
                e.target.value
              )
            }
            placeholder="Ex.: 5 anos"
          />
        </Field>
      </div>

      <Field
        label="Especializações"
        hint="Selecione as áreas em que atua"
      >
        <ChipGroup
          options={SPEC_OPTS}
          value={data.specializations}
          onChange={(value) =>
            set(
              "specializations",
              value
            )
          }
        />
      </Field>

      <Field label="Abordagens">
        <ChipGroup
          options={APPROACH_OPTS}
          value={data.approaches}
          onChange={(value) =>
            set(
              "approaches",
              value
            )
          }
        />
      </Field>
    </div>
  );
}

function StepService({ data, set }) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading font-semibold text-lg">
        Como você atende
      </h2>

      <Field label="Modalidades *">
        <ChipGroup
          options={[
            "online",
            "presencial",
          ]}
          value={data.modalities}
          onChange={(value) =>
            set(
              "modalities",
              value
            )
          }
        />
      </Field>

      <Field label="Público">
        <ChipGroup
          options={AUDIENCE_OPTS}
          value={data.audience}
          onChange={(value) =>
            set(
              "audience",
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
              "languages",
              value
            )
          }
        />
      </Field>

      <Field label="Temas">
        <ChipGroup
          options={THEME_OPTS}
          value={data.themes}
          onChange={(value) =>
            set(
              "themes",
              value
            )
          }
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Valor da sessão">
          <TextInput
            type="number"
            min="0"
            value={data.price}
            onChange={(e) =>
              set(
                "price",
                e.target.value
              )
            }
            placeholder="150"
          />
        </Field>

        <Field label="Duração da sessão">
          <SelectField
            value={String(
              data.session_duration
            )}
            onChange={(value) =>
              set(
                "session_duration",
                Number(value)
              )
            }
            options={[
              {
                v: "30",
                l: "30 minutos",
              },
              {
                v: "40",
                l: "40 minutos",
              },
              {
                v: "50",
                l: "50 minutos",
              },
              {
                v: "60",
                l: "60 minutos",
              },
              {
                v: "90",
                l: "90 minutos",
              },
            ]}
          />
        </Field>
      </div>

      <Field label="Dias disponíveis">
        <ChipGroup
          options={DAY_OPTS}
          value={data.available_days}
          onChange={(value) =>
            set(
              "available_days",
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
              "available_slots",
              value
            )
          }
        />
      </Field>

      <Field label="Sobre você">
        <TextArea
          value={data.about}
          onChange={(e) =>
            set(
              "about",
              e.target.value
            )
          }
          placeholder="Conte um pouco sobre sua experiência e forma de trabalho..."
          rows={5}
        />
      </Field>
    </div>
  );
}

function StepPhoto({
  data,
  upload,
  uploading,
  set,
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-semibold text-lg">
          Sua foto profissional
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Escolha uma foto clara e profissional.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        {data.photo_url ? (
          <div className="space-y-4">
            <img
              src={data.photo_url}
              alt="Foto profissional"
              className="w-40 h-40 rounded-3xl object-cover mx-auto"
            />

            <button
              type="button"
              onClick={() =>
                set(
                  "photo_url",
                  ""
                )
              }
              disabled={uploading}
              className="text-sm text-red-600 hover:underline"
            >
              Remover foto
            </button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              {uploading ? (
                <Loader2
                  size={28}
                  className="animate-spin"
                />
              ) : (
                <Camera size={28} />
              )}
            </div>

            <div className="font-semibold">
              {uploading
                ? "Enviando foto..."
                : "Selecionar foto"}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG ou WEBP · máximo 10 MB
            </p>

            <input
              type="file"
