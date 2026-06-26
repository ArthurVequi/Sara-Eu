import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function Timeline({ data }) {
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
          Nossa História
        </h2>
        <p className="font-sans text-xs uppercase tracking-widest text-rose-500 font-bold">
          Cada momento guardado no coração ❤️
        </p>
      </motion.div>

      {/* Conteiner da Timeline */}
      <div className="relative max-w-md mx-auto w-full pt-4">
        {/* Linha Vertical Conectora */}
        <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-gradient-to-b from-rose-200 via-pink-100 to-transparent" />

        {/* Lista de Momentos */}
        <div className="space-y-8">
          {data.timeline.map((event, index) => {
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="relative flex gap-6 pl-2"
              >
                {/* Indicador / Círculo na Timeline */}
                <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-rose-200 shadow-sm text-sm">
                  <span className="animate-pulse absolute inset-0 rounded-full bg-rose-50 -z-10" />
                  {event.emoji}
                </div>

                {/* Card de Informações */}
                <div className="flex-1 rounded-2xl p-5 bg-white/60 backdrop-blur-sm border border-white/60 shadow-[0_4px_16px_rgba(244,63,94,0.03)] hover:shadow-[0_8px_24px_rgba(244,63,94,0.06)] transition-shadow duration-300">
                  {/* Data e Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                      {event.date}
                    </span>
                    <Heart size={10} className="text-rose-300 fill-rose-300" />
                  </div>

                  {/* Título do Momento */}
                  <h3 className="font-sans font-bold text-gray-800 text-sm mb-1.5">
                    {event.title}
                  </h3>

                  {/* Descrição */}
                  <p className="font-sans text-xs text-gray-500 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mensagem Final Fofa */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center py-6"
      >
        <span className="font-cursive text-2xl text-rose-400">
          ...e muitos outros capítulos estão por vir! 💕
        </span>
      </motion.div>
    </div>
  );
}
