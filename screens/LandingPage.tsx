import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useAppAuth } from '../App';  // Dynamic Data Link
import { supabase } from '../supabaseClient';
import LogoTicker from '../components/LogoTicker';
import SEO from '../components/SEO';

interface LandingContent {
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
}

interface LandingSettings {
  key: string;
  value: string;
}

interface CarouselImage {
  id: string;
  image_url: string;
  order_position: number;
  alt_text?: string;
}

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  // Fetch Real Data
  const { allLocalities, allAttractions, allBusinesses, t, language, setLanguage } = useAppAuth();

  // Default to first active locality or 'tran' if none
  const [selectedLocality, setSelectedLocality] = useState<string>('loc-tranquilo');

  // Dynamic Landing Data
  const [content, setContent] = useState<Record<string, LandingContent>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Handle scroll for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = language === 'ES' ? 'EN' : language === 'EN' ? 'PT' : 'ES';
    setLanguage(nextLang);
  };

  // Update state when data loads
  useEffect(() => {
    if (allLocalities.length > 0 && !allLocalities.find(l => l.id === selectedLocality)) {
      setSelectedLocality(allLocalities[0].id);
    }
  }, [allLocalities]);

  // FETCH LANDING DATA FROM SUPABASE
  useEffect(() => {
    const fetchLandingData = async () => {
      setLoading(true);

      // Fetch content
      const { data: contentData } = await supabase
        .from('landing_content')
        .select('*');

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('landing_settings')
        .select('*');

      // Fetch carousel images
      const { data: carouselData } = await supabase
        .from('landing_carousel')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      // Transform content to object with key as index
      const contentObj: Record<string, LandingContent> = {};
      contentData?.forEach(item => {
        contentObj[item.key] = item;
      });

      // Transform settings to object with key as index
      const settingsObj: Record<string, string> = {};
      settingsData?.forEach(item => {
        settingsObj[item.key] = item.value;
      });

      setContent(contentObj);
      setSettings(settingsObj);
      setCarouselImages(carouselData || []);
      setLoading(false);
    };

    fetchLandingData();
  }, []);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (carouselImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % carouselImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [carouselImages.length]);

  const [logoError, setLogoError] = useState(false);

  // Ref for horizontal scroll
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Ref for localities scroll
  const localitiesScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollLeftLocs = () => {
    if (localitiesScrollRef.current) {
      localitiesScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRightLocs = () => {
    if (localitiesScrollRef.current) {
      localitiesScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Filter Highlights based on selection
  const visibleHighlights = React.useMemo(() => {
    return allAttractions.filter(a => a.locality_id === selectedLocality);
  }, [allAttractions, selectedLocality]);

  const selectedLocalityDetails = allLocalities.find(l => l.id === selectedLocality);

  const handleEnterApp = () => {
    if (isAuthenticated) navigate('/map');
    else navigate('/welcome');
  };

  const openLink = (url: string) => window.open(url, '_blank');

  const handleWhatsApp = () => {
    const telefono = settings['contact_whatsapp'] || "56993059789";
    const mensaje = "¡Hola! Escribo desde la web EasyPatagonia.";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile ? `whatsapp://send?phone=${telefono}&text=${encodeURIComponent(mensaje)}` : `https://web.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const email = settings['contact_email'] || 'contacto@easypatagonia.com';
    const subject = "Consulta desde EasyPatagonia";
    const body = "Hola, me gustaría recibir más información.";

    // Attempt standard mailto
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };




  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const openInGoogleMaps = (lat?: number, lng?: number, name?: string) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name || '')}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <SEO
        title="Guía Turística Inteligente de la Patagonia Chilena"
        description="Descubre Aysén con Easy Patagonia: mapas satelitales, atractivos turísticos, empresas locales, planificador de viaje y asistente IA para tu aventura en la Carretera Austral."
        keywords={['patagonia chilena', 'aysén turismo', 'carretera austral', 'guía turística', 'mapa interactivo', 'coyhaique', 'puerto cisnes', 'chile sur']}
      />
      <div className="min-h-screen bg-[#eaeaea] font-body text-[#1a2a30] overflow-x-hidden">

        {/* HERO SECTION WITH CAROUSEL */}
        <div className="relative h-screen w-full overflow-hidden bg-black">
          {/* Carousel Background */}
          <div className="absolute inset-0">
            {loading ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                </div>
              </div>
            ) : carouselImages.length > 0 ? (
              carouselImages.map((img, index) => (
                <div
                  key={img.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentCarouselIndex ? 'opacity-60' : 'opacity-0'
                    }`}
                >
                  <img
                    src={img.image_url}
                    className="w-full h-full object-cover"
                    alt={img.alt_text || `Patagonia ${index + 1}`}
                  />
                </div>
              ))
            ) : (
              <img
                src={content['hero']?.image_url || "https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070"}
                className="w-full h-full object-cover opacity-60"
                alt="Patagonia Background"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30] via-transparent to-black/30"></div>

          {/* Carousel Indicators */}
          {carouselImages.length > 1 && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-40">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCarouselIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${index === currentCarouselIndex
                    ? 'bg-[#dd6e42] w-8'
                    : 'bg-white/50 hover:bg-white/80'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}



          // ...

          {/* 1. Header Absoluto (Logo + Botón + Idioma) - Se van con el scroll */}
          <div className="absolute top-0 left-0 right-0 z-50 py-6">
            <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
              {/* Logo */}
              <div className="cursor-pointer flex items-center gap-2" onClick={() => window.scrollTo(0, 0)}>
                {!logoError ? (
                  <img
                    src={settings['logo_url'] || "/logo_easy.png"}
                    className="h-14 md:h-24 w-auto max-w-[180px] md:max-w-[250px] object-contain hover:scale-105 transition-all duration-300 drop-shadow-md"
                    alt={settings['site_name'] || "Easy Patagonia"}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="flex flex-col">
                    <h1 className="font-black italic tracking-tighter uppercase text-lg md:text-2xl drop-shadow-lg">
                      <span className="text-white">Easy</span>
                      <span className="text-[#dd6e42]">Patagonia</span>
                    </h1>
                  </div>
                )}
              </div>

              {/* Botón Ingresar + Idioma */}
              {/* Language World Icon + Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white border border-white/20 backdrop-blur-md shadow-lg"
                  title="Idioma / Language"
                >
                  <span className="material-symbols-outlined text-xl text-white">language</span>
                </button>

                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-[#1a2a30]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
                    <button
                      onClick={() => { setLanguage('ES'); setIsLangMenuOpen(false); }}
                      className={`px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors ${language === 'ES' ? 'text-[#dd6e42] font-black' : 'text-white'}`}
                    >
                      Español
                    </button>
                    <button
                      onClick={() => { setLanguage('EN'); setIsLangMenuOpen(false); }}
                      className={`px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors ${language === 'EN' ? 'text-[#dd6e42] font-black' : 'text-white'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => { setLanguage('PT'); setIsLangMenuOpen(false); }}
                      className={`px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors ${language === 'PT' ? 'text-[#dd6e42] font-black' : 'text-white'}`}
                    >
                      Português
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Menú Flotante (Sticky/Fixed) - Acompaña al usuario */}
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-auto max-w-[90%]">
            <div className="flex gap-2 md:gap-6 px-4 py-2 md:px-8 md:py-3 rounded-full bg-[#1a2a30]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-x-auto no-scrollbar items-center justify-center">
              <button onClick={() => scrollToSection('destinos')} className="text-white text-[9px] md:text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors whitespace-nowrap drop-shadow-sm">Destinos</button>
              <div className="w-px h-3 bg-white/20 hidden md:block"></div>
              <button onClick={() => scrollToSection('vision')} className="text-white text-[9px] md:text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors whitespace-nowrap drop-shadow-sm">Visión</button>
              <button onClick={() => scrollToSection('contacto')} className="text-white text-[9px] md:text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors whitespace-nowrap drop-shadow-sm">Contacto</button>
            </div>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-40 cursor-pointer group"
            onClick={handleEnterApp}
          >
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:scale-105 transition-transform duration-500"
              dangerouslySetInnerHTML={{ __html: 'EASY <span class="text-[#dd6e42]">PATAGONIA</span>' }}
            ></motion.h1>
            <p className="mt-6 text-[#e8dab2] text-lg md:text-xl max-w-2xl font-medium drop-shadow-md italic group-hover:text-white transition-colors">
              "{t('hero_subtitle') || content['hero']?.subtitle || 'Menos planificación. Más Patagonia.'}"
            </p>
            <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
              <span className="text-white text-xs font-black uppercase tracking-widest">{t('enter_app') || 'Toca para explorar'}</span>
            </div>
          </div>
          <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce"><span className="material-symbols-outlined text-white text-4xl">keyboard_arrow_down</span></div>
        </div>

        {/* FUNCIONALIDADES DETALLADAS */}
        <section id="funcionalidades" className="py-24 bg-white relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f8f9fa] skew-x-[-10deg] translate-x-1/2 z-0 hidden lg:block"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <motion.h4
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[#dd6e42] text-sm font-black uppercase tracking-[0.4em] mb-4"
              >
                {t('tool_title')}
              </motion.h4>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-black text-[#1a2a30] uppercase italic tracking-tighter mb-6"
              >
                {t('tool_subtitle').split(' ').slice(0, 4).join(' ')} <br /> <span className="text-[#4f6d7a]">{t('tool_subtitle').split(' ').slice(4).join(' ')}</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 max-w-2xl mx-auto text-lg italic"
              >
                No es solo una web, es tu guía inteligente diseñada para que vivas la Patagonia sin complicaciones técnicas ni pérdida de tiempo.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: 'map', title: t('feat_map_title'), desc: t('feat_map_desc'), route: '/map' },
                { icon: 'explore', title: t('feat_guide_title'), desc: t('feat_guide_desc'), route: '/highlights' },
                { icon: 'storefront', title: t('feat_dir_title'), desc: t('feat_dir_desc'), route: '/directory' },
                { icon: 'calendar_month', title: t('feat_plan_title'), desc: t('feat_plan_desc'), route: '/planner', requireAuth: true },
                { icon: 'smart_toy', title: t('feat_ai_title'), desc: t('feat_ai_desc'), route: '/chat', requireAuth: true },
                { icon: 'verified_user', title: t('feat_data_title'), desc: t('feat_data_desc'), route: '/highlights' }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    if (feature.requireAuth && !isAuthenticated) {
                      navigate('/auth/login');
                    } else {
                      navigate(feature.route);
                    }
                  }}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#4f6d7a]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 text-left">
                    <div className="w-14 h-14 bg-[#4f6d7a]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#dd6e42] transition-colors shadow-sm decoration-clone">
                      <span className="material-symbols-outlined text-[#4f6d7a] group-hover:text-white text-3xl transition-colors">{feature.icon}</span>
                    </div>
                    <h5 className="text-xl font-black text-[#1a2a30] uppercase italic mb-3" dangerouslySetInnerHTML={{ __html: feature.title }}></h5>
                    <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>

                    <div className="mt-6 flex items-center gap-2 text-[#dd6e42] text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                      <span>{t('go_to_section')}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-20 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnterApp}
                className="bg-[#dd6e42] text-white px-12 py-6 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_rgba(221,110,66,0.3)] hover:shadow-[0_25px_50px_rgba(221,110,66,0.5)] transition-all"
              >
                {t('start_tool_btn')}
              </motion.button>
              <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{t('no_download')}</p>
            </div>
          </div>
        </section>

        {/* DESTINOS */}
        <section id="destinos" className="min-h-screen flex flex-col justify-center py-16 px-4 md:px-20 bg-[#eaeaea] overflow-x-hidden w-full">
          <div className="w-full md:max-w-7xl md:mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div><h2 className="text-[#4f6d7a] text-sm font-black uppercase tracking-[0.4em] mb-2">{t('explore_region')}</h2><h3 className="text-4xl md:text-6xl font-black text-[#1a2a30] uppercase italic tracking-tighter">{t('localities')}</h3></div>
              <div className="relative group/locs flex-1 w-full md:max-w-2xl">
                {/* Scroll Buttons for Localities */}
                <button
                  onClick={scrollLeftLocs}
                  className="absolute left-[-10px] md:left-[-20px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white text-[#1a2a30] rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-[#4f6d7a] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Left"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
                <button
                  onClick={scrollRightLocs}
                  className="absolute right-[-10px] md:right-[-20px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white text-[#1a2a30] rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-[#4f6d7a] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Right"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <div
                  ref={localitiesScrollRef}
                  className="flex gap-3 overflow-x-auto no-scrollbar pb-2 touch-pan-x w-full snap-x snap-mandatory"
                >
                  {allLocalities.filter(l => l.is_active).map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocality(loc.id)}
                      className={`flex-none snap-center w-[90vw] md:w-auto md:whitespace-nowrap px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all ${selectedLocality === loc.id ? 'bg-[#4f6d7a] text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 min-h-[auto] lg:min-h-[400px]">
              <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-[#4f6d7a]/10 flex flex-col justify-between w-full min-w-0 h-auto lg:h-full">
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-[#dd6e42] uppercase italic leading-none mb-4 break-words hyphens-auto">{selectedLocalityDetails?.name || 'Seleccione'}</h4>
                  <p className="text-gray-600 leading-relaxed mb-6 text-sm font-medium break-words text-left md:text-justify">{selectedLocalityDetails?.description || 'Descubre los tesoros de esta localidad.'}</p>
                </div>
                <div className="p-5 bg-[#eaeaea] rounded-2xl w-full">
                  <p className="text-[10px] font-bold text-[#4f6d7a] uppercase tracking-widest mb-1">Gestión Local</p>
                  <p className="text-[9px] text-gray-500 font-bold break-words">Datos actualizados por nuestros embajadores en terreno.</p>
                </div>
              </div>
              <div className="lg:col-span-2 relative group-hover/section min-w-0 w-full">

                {/* Scroll Buttons (Visible on Desktop) */}
                <button
                  onClick={scrollLeft}
                  className="absolute left-[-10px] md:left-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white text-[#1a2a30] rounded-full shadow-xl flex items-center justify-center hover:scale-110 hover:bg-[#dd6e42] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Left"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>

                <button
                  onClick={scrollRight}
                  className="absolute right-[-10px] md:right-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white text-[#1a2a30] rounded-full shadow-xl flex items-center justify-center hover:scale-110 hover:bg-[#dd6e42] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Right"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                <div
                  ref={scrollContainerRef}
                  className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x snap-mandatory"
                >
                  {visibleHighlights.length > 0 ? visibleHighlights.map(place => (
                    <div
                      key={place.id}
                      className="w-[90vw] md:w-[320px] flex-shrink-0 group relative h-[500px] rounded-[3rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all snap-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAuthenticated) navigate(`/attraction/${place.id}`);
                        else navigate('/auth/login');
                      }}
                    >
                      <img src={place.main_image_url || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={place.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30]/90 via-transparent to-transparent"></div>

                      {/* Detail Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAuthenticated) {
                            navigate(`/attraction/${place.id}`);
                          } else {
                            navigate('/auth/login');
                          }
                        }}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white backdrop-blur-md p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10 group/maps"
                        title="Ver Detalles"
                      >
                        <span className="material-symbols-outlined text-[#dd6e42] text-xl">visibility</span>
                      </button>

                      <div className="absolute bottom-8 left-8 right-8 cursor-pointer" onClick={handleEnterApp}>
                        <h5 className="text-2xl font-black text-white uppercase italic mb-1 leading-none text-left">{place.name}</h5>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {place.keywords?.map(tag => (
                            <span key={tag} className="text-[9px] bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full uppercase font-black">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="w-full flex items-center justify-center p-12 text-gray-400 font-bold border-2 border-dashed rounded-[3rem]">
                      Pronto agregaremos atractivos aquí.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECCIÓN NUESTRA VISIÓN (LIMPIA) --- */}
        <section id="vision" className="min-h-0 md:min-h-screen flex items-center py-20 bg-[#1a2a30] text-white rounded-t-[4rem] mt-0 md:-mt-10 relative z-10 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">

            {/* Pilares */}
            {/* Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                <span className="text-2xl mb-3 block">🧭</span>
                <h3 className="text-base font-black uppercase mb-2">{t('pillar_1_title')}</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">{t('pillar_1_desc')}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                <span className="text-2xl mb-3 block">💡</span>
                <h3 className="text-base font-black uppercase mb-2">{t('pillar_2_title')}</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">{t('pillar_2_desc')}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                <span className="text-2xl mb-3 block">💚</span>
                <h3 className="text-base font-black uppercase mb-2">{t('pillar_3_title')}</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">{t('pillar_3_desc')}</p>
              </div>
            </div>

            {/* Misión y Visión + Imagen */}
            <div className="flex flex-col-reverse lg:flex-row gap-10 items-center">

              {/* Columna Texto */}
              <div className="flex-1 space-y-12">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#dd6e42]">rocket_launch</span>
                    <h2 className="text-[#dd6e42] text-sm font-black uppercase tracking-[0.4em]">{t('our_mission')}</h2>
                  </div>
                  <p className="text-[#c0d6df]/90 text-base leading-relaxed font-light text-left pl-9 border-l-2 border-[#dd6e42]/30">
                    {t('mission_text')}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#dd6e42]">visibility</span>
                    <h2 className="text-[#dd6e42] text-sm font-black uppercase tracking-[0.4em]">{t('our_vision')}</h2>
                  </div>
                  <p className="text-[#c0d6df]/90 text-base leading-relaxed font-light text-left pl-9 border-l-2 border-[#dd6e42]/30">
                    {t('vision_text')}
                  </p>
                </div>

                <button onClick={handleEnterApp} className="bg-white text-[#1a2a30] px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-[#dd6e42] hover:text-white transition-all shadow-xl w-full md:w-auto mt-4">
                  {t('explore_now_btn')}
                </button>
              </div>

              {/* Columna Imagen (SIN TARJETA BLANCA) */}
              <div className="flex-1 relative w-full min-h-[400px] md:h-[500px] mb-8 lg:mb-0">
                {/* Imagen principal */}
                <div className="w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 md:rotate-2 hover:rotate-0 transition-all duration-700 bg-gray-800">
                  <img
                    src={content['vision']?.image_url || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop"}
                    className="w-full h-full object-cover"
                    alt={content['vision']?.title || "Patagonia Vision"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30]/40 to-transparent"></div>
                </div>

                {/* Decoración de fondo */}
                <div className="hidden md:block absolute top-4 -right-4 bottom-[-10px] left-4 bg-[#dd6e42] rounded-[3rem] -rotate-2 opacity-20 z-0"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACTO */}
        {/* CONTACTO REDESÑADO - WIDER & PREMIUM */}
        {/* CONTACTO */}
        <section id="contacto" className="relative py-24 bg-[#1a2a30] overflow-hidden z-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#dd6e42] rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#4f6d7a] rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
              {t('join_adventure')} <span className="text-[#dd6e42]">{t('adventure_word')}</span>{t('join_adventure_end')}
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-light mb-16 max-w-2xl mx-auto">
              {t('follow_us_text')}
            </p>

            {/* Social Grid - Wider & Prettier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20">
              <button onClick={() => openLink("https://www.instagram.com/easy.patagonia")} className="group bg-gradient-to-br from-[#833ab4]/10 to-[#E1306C]/10 border border-white/5 hover:border-[#E1306C]/50 p-8 rounded-[2rem] transition-all hover:scale-105 hover:bg-white/5">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-[#833ab4] to-[#E1306C] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(225,48,108,0.4)] transition-all">
                  <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">Instagram</h3>
                <p className="text-xs text-slate-400">{t('insta_desc')}</p>
              </button>

              <button onClick={() => openLink("https://www.tiktok.com/@easy.patagonia?_t=ZM-8srRmTRFV1q&_r=1")} className="group bg-white/5 border border-white/5 hover:border-white/20 p-8 rounded-[2rem] transition-all hover:scale-105 hover:bg-white/10">
                <div className="w-16 h-16 mx-auto mb-4 bg-black border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">
                  <span className="material-symbols-outlined text-white text-3xl">movie</span>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">TikTok</h3>
                <p className="text-xs text-slate-400">{t('tiktok_desc')}</p>
              </button>

              <button onClick={handleWhatsApp} className="group bg-[#25D366]/5 border border-white/5 hover:border-[#25D366]/50 p-8 rounded-[2rem] transition-all hover:scale-105 hover:bg-white/5">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] transition-all">
                  <span className="material-symbols-outlined text-white text-3xl">chat</span>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">WhatsApp</h3>
                <p className="text-xs text-slate-400">{t('whatsapp_desc')}</p>
              </button>
            </div>

            {/* Bottom Actions - Reordered as requested */}
            <div className="flex flex-col items-center gap-12">

              {/* 1. Contact Info (Now First) */}
              <div className="space-y-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{t('email_pref')}</p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contacto@easypatagonia.com&su=Consulta%20desde%20EasyPatagonia&body=Hola%2C%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-50 inline-block text-white text-2xl md:text-3xl font-black tracking-tight hover:text-[#dd6e42] transition-colors border-b-2 border-[#dd6e42]/30 hover:border-[#dd6e42] pb-1 cursor-pointer"
                >
                  contacto@easypatagonia.com
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ - PREGUNTAS FRECUENTES */}
        <section id="faq" className="py-24 bg-[#eaeaea] relative z-20 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-[#4f6d7a] text-sm font-black uppercase tracking-[0.4em] mb-4">{t('doubts_title')}</h2>
              <h3 className="text-4xl md:text-5xl font-black text-[#1a2a30] uppercase italic tracking-tighter">{t('faq_title')}</h3>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: t('faq_q1'),
                  a: t('faq_a1')
                },
                {
                  q: t('faq_q2'),
                  a: t('faq_a2')
                },
                {
                  q: t('faq_q3'),
                  a: t('faq_a3')
                },
                {
                  q: t('faq_q4'),
                  a: t('faq_a4')
                },
                {
                  q: t('faq_q5'),
                  a: t('faq_a5')
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-8 py-6 text-left flex justify-between items-center group"
                  >
                    <span className="text-lg font-bold text-[#1a2a30] italic">{faq.q}</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-[#dd6e42]' : 'text-gray-400'}`}>
                      expand_more
                    </span>
                  </button>
                  <div className={`px-8 transition-all duration-300 ease-in-out ${activeFaq === idx ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <p className="text-gray-500 leading-relaxed italic">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 bg-[#1a2a30] rounded-[2.5rem] text-center text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#dd6e42]/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-xl font-black uppercase italic mb-2">{t('still_questions')}</h4>
              <p className="text-slate-400 text-sm mb-6">{t('support_team_desc')}</p>
              <button onClick={handleWhatsApp} className="bg-white text-[#1a2a30] px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-[#dd6e42] hover:text-white transition-all">
                {t('contact_whatsapp_btn')}
              </button>
            </div>
          </div>
        </section>

        {/* BOTÓN DE ACCESO FINAL ARRIBA DE EMPRESAS */}
        <div className="bg-[#1a2a30] py-16 px-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleEnterApp}
              className="w-full relative group overflow-hidden bg-[#dd6e42] text-white px-10 py-8 rounded-[2rem] shadow-[0_20px_50px_rgba(221,110,66,0.3)] hover:shadow-[0_30px_60px_rgba(221,110,66,0.5)] transition-all hover:scale-[1.02]"
            >
              <div className="relative z-10 flex flex-col items-center gap-2">
                <span className="text-2xl md:text-3xl font-black uppercase tracking-[0.1em] italic group-hover:translate-y-[-2px] transition-transform text-center">{t('explore_map_btn')}</span>
                <span className="text-xs font-bold bg-white/20 px-4 py-1 rounded-full uppercase tracking-widest group-hover:bg-white group-hover:text-[#dd6e42] transition-all">{t('instant_access_badge')}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-[#dd6e42] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </div>

        {/* LOGO TICKER BANNER */}
        <section className="relative z-30 bg-[#1a2a30] pb-10 -mt-10 pt-10 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <h3 className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">{t('partners_title')}</h3>
          <LogoTicker businesses={allBusinesses} speed={60} />
        </section >

        <footer className="relative z-40 bg-[#152024] py-12 text-center text-slate-500 text-xs">
          <img src="/logo_easy.png" className="h-10 w-auto mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 transition-all" alt="Logo Footer" onError={(e) => e.currentTarget.style.display = 'none'} />
          <p className="uppercase tracking-widest font-black mb-4">{t('copyright_text')}</p>
          <p>{t('dev_with_love')}</p>
        </footer>
      </div >
    </>
  );
};

export default LandingPage;
