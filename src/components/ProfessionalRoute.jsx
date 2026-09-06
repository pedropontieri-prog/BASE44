```jsx
import { useEffect, useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white">
    <div
      className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"
      aria-label="Carregando"
    />
  </div>
);

const normalizeRole = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

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
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  // Ainda verificando a sessão
  if (isLoadingAuth || !authChecked) {
    return <LoadingScreen />;
  }

  // Não está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Tenta encontrar o tipo de conta em diferentes lugares.
   * Isso deixa o componente compatível com diferentes estruturas
   * do AuthContext/Supabase.
   */
  const role = useMemo(() => {
    return normalizeRole(
      user?.role ||
        user?.user_metadata?.role ||
        user?.user_metadata?.account_type ||
        user?.user_metadata?.user_type ||
        user?.raw_user_meta_data?.role ||
        user?.raw_user_meta_data?.account_type ||
        ""
    );
  }, [user]);

  // Tipos aceitos como profissional
  const professionalRoles = [
    "professional",
    "profissional",
    "psychologist",
    "psicologo",
  ];

  const isProfessional = professionalRoles.includes(role);

  // Está logado, mas não possui conta profissional
  if (!isProfessional) {
    return <Navigate to="/painel-paciente" replace />;
  }

  // É profissional
  return <Outlet />;
}
```
