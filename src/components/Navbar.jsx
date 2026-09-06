import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Heart,
  Bell,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Encontrar psicólogo", path: "/encontrar" },
  { label: "Não sei por onde começar", path: "/triagem" },
  { label: "Privacidade", path: "/privacidade" },
];

const normalizeRole = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const isProfessionalRole = (value) => {
  const role = normalizeRole(value);

  return [
    "professional",
    "profissional",
    "psychologist",
    "psicologo",
  ].includes(role);
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const location = useLocation();

  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isProfessional =
    isProfessionalRole(user?.role) ||
    isProfessionalRole(user?.user_metadata?.role) ||
    isProfessionalRole(user?.user_metadata?.account_type) ||
    isProfessionalRole(user?.user_metadata?.user_type) ||
    isProfessionalRole(user?.user_metadata?.profile_type);

  const painelPath = isProfessional
    ? "/painel-profissional"
    : "/painel";

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-strong shadow-soft"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center"
          aria-label="EntreNós início"
        >
          <img
            src="/logo.png"
            alt="EntreNós"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                location.pathname === link.path
                  ? "text-primary bg-primary/10"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {!isAuthenticated && (
            <Link
              to="/cadastro-profissional"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                location.pathname === "/cadastro-profissional"
                  ? "text-primary bg-primary/10"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              Sou profissional
            </Link>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {!isProfessional && (
                <>
                  <Link
                    to="/favoritos"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    title="Favoritos"
                    aria-label="Favoritos"
                  >
                    <Heart size={19} />
                  </Link>

                  <Link
                    to="/notificacoes"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    title="Notificações"
                    aria-label="Notificações"
                  >
                    <Bell size={19} />
                  </Link>
                </>
              )}

              {isProfessional && (
                <>
                  <Link
                    to="/notificacoes"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    title="Notificações"
                    aria-label="Notificações"
                  >
                    <Bell size={19} />
                  </Link>
                </>
              )}

              <Link
                to={painelPath}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
              >
                <LayoutDashboard size={17} />
                {isProfessional
                  ? "Painel profissional"
                  : "Meu painel"}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                <LogOut size={17} />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                Entrar
              </Link>

              <Link
                to="/register"
                className="px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden glass-strong border-t border-border animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 rounded-xl text-sm font-medium ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-foreground/80 hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <Link
                to="/cadastro-profissional"
                className="block px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted"
              >
                Sou profissional
              </Link>
            )}

            {isAuthenticated && (
              <div className="pt-3 border-t border-border space-y-1">
                <Link
                  to={painelPath}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted"
                >
                  <LayoutDashboard size={18} />
                  {isProfessional
                    ? "Painel profissional"
                    : "Meu painel"}
                </Link>

                {!isProfessional && (
                  <Link
                    to="/favoritos"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted"
                  >
                    <Heart size={18} />
                    Favoritos
                  </Link>
                )}

                <Link
                  to="/notificacoes"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted"
                >
                  <Bell size={18} />
                  Notificações
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted text-left"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
