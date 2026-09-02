import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Trash2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';

export default function Favorites() {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Favorite.list('-created_date', 50).then(setFavs).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    await base44.entities.Favorite.delete(id);
    setFavs(favs.filter(f => f.id !== id));
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl gradient-brand-soft flex items-center justify-center text-primary"><Heart size={20} /></div>
          <div><h1 className="text-2xl sm:text-3xl font-heading font-bold">Meus profissionais</h1><p className="text-muted-foreground text-sm">Profissionais que você salvou.</p></div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[0, 1, 2].map(i => <div key={i} className="h-56 animate-shimmer rounded-2xl" />)}</div>
        ) : favs.length === 0 ? (
          <div className="card-elevated p-10 text-center">
            <div className="w-14 h-14 rounded-2xl gradient-brand-soft mx-auto flex items-center justify-center text-primary mb-4"><Heart size={26} /></div>
            <h3 className="font-heading font-semibold">Nenhum profissional salvo</h3>
            <p className="text-sm text-muted-foreground mt-2">Toque no coração em um perfil para salvá-lo aqui.</p>
            <Link to="/encontrar" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold">Encontrar psicólogo <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favs.map(f => (
              <div key={f.id} className="card-elevated p-5">
                <Link to={`/psicologo/${f.psychologist_id}`} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted shrink-0">
                    {f.psychologist_photo ? <Image src={f.psychologist_photo} fittingType="fill" className="w-full h-full" /> : <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary font-bold">{(f.psychologist_name || '?').charAt(0)}</div>}
                  </div>
                  <p className="font-medium truncate">{f.psychologist_name}</p>
                </Link>
                <div className="mt-4 flex gap-2">
                  <Link to={`/psicologo/${f.psychologist_id}`} className="flex-1 text-center px-3 py-2 rounded-full glass-strong text-xs font-semibold hover:bg-white transition-all">Ver perfil</Link>
                  <Link to={`/psicologo/${f.psychologist_id}`} className="flex-1 text-center px-3 py-2 rounded-full gradient-brand text-white text-xs font-semibold">Agendar</Link>
                  <button onClick={() => remove(f.id)} className="px-3 py-2 rounded-full border border-border text-muted-foreground hover:text-red-500 hover:border-red-200 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
