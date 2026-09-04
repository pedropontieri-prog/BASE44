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
  { title: "Profissional", icon: ShieldCheck },
  { title: "Atendimento", icon: Calendar },
  { title: "Foto", icon: Camera },
  { title: "Vídeo", icon: Video },
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
  function (_, i) {
    const value = String(i + 1).padStart(2, "0");

    return {
      value: value,
      label: "CRP " + value,
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
  education: "Psicologia",
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
  const originalName =
    file && file.name ? file.name : "arquivo";

  const parts = originalName.split(".");

  const extension =
    parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : "bin";

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) +
        "-" +
        Math.random().toString(36).slice(2);

  return id + "." + extension;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-2">
        {label}{" "}
        {required && (
          <span className="text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
      <span className="block text-sm font-medium mb-2">
        {label}{" "}
        {required && (
          <span className="text-red-500">*</span>
        )}
      </span>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-2">
        {label}
      </span>

      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition resize-y focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
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
      if (values.includes(option)) {
        onChange([]);
      } else {
        onChange([option]);
      }

      return;
    }

    if (values.includes(option)) {
      onChange(
        values.filter((item) => item !== option)
      );
    } else {
      onChange([...values, option]);
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium mb-3">
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
                  : "rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-primary hover:text-primary"
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
  file,
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
            : "Apresente-se brevemente para que os pacientes conheçam você."}
        </p>
      </div>

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
          {isPhoto ? (
            <img
              src={preview}
              alt="Pré-visualização da foto"
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
        <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:border-primary">
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
              ? "Enviando " +
                (isPhoto ? "foto" : "vídeo") +
                "..."
              : file
              ? "Trocar arquivo"
              : "Adicionar " +
                (isPhoto
                  ? "foto de perfil"
                  : "vídeo de apresentação")}
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

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULTS);

  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("register");
  const [authenticatedUser, setAuthenticatedUser] =
    useState(null);

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [authSubmitting, setAuthSubmitting] =
    useState(false);

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
    if (data.professional_name) {
      return data.professional_name;
    }

    if (data.full_name) {
      return data.full_name;
    }

    if (
      authenticatedUser &&
      authenticatedUser.user_metadata &&
      authenticatedUser.user_metadata.full_name
    ) {
      return authenticatedUser.user_metadata.full_name;
    }

    if (
      authenticatedUser &&
      authenticatedUser.user_metadata &&
      authenticatedUser.user_metadata.name
    ) {
      return authenticatedUser.user_metadata.name;
    }

    return "Profissional";
  }, [
    data.professional_name,
    data.full_name,
    authenticatedUser,
  ]);

  function set(key, value) {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!mounted) {
          return;
        }

        const user =
          sessionData && sessionData.session
            ? sessionData.session.user
            : null;

        setAuthenticatedUser(user);

        if (user) {
          const metadata = user.user_metadata || {};

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
        if (!mounted) {
          return;
        }

        const user = session ? session.user : null;

        setAuthenticatedUser(user);

        if (user) {
          const metadata = user.user_metadata || {};

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

      if (
        authSubscription &&
        authSubscription.subscription
      ) {
        authSubscription.subscription.unsubscribe();
      }
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
    if (!file) {
      return "Selecione uma foto.";
    }

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
    if (!file) {
      return "Selecione um vídeo.";
    }

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
    const file =
      event.target.files && event.target.files[0]
        ? event.target.files[0]
        : null;

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
    const file =
      event.target.files && event.target.files[0]
        ? event.target.files[0]
        : null;

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
      if (authMode === "register") {
        const {
          data: signUpData,
          error: signUpError,
        } = await supabase.auth.signUp({
          email: email,
          password: password,
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

        if (signUpData.session && signUpData.user) {
          setAuthenticatedUser(signUpData.user);

          setData((current) => ({
            ...current,
            email: signUpData.user.email || email,
            full_name:
              authName.trim() || current.full_name,
          }));

          setStep(0);
        } else if (signUpData.user) {
          setConfirmationSent(true);
          setError(
            "Cadastro realizado. Confirme seu e-mail antes de entrar."
          );
        }
      } else {
        const {
          data: loginData,
          error: loginError,
        } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (loginError) {
          throw loginError;
        }

        const user = loginData.user;

        setAuthenticatedUser(user);

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
      }
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

    setAuthenticatedUser(null);
    setData(DEFAULTS);
    setStep(0);
    setDone(false);
    setError("");
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setPhotoFile(null);
    setVideoFile(null);

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setPhotoPreview("");
    setVideoPreview("");
  }

  async function uploadFileToStorage(
    file,
    type,
    userId
  ) {
    const folder =
      type === "photo"
        ? "professionals/" + userId + "/photos"
        : "professionals/" + userId + "/videos";

    const filePath =
      folder + "/" + makeFileName(file);

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
    let nextData = {
      ...data,
    };

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

  function validateStep(stepNumber) {
    if (stepNumber === 0) {
      if (!data.full_name.trim()) {
        return "Informe seu nome completo.";
      }

      if (!data.email.trim()) {
        return "Informe seu e-mail.";
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
    }

    if (stepNumber === 2) {
      if (
        !data.modalities ||
        data.modalities.length === 0
      ) {
        return "Selecione pelo menos uma modalidade de atendimento.";
      }
    }

    if (stepNumber === 3) {
      if (!data.photo_url && !photoFile) {
        return "Adicione uma foto de perfil.";
      }
    }

    if (stepNumber === 4) {
      if (!data.video_url && !videoFile) {
        return "Adicione um vídeo de apresentação.";
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

  async function submit() {
    if (submitting) {
      return;
    }

    setError("");

    if (!isAuthenticated) {
      setError("Faça login para continuar.");
      return;
    }

    for (let index = 0; index < 5; index += 1) {
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
      const {
        data: currentUserData,
        error: currentUserError,
      } = await supabase.auth.getUser();

      if (currentUserError) {
        throw currentUserError;
      }

      const user = currentUserData.user;

      if (!user) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      const finalData =
        await uploadPendingFiles(user.id);

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

      const psychologistData = {
        user_id: user.id,
        professional_name:
          finalData.professional_name ||
          finalData.full_name,
        crp_number: finalData.crp_number,
        crp_region: finalData.crp_region,
        education: finalData.education,
        institution: finalData.institution,
        graduation_year:
          finalData.graduation_year,
        specializations:
          finalData.specializations,
        approaches: finalData.approaches,
        experience: finalData.experience,
        topics: finalData.themes,
        modalities: finalData.modalities,
        languages: finalData.languages,
        audience: finalData.audience,
        city: finalData.city,
        state: finalData.state,
        phone: finalData.phone,
        gender: finalData.gender,
        session_price: finalData.price
          ? Number(finalData.price)
          : null,
        session_duration:
          finalData.session_duration,
        available_days:
          finalData.available_days,
        available_slots:
          finalData.available_slots,
        cancellation_policy:
          finalData.cancellation_policy,
        address: finalData.address,
        bio: finalData.about,
        photo_url: finalData.photo_url,
        profile_photo_url:
          finalData.photo_url,
        presentation_video_url:
          finalData.video_url,
        presentation_video_status:
          "pending",
        verification_status: "pending",
        public_profile: false,
      };

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
        const {
          error: insertError,
        } = await supabase
          .from("psychologists")
          .insert(psychologistData);

        if (insertError) {
          throw insertError;
        }
      }

      setDone(true);
    } catch (submitError) {
      setError(getFriendlyError(submitError));
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {authMode === "register" ? (
                  <UserPlus className="h-7 w-7" />
                ) : (
                  <LogIn className="h-7 w-7" />
                )}
              </div>

              <h1 className="text-3xl font-bold">
                {authMode === "register"
                  ? "Cadastre-se como profissional"
                  : "Entrar como profissional"}
              </h1>

              <p className="mt-2 text-muted-foreground">
                {authMode === "register"
                  ? "Crie sua conta e já envie sua foto e vídeo de apresentação."
                  : "Acesse sua conta e continue seu cadastro profissional."}
              </p>
            </div>

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
                  label="E-mail"
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
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
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

                {authMode === "register" && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <MediaUploadCard
                      type="photo"
                      file={photoFile}
                      preview={photoPreview}
                      uploading={authSubmitting}
                      onChange={handlePhotoChange}
                      onRemove={removePhoto}
                    />

                    <MediaUploadCard
                      type="video"
                      file={videoFile}
                      preview={videoPreview}
                      uploading={authSubmitting}
                      onChange={handleVideoChange}
                      onRemove={removeVideo}
                    />
                  </div>
                )}

                {confirmationSent && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                    <p className="font-medium">
                      Confirmação enviada.
                    </p>

                    <p className="mt-1 text-muted-foreground">
                      Verifique seu e-mail e confirme sua conta antes de entrar.
                    </p>

                    <button
                      type="button"
                      onClick={resendConfirmation}
                      className="mt-3 font-medium text-primary hover:underline"
                    >
                      Reenviar confirmação
                    </button>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={authenticateProfessional}
                  disabled={authSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : authMode === "register" ? (
                    <UserPlus className="h-5 w-5" />
                  ) : (
                    <LogIn className="h-5 w-5" />
                  )}

                  {authMode === "register"
                    ? "Criar conta"
                    : "Entrar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode((current) =>
                      current === "register"
                        ? "login"
                        : "register"
                    );
                    setError("");
                    setConfirmationSent(false);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  {authMode === "register"
                    ? "Já tenho uma conta"
                    : "Ainda não tenho uma conta"}
                </button>

                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                  <Lock className="h-5 w-5 shrink-0" />

                  <span>
                    Seus dados são protegidos e utilizados apenas para o funcionamento da plataforma.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                <div>
                  <p className="font-medium">
                    Seu perfil profissional será verificado
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Depois de criar a conta, você continuará preenchendo CRP, atendimento, disponibilidade e demais informações profissionais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell>
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <Check className="h-10 w-10" />
            </div>

            <h1 className="text-3xl font-bold">
              Cadastro enviado!
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Seu perfil profissional foi cadastrado e enviado para análise. Assim que a verificação for concluída, seu perfil poderá ser publicado.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-medium hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </button>

              <button
                type="button"
                onClick={logoutProfessional}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90"
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

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Olá, {displayName}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Complete seu perfil profissional
            </h1>
          </div>

          <button
            type="button"
            onClick={logoutProfessional}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

        <div className="mb-8 rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const completed = index < step;

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
              style={{ width: progress + "%" }}
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
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Informações pessoais
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Conte um pouco sobre você.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Nome completo"
                  value={data.full_name}
                  onChange={(value) =>
                    set("full_name", value)
                  }
                  placeholder="Seu nome completo"
                  required
                />

                <Input
                  label="Nome profissional"
                  value={data.professional_name}
                  onChange={(value) =>
                    set("professional_name", value)
                  }
                  placeholder="Como deseja ser apresentado"
                />

                <Input
                  label="E-mail"
                  value={data.email}
                  onChange={(value) =>
                    set("email", value)
                  }
                  type="email"
                  placeholder="seu@email.com"
                  required
                />

                <Input
                  label="Telefone"
                  value={data.phone}
                  onChange={(value) =>
                    set("phone", value)
                  }
                  placeholder="(00) 00000-0000"
                />

                <Input
                  label="Cidade"
                  value={data.city}
                  onChange={(value) =>
                    set("city", value)
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

                <Select
                  label="Gênero"
                  value={data.gender}
                  onChange={(value) =>
                    set("gender", value)
                  }
                  options={[
                    "Feminino",
                    "Masculino",
                    "Não binário",
                    "Prefiro não informar",
                  ]}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Informações profissionais
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Informe seus dados de formação e atuação.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Número do CRP"
                  value={data.crp_number}
                  onChange={(value) =>
                    set("crp_number", value)
                  }
                  placeholder="Digite seu CRP"
                  required
                />

                <Select
                  label="Região do CRP"
                  value={data.crp_region}
                  onChange={(value) =>
                    set("crp_region", value)
                  }
                  options={REGION_OPTS}
                  required
                />

                <Input
                  label="Formação"
                  value={data.education}
                  onChange={(value) =>
                    set("education", value)
                  }
                  placeholder="Psicologia"
                />

                <Input
                  label="Instituição"
                  value={data.institution}
                  onChange={(value) =>
                    set("institution", value)
                  }
                  placeholder="Nome da instituição"
                />

                <Input
                  label="Ano de formação"
                  value={data.graduation_year}
                  onChange={(value) =>
                    set("graduation_year", value)
                  }
                  type="number"
                  placeholder="2026"
                />

                <Input
                  label="Experiência profissional"
                  value={data.experience}
                  onChange={(value) =>
                    set("experience", value)
                  }
                  placeholder="Ex.: 5 anos"
                />
              </div>

              <Chips
                label="Especializações"
                options={SPEC_OPTS}
                values={data.specializations}
                onChange={(values) =>
                  set(
                    "specializations",
                    values
                  )
                }
              />

              <Chips
                label="Abordagens terapêuticas"
                options={APPROACH_OPTS}
                values={data.approaches}
                onChange={(values) =>
                  set("approaches", values)
                }
              />

              <Chips
                label="Especialidades"
                options={SPEC_OPTS}
                values={data.specialties}
                onChange={(values) =>
                  set("specialties", values)
                }
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Atendimento
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Configure como você atende seus pacientes.
                </p>
              </div>

              <Chips
                label="Modalidades"
                options={[
                  "online",
                  "presencial",
                  "híbrido",
                ]}
                values={data.modalities}
                onChange={(values) =>
                  set("modalities", values)
                }
              />

              <Chips
                label="Temas de atendimento"
                options={THEME_OPTS}
                values={data.themes}
                onChange={(values) =>
                  set("themes", values)
                }
              />

              <Chips
                label="Público"
                options={AUDIENCE_OPTS}
                values={data.audience}
                onChange={(values) =>
                  set("audience", values)
                }
              />

              <Chips
                label="Idiomas"
                options={LANG_OPTS}
                values={data.languages}
                onChange={(values) =>
                  set("languages", values)
                }
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Valor da sessão"
                  value={data.price}
                  onChange={(value) =>
                    set("price", value)
                  }
                  type="number"
                  placeholder="Ex.: 150"
                />

                <Input
                  label="Duração da sessão"
                  value={data.session_duration}
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
                values={data.available_days}
                onChange={(values) =>
                  set(
                    "available_days",
                    values
                  )
                }
              />

              <Chips
                label="Horários disponíveis"
                options={SLOT_OPTS}
                values={data.available_slots}
                onChange={(values) =>
                  set(
                    "available_slots",
                    values
                  )
                }
              />

              <TextArea
                label="Política de cancelamento"
                value={
                  data.cancellation_policy
                }
                onChange={(value) =>
                  set(
                    "cancellation_policy",
                    value
                  )
                }
                placeholder="Informe sua política de cancelamento e reagendamento."
                rows={4}
              />

              <Input
                label="Endereço"
                value={data.address}
                onChange={(value) =>
                  set("address", value)
                }
                placeholder="Endereço do atendimento presencial"
              />

              <TextArea
                label="Sobre você"
                value={data.about}
                onChange={(value) =>
                  set("about", value)
                }
                placeholder="Escreva uma apresentação profissional."
                rows={6}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Sua foto
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Uma boa foto ajuda os pacientes a reconhecerem seu perfil.
                </p>
              </div>

              <MediaUploadCard
                type="photo"
                file={photoFile}
                preview={
                  photoPreview || data.photo_url
                }
                uploading={uploading}
                onChange={handlePhotoChange}
                onRemove={removePhoto}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Vídeo de apresentação
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Grave um vídeo curto apresentando seu trabalho.
                </p>
              </div>

              <MediaUploadCard
                type="video"
                file={videoFile}
                preview={
                  videoPreview || data.video_url
                }
                uploading={uploading}
                onChange={handleVideoChange}
                onRemove={removeVideo}
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Revisão do cadastro
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Confira as informações antes de enviar.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Nome
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

                  <p className="mt-1 font-medium break-all">
                    {data.email ||
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    CRP
                  </p>

                  <p className="mt-1 font-medium">
                    {data.crp_number
                      ? "CRP " +
                        data.crp_region +
                        " - " +
                        data.crp_number
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Localização
                  </p>

                  <p className="mt-1 font-medium">
                    {data.city && data.state
                      ? data.city +
                        " - " +
                        data.state
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Modalidades
                  </p>

                  <p className="mt-1 font-medium">
                    {data.modalities &&
                    data.modalities.length > 0
                      ? data.modalities.join(", ")
                      : "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Valor da sessão
                  </p>

                  <p className="mt-1 font-medium">
                    {data.price
                      ? "R$ " + data.price
                      : "Não informado"}
                  </p>
                </div>
              </div>

              {data.specializations &&
                data.specializations.length >
                  0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Especializações
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {data.specializations.map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {(photoPreview ||
                data.photo_url) && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Foto
                  </p>

                  <img
                    src={
                      photoPreview ||
                      data.photo_url
                    }
                    alt="Foto de perfil"
                    className="h-48 w-48 rounded-2xl object-cover"
                  />
                </div>
              )}

              {(videoPreview ||
                data.video_url) && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Vídeo
                  </p>

                  <video
                    src={
                      videoPreview ||
                      data.video_url
                    }
                    controls
                    className="max-h-80 w-full rounded-2xl"
                  />
                </div>
              )}

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="font-medium">
                      Seu perfil passará por verificação
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Após o envio, nossa equipe poderá analisar suas informações antes de liberar o perfil publicamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={previousStep}
              disabled={
                step === 0 || submitting
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continuar
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={
