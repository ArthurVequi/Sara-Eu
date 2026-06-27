import { motion } from 'framer-motion';
import { Heart, BookOpen, Camera, Mail, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBadge from './NotificationBadge';

export default function Navbar({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();
  const { unreadLetters } = useNotifications(currentUser);

  const navItems = [
    { id: 'home', label: 'Pets', icon: Heart },
    { id: 'history', label: 'História', icon: BookOpen },
    { id: 'photos', label: 'Fotos', icon: Camera },
    { id: 'mail', label: 'Correio', icon: Inbox, badge: unreadLetters },
    { id: 'invitation', label: 'Convite', icon: Mail },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-6 pb-5 pt-2 md:pb-6 pointer-events-none">
      <nav className="max-w-md mx-auto flex items-center justify-around px-2 py-2 rounded-full bg-white/75 backdrop-blur-lg border border-pink-100/60 shadow-[0_8px_32px_rgba(244,63,94,0.08)] pointer-events-auto select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center py-2 px-2 sm:px-3 rounded-full transition-colors duration-200 cursor-pointer -webkit-tap-highlight-color-transparent group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-rose-50 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1.0,
                  color: isActive ? "#e11d48" : "#9ca3af" 
                }}
                transition={{ duration: 0.2 }}
                className="mb-0.5 relative"
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.badge > 0 && <NotificationBadge count={item.badge} />}
              </motion.div>

              <span
                className={`text-[9px] sm:text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-rose-600 font-semibold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      <div className="h-[env(safe-area-inset-bottom,16px)] bg-transparent" />
    </div>
  );
}
