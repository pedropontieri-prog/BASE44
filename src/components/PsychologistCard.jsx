import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Video, Building2, Star, ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import VerificationBadge from './VerificationBadge';

export default function PsychologistCard({ psychologist, index = 0 }) {
  const p = psychologist;
  const hasOnline = (p.modalities || []).includes('online');
  const hasInPerson = (p.modalities || []).includes('in_person');
  return (
    <Link
      to={`/psicologo/${p.id}`}
      className="card-elevated group p-5 hover:shadow-glow hover:-translate-y-1 block animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted">
            {p.photo_url ? (
              <Image src={p.photo_url} fittingType="fill" className="w-full h-full" alt={p.professional_name || p.full_name} />
            ) : (
              <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-2xl font-heading font-bold text-primary">
                {(p.professional_name || p.full_name || '?').charAt(0)}
              </div>
            )}
          </div>
          {p.verification_status === 'approved' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-base truncate group-hover:text-primary transition-colors">
                {p.professional_name || p.full_name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">CRP {p.crp_region || ''}/{p.crp_number}</p>
            </div>
            {p.rating != null && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium shrink-0">
                <Star size={13} className="fill-amber-400" /> {p.rating?.toFixed?.(1) || p.rating}
              </span>
            )}
          </div>

          <div className="mt-2">
            <VerificationBadge status={p.verification_status} size="sm" />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {(p.specialties || []).slice(0, 3).map((s, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-soft text-primary font-medium">{s}</span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
            {p.city && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {p.city}/{p.state}</span>}
            {hasOnline && <span className="inline-flex items-center gap-1 text-aqua-foreground" style={{ color: 'hsl(178 60% 40%)' }}><Video size={12} /> Online</span>}
            {hasInPerson && <span className="inline-flex items-center gap-1"><Building2 size={12} /> Presencial</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div>
          {p.price ? (
            <span className="text-sm font-semibold">R$ {p.price.toFixed(2).replace('.', ',')} <span className="text-xs font-normal text-muted-foreground">/sessão</span></span>
          ) : (
            <span className="text-xs text-muted-foreground">Valor sob consulta</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
          Ver perfil <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}
