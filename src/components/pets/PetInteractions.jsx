import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

export default function PetInteractions({ mood1, mood2 }) {
  // Encontrar o humor predominante de cada pet
  const getDominant = (moods) => Object.keys(moods).reduce((a, b) => 
    moods[a] > moods[b] ? a : b
  , 'feliz');

  const m1 = getDominant(mood1);
  const m2 = getDominant(mood2);

  if (m1 === 'feliz' && m2 === 'feliz') {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-amber-400"
            animate={{
              y: [0, -40, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
              rotate: [0, 180]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeInOut"
            }}
            style={{
              left: `calc(50% + ${Math.random() * 40 - 20}px)`,
              top: `calc(50% + ${Math.random() * 40 - 30}px)`,
            }}
          >
            <Sparkles size={20} className="fill-amber-400" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (m1 === 'apaixonado' && m2 === 'apaixonado') {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <motion.div
          animate={{
            y: [10, -50],
            opacity: [0, 1, 0],
            scale: [0.8, 1.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeOut"
          }}
          className="text-rose-500"
        >
          <Heart size={32} className="fill-rose-500" />
        </motion.div>
      </div>
    );
  }

  if (m1 === 'cansado' && m2 === 'cansado') {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`z-${i}`}
            className="absolute font-sans font-bold text-gray-400 text-lg"
            animate={{
              y: [0, -30],
              x: [0, i % 2 === 0 ? 15 : -15],
              opacity: [0, 0.8, 0],
              scale: [0.8, 1.2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeOut"
            }}
          >
            Z
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}
