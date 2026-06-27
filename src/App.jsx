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
import { coupleData } from './data/coupleData';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Função para renderizar o componente correspondente à aba ativa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home data={coupleData} setActiveTab={setActiveTab} />;
      case 'history':
        return <Timeline data={coupleData} />;
      case 'photos':
        return <Gallery data={coupleData} />;
      case 'invitation':
        return <Invitation data={coupleData} />;
      default:
        return <Home data={coupleData} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 font-sans flex flex-col relative overflow-x-hidden selection:bg-rose-200/50">
      {/* 1. Tela de Abertura (Splash) */}
      <AnimatePresence>
        {showSplash && (
          <Splash onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* 2. Imagem de Fundo de Scrapbook Estilo Vintage - Fixa */}
      {!showSplash && (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20 pointer-events-none opacity-90 transition-opacity duration-1000" 
          style={{ backgroundImage: "url('/background.jpg')" }}
        />
      )}

      {/* 3. Partículas de Corações Suspensas no Fundo */}
      {!showSplash && <HeartParticles />}

      {/* 4. Área de Conteúdo Principal */}
      {!showSplash && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 max-w-md mx-auto w-full pt-8 pb-20 flex flex-col justify-start relative z-10"
        >
          {/* Transição animada suave entre a troca de abas */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="w-full flex-1"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      )}

      {/* 5. Menu / Barra de Navegação Inferior estilo iOS */}
      {!showSplash && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
