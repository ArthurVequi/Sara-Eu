import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useNotifications(user) {
  const [unreadLetters, setUnreadLetters] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Pedir permissão para notificações nativas (PWA)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const fetchInitialUnread = async () => {
      const { count } = await supabase
        .from('letters')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      setUnreadLetters(count || 0);
    };

    fetchInitialUnread();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.type === 'new_letter') {
            setUnreadLetters(prev => prev + 1);
            showPushNotification('Nova Cartinha! 💌', {
              body: payload.new.message || 'Você recebeu uma nova carta no Correio do Amor.',
              icon: '/icon-192.png'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'letters', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadLetters(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const showPushNotification = (title, options) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (e) {
        // Fallback para Service Worker se necessário (Android Chrome)
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        });
      }
    }
  };

  return { unreadLetters };
}
