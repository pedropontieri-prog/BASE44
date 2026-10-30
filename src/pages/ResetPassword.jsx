import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);

  useEffect(() => {
    let active = true;

    const checkRecoverySession = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const type = hash.get("type");
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!active) return;

        setValidLink(type === "recovery" || Boolean(data.session));
        if (!type && !data.session) {
          setError("O link de recuperação é inválido ou expirou. Solicite outro link.");
        }
      } catch (err) {
        if (active) setError(err?.message || "Não foi possível validar o link de recuperação.");
      } finally {
        if (active) setChecking(false);
      }
    };

    checkRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;
      await supabase.auth.signOut();
      navigate("/login", { replace: true, state: { message: "Sua senha foi redefinida. Entre com a nova senha." } });
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      setError(err?.message || "Não foi possível redefinir a senha. Solicite um novo link.");
    } finally {
      setLoading(false);
    }
  };

  if (checking || !validLink) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={checking ? "Validando link" : "Link inválido"}
        subtitle={checking ? "Aguarde enquanto verificamos seu link" : "O link de recuperação não é válido"}
        footer={<Link to="/forgot-password" className="text-primary font-medium hover:underline">Solicitar outro link</Link>}
      >
        <div className="text-sm text-foreground text-center">{checking ? "Verificando..." : error || "Solicite um novo link de recuperação."}</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Nova senha"
      subtitle="Defina uma nova senha para sua conta"
      footer={<Link to="/login" className="text-primary font-medium hover:underline">Voltar para entrar</Link>}
    >
      {error && <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" type="password" autoComplete="new-password" autoFocus placeholder="Mínimo de 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12" required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="Digite novamente" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12" required minLength={6} />
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Redefinir senha"}
        </Button>
      </form>
    </AuthLayout>
  );
}
