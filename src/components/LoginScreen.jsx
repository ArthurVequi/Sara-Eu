import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Heart, User } from 'lucide-react';

export default function LoginScreen() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const { login, getAvailableUsers, createPin } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await getAvailableUsers();
      if (!error && data) {
        setUsers(data);
      }
      setIsLoadingUsers(false);
    };
    fetchUsers();
  }, [getAvailableUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('O PIN deve ter pelo menos 4 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    if (!selectedUser.pin) {
      // Primeiro acesso: criar PIN
      const result = await createPin(selectedUser.id, pin);
      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
      }
    } else {
      // Login normal
      const result = await login(selectedUser.id, pin);
      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
      }
    }
  };

  const isFirstAccess = selectedUser && !selectedUser.pin;

  return (
    <div className="min-h-screen bg-romantic-ivory flex flex-col items-center justify-center p-4 selection:bg-rose-200/50">
      <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-[0_16px_48px_rgba(244,63,94,0.08)] border border-rose-100 z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-800">Sara & Eu</h1>
          <p className="font-sans text-xs uppercase tracking-widest text-rose-500/80 font-semibold">
            Nosso Cantinho Privado
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedUser ? (
            <motion.div
              key="user-select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <p className="text-center text-sm font-medium text-gray-500 mb-4">Quem é você?</p>
              
              {isLoadingUsers ? (
                <div className="flex justify-center py-4">
                  <span className="w-6 h-6 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                          <User size={18} />
                        </div>
                        <span className="font-sans font-bold text-gray-700 text-lg">{u.name}</span>
                      </div>
                      <span className="text-rose-400">→</span>
                    </button>
                  ))}
                  {users.length === 0 && (
                    <p className="text-center text-xs text-rose-500">Nenhum usuário encontrado. Verifique o banco de dados.</p>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pin-input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => { setSelectedUser(null); setPin(''); setError(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 uppercase font-bold tracking-wider"
                >
                  ← Voltar
                </button>
                <span className="text-sm font-bold text-gray-700">Olá, {selectedUser.name}!</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                    {isFirstAccess ? 'Crie seu PIN (mín. 4 dígitos)' : 'Seu PIN Secreto'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-center text-2xl tracking-[0.5em] text-gray-700"
                    disabled={isSubmitting}
                  />
                  {isFirstAccess && (
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                      Este será seu PIN permanente. Não esqueça!
                    </p>
                  )}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-rose-500 text-center font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || pin.length < 4}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm tracking-widest uppercase shadow-[0_8px_24px_rgba(244,63,94,0.25)] flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    isFirstAccess ? 'Salvar PIN' : 'Entrar'
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
