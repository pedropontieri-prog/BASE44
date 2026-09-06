import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Trash2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { Image } from '@/components/ui/image';
import { supabase } from '@/lib/supabase';

export default function Favorites() {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFavs([]);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar favoritos:', error);
        setFavs([]);
        return;
      }

      setFavs(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar favoritos:', error);
      setFavs([]);
    } finally {
      setLoading(false);
    }
  }

  const remove = async (id) => {
    if (removingId) return;

    setRemovingId(id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao remover favorito:', error);
        return;
      }

      setFavs((current) =>
        current.filter((favorite) => favorite.id !== id)
      );
    } catch (error) {
      console.error('Erro inesperado ao remover favorito:', error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl gradient-brand-soft flex items-center justify-center text-primary">
            <Heart size={20} />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">
              Meus profissionais
            </h1>

            <p className="text-muted-foreground text-sm">
              Profissionais que você salvou.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-56 animate-shimmer rounded-2xl"
              />
            ))}
          </div>
        ) : favs.length === 0 ? (
          <div className="card-elevated p-10 text-center">
            <div className="w-14 h-14 rounded-2xl gradient-brand-soft mx-auto flex items-center justify-center text-primary mb-4">
              <Heart size={26} />
            </div>

            <h3 className="font-heading font-semibold">
              Nenhum profissional salvo
            </h3>

            <p className="text-sm text-muted-foreground mt-2">
              Toque no coração em um perfil para salvá-lo aqui.
            </p>

            <Link
              to="/encontrar"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold"
            >
              Encontrar psicólogo
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favs.map((f) => {
              const name =
                f.psychologist_name ||
                'Profissional';

              const photo =
                f.psychologist_photo ||
                '';

              return (
                <div
                  key={f.id}
                  className="card-elevated p-5"
                >
                  <Link
                    to={`/psicologo/${f.psychologist_id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted shrink-0">
                      {photo ? (
                        <Image
                          src={photo}
                          fittingType="fill"
                          className="w-full h-full"
                          alt={name}
                        />
                      ) : (
                        <div className="w-full h-full gradient-brand-soft flex items-center justify-center text-primary font-bold">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <p className="font-medium truncate">
                      {name}
                    </p>
                  </Link>

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/psicologo/${f.psychologist_id}`}
                      className="flex-1 text-center px-3 py-2 rounded-full glass-strong text-xs font-semibold hover:bg-white transition-all"
                    >
                      Ver perfil
                    </Link>

                    <Link
                      to={`/psicologo/${f.psychologist_id}`}
                      className="flex-1 text-center px-3 py-2 rounded-full gradient-brand text-white text-xs font-semibold"
                    >
                      Agendar
                    </Link>

                    <button
                      onClick={() => remove(f.id)}
                      disabled={removingId === f.id}
                      className="px-3 py-2 rounded-full border border-border text-muted-foreground hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Remover ${name} dos favoritos`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
