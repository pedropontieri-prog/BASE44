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
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

const STEPS = [
  {
    key: "personal",
    title: "Pessoal",
    icon: User,
  },
  {
    key: "professional",
    title: "Registro profissional",
    icon: Briefcase,
  },
  {
    key: "approach",
    title: "Atuação",
    icon: Briefcase,
  },
  {
    key: "service",
    title: "Atendimento",
    icon: Calendar,
  },
  {
    key: "media",
    title: "Foto e vídeo",
    icon: Camera,
  },
  {
    key: "review",
    title: "Revisão",
    icon: ShieldCheck,
  },
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

  photoUrl: "",
  videoUrl: "",
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

function formatPhone(value = "") {
  const numbers = String(value)
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(
    2,
    7
  )}-${numbers.slice(7)}`;
}

function formatCpf(value = "") {
  const numbers = String(value)
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numbers.length <= 3) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  }

  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(
      3,
      6
    )}.${numbers.slice(6)}`;
  }

  return `${numbers.slice(0, 3)}.${numbers.slice(
    3,
    6
  )}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function getErrorMessage(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error.message ||
    error.error_description ||
    fallback
  );
}

function isRateLimitError(error) {
  const message = getErrorMessage(
    error,
    ""
  ).toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("429")
  );
}

function isAlreadyRegisteredError(error) {
  const message = getErrorMessage(
    error,
    ""
  ).toLowerCase();

  return (
    message.includes("already registered") ||
    message.includes("user already registered") ||
    message.includes("already exists")
  );
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
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] =
    useState(0);

  const [user, setUser] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * =========================================================
   * SESSÃO
   * =========================================================
   */
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError) {
          console.error(
            "Erro ao carregar sessão:",
            sessionError
          );
        }

        const session = data?.session;

        if (session?.user) {
          setUser(session.user);

          setForm((current) => ({
            ...current,
            email:
              session.user.email ||
              current.email,
            name:
              session.user.user_metadata
                ?.full_name ||
              session.user.user_metadata
                ?.name ||
              current.name,
          }));
        }
      } catch (err) {
        console.error(
          "Erro ao carregar sessão:",
          err
        );
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
   * =========================================================
   * OBSERVA MUDANÇAS DE AUTENTICAÇÃO
   * =========================================================
   */
  useEffect(() => {
    const {
      data: subscriptionData,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const authenticatedUser =
          session?.user || null;

        setUser(authenticatedUser);

        if (authenticatedUser) {
          setForm((current) => ({
            ...current,
            email:
              authenticatedUser.email ||
              current.email,
            name:
              authenticatedUser.user_metadata
                ?.full_name ||
              authenticatedUser.user_metadata
                ?.name ||
              current.name,
          }));
        }
      }
    );

    return () => {
      subscriptionData?.subscription?.unsubscribe();
    };
  }, []);

  /*
   * =========================================================
   * COOLDOWN DO OTP
   * =========================================================
   */
  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  /*
   * =========================================================
   * FORM
   * =========================================================
   */
  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  const toggleArrayValue = (key, value) => {
    setForm((current) => {
      const currentValues = Array.isArray(
        current[key]
      )
        ? current[key]
        : [];

      const exists =
        currentValues.includes(value);

      return {
        ...current,
        [key]: exists
          ? currentValues.filter(
              (item) => item !== value
            )
          : [...currentValues, value],
      };
    });

    setError("");
  };

  /*
   * =========================================================
   * VALIDAÇÕES
   * =========================================================
   */
  const validateStep = (
    currentStep = step
  ) => {
    if (currentStep === 0) {
      if (!form.name.trim()) {
        return "Informe seu nome completo.";
      }

      if (!form.email.trim()) {
        return "Informe seu e-mail.";
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          normalizeEmail(form.email)
        )
      ) {
        return "Informe um e-mail válido.";
      }

      if (!user) {
        if (!form.password) {
          return "Crie uma senha.";
        }

        if (form.password.length < 6) {
          return "A senha deve ter pelo menos 6 caracteres.";
        }

        if (
          form.password !==
          form.confirmPassword
        ) {
          return "As senhas não coincidem.";
        }
      }

      if (!form.city.trim()) {
        return "Informe sua cidade.";
      }

      if (!form.state) {
        return "Selecione seu estado.";
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
      if (
        !form.online &&
        !form.presencial
      ) {
        return "Selecione pelo menos uma modalidade de atendimento.";
      }

      if (
        form.online &&
        !form.ePsi
      ) {
        return "Confirme que possui autorização e-Psi para atendimento online.";
      }

      if (
        form.presencial &&
        !form.address.trim()
      ) {
        return "Informe o endereço do consultório.";
      }
    }

    if (currentStep === 4) {
      if (!form.photoUrl) {
        return "Envie uma foto profissional.";
      }
    }

    if (currentStep === 5) {
      for (let i = 0; i < 5; i += 1) {
        const validationError =
          validateStep(i);

        if (validationError) {
          return validationError;
        }
      }
    }

    return "";
  };

  const validateAllSteps = () => {
    for (let i = 0; i < 5; i += 1) {
      const validationError =
        validateStep(i);

      if (validationError) {
        return {
          step: i,
          error: validationError,
        };
      }
    }

    return null;
  };

  /*
   * =========================================================
   * METADADOS DO USUÁRIO
   * =========================================================
   */
  const updateProfessionalMetadata = async (
    authenticatedUser,
    name
  ) => {
    if (!authenticatedUser?.id) {
      throw new Error(
        "Usuário autenticado não encontrado."
      );
    }

    const {
      error: metadataError,
    } = await supabase.auth.updateUser({
      data: {
        name,
        full_name: name,

        role: "professional",
        user_type: "professional",
        account_type: "professional",
        profile_type: "professional",
      },
    });

    if (metadataError) {
      throw metadataError;
    }
  };

  /*
   * =========================================================
   * CRIA CONTA
   * =========================================================
   */
  const createAccount = async () => {
    if (submitting) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError =
      validateStep(0);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const email = normalizeEmail(
        form.email
      );

      const name = form.name.trim();

      /*
       * Se já existe sessão, não cria outra conta.
       */
      if (user?.id) {
        await updateProfessionalMetadata(
          user,
          name
        );

        setStep(1);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      /*
       * Criação da conta no Supabase Auth.
       */
      const {
        data,
        error: signUpError,
      } =
        await supabase.auth.signUp({
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
       * O Supabase pode devolver uma sessão
       * imediatamente ou exigir confirmação.
       */
      const authenticatedUser =
        data.session?.user || data.user;

      setUser(authenticatedUser);

      /*
       * Se houver sessão, atualizamos os metadados.
       */
      if (data.session?.user) {
        try {
          await updateProfessionalMetadata(
            data.session.user,
            name
          );
        } catch (metadataError) {
          console.error(
            "Erro ao atualizar metadados:",
            metadataError
          );
        }
      }

      setSuccess(
        data.session
          ? "Conta criada. Continue preenchendo seu perfil profissional."
          : "Conta criada. Continue preenchendo seu perfil. A confirmação do e-mail será o último passo."
      );

      setStep(1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Erro ao criar conta:",
        err
      );

      if (isRateLimitError(err)) {
        setError(
          "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
        );
      } else if (
        isAlreadyRegisteredError(err)
      ) {
        setError(
          "Este e-mail já está cadastrado. Entre pela opção \"Já tenho uma conta\"."
        );
      } else {
        setError(
          getErrorMessage(
            err,
            "Não foi possível criar sua conta."
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * =========================================================
   * OBTÉM USUÁRIO ATUAL
   * =========================================================
   */
  const getAuthenticatedUser =
    async () => {
      const {
        data,
        error: authError,
      } =
        await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!data?.user) {
        throw new Error(
          "Sua sessão expirou. Faça login novamente."
        );
      }

      return data.user;
    };

  /*
   * =========================================================
   * SALVA PSYCHOLOGIST
   * =========================================================
   */
  const saveProfessional = async (
    authenticatedUser
  ) => {
    if (!authenticatedUser?.id) {
      throw new Error(
        "Não foi possível identificar sua conta."
      );
    }

    const modalities = [];

    if (form.online) {
      modalities.push("Online");
    }

    if (form.presencial) {
      modalities.push("Presencial");
    }

    const psychologistData = {
      user_id: authenticatedUser.id,

      professional_name:
        form.name.trim(),

      crp_number:
        form.crp.trim(),

      crp_region:
        form.crpState,

      education: null,
      institution: null,
      graduation_year: null,

      specializations:
        form.themes,

      approaches: form.approach
        ? [form.approach.trim()]
        : [],

      experience: null,

      topics:
        form.themes,

      modalities,

      languages: ["Português"],

      audience:
        form.audience,

      city:
        form.city.trim(),

      state:
        form.state
          .trim()
          .toUpperCase(),

      phone:
        form.phone.trim() ||
        null,

      gender: null,

      session_price:
        Number(form.sessionPrice) || 0,

      session_duration:
        Number(form.sessionDuration) || 50,

      available_days: [],
      available_slots: [],

      cancellation_policy: null,

      address:
        form.presencial &&
        form.address.trim()
          ? form.address.trim()
          : null,

      bio:
        form.presentation.trim() ||
        null,

      profile_photo_url:
        form.photoUrl,

      presentation_video_url:
        form.videoUrl || null,

      presentation_video_status:
        form.videoUrl
          ? "pending"
          : "approved",

      verification_status:
        "pending",

      public_profile: false,
    };

    /*
     * Procura registro existente pelo user_id.
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
     * Atualiza registro existente.
     */
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

      return existing.id;
    }

    /*
     * Cria novo registro.
     */
    const {
      data: created,
      error: insertError,
    } =
      await supabase
        .from("psychologists")
        .insert(
          psychologistData
        )
        .select("id")
        .single();

    if (insertError) {
      throw insertError;
    }

    return created?.id || null;
  };

  /*
   * =========================================================
   * ENVIA CÓDIGO FINAL
   * =========================================================
   */
  const sendFinalEmailConfirmation =
    async () => {
      if (
        submitting ||
        verifyingOtp
      ) {
        return false;
      }

      setError("");
      setSuccess("");
      setSubmitting(true);

      try {
        const email =
          normalizeEmail(
            form.email
          );

        if (!email) {
          throw new Error(
            "Informe seu e-mail."
          );
        }

        const {
          error: resendError,
        } =
          await supabase.auth.resend({
            type: "signup",
            email,
          });

        if (resendError) {
          throw resendError;
        }

        setOtp("");
        setOtpSent(true);
        setResendCooldown(60);

        setSuccess(
          "Código enviado. Confira seu e-mail para finalizar o cadastro."
        );

        return true;
      } catch (err) {
        console.error(
          "Erro ao enviar código:",
          err
        );

        if (isRateLimitError(err)) {
          setError(
            "Muitas tentativas. Aguarde alguns minutos antes de solicitar outro código."
          );
        } else {
          setError(
            getErrorMessage(
              err,
              "Não foi possível enviar o código de confirmação."
            )
          );
        }

        return false;
      } finally {
        setSubmitting(false);
      }
    };

  /*
   * =========================================================
   * VERIFICA OTP
   * =========================================================
   */
  const verifyEmailCode = async (
    event
  ) => {
    event.preventDefault();

    if (verifyingOtp) {
      return;
    }

    setError("");
    setSuccess("");

    const code = otp.trim();

    if (!/^\d{6,8}$/.test(code)) {
      setError(
        "Digite o código de 6 ou 8 dígitos recebido por e-mail."
      );
      return;
    }

    setVerifyingOtp(true);

    try {
      const email =
        normalizeEmail(
          form.email
        );

      /*
       * Confirma o cadastro.
       */
      const {
        data,
        error: verifyError,
      } =
        await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "signup",
        });

      if (verifyError) {
        throw verifyError;
      }

      /*
       * Em alguns cenários o Supabase pode confirmar
       * sem devolver session imediatamente.
       *
       * Nesse caso tentamos recuperar a sessão atual.
       */
      let authenticatedUser =
        data?.user || null;

      let session =
        data?.session || null;

      if (!authenticatedUser) {
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        session =
          sessionData?.session || null;

        authenticatedUser =
          session?.user || null;
      }

      if (!authenticatedUser?.id) {
        throw new Error(
          "E-mail confirmado, mas não foi possível iniciar sua sessão. Tente entrar novamente."
        );
      }

      /*
       * Atualiza metadados.
       */
      await updateProfessionalMetadata(
        authenticatedUser,
        form.name.trim()
      );

      /*
       * Busca novamente o usuário autenticado
       * depois do update.
       */
      const freshUser =
        await getAuthenticatedUser();

      setUser(freshUser);

      /*
       * Salva o perfil profissional somente agora.
       */
      await saveProfessional(
        freshUser
      );

      setOtp("");
      setOtpSent(false);
      setSuccess(
        "E-mail confirmado! Abrindo seu painel profissional..."
      );

      window.setTimeout(() => {
        navigate(
          "/painel-profissional",
          {
            replace: true,
          }
        );
      }, 500);
    } catch (err) {
      console.error(
        "Erro ao confirmar cadastro profissional:",
        err
      );

      const message =
        getErrorMessage(
          err,
          "Código inválido ou expirado."
        );

      const lower =
        message.toLowerCase();

      if (
        lower.includes("expired") ||
        lower.includes("expir")
      ) {
        setError(
          "Esse código expirou. Solicite um novo código."
        );
      } else if (
        lower.includes("invalid") ||
        lower.includes("token") ||
        lower.includes("otp")
      ) {
        setError(
          "Código inválido. Confira os números recebidos e tente novamente."
        );
      } else if (
        lower.includes("session")
      ) {
        setError(
          "O e-mail foi confirmado, mas sua sessão não pôde ser iniciada. Faça login e tente novamente."
        );
      } else {
        setError(message);
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  /*
   * =========================================================
   * REENVIA CÓDIGO
   * =========================================================
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
      const email =
        normalizeEmail(
          form.email
        );

      if (!email) {
        throw new Error(
          "E-mail não informado."
        );
      }

      const {
        error: resendError,
      } =
        await supabase.auth.resend({
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
      console.error(
        "Erro ao reenviar código:",
        err
      );

      if (isRateLimitError(err)) {
        setError(
          "Muitas tentativas. Aguarde alguns minutos antes de solicitar outro código."
        );
      } else {
        setError(
          getErrorMessage(
            err,
            "Não foi possível reenviar o código."
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * =========================================================
   * UPLOAD
   * =========================================================
   */
  const uploadFile = async (
    event,
    type
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      let authenticatedUser =
        user;

      if (!authenticatedUser?.id) {
        authenticatedUser =
          await getAuthenticatedUser();

        setUser(
          authenticatedUser
        );
      }

      /*
       * FOTO
       */
      if (type === "photo") {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        if (
          !allowedTypes.includes(
            file.type
          )
        ) {
          throw new Error(
            "Envie uma foto JPG, PNG ou WEBP."
          );
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          throw new Error(
            "A foto deve ter no máximo 5 MB."
          );
        }
      }

      /*
       * VÍDEO
       */
      if (type === "video") {
        const allowedTypes = [
          "video/mp4",
          "video/webm",
          "video/quicktime",
        ];

        if (
          !allowedTypes.includes(
            file.type
          )
        ) {
          throw new Error(
            "Envie um vídeo MP4, WEBM ou MOV."
          );
        }

        if (
          file.size >
          500 * 1024 * 1024
        ) {
          throw new Error(
            "O vídeo deve ter no máximo 500 MB."
          );
        }
      }

      const originalExtension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase();

      const extension =
        originalExtension ||
        (type === "photo"
          ? "jpg"
          : "mp4");

      const randomId =
        typeof crypto !==
          "undefined" &&
        typeof crypto.randomUUID ===
          "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const path =
        type === "photo"
          ? `professionals/${authenticatedUser.id}/photos/${randomId}.${extension}`
          : `professionals/${authenticatedUser.id}/videos/${randomId}.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("profiles")
          .upload(
            path,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                file.type,
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
          .getPublicUrl(path);

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "Não foi possível obter a URL do arquivo."
        );
      }

      if (type === "photo") {
        setForm((current) => ({
          ...current,
          photoUrl: publicUrl,
        }));
      } else {
        setForm((current) => ({
          ...current,
          videoUrl: publicUrl,
        }));
      }

      setSuccess(
        type === "photo"
          ? "Foto enviada com sucesso."
          : "Vídeo enviado com sucesso."
      );
    } catch (err) {
      console.error(
        "Erro no upload:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Não foi possível enviar o arquivo."
        )
      );
    } finally {
      setUploading(false);

      /*
       * Permite selecionar novamente o mesmo arquivo.
       */
      event.target.value = "";
    }
  };

  /*
   * =========================================================
   * FINALIZA CADASTRO
   * =========================================================
   */
  const finishRegistration =
    async () => {
      if (
        submitting ||
        uploading ||
        verifyingOtp
      ) {
        return;
      }

      setError("");
      setSuccess("");

      /*
       * Valida tudo antes de enviar o código.
       */
      const validation =
        validateAllSteps();

      if (validation) {
        setStep(
          validation.step
        );

        setError(
          validation.error
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      try {
        /*
         * Garante usuário autenticado.
         */
        const authenticatedUser =
          await getAuthenticatedUser();

        setUser(
          authenticatedUser
        );

        /*
         * Atualiza metadados antes da confirmação,
         * quando possível.
         */
        try {
          await updateProfessionalMetadata(
            authenticatedUser,
            form.name.trim()
          );
        } catch (metadataError) {
          console.error(
            "Não foi possível atualizar metadados:",
            metadataError
          );
        }

        /*
         * ENVIA O CÓDIGO SOMENTE AGORA.
         */
        await sendFinalEmailConfirmation();
      } catch (err) {
        console.error(
          "Erro ao iniciar finalização:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Sua sessão expirou. Faça login novamente."
          )
        );
      }
    };

  /*
   * =========================================================
   * PRÓXIMO PASSO
   * =========================================================
   */
  const nextStep = async () => {
    if (
      submitting ||
      uploading ||
      verifyingOtp
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError =
      validateStep(step);

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    /*
     * PRIMEIRO PASSO
     *
     * Se não existe usuário:
     * cria a conta.
     */
    if (
      step === 0 &&
      !user
    ) {
      await createAccount();
      return;
    }

    /*
     * ETAPAS NORMAIS.
     */
    if (
      step <
      STEPS.length - 1
    ) {
      setStep(
        (current) =>
          current + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    /*
     * ÚLTIMA ETAPA.
     */
    await finishRegistration();
  };

  /*
   * =========================================================
   * PASSO ANTERIOR
   * =========================================================
   */
  const previousStep = () => {
    if (
      submitting ||
      verifyingOtp ||
      uploading
    ) {
      return;
    }

    setError("");
    setSuccess("");

    if (step > 0) {
      setStep(
        (current) =>
          current - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  /*
   * =========================================================
   * TELA DE CONFIRMAÇÃO DE E-MAIL
   * =========================================================
   */
  if (otpSent) {
    return (
      <PageShell>
        <div className="min-h-screen bg-background py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold">
                  Último passo
                </h1>

                <p className="text-sm text-muted-foreground mt-3">
                  Confirme seu e-mail para ativar seu painel profissional.
                </p>

                <p className="font-semibold mt-3 break-all">
                  {form.email}
                </p>

                <p className="text-xs text-muted-foreground mt-2">
                  Digite o código de confirmação recebido no seu e-mail.
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
                onSubmit={
                  verifyEmailCode
                }
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
                      const value =
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            8
                          );

                      setOtp(value);
                      setError("");
                    }}
                    placeholder="000000"
                    disabled={
                      verifyingOtp
                    }
                    className="w-full h-14 rounded-xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-[0.35em] outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    verifyingOtp ||
                    otp.length < 6 ||
                    otp.length > 8
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full gradient-brand text-white font-semibold shadow-soft disabled:opacity-50"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      Confirmar e abrir meu painel
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
                    onClick={
                      resendCode
                    }
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
                  if (
                    verifyingOtp ||
                    submitting
                  ) {
                    return;
                  }

                  setOtpSent(
                    false
                  );
                  setOtp("");
                  setError("");
                  setSuccess("");
                  setResendCooldown(
                    0
                  );
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

  const StepIcon =
    STEPS[step].icon;

  return (
    <PageShell>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* HEADER */}

          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
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

          {/* STEPPER */}

          <div className="mb-10">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map(
                (
                  item,
                  index
                ) => {
                  const Icon =
                    item.icon;

                  const active =
                    index ===
                    step;

                  const completed =
                    index <
                    step;

                  return (
                    <React.Fragment
                      key={
                        item.key
                      }
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            index <=
                            step
                          ) {
                            setError(
                              ""
                            );
                            setSuccess(
                              ""
                            );
                            setStep(
                              index
                            );

                            window.scrollTo(
                              {
                                top: 0,
                                behavior:
                                  "smooth",
                              }
                            );
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
                          {
                            item.title
                          }
                        </span>
                      </button>

                      {index <
                        STEPS.length -
                          1 && (
                        <div
                          className={`h-px flex-1 ${
                            index <
                            step
                              ? "bg-primary"
                              : "bg-border"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                }
              )}
            </div>
          </div>

          {/* CARD */}

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

            {/* CARD HEADER */}

            <div className="p-6 sm:p-8 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <StepIcon className="w-5 h-5" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold">
                    {
                      STEPS[step]
                        .title
                    }
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    Etapa{" "}
                    {step + 1}{" "}
                    de{" "}
                    {
                      STEPS.length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">

              {/* MENSAGENS */}

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

              {/* =====================================================
                  PASSO 0
              ====================================================== */}

              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Vamos começar
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Crie sua conta profissional para começar seu cadastro.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Nome completo
                      </label>

                      <input
                        type="text"
                        value={
                          form.name
                        }
                        onChange={(e) =>
                          updateForm(
                            "name",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Seu nome completo"
                        autoComplete="name"
                        disabled={
                          submitting
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        E-mail
                      </label>

                      <input
                        type="email"
                        value={
                          form.email
                        }
                        onChange={(e) =>
                          updateForm(
                            "email",
                            e.target.value
                          )
                        }
                        className="w-full h-11 rounded-lg border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="voce@email.com"
                        autoComplete="email"
                        disabled={
                          submitting ||
                          Boolean(
                            user
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Telefone
                      </label>

                      <input
                        type="tel"
                        value={
                          form.phone
                        }
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
                        autoComplete="tel"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        CPF
                      </label>

                      <input
                        type="text"
                        value={
                          form.cpf
                        }
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
                        inputMode="numeric"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Data de nascimento
                      </label>

                      <input
                        type="date"
                        value={
                          form.birthDate
                        }
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
