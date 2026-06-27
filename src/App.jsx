import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import Splash from './components/Splash';
import HeartParticles from './components/HeartParticles';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Timeline from './components/Timeline';
import Gallery from './components/Gallery';
import Invitation from './components/Invitation';
import LoveMail from './components/LoveMail';
import LoginScreen from './components/LoginScreen';
import { coupleData } from './data/coupleData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut } from 'lucide-react';
function MainApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-romantic-ivory flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onModalStateChange={setIsModalOpen} />;
      case 'history':
        return <Timeline data={coupleData} />;
      case 'photos':
        return <Gallery data={coupleData} />;
      case 'mail':
        return <LoveMail onModalStateChange={setIsModalOpen} />;
      case 'invitation':
        return <Invitation data={coupleData} />;
      default:
        return <Home onModalStateChange={setIsModalOpen} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 font-sans flex flex-col relative overflow-x-hidden selection:bg-rose-200/50">
      <AnimatePresence>
        {showSplash && (
          <Splash onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {!showSplash && (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20 pointer-events-none opacity-90 transition-opacity duration-1000" 
          style={{ backgroundImage: "url('/background.jpg')" }}
        />
      )}

      {!showSplash && (
        <button
          onClick={logout}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-white/50 backdrop-blur-md border border-rose-100/50 rounded-full shadow-sm text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <span className="font-sans text-[10px] uppercase font-bold tracking-wider">Sair</span>
          <LogOut size={14} />
        </button>
      )}

      {!showSplash && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 max-w-md mx-auto w-full flex flex-col justify-start relative z-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="w-full flex-1 h-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      )}

      {!showSplash && !isModalOpen && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
