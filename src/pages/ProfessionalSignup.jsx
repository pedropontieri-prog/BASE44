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

  // Controle do código OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          navigate("/cadastro-profissional", {
            replace: true,
          });

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

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validate = () => {
    if (!form.full_name.trim()) {
      return "Informe seu nome completo.";
    }

    if (!form.email.trim()) {
      return "Informe seu e-mail.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email
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

  /*
   * CRIA A CONTA PROFISSIONAL
   * E ENVIA O CÓDIGO OTP
   */
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

            // IMPORTANTE:
            // identifica essa conta como profissional
            account_type: "professional",
            user_type: "professional",
            role: "professional",
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      /*
       * Caso o Supabase já tenha retornado
       * uma sessão, não precisamos de OTP.
       */
      if (data?.session?.user) {
        navigate("/cadastro-profissional", {
          replace: true,
        });

        return;
      }

      /*
       * Confirmação de e-mail ativada:
       * mostramos a tela para digitar o código.
       */
      setOtpSent(true);
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
        lowerMessage.includes(
          "rate limit"
        ) ||
        lowerMessage.includes(
          "too many requests"
        )
      ) {
        message =
          "Muitas tentativas de envio de e-mail. Aguarde alguns minutos e tente novamente.";
      }

      if (
        lowerMessage.includes(
          "already registered"
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

  /*
   * VERIFICA O CÓDIGO DE 6 DÍGITOS
   */
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
          "Não foi possível confirmar sua conta."
        );
      }

      /*
       * Garante que a conta continua identificada
       * como profissional após a confirmação.
       */
      const user = data.session.user;

      const currentRole =
        user.user_metadata?.role;

      if (currentRole !== "professional") {
        const {
          error: updateError,
        } = await supabase.auth.updateUser({
          data: {
            full_name:
              form.full_name.trim(),

            name:
              form.full_name.trim(),

            account_type:
              "professional",

            user_type:
              "professional",

            role:
              "professional",
          },
        });

        if (updateError) {
          console.error(
            "Erro ao atualizar tipo da conta:",
            updateError
          );
        }
      }

      /*
       * Código confirmado.
       * Agora o usuário vai para o cadastro
       * profissional.
       */
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
        lowerMessage.includes(
          "expired"
        )
      ) {
        message =
          "Esse código expirou. Solicite um novo código.";
      }

      if (
        lowerMessage.includes(
          "invalid"
        )
      ) {
        message =
          "Código inválido. Confira os 6 números e tente novamente.";
      }

      setError(message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  /*
   * ENVIA NOVAMENTE O CÓDIGO
   */
  const resendOtp = async () => {
    if (loading || verifyingOtp) return;

    setError("");
    setLoading(true);

    try {
      const email = form.email
        .trim()
        .toLowerCase();

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
    } catch (err) {
      console.error(
        "Erro ao reenviar código:",
        err
      );

      setError(
        err?.message ||
          "Não foi possível reenviar o código."
      );
    } finally {
      setLoading(false);
    }
  };

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

  /*
   * TELA DE CONFIRMAÇÃO POR CÓDIGO
   */
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
              para:
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
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                disabled={verifyingOtp}
                className="w-full rounded-xl border border-border bg-background px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-primary/30"
              />

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
                    <ArrowRight
                      size={18}
                    />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={resendOtp}
              disabled={
                loading ||
                verifyingOtp
              }
              className="mt-5 text-sm font-semibold hover:underline disabled:opacity-50"
            >
              {loading
                ? "Enviando..."
                : "Reenviar código"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
              }}
              className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Voltar e alterar e-mail
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  /*
   * FORMULÁRIO DE CADASTRO
   */
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
          onSubmit={
            createProfessionalAccount
          }
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
                    (current) =>
                      !current
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
                value={
                  form.confirm_password
                }
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
                    (current) =>
                      !current
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
