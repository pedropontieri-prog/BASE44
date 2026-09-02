import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookHeart,
  Calendar,
  Trash2,
  Save,
  X,
  Loader2,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import PageShell from '@/components/PageShell';
import { supabase } from '@/api/base44Client';

const moods = [
  { value: 'feliz', label: 'Feliz', icon: Smile },
  { value: 'neutro', label: 'Neutro', icon: Meh },
  { value: 'triste', label: 'Triste', icon: Frown },
];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setEntries([]);
        return;
      }

      const { data, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      setEntries(data || []);
    } catch (err) {
      console.error('Erro ao carregar diário:', err);
      setError('Não foi possível carregar seu diário.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!content.trim()) {
      setError('Escreva algo antes de salvar sua entrada.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setError('Você precisa estar conectado para usar o diário.');
        return;
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('journal_entries')
          .update({
            content: content.trim(),
            mood: mood || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            content: content.trim(),
            mood: mood || null,
          });

        if (insertError) throw insertError;
      }

      resetForm();
      await loadEntries();
    } catch (err) {
      console.error('Erro ao salvar entrada:', err);
      setError('Não foi possível salvar sua entrada.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta entrada? Essa ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error: deleteError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setEntries((current) =>
        current.filter((entry) => entry.id !== id)
      );
    } catch (err) {
      console.error('Erro ao excluir entrada:', err);
      setError('Não foi possível excluir a entrada.');
    }
  }

  function handleEdit(entry) {
    setEditingId(entry.id);
    setContent(entry.content || '');
    setMood(entry.mood || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function resetForm() {
    setEditingId(null);
    setContent('');
    setMood('');
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <Link
          to="/painel"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Voltar para o painel
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-soft">
              <BookHeart size={24} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold">
                Meu diário
              </h1>

              <p className="text-muted-foreground mt-1">
                Um espaço só seu para escrever, refletir e colocar seus pensamentos no papel.
              </p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading font-semibold">
                {editingId ? 'Editar entrada' : 'Nova entrada'}
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Este espaço é pessoal e privado.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
                Cancelar
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSave}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Como você está se sentindo hoje? Escreva livremente..."
              rows={7}
              className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={saving}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Como você está se sentindo?
                </p>

                <div className="flex gap-2">
                  {moods.map((item) => {
                    const Icon = item.icon;
                    const selected = mood === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setMood(selected ? '' : item.value)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs border transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                        disabled={saving}
                      >
                        <Icon size={15} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !content.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full gradient-brand text-white font-semibold text-sm shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingId ? 'Atualizar entrada' : 'Salvar entrada'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="font-heading font-semibold text-lg mb-4">
            Minhas entradas
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl animate-shimmer"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="card-elevated p-10 text-center">
              <BookHeart
                size={36}
                className="mx-auto text-primary/50"
              />

              <h3 className="mt-4 font-heading font-semibold">
                Seu diário está vazio
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Escreva sua primeira entrada acima.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="card-elevated p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={14} />
                      {formatDate(entry.created_at)}
                    </div>

                    {entry.mood && (
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        {entry.mood}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {entry.content}
                  </p>

                  <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                    >
                      <Trash2 size={13} />
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
