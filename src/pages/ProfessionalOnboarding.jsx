import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  LogIn,
  Lock,
  LogOut,
  ShieldCheck,
  User,
  UserPlus,
  Video,
  X,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

const STEPS = [
  { title: "Pessoal", icon: User },
  { title: "Registro profissional", icon: ShieldCheck },
  { title: "Atuação", icon: User },
  { title: "Atendimento", icon: Calendar },
  { title: "Foto e vídeo", icon: Camera },
  { title: "Revisão", icon: Check },
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
  "Outra",
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

const REGION_OPTS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i + 1).padStart(2, "0");

  return {
    value,
    label: `CRP ${value}`,
  };
});

const DEFAULTS = {
  full_name: "",
  professional_name: "",
  email: "",
  phone: "",
  whatsapp: "",
  city: "",
  state: "",
  gender: "",

  crp_number: "",
  crp_region: "",
  crp_status: "active",
  crp_verified: false,

  education: "Psicologia",
  institution: "",
  graduation_year: "",
  experience: "",

  specializations: [],
  approaches: [],
  specialties: [],
  themes: [],
  audience: ["Adultos"],
  languages: ["Português"],

  modalities: ["online"],
  epsico_registered: false,

  price: "",
  session_duration: 50,

  available_days: [],
  available_slots: [],

  cancellation_policy: "",

  address: "",
  address_number: "",
  address_complement: "",
  neighborhood: "",
  zip_code: "",

  about: "",

  photo_url: "",
  video_url: "",

  instagram: "",
  linkedin: "",
  website: "",

  ethical_commitment: false,
  information_truthful: false,
  privacy_commitment: false,
};

function getFriendlyError(error) {
  const message =
    error && error.message
      ? String(error.message)
      : "Ocorreu um erro inesperado.";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed")
  ) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered")
  ) {
    return "Este e-mail já está cadastrado. Tente entrar na sua conta.";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("at least") ||
      normalized.includes("characters") ||
      normalized.includes("short"))
  ) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  if (
    normalized.includes("duplicate") ||
    normalized.includes("unique constraint")
  ) {
    return "Este cadastro já existe.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("not authorized")
  ) {
    return "Você não tem permissão para realizar esta operação.";
  }

  if (
    normalized.includes("bucket") ||
    normalized.includes("storage") ||
    normalized.includes("object")
  ) {
    return "Não foi possível enviar o arquivo. Verifique as configurações de armazenamento.";
  }

  return message;
}

function makeFileName(file) {
  const originalName = file?.name || "arquivo";
  const parts = originalName.split(".");

  const extension =
    parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : "bin";

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${id}.${extension}`;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </span>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      >
        <option value="">Selecione...</option>

        {options.map((option) => (
          <option
            key={option.value || option}
            value={option.value || option}
          >
            {option.label || option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 5,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </span>

      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function Checkbox({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-primary"
      />

      <span className="text-sm leading-6">{children}</span>
    </label>
  );
}

function Chips({
  label,
  options,
  values = [],
  onChange,
  multiple = true,
}) {
  function toggle(option) {
    if (!multiple) {
      onChange(values.includes(option) ? [] : [option]);
      return;
    }

    if (values.includes(option)) {
      onChange(values.filter((item) => item !== option));
    } else {
      onChange([...values, option]);
    }
  }

  return (
    <div>
      <span className="mb-3 block text-sm font-medium">
        {label}
      </span>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={
                active
                  ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm text-primary-foreground"
                  : "rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:border-primary hover:text-primary"
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MediaUploadCard({
  type,
  preview,
  uploading,
  onChange,
  onRemove,
}) {
  const isPhoto = type === "photo";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold">
          {isPhoto
            ? "Foto de perfil"
            : "Vídeo de apresentação"}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {isPhoto
            ? "Use uma foto profissional, clara e atual."
            : "Apresente brevemente sua formação, abordagem e forma de trabalho."}
        </p>
      </div>

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
          {isPhoto ? (
            <img
              src={preview}
              alt="Pré-visualização da foto profissional"
              className="h-72 w-full object-cover"
            />
          ) : (
            <video
              src={preview}
              controls
              className="h-72 w-full object-cover"
            />
          )}

          {!uploading && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-3 top-3 rounded-full bg-background/90 p-2 shadow"
              aria-label="Remover arquivo"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : (
        <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-primary">
          <input
            type="file"
            accept={
              isPhoto
                ? "image/jpeg,image/png,image/webp"
                : "video/mp4,video/webm,video/quicktime"
            }
            className="hidden"
            onChange={onChange}
            disabled={uploading}
          />

          {uploading ? (
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
          ) : isPhoto ? (
            <Camera className="mb-3 h-10 w-10 text-muted-foreground" />
          ) : (
            <Video className="mb-3 h-10 w-10 text-muted-foreground" />
          )}

          <span className="font-medium">
            {uploading
              ? `Enviando ${isPhoto ? "foto" : "vídeo"}...`
              : `Adicionar ${
                  isPhoto
                    ? "foto de perfil"
                    : "vídeo de apresentação"
                }`}
          </span>

          <span className="mt-2 text-xs text-muted-foreground">
            {isPhoto
              ? "JPG, PNG ou WEBP • até 10 MB"
              : "MP4, WEBM ou MOV • até 200 MB"}
          </span>
        </label>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="font-semibold">{title}</h3>

          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULTS);

  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("register");

  const [authenticatedUser, setAuthenticatedUser] =
    useState(null);

  /*
   * IMPORTANTE:
   * Esse estado permite abrir o formulário imediatamente
   * depois do cadastro, mesmo quando o Supabase estiver
   * configurado para confirmação de e-mail.
   */
  const [registrationStarted, setRegistrationStarted] =
    useState(false);

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [done, setDone] = useState(false);
  const [confirmationSent, setConfirmationSent] =
    useState(false);

  const [error, setError] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  const isAuthenticated = Boolean(
    authenticatedUser && authenticatedUser.id
  );

  const displayName = useMemo(() => {
    return (
      data.professional_name ||
      data.full_name ||
      authenticatedUser?.user_metadata?.full_name ||
      authenticatedUser?.user_metadata?.name ||
      "Profissional"
    );
  }, [data, authenticatedUser]);

  function set(key, value) {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /*
   * Carrega a sessão existente.
   */
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!mounted) return;

        const user = sessionData?.session?.user || null;

        setAuthenticatedUser(user);

        if (user) {
          const metadata = user.user_metadata || {};

          setRegistrationStarted(true);

          setData((current) => ({
            ...current,
            email: user.email || current.email,
            full_name:
              current.full_name ||
              metadata.full_name ||
              metadata.name ||
              "",
          }));

          setAuthEmail(user.email || "");
          setAuthName(
            metadata.full_name ||
              metadata.name ||
              ""
          );
        }
      } catch (sessionError) {
        if (mounted) {
          setError(getFriendlyError(sessionError));
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: authSubscription,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        const user = session?.user || null;

        setAuthenticatedUser(user);

        if (user) {
          const metadata = user.user_metadata || {};

          setRegistrationStarted(true);

          setData((current) => ({
            ...current,
            email: user.email || current.email,
            full_name:
              current.full_name ||
              metadata.full_name ||
              metadata.name ||
              "",
          }));

          setAuthEmail(user.email || "");
        }
      }
    );

    return () => {
      mounted = false;
      authSubscription?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [photoPreview, videoPreview]);

  function validatePhoto(file) {
    if (!file) return "Selecione uma foto.";

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "A foto deve estar em JPG, PNG ou WEBP.";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "A foto deve ter no máximo 10 MB.";
    }

    return "";
  }

  function validateVideo(file) {
    if (!file) return "Selecione um vídeo.";

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "O vídeo deve estar em MP4, WEBM ou MOV.";
    }

    if (file.size > 200 * 1024 * 1024) {
      return "O vídeo deve ter no máximo 200 MB.";
    }

    return "";
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0] || null;

    const validationError = validatePhoto(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    set("photo_url", "");
    setError("");
  }

  function handleVideoChange(event) {
    const file = event.target.files?.[0] || null;

    const validationError = validateVideo(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    set("video_url", "");
    setError("");
  }

  function removePhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(null);
    setPhotoPreview("");
    set("photo_url", "");
  }

  function removeVideo() {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(null);
    setVideoPreview("");
    set("video_url", "");
  }

  /*
   * CADASTRO / LOGIN
   */
  async function authenticateProfessional() {
    setError("");
    setConfirmationSent(false);

    const email = authEmail.trim().toLowerCase();
    const password = authPassword;

    if (!email) {
      setError("Digite seu e-mail.");
      return;
    }

    if (!password) {
      setError("Digite sua senha.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (authMode === "register" && !authName.trim()) {
      setError("Digite seu nome completo.");
      return;
    }

    setAuthSubmitting(true);

    try {
      /*
       * NOVO CADASTRO
       */
      if (authMode === "register") {
        const {
          data: signUpData,
          error: signUpError,
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: authName.trim(),
              name: authName.trim(),
              role: "psychologist",
              account_type: "professional",
              user_type: "professional",
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        /*
         * Guarda os dados imediatamente.
         */
        setData((current) => ({
          ...current,
          email,
          full_name: authName.trim(),
        }));

        /*
         * Se o Supabase criou sessão automaticamente,
         * o formulário abre imediatamente.
         */
        if (signUpData.session && signUpData.user) {
          setAuthenticatedUser(signUpData.user);
          setRegistrationStarted(true);
          setStep(0);
          setError("");
          return;
        }

        /*
         * Se a confirmação de e-mail estiver habilitada,
         * ainda assim liberamos o formulário para preenchimento.
         *
         * O usuário poderá preencher tudo.
         */
        if (signUpData.user) {
          setRegistrationStarted(true);
          setConfirmationSent(true);
          setAuthenticatedUser(null);
          setStep(0);
          setError("");
          return;
        }
      }

      /*
       * LOGIN
       */
      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      const user = loginData.user;

      setAuthenticatedUser(user);
      setRegistrationStarted(true);

      const metadata = user.user_metadata || {};

      setData((current) => ({
        ...current,
        email: user.email || email,
        full_name:
          current.full_name ||
          metadata.full_name ||
          metadata.name ||
          "",
      }));

      setStep(0);
      setError("");
    } catch (authError) {
      setError(getFriendlyError(authError));
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function resendConfirmation() {
    setError("");

    if (!authEmail.trim()) {
      setError("Digite seu e-mail.");
      return;
    }

    try {
      const {
        error: resendError,
      } = await supabase.auth.resend({
        type: "signup",
        email: authEmail.trim().toLowerCase(),
      });

      if (resendError) {
        throw resendError;
      }

      setConfirmationSent(true);
    } catch (resendError) {
      setError(getFriendlyError(resendError));
    }
  }

  async function logoutProfessional() {
    await supabase.auth.signOut();

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setAuthenticatedUser(null);
    setRegistrationStarted(false);

    setData(DEFAULTS);

    setStep(0);
    setDone(false);
    setError("");

    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");

    setPhotoFile(null);
    setVideoFile(null);

    setPhotoPreview("");
    setVideoPreview("");

    setConfirmationSent(false);
  }

  /*
   * UPLOAD
   */
  async function uploadFileToStorage(
    file,
    type,
    userId
  ) {
    const folder =
      type === "photo"
        ? `professionals/${userId}/photos`
        : `professionals/${userId}/videos`;

    const filePath = `${folder}/${makeFileName(file)}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("profiles")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicData,
    } = supabase.storage
      .from("profiles")
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }

  async function uploadPendingFiles(userId) {
    let nextData = { ...data };

    if (photoFile) {
      const photoUrl =
        await uploadFileToStorage(
          photoFile,
          "photo",
          userId
        );

      nextData = {
        ...nextData,
        photo_url: photoUrl,
      };
    }

    if (videoFile) {
      const videoUrl =
        await uploadFileToStorage(
          videoFile,
          "video",
          userId
        );

      nextData = {
        ...nextData,
        video_url: videoUrl,
      };
    }

    setData(nextData);

    return nextData;
  }

  /*
   * VALIDAÇÃO DAS ETAPAS
   */
  function validateStep(stepNumber) {
    if (stepNumber === 0) {
      if (!data.full_name.trim()) {
        return "Informe seu nome completo.";
      }

      if (!data.email.trim()) {
        return "Informe seu e-mail.";
      }

      if (!data.phone.trim()) {
        return "Informe seu telefone profissional.";
      }

      if (!data.city.trim()) {
        return "Informe sua cidade.";
      }

      if (
        !data.state.trim() ||
        data.state.trim().length !== 2
      ) {
        return "Informe o estado com 2 letras.";
      }
    }

    if (stepNumber === 1) {
      if (!data.crp_number.trim()) {
        return "Informe o número do CRP.";
      }

      if (!data.crp_region) {
        return "Selecione a região do CRP.";
      }

      if (data.crp_status !== "active") {
        return "O cadastro profissional exige que o CRP esteja ativo.";
      }
    }

    if (stepNumber === 2) {
      if (!data.education.trim()) {
        return "Informe sua formação.";
      }

      if (!data.institution.trim()) {
        return "Informe a instituição de formação.";
      }

      if (!data.approaches.length) {
        return "Selecione pelo menos uma abordagem teórica.";
      }

      if (!data.audience.length) {
        return "Selecione pelo menos um público.";
      }

      if (!data.about.trim()) {
        return "Escreva uma apresentação profissional.";
      }
    }

    if (stepNumber === 3) {
      if (!data.modalities.length) {
        return "Selecione pelo menos uma modalidade de atendimento.";
      }

      if (
        data.modalities.includes("online") &&
        !data.epsico_registered
      ) {
        return "Confirme o cadastro no e-Psi para informar atendimento online.";
      }

      if (
        data.modalities.includes("presencial") &&
        !data.address.trim()
      ) {
        return "Informe o endereço do consultório para atendimento presencial.";
      }

      if (!data.available_days.length) {
        return "Selecione pelo menos um dia de atendimento.";
      }

      if (!data.available_slots.length) {
        return "Selecione pelo menos um horário disponível.";
      }
    }

    if (stepNumber === 4) {
      if (!data.photo_url && !photoFile) {
        return "Adicione uma foto de perfil.";
      }

      if (!data.video_url && !videoFile) {
        return "Adicione um vídeo de apresentação.";
      }
    }

    if (stepNumber === 5) {
      if (!data.ethical_commitment) {
        return "Confirme seu compromisso com o sigilo e as normas éticas da profissão.";
      }

      if (!data.information_truthful) {
        return "Confirme que as informações fornecidas são verdadeiras.";
      }

      if (!data.privacy_commitment) {
        return "Confirme o compromisso com a privacidade e proteção de dados.";
      }
    }

    return "";
  }

  function nextStep() {
    const validationError = validateStep(step);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
    }
  }

  function previousStep() {
    setError("");

    if (step > 0) {
      setStep((current) => current - 1);
    }
  }

  /*
   * ENVIO DO CADASTRO
   */
  async function submit() {
    if (submitting) return;

    setError("");

    /*
     * O envio definitivo exige sessão autenticada.
     */
    if (!isAuthenticated) {
      setError(
        "Sua conta foi criada, mas você precisa confirmar o e-mail e entrar novamente para enviar o cadastro."
      );
      return;
    }

    /*
     * Valida todas as etapas.
     */
    for (
      let index = 0;
      index < STEPS.length;
      index += 1
    ) {
      const validationError =
        validateStep(index);

      if (validationError) {
        setStep(index);
        setError(validationError);
        return;
      }
    }

    setSubmitting(true);

    setUploading(
      Boolean(photoFile || videoFile)
    );

    try {
      /*
       * Confirma usuário atual.
       */
      const {
        data: currentUserData,
        error: currentUserError,
      } =
        await supabase.auth.getUser();

      if (currentUserError) {
        throw currentUserError;
      }

      const user = currentUserData.user;

      if (!user) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      /*
       * Upload dos arquivos.
       */
      const finalData =
        await uploadPendingFiles(user.id);

      /*
       * Atualiza metadata do usuário.
       */
      const {
        error: metadataError,
      } = await supabase.auth.updateUser({
        data: {
          full_name: finalData.full_name,
          name:
            finalData.professional_name ||
            finalData.full_name,
          role: "psychologist",
          account_type: "professional",
          user_type: "professional",
        },
      });

      if (metadataError) {
        throw metadataError;
      }

      /*
       * Dados que serão gravados em psychologists.
       */
      const psychologistData = {
        user_id: user.id,

        professional_name:
          finalData.professional_name ||
          finalData.full_name,

        crp_number: finalData.crp_number,
        crp_region: finalData.crp_region,
        crp_status: finalData.crp_status,

        /*
         * Sempre começa como false.
         * A plataforma/admin deverá verificar.
         */
        crp_verified: false,

        education: finalData.education,
        institution: finalData.institution,
        graduation_year:
          finalData.graduation_year,
        experience: finalData.experience,

        specializations:
          finalData.specializations,

        approaches:
          finalData.approaches,

        specialties:
          finalData.specialties,

        topics:
          finalData.themes,

        modalities:
          finalData.modalities,

        languages:
          finalData.languages,

        audience:
          finalData.audience,

        epsico_registered:
          finalData.epsico_registered,

        city: finalData.city,
        state: finalData.state,

        phone: finalData.phone,
        whatsapp: finalData.whatsapp,
        gender: finalData.gender,

        session_price: finalData.price
          ? Number(finalData.price)
          : null,

        session_duration:
          Number(
            finalData.session_duration
          ) || 50,

        available_days:
          finalData.available_days,

        available_slots:
          finalData.available_slots,

        cancellation_policy:
          finalData.cancellation_policy,

        address:
          finalData.address,

        address_number:
          finalData.address_number,

        address_complement:
          finalData.address_complement,

        neighborhood:
          finalData.neighborhood,

        zip_code:
          finalData.zip_code,

        bio:
          finalData.about,

        photo_url:
          finalData.photo_url,

        profile_photo_url:
          finalData.photo_url,

        presentation_video_url:
          finalData.video_url,

        presentation_video_status:
          "pending",

        instagram:
          finalData.instagram,

        linkedin:
          finalData.linkedin,

        website:
          finalData.website,

        verification_status:
          "pending",

        /*
         * IMPORTANTE:
         * Nunca publicar automaticamente.
         */
        public_profile: false,
      };

      /*
       * Verifica se já existe cadastro.
       */
      const {
        data: existingProfessional,
        error: existingError,
      } = await supabase
        .from("psychologists")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      /*
       * Atualiza se existir.
       */
      if (existingProfessional) {
        const {
          error: updateError,
        } = await supabase
          .from("psychologists")
          .update(psychologistData)
          .eq(
            "id",
            existingProfessional.id
          );

        if (updateError) {
          throw updateError;
        }
      } else {
        /*
         * Cria novo cadastro.
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

      setDone(true);
    } catch (submitError) {
      setError(
        getFriendlyError(submitError)
      );
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  }

  /*
   * CARREGAMENTO
   */
  if (authLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  /*
   * TELA DE CADASTRO / LOGIN
   *
   * Só aparece quando ainda não começou
   * o cadastro.
   */
  if (
    !isAuthenticated &&
    !registrationStarted
  ) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {authMode === "register" ? (
                  <UserPlus className="h-8 w-8" />
                ) : (
                  <LogIn className="h-8 w-8" />
                )}
              </div>

              <p className="mb-2 text-sm font-medium text-primary">
                EntreNós • Área profissional
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {authMode === "register"
                  ? "Cadastre-se como profissional"
                  : "Entrar como profissional"}
              </h1>

              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Crie seu perfil profissional com informações de
                identificação, registro, formação, abordagem,
                serviços e contato.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                <div className="space-y-6">
                  {authMode === "register" && (
                    <Input
                      label="Nome completo"
                      value={authName}
                      onChange={(value) => {
                        setAuthName(value);
                        set(
                          "full_name",
                          value
                        );
                      }}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  )}

                  <Input
                    label="E-mail profissional"
                    value={authEmail}
                    onChange={(value) => {
                      setAuthEmail(value);
                      set("email", value);
                    }}
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />

                  <div>
                    <span className="mb-2 block text-sm font-medium">
                      Senha
                    </span>

                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={authPassword}
                        onChange={(e) =>
                          setAuthPassword(
                            e.target.value
                          )
                        }
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) =>
                              !current
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-label={
                          showPassword
                            ? "Ocultar senha"
                            : "Mostrar senha"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      authenticateProfessional
                    }
                    disabled={
                      authSubmitting
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : authMode ===
                      "register" ? (
                      <UserPlus className="h-5 w-5" />
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}

                    {authMode === "register"
                      ? "Criar conta profissional"
                      : "Entrar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(
                        (current) =>
                          current ===
                          "register"
                            ? "login"
                            : "register"
                      );

                      setError("");
                      setConfirmationSent(
                        false
                      );
                    }}
                    className="w-full text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    {authMode === "register"
                      ? "Já tenho uma conta profissional"
                      : "Ainda não tenho uma conta profissional"}
                  </button>

                  <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0" />

                    <span>
                      Seus dados são utilizados
                      para o funcionamento da
                      plataforma e para o processo
                      de verificação profissional.
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <InfoCard
                  icon={ShieldCheck}
                  title="CRP e identificação profissional"
                >
                  O cadastro profissional deverá
                  conter nome completo, número do
                  CRP, região do CRP e demais
                  informações necessárias para a
                  verificação.
                </InfoCard>

                <InfoCard
                  icon={User}
                  title="Formação e atuação"
                >
                  O profissional deverá informar
                  formação, instituição, abordagem
                  teórica, público atendido e áreas
                  de atuação.
                </InfoCard>

                <InfoCard
                  icon={Video}
                  title="Atendimento online"
                >
                  Caso ofereça atendimento online,
                  o profissional deverá informar a
                  situação do cadastro aplicável
                  no e-Psi.
                </InfoCard>

                <InfoCard
                  icon={Lock}
                  title="Ética e privacidade"
                >
                  O perfil deverá respeitar o
                  sigilo profissional, a privacidade,
                  a proteção de dados e as normas
                  éticas aplicáveis à Psicologia.
                </InfoCard>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <p className="font-semibold">
                    Consulte seu registro
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O cadastro profissional será
                    submetido à verificação antes
                    da publicação do perfil.
                  </p>

                  <a
                    href="https://cadastro.cfp.org.br/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Cadastro Nacional de Psicólogas(os)
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * CADASTRO CRIADO MAS AINDA SEM SESSÃO
   *
   * Nesse caso mostramos uma tela intermediária
   * explicando que o formulário foi liberado,
   * mas o envio final exige confirmação/login.
   *
   * O formulário continua disponível somente se
   * houver sessão. Para evitar perda de dados,
   * recomendamos confirmação/login antes do envio.
   */

  /*
   * CONCLUÍDO
   */
  if (done) {
    return (
      <PageShell>
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <Check className="h-10 w-10" />
            </div>

            <p className="mb-2 text-sm font-medium text-primary">
              EntreNós • Área profissional
            </p>

            <h1 className="text-3xl font-bold">
              Cadastro enviado!
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Seu cadastro profissional foi enviado
              para análise. O perfil permanecerá
              não publicado até a conclusão da
              verificação.
            </p>

            <div className="mt-8 space-y-3 text-left">
              <InfoCard
                icon={ShieldCheck}
                title="Verificação do CRP"
              >
                As informações profissionais
                fornecidas serão analisadas antes
                da publicação do perfil.
              </InfoCard>

              <InfoCard
                icon={Lock}
                title="Publicação segura"
              >
                O perfil foi enviado com status
                pendente e não ficará público
                enquanto estiver em análise.
              </InfoCard>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-medium transition hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </button>

              <button
                type="button"
                onClick={
                  logoutProfessional
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const progress =
    ((step + 1) / STEPS.length) * 100;

  /*
   * FORMULÁRIO
   */
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Área profissional
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Complete seu perfil profissional
            </h1>

            <p className="mt-2 text-muted-foreground">
              {displayName}, informe seus dados
              profissionais para que seu perfil possa
              ser analisado e publicado.
            </p>
          </div>

          <button
            type="button"
            onClick={
              logoutProfessional
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

        /*
         * AVISO DE CONFIRMAÇÃO
         */
        {confirmationSent &&
          !isAuthenticated && (
            <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <p className="font-semibold">
                    Conta criada com sucesso
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Você pode preencher o formulário
                    agora. Antes de enviar o cadastro,
                    confirme seu e-mail e entre
                    novamente na conta para concluir
                    o envio.
                  </p>

                  <button
                    type="button"
                    onClick={
                      resendConfirmation
                    }
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    Reenviar confirmação de e-mail
                  </button>
                </div>
              </div>
            </div>
          )}

        <div className="mb-8 rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((item, index) => {
              const Icon = item.icon;

              const active =
                index === step;

              const completed =
                index < step;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    if (index <= step) {
                      setError("");
                      setStep(index);
                    }
                  }}
                  className={
                    active
                      ? "flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      : completed
                      ? "flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                      : "flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </button>
              );
            })}
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Etapa {step + 1} de {STEPS.length}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          {/*
           * ETAPA 0
           */}
          {step === 0 && (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium text-primary">
                  Etapa 1
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Identificação e contato
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Informe seus dados básicos e os
                  meios de contato profissional.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Nome completo"
                  value={data.full_name}
                  onChange={(value) =>
                    set(
                      "full_name",
                      value
                    )
                  }
                  placeholder="Seu nome completo"
                  required
                />

                <Input
                  label="Nome profissional"
                  value={
                    data.professional_name
                  }
                  onChange={(value) =>
                    set(
                      "professional_name",
                      value
                    )
                  }
                  placeholder="Como deseja ser apresentado"
                />

                <Input
                  label="E-mail profissional"
                  value={data.email}
                  onChange={(value) =>
                    set(
                      "email",
                      value
                    )
                  }
                  type="email"
                  placeholder="seu@email.com"
                  required
                />

                <Input
                  label="Telefone profissional"
                  value={data.phone}
                  onChange={(value) =>
                    set(
                      "phone",
                      value
                    )
                  }
                  placeholder="(00) 00000-0000"
                  required
                />

                <Input
                  label="WhatsApp profissional"
                  value={data.whatsapp}
                  onChange={(value) =>
                    set(
                      "whatsapp",
                      value
                    )
                  }
                  placeholder="(00) 00000-0000"
                />

                <Select
                  label="Gênero"
                  value={data.gender}
                  onChange={(value) =>
                    set(
                      "gender",
                      value
                    )
                  }
                  options={[
                    "Feminino",
                    "Masculino",
                    "Não binário",
                    "Prefiro não informar",
                  ]}
                />

                <Input
                  label="Cidade"
                  value={data.city}
                  onChange={(value) =>
                    set(
                      "city",
                      value
                    )
                  }
                  placeholder="Sua cidade"
                  required
                />

                <Input
                  label="Estado"
                  value={data.state}
                  onChange={(value) =>
                    set(
                      "state",
                      value
                        .toUpperCase()
                        .slice(0, 2)
                    )
                  }
                  placeholder="SP"
                  required
                />
              </div>

              <InfoCard
                icon={ShieldCheck}
                title="Identificação profissional"
              >
                O nome profissional, CRP e demais
                informações exibidas no perfil devem
                corresponder à atuação profissional
                informada no cadastro.
              </InfoCard>
            </div>
          )}

          {/*
           * ETAPA 1
           */}
          {step === 1 && (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium text-primary">
                  Etapa 2
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Registro profissional
                </h2>

                <p className="mt-1 text-muted-foreground">
                  O número do CRP é uma informação
                  essencial para a identificação e
                  verificação do profissional.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-semibold">
                      Registro no Conselho Regional
                      de Psicologia
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Informe corretamente seu CRP e
                      a respectiva região. A plataforma
                      utilizará essas informações no
                      processo de verificação.
                    </p>

                    <a
                      href="https://cadastro.cfp.org.br/"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      Consultar Cadastro Nacional
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Número do CRP"
                  value={data.crp_number}
                  onChange={(value) =>
                    set(
                      "crp_number",
                      value
                    )
                  }
                  placeholder="Digite seu número de registro"
                  required
                />

                <Select
                  label="Região do CRP"
                  value={
                    data.crp_region
                  }
                  onChange={(value) =>
                    set(
                      "crp_region",
                      value
                    )
                  }
                  options={REGION_OPTS}
                  required
                />

                <Select
                  label="Situação do registro"
                  value={
                    data.crp_status
                  }
                  onChange={(value) =>
                    set(
                      "crp_status",
                      value
                    )
                  }
                  options={[
                    {
                      value: "active",
                      label: "Ativo",
                    },
                    {
                      value: "inactive",
                      label: "Inativo",
                    },
                    {
                      value: "suspended",
                      label: "Suspenso",
                    },
                  ]}
                  required
                />

                <Input
                  label="Ano de formação"
                  value={
                    data.graduation_year
                  }
                  onChange={(value) =>
                    set(
                      "graduation_year",
                      value
                    )
                  }
                  type="number"
                  placeholder="Ex.: 2020"
                />
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground">
                A informação de CRP fornecida pelo
                profissional será submetida ao
                processo de verificação da plataforma.
              </div>
            </div>
          )}

          {/*
           * ETAPA 2
           */}
          {step === 2 && (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium text-primary">
                  Etapa 3
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Formação e atuação
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Essas informações ajudam o paciente
                  a entender sua formação, abordagem
                  e áreas de atuação.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Formação"
                  value={
                    data.education
                  }
                  onChange={(value) =>
                    set(
                      "education",
                      value
                    )
                  }
                  placeholder="Psicologia"
                  required
                />

                <Input
                  label="Instituição de formação"
                  value={
                    data.institution
                  }
                  onChange={(value) =>
                    set(
                      "institution",
                      value
                    )
                  }
                  placeholder="Nome da instituição"
                  required
                />

                <Input
                  label="Experiência profissional"
                  value={
                    data.experience
                  }
                  onChange={(value) =>
                    set(
                      "experience",
                      value
                    )
                  }
                  placeholder="Ex.: 5 anos"
                />
              </div>

              <Chips
                label="Abordagem teórica"
                options={
                  APPROACH_OPTS
                }
                values={
                  data.approaches
                }
                onChange={(values) =>
                  set(
                    "approaches",
                    values
                  )
                }
              />

              <Chips
                label="Especializações"
                options={SPEC_OPTS}
                values={
                  data.specializations
                }
                onChange={(values) =>
                  set(
                    "specializations",
                    values
                  )
                }
              />

              <Chips
                label="Áreas de atuação"
                options={SPEC_OPTS}
                values={
                  data.specialties
                }
                onChange={(values) =>
                  set(
                    "specialties",
                    values
                  )
                }
              />

              <Chips
                label="Temas de atendimento"
                options={
                  THEME_OPTS
                }
                values={
                  data.themes
                }
                onChange={(values) =>
                  set(
                    "themes",
                    values
                  )
                }
              />

              <Chips
                label="Público atendido"
                options={
                  AUDIENCE_OPTS
                }
                values={
                  data.audience
                }
                onChange={(values) =>
                  set(
                    "audience",
                    values
                  )
                }
              />

              <Chips
                label="Idiomas"
                options={LANG_OPTS}
                values={
                  data.languages
                }
                onChange={(values) =>
                  set(
                    "languages",
                    values
                  )
                }
              />

              <TextArea
                label="Sobre você"
                value={
                  data.about
                }
                onChange={(value) =>
                  set(
                    "about",
                    value
                  )
                }
                placeholder="Apresente sua formação, experiência, abordagem, forma de trabalho e como você pode ajudar seus pacientes."
                rows={7}
                required
              />

              <InfoCard
                icon={User}
                title="Comunicação profissional"
              >
                Evite promessas de resultados,
                garantias de cura, informações
                enganosas ou qualquer conteúdo que
                possa induzir o paciente a erro.
              </InfoCard>
            </div>
          )}

          {/*
           * ETAPA 3
           */}
          {step === 3 && (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium text-primary">
                  Etapa 4
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Atendimento e serviços
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Informe como você atende, sua
                  disponibilidade, valores e condições
                  do serviço.
                </p>
              </div>

              <Chips
                label="Modalidades de atendimento"
                options={[
                  "online",
                  "presencial",
                  "híbrido",
                ]}
                values={
                  data.modalities
                }
                onChange={(values) =>
                  set(
                    "modalities",
                    values
                  )
                }
              />

              {data.modalities.includes(
                "online"
              ) && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex gap-3">
                    <Video className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                    <div className="w-full">
                      <p className="font-semibold">
                        Atendimento psicológico
                        online
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Informe sua situação no e-Psi
                        e mantenha os registros
                        necessários para o atendimento
                        psicológico por meios digitais.
                      </p>

                      <Checkbox
                        checked={
                          data.epsico_registered
                        }
                        onChange={(value) =>
                          set(
                            "epsico_registered",
                            value
                          )
                        }
                      >
                        Confirmo que possuo o cadastro
                        pertinente no e-Psi para
                        atendimento psicológico online,
                        quando aplicável à minha atuação.
                      </Checkbox>

                      <a
                        href="https://cadastro.epsicologia.cfp.org.br/"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        Acessar e-Psi
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {data.modalities.includes(
                "presencial"
              ) && (
                <div className="space-y-5 rounded-2xl border border-border bg-muted/30 p-5">
                  <div>
                    <h3 className="font-semibold">
                      Local do atendimento presencial
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Informe o endereço profissional
                      onde o atendimento presencial é
                      realizado.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Endereço"
                      value={
                        data.address
                      }
                      onChange={(value) =>
                        set(
                          "address",
                          value
                        )
                      }
                      placeholder="Rua, avenida..."
                      required
                    />

                    <Input
                      label="Número"
                      value={
                        data.address_number
                      }
                      onChange={(value) =>
                        set(
                          "address_number",
                          value
                        )
                      }
                      placeholder="Número"
                    />

                    <Input
                      label="Complemento"
                      value={
                        data.address_complement
                      }
                      onChange={(value) =>
                        set(
                          "address_complement",
                          value
                        )
                      }
                      placeholder="Sala, conjunto..."
                    />

                    <Input
                      label="Bairro"
                      value={
                        data.neighborhood
                      }
                      onChange={(value) =>
                        set(
                          "neighborhood",
                          value
                        )
                      }
                      placeholder="Bairro"
                    />

                    <Input
                      label="CEP"
                      value={
                        data.zip_code
                      }
                      onChange={(value) =>
                        set(
                          "zip_code",
                          value
                        )
                      }
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Valor da sessão"
                  value={
                    data.price
                  }
                  onChange={(value) =>
                    set(
                      "price",
                      value
                    )
                  }
                  type="number"
                  placeholder="Ex.: 150"
                />

                <Input
                  label="Duração da sessão (minutos)"
                  value={
                    data.session_duration
                  }
                  onChange={(value) =>
                    set(
                      "session_duration",
                      value
                    )
                  }
                  type="number"
                  placeholder="50"
                />
              </div>

              <Chips
                label="Dias disponíveis"
                options={DAY_OPTS}
                values={
                  data.available_days
                }
                onChange={(values) =>
                  set(
                    "available_days",
                    values
                  )
                }
              />

              <Chips
                label="Horários disponíveis"
                options={
                  SLOT_OPTS
                }
                values={
                  data.available_slots
                }
                onChange={(values) =>
                  set(
                    "available_slots",
                    values
                  )
                }
              />

              <TextArea
                label="Política de cancelamento e reagendamento"
                value={
                  data.cancellation_policy
                }
                onChange={(value) =>
                  set(
                    "cancellation_policy",
                    value
                  )
                }
                placeholder="Informe de forma clara sua política de cancelamento e reagendamento."
                rows={4}
              />

              <div className="grid gap-5 md:grid-cols-3">
                <Input
                  label="Instagram profissional"
                  value={
                    data.instagram
                  }
                  onChange={(value) =>
                    set(
                      "instagram",
                      value
                    )
                  }
                  placeholder="@seuperfil"
                />

                <Input
                  label="LinkedIn"
                  value={
                    data.linkedin
                  }
                  onChange={(value) =>
                    set(
                      "linkedin",
                      value
                    )
                  }
                  placeholder="Perfil profissional"
                />

                <Input
                  label="Site profissional"
                  value={
                    data.website
                  }
                  onChange={(value) =>
                    set(
                      "website",
                      value
                    )
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/*
           * ETAPA 4
           */}
          {step === 4 && (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium text-primary">
                  Etapa 5
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Foto e apresentação
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Uma apresentação profissional ajuda
                  o paciente a conhecer melhor o
                  profissional antes de entrar em
                  contato.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <MediaUploadCard
                  type="photo"
                  preview={
                    photoPreview ||
                    data.photo_url
                  }
                  uploading={
                    uploading
                  }
                  onChange={
                    handlePhotoChange
                  }
                  onRemove={
                    removePhoto
                  }
                />

                <MediaUploadCard
                  type="video"
                  preview={
                    videoPreview ||
                    data.video_url
                  }
                  uploading={
                    uploading
                  }
                  onChange={
                    handleVideoChange
                  }
                  onRemove={
                    removeVideo
                  }
                />
              </div>

              <InfoCard
                icon={Camera}
                title="Foto profissional"
              >
                Prefira uma imagem atual, nítida,
                com boa iluminação e aparência
                profissional.
              </InfoCard>

              <InfoCard
                icon={Video}
                title="Vídeo de apresentação"
              >
                O vídeo pode apresentar sua formação,
                abordagem, público atendido e forma de
                trabalho. Evite promessas de resultados
                ou garantias.
              </InfoCard>
            </div>
          )}

          {/*
           * ETAPA 5
           */}
          {step === 5 && (
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium text-primary">
                  Etapa 6
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Revisão e compromisso profissional
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Confira seus dados e confirme os
                  compromissos necessários antes de
                  enviar o cadastro.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Nome profissional
                  </p>

                  <p className="mt-1 font-medium">
                    {data.professional_name ||
                      data.full_name ||
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    E-mail
                  </p>

                  <p className="mt-1 break-all font-medium">
                    {data.email ||
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground">
                    CRP
                  </p>

                  <p className="mt-1 font-semibold text-primary">
                    {data.crp_number
                      ? `CRP ${data.crp_region} - ${data.crp_number}`
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Situação do CRP
                  </p>

                  <p className="mt-1 font-medium">
                    {data.crp_status ===
                    "active"
                      ? "Ativo — sujeito à verificação"
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Formação
                  </p>

                  <p className="mt-1 font-medium">
                    {data.education ||
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Instituição
                  </p>

                  <p className="mt-1 font-medium">
                    {data.institution ||
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Abordagem
                  </p>

                  <p className="mt-1 font-medium">
                    {data.approaches.length
                      ? data.approaches.join(
                          ", "
                        )
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Público
                  </p>

                  <p className="mt-1 font-medium">
                    {data.audience.length
                      ? data.audience.join(
                          ", "
                        )
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Modalidades
                  </p>

                  <p className="mt-1 font-medium">
                    {data.modalities.length
                      ? data.modalities.join(
                          ", "
                        )
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Telefone
                  </p>

                  <p className="mt-1 font-medium">
                    {data.phone ||
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Localização
                  </p>

                  <p className="mt-1 font-medium">
                    {data.city &&
                    data.state
                      ? `${data.city} - ${data.state}`
                      : "Não informado"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-semibold">
                      Verificação profissional
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      O perfil será enviado para
                      análise. O número do CRP e
                      demais informações profissionais
                      poderão ser verificados antes da
                      publicação.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4">
                      <a
                        href="https://cadastro.cfp.org.br/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        Cadastro Nacional
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      <a
                        href="https://site.cfp.org.br/wp-content/uploads/2012/07/codigo-de-etica-psicologia.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        Código de Ética
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Checkbox
                  checked={
                    data.information_truthful
                  }
                  onChange={(value) =>
                    set(
                      "information_truthful",
                      value
                    )
                  }
                >
                  Confirmo que as informações
                  pessoais e profissionais fornecidas
                  neste cadastro são verdadeiras,
                  atuais e correspondem à minha
                  atuação profissional.
                </Checkbox>

                <Checkbox
                  checked={
                    data.ethical_commitment
                  }
                  onChange={(value) =>
                    set(
                      "ethical_commitment",
                      value
                    )
                  }
                >
                  Declaro estar ciente de que minha
                  atuação profissional deve respeitar
                  o sigilo profissional, o Código de
                  Ética e as normas aplicáveis à
                  Psicologia.
                </Checkbox>

                <Checkbox
                  checked={
                    data.privacy_commitment
                  }
                  onChange={(value) =>
                    set(
                      "privacy_commitment",
                      value
                    )
                  }
                >
                  Comprometo-me a respeitar a privacidade
                  e a proteção das informações dos
                  pacientes, utilizando os meios
                  disponibilizados pela plataforma de
                  maneira responsável.
                </Checkbox>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-medium">
                      Publicação condicionada à
                      verificação
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Enviar o cadastro não significa
                      aprovação automática. O perfil
                      ficará com status pendente e não
                      será publicado até a conclusão do
                      processo de verificação da
                      plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={
                previousStep
              }
              disabled={
                step === 0 ||
                submitting
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>

            {step <
            STEPS.length - 1 ? (
              <button
                type="button"
                onClick={
                  nextStep
                }
                disabled={
                  submitting
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continuar
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  submit
                }
                disabled={
                  submitting ||
                  !isAuthenticated
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando cadastro...
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <Lock className="h-5 w-5" />
                    Confirme seu e-mail para enviar
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Enviar para verificação
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl text-center">
          <p className="text-xs leading-5 text-muted-foreground">
            O EntreNós é uma plataforma de conexão
            entre pacientes e profissionais. A
            plataforma não substitui atendimento de
            emergência e não presta atendimento
            psicológico diretamente.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
