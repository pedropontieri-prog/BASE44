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

  // =========================================================
  // OTP
  // =========================================================

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Impede solicitar vários códigos seguidos.
  const [resendCooldown, setResendCooldown] = useState(0);

  // =========================================================
  // CONTADOR DO REENVIO
  // =========================================================

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          return 0;
        }

        return current - 1;
      });
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
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
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

          return;
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
  };

  // =========================================================
  // VALIDAÇÃO
  // =========================================================

  const validate = () => {
    if (!form.full_name.trim()) {
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

    if (form.password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }

    if (
      form.password !== form.confirm_password
    ) {
      return "As senhas não coincidem.";
    }

    return "";
  };

  // =========================================================
  // CRIAR CONTA PROFISSIONAL
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

      const fullName =
        form.full_name.trim();

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

      /*
       * =====================================================
       * IMPORTANTE
       * =====================================================
       *
       * Se o Supabase exigir confirmação de e-mail,
       * NÃO vamos redirecionar.
       *
       * Vamos mostrar imediatamente a tela do código.
       */

      setOtp("");
      setOtpSent(true);

      /*
       * O signUp acabou de disparar o primeiro e-mail.
       * Impede outro pedido imediatamente.
       */
      setResendCooldown(60);

      /*
       * Se o Supabase já retornou uma sessão,
       * não precisamos verificar OTP.
       *
       * Nesse caso, seguimos normalmente para
       * o cadastro profissional.
       */
      if (data?.session?.user) {
        try {
          const { error: updateError } =
            await supabase.auth.updateUser({
              data: {
                full_name: fullName,
                name: fullName,
                role: "professional",
                user_type: "professional",
                account_type: "professional",
                profile_type: "professional",
              },
            });

          if (updateError) {
            console.error(
              "Erro ao salvar tipo profissional:",
              updateError
            );
          }
        } catch (updateErr) {
          console.error(
            "Erro ao atualizar dados:",
            updateErr
          );
        }

        /*
         * Confirmação de e-mail provavelmente está
         * desativada. Nesse caso podemos seguir.
         */
        setOtpSent(false);

        navigate("/cadastro-profissional", {
          replace: true,
        });

        return;
      }

      /*
       * Aqui chegamos quando o Supabase criou a conta
       * e está aguardando a confirmação por e-mail.
       */
      setError("");

    } catch (err) {
      console.error(
        "Erro ao criar conta profissional:",
        err
      );

      let message =
        err?.message ||
        "Não foi possível criar sua conta.";

      const lowerMessage =
        message.toLowerCase();

      if (
        lowerMessage.includes("password")
      ) {
        message =
          "A senha informada não atende aos requisitos.";
      }

      if (
        lowerMessage.includes("rate limit") ||
        lowerMessage.includes(
          "too many requests"
        ) ||
        lowerMessage.includes(
          "security"
        ) ||
        lowerMessage.includes(
          "only request this after"
        )
      ) {
        message =
          "Por segurança, aguarde alguns segundos antes de solicitar outro código.";
      }

      if (
        lowerMessage.includes(
          "already registered"
        ) ||
        lowerMessage.includes(
          "user already registered"
        )
      ) {
        message =
          "Este e-mail já possui uma conta. Tente fazer login.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFICAR OTP
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

      if (!data?.session?.user) {
        throw new Error(
          "O e-mail foi confirmado, mas não foi possível iniciar sua sessão."
        );
      }

      /*
       * =====================================================
       * GARANTE PERFIL PROFISSIONAL
       * =====================================================
       */

      const fullName =
        form.full_name.trim();

      const { error: updateError } =
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            name: fullName,
            role: "professional",
            user_type: "professional",
            account_type: "professional",
            profile_type: "professional",
          },
        });

      if (updateError) {
        console.error(
          "Erro ao salvar tipo profissional:",
          updateError
        );
      }

      /*
       * =====================================================
       * CONFIRMAÇÃO CONCLUÍDA
       * =====================================================
       */

      setOtp("");
      setOtpSent(false);
      setResendCooldown(0);

      navigate("/cadastro-profissional", {
        replace: true,
      });

    } catch (err) {
      console.error(
        "Erro ao verificar código:",
        err
      );

      let message =
        err?.message ||
        "Código inválido ou expirado.";

      const lowerMessage =
        message.toLowerCase();

      if (
        lowerMessage.includes("expired")
      ) {
        message =
          "Esse código expirou. Solicite um novo código.";
      }

      if (
        lowerMessage.includes("invalid")
      ) {
        message =
          "Código inválido. Confira os 6 números e tente novamente.";
      }

      if (
        lowerMessage.includes("security") ||
        lowerMessage.includes("too many")
      ) {
        message =
          "Muitas tentativas. Aguarde alguns segundos e tente novamente.";
      }

      setError(message);
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

      let message =
        err?.message ||
        "Não foi possível reenviar o código.";

      const lowerMessage =
        message.toLowerCase();

      if (
        lowerMessage.includes("rate limit") ||
        lowerMessage.includes(
          "too many requests"
        ) ||
        lowerMessage.includes(
          "security"
        ) ||
        lowerMessage.includes(
          "only request this after"
        )
      ) {
        message =
          "Por segurança, você precisa aguardar antes de solicitar outro código.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
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
  // TELA DE CONFIRMAÇÃO POR CÓDIGO
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
                onChange={(e) => {
                  const value =
                    e.target.value
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
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
                setResendCooldown(0);
              }}
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
  // FORMULÁRIO DE CRIAÇÃO DA CONTA
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
            <label className="block text-sm font-medium mb-2">
              Nome completo *
            </label>

            <input
              type="text"
              value={form.full_name}
              onChange={(e) =>
                update(
                  "full_name",
                  e.target.value
                )
              }
              placeholder="Seu nome completo"
              autoComplete="name"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              E-mail profissional *
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                update(
                  "email",
                  e.target.value
                )
              }
              placeholder="voce@exemplo.com"
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Senha *
            </label>

            <div className="relative">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={form.password}
                onChange={(e) =>
                  update(
                    "password",
                    e.target.value
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
            <label className="block text-sm font-medium mb-2">
              Confirmar senha *
            </label>

            <div className="relative">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={form.confirm_password}
                onChange={(e) =>
                  update(
                    "confirm_password",
                    e.target.value
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
