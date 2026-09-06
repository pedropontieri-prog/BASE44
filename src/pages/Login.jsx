import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogIn,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

function getUserRole(user) {
  const metadata = user?.user_metadata || {};

  return String(
    metadata.role ||
      metadata.account_type ||
      metadata.user_type ||
      metadata.profile_type ||
      ""
  )
    .trim()
    .toLowerCase();
}

function isProfessional(user) {
  const role = getUserRole(user);

  return [
    "professional",
    "profissional",
    "psychologist",
    "psicologo",
    "psicóloga",
    "psicologa",
  ].includes(role);
}

function isPatient(user) {
  const role = getUserRole(user);

  return [
    "patient",
    "paciente",
    "user",
  ].includes(role);
}

function getUserDestination(user, returnTo) {
  if (!user) {
    return "/login";
  }

  // Profissional sempre vai para o painel profissional.
  if (isProfessional(user)) {
    return "/painel-profissional";
  }

  // Paciente sempre vai para o painel do paciente.
  if (isPatient(user)) {
    return "/painel-paciente";
  }

  // Se não houver role, respeita um returnTo específico.
  if (
    returnTo &&
    returnTo !== "/" &&
    returnTo !== "/painel" &&
    returnTo !== "/painel-paciente" &&
    returnTo !== "/painel-profissional"
  ) {
    return returnTo;
  }

  // Nunca usar /painel, porque essa rota não existe.
  return "/painel-paciente";
}

function getFriendlyLoginError(error) {
  const message = String(
    error?.message || ""
  ).toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid login")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed")
  ) {
    return "Seu e-mail ainda não foi confirmado.";
  }

  if (message.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }

  if (message.includes("network")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }

  return (
    error?.message ||
    "Não foi possível entrar. Tente novamente."
  );
}

export default function Login() {
  const navigate = useNavigate();
  const returnTo = safeReturnTo();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // REDIRECIONAR USUÁRIO JÁ LOGADO
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
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

        const destination = getUserDestination(
          session.user,
          returnTo
        );

        console.log(
          "Sessão encontrada.",
          {
            role: getUserRole(session.user),
            destination,
          }
        );

        navigate(destination, {
          replace: true,
        });
      } catch (err) {
        console.error(
          "Erro ao verificar sessão:",
          err
        );
      }
    };

    checkSession();

    // ==========================================================
    // OBSERVAR ALTERAÇÕES DE AUTENTICAÇÃO
    // ==========================================================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted || !session?.user) {
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION"
        ) {
          const destination =
            getUserDestination(
              session.user,
              returnTo
            );

          console.log(
            "Autenticação alterada.",
            {
              event,
              role: getUserRole(session.user),
              destination,
            }
          );

          navigate(destination, {
            replace: true,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, returnTo]);

  // ============================================================
  // LOGIN E-MAIL/SENHA
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        setError(
          "Digite seu e-mail e sua senha."
        );
        return;
      }

      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!loginData?.user) {
        throw new Error(
          "Não foi possível identificar o usuário."
        );
      }

      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData?.session?.user) {
        throw new Error(
          "Login realizado, mas a sessão não foi criada."
        );
      }

      const user =
        sessionData.session.user;

      const destination =
        getUserDestination(
          user,
          returnTo
        );

      console.log(
        "Login realizado.",
        {
          userId: user.id,
          email: user.email,
          role: getUserRole(user),
          metadata: user.user_metadata,
          destination,
        }
      );

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Erro no login:",
        err
      );

      setError(
        getFriendlyLoginError(err)
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGIN COM GOOGLE
  // ============================================================

  const handleGoogle = async () => {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const params =
        returnTo && returnTo !== "/"
          ? `?returnTo=${encodeURIComponent(
              returnTo
            )}`
          : "";

      const redirectUrl =
        `${window.location.origin}/login${params}`;

      const {
        error: googleError,
      } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

      if (googleError) {
        throw googleError;
      }
    } catch (err) {
      console.error(
        "Erro no login com Google:",
        err
      );

      setError(
        err?.message ||
          "Não foi possível entrar com o Google."
      );

      setLoading(false);
    }
  };

  // ============================================================
  // CADASTRO
  // ============================================================

  const registerUrl =
    returnTo && returnTo !== "/"
      ? `/register?returnTo=${encodeURIComponent(
          returnTo
        )}`
      : "/register";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AuthLayout
      icon={LogIn}
      title="Bem-vindo de volta"
      subtitle="Faça login na sua conta."
      footer={
        <>
          Não tem uma conta?{" "}
          <Link
            to={registerUrl}
            className="text-primary font-medium hover:underline"
          >
            Crie uma.
          </Link>
        </>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5 mr-2" />
        )}

        Continuar com o Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>

        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">
            ou
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail
          </Label>

          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="você@exemplo.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="pl-10 h-12"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              Senha
            </Label>

            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="pl-10 h-12"
              disabled={loading}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            "Conecte-se"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
