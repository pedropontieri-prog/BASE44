import React, { useState } from 'react';
import { Shield, Lock, Eye, Trash2, Bell, KeyRound, LogOut, Cookie, FileText, Check } from 'lucide-react';
import PageShell from '@/components/PageShell';

const sections = [
  { icon: Eye, title: 'Quais dados coletamos', body: 'Coletamos apenas o necessário para o funcionamento da plataforma: nome, e-mail, dados de agendamento e, para profissionais, informações de registro (CRP). Não coletamos dados sensíveis de saúde além do que você compartilha voluntariamente com seu psicólogo.' },
  { icon: Shield, title: 'Por que coletamos', body: 'Para conectar você a profissionais, confirmar agendamentos, verificar registros profissionais e cumprir obrigações legais. Cada dado tem uma finalidade clara.' },
  { icon: Lock, title: 'Como protegemos', body: 'Tráfego criptografado (TLS), senhas armazenadas com hash, salas de videochamada privadas e sem gravação automática. Acesso restrito a pessoas autorizadas.' },
  { icon: Eye, title: 'Quem pode acessar', body: 'Apenas você, o profissional com quem você agenda e a equipe do EntreNós em casos específicos e justificados. Nunca vendemos seus dados.' },
  { icon: Trash2, title: 'Como excluir a conta', body: 'Você pode solicitar a exclusão da sua conta a qualquer momento pela central de privacidade. Seus dados serão removidos conforme a LGPD.' },
  { icon: FileText, title: 'LGPD', body: 'Seguimos a Lei Geral de Proteção de Dados (Lei 13.709/2018). Você tem direito de acesso, correção, portabilidade e exclusão dos seus dados.' },
  { icon: Cookie, title: 'Política de cookies', body: 'Usamos cookies essenciais para o funcionamento. Cookies analíticos são opcionais e podem ser desativados nas preferências.' },
  { icon: Lock, title: 'Segurança da videochamada', body: 'As salas são privadas, criptografadas e não gravam áudio ou vídeo automaticamente. Qualquer gravação futura exigirá consentimento explícito das partes.' },
];

export default function Privacy() {
  const [tab, setTab] = useState('overview');
  const [consents, setConsents] = useState({ email: true, platform: true, analytics: false });
  const [sessions] = useState([{ device: 'Chrome · Windows', loc: 'São Paulo, BR', current: true }, { device: 'Safari · iPhone', loc: 'Rio de Janeiro, BR', current: false }]);

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="w-14 h-14 rounded-2xl gradient-brand mx-auto flex items-center justify-center shadow-glow"><Shield size={26} className="text-white" /></div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-heading font-bold">Privacidade pensada desde o primeiro acesso</h1>
          <p className="mt-3 text-muted-foreground">Transparência simples sobre seus dados. Você no controle, sempre.</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[['overview','Visão geral'],['center','Central de privacidade'],['consent','Consentimentos'],['sessions','Sessões ativas']].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tab===k ? 'gradient-brand text-white shadow-soft' : 'glass-strong hover:bg-white'}`}>{l}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid sm:grid-cols-2 gap-5">
            {sections.map((s, i) => (
              <div key={i} className="card-elevated p-6 animate-fade-up" style={{animationDelay:`${i*60}ms`}}>
                <div className="w-10 h-10 rounded-xl gradient-brand-soft flex items-center justify-center text-primary mb-4"><s.icon size={18} /></div>
                <h3 className="font-heading font-semibold text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'center' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { icon: Eye, title: 'Visualizar meus dados', desc: 'Veja todas as informações que temos sobre você.' },
              { icon: KeyRound, title: 'Alterar senha', desc: 'Mantenha sua conta segura.' },
              { icon: Trash2, title: 'Solicitar exclusão da conta', desc: 'Removeremos seus dados conforme a LGPD.', danger: true },
            ].map((a, i) => (
              <div key={i} className="card-elevated p-5 flex items-center justify-between animate-fade-up" style={{animationDelay:`${i*60}ms`}}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.danger?'bg-red-50 text-red-500 dark:bg-red-500/10':'gradient-brand-soft text-primary'}`}><a.icon size={18} /></div>
                  <div><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p></div>
                </div>
                <button className={`text-xs font-medium px-4 py-2 rounded-full transition-all ${a.danger?'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10':'text-primary hover:bg-violet-soft'}`}>Acessar</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'consent' && (
          <div className="card-elevated p-6 max-w-2xl mx-auto">
            <h3 className="font-heading font-semibold mb-1">Gerenciar consentimentos</h3>
            <p className="text-xs text-muted-foreground mb-5">Você pode mudar sua escolha a qualquer momento.</p>
            <div className="space-y-4">
              {[['email','Notificações por e-mail','Lembretes de consulta e confirmações'],['platform','Notificações na plataforma','Avisos dentro do EntreNós'],['analytics','Dados analíticos opcionais','Ajude-nos a melhorar (anônimo)']].map(([k,t,d]) => (
                <div key={k} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium">{t}</p><p className="text-xs text-muted-foreground mt-0.5">{d}</p></div>
                  <button onClick={()=>setConsents({...consents,[k]:!consents[k]})} className={`w-12 h-7 rounded-full transition-all relative ${consents[k]?'gradient-brand':'bg-muted'}`}>
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${consents[k]?'left-6':'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold"><Check size={15} /> Salvar preferências</button>
          </div>
        )}

        {tab === 'sessions' && (
          <div className="card-elevated p-6 max-w-2xl mx-auto">
            <h3 className="font-heading font-semibold mb-1">Sessões ativas</h3>
            <p className="text-xs text-muted-foreground mb-5">Dispositivos conectados à sua conta.</p>
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-3">
                    <LogOut size={18} className="text-primary" />
                    <div><p className="text-sm font-medium">{s.device}</p><p className="text-xs text-muted-foreground">{s.loc}</p></div>
                  </div>
                  {s.current ? <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">Atual</span>
                    : <button className="text-xs text-red-500 font-medium hover:underline">Encerrar</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
