import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Cuidado psicológico humano, seguro e acessível. Conecte-se a profissionais verificados.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Shield size={14} /> LGPD</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock size={14} /> Criptografia</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/encontrar" className="hover:text-primary transition-colors">Encontrar psicólogo</Link></li>
              <li><Link to="/triagem" className="hover:text-primary transition-colors">Não sei por onde começar</Link></li>
              <li><Link to="/videochamada" className="hover:text-primary transition-colors">Videochamada</Link></li>
              <li><Link to="/painel" className="hover:text-primary transition-colors">Meu painel</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Confiança</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link></li>
              <li><Link to="/seguranca" className="hover:text-primary transition-colors">Segurança</Link></li>
              <li><Link to="/lgpd" className="hover:text-primary transition-colors">LGPD</Link></li>
              <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de uso</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Para profissionais</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/cadastro-profissional" className="hover:text-primary transition-colors">Cadastrar-se</Link></li>
              <li><Link to="/painel-profissional" className="hover:text-primary transition-colors">Painel do psicólogo</Link></li>
              <li><Link to="/verificacao" className="hover:text-primary transition-colors">Verificação CRP</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 EntreNós. Plataforma de conexão em saúde mental. Não substitui atendimento de emergência.</p>
        </div>
      </div>
    </footer>
  );
}
