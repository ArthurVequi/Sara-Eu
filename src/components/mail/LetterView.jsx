import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Send, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function LetterView({ letter, onClose, isReceived, senderName }) {
  const [isFavorite, setIsFavorite] = useState(letter.is_favorite);
  const [hasReaction, setHasReaction] = useState(letter.has_reaction);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isReceived && !letter.is_read) {
      supabase.from('letters').update({ is_read: true }).eq('id', letter.id).then();
    }
  }, [letter, isReceived]);

  const toggleFavorite = async () => {
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    await supabase.from('letters').update({ is_favorite: newVal }).eq('id', letter.id);
  };

  const toggleReaction = async () => {
    if (!isReceived) return; // Só pode reagir a cartas recebidas
    const newVal = !hasReaction;
    setHasReaction(newVal);
    await supabase.from('letters').update({ has_reaction: newVal }).eq('id', letter.id);
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir esta carta para sempre?")) {
      setIsDeleting(true);
      await supabase.from('letters').delete().eq('id', letter.id);
      onClose();
    }
  };

  const dateStr = new Date(letter.created_at).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 100, rotateX: -20 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="w-full max-w-md h-[85vh] bg-[#fcf9f2] rounded-lg shadow-2xl overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-[#fcf9f2] z-10 border-b border-rose-100/50 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={toggleFavorite} className="p-2 -ml-2 rounded-full hover:bg-rose-50 transition-colors">
                <Star size={20} className={isFavorite ? 'text-amber-400 fill-amber-400' : 'text-gray-400'} />
              </button>
              {isReceived && (
                <button onClick={toggleReaction} className="p-2 rounded-full hover:bg-rose-50 transition-colors">
                  <Heart size={20} className={hasReaction ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-gray-400'} />
                </button>
              )}
              {!isReceived && (
                <button onClick={handleDelete} disabled={isDeleting} className="p-2 rounded-full hover:bg-rose-50 transition-colors">
                  <Trash2 size={20} className="text-gray-400 hover:text-red-500" />
                </button>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Conteúdo da Carta */}
          <div 
            className="flex-1 overflow-y-auto p-6 pt-8 z-0 relative"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e0d8 31px, #e5e0d8 32px)',
              backgroundAttachment: 'local',
              backgroundPosition: '0 -4px' // Ajuste para centralizar o texto na linha
            }}
          >
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl font-bold text-gray-800">{letter.title}</h2>
              <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-2">
                {dateStr}
              </p>
            </div>

            <div className="font-cursive text-xl md:text-2xl text-gray-700 leading-[32px] whitespace-pre-wrap min-h-[300px]">
              {letter.content}
            </div>

            <div className="mt-8 mb-4 text-right pr-2">
              <p className="font-cursive text-xl text-gray-500 leading-[32px]">
                Com amor,<br/>{senderName}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
