import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck2,
  Loader2,
  LogIn,
  Lock,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Video,
  X,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

const STEPS = [
  {
    title: "Pessoal",
    description: "Seus dados básicos",
    icon: User,
  },
  {
    title: "Registro profissional",
    description: "Sua identificação profissional",
    icon: ShieldCheck,
  },
  {
    title: "Atuação",
    description: "Sua área de atuação",
    icon: Sparkles,
  },
  {
    title: "Atendimento",
    description: "Como você atende",
    icon: Calendar,
  },
  {
    title: "Foto e vídeo",
    description: "Apresente seu perfil",
    icon: Camera,
  },
  {
    title: "Revisão",
    description: "Confira seus dados",
    icon: Check,
  },
];

const inputClass =
  "w-full h-12 rounded-xl border border-border/70 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 hover:border-border focus:border-primary focus:ring-4 focus:ring-primary/10";

const selectClass =
  "w-full h-12 rounded-xl border border-border/70 bg-background px-4 text-sm outline-none transition-all hover:border-border focus:border-primary focus:ring-4 focus:ring-primary/10";

const textareaClass =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 hover:border-border focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none";

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-7">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-2">
          {eyebrow}
        </p>
      )}

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
        {title}
      </h2>

      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-6">
          {description}
        </p>
      )}
    </div>
  );
}

function Field({ label, required = false, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>

      {children}

      {hint && (
        <p className="text-xs text-muted-foreground mt-2">{hint}</p>
      )}
    </div>
  );
}

function SelectionCard({
  checked,
  onChange,
  children,
  description,
}) {
  return (
    <label
      className={`
        group relative flex items-start gap-3 rounded-2xl border p-4
        cursor-pointer transition-all duration-200
        ${
          checked
            ? "border-primary bg-primary/[0.06] shadow-sm ring-2 ring-primary/10"
            : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/20"
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />

      <div
        className={`
          mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center
          shrink-0 transition-all duration-200
          ${
            checked
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border group-hover:border-primary/50"
          }
        `}
      >
        {checked && <Check className="w-3.5 h-3.5" />}
      </div>

      <div className="min-w-0">
        <p
          className={`text-sm ${
            checked ? "font-semibold" : "font-medium"
          }`}
        >
          {children}
        </p>

        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-5">
            {description}
          </p>
        )}
      </div>
    </label>
  );
}

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
    birthDate: "",

    crp: "",
    crpState: "",
    crpStatus: "",

    approach: "",
    audience: [],
    modalities: [],

    online: false,
    ePsi: false,
    presencial: false,

    address: "",
    city: "",
    state: "",

    sessionDuration: "",
    sessionPrice: "",

    presentation: "",

    privacyAccepted: false,
    confidentialityAccepted: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        if (data?.session?.user) {
          const user = data.session.user;

          setForm((current) => ({
            ...current,
            name:
              current.name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "",
            email: current.email || user.email || "",
          }));
        }
      } catch {
        // A sessão não impede o preenchimento manual do cadastro.
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
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

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const toggleArrayValue = (field, value) => {
    setForm((current) => {
      const values = current[field] || [];
      const exists = values.includes(value);

      return {
        ...current,
        [field]: exists
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });

    setError("");
    setSuccess("");
  };

  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7
    )}`;
  };

  const validateFile = (file, type) => {
    if (!file) {
      return false;
    }

    if (type === "photo") {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      const maxSize = 5 * 1024 * 1024;

      if (!allowed.includes(file.type)) {
        setError("A foto deve estar em JPG, PNG ou WEBP.");
        return false;
      }

      if (file.size > maxSize) {
        setError("A foto deve ter no máximo 5 MB.");
        return false;
      }
    }

    if (type === "video") {
      const allowed = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];

      const maxSize = 100 * 1024 * 1024;

      if (!allowed.includes(file.type)) {
        setError("O vídeo deve estar em MP4, WEBM ou MOV.");
        return false;
      }

      if (file.size > maxSize) {
        setError("O vídeo deve ter no máximo 100 MB.");
        return false;
      }
    }

    return true;
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file || !validateFile(file, "photo")) {
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file || !validateFile(file, "video")) {
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(null);
    setPhotoPreview("");
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(null);
    setVideoPreview("");
  };

  const validation = useMemo(() => {
    const errors = [];

    if (!form.name.trim()) {
      errors.push("Informe seu nome.");
    }

    if (!form.email.trim()) {
      errors.push("Informe seu e-mail.");
    }

    if (form.password.length < 6) {
      errors.push("A senha deve ter pelo menos 6 caracteres.");
    }

    if (form.password !== form.confirmPassword) {
      errors.push("As senhas não coincidem.");
    }

    if (!form.crp.trim()) {
      errors.push("Informe seu CRP.");
    }

    if (!form.crpState.trim()) {
      errors.push("Informe o estado do CRP.");
    }

    if (!form.approach.trim()) {
      errors.push("Informe sua abordagem.");
    }

    if (!form.audience.length) {
      errors.push("Selecione pelo menos um público.");
    }

    if (!form.modalities.length) {
      errors.push("Selecione pelo menos um tema de atuação.");
    }

    if (!form.online && !form.presencial) {
      errors.push("Selecione pelo menos uma forma de atendimento.");
    }

    if (form.online && !form.ePsi) {
      errors.push(
        "Informe se possui autorização e-Psi para atendimento online."
      );
    }

    if (!form.presentation.trim()) {
      errors.push("Escreva uma apresentação profissional.");
    }

    if (!form.privacyAccepted) {
      errors.push("Aceite a política de privacidade.");
    }

    if (!form.confidentialityAccepted) {
      errors.push(
        "Confirme o compromisso com sigilo profissional."
      );
    }

    return errors;
  }, [form]);

  const validateStep = (currentStep) => {
    setError("");

    if (currentStep === 0) {
      if (!form.name.trim()) {
        setError("Informe seu nome.");
        return false;
      }

      if (!form.email.trim()) {
        setError("Informe seu e-mail.");
        return false;
      }

      if (form.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return false;
      }

      if (form.password !== form.confirmPassword) {
        setError("As senhas não coincidem.");
        return false;
      }

      return true;
    }

    if (currentStep === 1) {
      if (!form.crp.trim()) {
        setError("Informe seu CRP.");
        return false;
      }

      if (!form.crpState.trim()) {
        setError("Informe o estado do CRP.");
        return false;
      }

      return true;
    }

    if (currentStep === 2) {
      if (!form.approach.trim()) {
        setError("Informe sua abordagem.");
        return false;
      }

      if (!form.audience.length) {
        setError("Selecione pelo menos um público.");
        return false;
      }

      if (!form.modalities.length) {
        setError("Selecione pelo menos um tema de atuação.");
        return false;
      }

      return true;
    }

    if (currentStep === 3) {
      if (!form.online && !form.presencial) {
        setError(
          "Selecione pelo menos uma forma de atendimento."
        );
        return false;
      }

      if (form.online && !form.ePsi) {
        setError(
          "Informe se possui autorização e-Psi para atendimento online."
        );
        return false;
      }

      return true;
    }

    if (currentStep === 4) {
      if (!form.presentation.trim()) {
        setError("Escreva uma apresentação profissional.");
        return false;
      }

      return true;
    }

    if (currentStep === 5) {
      if (!form.privacyAccepted) {
        setError("Aceite a política de privacidade.");
        return false;
      }

      if (!form.confidentialityAccepted) {
        setError(
          "Confirme o compromisso com sigilo profissional."
        );
        return false;
      }

      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) =>
      Math.min(current + 1, STEPS.length - 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const previousStep = () => {
    setError("");
    setSuccess("");

    setStep((current) => Math.max(current - 1, 0));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const uploadFile = async (bucket, file, path) => {
    if (!file) {
      return null;
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data?.publicUrl || null;
  };

  const saveProfile = async (userId) => {
    let photoUrl = null;
    let videoUrl = null;

    if (photoFile) {
      photoUrl = await uploadFile(
        "avatars",
        photoFile,
        `${userId}/profile-${Date.now()}-${photoFile.name}`
      );
    }

    if (videoFile) {
      videoUrl = await uploadFile(
        "videos",
        videoFile,
        `${userId}/presentation-${Date.now()}-${videoFile.name}`
      );
    }

    const profilePayload = {
      id: userId,
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      cpf: form.cpf.replace(/\D/g, "") || null,
      phone: form.phone.replace(/\D/g, "") || null,
      birth_date: form.birthDate || null,

      crp: form.crp.trim(),
      crp_state: form.crpState.trim().toUpperCase(),
      crp_status: form.crpStatus || null,

      approach: form.approach.trim(),
      audience: form.audience,
      modalities: form.modalities,

      online: form.online,
      epsi: form.ePsi,
      presencial: form.presencial,

      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim().toUpperCase() || null,

      session_duration: form.sessionDuration || null,
      session_price: form.sessionPrice || null,

      presentation: form.presentation.trim(),

      photo_url: photoUrl,
      video_url: videoUrl,

      role: "professional",

      privacy_accepted: form.privacyAccepted,
      confidentiality_accepted:
        form.confidentialityAccepted,

      registration_verified: false,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, {
        onConflict: "id",
      });

    if (profileError) {
      throw profileError;
    }

    return {
      photoUrl,
      videoUrl,
    };
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const email = form.email.trim().toLowerCase();

      const { data: existingSession } =
        await supabase.auth.getSession();

      let user =
        existingSession?.session?.user || null;

      if (!user) {
        const {
          data,
          error: signUpError,
        } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              name: form.name.trim(),
              full_name: form.name.trim(),
              role: "professional",
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        user = data?.user || null;
      }

      if (!user) {
        throw new Error(
          "Não foi possível criar a conta."
        );
      }

      await saveProfile(user.id);

      const { error: otpError } =
        await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });

      if (otpError) {
        throw otpError;
      }

      setOtpSent(true);

      setSuccess(
        "Cadastro enviado. Digite o código de 6 dígitos enviado para seu e-mail."
      );
    } catch (submitError) {
      console.error("Erro no cadastro:", submitError);

      setError(
        submitError?.message ||
          "Não foi possível enviar o cadastro. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const verifyEmailCode = async () => {
    const code = otp.replace(/\D/g, "");

    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos.");
      return;
    }

    setVerifyingOtp(true);
    setError("");
    setSuccess("");

    try {
      const email = form.email.trim().toLowerCase();

      const {
        data,
        error: verifyError,
      } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verifyError) {
        throw verifyError;
      }

      const user = data?.user;

      if (!user) {
        throw new Error(
          "Não foi possível confirmar seu e-mail."
        );
      }

      await supabase.auth.updateUser({
        data: {
          name: form.name.trim(),
          full_name: form.name.trim(),
          role: "professional",
        },
      });

      await supabase
        .from("profiles")
        .update({
          role: "professional",
          registration_verified: true,
        })
        .eq("id", user.id);

      navigate("/painel-profissional");
    } catch (verifyError) {
      console.error(
        "Erro na verificação:",
        verifyError
      );

      setError(
        verifyError?.message ||
          "Código inválido ou expirado. Solicite um novo código."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const resendCode = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const email = form.email.trim().toLowerCase();

      const {
        error: resendError,
      } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (resendError) {
        throw resendError;
      }

      setOtp("");

      setSuccess(
        "Um novo código foi enviado para seu e-mail."
      );
    } catch (resendError) {
      console.error(
        "Erro ao reenviar código:",
        resendError
      );

      setError(
        resendError?.message ||
          "Não foi possível reenviar o código."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  const progress =
    ((step + 1) / STEPS.length) * 100;

  if (checkingSession) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>

            <p className="text-sm text-muted-foreground">
              Preparando seu cadastro...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <PageShell>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/[0.05] blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/[0.04] blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 sm:mb-10">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="
                  inline-flex items-center gap-2
                  text-sm font-medium text-muted-foreground
                  hover:text-foreground transition-colors
                "
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <button
                type="button"
                onClick={goToLogin}
                className="
                  inline-flex items-center gap-2
                  rounded-xl border border-border/70
                  bg-card/70 px-4 py-2.5
                  text-sm font-semibold
                  hover:bg-muted/40 transition-all
                "
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">
                  Já tenho uma conta
                </span>
                <span className="sm:hidden">
                  Entrar
                </span>
              </button>
            </div>

            {/* INTRO */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Cadastro profissional
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Crie seu perfil profissional
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-xl mx-auto leading-6">
                Preencha seus dados para começar a apresentar
                seu trabalho e conectar-se com novos pacientes.
              </p>
            </div>

            {/* PROGRESS */}
            <div className="mb-8">
              <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Seu progresso
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {STEPS[step].title}
                    </p>
                  </div>

                  <div className="text-sm font-bold text-primary">
                    {Math.round(progress)}%
                  </div>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="hidden md:flex items-center mt-5">
                  {STEPS.map((item, index) => {
                    const Icon = item.icon;
                    const active = index === step;
                    const completed = index < step;

                    return (
                      <React.Fragment key={item.title}>
                        <button
                          type="button"
                          onClick={() => {
                            if (index <= step) {
                              setError("");
                              setStep(index);
                            }
                          }}
                          className="group flex items-center gap-2 text-left shrink-0"
                        >
                          <div
                            className={`
                              w-9 h-9 rounded-full
                              flex items-center justify-center
                              border transition-all duration-300
                              ${
                                active || completed
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-background border-border text-muted-foreground group-hover:border-primary/50"
                              }
                            `}
                          >
                            {completed ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>

                          <div className="hidden lg:block">
                            <p
                              className={`text-xs ${
                                active
                                  ? "font-bold text-foreground"
                                  : "font-medium text-muted-foreground"
                              }`}
                            >
                              {item.title}
                            </p>
                          </div>
                        </button>

                        {index < STEPS.length - 1 && (
                          <div
                            className={`
                              h-px flex-1 mx-3
                              transition-colors duration-500
                              ${
                                index < step
                                  ? "bg-primary"
                                  : "bg-border"
                              }
                            `}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="md:hidden mt-4">
                  <p className="text-xs text-muted-foreground">
                    Etapa {step + 1} de {STEPS.length}
                  </p>
                </div>
              </div>
            </div>

            {/* MAIN CARD */}
            <div className="bg-card border border-border/60 rounded-3xl shadow-xl shadow-black/[0.04] overflow-hidden">
              {/* CARD HEADER */}
              <div className="p-6 sm:p-9 border-b border-border/60 bg-gradient-to-b from-muted/30 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/10 shrink-0">
                    <StepIcon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Etapa {step + 1} de {STEPS.length}
                    </p>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {STEPS[step].title}
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      {STEPS[step].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6 sm:p-9">
                {error && (
                  <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/[0.06] px-4 py-4 text-sm text-destructive flex items-start gap-3">
                    <X className="w-5 h-5 shrink-0 mt-0.5" />

                    <div>
                      <p className="font-semibold">
                        Não foi possível continuar
                      </p>

                      <p className="mt-1 opacity-90">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-4 text-sm flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />

                    <p>{success}</p>
                  </div>
                )}

                {/* STEP 0 */}
                {step === 0 && (
                  <div className="space-y-8">
                    <SectionTitle
                      eyebrow="Começando"
                      title="Vamos começar"
                      description="Informe seus dados básicos para criar sua conta profissional."
                    />

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <Field
                          label="Nome completo"
                          required
                        >
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                              updateForm(
                                "name",
                                e.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="Digite seu nome completo"
                            autoComplete="name"
                          />
                        </Field>
                      </div>

                      <Field
                        label="E-mail"
                        required
                      >
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                              updateForm(
                                "email",
                                e.target.value
                              )
                            }
                            className={`${inputClass} pl-11`}
                            placeholder="voce@email.com"
                            autoComplete="email"
                          />
                        </div>
                      </Field>

                      <Field label="Telefone">
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            updateForm(
                              "phone",
                              formatPhone(
                                e.target.value
                              )
                            )
                          }
                          className={inputClass}
                          placeholder="(00) 00000-0000"
                          autoComplete="tel"
                        />
                      </Field>

                      <Field label="CPF">
                        <input
                          type="text"
                          value={form.cpf}
                          onChange={(e) =>
                            updateForm(
                              "cpf",
                              formatCpf(
                                e.target.value
                              )
                            )
                          }
                          className={inputClass}
                          placeholder="000.000.000-00"
                        />
                      </Field>

                      <Field label="Data de nascimento">
                        <input
                          type="date"
                          value={form.birthDate}
                          onChange={(e) =>
                            updateForm(
                              "birthDate",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field
                        label="Senha"
                        required
                        hint="Use pelo menos 6 caracteres."
                      >
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

                          <input
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            value={form.password}
                            onChange={(e) =>
                              updateForm(
                                "password",
                                e.target.value
                              )
                            }
                            className={`${inputClass} pl-11 pr-12`}
                            placeholder="Sua senha"
                            autoComplete="new-password"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (value) => !value
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </Field>

                      <Field
                        label="Confirmar senha"
                        required
                      >
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

                          <input
                            type={
                              showConfirmPassword
                                ? "text"
                                : "password"
                            }
                            value={
                              form.confirmPassword
                            }
                            onChange={(e) =>
                              updateForm(
                                "confirmPassword",
                                e.target.value
                              )
                            }
                            className={`${inputClass} pl-11 pr-12`}
                            placeholder="Repita sua senha"
                            autoComplete="new-password"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(
                                (value) => !value
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </Field>
                    </div>

                    <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <UserPlus className="w-5 h-5 text-primary" />
                        </div>

                        <div>
                          <p className="font-semibold">
                            Conta profissional
                          </p>

                          <p className="text-sm text-muted-foreground mt-1 leading-6">
                            Sua conta será criada como
                            profissional. Após confirmar
                            seu e-mail, você terá acesso
                            ao painel profissional.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-8">
                    <SectionTitle
                      eyebrow="Registro"
                      title="Seu registro profissional"
                      description="Informe os dados relacionados ao seu registro profissional."
                    />

                    <div className="grid md:grid-cols-2 gap-5">
                      <Field label="CRP" required>
                        <input
                          type="text"
                          value={form.crp}
                          onChange={(e) =>
                            updateForm(
                              "crp",
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Ex.: 06/000000"
                        />
                      </Field>

                      <Field
                        label="Estado do CRP"
                        required
                      >
                        <select
                          value={form.crpState}
                          onChange={(e) =>
                            updateForm(
                              "crpState",
                              e.target.value
                            )
                          }
                          className={selectClass}
                        >
                          <option value="">
                            Selecione o estado
                          </option>
                          {[
                            "AC",
                            "AL",
                            "AP",
                            "AM",
                            "BA",
                            "CE",
                            "DF",
                            "ES",
                            "GO",
                            "MA",
                            "MT",
                            "MS",
                            "MG",
                            "PA",
                            "PB",
                            "PR",
                            "PE",
                            "PI",
                            "RJ",
                            "RN",
                            "RS",
                            "RO",
                            "RR",
                            "SC",
                            "SP",
                            "SE",
                            "TO",
                          ].map((state) => (
                            <option
                              key={state}
                              value={state}
                            >
                              {state}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Situação do registro">
                        <select
                          value={form.crpStatus}
                          onChange={(e) =>
                            updateForm(
                              "crpStatus",
                              e.target.value
                            )
                          }
                          className={selectClass}
                        >
                          <option value="">
                            Selecione
                          </option>
                          <option value="ativo">
                            Ativo
                          </option>
                          <option value="regular">
                            Regular
                          </option>
                          <option value="outro">
                            Outro
                          </option>
                        </select>
                      </Field>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>

                        <div>
                          <p className="font-semibold">
                            Verificação profissional
                          </p>

                          <p className="text-sm text-muted-foreground mt-1 leading-6">
                            Os dados informados poderão
                            ser utilizados para a
                            verificação do seu cadastro
                            profissional.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-8">
                    <SectionTitle
                      eyebrow="Especialidade"
                      title="Sua atuação"
                      description="Conte um pouco sobre sua abordagem, seu público e os temas em que você atua."
                    />

                    <Field
                      label="Abordagem"
                      required
                      hint="Ex.: TCC, Psicanálise, Humanista, Sistêmica..."
                    >
                      <input
                        type="text"
                        value={form.approach}
                        onChange={(e) =>
                          updateForm(
                            "approach",
                            e.target.value
                          )
                        }
                        className={inputClass}
                        placeholder="Digite sua abordagem"
                      />
                    </Field>

                    <div>
                      <div className="mb-3">
                        <label className="text-sm font-semibold">
                          Público atendido
                          <span className="text-primary ml-1">
                            *
                          </span>
                        </label>

                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione todos que fazem parte
                          do seu público.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          "Adultos",
                          "Adolescentes",
                          "Crianças",
                          "Casais",
                          "Famílias",
                          "Idosos",
                        ].map((item) => (
                          <SelectionCard
                            key={item}
                            checked={form.audience.includes(
                              item
                            )}
                            onChange={() =>
                              toggleArrayValue(
                                "audience",
                                item
                              )
                            }
                          >
                            {item}
                          </SelectionCard>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3">
                        <label className="text-sm font-semibold">
                          Temas de atuação
                          <span className="text-primary ml-1">
                            *
                          </span>
                        </label>

                        <p className="text-xs text-muted-foreground mt-1">
                          Escolha os temas que representam
                          sua atuação.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          "Ansiedade",
                          "Depressão",
                          "Relacionamentos",
                          "Autoestima",
                          "Luto",
                          "Estresse",
                          "Traumas",
                          "Carreira",
                          "Autoconhecimento",
                        ].map((item) => (
                          <SelectionCard
                            key={item}
                            checked={form.modalities.includes(
                              item
                            )}
                            onChange={() =>
                              toggleArrayValue(
                                "modalities",
                                item
                              )
                            }
                          >
                            {item}
                          </SelectionCard>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-8">
                    <SectionTitle
                      eyebrow="Atendimento"
                      title="Como você atende?"
                      description="Defina as modalidades e as condições do seu atendimento."
                    />

                    <div>
                      <label className="block text-sm font-semibold mb-3">
                        Modalidade de atendimento
                        <span className="text-primary ml-1">
                          *
                        </span>
                      </label>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <SelectionCard
                          checked={form.online}
                          onChange={(e) =>
                            updateForm(
                              "online",
                              e.target.checked
                            )
                          }
                          description="Atendimento por videochamada."
                        >
                          Online
                        </SelectionCard>

                        <SelectionCard
                          checked={form.presencial}
                          onChange={(e) =>
                            updateForm(
                              "presencial",
                              e.target.checked
                            )
                          }
                          description="Atendimento em consultório."
                        >
                          Presencial
                        </SelectionCard>
                      </div>
                    </div>

                    {form.online && (
                      <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
                        <SelectionCard
                          checked={form.ePsi}
                          onChange={(e) =>
                            updateForm(
                              "ePsi",
                              e.target.checked
                            )
                          }
                        >
                          Possuo autorização e-Psi
                        </SelectionCard>

                        <p className="text-xs text-muted-foreground mt-3 ml-1">
                          Confirme que está regularizado
                          para atendimento psicológico
                          online.
                        </p>
                      </div>
                    )}

                    {form.presencial && (
                      <div className="rounded-2xl border border-border/70 p-5 sm:p-6 space-y-5">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>

                          <div>
                            <p className="font-semibold">
                              Local do consultório
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Informe onde realiza seus
                              atendimentos presenciais.
                            </p>
                          </div>
                        </div>

                        <Field label="Endereço">
                          <input
                            type="text"
                            value={form.address}
                            onChange={(e) =>
                              updateForm(
                                "address",
                                e.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="Endereço do consultório"
                          />
                        </Field>

                        <div className="grid sm:grid-cols-2 gap-5">
                          <Field label="Cidade">
                            <input
                              type="text"
                              value={form.city}
                              onChange={(e) =>
                                updateForm(
                                  "city",
                                  e.target.value
                                )
                              }
                              className={inputClass}
                              placeholder="Cidade"
                            />
                          </Field>

                          <Field label="Estado">
                            <input
                              type="text"
                              value={form.state}
                              onChange={(e) =>
                                updateForm(
                                  "state",
                                  e.target.value.toUpperCase()
                                )
                              }
                              maxLength={2}
                              className={inputClass}
                              placeholder="UF"
                            />
                          </Field>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-5">
                      <Field label="Duração da sessão">
                        <select
                          value={form.sessionDuration}
                          onChange={(e) =>
                            updateForm(
                              "sessionDuration",
                              e.target.value
                            )
                          }
                          className={selectClass}
                        >
                          <option value="">
                            Selecione
                          </option>
                          <option value="30">
                            30 minutos
                          </option>
                          <option value="45">
                            45 minutos
                          </option>
                          <option value="50">
                            50 minutos
                          </option>
                          <option value="60">
                            60 minutos
                          </option>
                          <option value="90">
                            90 minutos
                          </option>
                        </select>
                      </Field>

                      <Field
                        label="Valor da sessão"
                        hint="Informe apenas se desejar exibir o valor no perfil."
                      >
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            R$
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.sessionPrice}
                            onChange={(e) =>
                              updateForm(
                                "sessionPrice",
                                e.target.value
                              )
                            }
                            className={`${inputClass} pl-11`}
                            placeholder="0,00"
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <div className="space-y-8">
                    <SectionTitle
                      eyebrow="Seu perfil"
                      title="Apresente-se aos pacientes"
                      description="Uma boa apresentação ajuda as pessoas a conhecerem seu trabalho antes de entrar em contato."
                    />

                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* PHOTO */}
                      <div className="rounded-2xl border border-border/70 p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 className="font-semibold">
                              Foto de perfil
                            </h3>

                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG ou WEBP · até 5 MB
                            </p>
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <Camera className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>

                        {photoPreview ? (
                          <div>
                            <div className="relative overflow-hidden rounded-2xl bg-muted aspect-square">
                              <img
                                src={photoPreview}
                                alt="Prévia da foto"
                                className="w-full h-full object-cover"
                              />

                              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                <div className="flex items-center justify-between gap-2 pt-5">
                                  <span className="text-xs text-white font-medium truncate">
                                    {photoFile?.name}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="w-9 h-9 rounded-xl bg-white/90 text-black flex items-center justify-center hover:bg-white transition-colors shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <label className="mt-3 h-11 rounded-xl border border-border flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-muted/30 transition-colors">
                              Alterar foto

                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={
                                  handlePhotoChange
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                              <Camera className="w-6 h-6 text-muted-foreground" />
                            </div>

                            <div className="text-center">
                              <p className="text-sm font-semibold">
                                Adicionar foto
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Escolha uma foto profissional
                              </p>
                            </div>

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={
                                handlePhotoChange
                              }
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* VIDEO */}
                      <div className="rounded-2xl border border-border/70 p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 className="font-semibold">
                              Vídeo de apresentação
                            </h3>

                            <p className="text-xs text-muted-foreground mt-1">
                              MP4, WEBM ou MOV · até 100 MB
                            </p>
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <Video className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>

                        {videoPreview ? (
                          <div>
                            <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
                              <video
                                src={videoPreview}
                                controls
                                className="w-full h-full object-cover"
                              />

                              <button
                                type="button"
                                onClick={removeVideo}
                                className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-background/90 border border-border flex items-center justify-center hover:bg-background transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <label className="mt-3 h-11 rounded-xl border border-border flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-muted/30 transition-colors">
                              Alterar vídeo

                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={
                                  handleVideoChange
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="aspect-video rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                              <Video className="w-6 h-6 text-muted-foreground" />
                            </div>

                            <div className="text-center">
                              <p className="text-sm font-semibold">
                                Adicionar vídeo
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Faça uma breve apresentação
                              </p>
                            </div>

                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={
                                handleVideoChange
                              }
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <Field
                      label="Apresentação profissional"
                      required
                      hint="Fale sobre sua experiência, sua forma de trabalhar e como você pode ajudar seus pacientes."
                    >
                      <textarea
                        value={form.presentation}
                        onChange={(e) =>
                          updateForm(
                            "presentation",
                            e.target.value
                          )
                        }
                        rows={8}
                        maxLength={2000}
                        className={textareaClass}
                        placeholder="Escreva uma apresentação acolhedora e profissional..."
                      />

                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-muted-foreground">
                          {form.presentation.length}/2000
                        </span>
                      </div>
                    </Field>
                  </div>
                )}

                {/* STEP 5 */}
                {step === 5 && (
                  <div className="space-y-8">
                    <SectionTitle
                      eyebrow="Quase lá"
                      title="Revise seu cadastro"
                      description="Confira suas informações antes de enviar o cadastro."
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Nome
                        </p>

                        <p className="font-semibold mt-2">
                          {form.name || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          E-mail
                        </p>

                        <p className="font-semibold mt-2 break-all">
                          {form.email || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          CRP
                        </p>

                        <p className="font-semibold mt-2">
                          {form.crp
                            ? `${form.crp} - ${form.crpState}`
                            : "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Abordagem
                        </p>

                        <p className="font-semibold mt-2">
                          {form.approach || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Público
                        </p>

                        <p className="font-semibold mt-2 leading-6">
                          {form.audience.length
                            ? form.audience.join(", ")
                            : "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Temas de atuação
                        </p>

                        <p className="font-semibold mt-2 leading-6">
                          {form.modalities.length
                            ? form.modalities.join(", ")
                            : "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Atendimento
                        </p>

                        <p className="font-semibold mt-2">
                          {[
                            form.online && "Online",
                            form.presencial &&
                              "Presencial",
                          ]
                            .filter(Boolean)
                            .join(" e ") || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border/70 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Arquivos
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <span
                            className={`
                              inline-flex items-center gap-1.5
                              rounded-full px-3 py-1.5 text-xs font-semibold
                              ${
                                photoFile
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }
                            `}
                          >
                            {photoFile && (
                              <Check className="w-3 h-3" />
                            )}
                            {photoFile
                              ? "Foto adicionada"
                              : "Sem foto"}
                          </span>

                          <span
                            className={`
                              inline-flex items-center gap-1.5
                              rounded-full px-3 py-1.5 text-xs font-semibold
                              ${
                                videoFile
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }
                            `}
                          >
                            {videoFile && (
                              <Check className="w-3 h-3" />
                            )}
                            {videoFile
                              ? "Vídeo adicionado"
                              : "Sem vídeo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {form.presentation && (
                      <div className="rounded-2xl border border-border/70 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Apresentação
                        </p>

                        <p className="text-sm leading-7 mt-3 whitespace-pre-wrap">
                          {form.presentation}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label
                        className={`
                          flex items-start gap-3 rounded-2xl
                          border p-5 cursor-pointer transition-all
                          ${
                            form.privacyAccepted
                              ? "border-primary/30 bg-primary/[0.04]"
                              : "border-border/70 hover:bg-muted/20"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={
                            form.privacyAccepted
                          }
                          onChange={(e) =>
                            updateForm(
                              "privacyAccepted",
                              e.target.checked
                            )
                          }
                          className="sr-only"
                        />

                        <div
                          className={`
                            w-5 h-5 mt-0.5 rounded-md border
                            flex items-center justify-center shrink-0
                            ${
                              form.privacyAccepted
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border"
                            }
                          `}
                        >
                          {form.privacyAccepted && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <span className="text-sm leading-6">
                          Li e aceito a política de
                          privacidade e o tratamento dos
                          meus dados para utilização da
                          plataforma.
                        </span>
                      </label>

                      <label
                        className={`
                          flex items-start gap-3 rounded-2xl
                          border p-5 cursor-pointer transition-all
                          ${
                            form.confidentialityAccepted
                              ? "border-primary/30 bg-primary/[0.04]"
                              : "border-border/70 hover:bg-muted/20"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={
                            form.confidentialityAccepted
                          }
                          onChange={(e) =>
                            updateForm(
                              "confidentialityAccepted",
                              e.target.checked
                            )
                          }
                          className="sr-only"
                        />

                        <div
                          className={`
                            w-5 h-5 mt-0.5 rounded-md border
                            flex items-center justify-center shrink-0
                            ${
                              form.confidentialityAccepted
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border"
                            }
                          `}
                        >
                          {form.confidentialityAccepted && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <span className="text-sm leading-6">
                          Confirmo meu compromisso com o
                          sigilo profissional e com as
                          normas aplicáveis à minha
                          atuação.
                        </span>
                      </label>
                    </div>

                    {/* OTP */}
                    {otpSent && (
                      <div className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-6 sm:p-7">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>

                          <div>
                            <h3 className="font-bold text-lg">
                              Confirme seu e-mail
                            </h3>

                            <p className="text-sm text-muted-foreground mt-1 leading-6">
                              Enviamos um código de 6
                              dígitos para{" "}
                              <strong className="text-foreground">
                                {form.email}
                              </strong>
                              .
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={otp}
                            onChange={(e) =>
                              setOtp(
                                e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6)
                              )
                            }
                            className="
                              flex-1 h-14 rounded-xl
                              border border-border bg-background
                              px-4 text-center text-xl
                              tracking-[0.4em] font-bold
                              outline-none focus:border-primary
                              focus:ring-4 focus:ring-primary/10
                            "
                            placeholder="000000"
                          />

                          <button
                            type="button"
                            onClick={verifyEmailCode}
                            disabled={verifyingOtp}
                            className="
                              h-14 px-6 rounded-xl
                              bg-primary text-primary-foreground
                              font-semibold inline-flex
                              items-center justify-center gap-2
                              hover:opacity-90 transition-opacity
                              disabled:opacity-50
                            "
                          >
                            {verifyingOtp && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}

                            Confirmar e-mail
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <button
                            type="button"
                            onClick={resendCode}
                            disabled={submitting}
                            className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            Reenviar código
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOtpSent(false)
                            }
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                      <div className="flex items-start gap-3">
                        <FileCheck2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />

                        <div>
                          <p className="font-semibold">
                            Tudo pronto
                          </p>

                          <p className="text-sm text-muted-foreground mt-1 leading-6">
                            Ao enviar, seus dados serão
                            salvos e você receberá um código
                            de confirmação no seu e-mail.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER BUTTONS */}
              <div className="p-6 sm:p-9 border-t border-border/60 bg-muted/[0.08]">
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={
                      step === 0 ||
                      submitting ||
                      verifyingOtp
                    }
                    className="
                      h-12 px-5 rounded-xl
                      border border-border/70
                      bg-background
                      font-semibold text-sm
                      inline-flex items-center justify-center gap-2
                      hover:bg-muted/40 transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={submitting}
                      className="
                        h-12 px-6 rounded-xl
                        bg-primary text-primary-foreground
                        font-semibold text-sm
                        inline-flex items-center justify-center gap-2
                        hover:opacity-90 transition-all
                        shadow-sm
                        disabled:opacity-50
                      "
                    >
                      Próxima etapa
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : !otpSent ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="
                        h-12 px-7 rounded-xl
                        bg-primary text-primary-foreground
                        font-semibold text-sm
                        inline-flex items-center justify-center gap-2
                        hover:opacity-90 transition-all
                        shadow-sm
                        disabled:opacity-50
                      "
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}

                      {submitting
                        ? "Enviando..."
                        : "Enviar cadastro"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* BOTTOM INFO */}
            <div className="mt-7">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cadastro profissional
                </span>

                <span>•</span>

                <span>EntreNós</span>

                <span>•</span>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/termos")
                  }
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Termos
                  <ExternalLink className="w-3 h-3" />
                </button>

                <span>•</span>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/privacidade")
                  }
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Privacidade
                  <ExternalLink className="w-3 h-3" />
                </button>

                <span>•</span>

                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate("/");
                  }}
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Sair
                </button>
              </div>

              <div className="flex justify-center mt-4">
                <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Seus dados são tratados com segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
