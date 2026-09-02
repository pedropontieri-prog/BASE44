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
import Logo from "./Logo";
import { useAuth } from "@/lib/AuthContext";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Encontrar psicólogo", path: "/encontrar" },
  { label: "Não sei por onde começar", path: "/triagem" },
  { label: "Privacidade", path: "/privacidade" },
];

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

  /*
   * Define qual painel o usuário deve acessar.
   *
   * Profissional:
   * /painel-profissional
   *
   * Usuário comum:
   * /painel
   */
  const painelPath =
    user?.role === "psychologist"
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

        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center"
          aria-label="EntreNós início"
        >
          <Logo />
        </Link>

        {/* MENU DESKTOP */}
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

          {/* SOU PROFISSIONAL APENAS PARA QUEM NÃO ESTÁ LOGADO */}
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

        {/* ÁREA DO USUÁRIO DESKTOP */}
        <div className="hidden lg:flex items-center gap-3">

          {isAuthenticated ? (
            <>
              {/* FAVORITOS */}
              <Link
                to="/favoritos"
                className="p-2 rounded-full hover:bg-muted transition-colors"
                title="Favoritos"
                aria-label="Favoritos"
              >
                <Heart size={19} />
              </Link>

              {/* NOTIFICAÇÕES */}
              <Link
                to="/notificacoes"
                className="p-2 rounded-full hover:bg-muted transition-colors"
                title="Notificações"
                aria-label="Notificações"
              >
                <Bell size={19} />
              </Link>

              {/* MEU PAINEL */}
              <Link
                to={painelPath}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
              >
                <LayoutDashboard size={17} />
                Meu painel
              </Link>

              {/* SAIR */}
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
              {/* ENTRAR */}
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                Entrar
              </Link>

              {/* CRIAR CONTA */}
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        {/* BOTÃO MOBILE */}
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

      {/* MENU MOBILE */}
      {open && (
        <div className="lg:hidden glass-strong border-t border-border animate-fade-in">

          <div className="px-4 py-4 space-y-1">

            {/* LINKS PRINCIPAIS */}
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

            {/* MOBILE LOGADO */}
            {isAuthenticated ? (
              <div className="pt-3 border-t border-border space-y-1">

                {/* PAINEL */}
                <Link
                  to={painelPath}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted"
                >
                  <LayoutDashboard size={18} />
                  Meu painel
                </Link>

                {/* FAVORITOS */}
                <Link
                  to="/favoritos"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted"
                >
                  <Heart size={18} />
                  Favoritos
                </Link>

                {/* NOTIFICAÇÕES */}
                <Link
                  to="/notificacoes"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted"
                >
                  <Bell size={18} />
                  Notificações
                </Link>

                {/* SAIR */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted text-left"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            ) : (
              /* MOBILE NÃO LOGADO */
              <div className="pt-3 border-t border-border flex gap-3">

                <Link
                  to="/login"
                  className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-medium border border-border"
                >
                  Entrar
                </Link>

                <Link
                  to="/register"
                  className="flex-1 text-center px-4 py-3 rounded-xl gradient-brand text-white text-sm font-semibold"
                >
                  Criar conta
                </Link>

              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
