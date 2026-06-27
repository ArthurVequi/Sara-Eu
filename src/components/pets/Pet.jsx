import { motion } from 'framer-motion';
import { useMemo } from 'react';

const moodColors = {
  feliz: { from: '#fef08a', to: '#f59e0b', mid: '#fbbf24' },      // yellow/gold
  cansado: { from: '#e2e8f0', to: '#94a3b8', mid: '#b0bec5' },    // gray/blue
  triste: { from: '#bae6fd', to: '#38bdf8', mid: '#7dd3fc' },     // blue
  apaixonado: { from: '#fbcfe8', to: '#f43f5e', mid: '#f472b6' }, // pink/rose
  saudade: { from: '#e9d5ff', to: '#a855f7', mid: '#c084fc' },    // purple
};

// Gera posições estáveis para as bolinhas usando seed
function generateDots(seed, count) {
  const dots = [];
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s % 1000) / 1000;
  };
  for (let i = 0; i < count; i++) {
    dots.push({
      cx: 20 + pseudoRandom() * 90,
      cy: 25 + pseudoRandom() * 90,
      r: 3 + pseudoRandom() * 6,
      delay: pseudoRandom() * 3,
      duration: 2.5 + pseudoRandom() * 2,
      floatX: (pseudoRandom() - 0.5) * 6,
      floatY: (pseudoRandom() - 0.5) * 6,
    });
  }
  return dots;
}

export default function Pet({ name, moods, isFlipped = false }) {
  // Encontrar o humor predominante
  const dominantMood = Object.keys(moods).reduce((a, b) => 
    moods[a] > moods[b] ? a : b
  , 'feliz');

  const color = moodColors[dominantMood] || moodColors.feliz;

  // Gerar posições estáveis baseadas no nome
  const dots = useMemo(() => {
    const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return generateDots(seed, 18);
  }, [name]);

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
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
            </linearGradient>

            {/* Path do gatinho */}
            <path id="catShape" d="M30,50 L25,15 L45,30 Q65,25 85,30 L105,15 L100,50 Q120,70 115,100 Q110,120 65,120 Q20,120 15,100 Q10,70 30,50 Z" />

            <clipPath id={`catClip-${name}`}>
              <use href="#catShape" />
            </clipPath>
          </defs>

          {/* Sombra interna do vidro (back) */}
          <use href="#catShape" fill="rgba(255,255,255,0.1)" />

          {/* Bolinhas coloridas dentro do gatinho */}
          <g clipPath={`url(#catClip-${name})`}>
            {dots.map((dot, i) => (
              <motion.circle
                key={i}
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                fill={i % 3 === 0 ? color.from : i % 3 === 1 ? color.to : color.mid}
                opacity={0.75}
                animate={{
                  cx: [dot.cx, dot.cx + dot.floatX, dot.cx],
                  cy: [dot.cy, dot.cy + dot.floatY, dot.cy],
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: dot.duration,
                  repeat: Infinity,
                  delay: dot.delay,
                  ease: "easeInOut",
                }}
              />
            ))}
            {/* Algumas bolinhas menores brilhantes (efeito de destaque) */}
            {dots.slice(0, 6).map((dot, i) => (
              <motion.circle
                key={`glow-${i}`}
                cx={dot.cx + 1.5}
                cy={dot.cy - 1.5}
                r={dot.r * 0.3}
                fill="rgba(255,255,255,0.8)"
                animate={{
                  cx: [dot.cx + 1.5, dot.cx + 1.5 + dot.floatX, dot.cx + 1.5],
                  cy: [dot.cy - 1.5, dot.cy - 1.5 + dot.floatY, dot.cy - 1.5],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: dot.duration,
                  repeat: Infinity,
                  delay: dot.delay,
                  ease: "easeInOut",
                }}
              />
            ))}
          </g>

          {/* Corpo de vidro/cristal (front) */}
          <use href="#catShape" fill="url(#glassGradient)" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
          
          {/* Brilho do vidro (highlight) */}
          <path d="M30,50 L25,15 L45,30 Q50,28 55,28" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" className="opacity-70" />
          <path d="M20,80 Q15,100 30,115" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="4" strokeLinecap="round" className="opacity-70" />

          {/* Rosto do pet */}
          {renderFace()}

        </svg>
      </motion.div>
      <div className="mt-3 bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/60 shadow-sm">
        <span className="font-sans text-sm font-bold text-gray-700 capitalize tracking-wide">{name}</span>
      </div>
    </div>
  );
}
