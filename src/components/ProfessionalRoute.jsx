import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

export default function ProfessionalRoute() {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    checkUserAuth,
  } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [
    authChecked,
    isLoadingAuth,
    checkUserAuth,
  ]);

  // Aguarda verificar a sessão
  if (isLoadingAuth || !authChecked) {
    return <LoadingScreen />;
  }

  // Usuário não está logado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Identifica o tipo da conta
  const role = String(
    user?.role ||
      user?.user_metadata?.role ||
      user?.user_metadata?.account_type ||
      user?.user_metadata?.user_type ||
      ""
  ).toLowerCase();

  // Verifica se é profissional
  const isProfessional =
    role === "professional" ||
    role === "profissional" ||
    role === "psychologist" ||
    role === "psicologo" ||
    role === "psicóloga" ||
    role === "psicologa";

  // Usuário logado, mas não é profissional
  if (!isProfessional) {
    return (
      <Navigate
        to="/painel-paciente"
        replace
      />
    );
  }

  // Usuário é profissional
  return <Outlet />;
}
