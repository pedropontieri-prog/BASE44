import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { supabase } from "@/lib/supabase";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const returnTo = safeReturnTo();

const handleSubmit = async (e) => {
e.preventDefault();

setError("");
setLoading(true);

try {
  const { error: supabaseError } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

  if (supabaseError) {
    throw supabaseError;
  }

  window.location.href = returnTo;
} catch (err) {
  console.error("Erro no login:", err);

  const message = err?.message?.toLowerCase() || "";

  if (message.includes("invalid login credentials")) {
    setError("E-mail ou senha incorretos.");
  } else if (message.includes("email not confirmed")) {
    setError(
      "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada."
    );
  } else {
    setError(
      err?.message || "Não foi possível fazer login."
    );
  }
} finally {
  setLoading(false);
}
};

const handleGoogle = async () => {
setError("");
setLoading(true);

try {
  const redirectUrl = `${window.location.origin}${returnTo}`;

  const { error: supabaseError } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

  if (supabaseError) {
    throw supabaseError;
  }
} catch (err) {
  console.error("Erro no login com Google:", err);

  setError(
    err?.message ||
      "Não foi possível entrar com o Google."
  );

  setLoading(false);
}
};

return (
<AuthLayout
icon={LogIn}
title="Bem-vindo de volta"
subtitle="Entre na sua conta"
footer={
<>
Ainda não tem uma conta?{" "}
<Link
to={
"/register" +
(returnTo !== "/"
? "?returnTo=" +
encodeURIComponent(returnTo)
: "")
}
className="text-primary font-medium hover:underline"
>
Criar conta
</Link>
</>
}
>
<Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle} disabled={loading} >
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

  <form onSubmit={handleSubmit} className="space-y-4">
