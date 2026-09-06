import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Heart, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    {
      label: "Início",
      path: "/"
    },
    {
      label: "Encontrar psicólogo",
      path: "/encontrar"
    },
    {
      label: "Não sei por onde começar",
      path: "/triagem"
    },
    {
      label: "Privacidade",
      path: "/privacidade"
    }
  ];

  const painelPath =
    user?.role === "psychologist" ||
    user?.role === "psicologo" ||
    user?.role === "professional" ||
    user?.role === "profissional"
      ? "/painel-profissional"
      : "/painel";

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-2xl font-bold text-primary">EntreNós</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <Link
                to="/cadastro-profissional"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Sou profissional
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/favoritos"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Favoritos"
                >
                  <Heart className="h-5 w-5" />
                </Link>

                <Link
                  to="/notificacoes"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Notificações"
                >
                  <Bell className="h-5 w-5" />
                </Link>

                <Link
                  to={painelPath}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  <User className="h-5 w-5" />
                  Meu painel
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </nav>

          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t py-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm font-medium ${
                    isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!isAuthenticated ? (
                <Link
                  to="/cadastro-profissional"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-muted-foreground"
                >
                  Sou profissional
                </Link>
              ) : (
                <>
                  <Link
                    to="/favoritos"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    <Heart className="h-5 w-5" />
                    Favoritos
                  </Link>

                  <Link
                    to="/notificacoes"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    <Bell className="h-5 w-5" />
                    Notificações
                  </Link>

                  <Link
                    to={painelPath}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    <User className="h-5 w-5" />
                    Meu painel
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-left text-sm font-medium text-muted-foreground"
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
