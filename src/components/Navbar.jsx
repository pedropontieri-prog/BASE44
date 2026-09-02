import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart } from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { label: 'Início', path: '/' },
  { label: 'Encontrar psicólogo', path: '/encontrar' },
  { label: 'Não sei por onde começar', path: '/triagem' },
  { label: 'Privacidade', path: '/privacidade' },
  { label: 'Sou profissional', path: '/cadastro-profissional' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong shadow-soft' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="EntreNós início">
          <Logo />
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${location.pathname === l.path ? 'text-primary bg-primary/10' : 'text-foreground/70 hover:text-foreground hover:bg-muted'}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Entrar
          </Link>
          <Link to="/register" className="px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
            Criar conta
          </Link>
        </div>

        <button className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden glass-strong border-t border-border animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(l => (
              <Link key={l.path} to={l.path} className={`block px-4 py-3 rounded-xl text-sm font-medium ${location.pathname === l.path ? 'text-primary bg-primary/10' : 'text-foreground/80 hover:bg-muted'}`}>
                {l.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border flex gap-3">
              <Link to="/login" className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-medium border border-border">Entrar</Link>
              <Link to="/register" className="flex-1 text-center px-4 py-3 rounded-xl gradient-brand text-white text-sm font-semibold">Criar conta</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
