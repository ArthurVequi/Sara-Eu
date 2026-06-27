import { motion } from 'framer-motion';

const moodColors = {
  feliz: { from: '#fef08a', to: '#f59e0b' },      // yellow/gold
  cansado: { from: '#e2e8f0', to: '#94a3b8' },    // gray/blue
  triste: { from: '#bae6fd', to: '#38bdf8' },     // blue
  apaixonado: { from: '#fbcfe8', to: '#f43f5e' }, // pink/rose
  saudade: { from: '#e9d5ff', to: '#a855f7' },    // purple
};

export default function Pet({ name, moods, isFlipped = false }) {
  // Encontrar o humor predominante
  const dominantMood = Object.keys(moods).reduce((a, b) => 
    moods[a] > moods[b] ? a : b
  , 'feliz');

  const color = moodColors[dominantMood] || moodColors.feliz;

  // Face de acordo com o humor
  const renderFace = () => {
    switch (dominantMood) {
      case 'feliz':
        return (
          <g className="pet-face">
            <path d="M45,45 Q50,40 55,45" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <path d="M75,45 Q80,40 85,45" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <path d="M60,55 Q65,65 70,55" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="4" fill="#fca5a5" opacity="0.6" />
            <circle cx="80" cy="50" r="4" fill="#fca5a5" opacity="0.6" />
          </g>
        );
      case 'cansado':
        return (
          <g className="pet-face">
            <line x1="45" y1="45" x2="55" y2="45" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <line x1="75" y1="45" x2="85" y2="45" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <circle cx="65" cy="58" r="3" fill="#475569" />
          </g>
        );
      case 'triste':
        return (
          <g className="pet-face">
            <path d="M45,43 Q50,40 55,45" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <path d="M75,45 Q80,40 85,43" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <path d="M60,60 Q65,55 70,60" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="55" cy="50" r="2" fill="#38bdf8" />
          </g>
        );
      case 'apaixonado':
        return (
          <g className="pet-face">
            <path d="M50,42 A3,3 0 0,0 45,45 A3,3 0 0,0 50,48 A3,3 0 0,0 55,45 A3,3 0 0,0 50,42" fill="#f43f5e" />
            <path d="M80,42 A3,3 0 0,0 75,45 A3,3 0 0,0 80,48 A3,3 0 0,0 85,45 A3,3 0 0,0 80,42" fill="#f43f5e" />
            <path d="M60,55 Q65,65 70,55" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      case 'saudade':
        return (
          <g className="pet-face">
            <circle cx="50" cy="45" r="4" fill="#475569" />
            <circle cx="51" cy="44" r="1.5" fill="#ffffff" />
            <circle cx="80" cy="45" r="4" fill="#475569" />
            <circle cx="81" cy="44" r="1.5" fill="#ffffff" />
            <path d="M62,58 Q65,56 68,58" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="relative w-40 h-40"
        style={{ transform: isFlipped ? 'scaleX(-1)' : 'none' }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 130 130" className="w-full h-full drop-shadow-xl overflow-visible">
          <defs>
            <linearGradient id={`liquidGradient-${name}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={color.to} />
              <stop offset="100%" stopColor={color.from} />
            </linearGradient>

            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
            </linearGradient>

            {/* Path do gatinho */}
            <path id="catShape" d="M30,50 L25,15 L45,30 Q65,25 85,30 L105,15 L100,50 Q120,70 115,100 Q110,120 65,120 Q20,120 15,100 Q10,70 30,50 Z" />

            <clipPath id="catClip">
              <use href="#catShape" />
            </clipPath>
          </defs>

          {/* Sombra interna do vidro (back) */}
          <use href="#catShape" fill="rgba(255,255,255,0.1)" />

          {/* Líquido com animação de onda */}
          <g clipPath="url(#catClip)">
            <motion.path
              d="M-50,60 Q0,40 50,60 T150,60 L150,150 L-50,150 Z"
              fill={`url(#liquidGradient-${name})`}
              animate={{ 
                x: [0, -100],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="opacity-90"
            />
            <motion.path
              d="M0,65 Q50,85 100,65 T200,65 L200,150 L0,150 Z"
              fill={`url(#liquidGradient-${name})`}
              animate={{ 
                x: [0, -100],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="opacity-60"
            />
            {/* Bolhinhas subindo */}
            {[...Array(5)].map((_, i) => (
              <motion.circle
                key={i}
                cx={30 + Math.random() * 70}
                cy={120}
                r={1.5 + Math.random() * 2}
                fill="rgba(255,255,255,0.6)"
                animate={{
                  cy: [120, 50],
                  x: [0, Math.random() * 10 - 5],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </g>

          {/* Corpo de vidro/cristal (front) */}
          <use href="#catShape" fill="url(#glassGradient)" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
          
          {/* Brilho do vidro (highlight) */}
          <path d="M30,50 L25,15 L45,30 Q50,28 55,28" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" className="opacity-70" />
          <path d="M20,80 Q15,100 30,115" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="4" strokeLinecap="round" className="opacity-70" />

          {/* Rosto do pet (não inverte junto com o corpo se quisermos que eles se olhem, mas para facilitar, manteremos a inversão nativa do css) */}
          {renderFace()}

        </svg>
      </motion.div>
      <div className="mt-3 bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/60 shadow-sm">
        <span className="font-sans text-sm font-bold text-gray-700 capitalize tracking-wide">{name}</span>
      </div>
    </div>
  );
}
