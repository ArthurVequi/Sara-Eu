import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Pet from './Pet';

const moodLabels = {
  feliz: '😊 Feliz',
  cansado: '😴 Cansado',
  triste: '😢 Triste',
  apaixonado: '😍 Apaixonado',
  saudade: '🥺 Saudade',
};

export default function MoodEditor({ isOpen, onClose, currentMoods, user, onSaveLocally }) {
  const [moods, setMoods] = useState({ ...currentMoods });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMoods({ ...currentMoods });
    }
  }, [isOpen, currentMoods]);

  if (!isOpen) return null;

  const total = Object.values(moods).reduce((a, b) => a + b, 0);

  const handleChange = (key, value) => {
    const newVal = parseInt(value) || 0;
    
    // Simplest logic to ensure sum is 100: we adjust the others proportionally if we exceed 100
    // Actually, even simpler: just let them move, but show a warning if != 100, or auto-balance.
    // Let's use auto-balance on a specific "filler" mood, or just let them adjust until it hits 100.
    
    // For a premium feel, let's just update the value and if it exceeds 100, subtract from others.
    let diff = newVal - moods[key];
    
    if (diff === 0) return;

    let newMoods = { ...moods };
    newMoods[key] = newVal;

    let remainingKeys = Object.keys(newMoods).filter(k => k !== key && newMoods[k] > 0);
    
    if (total + diff > 100) {
      let overage = (total + diff) - 100;
      // Subtract overage from other keys
      for (let k of remainingKeys) {
        if (overage <= 0) break;
        if (newMoods[k] >= overage) {
          newMoods[k] -= overage;
          overage = 0;
        } else {
          overage -= newMoods[k];
          newMoods[k] = 0;
        }
      }
      // Se ainda sobrar overage, força o key atual a não passar do limite disponível
      if (overage > 0) {
        newMoods[key] -= overage;
      }
    }

    setMoods(newMoods);
  };

  const handleSave = async () => {
    const currentTotal = Object.values(moods).reduce((a, b) => a + b, 0);
    if (currentTotal !== 100) {
      alert('A soma das porcentagens deve ser exatamente 100%.');
      return;
    }

    setIsSaving(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_mood')
        .upsert(
          { 
            user_id: user.id, 
            couple_id: user.couple_id, 
            moods: moods,
            date: today 
          },
          { onConflict: 'user_id,date' }
        );

      if (error) throw error;
      
      onSaveLocally(moods);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar humor:', err);
      // Fallback para estado local apenas
      onSaveLocally(moods);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
            <h3 className="font-serif text-xl font-bold text-gray-800">Como você está hoje?</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-rose-100 text-gray-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="flex justify-center transform scale-75 origin-top h-32 mb-4">
              {/* Preview do Pet */}
              <Pet name="Preview" moods={moods} />
            </div>

            <div className="space-y-4">
              {Object.keys(moods).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-sm font-semibold text-gray-700">{moodLabels[key]}</span>
                    <span className="font-sans text-sm font-bold text-rose-500">{moods[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={moods[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-rose-100 bg-white">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-sm font-medium text-gray-500">Total:</span>
              <span className={`text-lg font-bold ${total === 100 ? 'text-green-500' : 'text-rose-500'}`}>
                {total}%
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={isSaving || total !== 100}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm tracking-widest uppercase shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all"
            >
              {isSaving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Salvar Humor
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
