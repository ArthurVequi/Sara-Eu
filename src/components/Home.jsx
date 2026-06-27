import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Pet from './pets/Pet';
import PetInteractions from './pets/PetInteractions';
import MoodEditor from './pets/MoodEditor';
import { Edit3 } from 'lucide-react';

const defaultMoods = { feliz: 100, cansado: 0, triste: 0, apaixonado: 0, saudade: 0 };

export default function Home() {
  const { currentUser, partner } = useAuth();
  const [myMoods, setMyMoods] = useState(defaultMoods);
  const [partnerMoods, setPartnerMoods] = useState(defaultMoods);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Carregar humor do dia
    const loadMoods = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_mood')
        .select('*')
        .eq('couple_id', currentUser.couple_id)
        .eq('date', today);

      if (!error && data) {
        const myMood = data.find(m => m.user_id === currentUser.id);
        const pMood = data.find(m => m.user_id === partner?.id);
        
        if (myMood) setMyMoods(myMood.moods);
        if (pMood) setPartnerMoods(pMood.moods);
      }
    };

    loadMoods();

    // Listener para realtime do humor
    const channel = supabase
      .channel('mood_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'daily_mood' },
        (payload) => {
          if (payload.new.user_id === partner?.id) {
            setPartnerMoods(payload.new.moods);
          } else if (payload.new.user_id === currentUser.id) {
            setMyMoods(payload.new.moods);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daily_mood' },
        (payload) => {
          if (payload.new.user_id === partner?.id) {
            setPartnerMoods(payload.new.moods);
          } else if (payload.new.user_id === currentUser.id) {
            setMyMoods(payload.new.moods);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, partner]);

  if (!currentUser) return null; // Será interceptado pelo App.jsx depois

  return (
    <div className="flex flex-col space-y-8 pb-24 px-4 select-none pt-4">
      {/* Header Minimalista */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-2"
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-rose-100 shadow-sm text-gray-800 text-sm font-semibold tracking-wide">
          {currentUser.name} <span className="text-rose-400 font-serif mx-1">&</span> {partner?.name || 'Amor'}
        </div>
      </motion.div>

      {/* Área dos Pets */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
        className="relative w-full max-w-md mx-auto min-h-[350px] flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white/60 shadow-[0_12px_40px_rgba(244,63,94,0.06)] p-6"
      >
        {/* Fundo de luz suave */}
        <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-rose-200/30 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2" />
        </div>

        {/* Interações Mágicas (Estrelas, Corações, etc) */}
        <PetInteractions mood1={myMoods} mood2={partnerMoods} />

        {/* Layout flexível: lado a lado ou stack em telas muito pequenas */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center items-end gap-6 sm:gap-10 w-full z-10 relative">
          
          {/* Meu Pet */}
          <div className="flex flex-col items-center">
            <Pet name={currentUser.name} moods={myMoods} />
            <button
              onClick={() => setIsEditorOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <Edit3 size={14} />
              Meu Humor
            </button>
          </div>

          {/* Pet do Parceiro */}
          <div className="flex flex-col items-center">
            <Pet name={partner?.name || '...'} moods={partnerMoods} isFlipped={true} />
            <div className="mt-4 px-4 py-2 bg-transparent text-gray-400 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${partner?.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
              {partner?.is_online ? 'Online' : 'Offline'}
            </div>
          </div>

        </div>
      </motion.div>

      <MoodEditor 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        currentMoods={myMoods}
        user={currentUser}
        onSaveLocally={(newMoods) => setMyMoods(newMoods)}
      />
    </div>
  );
}
