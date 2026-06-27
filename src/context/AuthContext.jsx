import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se já tem usuário no localStorage (login persistente simples)
    const storedUserId = localStorage.getItem('saraEuUserId');
    if (storedUserId) {
      fetchUsersData(storedUserId);
    } else {
      setLoading(false);
    }

    // Subscrever a mudanças online/offline dos usuários
    const channel = supabase
      .channel('users_status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          if (currentUser && payload.new.id === partner?.id) {
            setPartner(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsersData = async (userId) => {
    try {
      // Buscar o usuário logado
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar o parceiro
      const { data: partnerData, error: partnerError } = await supabase
        .from('users')
        .select('*')
        .eq('couple_id', userData.couple_id)
        .neq('id', userId)
        .single();

      if (partnerError) {
        console.error('Erro ao buscar parceiro', partnerError);
      }

      setCurrentUser(userData);
      if (partnerData) {
        setPartner(partnerData);
      }

      // Atualizar status online
      await supabase
        .from('users')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('id', userId);

      // Listener para atualizar offline ao sair
      const handleBeforeUnload = async () => {
        await supabase
          .from('users')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('id', userId);
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

    } catch (error) {
      console.error('Erro no login persistente', error);
      localStorage.removeItem('saraEuUserId');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, pin, role')
      .order('name');
    return { data, error };
  };

  const createPin = async (userId, pin) => {
    const { error } = await supabase
      .from('users')
      .update({ pin })
      .eq('id', userId);
    
    if (error) {
      return { success: false, error: 'Erro ao salvar o PIN' };
    }
    
    localStorage.setItem('saraEuUserId', userId);
    await fetchUsersData(userId);
    return { success: true };
  };

  const login = async (userId, pin) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('pin', pin)
        .single();

      if (error || !data) {
        return { success: false, error: 'PIN incorreto.' };
      }

      localStorage.setItem('saraEuUserId', data.id);
      await fetchUsersData(data.id);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao fazer login.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (currentUser) {
       await supabase
        .from('users')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', currentUser.id);
    }
    localStorage.removeItem('saraEuUserId');
    setCurrentUser(null);
    setPartner(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, partner, loading, login, logout, getAvailableUsers, createPin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
