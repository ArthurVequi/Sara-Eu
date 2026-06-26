import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Camera, Mail, Clock, Heart } from 'lucide-react';

export default function Home({ data, setActiveTab }) {
  const [counter, setCounter] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
    years: 0, months: 0,
  });
  const [mode, setMode] = useState('countdown'); // 'countdown' = regressivo | 'countup' = progressivo

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

  useEffect(() => {
    const meetingDate = new Date(
      data.nextMeetingDate.year,
      data.nextMeetingDate.month,
      data.nextMeetingDate.day,
      data.nextMeetingDate.hour,
      data.nextMeetingDate.minute,
      data.nextMeetingDate.second
    );

    const startDate = new Date(
      data.startDate.year,
      data.startDate.month,
      data.startDate.day,
      data.startDate.hour,
      data.startDate.minute,
      data.startDate.second
    );

    const tick = () => {
      const now = new Date();

      // Se a data do encontro ainda não passou → contagem regressiva
      if (now < meetingDate) {
        setMode('countdown');
        const diff = meetingDate - now;

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setCounter({ days, hours, minutes, seconds, years: 0, months: 0 });
      } else {
        // Encontro já aconteceu → contagem progressiva desde startDate
        setMode('countup');

        let years = now.getFullYear() - startDate.getFullYear();
        let months = now.getMonth() - startDate.getMonth();
        let days = now.getDate() - startDate.getDate();
        let hours = now.getHours() - startDate.getHours();
        let minutes = now.getMinutes() - startDate.getMinutes();
        let seconds = now.getSeconds() - startDate.getSeconds();

        if (seconds < 0) { seconds += 60; minutes--; }
        if (minutes < 0) { minutes += 60; hours--; }
        if (hours < 0) { hours += 24; days--; }
        if (days < 0) {
          const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          days += prevMonth.getDate();
          months--;
        }
        if (months < 0) { months += 12; years--; }

        setCounter({ years, months, days, hours, minutes, seconds });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data.startDate, data.nextMeetingDate]);

  const fmt = (n) => (n < 10 ? `0${n}` : n);

  return (
    <div className="flex flex-col space-y-8 pb-24 select-none">
      {/* Cabeçalho / Saudação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-4 space-y-3"
      >
        <div className="inline-block px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-500 text-xs font-semibold tracking-wider uppercase">
          {data.names.her} & {data.names.him} ❤️
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-800 leading-tight">
          {data.welcome.title}
        </h2>
        <p className="font-sans text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          {data.welcome.subtitle}
        </p>
      </motion.div>

      {/* WIDGET PREMIUM DE CONTADOR - DUAL MODE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
        className="px-4"
      >
        <div className="relative max-w-md mx-auto rounded-3xl p-6 bg-white/60 backdrop-blur-md border border-white/60 shadow-[0_12px_40px_rgba(244,63,94,0.06)] overflow-hidden">
          {/* Decoração sutil interna */}
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-rose-100/30 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-amber-100/30 blur-2xl pointer-events-none" />

          {/* Título do Widget - muda conforme o modo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center justify-between mb-5 border-b border-rose-100/30 pb-3"
            >
              <span className="font-sans text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
                {mode === 'countdown' ? (
                  <>
                    <Clock size={12} className="text-amber-500" />
                    <span className="text-amber-600">Nosso Próximo Encontro</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-rose-500/80">Tempo Juntos</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                {mode === 'countdown' ? '⏳ Contagem Regressiva' : '🔴 Ao Vivo'}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Contagem Regressiva (countdown) */}
          {mode === 'countdown' && (
            <div className="space-y-4">
              {/* Destaque principal: DIAS */}
              <div className="flex flex-col items-center justify-center py-5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-amber-100/40 shadow-[0_2px_8px_rgba(217,159,73,0.06)]">
                <motion.span
                  key={counter.days}
                  initial={{ scale: 0.85, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-serif text-6xl font-bold text-amber-600"
                >
                  {counter.days}
                </motion.span>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-500/70 mt-1">
                  {counter.days === 1 ? 'Dia Restante' : 'Dias Restantes'}
                </span>
              </div>

              {/* Grid secundário: Horas, Minutos, Segundos */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white/50 border border-amber-100/30">
                  <span className="font-sans text-xl font-semibold text-gray-700">{fmt(counter.hours)}</span>
                  <span className="text-[9px] uppercase font-medium tracking-wider text-gray-400 mt-0.5">Horas</span>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white/50 border border-amber-100/30">
                  <span className="font-sans text-xl font-semibold text-gray-700">{fmt(counter.minutes)}</span>
                  <span className="text-[9px] uppercase font-medium tracking-wider text-gray-400 mt-0.5">Minutos</span>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-amber-500 border border-amber-600 shadow-[0_4px_12px_rgba(217,159,73,0.2)]">
                  <motion.span
                    key={counter.seconds}
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="font-sans text-xl font-bold text-white"
                  >
                    {fmt(counter.seconds)}
                  </motion.span>
                  <span className="text-[9px] uppercase font-semibold tracking-wider text-amber-100 mt-0.5">Segundos</span>
                </div>
              </div>

              {/* Mensagem fofa de expectativa */}
              <p className="text-center text-xs text-gray-400 italic font-sans pt-1">
                Contando cada segundo até te ver de novo... 💛
              </p>

              {/* Botão de Adicionar à Agenda */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleAddToCalendar}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-600 font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-300 cursor-pointer"
                >
                  <Calendar size={13} />
                  Adicionar à Agenda do iPhone 🗓️
                </button>
              </div>
            </div>
          )}

          {/* Contagem Progressiva (countup) */}
          {mode === 'countup' && (
            <div className="grid grid-cols-3 gap-3">
              {/* Bloco de Anos */}
              <div className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl bg-gradient-to-br from-rose-50/70 to-pink-50/70 border border-rose-100/30 shadow-[0_2px_8px_rgba(244,63,94,0.02)]">
                <span className="font-serif text-3xl font-bold text-rose-600">{counter.years}</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 mt-1">
                  {counter.years === 1 ? 'Ano' : 'Anos'}
                </span>
              </div>
              {/* Bloco de Meses */}
              <div className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl bg-gradient-to-br from-rose-50/70 to-pink-50/70 border border-rose-100/30 shadow-[0_2px_8px_rgba(244,63,94,0.02)]">
                <span className="font-serif text-3xl font-bold text-rose-600">{counter.months}</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 mt-1">
                  {counter.months === 1 ? 'Mês' : 'Meses'}
                </span>
              </div>
              {/* Bloco de Dias */}
              <div className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl bg-gradient-to-br from-rose-50/70 to-pink-50/70 border border-rose-100/30 shadow-[0_2px_8px_rgba(244,63,94,0.02)]">
                <span className="font-serif text-3xl font-bold text-rose-600">{counter.days}</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 mt-1">
                  {counter.days === 1 ? 'Dia' : 'Dias'}
                </span>
              </div>
              {/* Horas */}
              <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white/40 border border-white/60">
                <span className="font-sans text-xl font-semibold text-gray-700">{fmt(counter.hours)}</span>
                <span className="text-[9px] uppercase font-medium tracking-wider text-gray-400 mt-0.5">Horas</span>
              </div>
              {/* Minutos */}
              <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white/40 border border-white/60">
                <span className="font-sans text-xl font-semibold text-gray-700">{fmt(counter.minutes)}</span>
                <span className="text-[9px] uppercase font-medium tracking-wider text-gray-400 mt-0.5">Minutos</span>
              </div>
              {/* Segundos */}
              <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-rose-500 border border-rose-600 shadow-[0_4px_12px_rgba(244,63,94,0.2)]">
                <motion.span
                  key={counter.seconds}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-sans text-xl font-bold text-white"
                >
                  {fmt(counter.seconds)}
                </motion.span>
                <span className="text-[9px] uppercase font-semibold tracking-wider text-rose-100 mt-0.5">Segundos</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* BOTÕES DE NAVEGAÇÃO RÁPIDA */}
      <div className="px-4 space-y-4 max-w-md mx-auto w-full">
        <h3 className="font-serif text-lg font-semibold text-gray-700 ml-2">Explorar nosso cantinho</h3>
        
        <div className="grid grid-cols-1 gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('history')}
            className="flex items-center justify-between p-5 rounded-2xl bg-white/50 backdrop-blur-sm border border-pink-100/40 shadow-sm text-left w-full cursor-pointer hover:bg-white/70 transition-colors duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-500">
                <Calendar size={22} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-gray-800 text-sm">Nossa História</h4>
                <p className="text-xs text-gray-500">Nossa linha do tempo e memórias</p>
              </div>
            </div>
            <span className="text-rose-400 font-bold text-lg">→</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('photos')}
            className="flex items-center justify-between p-5 rounded-2xl bg-white/50 backdrop-blur-sm border border-pink-100/40 shadow-sm text-left w-full cursor-pointer hover:bg-white/70 transition-colors duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
                <Camera size={22} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-gray-800 text-sm">Galeria de Fotos</h4>
                <p className="text-xs text-gray-500">Nossos melhores registros Polaroid</p>
              </div>
            </div>
            <span className="text-amber-400 font-bold text-lg">→</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('invitation')}
            className="flex items-center justify-between p-5 rounded-2xl bg-rose-50/60 backdrop-blur-sm border border-rose-100/50 shadow-sm text-left w-full cursor-pointer hover:bg-rose-50/90 transition-colors duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-rose-500 text-white shadow-sm">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-gray-800 text-sm">Convite Especial</h4>
                <p className="text-xs text-gray-500">Uma surpresa especial para você</p>
              </div>
            </div>
            <span className="text-rose-600 font-bold text-lg">→</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
