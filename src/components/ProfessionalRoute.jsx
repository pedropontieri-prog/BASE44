import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function ProfessionalRoute() {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    authChecked,
    checkUserAuth
  } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(
    user?.role ||
      user?.user_metadata?.role ||
      user?.user_metadata?.account_type ||
      user?.user_metadata?.user_type ||
      ""
  );

  const professionalRoles = [
    "professional",
    "profissional",
    "psychologist",
    "psicologo"
  ];

  if (!professionalRoles.includes(role)) {
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
}
