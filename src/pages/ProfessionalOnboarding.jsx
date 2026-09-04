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
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
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
  { key: "professional", label: "Profissional", icon: Briefcase },
  { key: "service", label: "Atendimento", icon: Calendar },
  { key: "photo", label: "Foto", icon: Camera },
  { key: "video", label: "Vídeo", icon: Video },
  { key: "review", label: "Revisão", icon: ShieldCheck },
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
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (message.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  if (message.includes("user already registered")) {
    return "Este e-mail já possui uma conta. Use a opção Entrar.";
  }

  if (message.includes("password")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  if (message.includes("duplicate")) {
    return "Este cadastro já existe.";
  }

  return error?.message || "Não foi possível concluir a operação.";
}

function makeFileName(file) {
  const extension =
    file.name?.split(".").pop()?.toLowerCase() || "file";

  const randomId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${randomId}.${extension}`;
}

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState(DEFAULTS);

  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("register");
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticated = Boolean(authenticatedUser?.id);

  const displayName = useMemo(() => {
    return (
      data.professional_name ||
      data.full_name ||
      authenticatedUser?.user_metadata?.full_name ||
      authenticatedUser?.user_metadata?.name ||
      "Profissional"
    );
  }, [data, authenticatedUser]);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        setAuthLoading(true);

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error(
            "EntreNós: erro ao recuperar sessão:",
            sessionError
          );

          setAuthenticatedUser(null);
          setAuthLoading(false);
          return;
        }

        const currentUser =
          sessionData?.session?.user || null;

        if (currentUser) {
          setAuthenticatedUser(currentUser);

          setData((current) => ({
            ...current,
            email:
              current.email ||
              currentUser.email ||
              "",
            full_name:
              current.full_name ||
              currentUser.user_metadata?.full_name ||
              currentUser.user_metadata?.name ||
              "",
          }));
        } else {
          setAuthenticatedUser(null);
        }
      } catch (err) {
        console.error(
          "EntreNós: erro ao carregar sessão:",
          err
        );

        if (mounted) {
          setAuthenticatedUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        const currentUser =
          session?.user || null;

        if (
          currentUser &&
          (
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          )
        ) {
          setAuthenticatedUser(currentUser);

          setData((current) => ({
            ...current,
            email:
              current.email ||
              currentUser.email ||
              "",
            full_name:
              current.full_name ||
              currentUser.user_metadata?.full_name ||
              currentUser.user_metadata?.name ||
              "",
          }));

          setError("");
          setAuthLoading(false);
        }

        if (event === "SIGNED_OUT") {
          setAuthenticatedUser(null);
          setAuthLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const set = (key, value) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const authenticateProfessional = async () => {
    setError("");

    if (!authEmail.trim()) {
      setError("Informe seu e-mail profissional.");
      return;
    }

    if (!authPassword) {
      setError("Informe sua senha.");
      return;
    }

    if (authPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (
      authMode === "register" &&
      !authName.trim()
    ) {
      setError("Informe seu nome completo.");
      return;
    }

    setAuthSubmitting(true);

    try {
      if (authMode === "register") {
        const {
          data: signUpData,
          error: signUpError,
        } = await supabase.auth.signUp({
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
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

        const newUser =
          signUpData?.user || null;

        setData((current) => ({
          ...current,
          full_name:
            current.full_name ||
            authName.trim(),
          email:
            current.email ||
            authEmail.trim().toLowerCase(),
        }));

        if (signUpData?.session?.user) {
          setAuthenticatedUser(
            signUpData.session.user
          );

          setStep(0);
          setError("");

          return;
        }

        if (newUser && !signUpData?.session) {
          setConfirmationSent(true);
          setError("");

          return;
        }

        throw new Error(
          "A conta foi criada, mas não foi possível iniciar a sessão."
        );
      }

      const {
        data: loginData,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: authEmail.trim().toLowerCase(),
        password: authPassword,
      });

      if (loginError) {
        throw loginError;
      }

      if (!loginData?.user) {
        throw new Error(
          "Não foi possível iniciar a sessão."
        );
      }

      setAuthenticatedUser(
        loginData.user
      );

      setData((current) => ({
        ...current,
        email:
          current.email ||
          loginData.user.email ||
          "",
        full_name:
          current.full_name ||
          loginData.user.user_metadata?.full_name ||
          loginData.user.user_metadata?.name ||
          "",
      }));

      setError("");
    } catch (err) {
      console.error(
        "EntreNós: erro na autenticação profissional:",
        err
      );

      setError(getFriendlyError(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const resendConfirmation = async () => {
    if (!authEmail.trim()) {
      setError("Informe seu e-mail.");
      return;
    }

    setAuthSubmitting(true);
    setError("");

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

      setError(
        "E-mail de confirmação reenviado. Verifique sua caixa de entrada."
      );
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const logoutProfessional = async () => {
    await supabase.auth.signOut();

    setAuthenticatedUser(null);
    setConfirmationSent(false);
    setStep(0);
    setData(DEFAULTS);
  };

  const validate = () => {
    if (step === 0) {
      return Boolean(
        data.full_name?.trim() &&
        data.email?.trim() &&
        data.city?.trim() &&
        data.state?.trim() &&
        data.state.trim().length === 2
      );
    }

    if (step === 1) {
      return Boolean(
        data.crp_number?.trim() &&
        data.crp_region
      );
    }

    if (step === 2) {
      return Boolean(
        Array.isArray(data.modalities) &&
        data.modalities.length > 0
      );
    }

    if (step === 3) {
      return Boolean(data.photo_url);
    }

    if (step === 4) {
      return Boolean(data.video_url);
    }

    return true;
  };

  const upload = async (file, key) => {
    if (!file) return;

    setError("");

    const MAX_PHOTO_SIZE =
      10 * 1024 * 1024;

    const MAX_VIDEO_SIZE =
      200 * 1024 * 1024;

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

    if (!isAuthenticated) {
      setError(
        "Faça seu cadastro profissional ou entre na sua conta antes de enviar arquivos."
      );

      return;
    }

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
          "O vídeo deve ter no máximo 200 MB."
        );

        return;
      }
    }

    setUploading(true);

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const currentUser =
        userData?.user || null;

      if (!currentUser?.id) {
        throw new Error(
          "Sua sessão não está disponível. Entre novamente para continuar."
        );
      }

      setAuthenticatedUser(currentUser);

      const fileName =
        makeFileName(file);

      const folder =
        key === "photo_url"
          ? `professionals/${currentUser.id}/photos`
          : `professionals/${currentUser.id}/videos`;

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

      set(key, publicUrl);
      setError("");
    } catch (err) {
      console.error(
        "EntreNós: erro no upload:",
        err
      );

      setError(
        getFriendlyError(err)
      );
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (submitting || uploading) {
      return;
    }

    setError("");

    if (!isAuthenticated) {
      setError(
        "Entre na sua conta profissional para continuar."
      );
      return;
    }

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
      setError("Informe seu estado com 2 letras.");
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
        "A foto profissional é obrigatória."
      );
      setStep(3);
      return;
    }

    if (!data.video_url) {
      setError(
        "O vídeo de apresentação é obrigatório."
      );
      setStep(4);
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const currentUser =
        userData?.user || null;

      if (!currentUser?.id) {
        throw new Error(
          "Sua sessão não está disponível. Entre novamente."
        );
      }

      /*
       * Garante que a conta passa a ser identificada
       * como profissional.
       */
      await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          full_name: data.full_name.trim(),
          name: data.full_name.trim(),
          role: "psychologist",
          account_type: "professional",
          user_type: "professional",
        },
      });

      const psychologistData = {
        user_id: currentUser.id,

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
          Array.isArray(data.specializations)
            ? data.specializations
            : [],

        approaches:
          Array.isArray(data.approaches)
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
          data.address?.trim() ||
          null,

        bio:
          data.about?.trim() ||
          null,

        /*
         * Mantém os dois nomes para compatibilidade
         * com partes diferentes do projeto.
         */
        photo_url:
          data.photo_url,

        profile_photo_url:
          data.photo_url,

        presentation_video_url:
          data.video_url,

        presentation_video_status:
          "pending",

        verification_status:
          "pending",

        public_profile:
          false,
      };

      console.log(
        "EntreNós: salvando cadastro profissional:",
        psychologistData
      );

      const {
        data: existing,
        error: existingError,
      } = await supabase
        .from("psychologists")
        .select("id")
        .eq(
          "user_id",
          currentUser.id
        )
        .maybeSingle();

      if (existingError) {
        throw existingError;
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
            currentUser.id
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
      setError("");
    } catch (err) {
      console.error(
        "EntreNós: erro ao salvar cadastro profissional:",
        err
      );

      const message =
        getFriendlyError(err);

      setError(message);

      if (
        message.toLowerCase().includes("sessão") ||
        message.toLowerCase().includes("session")
      ) {
        setAuthenticatedUser(null);
        setStep(0);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <PageShell>
        <div className="min-h-[65vh] flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2
              size={34}
              className="animate-spin mx-auto mb-4 text-primary"
            />

            <p className="text-sm text-muted-foreground">
              Verificando sua conta...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * =====================================================
   * TELA DE AUTENTICAÇÃO PROFISSIONAL
   * =====================================================
   */
  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-12 pb-20">

          <div className="text-center mb-8">

            <div className="w-16 h-16 rounded-3xl gradient-brand mx-auto flex items-center justify-center text-white mb-5 shadow-soft">
              {authMode === "register" ? (
                <UserPlus size={30} />
              ) : (
                <LogIn size={30} />
              )}
            </div>

            <h1 className="text-3xl font-heading font-bold">
              Área do profissional
            </h1>

            <p className="text-muted-foreground mt-2">
              {authMode === "register"
                ? "Crie sua conta profissional e depois complete seu perfil."
                : "Entre na sua conta para continuar seu cadastro profissional."}
            </p>

          </
