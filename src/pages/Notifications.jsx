import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, User, ShieldCheck, Lock, Info, Check } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { base44 } from '@/api/base44Client';

const CAT = {
  appointments: { icon: Calendar, color: 'text-primary', bg: 'bg-violet-soft' },
  account: { icon: User, color: 'text-aqua', bg: 'bg-aqua/10' },
  verification: { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  privacy: { icon: Lock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  system: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        const list = await base44.entities.Notification.filter({ user_id: u.id }, '-created_date', 50);
        setItems(list);
      } catch (e) { } finally { setLoading(false); }
    })();
  }, []);

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    setItems(items.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAll = async () => {
    const unread = items.filter(n => !n.read);
    await base44.entities.Notification.bulkUpdate(unread.map(n => ({ id: n.id, read: true })));
    setItems(items.map(n => ({ ...n, read: true })));
  };

  const unread = items.filter(n => !n.read).length;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gradient-brand-soft flex items-center justify-center text-primary"><Bell size={20} /></div>
            <div><h1 className="text-2xl sm:text-3xl font-heading font-bold">Notificações</h1>{unread > 0 && <p className="text-xs text-muted-foreground">{unread} não lida(s)</p>}</div>
          </div>
          {unread > 0 && <button onClick={markAll} className="text-xs font-medium text-primary hover:underline">Marcar todas como lidas</button>}
        </div>

        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-20 animate-shimmer rounded-2xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="card-elevated p-10 text-center"><Bell size={28} className="text-muted-foreground mx-auto mb-3" /><p className="font-medium">Tudo certo por aqui</p><p className="text-sm text-muted-foreground mt-1">Você não tem notificações no momento.</p></div>
        ) : (
          <div className="space-y-2">
            {items.map(n => {
              const c = CAT[n.category] || CAT.system;
              return (
                <div key={n.id} className={`card-elevated p-4 flex items-start gap-3 ${!n.read ? 'border-primary/30' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center ${c.color} shrink-0`}><c.icon size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                    <div className="mt-2 flex items-center gap-3">
                      {n.link && <Link to={n.link} className="text-xs font-medium text-primary hover:underline">Abrir</Link>}
                      {!n.read && <button onClick={() => markRead(n.id)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Check size={12} /> Marcar como lida</button>}
                    </div>
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
