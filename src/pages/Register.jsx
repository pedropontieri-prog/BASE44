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

  // Tempo de espera para reenviar o código
  const [resendCooldown, setResendCooldown] = useState(0);

  // Contador regressivo do reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
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
      setError("A senha deve ter pelo menos 6 caracteres.");
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
       * Quando a confirmação de e-mail está ativada no Supabase,
       * o usuário recebe um código por e-mail.
       */
      if (data.user && !data.session) {
        setEmail(normalizedEmail);
        setShowOtp(true);

        // Começa o contador após o primeiro envio
        setResendCooldown(60);

        toast({
          title: "Código enviado",
          description:
            "Confira seu e-mail para confirmar sua conta.",
        });

        return;
      }

      /*
       * Se a confirmação de e-mail estiver desativada,
       * o Supabase já cria a sessão.
       */
      if (data.session) {
        window.location.href = safeReturnTo();
        return;
      }

      setEmail(normalizedEmail);
      setShowOtp(true);
      setResendCooldown(60);
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

    if (otpCode.length !== 6) {
      setError("Digite o código de 6 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } =
        await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpCode,
          type: "signup",
        });

      if (verifyError) {
        throw verifyError;
      }

      if (!data.session) {
        throw new Error(
          "E-mail confirmado, mas não foi possível iniciar sua sessão."
        );
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
    // Impede novas solicitações durante o cooldown
    if (resendCooldown > 0 || loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { error: resendError } =
        await supabase.auth.resend({
          type: "signup",
          email: email.trim().toLowerCase(),
        });

      if (resendError) {
        throw resendError;
      }

      // Começa novamente o contador de 60 segundos
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

      /*
       * Se o Supabase ainda estiver aplicando o limite,
       * mostra uma mensagem mais amigável.
       */
      if (
        err?.message?.toLowerCase().includes("security") ||
        err?.message?.toLowerCase().includes("after") ||
        err?.message?.toLowerCase().includes("rate limit")
      ) {
        setError(
          "Aguarde alguns segundos antes de solicitar um novo código."
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
          ? `?returnTo=${encodeURIComponent(returnTo)}`
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

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Confirme seu e-mail"
        subtitle={`Enviamos um código para ${email}`}
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
            onChange={setOtpCode}
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
