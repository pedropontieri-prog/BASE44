import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
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
  const [success, setSuccess] = useState(false);

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
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

  const createProfessionalAccount = async (event) => {
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
      const email = form.email.trim().toLowerCase();
      const fullName = form.full_name.trim();

      const redirectUrl =
        `${window.location.origin}/cadastro-profissional`;

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            name: fullName,
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
       * Se a confirmação de e-mail estiver desativada,
       * o Supabase normalmente já devolve uma sessão.
       */
      if (data?.session?.user) {
        navigate("/cadastro-profissional", {
          replace: true,
        });

        return;
      }

      /*
       * Se a confirmação de e-mail estiver ativada,
       * não existe sessão ainda. Nesse caso mostramos
       * uma tela orientando o profissional a confirmar
       * o endereço.
       */
      setSuccess(true);
    } catch (err) {
      console.error(
        "Erro ao criar conta profissional:",
        err
      );

      let message =
        err?.message ||
        "Não foi possível criar sua conta.";

      if (
        message
          .toLowerCase()
          .includes("password")
      ) {
        message =
          "A senha informada não atende aos requisitos.";
      }

      setError(message);
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

  if (success) {
    return (
      <PageShell>
        <div className="max-w-xl mx-auto px-4 pt-16 pb-20">
          <div className="card-elevated p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 mx-auto flex items-center justify-center mb-6">
              <Check
                size={40}
                className="text-emerald-600"
              />
            </div>

            <h1 className="text-2xl font-heading font-bold">
              Conta criada!
            </h1>

            <p className="text-muted-foreground mt-3 leading-relaxed">
              Enviamos um link de confirmação para:
            </p>

            <p className="font-semibold mt-2">
              {form.email}
            </p>

            <p className="text-sm text-muted-foreground mt-4">
              Confirme seu e-mail para ativar sua
              conta profissional. Depois, entre na
              plataforma para continuar o cadastro.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold"
              >
                Fazer login
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full glass-strong font-semibold"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

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
            Crie sua conta profissional para começar
            seu cadastro no EntreNós.
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
                  Depois de criar sua conta, você
                  preencherá seus dados profissionais,
                  CRP, especialidades, foto e vídeo.
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
