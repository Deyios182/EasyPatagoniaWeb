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
        
        
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
