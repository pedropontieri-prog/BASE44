import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Video, CalendarCheck, Lock, BadgeCheck, Sparkles, Clock, MapPin, MessageCircle } from 'lucide-react';
import PageShell from '@/components/PageShell';
import PsychologistCard from '@/components/PsychologistCard';
import { base44 } from '@/api/base44Client';

const trustBadges = [
  { icon: BadgeCheck, title: 'Profissionais verificados', desc: 'CRP e informações revisados pelo EntreNós' },
  { icon: Video, title: 'Atendimento online e presencial', desc: 'Escolha a modalidade que faz sentido para você' },
  { icon: CalendarCheck, title: 'Agendamento simplificado', desc: 'Veja horários disponíveis em tempo real' },
  { icon: Lock, title: 'Privacidade em primeiro lugar', desc: 'Seus dados protegidos, do primeiro acesso' },
];

const steps = [
  { n: '01', title: 'Encontre um profissional', desc: 'Busque por especialidade, abordagem ou modalidade. Sem julgamento.' },
  { n: '02', title: 'Agende no seu ritmo', desc: 'Escolha data, horário e modalidade. Você no controle.' },
  { n: '03', title: 'Converse com segurança', desc: 'Entre em uma sala privada e criptografada, direto pela plataforma.' },
];

export default function Home() {
  const [psychologists, setPsychologists] = useState([]);

  useEffect(() => {
    base44.entities.Psychologist.filter({ verification_status: 'approved' }, '-rating', 3)
      .then(setPsychologists)
      .catch(() => setPsychologists([]));
  }, []);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[600px] gradient-brand-soft opacity-70 blur-3xl rounded-full" />
          <div className="absolute top-40 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-accent/15 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-primary animate-fade-up">
              <Sparkles size={14} /> Cuidado psicológico com mais presença
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-[1.05] animate-fade-up" style={{ animationDelay: '80ms' }}>
              Encontre um profissional <br className="hidden sm:block" />
              para conversar, <span className="gradient-text">online ou presencialmente</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '160ms' }}>
              Você não precisa ter todas as respostas agora. Aqui seus dados estão seguros e você encontra profissionais de verdade, com CRP verificado.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
              <Link to="/encontrar" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full gradient-brand text-white font-semibold shadow-glow hover:scale-[1.02] transition-all duration-300">
                Encontrar psicólogo <ArrowRight size={18} />
              </Link>
              <Link to="/triagem" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full glass-strong font-semibold hover:bg-white transition-all duration-300">
                <MessageCircle size={18} /> Não sei por onde começar
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1.5 animate-fade-up" style={{ animationDelay: '320ms' }}>
              <Lock size={12} /> Plataforma criptografada · Conforme a LGPD · Sem gravação automática
            </p>
          </div>

          {/* Floating glass card preview */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '400ms' }}>
            <div className="glass-strong rounded-3xl p-2 shadow-glow">
              <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-violet-soft/40 to-accent/10 aspect-[16/9] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-3xl gradient-brand mx-auto flex items-center justify-center shadow-glow animate-float">
                      <Video size={36} className="text-white" />
                    </div>
                    <p className="mt-5 font-heading font-semibold text-lg">Sala de videochamada privada</p>
                    <p className="text-sm text-muted-foreground mt-1">"Esta é uma sala privada do EntreNós."</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" /> Conexão segura
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-2 rounded-full glass-strong">
                  {[Video, 'mic', 'volume', 'x'].map((I, i) => (
                    <span key={i} className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-foreground/70">
                      {typeof I === 'string' ? <span className="text-xs">{I === 'mic' ? '🎤' : I === 'volume' ? '🔊' : '✕'}</span> : <I size={16} />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trustBadges.map((b, i) => (
            <div key={i} className="card-elevated p-6 hover:shadow-glow transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-11 h-11 rounded-2xl gradient-brand-soft flex items-center justify-center text-primary mb-4">
                <b.icon size={20} />
              </div>
              <h3 className="font-heading font-semibold text-sm">{b.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Como funciona</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold">Comece no seu ritmo</h2>
          <p className="mt-4 text-muted-foreground">Três passos simples. Sem pressa, sem julgamento.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative card-elevated p-7 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <span className="text-5xl font-heading font-bold gradient-text opacity-30">{s.n}</span>
              <h3 className="mt-3 font-heading font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video call section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl overflow-hidden glass-strong p-8 lg:p-12 relative">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="grid lg:grid-cols-2 gap-10 items-center relative">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Atendimento por videochamada</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold">Uma sala privada, direto pela plataforma</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Paciente e psicólogo entram em uma sala virtual segura sem sair do EntreNós. Câmera e microfone sob seu controle, chat privado durante a consulta e tela de espera até o profissional entrar.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Ativar/desativar câmera e microfone a qualquer momento',
                  'Chat privado durante a consulta',
                  'Entre na sala alguns minutos antes',
                  'Nenhuma gravação automática de áudio ou vídeo',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="hsl(160 84% 39%)" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link to="/videochamada" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all">
                Ver como funciona <ArrowRight size={17} />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden bg-foreground aspect-[4/3] relative shadow-glow">
                <div className="absolute inset-0 gradient-brand opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video size={56} className="text-white/90" />
                </div>
                <div className="absolute bottom-3 right-3 w-28 h-20 rounded-xl bg-card border-2 border-white/40 overflow-hidden flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Você</span>
                </div>
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass-strong text-xs font-medium text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" /> Ao vivo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured psychologists */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Profissionais</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold">Pessoas reais, prontas para conversar</h2>
          </div>
          <Link to="/encontrar" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>
        {psychologists.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {psychologists.map((p, i) => <PsychologistCard key={p.id} psychologist={p} index={i} />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2].map(i => <div key={i} className="card-elevated p-5 h-56 animate-shimmer rounded-2xl" />)}
          </div>
        )}
      </section>

      {/* Privacy banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <div className="rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-brand opacity-90 -z-10" />
          <ShieldCheck size={40} className="text-white mx-auto" />
          <h2 className="mt-5 text-2xl sm:text-3xl font-heading font-bold text-white">Privacidade pensada desde o primeiro acesso</h2>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">Sabemos quais dados coletamos, por quê, e como os protegemos. Você no controle do seu consentimento.</p>
          <Link to="/privacidade" className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary font-semibold hover:scale-[1.02] transition-transform">
            Conhecer nossa central de privacidade <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
