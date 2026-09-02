import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, MessageCircle, Info, Check } from 'lucide-react';
import PageShell from '@/components/PageShell';

const questions = [
  {
    key: 'reason',
    title: 'O que está te levando a buscar ajuda agora?',
    subtitle: 'Selecione tudo que fizer sentido. Não há resposta certa.',
    options: ['Ansiedade ou preocupação', 'Tristeza ou desânimo', 'Relacionamentos', 'Autoestima', 'Luto ou perda', 'Estresse ou sono', 'Não sei definir bem'],
    multi: true,
  },
  {
    key: 'modality',
    title: 'Prefere atendimento online ou presencial?',
    options: ['Online', 'Presencial', 'Tanto faz'],
  },
  {
    key: 'availability',
    title: 'Quando você costuma ter disponibilidade?',
    options: ['Manhã', 'Tarde', 'Noite', 'Finais de semana', 'Horários flexíveis'],
    multi: true,
  },
  {
    key: 'approach',
    title: 'Tem preferência por alguma abordagem?',
    subtitle: 'Se não souber, tudo bem — podemos recomendar.',
    options: ['Não sei / tanto faz', 'Terapia cognitivo-comportamental (TCC)', 'Psicanálise', 'Abordagem humanista', 'Terapia de casal/sistêmica'],
  },
  {
    key: 'region',
    title: 'Em qual região você está?',
    options: ['São Paulo (capital)', 'Grande SP', 'Rio de Janeiro', 'Outras capitais', 'Online de qualquer lugar'],
  },
  {
    key: 'budget',
    title: 'Faixa de preço confortável?',
    options: ['Até R$ 150', 'R$ 150–250', 'R$ 250–400', 'Acima de R$ 400', 'Sem preferência'],
  },
];

export default function Triage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();
  const q = questions[step];
  const isLast = step === questions.length - 1;
  const val = answers[q.key];
  const selected = (o) => q.multi ? (val || []).includes(o) : val === o;

  const pick = (o) => {
    if (q.multi) {
      const cur = val || [];
      setAnswers({ ...answers, [q.key]: cur.includes(o) ? cur.filter(x=>x!==o) : [...cur, o] });
    } else {
      setAnswers({ ...answers, [q.key]: o });
    }
  };

  const next = () => {
    if (isLast) navigate('/encontrar', { state: { fromTriage: true, answers } });
    else setStep(step + 1);
  };

  return (
    <PageShell footer={false}>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        <div className="max-w-2xl w-full mx-auto px-4 py-12 flex-1 flex flex-col">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-10">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'gradient-brand' : 'bg-muted'}`} />
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-primary mb-6 self-start">
            <MessageCircle size={14} /> Triagem — não é um diagnóstico
          </div>

          <div key={step} className="animate-fade-up">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">{q.title}</h1>
            {q.subtitle && <p className="mt-2 text-muted-foreground">{q.subtitle}</p>}

            <div className={`mt-7 grid gap-3 ${q.multi ? 'sm:grid-cols-2' : ''}`}>
              {q.options.map(o => (
                <button key={o} onClick={() => pick(o)}
                  className={`text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${selected(o) ? 'border-primary bg-violet-soft/40 shadow-soft' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}>
                  <span className="font-medium text-sm">{o}</span>
                  {selected(o) && <span className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center shrink-0"><Check size={14} className="text-white" /></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-10">
            <button onClick={() => step === 0 ? navigate('/') : setStep(step-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> {step === 0 ? 'Voltar ao início' : 'Voltar'}
            </button>
            <button onClick={next} disabled={!val || (q.multi && val.length===0)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full gradient-brand text-white font-semibold shadow-soft hover:shadow-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {isLast ? 'Ver profissionais compatíveis' : 'Continuar'} <ArrowRight size={17} />
            </button>
          </div>

          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>Esta triagem ajuda a sugerir profissionais compatíveis. Não substitui uma avaliação clínica e não é um diagnóstico médico ou psicológico.</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
