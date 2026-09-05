import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  // Contador do botão "Reenviar"
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) =>
        prev <= 1 ? 0 : prev - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Informe seu e-mail.");
      return;
    }

    if (password.length < 6) {
      setError(
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: "",
              role: "patient",
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      /*
       * IMPORTANTE:
       *
       * Depois do cadastro, mostramos a tela do código.
       *
       * Isso funciona tanto quando o Supabase exige
       * confirmação de e-mail quanto quando ele retorna
       * uma sessão.
       */
      setEmail(normalizedEmail);
      setOtpCode("");
      setShowOtp(true);

      // O primeiro código já foi enviado pelo signUp.
      setResendCooldown(60);

      toast({
        title: "Código enviado",
        description:
          "Confira seu e-mail e digite o código de 6 dígitos.",
      });
    } catch (err) {
      console.error("Erro ao cadastrar:", err);

      setError(
        err?.message ||
          "Não foi possível criar sua conta."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedOtp = otpCode.trim();

    if (normalizedOtp.length !== 6) {
      setError(
        "Digite o código de 6 dígitos enviado para seu e-mail."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } =
        await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: normalizedOtp,
          type: "signup",
        });

      if (verifyError) {
        throw verifyError;
      }

      /*
       * Depois da confirmação, o Supabase normalmente
       * retorna uma sessão.
       */
      if (!data.session) {
        // Mesmo sem sessão, o e-mail pode ter sido confirmado.
        toast({
          title: "E-mail confirmado!",
          description:
            "Sua conta foi confirmada. Faça login para continuar.",
        });

        window.location.href = safeReturnTo();
        return;
      }

      toast({
        title: "Conta confirmada!",
        description:
          "Sua conta foi criada com sucesso.",
      });

      window.location.href = safeReturnTo();
    } catch (err) {
      console.error(
        "Erro ao verificar código:",
        err
      );

      setError(
        err?.message ||
          "Código inválido ou expirado."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || resendCooldown > 0) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const normalizedEmail =
        email.trim().toLowerCase();

      const { error: resendError } =
        await supabase.auth.resend({
          type: "signup",
          email: normalizedEmail,
        });

      if (resendError) {
        throw resendError;
      }

      setResendCooldown(60);

      toast({
        title: "Código reenviado",
        description:
          "Confira seu e-mail para receber o novo código.",
      });
    } catch (err) {
      console.error(
        "Erro ao reenviar código:",
        err
      );

      const message =
        err?.message?.toLowerCase() || "";

      if (
        message.includes("security") ||
        message.includes("after") ||
        message.includes("rate limit") ||
        message.includes("too many")
      ) {
        setError(
          "Aguarde alguns segundos antes de solicitar outro código."
        );
      } else {
        setError(
          err?.message ||
            "Não foi possível reenviar o código."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");

    try {
      const returnTo = safeReturnTo();

      const redirectUrl =
        `${window.location.origin}/login` +
        (returnTo !== "/"
          ? `?returnTo=${encodeURIComponent(
              returnTo
            )}`
          : "");

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      console.error(
        "Erro no login com Google:",
        err
      );

      setError(
        err?.message ||
          "Não foi possível continuar com o Google."
      );
    }
  };

  /*
   * TELA DE CONFIRMAÇÃO DO E-MAIL
   */
  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Confirme seu e-mail"
        subtitle={`Enviamos um código de 6 dígitos para ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={(value) => {
              setOtpCode(value);
              setError("");
            }}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={
            loading ||
            otpCode.length !== 6
          }
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            "Confirmar e-mail"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Não recebeu o código?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={
              loading ||
              resendCooldown > 0
            }
            className="text-primary font-medium hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0
              ? `Reenviar em ${resendCooldown}s`
              : "Reenviar"}
          </button>
        </p>

        <button
          type="button"
          onClick={() => {
            setShowOtp(false);
            setOtpCode("");
            setError("");
            setResendCooldown(0);
          }}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar
        </button>
      </AuthLayout>
    );
  }

  /*
   * TELA DE CADASTRO
   */
  return (
    <AuthLayout
      icon={UserPlus}
      title="Crie sua conta"
      subtitle="Cadastre-se para começar"
      footer={
        <>
          Já possui uma conta?{" "}
          <Link
            to={
              "/login" +
              (safeReturnTo() !== "/"
                ? `?returnTo=${encodeURIComponent(
                    safeReturnTo()
                  )}`
                : "")
            }
            className="text-primary font-medium hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
        disabled={loading}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continuar com Google
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
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
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
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Senha
          </Label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="pl-10 h-12"
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">
            Confirmar senha
          </Label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className="pl-10 h-12"
              required
              minLength={6}
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
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
