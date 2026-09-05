import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Briefcase,
  Calendar,
  Camera,
  Video,
  ShieldCheck,
  Loader2,
  LogIn,
  Lock,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

const STEPS = [
  { key: "personal", title: "Pessoal", icon: User },
  { key: "professional", title: "Registro profissional", icon: Briefcase },
  { key: "approach", title: "Atuação", icon: Briefcase },
  { key: "service", title: "Atendimento", icon: Calendar },
  { key: "media", title: "Foto e vídeo", icon: Camera },
  { key: "review", title: "Revisão", icon: ShieldCheck },
];

const DEFAULT_FORM = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  birthDate: "",
  password: "",
  confirmPassword: "",

  crp: "",
  crpState: "",
  crpStatus: "ativo",

  approach: "",
  audience: [],
  modalities: [],
  themes: [],

  online: true,
  presencial: false,
  ePsi: false,

  address: "",
  city: "",
  state: "",

  sessionDuration: "50",
  sessionPrice: "",

  presentation: "",
};

const AUDIENCE_OPTIONS = [
  "Adultos",
  "Adolescentes",
  "Crianças",
  "Casais",
  "Famílias",
  "Idosos",
];

const THEME_OPTIONS = [
  "Ansiedade",
  "Depressão",
  "Relacionamentos",
  "Autoestima",
  "Luto",
  "Estresse",
  "Traumas",
  "Carreira",
  "Autoconhecimento",
];

const UF_OPTIONS = [
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
];

function formatPhone(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
    7
  )}`;
}

function formatCpf(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 3) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  }

  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6
    )}`;
  }

  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
    6,
    9
  )}-${numbers.slice(9)}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [user, setUser] = useState(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [finished, setFinished] = useState(false);

  /*
   * Carrega apenas uma sessão já existente.
   *
   * IMPORTANTE:
   * Não criamos a conta aqui.
   * A conta só será criada no último passo.
   */
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (session?.user) {
          setUser(session.user);

          setForm((current) => ({
            ...current,
            email: session.user.email || current.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              current.name,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Cooldown do reenvio do código.
   */
  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  /*
   * Limpa previews criados com URL.createObjectURL.
   */
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

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  const toggleArrayValue = (key, value) => {
    setForm((current) => {
      const currentValues = Array.isArray(current[key])
        ? current[key]
        : [];

      return {
        ...current,
        [key]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });

    setError("");
  };

  /*
   * Validação por etapa.
   */
  const validateStep = (currentStep = step) => {
    if (currentStep === 0) {
      if (!form.name.trim()) {
        return "Informe seu nome completo.";
      }

      if (!form.email.trim()) {
        return "Informe seu e-mail.";
      }

      if (!isValidEmail(form.email)) {
        return "Informe um e-mail válido.";
      }

      /*
       * A senha é necessária somente para uma conta nova.
       */
      if (!user) {
        if (form.password.length < 6) {
          return "A senha deve ter pelo menos 6 caracteres.";
        }

        if (form.password !== form.confirmPassword) {
          return "As senhas não coincidem.";
        }
      }

      if (!form.city.trim()) {
        return "Informe sua cidade.";
      }

      if (!form.state.trim()) {
        return "Informe seu estado.";
      }
    }

    if (currentStep === 1) {
      if (!form.crp.trim()) {
        return "Informe seu número do CRP.";
      }

      if (!form.crpState) {
        return "Selecione o estado do CRP.";
      }
    }

    if (currentStep === 2) {
      if (!form.approach.trim()) {
        return "Informe sua abordagem.";
      }

      if (!form.audience.length) {
        return "Selecione pelo menos um público.";
      }

      if (!form.themes.length) {
        return "Selecione pelo menos um tema de atuação.";
      }
    }

    if (currentStep === 3) {
      if (!form.online && !form.presencial) {
        return "Selecione pelo menos uma modalidade de atendimento.";
      }

      if (form.online && !form.ePsi) {
        return "Confirme que possui autorização e-Psi para atendimento online.";
      }

      if (form.presencial && !form.address.trim()) {
        return "Informe o endereço do consultório.";
      }

      if (!form.sessionPrice || Number(form.sessionPrice) < 0) {
        return "Informe o valor da sessão.";
      }
    }

    if (currentStep === 4) {
      if (!photoFile) {
        return "Envie uma foto profissional.";
      }
    }

    return "";
  };

  /*
   * Seleção de foto.
   *
   * A foto NÃO é enviada ainda.
   * Ela só será enviada depois da confirmação do e-mail.
   */
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      setError("Envie uma foto JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A foto deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    const preview = URL.createObjectURL(file);

    setPhotoFile(file);
    setPhotoPreview(preview);

    event.target.value = "";
  };

  /*
   * Seleção de vídeo.
   *
   * O vídeo também só será enviado após confirmação.
   */
  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    const allowed = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowed.includes(file.type)) {
      setError("Envie um vídeo MP4, WEBM ou MOV.");
      event.target.value = "";
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError("O vídeo deve ter no máximo 500 MB.");
      event.target.value = "";
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    const preview = URL.createObjectURL(file);

    setVideoFile(file);
    setVideoPreview(preview);

    event.target.value = "";
  };

  /*
   * Envia arquivo depois que o usuário já está autenticado.
   */
  const uploadAuthenticatedFile = async (
    authenticatedUser,
    file,
    type
  ) => {
    if (!file) {
      return null;
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "file";

    const folder =
      type === "photo"
        ? "photos"
        : "videos";

    const path = `professionals/${authenticatedUser.id}/${folder}/${crypto.randomUUID()}.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("profiles")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("profiles")
      .getPublicUrl(path);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error(
        `Não foi possível obter a URL da ${type === "photo" ? "foto" : "vídeo"}.`
      );
    }

    return publicUrl;
  };

  /*
   * ÚLTIMO PASSO:
   *
   * Aqui a conta é criada.
   * Aqui o e-mail é enviado para confirmação.
   *
   * Nada profissional é salvo antes disso.
   */
  const finishRegistration = async () => {
    if (submitting) {
      return;
    }

    setError("");
    setSuccess("");

    /*
     * Valida TODAS as etapas antes de mandar o e-mail.
     */
    for (let i = 0; i < STEPS.length; i += 1) {
      const validationError = validateStep(i);

      if (validationError) {
        setStep(i);
        setError(validationError);
        return;
      }
    }

    setSubmitting(true);

    try {
      const email = form.email.trim().toLowerCase();
      const name = form.name.trim();

      /*
       * Se já existe sessão, não precisamos criar uma nova conta.
       *
       * Para uma conta nova:
       * signUp dispara a confirmação por e-mail.
       */
      if (!user) {
        const {
          data,
          error: signUpError,
        } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              name,
              full_name: name,

              role: "professional",
              user_type: "professional",
              account_type: "professional",
              profile_type: "professional",
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (!data?.user) {
          throw new Error(
            "Não foi possível criar sua conta."
          );
        }

        /*
         * Mesmo que o Supabase retorne uma sessão,
         * ainda mostramos a etapa de confirmação.
         *
         * Isso deixa o fluxo consistente.
         */
        setUser(data.user);

        setOtp("");
        setOtpSent(true);
        setResendCooldown(60);

        setSuccess(
          "Sua conta foi criada. Enviamos o código de confirmação para o seu e-mail."
        );

        return;
      }

      /*
       * Conta já autenticada.
       *
       * Nesse caso podemos finalizar diretamente.
       */
      await completeProfessionalProfile(user);
    } catch (err) {
      const message =
        err?.message ||
        "Não foi possível finalizar seu cadastro.";

      const lower = message.toLowerCase();

      if (
        lower.includes("rate limit") ||
        lower.includes("too many requests")
      ) {
        setError(
          "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );
      } else if (
        lower.includes("already registered") ||
        lower.includes("user already registered")
      ) {
        setError(
          "Este e-mail já possui uma conta. Faça login para continuar."
        );
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Confirmação do código.
   *
   * ESTE É O ÚLTIMO PASSO REAL DO CADASTRO.
   *
   * Depois da confirmação:
   * 1. pega usuário autenticado;
   * 2. envia arquivos;
   * 3. cria/atualiza psychologist;
   * 4. garante metadata profissional;
   * 5. abre painel.
   */
  const verifyEmailCode = async (event) => {
    event.preventDefault();

    if (verifyingOtp) {
      return;
    }

    const code = otp.trim();

    setError("");
    setSuccess("");

    if (!/^\d{6,8}$/.test(code)) {
      setError(
        "Digite o código de 6 a 8 dígitos recebido por e-mail."
      );
      return;
    }

    setVerifyingOtp(true);

    try {
      const email = form.email.trim().toLowerCase();

      const {
        data,
        error: verifyError,
      } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data?.session?.user) {
        throw new Error(
          "E-mail confirmado, mas não foi possível iniciar sua sessão."
        );
      }

      const authenticatedUser = data.session.user;

      setUser(authenticatedUser);

      await completeProfessionalProfile(
        authenticatedUser
      );
    } catch (err) {
      const message =
        err?.message ||
        "Código inválido ou expirado.";

      const lower = message.toLowerCase();

      if (
        lower.includes("expired") ||
        lower.includes("expir")
      ) {
        setError(
          "Esse código expirou. Solicite um novo código."
        );
      } else if (
        lower.includes("invalid") ||
        lower.includes("token")
      ) {
        setError(
          "Código inválido. Confira os números recebidos e tente novamente."
        );
      } else {
        setError(message);
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  /*
   * Reenvio do código.
   */
  const resendCode = async () => {
    if (
      resendCooldown > 0 ||
      submitting ||
      verifyingOtp
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const email = form.email.trim().toLowerCase();

      const {
        error: resendError,
      } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        throw resendError;
      }

      setOtp("");
      setResendCooldown(60);

      setSuccess(
        "Um novo código foi enviado para seu e-mail."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Não foi possível reenviar o código."
      );

      setResendCooldown(60);
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Esta é a parte que garante que o painel profissional
   * sempre tenha um perfil para carregar.
   *
   * Se já existe:
   * UPDATE.
   *
   * Se não existe:
   * INSERT.
   */
  const completeProfessionalProfile = async (
    authenticatedUser
  ) => {
    if (!authenticatedUser?.id) {
      throw new Error(
        "Não foi possível identificar sua conta."
      );
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      /*
       * Garante que o metadata da conta seja profissional.
       */
      const {
        error: metadataError,
      } = await supabase.auth.updateUser({
        data: {
          name: form.name.trim(),
          full_name: form.name.trim(),

          role: "professional",
          user_type: "professional",
          account_type: "professional",
          profile_type: "professional",

          professional: true,
          professional_onboarding_completed: true,
          professional_panel_enabled: true,
        },
      });

      if (metadataError) {
        throw metadataError;
      }

      /*
       * Upload da foto somente agora,
       * depois da autenticação.
       */
      setUploading(true);

      const photoUrl =
        await uploadAuthenticatedFile(
          authenticatedUser,
          photoFile,
          "photo"
        );

      /*
       * Vídeo é opcional.
       */
      const videoUrl =
        videoFile
          ? await uploadAuthenticatedFile(
              authenticatedUser,
              videoFile,
              "video"
            )
          : null;

      setUploading(false);

      /*
       * Modalidades.
       */
      const modalities = [];

      if (form.online) {
        modalities.push("Online");
      }

      if (form.presencial) {
        modalities.push("Presencial");
      }

      /*
       * Dados completos do profissional.
       */
      const psychologistData = {
        user_id: authenticatedUser.id,

        professional_name: form.name.trim(),

        crp_number: form.crp.trim(),
        crp_region: form.crpState,

        education: null,
        institution: null,
        graduation_year: null,

        specializations: form.themes,
        approaches: form.approach
          ? [form.approach]
          : [],

        experience: null,

        topics: form.themes,

        modalities,

        languages: ["Português"],

        audience: form.audience,

        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),

        phone: form.phone.trim() || null,

        gender: null,

        session_price:
          Number(form.sessionPrice) || 0,

        session_duration:
          Number(form.sessionDuration) || 50,

        available_days: [],
        available_slots: [],

        cancellation_policy: null,

        address:
          form.address.trim() || null,

        bio:
          form.presentation.trim() || null,

        profile_photo_url: photoUrl,

        presentation_video_url:
          videoUrl || null,

        presentation_video_status:
          videoUrl
            ? "pending"
            : "approved",

        /*
         * O perfil existe, mas ainda pode precisar
         * da aprovação do CRP.
         */
        verification_status: "pending",

        /*
         * O painel pode existir imediatamente.
         * O perfil público pode continuar desativado
         * até a aprovação.
         */
        public_profile: false,
      };

      /*
       * Procura o perfil profissional.
       */
      const {
        data: existing,
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
       * Se existe, atualiza.
       */
      if (existing?.id) {
        const {
          error: updateError,
        } = await supabase
          .from("psychologists")
          .update(psychologistData)
          .eq("id", existing.id)
          .eq(
            "user_id",
            authenticatedUser.id
          );

        if (updateError) {
          throw updateError;
        }
      } else {
        /*
         * Se NÃO existe, cria.
         */
        const {
          error: insertError,
        } = await supabase
          .from("psychologists")
          .insert(psychologistData);

        if (insertError) {
          throw insertError;
        }
      }

      /*
       * Confirma novamente que o perfil realmente existe.
       *
       * Isso evita mandar o usuário para um painel
       * vazio por causa de alguma inconsistência.
       */
      const {
        data: ensuredProfile,
        error: ensureError,
      } = await supabase
        .from("psychologists")
        .select("id, user_id")
        .eq(
          "user_id",
          authenticatedUser.id
        )
        .maybeSingle();

      if (ensureError) {
        throw ensureError;
      }

      if (!ensuredProfile?.id) {
        throw new Error(
          "O cadastro foi autenticado, mas o painel profissional não pôde ser criado."
        );
      }

      setFinished(true);

      /*
       * Pequeno intervalo para a UI concluir a operação
       * antes de navegar.
       */
      setTimeout(() => {
        navigate("/painel-profissional", {
          replace: true,
        });
      }, 500);
    } catch (err) {
      console.error(
        "Erro ao criar painel profissional:",
        err
      );

      setUploading(false);

      const message =
        err?.message ||
        "Não foi possível criar seu painel profissional.";

      const lower = message.toLowerCase();

      if (
        lower.includes("jwt") ||
        lower.includes("token") ||
        lower.includes("session") ||
        lower.includes("sessão") ||
        lower.includes("unauthorized")
      ) {
        setError(
          "Sua sessão expirou. Faça login novamente."
        );

        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 1200);

        return;
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Avança normalmente pelas etapas.
   *
   * NÃO cria conta aqui.
   * A criação só acontece no último passo.
   */
  const nextStep = () => {
    setError("");
    setSuccess("");

    const validationError = validateStep(step);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const previousStep = () => {
    setError("");
    setSuccess("");

    if (step > 0) {
      setStep((current) => current - 1);
    }
  };

  /*
   * Loading inicial.
   */
  if (loading) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  /*
   * Última etapa:
   * confirmação do e-mail.
   */
  if (otpSent) {
    return (
      <PageShell>
        <div className="min-h-screen bg-background py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8">

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-8 h-8" />
                </div>

                <p className="text-xs uppercase tracking-wider font-semibold text-primary mb-2">
                  Último passo
                </p>

                <h1 className="text-2xl font-bold">
                  Confirme seu e-mail
                </h1>

                <p className="text-sm text-muted-foreground mt-3">
                  Seu cadastro profissional está pronto.
                  Agora só falta confirmar seu e-mail.
                </p>

                <p className="text-sm text-muted-foreground mt-3">
                  Enviamos um código para:
                </p>

                <p className="font-semibold mt-2 break-all">
                  {form.email}
                </p>

                <p className="text-xs text-muted-foreground mt-2">
                  Digite o código recebido para ativar seu
                  acesso profissional.
                </p>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                  {success}
                </div>
              )}

              <form
                onSubmit={verifyEmailCode}
                className="mt-7 space-y-5"
              >
                <div>
                  <label
                    htmlFor="email-code"
                    className="block text-sm font-medium mb-2"
                  >
                    Código de confirmação
                  </label>

                  <input
                    id="email-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    minLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    value={otp}
                    onChange={(event) => {
                      setOtp(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 8)
                      );

                      setError("");
                    }}
                    placeholder="00000000"
                    disabled={
                      verifyingOtp ||
                      submitting
                    }
                    className="w-full h-14 rounded-xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-[0.35em] outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    verifyingOtp ||
                    submitting ||
                    otp.length < 6 ||
                    otp.length > 8
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full gradient-brand text-white font-semibold shadow-soft disabled:opacity-50"
                >
                  {verifyingOtp ||
                  submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando seu painel...
                    </>
                  ) : (
                    <>
                      Confirmar e abrir painel
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Você poderá solicitar outro código em{" "}
                    <strong>
                      {resendCooldown}s
                    </strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={
                      submitting ||
                      verifyingOtp
                    }
                    onClick={resendCode}
                    className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {submitting
                      ? "Enviando..."
                      : "Reenviar código"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                  setSuccess("");
                  setResendCooldown(0);
                }}
                disabled={
                  verifyingOtp ||
                  submitting
                }
                className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Voltar para a revisão
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * Tela de processamento.
   */
  if (finished) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-6">
            <Check
              size={40}
              className="text-emerald-600"
            />
          </div>

          <h1 className="text-2xl font-bold">
            Tudo certo!
          </h1>

          <p className="text-muted-foreground mt-3">
            Seu painel profissional foi criado.
          </p>

          <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Abrindo seu painel...
          </div>
        </div>
      </PageShell>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <PageShell>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Topo */}
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70"
            >
              <LogIn className="w-4 h-4" />
              Já tenho uma conta
            </button>
          </div>

          {/* Indicador de etapas */}
          <div className="mb-10">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((item, index) => {
                const Icon = item.icon;

                const active =
                  index === step;

                const completed =
                  index < step;

                return (
                  <React.Fragment
                    key={item.key}
                  >
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
                          active ||
                          completed
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

                    {index <
                      STEPS.length - 1 && (
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

          {/* Card principal */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

            {/* Cabeçalho */}
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
                    Etapa {step + 1} de{" "}
                    {STEPS.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
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

              {/* STEP 0 */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Vamos começar
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Preencha seus dados básicos.
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
                        onChange={(e) =>
                          updateForm(
                            "name",
                            e.target.value
                          )
                        }
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
                        onChange={(e) =>
                          updateForm(
                            "email",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="voce@email.com"
                        autoComplete="email"
                        disabled={Boolean(user)}
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
                          updateForm(
                            "phone",
                            formatPhone(
                              e.target.value
                            )
                          )
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
                          updateForm(
                            "cpf",
                            formatCpf(
                              e.target.value
                            )
                          )
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
                          updateForm(
                            "birthDate",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {!user && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Senha
                          </label>

                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                            <input
                              type={
                                showPassword
                                  ? "text"
                                  : "password"
                              }
                              value={
                                form.password
                              }
                              onChange={(e) =>
                                updateForm(
                                  "password",
                                  e.target.value
                                )
                              }
                              className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-11 outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Mínimo de 6 caracteres"
                              autoComplete="new-password"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword(
                                  (value) =>
                                    !value
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                              className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-11 outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Repita sua senha"
                              autoComplete="new-password"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(
                                  (value) =>
                                    !value
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Cidade
                      </label>

                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          updateForm(
                            "city",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Sua cidade"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Estado
                      </label>

                      <select
                        value={form.state}
                        onChange={(e) =>
                          updateForm(
                            "state",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">
                          Selecione
                        </option>

                        {UF_OPTIONS.map(
                          (uf) => (
                            <option
                              key={uf}
                              value={uf}
                            >
                              {uf}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 mt-0.5 text-primary" />

                      <div>
                        <p className="font-medium">
                          Seu e-mail será
                          confirmado no final
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                          Você poderá preencher todo
                          o cadastro primeiro. A
                          confirmação de e-mail será o
                          último passo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Registro profissional
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Informe os dados do seu registro profissional.
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
                        onChange={(e) =>
                          updateForm(
                            "crp",
                            e.target.value
                          )
                        }
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
                          updateForm(
                            "crpState",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">
                          Selecione
                        </option>

                        {UF_OPTIONS.map(
                          (uf) => (
                            <option
                              key={uf}
                              value={uf}
                            >
                              {uf}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Situação do registro
                      </label>

                      <select
                        value={form.crpStatus}
                        onChange={(e) =>
                          updateForm(
                            "crpStatus",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      >
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
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />

                      <div>
                        <p className="font-medium">
                          Verificação profissional
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                          Os dados informados serão utilizados para verificar seu cadastro profissional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Sua atuação
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Conte sobre sua abordagem e o público que atende.
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
                        updateForm(
                          "approach",
                          e.target.value
                        )
                      }
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ex.: TCC, Psicanálise, Humanista"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Público atendido
                    </label>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {AUDIENCE_OPTIONS.map(
                        (item) => (
                          <label
                            key={item}
                            className="flex items-center gap-3 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40"
                          >
                            <input
                              type="checkbox"
                              checked={form.audience.includes(
                                item
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  "audience",
                                  item
                                )
                              }
                              className="w-4 h-4"
                            />

                            <span className="text-sm">
                              {item}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Temas de atuação
                    </label>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {THEME_OPTIONS.map(
                        (item) => (
                          <label
                            key={item}
                            className="flex items-center gap-3 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40"
                          >
                            <input
                              type="checkbox"
                              checked={form.themes.includes(
                                item
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  "themes",
                                  item
                                )
                              }
                              className="w-4 h-4"
                            />

                            <span className="text-sm">
                              {item}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Atendimento
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Defina como você atende seus pacientes.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/40">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={form.online}
                          onChange={(e) =>
                            updateForm(
                              "online",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 mt-1"
                        />

                        <div>
                          <p className="font-medium">
                            Online
                          </p>

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
                          checked={
                            form.presencial
                          }
                          onChange={(e) =>
                            updateForm(
                              "presencial",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 mt-1"
                        />

                        <div>
                          <p className="font-medium">
                            Presencial
                          </p>

                          <p className="text-sm text-muted-foreground mt-1">
                            Atendimento em consultório.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {form.online && (
                    <label className="flex items-start gap-3 border border-border rounded-xl p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.ePsi}
                        onChange={(e) =>
                          updateForm(
                            "ePsi",
                            e.target.checked
                          )
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
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Endereço
                        </label>

                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) =>
                            updateForm(
                              "address",
                              e.target.value
                            )
                          }
                          className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="Endereço do consultório"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Cidade
                          </label>

                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) =>
                              updateForm(
                                "city",
                                e.target.value
                              )
                            }
                            className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Cidade"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Estado
                          </label>

                          <select
                            value={form.state}
                            onChange={(e) =>
                              updateForm(
                                "state",
                                e.target.value
                              )
                            }
                            className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            <option value="">
                              Selecione
                            </option>

                            {UF_OPTIONS.map(
                              (uf) => (
                                <option
                                  key={uf}
                                  value={uf}
                                >
                                  {uf}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Duração da sessão
                      </label>

                      <select
                        value={
                          form.sessionDuration
                        }
                        onChange={(e) =>
                          updateForm(
                            "sessionDuration",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                      >
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Valor da sessão
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.sessionPrice
                        }
                        onChange={(e) =>
                          updateForm(
                            "sessionPrice",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Foto e vídeo
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Adicione sua foto profissional e um vídeo de apresentação.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">

                    {/* FOTO */}
                    <div className="border border-border rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Camera className="w-5 h-5 text-primary" />

                        <div>
                          <h3 className="font-semibold">
                            Foto de perfil
                          </h3>

                          <p className="text-xs text-muted-foreground">
                            JPG, PNG ou WEBP · até 5 MB
                          </p>
                        </div>
                      </div>

                      {photoPreview && (
                        <img
                          src={photoPreview}
                          alt="Prévia da foto de perfil"
                          className="w-full aspect-square object-cover rounded-xl mb-4"
                        />
                      )}

                      <label className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border cursor-pointer hover:bg-muted/40">
                        <Camera className="w-4 h-4" />

                        {photoFile
                          ? "Alterar foto"
                          : "Enviar foto"}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={
                            handlePhotoChange
                          }
                          disabled={
                            uploading ||
                            submitting
                          }
                        />
                      </label>
                    </div>

                    {/* VÍDEO */}
                    <div className="border border-border rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Video className="w-5 h-5 text-primary" />

                        <div>
                          <h3 className="font-semibold">
                            Vídeo de apresentação
                          </h3>

                          <p className="text-xs text-muted-foreground">
                            MP4, WEBM ou MOV · até 500 MB
                          </p>
                        </div>
                      </div>

                      {videoPreview && (
                        <video
                          src={videoPreview}
                          controls
                          className="w-full rounded-xl mb-4"
                        />
                      )}

                      <label className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border cursor-pointer hover:bg-muted/40">
                        <Video className="w-4 h-4" />

                        {videoFile
                          ? "Alterar vídeo"
                          : "Enviar vídeo"}

                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={
                            handleVideoChange
                          }
                          disabled={
                            uploading ||
                            submitting
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apresentação
                    </label>

                    <textarea
                      value={
                        form.presentation
                      }
                      onChange={(e) =>
                        updateForm(
                          "presentation",
                          e.target.value
                        )
                      }
                      rows={7}
                      maxLength={2000}
                      className="w-full rounded-xl border border-border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      placeholder="Fale sobre sua experiência, sua forma de trabalhar e como você pode ajudar seus pacientes."
                    />

                    <div className="text-xs text-muted-foreground text-right mt-1">
                      {form.presentation.length}
                      /2000
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />

                      <div>
                        <p className="font-medium">
                          Seus arquivos estão quase prontos
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                          Eles serão enviados com segurança depois que seu e-mail for confirmado.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Revise seu cadastro
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Está tudo certo? No próximo botão enviaremos o código de confirmação.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Nome
                      </p>

                      <p className="font-medium mt-1">
                        {form.name ||
                          "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        E-mail
                      </p>

                      <p className="font-medium mt-1 break-all">
                        {form.email ||
                          "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        CRP
                      </p>

                      <p className="font-medium mt-1">
                        {form.crp
                          ? `${form.crp} - ${form.crpState}`
                          : "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Abordagem
                      </p>

                      <p className="font-medium mt-1">
                        {form.approach ||
                          "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Público
                      </p>

                      <p className="font-medium mt-1">
                        {form.audience.length
                          ? form.audience.join(
                              ", "
                            )
                          : "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Temas
                      </p>

                      <p className="font-medium mt-1">
                        {form.themes.length
                          ? form.themes.join(
                              ", "
                            )
                          : "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Atendimento
                      </p>

                      <p className="font-medium mt-1">
                        {[
                          form.online
                            ? "Online"
                            : "",
                          form.presencial
                            ? "Presencial"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" e ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Foto
                      </p>

                      <p className="font-medium mt-1">
                        {photoFile
                          ? "Foto selecionada"
                          : "Sem foto"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Vídeo
                      </p>

                      <p className="font-medium mt-1">
                        {videoFile
                          ? "Vídeo selecionado"
                          : "Nenhum vídeo"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Valor
                      </p>

                      <p className="font-medium mt-1">
                        R${" "}
                        {Number(
                          form.sessionPrice ||
                            0
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-6 h-6 text-primary shrink-0" />

                      <div>
                        <p className="font-semibold">
                          Última etapa: confirmação de e-mail
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                          Ao clicar em finalizar, sua conta será criada e enviaremos um código para o e-mail informado. Depois da confirmação, o painel profissional será criado automaticamente e você será levado para ele.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NAVEGAÇÃO */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 pt-6 border-t border-border">

                <button
                  type="button"
                  onClick={previousStep}
                  disabled={
                    step === 0 ||
                    submitting ||
                    verifyingOtp ||
                    uploading
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border font-semibold disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      submitting ||
                      uploading
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold disabled:opacity-50"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      finishRegistration
                    }
                    disabled={
                      submitting ||
                      uploading
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold disabled:opacity-50"
                  >
                    {submitting ||
                    uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />

                        {uploading
                          ? "Preparando..."
                          : "Enviando código..."}
                      </>
                    ) : (
                      <>
                        Finalizar cadastro
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
