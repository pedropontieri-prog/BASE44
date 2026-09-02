import React from 'react';
import { BadgeCheck, ShieldCheck, Clock, AlertCircle, XCircle } from 'lucide-react';

const config = {
  approved: { icon: BadgeCheck, label: 'CRP verificado', className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400', sub: 'CRP e informações profissionais revisados pelo EntreNós' },
  in_review: { icon: Clock, label: 'Em análise', className: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400', sub: 'Documentação em processo de verificação' },
  pending: { icon: Clock, label: 'Pendente de verificação', className: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10', sub: 'Aguardando envio de documentação' },
  needs_adjustments: { icon: AlertCircle, label: 'Requer ajustes', className: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400', sub: 'Há informações que precisam ser corrigidas' },
  rejected: { icon: XCircle, label: 'Reprovado', className: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400', sub: 'Não atende aos critérios de verificação' },
};

export default function VerificationBadge({ status = 'pending', size = 'md', showSub = false }) {
  const c = config[status] || config.pending;
  const Icon = c.icon;
  const sizes = { sm: 'text-xs px-2 py-1 gap-1', md: 'text-xs px-2.5 py-1.5 gap-1.5', lg: 'text-sm px-3 py-2 gap-1.5' };
  return (
    <span className="inline-flex flex-col">
      <span className={`inline-flex items-center font-medium rounded-full ${sizes[size]} ${c.className}`}>
        <Icon size={size === 'lg' ? 16 : 14} />
        {c.label}
      </span>
      {showSub && <span className="mt-1 text-[11px] text-muted-foreground">{c.sub}</span>}
    </span>
  );
}
