```jsx
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
  User,
  UserPlus,
  Video,
  X,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

const STEPS = [
  { key: "personal", label: "Pessoal", icon: User },
  { key: "professional", label: "Profissional", icon: Check },
  { key: "service", label: "Atendimento", icon: Calendar },
  { key: "photo", label: "Foto", icon: Camera },
  { key: "video", label: "Vídeo", icon: Video },
  { key: "review", label: "Revisão", icon: Check },
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
    const value = String(index + 1).padStart(2, "0");

    return {
      value,
      label: `CRP ${value}`,
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
  const message = String(
    error?.message || ""
  ).toLowerCase();

  if (
    message.includes("invalid login credentials")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (
    message.includes("email not confirmed")
  ) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  if (
    message.includes("user already registered")
  ) {
    return "Este e-mail já possui uma conta. Use a opção Entrar.";
  }

  if (
    message.includes("password")
  ) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  if (
    message.includes("duplicate") ||
    message.includes("unique constraint")
  ) {
    return "Este cadastro já existe.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not allowed")
  ) {
    return "O Supabase bloqueou esta operação por causa das permissões da tabela.";
  }

  if (
    message.includes("bucket") ||
    message.includes("storage")
  ) {
    return "Não foi possível enviar o arquivo. Verifique o Storage do Supabase.";
  }

  if (
    message.includes("relation") &&
    message.includes("does not exist")
  ) {
    return "A tabela necessária não existe no Supabase.";
  }

  return (
    error?.message ||
    "Não foi possível concluir a operação."
  );
}

function makeFileName(file) {
  const originalName = file?.name || "";

  const extension =
    originalName.includes(".")
      ? originalName
          .split(".")
          .pop()
          .toLowerCase()
      : "file";

  const id =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${id}.${extension}`;
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
        {label}
        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
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
        {label}
        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}
      </span>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        <option value="">
          Selecione...
        </option>

        {options.map((option) => (
          <option
            key={option.value ?? option}
            value={option.value ?? option}
          >
            {option.label ?? option}
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
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none resize-y focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
  const toggle = (option) => {
    if (!multiple) {
      onChange(
        values.includes(option)
          ? []
          : [option]
      );

      return;
    }

    onChange(
      values.includes(option)
        ? values.filter(
            (item) => item !== option
          )
        : [...values, option]
    );
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active =
            values.includes(option);

          return (
            <button
              type="button"
              key={option}
              onClick={() =>
                toggle(option)
              }
              className={`rounded-full border px-3 py-2 text-sm transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfessionalOnboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] =
    useState(DEFAULTS);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [authMode, setAuthMode] =
    useState("register");

  const [
    authenticatedUser,
    setAuthenticatedUser,
  ] = useState(null);

  const [authName, setAuthName] =
    useState("");

  const [authEmail, setAuthEmail] =
    useState("");

  const [
    authPassword,
    setAuthPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    authSubmitting,
    setAuthSubmitting,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [done, setDone] =
    useState(false);

  const [
    confirmationSent,
    setConfirmationSent,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const isAuthenticated =
    Boolean(authenticatedUser?.id);

  const displayName = useMemo(
    () =>
      data.professional_name ||
      data.full_name ||
      authenticatedUser
        ?.user_metadata
        ?.full_name ||
      authenticatedUser
        ?.user_metadata
        ?.name ||
      "Profissional",
    [
      data.professional_name,
      data.full_name,
      authenticatedUser,
    ]
  );

  const set = (key, value) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        setAuthLoading(true);

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError) {
          console.error(
            "EntreNós: erro ao recuperar sessão:",
            sessionError
          );

          setAuthenticatedUser(null);

          return;
        }

        const user =
          sessionData?.session?.user ||
          null;

        setAuthenticatedUser(user);

        if (user) {
          setData((current) => ({
            ...current,
            email:
              current.email ||
              user.email ||
              "",
            full_name:
              current.full_name ||
              user.user_metadata
                ?.full_name ||
              user.user_metadata?.name ||
              "",
          }));
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
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        const user =
          session?.user || null;

        if (event === "SIGNED_OUT") {
          setAuthenticatedUser(null);
          setConfirmationSent(false);
          return;
        }

        if (user) {
          setAuthenticatedUser(user);

          setData((current) => ({
            ...current,
            email:
              current.email ||
              user.email ||
              "",
            full_name:
              current.full_name ||
              user.user_metadata
                ?.full_name ||
              user.user_metadata?.name ||
              "",
          }));
        }

        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const authenticateProfessional =
    async () => {
      setError("");

      const email =
        authEmail.trim().toLowerCase();

      if (!email) {
        setError(
          "Informe seu e-mail profissional."
        );
        return;
      }

      if (!authPassword) {
        setError("Informe sua senha.");
        return;
      }

      if (authPassword.length < 6) {
        setError(
          "A senha deve ter pelo menos 6 caracteres."
        );
        return;
      }

      if (
        authMode === "register" &&
        !authName.trim()
      ) {
        setError(
          "Informe seu nome completo."
        );
        return;
      }

      setAuthSubmitting(true);

      try {
        if (authMode === "register") {
          const {
            data: signUpData,
            error: signUpError,
          } = await supabase.auth.signUp({
            email,
            password: authPassword,
            options: {
              data: {
                full_name:
                  authName.trim(),
                name:
                  authName.trim(),
                role: "psychologist",
                account_type:
                  "professional",
                user_type:
                  "professional",
              },
            },
          });

          if (signUpError) {
            throw signUpError;
          }

          const user =
            signUpData?.user || null;

          setData((current) => ({
            ...current,
            full_name:
              current.full_name ||
              authName.trim(),
            email:
              current.email ||
              email,
          }));

          if (signUpData?.session?.user) {
            setAuthenticatedUser(
              signUpData.session.user
            );

            setConfirmationSent(false);
            setError("");

            return;
          }

          if (user) {
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
        } =
          await supabase.auth.signInWithPassword(
            {
              email,
              password: authPassword,
            }
          );

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
            loginData.user.user_metadata
              ?.full_name ||
            loginData.user.user_metadata
              ?.name ||
            "",
        }));

        setConfirmationSent(false);
        setError("");
      } catch (err) {
        console.error(
          "EntreNós: erro na autenticação:",
          err
        );

        setError(
          getFriendlyError(err)
        );
      } finally {
        setAuthSubmitting(false);
      }
    };

  const resendConfirmation =
    async () => {
      const email =
        authEmail.trim().toLowerCase();

      if (!email) {
        setError(
          "Informe seu e-mail."
        );
        return;
      }

      setAuthSubmitting(true);
      setError("");

      try {
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

        setError(
          "E-mail de confirmação reenviado. Verifique sua caixa de entrada."
        );
      } catch (err) {
        setError(
          getFriendlyError(err)
        );
      } finally {
        setAuthSubmitting(false);
      }
    };

  const logoutProfessional =
    async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        setAuthenticatedUser(null);
        setConfirmationSent(false);
        setStep(0);
        setData({
          ...DEFAULTS,
        });
        setError("");
      }
    };

  const validateStep = () => {
    if (step === 0) {
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
        data.state.trim().length !== 2
      ) {
        return "Informe o estado com 2 letras.";
      }
    }

    if (step === 1) {
      if (!data.crp_number.trim()) {
        return "Informe seu número do CRP.";
      }

      if (!data.crp_region) {
        return "Selecione a região do CRP.";
      }
    }

    if (step === 2) {
      if (
        !data.modalities.length
      ) {
        return "Selecione pelo menos uma modalidade.";
      }
    }

    if (
      step === 3 &&
      !data.photo_url
    ) {
      return "Envie uma foto profissional.";
    }

    if (
      step === 4 &&
      !data.video_url
    ) {
      return "Envie um vídeo de apresentação.";
    }

    return "";
  };

  const nextStep = () => {
    const validationError =
      validateStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    setStep((current) =>
      Math.min(
        current + 1,
        STEPS.length - 1
      )
    );
  };

  const previousStep = () => {
    setError("");

    setStep((current) =>
      Math.max(current - 1, 0)
    );
  };

  const upload = async (
    file,
    key
  ) => {
    if (!file) {
      return;
    }

    setError("");

    if (!isAuthenticated) {
      setError(
        "Faça login antes de enviar arquivos."
      );
      return;
    }

    const isPhoto =
      key === "photo_url";

    const allowedTypes = isPhoto
      ? [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ]
      : [
          "video/mp4",
          "video/webm",
          "video/quicktime",
        ];

    const maxSize = isPhoto
      ? 10 * 1024 * 1024
      : 200 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setError(
        isPhoto
          ? "Formato de foto não permitido. Envie JPG, PNG ou WEBP."
          : "Formato de vídeo não permitido. Envie MP4, WEBM ou MOV."
      );
      return;
    }

    if (file.size > maxSize) {
      setError(
        isPhoto
          ? "A foto deve ter no máximo 10 MB."
          : "O vídeo deve ter no máximo 200 MB."
      );
      return;
    }

    setUploading(true);

    try {
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user =
        userData?.user;

      if (!user?.id) {
        throw new Error(
          "Sua sessão não está disponível. Entre novamente."
        );
      }

      setAuthenticatedUser(user);

      const folder = isPhoto
        ? `professionals/${user.id}/photos`
        : `professionals/${user.id}/videos`;

      const filePath = `${folder}/${makeFileName(
        file
      )}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("profiles")
          .upload(
            filePath,
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
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "Não foi possível obter a URL do arquivo."
        );
      }

      set(
        key,
        publicUrl
      );

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
    if (
      submitting ||
      uploading
    ) {
      return;
    }

    setError("");

    if (!isAuthenticated) {
      setError(
        "Entre na sua conta profissional para continuar."
      );
      return;
    }

    for (
      let index = 0;
      index <= 4;
      index += 1
    ) {
      let validation = "";

      if (index === 0) {
        if (!data.full_name.trim()) {
          validation =
            "Informe seu nome completo.";
        } else if (
          !data.email.trim()
        ) {
          validation =
            "Informe seu e-mail.";
        } else if (
          !data.city.trim()
        ) {
          validation =
            "Informe sua cidade.";
        } else if (
          data.state.trim().length !== 2
        ) {
          validation =
            "Informe o estado com 2 letras.";
        }
      }

      if (index === 1) {
        if (
          !data.crp_number.trim()
        ) {
          validation =
            "Informe seu número do CRP.";
        } else if (
          !data.crp_region
        ) {
          validation =
            "Selecione a região do CRP.";
        }
      }

      if (
        index === 2 &&
        !data.modalities.length
      ) {
        validation =
          "Selecione pelo menos uma modalidade.";
      }

      if (
        index === 3 &&
        !data.photo_url
      ) {
        validation =
          "A foto profissional é obrigatória.";
      }

      if (
        index === 4 &&
        !data.video_url
      ) {
        validation =
          "O vídeo de apresentação é obrigatório.";
      }

      if (validation) {
        setStep(index);
        setError(validation);
        return;
      }
    }

    setSubmitting(true);

    try {
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user =
        userData?.user;

      if (!user?.id) {
        throw new Error(
          "Sua sessão não está disponível. Entre novamente."
        );
      }

      setAuthenticatedUser(user);

      const {
        error: metadataError,
      } =
        await supabase.auth.updateUser({
          data: {
            ...(user.user_metadata || {}),
            full_name:
              data.full_name.trim(),
            name:
              data.full_name.trim(),
            role: "psychologist",
            account_type:
              "professional",
            user_type:
              "professional",
          },
        });

      if (metadataError) {
        throw metadataError;
      }

      const psychologistData = {
        user_id: user.id,

        professional_name:
          data.professional_name.trim() ||
          data.full_name.trim(),

        crp_number:
          data.crp_number.trim(),

        crp_region:
          data.crp_region,

        education:
          data.education.trim() ||
          null,

        institution:
          data.institution.trim() ||
          null,

        graduation_year:
          data.graduation_year
            ? Number(
                data.graduation_year
              )
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
          data.experience.trim() ||
          null,

        topics:
          Array.isArray(data.themes)
            ? data.themes
            : [],

        modalities:
          Array.isArray(
            data.modalities
          )
            ? data.modalities
            : [],

        languages:
          Array.isArray(
            data.languages
          )
            ? data.languages
            : [],

        audience:
          Array.isArray(
            data.audience
          )
            ? data.audience
            : [],

        city:
          data.city.trim(),

        state:
          data.state
            .trim()
            .toUpperCase(),

        phone:
          data.phone.trim() ||
          null,

        gender:
          data.gender.trim() ||
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
          data.cancellation_policy.trim() ||
          null,

        address:
          data.address.trim() ||
          null,

        bio:
          data.about.trim() ||
          null,

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

      const {
        data: existing,
        error: existingError,
      } =
        await supabase
          .from("psychologists")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing?.id) {
        const {
          error: updateError,
        } =
          await supabase
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
              user.id
            );

        if (updateError) {
          throw updateError;
        }
      } else {
        const {
          error: insertError,
        } =
          await supabase
            .from("psychologists")
            .insert(
              psychologistData
            );

        if (insertError) {
          throw insertError;
        }
      }

      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email:
              user.email ||
              data.email.trim(),
            name:
              data.full_name.trim(),
            full_name:
              data.full_name.trim(),
            role: "psychologist",
            avatar_url:
              data.photo_url || null,
          },
          {
            onConflict: "id",
          }
        );

      setDone(true);
      setError("");
    } catch (err) {
      console.error(
        "EntreNós: erro ao salvar cadastro profissional:",
        err
      );

      setError(
        getFriendlyError(err)
      );
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

  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl gradient-brand mx-auto flex items-center justify-center text-white mb-5 shadow-soft">
              {authMode ===
              "register" ? (
                <UserPlus size={30} />
              ) : (
                <LogIn size={30} />
              )}
            </div>

            <h1 className="text-3xl font-heading font-bold">
              Área do profissional
            </h1>

            <p className="text-muted-foreground mt-2">
              {authMode ===
              "register"
                ? "Crie sua conta profissional e complete seu perfil."
                : "Entre na sua conta para continuar seu cadastro."}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            {authMode ===
              "register" && (
              <div className="mb-5">
                <Input
                  label="Nome completo"
                  value={authName}
                  onChange={
                    setAuthName
                  }
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div className="space-y-5">
              <Input
                label="E-mail"
                value={authEmail}
                onChange={
                  setAuthEmail
                }
                type="email"
                placeholder="profissional@email.com"
                required
              />

              <label className="block">
                <span className="block text-sm font-medium mb-2">
                  Senha *
                </span>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      authPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setAuthPassword(
                        event.target
                          .value
                      )
                    }
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                    aria-label={
                      showPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={20}
                      />
                    ) : (
                      <Eye
                        size={20}
                      />
                    )}
                  </button>
                </div>
              </label>
            </div>

            {confirmationSent && (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-medium">
                  Conta criada!
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Confirme seu e-mail antes de entrar. Se necessário, reenvie a confirmação abaixo.
                </p>

                <button
                  type="button"
                  onClick={
                    resendConfirmation
                  }
                  disabled={
                    authSubmitting
                  }
                  className="mt-3 text-sm font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Reenviar confirmação
                </button>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm">
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
              className="mt-6 w-full rounded-xl bg-primary text-primary-foreground py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {authSubmitting ? (
                <Loader2
                  size={20}
                  className="animate-spin"
                />
              ) : authMode ===
                "register" ? (
                <UserPlus
                  size={20}
                />
              ) : (
                <LogIn
                  size={20}
                />
              )}

              {authMode ===
              "register"
                ? "Criar conta"
                : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  (mode) =>
                    mode ===
                    "register"
                      ? "login"
                      : "register"
                );

                setError("");
                setConfirmationSent(
                  false
                );
              }}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {authMode ===
              "register"
                ? "Já tenho uma conta profissional"
                : "Ainda não tenho uma conta profissional"}
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock size={14} />
            Seus dados são enviados por uma conexão segura.
          </div>
        </div>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-6">
              <Check size={42} />
            </div>

            <h1 className="text-3xl font-heading font-bold">
              Cadastro enviado!
            </h1>

            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Seu perfil profissional foi salvo e ficará aguardando a verificação antes de ser publicado.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
                className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold"
              >
                Ir para o início
              </button>

              <button
                type="button"
                onClick={
                  logoutProfessional
                }
                className="rounded-xl border border-border px-6 py-3 font-semibold flex items-center justify-center gap-2"
              >
                <LogOut
                  size={18}
                />
                Sair
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const CurrentIcon =
    STEPS[step].icon;

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">
              Olá, {displayName}
            </p>

            <h1 className="text-3xl font-heading font-bold mt-1">
              Complete seu perfil profissional
            </h1>
          </div>

          <button
            type="button"
            onClick={
              logoutProfessional
            }
            className="hidden sm:flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm"
          >
            <LogOut
              size={17}
            />
            Sair
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm mb-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STEPS.map(
              (item, index) => {
                const Icon =
                  item.icon;

                const active =
                  index === step;

                const completed =
                  index < step;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      index <= step &&
                      setStep(index)
                    }
                    disabled={
                      index > step
                    }
                    className={`rounded-2xl p-3 text-center transition ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : completed
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/40 text-muted-foreground"
                    } disabled:cursor-not-allowed`}
                  >
                    <Icon
                      size={19}
                      className="mx-auto mb-1"
                    />

                    <span className="text-xs font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <div className="h-2 rounded-full bg-muted mt-5 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${
                  ((step + 1) /
                    STEPS.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm flex items-start gap-3">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  Dados pessoais
                </h2>

                <p className="text-muted-foreground mt-1">
                  Informações básicas para seu perfil.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Nome completo"
                  value={
                    data.full_name
                  }
                  onChange={(value) =>
                    set(
                      "full_name",
                      value
                    )
                  }
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
                  placeholder="Como deseja aparecer no perfil"
                />

                <Input
                  label="E-mail"
                  value={
                    data.email
                  }
                  onChange={(value) =>
                    set(
                      "email",
                      value
                    )
                  }
                  type="email"
                  required
                />

                <Input
                  label="Telefone"
                  value={
                    data.phone
                  }
                  onChange={(value) =>
                    set(
                      "phone",
                      value
                    )
                  }
                  placeholder="(00) 00000-0000"
                />

                <Input
                  label="Cidade"
                  value={
                    data.city
                  }
                  onChange={(value) =>
                    set(
                      "city",
                      value
                    )
                  }
                  required
                />

                <Input
                  label="Estado"
                  value={
                    data.state
                  }
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

                <Input
                  label="Gênero"
                  value={
                    data.gender
                  }
                  onChange={(value) =>
                    set(
                      "gender",
                      value
                    )
                  }
                />

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
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  Dados profissionais
                </h2>

                <p className="text-muted-foreground mt-1">
                  Informe sua formação e registro profissional.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Número do CRP"
                  value={
                    data.crp_number
                  }
                  onChange={(value) =>
                    set(
                      "crp_number",
                      value
                    )
                  }
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
                  options={
                    REGION_OPTS
                  }
                  required
                />

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
                />

                <Input
                  label="Instituição"
                  value={
                    data.institution
                  }
                  onChange={(value) =>
                    set(
                      "institution",
                      value
                    )
                  }
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
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          4
                        )
                    )
                  }
                />

                <Input
                  label="Experiência"
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
                label="Especializações"
                options={
                  SPEC_OPTS
                }
                values={
                  data.specializations
                }
                onChange={(value) =>
                  set(
                    "specializations",
                    value
                  )
                }
              />

              <Chips
                label="Abordagens terapêuticas"
                options={
                  APPROACH_OPTS
                }
                values={
                  data.approaches
                }
                onChange={(value) =>
                  set(
                    "approaches",
                    value
                  )
                }
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  Atendimento
                </h2>

                <p className="text-muted-foreground mt-1">
                  Defina como e quando você atende.
                </p>
              </div>

              <Chips
                label="Modalidades"
                options={[
                  "online",
                  "presencial",
                ]}
                values={
                  data.modalities
                }
                onChange={(value) =>
                  set(
                    "modalities",
                    value
                  )
                }
              />

              <Chips
                label="Idiomas"
                options={
                  LANG_OPTS
                }
                values={
                  data.languages
                }
                onChange={(value) =>
                  set(
                    "languages",
                    value
                  )
                }
              />

              <Chips
                label="Público"
                options={
                  AUDIENCE_OPTS
                }
                values={
                  data.audience
                }
                onChange={(value) =>
                  set(
                    "audience",
                    value
                  )
                }
              />

              <Chips
                label="Temas"
                options={
                  THEME_OPTS
                }
                values={
                  data.themes
                }
                onChange={(value) =>
                  set(
                    "themes",
                    value
                  )
                }
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Valor da sessão (R$)"
                  value={
                    data.price
                  }
                  onChange={(value) =>
                    set(
                      "price",
                      value
                        .replace(
                          ",",
                          "."
                        )
                        .replace(
                          /[^0-9.]/g,
                          ""
                        )
                    )
                  }
                />

                <Select
                  label="Duração da sessão"
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
                    "30",
                    "40",
                    "50",
                    "60",
                    "90",
                  ].map(
                    (value) => ({
                      value,
                      label: `${value} minutos`,
                    })
                  )}
                />
              </div>

              <Chips
                label="Dias disponíveis"
                options={
                  DAY_OPTS
                }
                values={
                  data.available_days
                }
                onChange={(value) =>
                  set(
                    "available_days",
                    value
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
                onChange={(value) =>
                  set(
                    "available_slots",
                    value
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
                placeholder="Explique sua política de cancelamento e reagendamento."
                rows={4}
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
                placeholder="Conte um pouco sobre sua experiência e seu trabalho."
                rows={6}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  Foto profissional
                </h2>

                <p className="text-muted-foreground mt-1">
                  Use uma foto nítida e adequada para seu perfil.
                </p>
              </div>

              <label className="block border-2 border-dashed border-border rounded-3xl p-8 text-center cursor-pointer hover:border-primary transition">
                <Camera
                  size={40}
                  className="mx-auto text-primary mb-4"
                />

                <p className="font-semibold">
                  {uploading
                    ? "Enviando foto..."
                    : "Clique para escolher sua foto"}
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG ou WEBP • máximo 10 MB
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={
                    uploading
                  }
                  onChange={(event) =>
                    upload(
                      event.target
                        .files?.[0],
                      "photo_url"
                    )
                  }
                />
              </label>

              {data.photo_url && (
                <div className="rounded-2xl border border-border p-4">
                  <img
                    src={
                      data.photo_url
                    }
                    alt="Prévia da foto profissional"
                    className="w-40 h-40 object-cover rounded-2xl mx-auto"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "photo_url",
                        ""
                      )
                    }
                    className="mt-4 mx-auto flex items-center gap-2 text-sm text-red-600"
                  >
                    <X size={16} />
                    Remover foto
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  Vídeo de apresentação
                </h2>

                <p className="text-muted-foreground mt-1">
                  Apresente seu trabalho de forma breve e acolhedora.
                </p>
              </div>

              <label className="block border-2 border-dashed border-border rounded-3xl p-8 text-center cursor-pointer hover:border-primary transition">
                <Video
                  size={40}
                  className="mx-auto text-primary mb-4"
                />

                <p className="font-semibold">
                  {uploading
                    ? "Enviando vídeo..."
                    : "Clique para escolher seu vídeo"}
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  MP4, WEBM ou MOV • máximo 200 MB
                </p>

                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  disabled={
                    uploading
                  }
                  onChange={(event) =>
                    upload(
                      event.target
                        .files?.[0],
                      "video_url"
                    )
                  }
                />
              </label>

              {data.video_url && (
                <div className="rounded-2xl border border-border p-4">
                  <video
                    src={
                      data.video_url
                    }
                    controls
                    className="w-full max-h-96 rounded-2xl"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "video_url",
                        ""
                      )
                    }
                    className="mt-4 mx-auto flex items-center gap-2 text-sm text-red-600"
                  >
                    <X size={16} />
                    Remover vídeo
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  Revisão
                </h2>

                <p className="text-muted-foreground mt-1">
                  Confira seus dados antes de enviar.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  [
                    "Nome",
                    data.full_name,
                  ],
                  [
                    "Nome profissional",
                    data.professional_name ||
                      data.full_name,
                  ],
                  [
                    "E-mail",
                    data.email,
                  ],
                  [
                    "Cidade",
                    `${data.city} - ${data.state}`,
                  ],
                  [
                    "CRP",
                    `${data.crp_number} / ${data.crp_region}`,
                  ],
                  [
                    "Modalidades",
                    data.modalities.join(
                      ", "
                    ),
                  ],
                  [
                    "Especializações",
                    data.specializations.join(
                      ", "
                    ) ||
                      "Não informado",
                  ],
                  [
                    "Abordagens",
                    data.approaches.join(
                      ", "
                    ) ||
                      "Não informado",
                  ],
                  [
                    "Público",
                    data.audience.join(
                      ", "
                    ),
                  ],
                  [
                    "Idiomas",
                    data.languages.join(
                      ", "
                    ),
                  ],
                  [
                    "Valor",
                    data.price
                      ? `R$ ${data.price}`
                      : "Não informado",
                  ],
                  [
                    "Duração",
                    `${data.session_duration} minutos`,
                  ],
                ].map(
                  ([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-muted/40 p-4"
                    >
                      <p className="text-xs text-muted-foreground">
                        {label}
                      </p>

                      <p className="font-medium mt-1 break-words">
                        {value ||
                          "Não informado"}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="font-semibold">
                  Pronto para enviar?
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Seu cadastro será salvo com status de verificação pendente e o perfil público permanecerá desativado até a aprovação.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={
                previousStep
              }
              disabled={
                step === 0 ||
                submitting ||
                uploading
              }
              className="rounded-xl border border-border px-5 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <ArrowLeft
                size={18}
              />
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
                  submitting ||
                  uploading
                }
                className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                Continuar

                <ArrowRight
                  size={18}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  submit
                }
                disabled={
                  submitting ||
                  uploading
                }
                className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check
                      size={18}
                    />
                    Enviar cadastro
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```
