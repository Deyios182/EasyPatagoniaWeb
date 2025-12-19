import React, { useState, useEffect } from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { useAppAuth } from '../App';

const WelcomeScreen: React.FC = () => {
  const { t } = useAppAuth();
  
  // Carrusel de imágenes de fondo (Capillas, Glaciares, Bosques)
  const backgroundImages = [
    "https://images.unsplash.com/photo-1517748975545-35696f174b0c?auto=format&fit=crop&q=80&w=1200", // Mármol
    "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&q=80&w=1200", // Glaciar
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200"  // Ríos
  ];

  const [currentImage, setCurrentImage] = useState(0);

  // Efecto para cambiar la imagen cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    // Fondo general oscuro para dar contraste en bordes
    <div className="relative flex min-h-screen w-full flex-col mx-auto bg-[#1a2a30] overflow-hidden items-center justify-center p-4">
      
      {/* Contenedor Principal */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row h-full md:h-[85vh] bg-white md:rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
        
        {/* LADO IZQUIERDO: Carrusel de Imágenes */}
        <div className="relative h-[45vh] md:h-full md:w-1/2 overflow-hidden group bg-black">
          {backgroundImages.map((img, index) => (
            <div 
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${index === currentImage ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
              style={{backgroundImage: `url('${img}')`}}
            ></div>
          ))}
          
          {/* Capa de degradado Teal (#4f6d7a) para que el texto resalte */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#4f6d7a]/90 via-[#4f6d7a]/40 to-transparent"></div>
          
          {/* LOGO */}
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-center md:justify-start z-20">
             <img 
               src="/logo_easy.png" 
               alt="Easy Patagonia Logo" 
               className="h-28 md:h-40 object-contain drop-shadow-2xl hover:scale-105 transition-transform"
             />
          </div>

          <div className="absolute bottom-12 px-10 text-white z-20">
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter mb-4 uppercase italic font-display drop-shadow-lg">
              {t('hero_title')}
            </h1>
            <p className="text-[#e8dab2] text-lg font-medium italic border-l-4 border-[#dd6e42] pl-4 max-w-sm drop-shadow-md">
              "{t('hero_subtitle')}"
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Login con fondo Celeste (#c0d6df) */}
        <div className="flex-1 flex flex-col px-8 py-10 md:p-16 bg-[#c0d6df] justify-center items-center text-center md:text-left relative">
            
            {/* Decoración de fondo sutil (Círculos) */}
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-[#4f6d7a]/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="space-y-8 max-w-md w-full z-10 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/30">
              <div className="mb-4">
                <h2 className="text-[#1a2a30] text-3xl font-black mb-2 uppercase italic tracking-tight">
                  {t('welcome')}
                </h2>
                <p className="text-[#4f6d7a] text-sm font-bold uppercase tracking-widest">
                  Tu ecosistema digital en Aysén
                </p>
              </div>

              {/* BOTÓN PRINCIPAL */}
              <SignInButton mode="modal">
                <button 
                  className="w-full bg-[#dd6e42] hover:bg-[#c65d35] text-white font-black py-5 rounded-2xl shadow-lg shadow-[#dd6e42]/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] group"
                >
                  <span className="material-symbols-outlined group-hover:animate-bounce">login</span>
                  Ingresar a la Aventura
                </button>
              </SignInButton>

              <div className="pt-6 border-t border-[#1a2a30]/10 flex flex-col gap-4 items-center">
                 <p className="text-[10px] text-[#4f6d7a] font-black uppercase tracking-widest">
                   Explora servicios verificados
                 </p>
                 <div className="flex gap-3 opacity-70">
                    <img src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=100&q=80" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                    <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=100&q=80" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                    <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=100&q=80" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                 </div>
              </div>
            </div>
            
            <p className="absolute bottom-6 text-[9px] text-[#4f6d7a]/60 font-black uppercase tracking-widest">
              Powered by EasyPatagonia Tech
            </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
