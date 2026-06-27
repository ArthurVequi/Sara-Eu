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
  irritado: '😤 Irritado',
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

  const handleChange = (key, value) => {
    const newVal = parseInt(value) || 0;
    setMoods(prev => ({
      ...prev,
      [key]: newVal
    }));
  };

  const handleSave = async () => {
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
              <Pet name="Preview" moods={moods} />
            </div>

            <div className="space-y-4">
              {Object.keys(moodLabels).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-sm font-semibold text-gray-700">{moodLabels[key]}</span>
                    <span className="font-sans text-sm font-bold text-rose-500">{moods[key] || 0}%</span>
                  </div>
                  <div className="flex justify-between gap-1 w-full">
                    {[...Array(10)].map((_, i) => {
                      const val = (i + 1) * 10;
                      const isFilled = val <= (moods[key] || 0);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (moods[key] === val) {
                              handleChange(key, val - 10);
                            } else {
                              handleChange(key, val);
                            }
                          }}
                          className={`flex-1 h-3 rounded-full transition-colors duration-200 focus:outline-none ${
                            isFilled ? 'bg-rose-500' : 'bg-rose-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-rose-100 bg-white">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={isSaving}
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
