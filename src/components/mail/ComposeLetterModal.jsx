import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function ComposeLetterModal({ isOpen, onClose, user, partner, onSent }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSending(true);
    
    try {
      const { error } = await supabase.from('letters').insert({
        couple_id: user.couple_id,
        sender_id: user.id,
        receiver_id: partner.id,
        title: title.trim(),
        content: content.trim()
      });

      if (error) throw error;

      setIsSent(true);
      
      // Criar notificação para o parceiro
      await supabase.from('notifications').insert({
        couple_id: user.couple_id,
        user_id: partner.id,
        type: 'new_letter',
        message: '💌 Você recebeu uma nova cartinha.'
      });

      setTimeout(() => {
        setIsSent(false);
        setTitle('');
        setContent('');
        onSent();
      }, 2000);

    } catch (err) {
      console.error('Erro ao enviar carta:', err);
      alert('Houve um erro ao enviar a carta.');
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md h-[90vh] bg-[#fcf9f2] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col relative"
        >
          {isSent ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500 text-white z-20 space-y-4"
            >
              <motion.div
                animate={{ y: [0, -20, -100], x: [0, 20, 50], opacity: [1, 1, 0] }}
                transition={{ duration: 1.5, ease: "easeIn" }}
              >
                <Send size={48} className="fill-white" />
              </motion.div>
              <h2 className="font-serif text-2xl font-bold">Carta Enviada!</h2>
              <p className="font-sans text-sm opacity-80">Seu amor vai adorar.</p>
            </motion.div>
          ) : (
            <>
              <div className="p-4 border-b border-rose-200/50 flex justify-between items-center bg-[#f8f5f0]">
                <h3 className="font-serif text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Heart size={18} className="text-rose-500" />
                  Escrever Cartinha
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-rose-100 text-gray-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-rose-100/30 bg-white/50">
                  <input
                    type="text"
                    placeholder="Título da carta..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full font-serif text-xl bg-transparent outline-none placeholder:text-gray-400 text-gray-800"
                    required
                  />
                </div>
                
                <div 
                  className="flex-1 overflow-y-auto p-4 bg-[#fcf9f2]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e0d8 31px, #e5e0d8 32px)',
                    backgroundAttachment: 'local',
                    backgroundPosition: '0 -4px' // Ajuste fino para alinhar a fonte com a linha
                  }}
                >
                  <textarea
                    placeholder="Escreva algo especial aqui..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full font-cursive text-xl md:text-2xl leading-[32px] bg-transparent outline-none resize-none placeholder:text-gray-400/60 text-gray-700 pt-1"
                    required
                  />
                </div>

                <div className="p-4 bg-white border-t border-rose-100/50 safe-pb">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isSending || !title.trim() || !content.trim()}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm tracking-widest uppercase shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isSending ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar Carta
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
