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
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
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

    if (digits.length <= 2) return digits;
    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const validateFile = (file, type) => {
    if (!file) return false;

    if (type === "photo") {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
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
      const allowed = ["video/mp4", "video/webm", "video/quicktime"];
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

    if (!file || !validateFile(file, "photo")) return;

    if (photoPreview) URL.revokeObjectURL(photoPreview);

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file || !validateFile(file, "video")) return;

    if (videoPreview) URL.revokeObjectURL(videoPreview);

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview("");
  };

  const validation = useMemo(() => {
    const errors = [];

    if (!form.name.trim()) errors.push("Informe seu nome.");
    if (!form.email.trim()) errors.push("Informe seu e-mail.");

    if (form.password.length < 6) {
      errors.push("A senha deve ter pelo menos 6 caracteres.");
    }

    if (form.password !== form.confirmPassword) {
      errors.push("As senhas não coincidem.");
    }

    if (!form.crp.trim()) errors.push("Informe seu CRP.");
    if (!form.crpState.trim()) errors.push("Informe o estado do CRP.");
    if (!form.approach.trim()) errors.push("Informe sua abordagem.");

    if (!form.audience.length) {
      errors.push("Selecione pelo menos um público.");
    }

    if (!form.modalities.length) {
      errors.push("Selecione pelo menos uma modalidade.");
    }

    if (!form.online && !form.presencial) {
      errors.push("Selecione pelo menos uma forma de atendimento.");
    }

    if (form.online && !form.ePsi) {
      errors.push("Informe se possui autorização e-Psi para atendimento online.");
    }

    if (!form.presentation.trim()) {
      errors.push("Escreva uma apresentação profissional.");
    }

    if (!form.privacyAccepted) {
      errors.push("Aceite a política de privacidade.");
    }

    if (!form.confidentialityAccepted) {
      errors.push("Confirme o compromisso com sigilo profissional.");
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

      return true;
    }

    if (currentStep === 3) {
      if (!form.modalities.length) {
        setError("Selecione pelo menos uma modalidade.");
        return false;
      }

      if (!form.online && !form.presencial) {
        setError("Selecione pelo menos uma forma de atendimento.");
        return false;
      }

      if (form.online && !form.ePsi) {
        setError("Informe se possui autorização e-Psi para atendimento online.");
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
        setError("Confirme o compromisso com sigilo profissional.");
        return false;
      }

      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const previousStep = () => {
    setError("");
    setSuccess("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const uploadFile = async (bucket, file, path) => {
    if (!file) return null;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      const message = uploadError.message || "Falha no upload.";
      throw new Error(
        `Não foi possível enviar o arquivo para o armazenamento (${bucket}). ${message}`
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

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
      confidentiality_accepted: form.confidentialityAccepted,
      registration_verified: false,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      throw new Error(
        `Não foi possível salvar o perfil. Verifique a tabela profiles e as policies RLS. ${
          profileError.message || "Erro desconhecido."
        }`
      );
    }

    return {
      photoUrl,
      videoUrl,
    };
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const email = form.email.trim().toLowerCase();

      const { data: existingSession } = await supabase.auth.getSession();

      let user = existingSession?.session?.user || null;

      if (!user) {
        const { data, error: signUpError } = await supabase.auth.signUp({
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

        if (signUpError) throw signUpError;

        user = data?.user || null;
      }

      if (!user) {
        throw new Error("Não foi possível criar a conta.");
      }

      // IMPORTANTE: não salvamos o perfil nem fazemos upload antes da confirmação
      // do e-mail. Quando o Supabase exige confirmação, o usuário ainda não possui
      // uma sessão autenticada e as policies/RLS de profiles e Storage podem bloquear
      // a operação e resultar em erro 520 no navegador/proxy.

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) throw otpError;

      setOtpSent(true);
      setSuccess("Cadastro enviado. Digite o código de 6 dígitos enviado para seu e-mail.");
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Não foi possível criar o cadastro. Tente novamente."
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

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verifyError) throw verifyError;

      const user = data?.user;

      if (!user) {
        throw new Error("Não foi possível confirmar seu e-mail.");
      }

      // Agora o usuário está autenticado. Só neste momento fazemos upload e
      // gravação do perfil, evitando RLS/Storage antes da confirmação do e-mail.
      await saveProfile(user.id);

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: form.name.trim(),
          full_name: form.name.trim(),
          role: "professional",
        },
      });

      if (metadataError) throw metadataError;

      const { error: profileVerifyError } = await supabase
        .from("profiles")
        .update({
          role: "professional",
          registration_verified: true,
        })
        .eq("id", user.id);

      if (profileVerifyError) throw profileVerifyError;

      navigate("/painel-profissional");
    } catch (verifyError) {
      setError(
        verifyError?.message ||
          "Não foi possível concluir o cadastro após a confirmação do e-mail."
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

      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (resendError) throw resendError;

      setOtp("");
      setSuccess("Um novo código foi enviado para seu e-mail.");
    } catch (resendError) {
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

  if (checkingSession) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <PageShell>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="button"
              onClick={goToLogin}
              className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              Já tenho uma conta
            </button>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between gap-2">
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
                      className="flex flex-col items-center gap-2 min-w-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                          active || completed
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        {completed ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>

                      <span
                        className={`text-xs text-center hidden sm:block ${
                          active
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>

                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-px flex-1 ${
                          index < step
                            ? "bg-primary"
                            : "bg-border"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <StepIcon className="w-5 h-5" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold">
                    {STEPS[step].title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Etapa {step + 1} de {STEPS.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                  {success}
                </div>
              )}

              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">
                      Vamos começar
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Informe seus dados básicos para criar sua conta profissional.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="voce@email.com"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          updateForm("phone", formatPhone(e.target.value))
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={form.cpf}
                        onChange={(e) =>
                          updateForm("cpf", formatCpf(e.target.value))
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Data de nascimento
                      </label>
                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) =>
                          updateForm("birthDate", e.target.value)
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) =>
                            updateForm("password", e.target.value)
                          }
                          className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-11 outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Mínimo de 6 caracteres"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Confirmar senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) =>
                            updateForm("confirmPassword", e.target.value)
                          }
                          className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-11 outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Repita sua senha"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <UserPlus className="w-5 h-5 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">
                          Seu cadastro será como profissional
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Depois da confirmação do e-mail, você será direcionado ao painel profissional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">
                      Registro profissional
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Informe os dados relacionados ao seu registro profissional.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        CRP
                      </label>
                      <input
                        type="text"
                        value={form.crp}
                        onChange={(e) => updateForm("crp", e.target.value)}
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ex.: 06/000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Estado do CRP
                      </label>
                      <select
                        value={form.crpState}
                        onChange={(e) =>
                          updateForm("crpState", e.target.value)
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Selecione</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Situação do registro
                      </label>
                      <select
                        value={form.crpStatus}
                        onChange={(e) =>
                          updateForm("crpStatus", e.target.value)
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Selecione</option>
                        <option value="ativo">Ativo</option>
                        <option value="regular">Regular</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Verificação profissional</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Os dados informados poderão ser utilizados para a verificação do seu cadastro profissional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">
                      Sua atuação
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Conte um pouco sobre sua abordagem e o público que atende.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Abordagem
                    </label>
                    <input
                      type="text"
                      value={form.approach}
                      onChange={(e) =>
                        updateForm("approach", e.target.value)
                      }
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ex.: TCC, Psicanálise, Humanista..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Público atendido
                    </label>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        "Adultos",
                        "Adolescentes",
                        "Crianças",
                        "Casais",
                        "Famílias",
                        "Idosos",
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-3 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            checked={form.audience.includes(item)}
                            onChange={() =>
                              toggleArrayValue("audience", item)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Temas de atuação
                    </label>

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
                        <label
                          key={item}
                          className="flex items-center gap-3 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            checked={form.modalities.includes(item)}
                            onChange={() =>
                              toggleArrayValue("modalities", item)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">
                      Atendimento
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Defina como você atende seus pacientes.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Modalidade de atendimento
                    </label>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/40">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={form.online}
                            onChange={(e) =>
                              updateForm("online", e.target.checked)
                            }
                            className="w-4 h-4 mt-1"
                          />
                          <div>
                            <p className="font-medium">Online</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Atendimento por videochamada.
                            </p>
                          </div>
                        </div>
                      </label>

                      <label className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/40">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={form.presencial}
                            onChange={(e) =>
                              updateForm("presencial", e.target.checked)
                            }
                            className="w-4 h-4 mt-1"
                          />
                          <div>
                            <p className="font-medium">Presencial</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Atendimento em consultório.
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {form.online && (
                    <label className="flex items-start gap-3 border border-border rounded-xl p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.ePsi}
                        onChange={(e) =>
                          updateForm("ePsi", e.target.checked)
                        }
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <p className="font-medium">
                          Possuo autorização e-Psi
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Confirmo que estou regularizado para atendimento psicológico online.
                        </p>
                      </div>
                    </label>
                  )}

                  {form.presencial && (
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                          Endereço
                        </label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) =>
                            updateForm("address", e.target.value)
                          }
                          className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Endereço do consultório"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) =>
                            updateForm("city", e.target.value)
                          }
                          className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Cidade"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) =>
                            updateForm("state", e.target.value.toUpperCase())
                          }
                          maxLength={2}
                          className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="UF"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Duração da sessão
                      </label>
                      <select
                        value={form.sessionDuration}
                        onChange={(e) =>
                          updateForm("sessionDuration", e.target.value)
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Selecione</option>
                        <option value="30">30 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="50">50 minutos</option>
                        <option value="60">60 minutos</option>
                        <option value="90">90 minutos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Valor da sessão
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.sessionPrice}
                        onChange={(e) =>
                          updateForm("sessionPrice", e.target.value)
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">
                      Foto e vídeo
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma foto profissional e um vídeo curto de apresentação.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="border border-border rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Foto de perfil</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG ou WEBP · até 5 MB
                          </p>
                        </div>

                        <Camera className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Prévia da foto"
                            className="w-full aspect-square object-cover rounded-xl"
                          />

                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 border border-border flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors">
                          <Camera className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Escolher foto
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="border border-border rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">
                            Vídeo de apresentação
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            MP4, WEBM ou MOV · até 100 MB
                          </p>
                        </div>

                        <Video className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {videoPreview ? (
                        <div className="relative">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full aspect-video object-cover rounded-xl bg-black"
                          />

                          <button
                            type="button"
                            onClick={removeVideo}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 border border-border flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors">
                          <Video className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Escolher vídeo
                          </span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={handleVideoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apresentação profissional
                    </label>
                    <textarea
                      value={form.presentation}
                      onChange={(e) =>
                        updateForm("presentation", e.target.value)
                      }
                      rows={7}
                      maxLength={2000}
                      className="w-full rounded-xl border border-border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      placeholder="Fale sobre sua experiência, sua forma de trabalhar e como você pode ajudar seus pacientes."
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1">
                      {form.presentation.length}/2000
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">
                      Revise seu cadastro
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Confira os dados antes de enviar.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Nome
                      </p>
                      <p className="font-medium">{form.name || "—"}</p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        E-mail
                      </p>
                      <p className="font-medium break-all">
                        {form.email || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        CRP
                      </p>
                      <p className="font-medium">
                        {form.crp
                          ? `${form.crp} - ${form.crpState}`
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Abordagem
                      </p>
                      <p className="font-medium">
                        {form.approach || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Público
                      </p>
                      <p className="font-medium">
                        {form.audience.length
                          ? form.audience.join(", ")
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Modalidades
                      </p>
                      <p className="font-medium">
                        {form.modalities.length
                          ? form.modalities.join(", ")
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Atendimento
                      </p>
                      <p className="font-medium">
                        {[
                          form.online && "Online",
                          form.presencial && "Presencial",
                        ]
                          .filter(Boolean)
                          .join(" e ") || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Arquivos
                      </p>
                      <p className="font-medium">
                        {photoFile ? "Foto adicionada" : "Sem foto"}
                        {" · "}
                        {videoFile ? "Vídeo adicionado" : "Sem vídeo"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.privacyAccepted}
                        onChange={(e) =>
                          updateForm(
                            "privacyAccepted",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 mt-1"
                      />
                      <span className="text-sm">
                        Li e aceito a política de privacidade e o tratamento dos meus dados para utilização da plataforma.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.confidentialityAccepted}
                        onChange={(e) =>
                          updateForm(
                            "confidentialityAccepted",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 mt-1"
                      />
                      <span className="text-sm">
                        Confirmo meu compromisso com o sigilo profissional e com as normas aplicáveis à minha atuação.
                      </span>
                    </label>
                  </div>

                  {otpSent && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                      <div className="flex items-start gap-3 mb-5">
                        <ShieldCheck className="w-6 h-6 text-primary mt-0.5" />
                        <div>
                          <h3 className="font-semibold">
                            Confirme seu e-mail
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Enviamos um código de 6 dígitos para{" "}
                            {form.email}.
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
                          className="flex-1 h-12 rounded-lg border border-border bg-background px-4 text-center text-xl tracking-[0.4em] font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="000000"
                        />

                        <button
                          type="button"
                          onClick={verifyEmailCode}
                          disabled={verifyingOtp}
                          className="h-12 px-6 rounded-lg bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
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
                          className="text-sm font-medium hover:underline disabled:opacity-50"
                        >
                          Reenviar código
                        </button>

                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Seus dados estão protegidos
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          O envio do cadastro solicitará a confirmação do seu endereço de e-mail antes do acesso ao painel profissional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 border-t border-border flex flex-col sm:flex-row gap-3 sm:justify-between">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 0 || submitting || verifyingOtp}
                className="h-11 px-5 rounded-lg border border-border font-medium inline-flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={submitting}
                  className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Próxima etapa
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : !otpSent ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Enviar cadastro
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cadastro profissional
            </span>

            <span>•</span>

            <span>EntreNós</span>

            <span>•</span>

            <button
              type="button"
              onClick={() => navigate("/termos")}
              className="hover:text-foreground inline-flex items-center gap-1"
            >
              Termos
              <ExternalLink className="w-3 h-3" />
            </button>

            <span>•</span>

            <button
              type="button"
              onClick={() => navigate("/privacidade")}
              className="hover:text-foreground inline-flex items-center gap-1"
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
              className="hover:text-foreground inline-flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
