import { motion } from 'framer-motion';

export default function Splash({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-romantic-ivory text-gray-800 select-none"
    >
      {/* Círculo decorativo de fundo macio */}
      <div className="absolute w-80 h-80 rounded-full bg-rose-100/40 blur-3xl -z-10" />

      <div className="flex flex-col items-center space-y-6">
        {/* Coração Pulsante Animado */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [0.9, 1.1, 0.95, 1.15, 0.95],
            opacity: 1 
          }}
          transition={{
            scale: {
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: { duration: 0.5 }
          }}
          className="relative flex items-center justify-center cursor-pointer"
        >
          {/* Coração de fundo com brilho */}
          <div className="absolute w-24 h-24 bg-rose-400/30 rounded-full blur-xl animate-pulse" />
          
          {/* Forma do Coração Principal em SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="url(#roseGoldGradient)"
            className="w-24 h-24 drop-shadow-[0_4px_12px_rgba(244,63,94,0.3)]"
          >
            <defs>
              <linearGradient id="roseGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="40%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#dfb76c" />
              </linearGradient>
            </defs>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>

        {/* Texto do App */}
        <div className="text-center space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-serif text-4xl font-semibold tracking-wide bg-gradient-to-r from-rose-600 to-romantic-gold bg-clip-text text-transparent"
          >
            Sara & Eu
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="font-sans text-xs uppercase tracking-[0.25em] text-rose-400/80 font-medium"
          >
            Nossa História ❤️
          </motion.p>
        </div>
      </div>

      {/* Indicador de Carregamento Fino e Elegante */}
      <div className="absolute bottom-16 w-36 h-[2px] bg-rose-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ 
            duration: 2.2, 
            ease: "easeInOut",
            onComplete: onComplete 
          }}
          className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-rose-400 to-romantic-gold rounded-full"
        />
      </div>
    </motion.div>
  );
}
