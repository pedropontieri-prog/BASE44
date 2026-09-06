import { useEffect } from "react";
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
  }, [
    authChecked,
    isLoadingAuth,
    checkUserAuth,
  ]);

  if (isLoadingAuth || !authChecked) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const roles = [
    user?.role,
    user?.user_metadata?.role,
    user?.user_metadata?.account_type,
    user?.user_metadata?.user_type,
    user?.user_metadata?.profile_type,
    user?.raw_user_meta_data?.role,
    user?.raw_user_meta_data?.account_type,
  ]
    .filter(Boolean)
    .map(normalizeRole);

  const professionalRoles = [
    "professional",
    "profissional",
    "psychologist",
    "psicologo",
  ];

  const isProfessional = roles.some((role) =>
    professionalRoles.includes(role)
  );

  if (!isProfessional) {
    return (
      <Navigate
        to="/painel"
        replace
      />
    );
  }

  return <Outlet />;
}
