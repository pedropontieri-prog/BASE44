```jsx
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";

// ==================== PÁGINAS ====================

import Home from "@/pages/Home";
import FindPsychologist from "@/pages/FindPsychologist";
import PsychologistProfile from "@/pages/PsychologistProfile";
import VideoCall from "@/pages/VideoCall";
import PatientDashboard from "@/pages/PatientDashboard";
import Journal from "@/pages/Journal";
import Triage from "@/pages/Triage";
import Privacy from "@/pages/Privacy";
import BookingConfirmation from "@/pages/BookingConfirmation";

import ProfessionalOnboarding from "@/pages/ProfessionalOnboarding";
import PsychologistDashboard from "@/pages/PsychologistDashboard";
import AdminVerification from "@/pages/AdminVerification";

import Favorites from "@/pages/Favorites";
import Notifications from "@/pages/Notifications";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

// ==================== LOADING ====================

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-9 h-9 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />

        <p className="text-sm text-muted-foreground">
          Carregando...
        </p>
      </div>
    </div>
  );
}

// ==================== ROTAS PROTEGIDAS ====================

function ProtectedRoutes() {
  return (
    <Route
      element={
        <ProtectedRoute
          unauthenticatedElement={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      }
    >
      {/* ==================== PACIENTE ==================== */}

      <Route
        path="/agendamento"
        element={<BookingConfirmation />}
      />

      <Route
        path="/painel"
        element={<PatientDashboard />}
      />

      <Route
        path="/diario"
        element={<Journal />}
      />

      <Route
        path="/favoritos"
        element={<Favorites />}
      />

      <Route
        path="/notificacoes"
        element={<Notifications />}
      />

      {/* ==================== PROFISSIONAL ==================== */}

      <Route
        path="/cadastro-profissional"
        element={<ProfessionalOnboarding />}
      />

      <Route
        path="/painel-profissional"
        element={<PsychologistDashboard />}
      />

      {/* ==================== ADMIN ==================== */}

      <Route
        path="/verificacao"
        element={<AdminVerification />}
      />
    </Route>
  );
}

// ==================== APLICAÇÃO AUTENTICADA ====================

function AuthenticatedApp() {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
  } = useAuth();

  // Aguarda a verificação da sessão
  // antes de renderizar as páginas.
  if (
    isLoadingAuth ||
    isLoadingPublicSettings
  ) {
    return <LoadingScreen />;
  }

  // Usuário não cadastrado
  if (
    authError?.type === "user_not_registered"
  ) {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* ==================== AUTENTICAÇÃO ==================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* ==================== PÁGINAS PÚBLICAS ==================== */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/encontrar"
        element={<FindPsychologist />}
      />

      <Route
        path="/psicologo/:id"
        element={<PsychologistProfile />}
      />

      <Route
        path="/triagem"
        element={<Triage />}
      />

      <Route
        path="/videochamada"
        element={<VideoCall />}
      />

      <Route
        path="/privacidade"
        element={<Privacy />}
      />

      {/* ==================== ROTAS PROTEGIDAS ==================== */}

      <ProtectedRoutes />

      {/* ==================== 404 ==================== */}

      <Route
        path="*"
        element={<PageNotFound />}
      />
    </Routes>
  );
}

// ==================== APP ====================

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider
        client={queryClientInstance}
      >
        <Router>
          <ScrollToTop />

          <AuthenticatedApp />
        </Router>

        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
```
