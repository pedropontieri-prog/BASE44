import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/AuthContext";
import PageShell from "@/components/PageShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfessionalRoute from "@/components/ProfessionalRoute";
import ScrollToTop from "@/components/ScrollToTop";

import Home from "@/pages/Home";
import FindPsychologist from "@/pages/FindPsychologist";
import PsychologistProfile from "@/pages/PsychologistProfile";
import Triage from "@/pages/Triage";
import VideoCall from "@/pages/VideoCall";
import Privacy from "@/pages/Privacy";
import ProfessionalOnboarding from "@/pages/ProfessionalOnboarding";
import BookingConfirmation from "@/pages/BookingConfirmation";
import PatientDashboard from "@/pages/PatientDashboard";
import Journal from "@/pages/Journal";
import Favorites from "@/pages/Favorites";
import Notifications from "@/pages/Notifications";
import PsychologistDashboard from "@/pages/PsychologistDashboard";
import AdminVerification from "@/pages/AdminVerification";

const queryClient = new QueryClient();

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ScrollToTop />

          <Routes>
            <Route
              path="/"
              element={
                <PageShell>
                  <Home />
                </PageShell>
              }
            />

            <Route
              path="/encontrar"
              element={
                <PageShell>
                  <FindPsychologist />
                </PageShell>
              }
            />

            <Route
              path="/psicologo/:id"
              element={
                <PageShell>
                  <PsychologistProfile />
                </PageShell>
              }
            />

            <Route
              path="/triagem"
              element={
                <PageShell>
                  <Triage />
                </PageShell>
              }
            />

            <Route
              path="/videochamada"
              element={
                <PageShell>
                  <VideoCall />
                </PageShell>
              }
            />

            <Route
              path="/privacidade"
              element={
                <PageShell>
                  <Privacy />
                </PageShell>
              }
            />

            <Route
              path="/cadastro-profissional"
              element={
                <PageShell>
                  <ProfessionalOnboarding />
                </PageShell>
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/agendamento"
                element={
                  <PageShell>
                    <BookingConfirmation />
                  </PageShell>
                }
              />

              <Route
                path="/painel"
                element={
                  <PageShell>
                    <PatientDashboard />
                  </PageShell>
                }
              />

              <Route
                path="/diario"
                element={
                  <PageShell>
                    <Journal />
                  </PageShell>
                }
              />

              <Route
                path="/favoritos"
                element={
                  <PageShell>
                    <Favorites />
                  </PageShell>
                }
              />

              <Route
                path="/notificacoes"
                element={
                  <PageShell>
                    <Notifications />
                  </PageShell>
                }
              />

              <Route
                path="/verificacao"
                element={
                  <PageShell>
                    <AdminVerification />
                  </PageShell>
                }
              />
            </Route>

            <Route element={<ProfessionalRoute />}>
              <Route
                path="/painel-profissional"
                element={
                  <PageShell>
                    <PsychologistDashboard />
                  </PageShell>
                }
              />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}
