import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const returnTo = safeReturnTo();

  /*
   * Quando o Google termina a autenticação, o Supabase
   * retorna para /login.
   *
   * Aqui verificamos se já existe uma sessão e,
   * se existir, mandamos o usuário para o destino correto.
   */
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted || !session?.user) {
          return;
        }

        const destination =
          returnTo && returnTo !== "/"
            ? returnTo
            : "/painel";

        navigate(destination, { replace: true });
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user
      ) {
        const destination =
          returnTo && returnTo !== "/"
            ? returnTo
            : "/painel";

        navigate(destination, { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, returnTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        setError("Digite seu e-mail e sua senha.");
        return;
      }

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error("Não foi possível identificar o usuário.");
      }

      const destination =
        returnTo && returnTo !== "/"
          ? returnTo
          : "/painel";

      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Erro no login:", err);

      const message = String(err?.message || "").toLowerCase();

      if (
        message.includes("invalid login credentials") ||
        message.includes("invalid login")
      ) {
        setError("E-mail ou senha incorretos.");
      } else if (
        message.includes("email not confirmed") ||
        message.includes("email_not_confirmed")
      ) {
        setError(
          "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada."
        );
      } else if (message.includes("too many requests")) {
        setError(
          "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );
      } else {
        setError(
          err?.message || "Não foi possível entrar. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      /*
       * Depois do Google, voltamos para /login.
       * O useEffect acima detecta a sessão e envia
       * automaticamente para /painel.
       */
      const params =
        returnTo && returnTo !== "/"
          ? `?returnTo=${encodeURIComponent(returnTo)}`
          : "";

      const redirectUrl =
        `${window.location.origin}/login${params}`;

      const { error: googleError } =
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
      console.error("Erro no login com Google:", err);

      setError(
        err?.message || "Não foi possível entrar com o Google."
      );

      setLoading(false);
    }
  };

  const registerUrl =
    "/register" +
    (returnTo && returnTo !== "/"
      ? `?returnTo=${encodeURIComponent(returnTo)}`
      : "");

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>

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
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>

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
              onChange={(e) => setPassword(e.target.value)}
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
