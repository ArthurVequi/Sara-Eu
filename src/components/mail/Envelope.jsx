import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';

export default function Envelope({ letter, onClick }) {
  const dateStr = new Date(letter.created_at).toLocaleDateString('pt-BR', { 
    day: '2-digit', month: 'short' 
  });

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(letter)}
      className="relative w-full aspect-[4/3] bg-[#f8f5f0] rounded-lg shadow-sm border border-[#e5e0d8] cursor-pointer overflow-hidden flex flex-col items-center justify-center"
      style={{
        backgroundImage: `
          linear-gradient(135deg, transparent 49%, rgba(0,0,0,0.03) 50%, transparent 51%),
          linear-gradient(-135deg, transparent 49%, rgba(0,0,0,0.03) 50%, transparent 51%)
        `,
        backgroundSize: '100% 100%'
      }}
    >
      {/* Selo postal decorativo */}
      <div className="absolute top-3 right-3 w-8 h-10 bg-white border border-[#d1ccc3] border-dashed p-1 shadow-sm opacity-80 rotate-3">
        <div className="w-full h-full bg-rose-200/50 flex items-center justify-center">
          <Heart size={10} className="text-rose-400 fill-rose-400" />
        </div>
      </div>

      {/* Título da carta (destinatário) */}
      <div className="text-center px-6 z-10 mt-4">
        <h3 className="font-cursive text-xl sm:text-2xl text-gray-700 font-bold leading-tight">
          {letter.title}
        </h3>
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-3 left-4 flex gap-2">
        {letter.is_favorite && <Star size={14} className="text-amber-400 fill-amber-400" />}
        {letter.has_reaction && <Heart size={14} className="text-rose-500 fill-rose-500" />}
      </div>

      {/* Data e Unread status */}
      <div className="absolute bottom-3 right-4 flex items-center gap-2">
        {!letter.is_read && (
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        )}
        <span className="font-sans text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          {dateStr}
        </span>
      </div>
      
      {/* Flap of the envelope (visual only) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M 0 0 L 50 40 L 100 0" fill="none" stroke="#d1ccc3" strokeWidth="0.5" />
      </svg>
    </motion.div>
  );
}
