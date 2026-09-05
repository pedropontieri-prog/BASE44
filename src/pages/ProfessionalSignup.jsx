import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

const PROFESSIONAL_METADATA = {
  role: "professional",
  user_type: "professional",
  account_type: "professional",
  profile_type: "professional",
};

export default function ProfessionalSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // =========================================================
  // CONTADOR DO REENVIO
  // =========================================================

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((current) =>
        current <= 1 ? 0 : current - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // =========================================================
  // VERIFICA SESSÃO EXISTENTE
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Erro ao verificar sessão:",
            sessionError
          );
          return;
        }

        if (!mounted || !session?.user) {
          return;
        }

        const user = session.user;

        const role =
          user.user_metadata?.role ||
          user.user_metadata?.user_type ||
          user.user_metadata?.account_type;

        if (role === "professional") {
          navigate("/painel-profissional", {
            replace: true,
          });
        } else {
          navigate("/painel-paciente", {
            replace: true,
          });
        }
      } catch (err) {
        console.error(
          "Erro ao verificar sessão:",
          err
        );
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // ATUALIZA FORMULÁRIO
  // =========================================================

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =========================================================
  // VALIDAÇÃO
  // =========================================================

  const validate = () => {
    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName) {
      return "Informe seu nome completo.";
    }

    if (fullName.length < 3) {
      return "Informe seu nome completo.";
    }

    if (!email) {
      return "Informe seu e-mail.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return "Informe um e-mail válido.";
    }

    if (form.password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }

    if (form.password !== form.confirm_password) {
      return "As senhas não coincidem.";
    }

    return "";
  };

  // =========================================================
  // TRATAMENTO DE ERROS DO SUPABASE
  // =========================================================

  const getErrorMessage = (err) => {
    const rawMessage =
      err?.message ||
      "Não foi possível concluir a operação.";

    const message = rawMessage.toLowerCase();

    if (
      message.includes("already registered") ||
      message.includes("user already registered") ||
      message.includes("already exists")
    ) {
      return "Este e-mail já possui uma conta. Tente fazer login.";
    }

    if (
      message.includes("invalid login credentials")
    ) {
      return "E-mail ou senha inválidos.";
    }

    if (
      message.includes("password") &&
      (
        message.includes("weak") ||
        message.includes("short") ||
        message.includes("characters")
      )
    ) {
      return "A senha não atende aos requisitos de segurança.";
    }

    if (
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("security") ||
      message.includes("only request this after")
    ) {
      return "Por segurança, aguarde alguns segundos antes de tentar novamente.";
    }

    if (
      message.includes("expired")
    ) {
      return "Esse código expirou. Solicite um novo código.";
    }

    if (
      message.includes("invalid") &&
      (
        message.includes("otp") ||
        message.includes("token")
      )
    ) {
      return "Código inválido. Confira os 6 números e tente novamente.";
    }

    return rawMessage;
  };

  // =========================================================
  // SALVA METADADOS PROFISSIONAIS
  // =========================================================

  const saveProfessionalMetadata = async (
    fullName
  ) => {
    const { error: updateError } =
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          name: fullName,
          ...PROFESSIONAL_METADATA,
        },
      });

    if (updateError) {
      console.error(
        "Erro ao salvar dados profissionais:",
        updateError
      );

      throw updateError;
    }
  };

  // =========================================================
  // CRIA CONTA
  // =========================================================

  const createProfessionalAccount = async (
    event
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const email = form.email
        .trim()
        .toLowerCase();

      const fullName = form.full_name.trim();

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
            ...PROFESSIONAL_METADATA,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      /*
       * CASO 1:
       *
       * Supabase confirmou a conta imediatamente
       * e devolveu uma sessão.
       */
      if (data?.session?.user) {
        await saveProfessionalMetadata(fullName);

        navigate("/cadastro-profissional", {
          replace: true,
        });

        return;
      }

      /*
       * CASO 2:
       *
       * Conta criada, mas confirmação de e-mail
       * é necessária.
       */
      setOtp("");
      setOtpSent(true);
      setResendCooldown(60);
      setError("");
    } catch (err) {
      console.error(
        "Erro ao criar conta profissional:",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CONFIRMA OTP
  // =========================================================

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (verifyingOtp) return;

    setError("");

    const code = otp.trim();

    if (!/^\d{6}$/.test(code)) {
      setError(
        "Digite o código de 6 dígitos recebido por e-mail."
      );
      return;
    }

    setVerifyingOtp(true);

    try {
      const email = form.email
        .trim()
        .toLowerCase();

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

      /*
       * Depois do verifyOtp, normalmente o Supabase
       * devolve uma sessão.
       */
      let user = data?.user;
      let session = data?.session;

      /*
       * Pequena proteção contra casos em que a sessão
       * ainda não apareceu imediatamente na resposta.
       */
      if (!session?.user) {
        const {
          data: sessionData,
        } = await supabase.auth.getSession();

        session = sessionData?.session;
        user = session?.user;
      }

      if (!user || !session) {
        throw new Error(
          "O e-mail foi confirmado, mas não foi possível iniciar sua sessão."
        );
      }

      const fullName = form.full_name.trim();

      await saveProfessionalMetadata(fullName);

      setOtp("");
      setOtpSent(false);
      setResendCooldown(0);
      setError("");

      navigate("/cadastro-profissional", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Erro ao verificar código:",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      setVerifyingOtp(false);
    }
  };

  // =========================================================
  // REENVIAR OTP
  // =========================================================

  const resendOtp = async () => {
    if (
      loading ||
      verifyingOtp ||
      resendCooldown > 0
    ) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const email = form.email
        .trim()
        .toLowerCase();

      if (!email) {
        throw new Error(
          "Informe seu e-mail novamente."
        );
      }

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
      setError("");
    } catch (err) {
      console.error(
        "Erro ao reenviar código:",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VOLTAR PARA O FORMULÁRIO
  // =========================================================

  const backToForm = () => {
    if (verifyingOtp) return;

    setOtpSent(false);
    setOtp("");
    setError("");
    setResendCooldown(0);
  };

  // =========================================================
  // CARREGANDO
  // =========================================================

  if (checkingSession) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2
              size={32}
              className="animate-spin mx-auto mb-4"
            />

            <p className="text-sm text-muted-foreground">
              Carregando...
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  // =========================================================
  // TELA OTP
  // =========================================================

  if (otpSent) {
    return (
      <PageShell>
        <div className="max-w-xl mx-auto px-4 pt-16 pb-20">
          <div className="card-elevated p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 mx-auto flex items-center justify-center mb-6">
              <ShieldCheck
                size={40}
                className="text-emerald-600"
              />
            </div>

            <h1 className="text-2xl font-heading font-bold">
              Confirme seu e-mail
            </h1>

            <p className="text-muted-foreground mt-3 leading-relaxed">
              Enviamos um código de 6 dígitos
              para o seu e-mail.
            </p>

            <p className="font-semibold mt-2 break-all">
              {form.email}
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-left">
                {error}
              </div>
            )}

            <form
              onSubmit={verifyOtp}
              className="mt-7 space-y-4"
            >
              <label
                htmlFor="professional-otp"
                className="block text-sm font-medium text-left"
              >
                Código de confirmação
              </label>

              <input
                id="professional-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setOtp(value);

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                disabled={verifyingOtp}
                className="w-full rounded-xl border border-border bg-background px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-primary/30"
              />

              <p className="text-xs text-muted-foreground">
                Digite os 6 números que você recebeu
                por e-mail.
              </p>

              <button
                type="submit"
                disabled={
                  verifyingOtp ||
                  otp.length !== 6
                }
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full gradient-brand text-white font-semibold shadow-soft disabled:opacity-50"
              >
                {verifyingOtp ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Confirmando...
                  </>
                ) : (
                  <>
                    Confirmar e continuar
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5">
              {resendCooldown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Você poderá solicitar outro
                  código em{" "}
                  <strong>
                    {resendCooldown}s
                  </strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={
                    loading ||
                    verifyingOtp
                  }
                  className="text-sm font-semibold hover:underline disabled:opacity-50"
                >
                  {loading
                    ? "Enviando..."
                    : "Reenviar código"}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={backToForm}
              disabled={verifyingOtp}
              className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Voltar e alterar e-mail
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // =========================================================
  // FORMULÁRIO
  // =========================================================

  return (
    <PageShell>
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-brand mx-auto flex items-center justify-center mb-5">
            <Briefcase
              size={30}
              className="text-white"
            />
          </div>

          <h1 className="text-3xl font-heading font-bold">
            Cadastro profissional
          </h1>

          <p className="text-muted-foreground mt-2">
            Crie sua conta profissional para
            começar seu cadastro no EntreNós.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={createProfessionalAccount}
          className="card-elevated p-6 sm:p-8 space-y-5"
        >
          <div>
            <label
              htmlFor="full-name"
              className="block text-sm font-medium mb-2"
            >
              Nome completo *
            </label>

            <input
              id="full-name"
              type="text"
              value={form.full_name}
              onChange={(event) =>
                update(
                  "full_name",
                  event.target.value
                )
              }
              placeholder="Seu nome completo"
              autoComplete="name"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="professional-email"
              className="block text-sm font-medium mb-2"
            >
              E-mail profissional *
            </label>

            <input
              id="professional-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                update(
                  "email",
                  event.target.value
                )
              }
              placeholder="voce@exemplo.com"
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="professional-password"
              className="block text-sm font-medium mb-2"
            >
              Senha *
            </label>

            <div className="relative">
              <input
                id="professional-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={form.password}
                onChange={(event) =>
                  update(
                    "password",
                    event.target.value
                  )
                }
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary/30"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                tabIndex={-1}
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="professional-confirm-password"
              className="block text-sm font-medium mb-2"
            >
              Confirmar senha *
            </label>

            <div className="relative">
              <input
                id="professional-confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={form.confirm_password}
                onChange={(event) =>
                  update(
                    "confirm_password",
                    event.target.value
                  )
                }
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary/30"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                tabIndex={-1}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmação de senha"
                    : "Mostrar confirmação de senha"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/50 p-4">
            <div className="flex gap-3">
              <ShieldCheck
                size={20}
                className="shrink-0 mt-0.5"
              />

              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Conta profissional
                </p>

                <p className="mt-1">
                  Depois de criar sua conta,
                  você preencherá seus dados
                  profissionais, CRP,
                  especialidades, foto e vídeo.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full gradient-brand text-white font-semibold shadow-soft disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Criando conta...
              </>
            ) : (
              <>
                Criar conta profissional
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Já possui uma conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-foreground hover:underline"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
