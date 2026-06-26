import { motion } from 'framer-motion';
import { Heart, BookOpen, Camera, Mail } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Início', icon: Heart },
    { id: 'history', label: 'História', icon: BookOpen },
    { id: 'photos', label: 'Fotos', icon: Camera },
    { id: 'invitation', label: 'Convite', icon: Mail },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-5 pt-2 md:pb-6 pointer-events-none">
      {/* Container Centralizado para manter aparência de App */}
      <nav className="max-w-md mx-auto flex items-center justify-around px-4 py-2 rounded-full bg-white/75 backdrop-blur-lg border border-pink-100/60 shadow-[0_8px_32px_rgba(244,63,94,0.08)] pointer-events-auto select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center py-2 px-3 rounded-full transition-colors duration-200 cursor-pointer -webkit-tap-highlight-color-transparent group"
            >
              {/* Balãozinho / Pill de Seleção com Framer Motion */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-rose-50 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Ícone */}
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1.0,
                  color: isActive ? "#e11d48" : "#9ca3af" // rose-600 vs gray-400
                }}
                transition={{ duration: 0.2 }}
                className="mb-0.5"
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              </motion.div>

              {/* Rótulo Textual Pequeno */}
              <span
                className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-rose-600 font-semibold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      {/* Espaçador de segurança para o indicador nativo do iOS */}
      <div className="h-[env(safe-area-inset-bottom,16px)] bg-transparent" />
    </div>
  );
}
