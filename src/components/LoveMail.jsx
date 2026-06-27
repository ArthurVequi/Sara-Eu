import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Inbox, Send, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Envelope from './mail/Envelope';
import LetterView from './mail/LetterView';
import ComposeLetterModal from './mail/ComposeLetterModal';

export default function LoveMail({ onModalStateChange }) {
  const { currentUser, partner } = useAuth();
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(isComposeOpen || !!selectedLetter);
    }
  }, [isComposeOpen, selectedLetter, onModalStateChange]);

  useEffect(() => {
    if (!currentUser) return;

    fetchLetters();

    const channel = supabase
      .channel('letters_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'letters' },
        (payload) => {
          fetchLetters(); // Recarregar tudo para simplificar
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const fetchLetters = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .eq('couple_id', currentUser.couple_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLetters(data);
    }
    setLoading(false);
  };

  if (!currentUser) return null;

  const receivedLetters = letters.filter(l => l.receiver_id === currentUser.id);
  const sentLetters = letters.filter(l => l.sender_id === currentUser.id);

  const displayLetters = activeTab === 'received' ? receivedLetters : sentLetters;

  return (
    <div className="flex flex-col h-full min-h-screen pb-24 px-4 select-none pt-4 bg-[#faf6f0]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-2 mb-6"
      >
        <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-800">
          Correio do Amor
        </h2>
        <p className="font-sans text-xs uppercase tracking-widest text-rose-500 font-bold">
          Cartas para guardar ❤️
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex max-w-md mx-auto w-full bg-white/60 p-1.5 rounded-full border border-rose-100 shadow-sm mb-6 relative">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'received' ? 'text-rose-600' : 'text-gray-500'}`}
        >
          <Inbox size={16} /> Recebidas
          {receivedLetters.filter(l => !l.is_read).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'sent' ? 'text-rose-600' : 'text-gray-500'}`}
        >
          <Send size={16} /> Enviadas
        </button>

        {/* Pill animado do active tab */}
        <div 
          className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm border border-rose-50 transition-all duration-300 ease-in-out z-0"
          style={{ transform: activeTab === 'received' ? 'translateX(0)' : 'translateX(100%)' }}
        />
      </div>

      {/* Grid de Cartas */}
      <div className="flex-1 w-full max-w-md mx-auto relative">
        {loading ? (
          <div className="flex justify-center mt-20">
            <Heart size={32} className="text-rose-300 animate-pulse" />
          </div>
        ) : displayLetters.length === 0 ? (
          <div className="text-center mt-20 text-gray-400 space-y-3">
            <div className="inline-flex p-4 rounded-full bg-white border border-dashed border-gray-200">
              <Inbox size={32} className="text-gray-300" />
            </div>
            <p className="font-sans text-sm">Nenhuma cartinha por aqui ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {displayLetters.map((letter) => (
                <Envelope 
                  key={letter.id} 
                  letter={letter} 
                  onClick={setSelectedLetter}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsComposeOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full shadow-[0_8px_24px_rgba(244,63,94,0.3)] flex items-center justify-center z-40 border border-white/20"
      >
        <PenTool className="text-white" size={24} />
      </motion.button>

      {/* Modals */}
      {selectedLetter && (
        <LetterView 
          letter={selectedLetter} 
          onClose={() => setSelectedLetter(null)}
          isReceived={selectedLetter.receiver_id === currentUser.id}
          senderName={selectedLetter.sender_id === currentUser.id ? currentUser.user_metadata?.name || currentUser.name || 'Você' : partner?.name || 'Seu Amor'}
        />
      )}

      <ComposeLetterModal 
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        user={currentUser}
        partner={partner}
        onSent={fetchLetters}
      />
    </div>
  );
}
