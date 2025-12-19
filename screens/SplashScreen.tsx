import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3500); // Dura 3.5 segundos
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#eaeaea] flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          <motion.img 
            src="/logo_easy.png" 
            alt="Easy Patagonia" 
            className="w-full h-full object-contain drop-shadow-2xl"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 text-4xl md:text-5xl font-black text-[#4f6d7a] uppercase tracking-tighter italic"
        >
          Easy Patagonia
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-2 text-[#dd6e42] font-black tracking-[0.4em] uppercase text-xs md:text-sm"
        >
          Austral Experience
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
