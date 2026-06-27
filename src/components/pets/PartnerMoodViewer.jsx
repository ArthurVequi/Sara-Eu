import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Pet from './Pet';

const moodLabels = {
  feliz: '😊 Feliz',
  cansado: '😴 Cansado',
  triste: '😢 Triste',
  apaixonado: '😍 Apaixonado',
  saudade: '🥺 Saudade',
};

const moodBarColors = {
  feliz: 'bg-amber-400',
  cansado: 'bg-slate-400',
  triste: 'bg-sky-400',
  apaixonado: 'bg-rose-400',
  saudade: 'bg-purple-400',
};

export default function PartnerMoodViewer({ isOpen, onClose, moods, partnerName }) {
  if (!isOpen) return null;

  const sortedMoods = Object.entries(moods).sort((a, b) => b[1] - a[1]);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
            <h3 className="font-serif text-xl font-bold text-gray-800">
              Como {partnerName} está hoje
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-rose-100 text-gray-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Pet preview */}
            <div className="flex justify-center transform scale-75 origin-top h-32 mb-2">
              <Pet name={partnerName} moods={moods} />
            </div>

            {/* Mood percentages */}
            <div className="space-y-3">
              {sortedMoods.map(([key, value]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sortedMoods.findIndex(([k]) => k === key) * 0.08 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-sm font-semibold text-gray-700">
                      {moodLabels[key]}
                    </span>
                    <span className="font-sans text-sm font-bold text-rose-500">
                      {value}%
                    </span>
                  </div>
                  {/* Barra visual (somente leitura) */}
                  <div className="w-full h-2.5 bg-rose-100/60 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${moodBarColors[key] || 'bg-rose-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.6, delay: sortedMoods.findIndex(([k]) => k === key) * 0.08, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-rose-100 bg-rose-50/30">
            <p className="text-center text-xs text-gray-400 font-medium">
              💕 Acompanhe como {partnerName} está se sentindo
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
