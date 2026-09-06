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
  ShieldCheck,
  Loader2,
  LogIn,
  Lock,
  Eye,
  EyeOff,
  Video,
  MapPin,
  Mail,
  RefreshCw,
  Edit3,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

const STEPS = [
  {
    id: "personal",
    label: "Pessoal",
    icon: User,
  },
  {
    id: "professional",
    label: "Registro profissional",
    icon: Briefcase,
  },
  {
    id: "approach",
    label: "Atuação",
    icon: Briefcase,
  },
  {
    id: "service",
    label: "Atendimento",
    icon: Calendar,
  },
  {
    id: "media",
    label: "Foto e vídeo",
    icon: Camera,
  },
  {
    id: "review",
    label: "Revisão",
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

const APPROACH_OPTIONS = [
  "Terapia Cognitivo-Comportamental (TCC)",
  "Psicanálise",
  "Gestalt-terapia",
  "Abordagem humanista",
  "Terapia sistêmica",
  "EMDR",
  "Terapia comportamental",
  "Outra",
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
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(
      2,
      6
    )}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(
    2,
    7
  )}-${digits.slice(7)}`;
}

function formatCpf(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(
      3,
      6
    )}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(
    3,
    6
  )}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getErrorMessage(error) {
  if (!error) {
    return "Ocorreu um erro. Tente novamente.";
  }

  return (
    error.message ||
    error.error_description ||
    "Ocorreu um erro. Tente novamente."
  );
}

function isRateLimitError(error) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("email rate limit")
  );
}

function isAlreadyRegisteredError(error) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("already registered") ||
    message.includes("user already registered") ||
    message.includes("already exists")
  );
}

function isValidCpf(value) {
  const cpf = value.replace(/\D/g, "");

  if (!cpf) {
    return true;
  }

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let remainder = (sum * 10) % 11;

  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(cpf[10]);
}

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  const [form, setForm] = useState(DEFAULT_FORM);

  const [user, setUser] = useState(null);

  /*
   * ID criado pelo Supabase.
   *
   * Pode existir mesmo quando ainda não existe
   * uma sessão por causa da confirmação de e-mail.
   */
  const [createdUserId, setCreatedUserId] = useState(null);

  /*
   * Arquivos ficam SOMENTE no navegador até
   * o e-mail ser confirmado.
   */
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * =====================================================
   * CARREGAR SESSÃO
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setCreatedUserId(session.user.id);

          setForm((current) => ({
            ...current,
            email:
              current.email ||
              session.user.email ||
              "",
            name:
              current.name ||
              session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name ||
              "",
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
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) {
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setCreatedUserId(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * =====================================================
   * LIMPAR PRÉVIAS LOCAIS
   * =====================================================
   */

  useEffect(() => {
    return () => {
      if (
        photoPreview &&
        photoPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    return () => {
      if (
        videoPreview &&
        videoPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  /*
   * =====================================================
   * CONTADOR DE REENVIO
   * =====================================================
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

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  /*
   * =====================================================
   * FORMULÁRIO
   * =====================================================
   */

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  function toggleArrayValue(field, value) {
    setForm((current) => {
      const exists = current[field].includes(value);

      return {
        ...current,
        [field]: exists
          ? current[field].filter(
              (item) => item !== value
            )
          : [...current[field], value],
      };
    });

    setError("");
  }

  /*
   * =====================================================
   * VALIDAÇÃO
   * =====================================================
   */

  function validateBirthDate() {
    if (!form.birthDate) {
      return true;
    }

    const birthDate = new Date(
      `${form.birthDate}T00:00:00`
    );

    const today = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      return false;
    }

    return birthDate <= today;
  }

  function validateStep(stepNumber) {
    setError("");

    if (stepNumber === 0) {
      if (!form.name.trim()) {
        return "Informe seu nome completo.";
      }

      if (!form.email.trim()) {
        return "Informe seu e-mail.";
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        return "Informe um e-mail válido.";
      }

      if (!isValidCpf(form.cpf)) {
        return "Informe um CPF válido.";
      }

      if (!validateBirthDate()) {
        return "Informe uma data de nascimento válida.";
      }

      /*
       * A senha só é necessária para uma nova conta.
       */
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

    if (stepNumber === 1) {
      if (!form.crp.trim()) {
        return "Informe seu número de CRP.";
      }

      if (!form.crpState) {
        return "Selecione o estado do CRP.";
      }

      if (!form.crpStatus) {
        return "Informe a situação do CRP.";
      }
    }

    if (stepNumber === 2) {
      if (!form.approach) {
        return "Selecione sua principal abordagem.";
      }

      if (form.audience.length === 0) {
        return "Selecione pelo menos um público atendido.";
      }

      if (form.themes.length === 0) {
        return "Selecione pelo menos uma área de atuação.";
      }
    }

    if (stepNumber === 3) {
      if (!form.online && !form.presencial) {
        return "Selecione pelo menos uma modalidade de atendimento.";
      }

      if (form.online && !form.ePsi) {
        return "Confirme que possui cadastro/autorização e-Psi para atendimento on-line.";
      }

      if (
        form.presencial &&
        !form.address.trim()
      ) {
        return "Informe o endereço para atendimento presencial.";
      }

      if (
        !form.sessionDuration ||
        Number(form.sessionDuration) <= 0
      ) {
        return "Informe a duração da sessão.";
      }

      if (
        !form.sessionPrice ||
        Number(form.sessionPrice) <= 0
      ) {
        return "Informe o valor da sessão.";
      }
    }

    if (stepNumber === 4) {
      /*
       * Agora verificamos o arquivo local,
       * e não uma URL do Storage.
       */
      if (!photoFile && !form.photoUrl) {
        return "Adicione uma foto profissional.";
      }

      if (
        form.presentation.trim().length >
        800
      ) {
        return "A apresentação deve ter no máximo 800 caracteres.";
      }
    }

    if (stepNumber === 5) {
      for (let i = 0; i < 5; i++) {
        const validation = validateStep(i);

        if (validation) {
          return validation;
        }
      }
    }

    return "";
  }

  /*
   * =====================================================
   * SELECIONAR FOTO
   *
   * NÃO FAZ UPLOAD.
   * =====================================================
   */

  function handlePhotoSelected(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "A foto deve estar em JPG, PNG ou WEBP."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "A foto deve ter no máximo 5 MB."
      );
      return;
    }

    setPhotoFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setPhotoPreview(previewUrl);

    /*
     * Não colocamos a URL no form porque
     * ainda não existe uma URL do Storage.
     */
    setForm((current) => ({
      ...current,
      photoUrl: "",
    }));

    setSuccess(
      "Foto selecionada. Ela será enviada após a confirmação do e-mail."
    );
  }

  /*
   * =====================================================
   * SELECIONAR VÍDEO
   *
   * NÃO FAZ UPLOAD.
   * =====================================================
   */

  function handleVideoSelected(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "O vídeo deve estar em MP4, WEBM ou MOV."
      );
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError(
        "O vídeo deve ter no máximo 100 MB."
      );
      return;
    }

    setVideoFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setVideoPreview(previewUrl);

    setForm((current) => ({
      ...current,
      videoUrl: "",
    }));

    setSuccess(
      "Vídeo selecionado. Ele será enviado após a confirmação do e-mail."
    );
  }

  /*
   * =====================================================
   * CRIAR CONTA
   *
   * ISSO SÓ ACONTECE NO FINAL.
   * =====================================================
   */

  async function createAccountAtFinalStep() {
    if (user?.id) {
      return user;
    }

    const email = normalizeEmail(form.email);

    const { data, error: signupError } =
      await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            full_name: form.name.trim(),
            role: "professional",
            user_type: "professional",
            account_type: "professional",
            profile_type: "professional",
          },
        },
      });

    if (signupError) {
      if (isRateLimitError(signupError)) {
        throw new Error(
          "Muitas tentativas de envio de e-mail. Aguarde alguns minutos e tente novamente."
        );
      }

      if (
        isAlreadyRegisteredError(
          signupError
        )
      ) {
        throw new Error(
          "Este e-mail já possui uma conta. Entre na sua conta para continuar."
        );
      }

      throw signupError;
    }

    if (!data?.user?.id) {
      throw new Error(
        "Não foi possível criar sua conta."
      );
    }

    setCreatedUserId(data.user.id);

    /*
     * Em um projeto com confirmação de e-mail
     * ativada, normalmente será null.
     *
     * Se houver sessão, significa que a confirmação
     * de e-mail está desativada ou não é exigida.
     */
    if (data.session?.user) {
      setUser(data.session.user);
      return data.session.user;
    }

    return data.user;
  }

  /*
   * =====================================================
   * REENVIAR CÓDIGO
   * =====================================================
   */

  async function resendCode() {
    if (resendCooldown > 0) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const email =
        normalizeEmail(form.email);

      const { error: resendError } =
        await supabase.auth.resend({
          type: "signup",
          email,
        });

      if (resendError) {
        if (
          isRateLimitError(resendError)
        ) {
          throw new Error(
            "Aguarde alguns instantes antes de solicitar outro código."
          );
        }

        throw resendError;
      }

      setOtp("");
      setResendCooldown(60);

      setSuccess(
        `Um novo código foi enviado para ${email}.`
      );
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * =====================================================
   * UPLOAD APÓS CONFIRMAÇÃO
   * =====================================================
   */

  async function uploadFileToStorage(
    file,
    type,
    userId
  ) {
    if (!file) {
      return null;
    }

    if (!userId) {
      throw new Error(
        "Usuário não identificado para o upload."
      );
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      (type === "photo" ? "jpg" : "mp4");

    const randomId =
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    const bucket =
      type === "photo"
        ? "avatars"
        : "videos";

    const path =
      `professionals/${userId}/${randomId}.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    if (!publicData?.publicUrl) {
      throw new Error(
        "Não foi possível obter o endereço do arquivo."
      );
    }

    return publicData.publicUrl;
  }

  /*
   * =====================================================
   * SALVAR METADADOS DO AUTH
   *
   * Só depois da confirmação.
   * =====================================================
   */

  async function updateProfessionalMetadata() {
    const { data, error: userError } =
      await supabase.auth.getUser();

    if (userError || !data?.user) {
      throw new Error(
        "A sessão do usuário não está disponível."
      );
    }

    const { error: metadataError } =
      await supabase.auth.updateUser({
        data: {
          name: form.name.trim(),
          full_name: form.name.trim(),
          role: "professional",
          user_type: "professional",
          account_type: "professional",
          profile_type: "professional",
        },
      });

    if (metadataError) {
      throw metadataError;
    }
  }

  /*
   * =====================================================
   * SALVAR PSICÓLOGO
   *
   * Só acontece depois da confirmação.
   * =====================================================
   */

  async function saveProfessional(
    userId,
    photoUrl,
    videoUrl
  ) {
    if (!userId) {
      throw new Error(
        "Não foi possível identificar o usuário."
      );
    }

    const modalities = [];

    if (form.online) {
      modalities.push("online");
    }

    if (form.presencial) {
      modalities.push("presencial");
    }

    const professionalData = {
      user_id: userId,

      professional_name:
        form.name.trim(),

      cpf: form.cpf
        ? form.cpf.replace(/\D/g, "")
        : null,

      birth_date:
        form.birthDate || null,

      crp_number:
        form.crp.trim(),

      crp_region:
        form.crpState,

      education: null,

      institution: null,

      graduation_year: null,

      specializations: form.themes,

      approaches: form.approach
        ? [form.approach.trim()]
        : [],

      experience: null,

      topics: form.themes,

      modalities,

      languages: [
        "Português",
      ],

      audience: form.audience,

      city: form.city.trim(),

      state: form.state
        .trim()
        .toUpperCase(),

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
        form.presencial &&
        form.address.trim()
          ? form.address.trim()
          : null,

      bio:
        form.presentation.trim() || null,

      profile_photo_url:
        photoUrl || null,

      presentation_video_url:
        videoUrl || null,

      presentation_video_status:
        videoUrl
          ? "pending"
          : null,

      verification_status:
        "pending",

      public_profile:
        false,
    };

    const {
      data: existing,
      error: findError,
    } = await supabase
      .from("psychologists")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existing?.id) {
      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from("psychologists")
        .update(professionalData)
        .eq("id", existing.id)
        .select("id")
        .single();

      if (updateError) {
        throw updateError;
      }

      if (!updated?.id) {
        throw new Error("O perfil profissional não pôde ser atualizado.");
      }

      return updated.id;
    }

    const {
      data: inserted,
      error: insertError,
    } = await supabase
      .from("psychologists")
      .insert(professionalData)
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    if (!inserted?.id) {
      throw new Error("O perfil profissional não foi criado.");
    }

    return inserted.id;
  }

  /*
   * =====================================================
   * FINALIZAR CADASTRO
   *
   * AQUI:
   *
   * 1. valida tudo
   * 2. cria a conta
   * 3. envia confirmação automaticamente pelo signUp
   * 4. NÃO faz upload
   * 5. NÃO salva psychologists
   * 6. mostra tela do código
   * =====================================================
   */

  async function finishRegistration() {
    const validation =
      validateStep(5);

    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Se já existe sessão, podemos concluir.
       */
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setCreatedUserId(
          session.user.id
        );

        await completeAfterConfirmation(
          session.user
        );

        return;
      }

      /*
       * Cria a conta somente agora.
       */
      const createdUser =
        await createAccountAtFinalStep();

      /*
       * Se o Supabase já retornou uma sessão,
       * podemos concluir diretamente.
       *
       * Com "Confirm email" ativado isso normalmente
       * NÃO acontecerá.
       */
      if (createdUser?.id) {
        const {
          data: {
            session: newSession,
          },
        } = await supabase.auth.getSession();

        if (newSession?.user) {
          await completeAfterConfirmation(
            newSession.user
          );

          return;
        }
      }

      /*
       * Sem sessão:
       * aguardamos a confirmação do e-mail.
       *
       * O signUp já enviou o e-mail.
       */
      setOtp("");
      setResendCooldown(60);

      setSuccess(
        `Enviamos um código de confirmação para ${normalizeEmail(
          form.email
        )}.`
      );

      setStep(STEPS.length);
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * =====================================================
   * CONCLUIR DEPOIS DA CONFIRMAÇÃO
   *
   * Aqui já existe sessão.
   * =====================================================
   */

  async function completeAfterConfirmation(
    confirmedUser
  ) {
    if (!confirmedUser?.id) {
      throw new Error(
        "Usuário não identificado após a confirmação."
      );
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Garantimos que existe sessão.
       */
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error(
          "A sessão ainda não foi criada. Tente confirmar o e-mail novamente."
        );
      }

      const userId =
        session.user.id;

      setUser(session.user);
      setCreatedUserId(userId);

      /*
       * 1. Atualiza metadados.
       */
      await updateProfessionalMetadata();

      /*
       * 2. Faz upload da FOTO.
       *
       * Agora existe sessão, portanto o Storage
       * pode autorizar o upload.
       */
      let photoUrl =
        form.photoUrl || null;

      if (photoFile) {
        photoUrl =
          await uploadFileToStorage(
            photoFile,
            "photo",
            userId
          );
      }

      /*
       * 3. Faz upload do VÍDEO.
       */
      let videoUrl =
        form.videoUrl || null;

      if (videoFile) {
        videoUrl =
          await uploadFileToStorage(
            videoFile,
            "video",
            userId
          );
      }

      /*
       * 4. Salva o perfil no banco.
       */
      await saveProfessional(
        userId,
        photoUrl,
        videoUrl
      );

      /*
       * 5. Atualiza o estado local.
       */
      setForm((current) => ({
        ...current,
        photoUrl: photoUrl || "",
        videoUrl: videoUrl || "",
      }));

      setPhotoFile(null);
      setVideoFile(null);

      setSuccess(
        "Cadastro concluído com sucesso! Redirecionando..."
      );

      /*
       * 6. Painel profissional.
       */
      window.setTimeout(() => {
        navigate(
          "/painel-profissional",
          {
            replace: true,
          }
        );
      }, 1000);
    } finally {
      setUploading(false);
    }
  }

  /*
   * =====================================================
   * CONFIRMAR E-MAIL
   * =====================================================
   */

  async function verifyEmailCode() {
    const code =
      otp.replace(/\D/g, "");

    if (code.length < 6) {
      setError(
        "Digite o código de confirmação recebido por e-mail."
      );
      return;
    }

    setVerifyingOtp(true);
    setError("");
    setSuccess("");

    try {
      const email =
        normalizeEmail(form.email);

      /*
       * CORRETO PARA SIGNUP:
       *
       * type: "signup"
       */
      const {
        data,
        error: verifyError,
      } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (verifyError) {
        const message =
          getErrorMessage(
            verifyError
          ).toLowerCase();

        if (
          message.includes("expired") ||
          message.includes("invalid")
        ) {
          throw new Error(
            "Código inválido ou expirado. Solicite um novo código."
          );
        }

        throw verifyError;
      }

      if (!data?.user) {
        throw new Error(
          "O e-mail não pôde ser confirmado."
        );
      }

      /*
       * Depois do verifyOtp deve existir uma sessão.
       */
      const {
        data: {
          session,
        },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error(
          "O e-mail foi confirmado, mas a sessão não foi criada. Verifique a configuração de autenticação do Supabase."
        );
      }

      setUser(session.user);
      setCreatedUserId(
        session.user.id
      );

      /*
       * AGORA:
       *
       * upload da foto
       * upload do vídeo
       * salvar psychologists
       */
      await completeAfterConfirmation(
        session.user
      );
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setVerifyingOtp(false);
    }
  }

  /*
   * =====================================================
   * NAVEGAÇÃO
   * =====================================================
   */

  async function nextStep() {
    if (
      submitting ||
      uploading ||
      verifyingOtp
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const validation =
      validateStep(step);

    if (validation) {
      setError(validation);
      return;
    }

    /*
     * NÃO CRIA MAIS A CONTA NO PASSO 0.
     */
    if (
      step === STEPS.length - 1
    ) {
      await finishRegistration();
      return;
    }

    setStep(
      (current) => current + 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function previousStep() {
    if (
      submitting ||
      uploading ||
      verifyingOtp ||
      step <= 0
    ) {
      return;
    }

    setError("");
    setSuccess("");

    setStep(
      (current) => current - 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goToStep(index) {
    if (
      submitting ||
      uploading ||
      verifyingOtp
    ) {
      return;
    }

    if (index <= step) {
      setError("");
      setSuccess("");
      setStep(index);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function maskedCpf() {
    const digits =
      form.cpf.replace(
        /\D/g,
        ""
      );

    if (digits.length !== 11) {
      return (
        form.cpf ||
        "Não informado"
      );
    }

    return `***.***.${digits.slice(
      6,
      9
    )}-${digits.slice(9)}`;
  }

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin" />

            <span>
              Carregando...
            </span>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * =====================================================
   * CONFIRMAÇÃO DO E-MAIL
   * =====================================================
   */

  if (step === STEPS.length) {
    return (
      <PageShell>
        <div className="min-h-screen bg-slate-50 py-10 px-4">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                  Confirme seu e-mail
                </h1>

                <p className="mt-3 text-slate-600 leading-relaxed">
                  Seu cadastro foi
                  preenchido. Agora falta
                  apenas confirmar seu
                  endereço de e-mail.
                </p>

                <p className="mt-3 font-semibold text-slate-900 break-all">
                  {form.email}
                </p>
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Código de confirmação
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => {
                    const value =
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(0, 8);

                    setOtp(value);
                    setError("");
                  }}
                  placeholder="Digite o código"
                  className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                  {success}
                </div>
              )}

              <button
                type="button"
                onClick={
                  verifyEmailCode
                }
                disabled={
                  verifyingOtp ||
                  uploading ||
                  otp.replace(
                    /\D/g,
                    ""
                  ).length < 6
                }
                className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingOtp ||
                uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />

                    {uploading
                      ? "Finalizando cadastro..."
                      : "Confirmando..."}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />

                    Confirmar e-mail
                  </>
                )}
              </button>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={
                    resendCode
                  }
                  disabled={
                    submitting ||
                    verifyingOtp ||
                    uploading ||
                    resendCooldown > 0
                  }
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                >
                  <RefreshCw className="w-4 h-4" />

                  {resendCooldown >
                  0
                    ? `Enviar novamente em ${resendCooldown}s`
                    : "Não recebi o código"}
                </button>
              </div>

              <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm text-slate-600 text-center">
                  Verifique também a
                  pasta de spam, lixo
                  eletrônico ou promoções.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * =====================================================
   * CADASTRO PRINCIPAL
   * =====================================================
   */

  return (
    <PageShell>
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* CABEÇALHO */}

          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Cadastro profissional
                </h1>

                <p className="mt-2 text-slate-600">
                  Preencha seus dados para
                  criar seu perfil profissional.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/login"
                  )
                }
                className="hidden md:inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogIn className="w-4 h-4" />

                Já tenho uma conta
              </button>
            </div>
          </div>

          {/* STEPPER */}

          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 mb-6 overflow-x-auto">
            <div className="flex min-w-[700px] items-center">
              {STEPS.map(
                (item, index) => {
                  const Icon =
                    item.icon;

                  const active =
                    index === step;

                  const completed =
                    index < step;

                  return (
                    <React.Fragment
                      key={item.id}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          goToStep(
                            index
                          )
                        }
                        disabled={
                          index > step
                        }
                        className="flex items-center gap-2 group disabled:cursor-default"
                      >
                        <div
                          className={[
                            "w-9 h-9 rounded-full flex items-center justify-center border-2 transition",
                            completed
                              ? "bg-blue-600 border-blue-600 text-white"
                              : active
                              ? "border-blue-600 text-blue-600 bg-blue-50"
                              : "border-slate-300 text-slate-400",
                          ].join(
                            " "
                          )}
                        >
                          {completed ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>

                        <span
                          className={[
                            "hidden lg:block text-sm font-medium whitespace-nowrap",
                            active ||
                            completed
                              ? "text-slate-900"
                              : "text-slate-400",
                          ].join(
                            " "
                          )}
                        >
                          {item.label}
                        </span>
                      </button>

                      {index <
                        STEPS.length -
                          1 && (
                        <div
                          className={[
                            "h-px flex-1 mx-3",
                            index < step
                              ? "bg-blue-600"
                              : "bg-slate-200",
                          ].join(
                            " "
                          )}
                        />
                      )}
                    </React.Fragment>
                  );
                }
              )}
            </div>
          </div>

          {/* MENSAGENS */}

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* CARD PRINCIPAL */}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="p-6 md:p-8">

              {/* PASSO 0 */}

              {step === 0 && (
                <div>
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-slate-900">
                      Dados pessoais
                    </h2>

                    <p className="mt-1 text-slate-500">
                      Informe seus dados básicos.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome completo *
                      </label>

                      <input
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                          updateForm(
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Seu nome completo"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        E-mail *
                      </label>

                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateForm(
                            "email",
                            event.target.value
                          )
                        }
                        disabled={
                          Boolean(user)
                        }
                        placeholder="seu@email.com"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Telefone
                      </label>

                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          updateForm(
                            "phone",
                            formatPhone(
                              event.target
                                .value
                            )
                          )
                        }
                        placeholder="(00) 00000-0000"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CPF
                      </label>

                      <input
                        type="text"
                        value={form.cpf}
                        onChange={(event) =>
                          updateForm(
                            "cpf",
                            formatCpf(
                              event.target
                                .value
                            )
                          )
                        }
                        placeholder="000.000.000-00"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Data de nascimento
                      </label>

                      <input
                        type="date"
                        value={
                          form.birthDate
                        }
                        onChange={(event) =>
                          updateForm(
                            "birthDate",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {!user && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Senha *
                          </label>

                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                            <input
                              type={
                                showPassword
                                  ? "text"
                                  : "password"
                              }
                              value={
                                form.password
                              }
                              onChange={(
                                event
                              ) =>
                                updateForm(
                                  "password",
                                  event.target
                                    .value
                                )
                              }
                              placeholder="Mínimo de 6 caracteres"
                              className="w-full rounded-xl border border-slate-300 pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword(
                                  (value) =>
                                    !value
                                )
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Confirmar senha *
                          </label>

                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                            <input
                              type={
                                showConfirmPassword
                                  ? "text"
                                  : "password"
                              }
                              value={
                                form.confirmPassword
                              }
                              onChange={(
                                event
                              ) =>
                                updateForm(
                                  "confirmPassword",
                                  event.target
                                    .value
                                )
                              }
                              placeholder="Repita sua senha"
                              className="w-full rounded-xl border border-slate-300 pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(
                                  (value) =>
                                    !value
                                )
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cidade *
                      </label>

                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                        <input
                          type="text"
                          value={
                            form.city
                          }
                          onChange={(event) =>
                            updateForm(
                              "city",
                              event.target
                                .value
                            )
                          }
                          placeholder="Sua cidade"
                          className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estado *
                      </label>

                      <select
                        value={
                          form.state
                        }
                        onChange={(event) =>
                          updateForm(
                            "state",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* PASSO 1 */}

              {step === 1 && (
                <div>
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-slate-900">
                      Registro profissional
                    </h2>

                    <p className="mt-1 text-slate-500">
                      Informe os dados do seu
                      registro profissional.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Número do CRP *
                      </label>

                      <input
                        type="text"
                        value={form.crp}
                        onChange={(event) =>
                          updateForm(
                            "crp",
                            event.target
                              .value
                          )
                        }
                        placeholder="Ex.: 06/123456"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Região do CRP *
                      </label>

                      <select
                        value={
                          form.crpState
                        }
                        onChange={(event) =>
                          updateForm(
                            "crpState",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Situação do CRP *
                      </label>

                      <select
                        value={
                          form.crpStatus
                        }
                        onChange={(event) =>
                          updateForm(
                            "crpStatus",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ativo">
                          Ativo
                        </option>

                        <option value="regular">
                          Regular
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <p className="text-sm text-blue-800">
                      Os dados profissionais
                      poderão passar por análise
                      antes da publicação do perfil.
                    </p>
                  </div>
                </div>
              )}

              {/* PASSO 2 */}

              {step === 2 && (
                <div>
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-slate-900">
                      Sua atuação
                    </h2>

                    <p className="mt-1 text-slate-500">
                      Conte aos pacientes com quais
                      públicos e temas você trabalha.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Principal abordagem *
                    </label>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {APPROACH_OPTIONS.map(
                        (approach) => {
                          const selected =
                            form.approach ===
                            approach;

                          return (
                            <button
                              type="button"
                              key={
                                approach
                              }
                              onClick={() =>
                                updateForm(
                                  "approach",
                                  approach
                                )
                              }
                              className={[
                                "text-left rounded-xl border px-4 py-3 transition",
                                selected
                                  ? "border-blue-600 bg-blue-50 text-blue-800"
                                  : "border-slate-200 hover:border-slate-300",
                              ].join(
                                " "
                              )}
                            >
                              {approach}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="mt-7">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Público atendido *
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {AUDIENCE_OPTIONS.map(
                        (item) => {
                          const selected =
                            form.audience.includes(
                              item
                            );

                          return (
                            <button
                              type="button"
                              key={item}
                              onClick={() =>
                                toggleArrayValue(
                                  "audience",
                                  item
                                )
                              }
                              className={[
                                "rounded-full px-4 py-2 text-sm border transition",
                                selected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-300 text-slate-700 hover:border-blue-400",
                              ].join(
                                " "
                              )}
                            >
                              {item}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="mt-7">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Principais temas de atuação *
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {THEME_OPTIONS.map(
                        (item) => {
                          const selected =
                            form.themes.includes(
                              item
                            );

                          return (
                            <button
                              type="button"
                              key={item}
                              onClick={() =>
                                toggleArrayValue(
                                  "themes",
                                  item
                                )
                              }
                              className={[
                                "rounded-full px-4 py-2 text-sm border transition",
                                selected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-300 text-slate-700 hover:border-blue-400",
                              ].join(
                                " "
                              )}
                            >
                              {item}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3 */}

              {step === 3 && (
                <div>
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-slate-900">
                      Atendimento
                    </h2>

                    <p className="mt-1 text-slate-500">
                      Configure como você atende.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "online",
                          !form.online
                        )
                      }
                      className={[
                        "text-left rounded-2xl border p-5 transition",
                        form.online
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200",
                      ].join(
                        " "
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Atendimento
                            on-line
                          </h3>

                          <p className="text-sm text-slate-500 mt-1">
                            Atenda seus pacientes
                            por videochamada.
                          </p>
                        </div>

                        <div
                          className={[
                            "w-6 h-6 rounded-full border flex items-center justify-center",
                            form.online
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300",
                          ].join(
                            " "
                          )}
                        >
                          {form.online && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "presencial",
                          !form.presencial
                        )
                      }
                      className={[
                        "text-left rounded-2xl border p-5 transition",
                        form.presencial
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200",
                      ].join(
                        " "
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Atendimento
                            presencial
                          </h3>

                          <p className="text-sm text-slate-500 mt-1">
                            Atenda em consultório.
                          </p>
                        </div>

                        <div
                          className={[
                            "w-6 h-6 rounded-full border flex items-center justify-center",
                            form.presencial
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300",
                          ].join(
                            " "
                          )}
                        >
                          {form.presencial && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  {form.online && (
                    <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          form.ePsi
                        }
                        onChange={(event) =>
                          updateForm(
                            "ePsi",
                            event.target
                              .checked
                          )
                        }
                        className="mt-1 w-4 h-4"
                      />

                      <span>
                        <span className="block font-medium text-slate-800">
                          Cadastro/autorização
                          e-Psi
                        </span>

                        <span className="block text-sm text-slate-500 mt-1">
                          Confirmo que possuo
                          a autorização
                          necessária para
                          atendimento
                          psicológico
                          on-line.
                        </span>
                      </span>
                    </label>
                  )}

                  {form.presencial && (
                    <div className="mt-5">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Endereço de atendimento *
                      </label>

                      <input
                        type="text"
                        value={
                          form.address
                        }
                        onChange={(event) =>
                          updateForm(
                            "address",
                            event.target
                              .value
                          )
                        }
                        placeholder="Rua, número, bairro..."
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5 mt-6">

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Duração da sessão *
                      </label>

                      <select
                        value={
                          form.sessionDuration
                        }
                        onChange={(event) =>
                          updateForm(
                            "sessionDuration",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="30">
                          30 minutos
                        </option>

                        <option value="40">
                          40 minutos
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
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Valor da sessão *
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          R$
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.sessionPrice
                          }
                          onChange={(event) =>
                            updateForm(
                              "sessionPrice",
                              event.target
                                .value
                            )
                          }
                          placeholder="0,00"
                          className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 4 */}

              {step === 4 && (
                <div>
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-slate-900">
                      Foto e apresentação
                    </h2>

                    <p className="mt-1 text-slate-500">
                      Apresente-se aos pacientes.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">

                    {/* FOTO */}

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-blue-600" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Foto profissional *
                          </h3>

                          <p className="text-sm text-slate-500">
                            JPG, PNG ou WEBP —
                            até 5 MB
                          </p>
                        </div>
                      </div>

                      {photoPreview ||
                      form.photoUrl ? (
                        <div>
                          <div className="aspect-square max-w-xs mx-auto overflow-hidden rounded-2xl bg-slate-100">
                            <img
                              src={
                                photoPreview ||
                                form.photoUrl
                              }
                              alt="Foto profissional"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <label className="mt-4 w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                            <Camera className="w-4 h-4" />

                            Alterar foto

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={
                                handlePhotoSelected
                              }
                            />
                          </label>

                          {photoFile && (
                            <p className="mt-2 text-xs text-center text-slate-500">
                              Foto selecionada. O
                              envio ocorrerá após
                              confirmar o e-mail.
                            </p>
                          )}
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-blue-400 hover:bg-blue-50/30 transition">
                            <Camera className="w-10 h-10 mx-auto text-slate-400" />

                            <p className="mt-3 font-medium text-slate-700">
                              Clique para
                              adicionar sua
                              foto
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Escolha uma foto
                              profissional
                            </p>
                          </div>

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={
                              handlePhotoSelected
                            }
                          />
                        </label>
                      )}
                    </div>

                    {/* VÍDEO */}

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                          <Video className="w-5 h-5 text-purple-600" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Vídeo de apresentação
                          </h3>

                          <p className="text-sm text-slate-500">
                            Opcional — até
                            100 MB
                          </p>
                        </div>
                      </div>

                      {videoPreview ||
                      form.videoUrl ? (
                        <div>
                          <video
                            src={
                              videoPreview ||
                              form.videoUrl
                            }
                            controls
                            className="w-full aspect-video rounded-xl bg-black"
                          />

                          <label className="mt-4 w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                            <Video className="w-4 h-4" />

                            Alterar vídeo

                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="hidden"
                              onChange={
                                handleVideoSelected
                              }
                            />
                          </label>

                          {videoFile && (
                            <p className="mt-2 text-xs text-center text-slate-500">
                              Vídeo selecionado. O
                              envio ocorrerá após
                              confirmar o e-mail.
                            </p>
                          )}
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-purple-400 hover:bg-purple-50/30 transition">
                            <Video className="w-10 h-10 mx-auto text-slate-400" />

                            <p className="mt-3 font-medium text-slate-700">
                              Adicionar vídeo
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Mostre um pouco
                              sobre seu
                              trabalho
                            </p>
                          </div>

                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={
                              handleVideoSelected
                            }
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Apresentação profissional
                      </label>

                      <span
                        className={[
                          "text-xs",
                          form.presentation
                            .length >
                          800
                            ? "text-red-600"
                            : "text-slate-400",
                        ].join(
                          " "
                        )}
                      >
                        {
                          form.presentation
                            .length
                        }
                        /800
                      </span>
                    </div>

                    <textarea
                      value={
                        form.presentation
                      }
                      onChange={(event) =>
                        updateForm(
                          "presentation",
                          event.target
                            .value
                        )
                      }
                      maxLength={800}
                      rows={6}
                      placeholder="Conte brevemente sobre sua experiência, sua forma de trabalho e como pode ajudar seus pacientes."
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* PASSO 5 - REVISÃO */}

              {step === 5 && (
                <div>
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-slate-900">
                      Revise seu cadastro
                    </h2>

                    <p className="mt-1 text-slate-500">
                      Confira todas as informações
                      antes de finalizar.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <ReviewSection
                      title="Dados pessoais"
                      onEdit={() =>
                        goToStep(0)
                      }
                    >
                      <ReviewItem
                        label="Nome"
                        value={
                          form.name
                        }
                      />

                      <ReviewItem
                        label="E-mail"
                        value={
                          form.email
                        }
                      />

                      <ReviewItem
                        label="Telefone"
                        value={
                          form.phone ||
                          "Não informado"
                        }
                      />

                      <ReviewItem
                        label="CPF"
                        value={
                          maskedCpf()
                        }
                      />

                      <ReviewItem
                        label="Data de nascimento"
                        value={
                          form.birthDate ||
                          "Não informado"
                        }
                      />

                      <ReviewItem
                        label="Cidade"
                        value={`${form.city}${
                          form.state
                            ? ` - ${form.state}`
                            : ""
                        }`}
                      />
                    </ReviewSection>

                    <ReviewSection
                      title="Registro profissional"
                      onEdit={() =>
                        goToStep(1)
                      }
                    >
                      <ReviewItem
                        label="CRP"
                        value={
                          form.crp
                        }
                      />

                      <ReviewItem
                        label="Região"
                        value={
                          form.crpState
                        }
                      />

                      <ReviewItem
                        label="Situação"
                        value={
                          form.crpStatus
                        }
                      />
                    </ReviewSection>

                    <ReviewSection
                      title="Atuação"
                      onEdit={() =>
                        goToStep(2)
                      }
                    >
                      <ReviewItem
                        label="Abordagem"
                        value={
                          form.approach
                        }
                      />

                      <ReviewItem
                        label="Público"
                        value={
                          form.audience.join(
                            ", "
                          )
                        }
                      />

                      <ReviewItem
                        label="Temas"
                        value={
                          form.themes.join(
                            ", "
                          )
                        }
                      />
                    </ReviewSection>

                    <ReviewSection
                      title="Atendimento"
                      onEdit={() =>
                        goToStep(3)
                      }
                    >
                      <ReviewItem
                        label="Modalidade"
                        value={[
                          form.online
                            ? "On-line"
                            : null,
                          form.presencial
                            ? "Presencial"
                            : null,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            ", "
                          )}
                      />

                      <ReviewItem
                        label="e-Psi"
                        value={
                          form.online
                            ? form.ePsi
                              ? "Confirmado"
                              : "Não confirmado"
                            : "Não se aplica"
                        }
                      />

                      {form.presencial && (
                        <ReviewItem
                          label="Endereço"
                          value={
                            form.address
                          }
                        />
                      )}

                      <ReviewItem
                        label="Duração"
                        value={`${form.sessionDuration} minutos`}
                      />

                      <ReviewItem
                        label="Valor"
                        value={
                          form.sessionPrice
                            ? `R$ ${Number(
                                form.sessionPrice
                              )
                                .toFixed(
                                  2
                                )
                                .replace(
                                  ".",
                                  ","
                                )}`
                            : "Não informado"
                        }
                      />
                    </ReviewSection>

                    <ReviewSection
                      title="Foto e apresentação"
                      onEdit={() =>
                        goToStep(4)
                      }
                    >
                      <div className="md:col-span-2 flex items-center gap-4">

                        {photoPreview ||
                        form.photoUrl ? (
                          <img
                            src={
                              photoPreview ||
                              form.photoUrl
                            }
                            alt="Foto profissional"
                            className="w-20 h-20 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-slate-400" />
                          </div>
                        )}

                        <div>
                          <p className="font-medium text-slate-800">
                            Foto profissional
                          </p>

                          <p className="text-sm text-slate-500">
                            {photoFile ||
                            form.photoUrl
                              ? "Selecionada"
                              : "Não adicionada"}
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            Vídeo:{" "}
                            {videoFile ||
                            form.videoUrl
                              ? "Selecionado"
                              : "Não adicionado"}
                          </p>
                        </div>
                      </div>

                      {form.presentation && (
                        <div className="md:col-span-2 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                            Apresentação
                          </p>

                          <p className="text-sm text-slate-700 whitespace-pre-line">
                            {
                              form.presentation
                            }
                          </p>
                        </div>
                      )}
                    </ReviewSection>
                  </div>

                  <div className="mt-7 rounded-2xl bg-blue-50 border border-blue-100 p-5">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                      <div>
                        <h3 className="font-semibold text-blue-900">
                          Seu cadastro está pronto!
                        </h3>

                        <p className="mt-1 text-sm text-blue-800 leading-relaxed">
                          Ao clicar em
                          <strong>
                            {" "}
                            "Finalizar cadastro"
                          </strong>
                          , criaremos sua conta
                          e enviaremos um código
                          de confirmação para seu
                          e-mail.
                        </p>

                        <p className="mt-2 text-sm text-blue-800 leading-relaxed">
                          A confirmação do
                          e-mail será a última
                          etapa antes do acesso
                          ao painel. Após a
                          confirmação, sua foto,
                          vídeo e demais dados
                          serão enviados e salvos
                          no seu perfil profissional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RODAPÉ */}

            <div className="border-t border-slate-200 px-6 md:px-8 py-5 flex items-center justify-between gap-4">

              <button
                type="button"
                onClick={
                  previousStep
                }
                disabled={
                  step === 0 ||
                  submitting ||
                  uploading ||
                  verifyingOtp
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />

                Voltar
              </button>

              <div className="text-sm text-slate-400">
                Etapa {step + 1} de{" "}
                {STEPS.length}
              </div>

              <button
                type="button"
                onClick={
                  nextStep
                }
                disabled={
                  submitting ||
                  uploading ||
                  verifyingOtp
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />

                    {step === 5
                      ? "Criando conta..."
                      : "Processando..."}
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />

                    Enviando arquivos...
                  </>
                ) : step === 5 ? (
                  <>
                    Finalizar cadastro

                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continuar

                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Seus dados serão utilizados para
            criação e gerenciamento do seu perfil
            profissional.
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/*
 * =========================================================
 * COMPONENTES AUXILIARES
 * =========================================================
 */

function ReviewSection({
  title,
  onEdit,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between gap-4 bg-slate-50 px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Edit3 className="w-4 h-4" />

          Editar
        </button>
      </div>

      <div className="p-5 grid md:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  );
}

function ReviewItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-800 break-words">
        {value || "Não informado"}
      </p>
    </div>
  );
}
