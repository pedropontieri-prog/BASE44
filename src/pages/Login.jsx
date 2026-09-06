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

/**
 * ============================================================
 * DESTINO DO USUÁRIO
 * ============================================================
 *
 * A prioridade é:
 *
 * 1. Verificar se existe registro em public.psychologists
 *    para o usuário.
 *
 * 2. Verificar role/account_type/user_type do metadata.
 *
 * 3. Usar returnTo, se existir.
 *
 * 4. Fallback para /painel.
 *
 * Isso evita que um profissional seja enviado
 * incorretamente para o painel do paciente.
 */
const getUserDestination = async (user, returnTo) => {
  if (!user) {
    return "/login";
  }

  // ============================================================
  // 1. VERIFICAR SE É PROFISSIONAL PELO BANCO
  // ============================================================

  try {
    const {
      data: psychologist,
      error,
    } = await supabase
      .from("psychologists")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && psychologist) {
      console.log(
        "Usuário identificado como profissional pelo banco.",
        {
          userId: user.id,
          psychologistId: psychologist.id,
        }
      );

      return "/painel-profissional";
    }

    if (error) {
      console.warn(
        "Não foi possível verificar psychologists:",
        error
      );
    }
  } catch (err) {
    console.warn(
      "Erro ao consultar psychologists:",
      err
    );
  }

  // ============================================================
  // 2. VERIFICAR ROLE DO METADATA
  // ============================================================

  const metadata = user.user_metadata || {};

  const role = String(
    metadata.role ||
      metadata.account_type ||
      metadata.user_type ||
      ""
  )
    .trim()
    .toLowerCase();

  // ============================================================
  // PROFISSIONAL
  // ============================================================

  const professionalRoles = [
    "professional",
    "profissional",
    "psychologist",
    "psicologo",
    "psicóloga",
    "psicologa",
  ];

  if (professionalRoles.includes(role)) {
    return "/painel-profissional";
  }

  // ============================================================
  // PACIENTE
  // ============================================================

  const patientRoles = [
    "patient",
    "paciente",
    "user",
    "usuario",
    "usuário",
  ];

  if (patientRoles.includes(role)) {
    return "/painel-paciente";
  }

  // ============================================================
  // 3. RETURN TO
  // ============================================================

  if (
    returnTo &&
    returnTo !== "/" &&
    returnTo !== "/painel"
  ) {
    return returnTo;
  }

  // ============================================================
  // 4. FALLBACK
  // ============================================================

  return "/painel";
};

/**
 * ============================================================
 * COMPONENTE LOGIN
 * ============================================================
 */
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const returnTo = safeReturnTo();

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

        const destination =
          await getUserDestination(
            session.user,
            returnTo
          );

        if (!mounted) {
          return;
        }

        console.log(
          "Sessão existente detectada.",
          {
            userId: session.user.id,
            email: session.user.email,
            role:
              session.user.user_metadata?.role,
            accountType:
              session.user.user_metadata?.account_type,
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
      async (event, session) => {
        if (!mounted) {
          return;
        }

        if (
          (
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION"
          ) &&
          session?.user
        ) {
          /*
           * Pequeno atraso para garantir que o estado
           * da autenticação esteja disponível antes
           * da consulta ao banco.
           */
          setTimeout(async () => {
            if (!mounted) {
              return;
            }

            try {
              const destination =
                await getUserDestination(
                  session.user,
                  returnTo
                );

              if (!mounted) {
                return;
              }

              console.log(
                "Alteração de autenticação.",
                {
                  event,
                  userId: session.user.id,
                  role:
                    session.user.user_metadata
                      ?.role,
                  accountType:
                    session.user.user_metadata
                      ?.account_type,
                  destination,
                }
              );

              navigate(destination, {
                replace: true,
              });
            } catch (err) {
              console.error(
                "Erro ao definir destino:",
                err
              );
            }
          }, 100);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, returnTo]);

  // ============================================================
  // LOGIN COM E-MAIL E SENHA
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

      // ========================================================
      // LOGIN
      // ========================================================

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

      // ========================================================
      // CONFIRMAR SESSÃO
      // ========================================================

      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData?.session) {
        throw new Error(
          "Login realizado, mas a sessão não foi criada. Tente novamente."
        );
      }

      const user =
        sessionData.session.user;

      // ========================================================
      // IDENTIFICAR DESTINO
      // ========================================================

      const destination =
        await getUserDestination(
          user,
          returnTo
        );

      const metadata =
        user.user_metadata || {};

      const role = String(
        metadata.role ||
          metadata.account_type ||
          metadata.user_type ||
          ""
      )
        .trim()
        .toLowerCase();

      console.log(
        "Login realizado com sucesso.",
        {
          userId: user.id,
          email: user.email,
          role,
          metadata,
          destination,
        }
      );

      // ========================================================
      // REDIRECIONAR
      // ========================================================

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Erro no login:",
        err
      );

      const message =
        String(
          err?.message || ""
        ).toLowerCase();

      if (
        message.includes(
          "invalid login credentials"
        ) ||
        message.includes(
          "invalid login"
        )
      ) {
        setError(
          "E-mail ou senha incorretos."
        );
      } else if (
        message.includes(
          "email not confirmed"
        ) ||
        message.includes(
          "email_not_confirmed"
        )
      ) {
        setError(
          "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e confirme o código."
        );
      } else if (
        message.includes(
          "too many requests"
        )
      ) {
        setError(
          "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );
      } else if (
        message.includes(
          "network"
        )
      ) {
        setError(
          "Erro de conexão. Verifique sua internet e tente novamente."
        );
      } else {
        setError(
          err?.message ||
            "Não foi possível entrar. Tente novamente."
        );
      }
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
  // LINK DE CADASTRO
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
      {/* ======================================================
          GOOGLE
      ====================================================== */}

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? (
          <Loader2
            className="w-5 h-5 mr-2 animate-spin"
          />
        ) : (
          <GoogleIcon
            className="w-5 h-5 mr-2"
          />
        )}

        Continuar com o Google
      </Button>

      {/* ======================================================
          DIVISOR
      ====================================================== */}

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

      {/* ======================================================
          ERRO
      ====================================================== */}

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          {error}
        </div>
      )}

      {/* ======================================================
          FORMULÁRIO
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* ====================================================
            E-MAIL
        ==================================================== */}

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
                setEmail(
                  e.target.value
                )
              }
              className="pl-10 h-12"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* ====================================================
            SENHA
        ==================================================== */}

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
                setPassword(
                  e.target.value
                )
              }
              className="pl-10 h-12"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* ====================================================
            BOTÃO
        ==================================================== */}

        <Button
          type="submit"
          className="w-full h-12 font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2
                className="w-4 h-4 mr-2 animate-spin"
              />

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
