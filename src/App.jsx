import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from '@/pages/Home';
import FindPsychologist from '@/pages/FindPsychologist';
import PsychologistProfile from '@/pages/PsychologistProfile';
import VideoCall from '@/pages/VideoCall';
import PatientDashboard from '@/pages/PatientDashboard';
import Triage from '@/pages/Triage';
import Privacy from '@/pages/Privacy';
import BookingConfirmation from '@/pages/BookingConfirmation';
import ProfessionalOnboarding from '@/pages/ProfessionalOnboarding';
import PsychologistDashboard from '@/pages/PsychologistDashboard';
import AdminVerification from '@/pages/AdminVerification';
import Favorites from '@/pages/Favorites';
import Notifications from '@/pages/Notifications';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
    {/* Auth */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    {/* Public */}
    <Route path="/" element={<Home />} />
    <Route path="/encontrar" element={<FindPsychologist />} />
    <Route path="/psicologo/:id" element={<PsychologistProfile />} />
    <Route path="/triagem" element={<Triage />} />
    <Route path="/videochamada" element={<VideoCall />} />
    <Route path="/privacidade" element={<Privacy />} />
    {/* Authenticated */}
    <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
      <Route path="/agendamento" element={<BookingConfirmation />} />
      <Route path="/painel" element={<PatientDashboard />} />
      <Route path="/cadastro-profissional" element={<ProfessionalOnboarding />} />
      <Route path="/painel-profissional" element={<PsychologistDashboard />} />
      <Route path="/verificacao" element={<AdminVerification />} />
      <Route path="/favoritos" element={<Favorites />} />
      <Route path="/notificacoes" element={<Notifications />} />
    </Route>
    <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
