import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    // La animación dura 3.5 segundos en total antes de avisar que terminó
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    // CAMBIO 1: Fondo oscuro de la paleta (#1a2a30) en lugar de claro
    <div className="fixed inset-0 z-[200] bg-[#1a2a30] flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.8 } }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center justify-center h-full w-full"
      >
        {/* LOGO GRANDE (Sin sombra, como pediste) */}
        <div className="relative w-80 h-80 md:w-[30rem] md:h-[30rem] flex items-center justify-center">
          <motion.img 
            src="/logo_easy.png" 
            alt="Easy Patagonia" 
            className="w-full h-full object-contain"
            initial={{ y: 25 }}
            animate={{ y: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        </div>
        
        {/* Título Principal */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          // CAMBIO 2: Texto en blanco (text-white) para que contraste con el fondo oscuro
          // Antes era: text-[#4f6d7a]
          className="mt-4 md:mt-8 text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic text-center"
        >
          Easy Patagonia
        </motion.h1>
        
        {/* Subtítulo (El naranja se ve muy bien sobre fondo oscuro) */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-3 text-[#dd6e42] font-black tracking-[0.4em] uppercase text-xs md:text-base text-center"
        >
          Austral Experience
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
