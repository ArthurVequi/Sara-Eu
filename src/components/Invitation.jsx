import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MailOpen, Check, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Invitation({ data }) {
  const [isOpened, setIsOpened] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAddToCalendar = () => {
    const pad = (num) => String(num).padStart(2, '0');
    
    const year = data.nextMeetingDate.year;
    const month = pad(data.nextMeetingDate.month + 1);
    const day = pad(data.nextMeetingDate.day);
    const hour = pad(data.nextMeetingDate.hour);
    const minute = pad(data.nextMeetingDate.minute);
    const second = pad(data.nextMeetingDate.second || 0);

    const dateStr = `${year}${month}${day}T${hour}${minute}${second}`;
    
    // Calcular 4 horas de duração padrão
    const startDateObj = new Date(year, data.nextMeetingDate.month, data.nextMeetingDate.day, data.nextMeetingDate.hour, data.nextMeetingDate.minute);
    const endDateObj = new Date(startDateObj.getTime() + 4 * 60 * 60 * 1000);
    
    const endYear = endDateObj.getFullYear();
    const endMonth = pad(endDateObj.getMonth() + 1);
    const endDayStr = pad(endDateObj.getDate());
    const endHourStr = pad(endDateObj.getHours());
    const endMinStr = pad(endDateObj.getMinutes());
    const endSecStr = pad(endDateObj.getSeconds());
    
    const endDateStr = `${endYear}${endMonth}${endDayStr}T${endHourStr}${endMinStr}${endSecStr}`;

    const icsString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sara & Eu//Event//BR',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@saraeeu.com`,
      `DTSTAMP:${dateStr}Z`,
      `DTSTART:${dateStr}`,
      `DTEND:${endDateStr}`,
      'SUMMARY:Nosso Encontro Especial! ❤️',
      'DESCRIPTION:Um momento especial reservado todinho para nós dois. Mal posso esperar para te ver! ✨',
      'LOCATION:Surpresa Romântica 🌹',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nosso_encontro.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAccept = () => {
    setIsAccepted(true);

    // Efeito de Fogos e Confete Romântico Contínuo (4 segundos)
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 80, zIndex: 100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 60 * (timeLeft / duration);

      // Dispara confetes do lado esquerdo da tela
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#ffced5', '#dfb76c', '#e11d48']
      }));
      // Dispara confetes do lado direito da tela
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#f43f5e', '#ffced5', '#dfb76c', '#e11d48']
      }));
    }, 200);
  };

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
          Um Convite
        </h2>
        <p className="font-sans text-xs uppercase tracking-widest text-rose-500 font-bold">
          Abra com carinho 💌
        </p>
      </motion.div>

      <div className="max-w-md mx-auto w-full flex items-center justify-center min-h-[350px]">
        <AnimatePresence mode="wait">
          {/* ESTADO 1: ENVELOPE FECHADO */}
          {!isOpened && (
            <motion.div
              key="closed-envelope"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={() => setIsOpened(true)}
              className="w-full rounded-3xl p-8 bg-gradient-to-br from-white to-pink-50/30 border border-rose-100 shadow-[0_16px_48px_rgba(244,63,94,0.06)] text-center flex flex-col items-center justify-center space-y-6 cursor-pointer hover:scale-[1.01] transition-transform duration-300"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-rose-400/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <Heart size={38} className="fill-rose-500" />
                  </motion.div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-gray-800">Você tem uma cartinha...</h3>
                <p className="font-sans text-xs text-gray-400 tracking-wider uppercase font-medium">Toque para abrir</p>
              </div>
            </motion.div>
          )}

          {/* ESTADO 2: CARTA DE AMOR ABERTA */}
          {isOpened && !isAccepted && (
            <motion.div
              key="opened-letter"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="w-full rounded-3xl p-6 bg-white border border-rose-100/60 shadow-[0_20px_50px_rgba(244,63,94,0.08)] flex flex-col space-y-6 relative overflow-hidden"
            >
              {/* Linhas pautadas decorativas estilo caderno de amor */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-rose-50/40 blur-2xl -z-10" />

              {/* Cabeçalho da Carta */}
              <div className="flex items-center gap-3 border-b border-rose-100/50 pb-4">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-500">
                  <MailOpen size={20} />
                </div>
                <span className="font-serif text-lg font-bold text-gray-800">
                  {data.invitation.cardTitle}
                </span>
              </div>

              {/* Imagem do Convite */}
              {data.invitation.imageUrl && (
                <div className="w-full overflow-hidden rounded-2xl border border-rose-100/60 shadow-md bg-gray-50 flex items-center justify-center">
                  <img 
                    src={data.invitation.imageUrl} 
                    alt="Convite Especial" 
                    className="w-full h-auto object-contain max-h-[400px] hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              )}

              {/* Mensagem da Carta */}
              {data.invitation.message && (
                <p className="font-sans text-sm text-gray-600 leading-relaxed whitespace-pre-line text-justify italic">
                  {data.invitation.message}
                </p>
              )}

              {/* Botão de Aceitação */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAccept}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm tracking-widest uppercase shadow-[0_8px_24px_rgba(244,63,94,0.3)] cursor-pointer hover:from-rose-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Heart size={16} className="fill-white" />
                {data.invitation.buttonText}
              </motion.button>
            </motion.div>
          )}

          {/* ESTADO 3: ACEITO COM SUCESSO E CELEBRAÇÃO */}
          {isAccepted && (
            <motion.div
              key="accepted-celebration"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="w-full rounded-3xl p-6 bg-gradient-to-b from-white to-rose-50/20 border-2 border-rose-200/60 shadow-[0_24px_60px_rgba(244,63,94,0.1)] text-center flex flex-col items-center justify-center space-y-6 overflow-hidden"
            >
              {/* Badge de Sucesso */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold uppercase tracking-widest shadow-md animate-bounce">
                <Check size={12} strokeWidth={3} />
                {data.invitation.celebrationText}
              </div>

              {/* Coração Gigante Pulsante */}
              <motion.div
                animate={{ scale: [1, 1.15, 1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                className="relative flex items-center justify-center"
              >
                <div className="absolute w-24 h-24 bg-rose-500/20 rounded-full blur-xl pointer-events-none" />
                <Heart size={68} className="text-rose-500 fill-rose-500 filter drop-shadow-[0_4px_12px_rgba(244,63,94,0.3)]" />
              </motion.div>

              {/* Mensagem de Confirmacão */}
              <div className="space-y-3 px-2">
                <h3 className="font-cursive text-3xl font-bold text-rose-600 leading-normal">
                  Prometo te fazer feliz!
                </h3>
                <p className="font-sans text-xs text-gray-500 leading-relaxed px-1">
                  {data.invitation.successMessage}
                </p>
              </div>

              {/* Botão de Adicionar à Agenda */}
              <button
                onClick={handleAddToCalendar}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-rose-500/10 border border-rose-200/50 hover:bg-rose-500/20 text-rose-600 font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm"
              >
                <Calendar size={14} />
                Salvar Encontro na Agenda 🗓️
              </button>

              {/* Assinatura romântica */}
              <div className="border-t border-rose-100/50 w-full pt-4">
                <span className="font-cursive text-xl text-gray-400">
                  Com todo o meu amor, {data.names.him} ❤️
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
