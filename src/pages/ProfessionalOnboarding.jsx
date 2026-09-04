import React, { useEffect, useMemo, useState } from "react";
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
  AlertCircle,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

import {
  Field,
  TextInput,
  TextArea,
  SelectField,
  ChipGroup,
} from "@/components/onboarding/FormFields";

const STEPS = [
  {
    key: "personal",
    label: "Pessoal",
    icon: User,
  },
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
  { length: 24 },
  (_, index) => {
    const region = String(index + 1).padStart(2, "0");

    return {
      v: region,
      l: `CRP ${region}`,
    };
  }
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

  price: "",
  session_duration: 50,

  available_days: [],
  available_slots: [],

  cancellation_policy: "",
  address: "",
  about: "",

  photo_url: "",
  video_url: "",
};

function normalizeError(error) {
  if (!error) {
    return "Ocorreu um erro inesperado.";
  }

  const message =
    error?.message ||
    error?.error_description ||
    String(error);

  const normalized = message.toLowerCase();

  if (
    normalized.includes("jwt") ||
    normalized.includes("expired") ||
    normalized.includes("session") ||
    normalized.includes("not authenticated")
  ) {
    return "Sua sessão expirou. Faça login novamente para continuar.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("rls")
  ) {
    return "Você não tem permissão para realizar esta operação. Verifique as políticas de segurança do Supabase.";
  }

  if (
    normalized.includes("duplicate") ||
    normalized.includes("unique")
  ) {
    return "Já existe um cadastro profissional vinculado a esta conta.";
  }

  if (
    normalized.includes("bucket") &&
    normalized.includes("not found")
  ) {
    return "O armazenamento de arquivos do Supabase não foi encontrado. Verifique o bucket 'profiles'.";
  }

  return message;
}

function getFileExtension(file) {
  const name = file?.name || "";

  const extension = name.includes(".")
    ? name.split(".").pop()
    : "";

  return (
    extension?.toLowerCase() ||
    "file"
  );
}

function makeFileName(file) {
  const extension = getFileExtension(file);

  const uuid =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${uuid}.${extension}`;
}

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    authError,
  } = useAuth();

  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULTS);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * PREENCHE DADOS DO USUÁRIO AUTENTICADO
   * ---------------------------------------------------------
   *
   * A sessão agora vem exclusivamente do AuthContext.
   * Não usamos getSession/onAuthStateChange aqui.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    setData((current) => ({
      ...current,

      email:
        user.email ||
        current.email,

      full_name:
        user.full_name ||
        user.name ||
        current.full_name,

      phone:
        user.phone ||
        current.phone,
    }));
  }, [user]);

  /*
   * ---------------------------------------------------------
   * REDIRECIONAMENTO SE NÃO ESTIVER AUTENTICADO
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (authError) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      const returnTo =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      const query =
        returnTo && returnTo !== "/login"
          ? `?returnTo=${encodeURIComponent(returnTo)}`
          : "";

      navigate(`/login${query}`, {
        replace: true,
      });
    }
  }, [
    isLoadingAuth,
    isAuthenticated,
    user,
    authError,
    navigate,
  ]);

  /*
   * ---------------------------------------------------------
   * SET
   * ---------------------------------------------------------
   */
  const set = (key, value) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  /*
   * ---------------------------------------------------------
   * VALIDAÇÃO
   * ---------------------------------------------------------
   */
  const validateStep = (currentStep = step) => {
    if (currentStep === 0) {
      return Boolean(
        data.full_name?.trim() &&
          data.email?.trim() &&
          data.city?.trim() &&
          data.state?.trim()
      );
    }

    if (currentStep === 1) {
      return Boolean(
        data.crp_number?.trim() &&
          data.crp_region
      );
    }

    if (currentStep === 2) {
      return (
        Array.isArray(data.modalities) &&
        data.modalities.length > 0
      );
    }

    if (currentStep === 3) {
      return Boolean(data.photo_url);
    }

    return true;
  };

  const validationMessage = useMemo(() => {
    if (step === 0) {
      return "Preencha nome, e-mail, cidade e estado.";
    }

    if (step === 1) {
      return "Informe o número do CRP e a região.";
    }

    if (step === 2) {
      return "Selecione pelo menos uma modalidade de atendimento.";
    }

    if (step === 3) {
      return "Envie uma foto profissional.";
    }

    return "";
  }, [step]);

  /*
   * ---------------------------------------------------------
   * GARANTE USUÁRIO AUTENTICADO
   * ---------------------------------------------------------
   */
  const getAuthenticatedUser = async () => {
    if (user?.id) {
      return user;
    }

    const {
      data: authData,
      error: authErrorFromSupabase,
    } =
      await supabase.auth.getUser();

    if (authErrorFromSupabase) {
      throw new Error(
        normalizeError(
          authErrorFromSupabase
        )
      );
    }

    if (!authData?.user?.id) {
      throw new Error(
        "Sua sessão expirou. Faça login novamente para continuar."
      );
    }

    return authData.user;
  };

  /*
   * ---------------------------------------------------------
   * UPLOAD
   * ---------------------------------------------------------
   */
  const upload = async (file, key) => {
    if (!file || uploading) {
      return;
    }

    setError("");

    const MAX_PHOTO_SIZE =
      10 * 1024 * 1024;

    const MAX_VIDEO_SIZE =
      100 * 1024 * 1024;

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
          "Formato de foto não permitido. Envie JPG, PNG ou WEBP."
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
          "Formato de vídeo não permitido. Envie MP4, WEBM ou MOV."
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

      const fileName =
        makeFileName(file);

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
        data: publicUrlData,
      } =
        supabase.storage
          .from("profiles")
          .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "Não foi possível obter a URL do arquivo."
        );
      }

      setData((current) => ({
        ...current,
        [key]: publicUrl,
      }));
    } catch (uploadError) {
      console.error(
        "EntreNós: erro no upload:",
        uploadError
      );

      setError(
        normalizeError(uploadError)
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * PRÓXIMA ETAPA
   * ---------------------------------------------------------
   */
  const nextStep = () => {
    setError("");

    if (!validateStep(step)) {
      setError(validationMessage);
      return;
    }

    setStep((current) =>
      Math.min(
        STEPS.length - 1,
        current + 1
      )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * ---------------------------------------------------------
   * ETAPA ANTERIOR
   * ---------------------------------------------------------
   */
  const previousStep = () => {
    if (uploading || submitting) {
      return;
    }

    setError("");

    setStep((current) =>
      Math.max(0, current - 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * ---------------------------------------------------------
   * VALIDA CADASTRO COMPLETO
   * ---------------------------------------------------------
   */
  const validateBeforeSubmit = () => {
    if (!data.full_name?.trim()) {
      setError(
        "Informe seu nome completo."
      );
      setStep(0);
      return false;
    }

    if (!data.email?.trim()) {
      setError(
        "Informe seu e-mail."
      );
      setStep(0);
      return false;
    }

    if (!data.city?.trim()) {
      setError(
        "Informe sua cidade."
      );
      setStep(0);
      return false;
    }

    if (!data.state?.trim()) {
      setError(
        "Informe seu estado."
      );
      setStep(0);
      return false;
    }

    if (!data.crp_number?.trim()) {
      setError(
        "Informe seu número do CRP."
      );
      setStep(1);
      return false;
    }

    if (!data.crp_region) {
      setError(
        "Selecione a região do CRP."
      );
      setStep(1);
      return false;
    }

    if (
      !Array.isArray(data.modalities) ||
      data.modalities.length === 0
    ) {
      setError(
        "Selecione pelo menos uma modalidade."
      );
      setStep(2);
      return false;
    }

    if (!data.photo_url) {
      setError(
        "Envie uma foto profissional."
      );
      setStep(3);
      return false;
    }

    return true;
  };

  /*
   * ---------------------------------------------------------
   * ENVIA CADASTRO
   * ---------------------------------------------------------
   */
  const submit = async () => {
    if (submitting || uploading) {
      return;
    }

    setError("");

    if (!validateBeforeSubmit()) {
      return;
    }

    setSubmitting(true);

    try {
      const authenticatedUser =
        await getAuthenticatedUser();

      if (!authenticatedUser?.id) {
        throw new Error(
          "Não foi possível identificar sua conta."
        );
      }

      /*
       * Normaliza os dados.
       */
      const psychologistData = {
        user_id:
          authenticatedUser.id,

        professional_name:
          data.professional_name?.trim() ||
          data.full_name.trim(),

        crp_number:
          data.crp_number.trim(),

        crp_region:
          data.crp_region,

        education:
          data.education?.trim() ||
          null,

        institution:
          data.institution?.trim() ||
          null,

        graduation_year:
          data.graduation_year
            ? Number(data.graduation_year)
            : null,

        specializations:
          Array.isArray(
            data.specializations
          )
            ? data.specializations
            : [],

        approaches:
          Array.isArray(
            data.approaches
          )
            ? data.approaches
            : [],

        experience:
          data.experience?.trim() ||
          null,

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
          data.phone?.trim() ||
          null,

        gender:
          data.gender?.trim() ||
          null,

        session_price:
          Number(data.price) || 0,

        session_duration:
          Number(
            data.session_duration
          ) || 50,

        available_days:
          Array.isArray(
            data.available_days
          )
            ? data.available_days
            : [],

        available_slots:
          Array.isArray(
            data.available_slots
          )
            ? data.available_slots
            : [],

        cancellation_policy:
          data.cancellation_policy?.trim() ||
          null,

        address:
          data.address?.trim() ||
          null,

        bio:
          data.about?.trim() ||
          null,

        profile_photo_url:
          data.photo_url,

        presentation_video_url:
          data.video_url ||
          null,

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
       * para este usuário.
       */
      const {
        data: existingPsychologist,
        error: existingError,
      } = await supabase
        .from("psychologists")
        .select("id")
        .eq(
          "user_id",
          authenticatedUser.id
        )
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      /*
       * Atualiza se já existir.
       */
      if (existingPsychologist?.id) {
        const {
          error: updateError,
        } = await supabase
          .from("psychologists")
          .update(
            psychologistData
          )
          .eq(
            "id",
            existingPsychologist.id
          )
          .eq(
            "user_id",
            authenticatedUser.id
          );

        if (updateError) {
          throw updateError;
        }
      } else {
        /*
         * Cria se ainda não existir.
         */
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

      /*
       * Cadastro salvo.
       */
      setDone(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submitError) {
      console.error(
        "EntreNós: erro ao salvar profissional:",
        submitError
      );

      const message =
        normalizeError(
          submitError
        );

      setError(message);

      /*
       * Se a sessão realmente expirou,
       * manda para login.
       */
      const lower =
        message.toLowerCase();

      if (
        lower.includes("sessão") ||
        lower.includes("login") ||
        lower.includes("jwt") ||
        lower.includes("expired")
      ) {
        setTimeout(() => {
          const returnTo =
            window.location.pathname +
            window.location.search;

          navigate(
            `/login?returnTo=${encodeURIComponent(
              returnTo
            )}`,
            {
              replace: true,
            }
          );
        }, 1200);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (isLoadingAuth) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2
              size={34}
              className="animate-spin mx-auto mb-4 text-primary"
            />

            <p className="text-sm text-muted-foreground">
              Verificando sua sessão...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERRO DE AUTENTICAÇÃO
   * ---------------------------------------------------------
   */
  if (
    !isAuthenticated ||
    !user?.id
  ) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto px-4 pt-20 pb-20">
          <div className="card-elevated p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/15 mx-auto flex items-center justify-center mb-5">
              <AlertCircle
                size={30}
                className="text-amber-600"
              />
            </div>

            <h1 className="text-xl font-heading font-bold">
              Sessão expirada
            </h1>

            <p className="text-muted-foreground mt-3 text-sm">
              Sua sessão não está mais disponível.
              Faça login novamente para continuar
              seu cadastro profissional.
            </p>

            <Link
              to={`/login?returnTo=${encodeURIComponent(
                "/cadastro-profissional"
              )}`}
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold"
            >
              Fazer login
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * ---------------------------------------------------------
   * SUCESSO
   * ---------------------------------------------------------
   */
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
            Recebemos seu perfil. Nossa equipe
            vai revisar seu CRP e suas informações
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

  /*
   * ---------------------------------------------------------
   * FORMULÁRIO
   * ---------------------------------------------------------
   */
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold">
            Cadastro profissional
          </h1>

          <p className="text-muted-foreground mt-2 text-sm">
            Conte um pouco sobre você. Leva poucos minutos.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-3"
          >
            <X
              size={18}
              className="shrink-0 mt-0.5"
            />

            <span>
              {error}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 gap-1">
          {STEPS.map((currentStep, index) => {
            const Icon =
              currentStep.icon;

            return (
              <React.Fragment
                key={currentStep.key}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      index < step
                        ? "bg-emerald-500 text-white"
                        : index === step
                        ? "gradient-brand text-white shadow-soft"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < step ? (
                      <Check size={16} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>

                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      index === step
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {
                      currentStep.label
                    }
                  </span>
                </div>

                {index <
                  STEPS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      index < step
                        ? "bg-emerald-500"
                        : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
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
            <StepReview
              data={data}
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={previousStep}
            disabled={
              step === 0 ||
              uploading ||
              submitting
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          {step <
          STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                uploading ||
                submitting
              }
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft disabled:opacity-40 transition-all"
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
                  <ShieldCheck
                    size={16}
                  />
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

/*
 * ============================================================
 * DADOS PESSOAIS
 * ============================================================
 */

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
            onChange={(event) =>
              set(
                "full_name",
                event.target.value
              )
            }
            placeholder="Seu nome completo"
            autoComplete="name"
          />
        </Field>

        <Field
          label="Nome profissional"
          hint="Como quer ser conhecido(a)"
        >
          <TextInput
            value={
              data.professional_name
            }
            onChange={(event) =>
              set(
                "professional_name",
                event.target.value
              )
            }
            placeholder="Dra. Maria Silva"
          />
        </Field>

        <Field label="E-mail *">
          <TextInput
            type="email"
            value={data.email}
            onChange={(event) =>
              set(
                "email",
                event.target.value
              )
            }
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Telefone">
          <TextInput
            type="tel"
            value={data.phone}
            onChange={(event) =>
              set(
                "phone",
                event.target.value
              )
            }
            placeholder="(11) 99999-9999"
            autoComplete="tel"
          />
        </Field>

        <Field label="Cidade *">
          <TextInput
            value={data.city}
            onChange={(event) =>
              set(
                "city",
                event.target.value
              )
            }
            placeholder="São Paulo"
            autoComplete="address-level2"
          />
        </Field>

        <Field label="Estado *">
          <TextInput
            value={data.state}
            onChange={(event) =>
              set(
                "state",
                event.target.value
                  .toUpperCase()
                  .slice(0, 2)
              )
            }
            placeholder="SP"
            maxLength={2}
            autoComplete="address-level1"
          />
        </Field>

        <Field label="Gênero (opcional)">
          <TextInput
            value={data.gender}
            onChange={(event) =>
              set(
                "gender",
                event.target.value
              )
            }
            placeholder="Opcional"
          />
        </Field>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * DADOS PROFISSIONAIS
 * ============================================================
 */

function StepProfessional({
  data,
  set,
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading font-semibold text-lg">
        Dados profissionais
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Número do CRP *">
          <TextInput
            value={data.crp_number}
            onChange={(event) =>
              set(
                "crp_number",
                event.target.value
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
            onChange={(event) =>
              set(
                "education",
                event.target.value
              )
            }
            placeholder="Psicologia"
          />
        </Field>

        <Field label="Instituição">
          <TextInput
            value={data.institution}
            onChange={(event) =>
              set(
                "institution",
                event.target.value
              )
            }
            placeholder="Nome da instituição"
          />
        </Field>

        <Field label="Ano de formação">
          <TextInput
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={
              data.graduation_year
            }
            onChange={(event) =>
              set(
                "graduation_year",
                event.target.value
              )
            }
            placeholder="2020"
          />
        </Field>

        <Field label="Experiência">
          <TextInput
            value={data.experience}
            onChange={(event) =>
              set(
                "experience",
                event.target.value
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
          value={
            data.specializations
          }
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

/*
 * ============================================================
 * ATENDIMENTO
 * ============================================================
 */

function StepService({
  data,
  set,
}) {
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
            step="0.01"
            value={data.price}
            onChange={(event) =>
              set(
                "price",
                event.target.value
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
          value={
            data.available_days
          }
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
          value={
            data.available_slots
          }
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
          onChange={(event) =>
            set(
              "about",
              event.target.value
            )
          }
          placeholder="Conte um pouco sobre sua experiência e forma de trabalho..."
          rows={5}
        />
      </Field>
    </div>
  );
}

/*
 * ============================================================
 * FOTO
 * ============================================================
 */

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
              className="text-sm text-red-600 hover:underline"
              disabled={uploading}
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
              JPG, PNG ou WEBP · máximo
              10 MB
            </p>

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                upload(
                  file,
                  "photo_url"
                );

                event.target.value =
                  "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * VÍDEO
 * ============================================================
 */

function StepVideo({
  data,
  upload,
  uploading,
  set,
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-semibold text-lg">
          Vídeo de apresentação
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Apresente-se brevemente aos pacientes.
          Este campo é opcional.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-6">
        {data.video_url ? (
          <div className="space-y-4">
            <video
              src={data.video_url}
              controls
              preload="metadata"
              className="w-full max-h-96 rounded-2xl bg-black"
            />

            <button
              type="button"
              onClick={() =>
                set(
                  "video_url",
                  ""
                )
              }
              className="text-sm text-red-600 hover:underline"
              disabled={uploading}
            >
              Remover vídeo
            </button>
          </div>
        ) : (
          <label className="cursor-pointer block text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
              {uploading ? (
                <Loader2
                  size={28}
                  className="animate-spin"
                />
              ) : (
                <Video size={28} />
              )}
            </div>

            <div className="font-semibold">
              {uploading
                ? "Enviando vídeo..."
                : "Selecionar vídeo"}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              MP4, WEBM ou MOV · máximo
              100 MB
            </p>

            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                upload(
                  file,
                  "video_url"
                );

                event.target.value =
                  "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * REVISÃO
 * ============================================================
 */

function StepReview({ data }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-semibold text-lg">
          Revise seu cadastro
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Confira as informações antes de enviar.
        </p>
      </div>

      <div className="space-y-4">
        <ReviewItem
          label="Nome"
          value={
            data.professional_name ||
            data.full_name
          }
        />

        <ReviewItem
          label="E-mail"
          value={data.email}
        />

        <ReviewItem
          label="Telefone"
          value={data.phone}
        />

        <ReviewItem
          label="Localização"
          value={
            data.city && data.state
              ? `${data.city} - ${data.state}`
              : ""
          }
        />

        <ReviewItem
          label="CRP"
          value={
            data.crp_region &&
            data.crp_number
              ? `CRP ${data.crp_region} - ${data.crp_number}`
              : ""
          }
        />

        <ReviewItem
          label="Formação"
          value={
            data.education
          }
        />

        <ReviewItem
          label="Instituição"
          value={
            data.institution
          }
        />

        <ReviewItem
          label="Ano de formação"
          value={
            data.graduation_year
          }
        />

        <ReviewItem
          label="Experiência"
          value={
            data.experience
          }
        />

        <ReviewItem
          label="Modalidades"
          value={
            data.modalities?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Público"
          value={
            data.audience?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Idiomas"
          value={
            data.languages?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Especializações"
          value={
            data.specializations?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Abordagens"
          value={
            data.approaches?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Temas"
          value={
            data.themes?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Dias disponíveis"
          value={
            data.available_days?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Horários"
          value={
            data.available_slots?.join(
              ", "
            )
          }
        />

        <ReviewItem
          label="Valor"
          value={
            data.price
              ? `R$ ${Number(
                  data.price
                ).toFixed(2)}`
              : ""
          }
        />

        <ReviewItem
          label="Duração"
          value={
            data.session_duration
              ? `${data.session_duration} minutos`
              : ""
          }
        />

        <ReviewItem
          label="Foto"
          value={
            data.photo_url
              ? "Enviada ✓"
              : "Não enviada"
          }
        />

        <ReviewItem
          label="Vídeo"
          value={
            data.video_url
              ? "Enviado ✓"
              : "Não enviado"
          }
        />
      </div>

      <div className="rounded-2xl bg-muted/50 p-4 text-sm">
        <div className="flex gap-3">
          <ShieldCheck
            size={20}
            className="shrink-0"
          />

          <p>
            Seu cadastro será analisado pela
            equipe antes que o perfil seja
            disponibilizado publicamente.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewItem({
  label,
  value,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border pb-3">
      <span className="text-sm font-medium">
        {label}
      </span>

      <span className="text-sm text-muted-foreground sm:text-right break-words">
        {value || "Não informado"}
      </span>
    </div>
  );
}
