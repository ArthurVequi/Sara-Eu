import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';

export default function Gallery({ data }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Vários graus de rotação para dar um visual descontraído de Polaroids espalhadas
  const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];

  return (
    <div className="flex flex-col space-y-8 pb-24 px-4 select-none">
      {/* Cabeçalho da Seção */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-2"
      >
        <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-800">
          Nossa Galeria
        </h2>
        <p className="font-sans text-xs uppercase tracking-widest text-amber-500 font-bold">
          Momentos congelados em amor 📸
        </p>
      </motion.div>

      {/* Grid das Polaroids */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
        {data.gallery.map((photo, index) => {
          const rot = rotations[index % rotations.length];
          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileTap={{ scale: 0.95, rotate: '0deg' }}
              onClick={() => setSelectedPhoto(photo)}
              className={`bg-white p-3 rounded-lg shadow-[0_6px_18px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col space-y-3 cursor-pointer ${rot} transition-all duration-300 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:scale-[1.02]`}
            >
              {/* Área Quadrada da Foto */}
              <div className="aspect-square w-full rounded-md overflow-hidden bg-gray-50 border border-gray-100">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                />
              </div>

              {/* Legenda Polaroid com Escrita Manual */}
              <div className="flex flex-col space-y-1 text-center pt-1 pb-2">
                <span className="font-cursive text-base text-gray-700 leading-tight">
                  {photo.caption}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-medium flex items-center justify-center gap-1">
                  <Calendar size={8} />
                  {photo.date}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* LIGHTBOX MODAL - TELA CHEIA COMPATÍVEL COM TOQUE EM IPHONE */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-6 py-10"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Botão de Fechar */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-8 right-6 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer -webkit-tap-highlight-color-transparent"
            >
              <X size={24} />
            </button>

            {/* Polaroid Ampliada */}
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white p-4 pb-6 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col space-y-4"
              onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar no card
            >
              {/* Imagem Ampliada */}
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Legenda e Detalhes da Foto */}
              <div className="text-center space-y-1 pt-1">
                <h3 className="font-cursive text-2xl text-gray-800 leading-normal">
                  {selectedPhoto.caption}
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center justify-center gap-1.5">
                  <Calendar size={11} className="text-gray-300" />
                  Registrado em: {selectedPhoto.date}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
