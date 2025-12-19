// Archivo: screens/WelcomeScreen.tsx
import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { useAppAuth } from '../App';

const WelcomeScreen: React.FC = () => {
  const { t } = useAppAuth();

  return (
    // Usamos 'bg-background-light' (#eaeaea) como base
    <div className="relative flex min-h-screen w-full flex-col mx-auto bg-[#eaeaea] overflow-hidden items-center justify-center p-4">
      
      {/* Contenedor Principal con tus colores de acento */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row h-full md:h-[85vh] bg-white md:rounded-[3rem] overflow-hidden shadow-2xl border border-[#4f6d7a]/10">
        
        {/* LADO IZQUIERDO: Imagen inspiradora + Tu gradiente de marca */}
        <div className="relative h-[45vh] md:h-full md:w-1/2 overflow-hidden group">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110" 
            style={{backgroundImage: "url('https://images.unsplash.com/photo-1517748975545-35696f174b0c?auto=format&fit=crop&q=80&w=1200')"}}
          ></div>
          
          {/* Gradiente usando tus colores: Teal (#4f6d7a) a transparente */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#4f6d7a]/90 via-[#4f6d7a]/30 to-transparent"></div>
          
          {/* LOGO AQUÍ */}
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-center md:justify-start">
             {/* Asegúrate de poner tu archivo logo_easy.jpg en la carpeta public */}
             <img 
               src="/logo_easy.png" 
               alt="Easy Patagonia Logo" 
               className="h-24 md:h-32 object-contain drop-shadow-lg"
             />
          </div>

          <div className="absolute bottom-12 px-10 text-white z-10">
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter mb-4 uppercase italic font-display">
              {t('hero_title')}
            </h1>
            {/* Barra lateral con tu color Primario (#dd6e42) */}
            <p className="text-[#e8dab2] text-lg font-medium italic border-l-4 border-[#dd6e42] pl-4 max-w-sm">
              "{t('hero_subtitle')}"
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Login e Identidad */}
        <div className="flex-1 flex flex-col px-8 py-10 md:p-16 bg-[#eaeaea] justify-center items-center text-center md:text-left relative">
            {/* Decoración de fondo con tu color secundario */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#e8dab2]/20 rounded-bl-[100%] pointer-events-none"></div>

            <div className="space-y-8 max-w-md w-full z-10">
              <div className="mb-8">
                <h2 className="text-[#4f6d7a] text-3xl font-black mb-2 uppercase italic tracking-tight">
                  {t('welcome')}
                </h2>
                <p className="text-[#4f6d7a]/70 text-sm font-bold uppercase tracking-widest">
                  Tu ecosistema digital en Aysén
                </p>
              </div>

              {/* BOTÓN PRINCIPAL con tu Naranja (#dd6e42) */}
              <SignInButton mode="modal">
                <button 
                  className="w-full bg-[#dd6e42] hover:bg-[#c65d35] text-white font-black py-5 rounded-2xl shadow-lg shadow-[#dd6e42]/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] group"
                >
                  <span className="material-symbols-outlined group-hover:animate-pulse">account_circle</span>
                  Ingresar / Registrarse
                </button>
              </SignInButton>

              <div className="pt-8 border-t border-[#4f6d7a]/10 flex flex-col gap-4">
                 <div className="flex justify-center gap-4">
                    {/* Indicadores visuales de tu paleta */}
                    <div className="w-8 h-2 rounded-full bg-[#dd6e42]"></div>
                    <div className="w-8 h-2 rounded-full bg-[#e8dab2]"></div>
                    <div className="w-8 h-2 rounded-full bg-[#4f6d7a]"></div>
                 </div>
                 <p className="text-[10px] text-[#4f6d7a]/50 font-bold uppercase tracking-widest text-center mt-2">
                   Powered by EasyPatagonia Tech
                 </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
