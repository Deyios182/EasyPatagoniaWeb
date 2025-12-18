
import { Business, Category } from './types';

type Language = 'ES' | 'EN' | 'PT';

const IMAGEN_GENERICA_TOUR = "https://images.unsplash.com/photo-1519781615555-d4e5f419c968";

const BUSINESS_CATALOG = [
  {
    id: 'explorando-viajes',
    categoria: "Actividad" as Category,
    priority: 1,
    gps: { lat: -45.5752, lng: -72.0662 },
    whatsapp: "+56956926717",
    email: "contacto@explorandoviajes.cl",
    logo_url: "https://i.imgur.com/vS8UUl9.png",
    fotos_url: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470"],
    rating: 4.7,
    reviewCount: 45,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Explorando Viajes",
        descripcion: "Tours desde Coyhaique a Capillas de Mármol, Queulat y Ruta del Agua. Vehículos seguros.",
        direccion: "Coyhaique (Punto de encuentro)",
        servicios: [
          { nombre: "Full Day Mármol", precio: "CLP 70.000", desc: "Incluye transporte, navegación y alimentación." },
          { nombre: "Parque Queulat", precio: "CLP 75.000", desc: "Incluye transporte, guiado y snack." },
          { nombre: "Ruta del Agua", precio: "CLP 55.000", desc: "Coyhaique - Puerto Aysén - Chacabuco." }
        ]
      },
      EN: {
        nombre: "Exploring Travels",
        descripcion: "Tours from Coyhaique to Marble Caves, Queulat and Water Route.",
        direccion: "Coyhaique (Meeting point)",
        servicios: [
          { nombre: "Full Day Marble", precio: "USD 75", desc: "Includes transport, boat and food." },
          { nombre: "Queulat Park", precio: "USD 80", desc: "Includes transport and guide." }
        ]
      },
      PT: {
        nombre: "Explorando Viagens",
        descripcion: "Tours de Coyhaique para Capelas de Mármore e Queulat.",
        direccion: "Coyhaique",
        servicios: [
          { nombre: "Full Day Mármore", precio: "BRL 420", desc: "Inclui transporte e navegação." }
        ]
      }
    }
  },
  {
    id: 'aoni-exp',
    categoria: "Actividad" as Category,
    priority: 1,
    gps: { lat: -46.622516, lng: -72.674387 },
    whatsapp: "+56942581508",
    email: "info@aoni.cl",
    logo_url: "https://i.imgur.com/gGo8HiH.png",
    fotos_url: ["https://i.imgur.com/marmol-full.jpg", "https://i.imgur.com/marmol-simple.jpg"],
    rating: 4.9,
    reviewCount: 120,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Aoni Expediciones",
        descripcion: "Vive la magia de la Patagonia. Navegaciones a Catedral y Capilla de Mármol. Guías bilingües.",
        direccion: "Puerto Río Tranquilo, Aysén",
        servicios: [
          { nombre: "Tour Full Mármol", precio: "CLP 30.000", desc: "2.5 hrs: Islas Panichini, cavernas y Santuario." },
          { nombre: "Tour Simple", precio: "CLP 20.000", desc: "1.5 hrs: Santuario Capillas." },
          { nombre: "Simple Privado 1-5 px", precio: "CLP 160.000", desc: "Tour Simple exclusivo para tu grupo." },
          { nombre: "Full Privado 1-5 px", precio: "CLP 240.000", desc: "Experiencia premium privada." }
        ]
      },
      EN: {
        nombre: "Aoni Expeditions",
        descripcion: "Experience Patagonia's magic. Marble Cathedral tours.",
        direccion: "Puerto Rio Tranquilo",
        servicios: [
          { nombre: "Full Marble Tour", precio: "USD 32", desc: "2.5 hrs complete tour." },
          { nombre: "Simple Tour", precio: "USD 22", desc: "1.5 hrs Sanctuary visit." }
        ]
      }
    }
  },
  {
    id: 'marble-patagonia',
    categoria: "Actividad" as Category,
    priority: 1,
    gps: { lat: -46.622445, lng: -72.674288 },
    whatsapp: "+56979784600",
    email: "info@marblepatagonia.cl",
    logo_url: "https://i.imgur.com/8lFhzH9.png",
    fotos_url: ["https://megaconstrucciones.net/images/naturales/foto2/marmol-catedral.jpg"],
    rating: 4.8,
    reviewCount: 95,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Marble Patagonia",
        descripcion: "Operador local líder. Navegaciones seguras al Santuario.",
        direccion: "Calle Principal S/N",
        servicios: [
          { nombre: "Navegación Clásica", precio: "CLP 20.000", desc: "Visita a las cavernas y catedral." },
          { nombre: "Tour Full Mármol", precio: "CLP 30.000", desc: "2.5 hrs: Figuras, túnel, catedral. Max 11 pax." },
          { nombre: "Privado Full", precio: "CLP 180.000", desc: "3 hrs privado hasta 5 pax." }
        ]
      }
    }
  },
  {
    id: 'nunatak-chile',
    categoria: "Actividad" as Category,
    priority: 2,
    gps: { lat: -46.623551, lng: -72.676661 },
    whatsapp: "+56951448060",
    email: "info@nunatak.cl",
    logo_url: "https://i.imgur.com/59QncS3.png",
    fotos_url: ["https://www.nunatak-patagonia.com/wp-content/uploads/2020/07/kayak-capillas-marmol.jpg"],
    rating: 5.0,
    reviewCount: 67,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Nunatak Chile",
        descripcion: "Expertos en Kayak y aventura. Kayak a Capilla de Mármol con guías Sernatur.",
        direccion: "Plaza de Armas, Local 2",
        servicios: [
          { nombre: "Kayak Capilla de Mármol", precio: "CLP 55.000", desc: "Kayak guiado personalizado con equipo completo." }
        ]
      }
    }
  },
  {
    id: 'tricahue-spa',
    categoria: "Actividad" as Category,
    priority: 2,
    gps: { lat: -46.622799, lng: -72.674765 },
    whatsapp: "+56957135755",
    email: "tricahuespa@gmail.com",
    logo_url: "https://i.imgur.com/dZJw3tn.png",
    fotos_url: ["https://www.cascada.travel/sites/default/files/styles/hero/public/2021-06/Marble-Caves-Chile.jpg"],
    rating: 4.6,
    reviewCount: 38,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Excursiones Tricahue",
        descripcion: "Navegaciones al Santuario Capilla de Mármol.",
        direccion: "Calle Pedro Lagos",
        servicios: [
          { nombre: "Tour Capilla", precio: "CLP 20.000", desc: "1.5 hrs: Cavernas y figuras." },
          { nombre: "Tour Full Mármol", precio: "CLP 30.000", desc: "2.5 hrs: Incluye Puerto Sánchez." },
          { nombre: "Tour Pesca Lago", precio: "CLP 50.000/hr", desc: "Mín 2 hrs: Equipo completo." }
        ]
      }
    }
  },
  {
    id: 'adventure-travel-tours',
    categoria: "Actividad" as Category,
    priority: 1,
    gps: { lat: -46.622405, lng: -72.674193 },
    whatsapp: "+56964563818",
    email: "info@adventuretravel.cl",
    logo_url: "https://i.imgur.com/VlaRbYT.png",
    fotos_url: ["https://i.imgur.com/glaciar1.jpg"],
    rating: 4.7,
    reviewCount: 156,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Adventure Travel (Tours)",
        descripcion: "Tours a Capilla, Glaciar Exploradores y Laguna San Rafael.",
        direccion: "Carretera Austral",
        servicios: [
          { nombre: "Glaciar Exploradores", precio: "CLP 150.000", desc: "Trekking full day sobre hielo." },
          { nombre: "Laguna San Rafael", precio: "CLP 180.000", desc: "Catamarán full day." },
          { nombre: "Capilla de Mármol", precio: "CLP 25.000", desc: "Navegación 1.5 hrs." }
        ]
      }
    }
  },
  {
    id: 'kintun-ko',
    categoria: "Actividad" as Category,
    priority: 2,
    gps: { lat: -46.622794, lng: -72.674543 },
    whatsapp: "+56957553333",
    email: "kintunko@gmail.com",
    logo_url: "https://i.imgur.com/NRpODzI.png",
    fotos_url: ["https://www.kintun.com/images/kayak-capillas.jpg"],
    rating: 4.9,
    reviewCount: 22,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Kintun Ko Expediciones",
        descripcion: "Tours personalizados en kayak.",
        direccion: "Puerto Río Tranquilo",
        servicios: [
          { nombre: "Kayak a Capillas", precio: "CLP 50.000", desc: "3.5 hrs total. Incluye equipo." }
        ]
      }
    }
  },
  {
    id: 'rio-leon',
    categoria: "Actividad" as Category,
    priority: 2,
    gps: { lat: -46.622682, lng: -72.674658 },
    whatsapp: "+56944340109",
    email: "rioleonex@gmail.com",
    logo_url: "https://i.imgur.com/8aGI9cD.png",
    fotos_url: ["https://upload.wikimedia.org/wikipedia/commons/7/79/Cabeza_de_perro%2C_capilla_de_M%C3%A1rmol.JPG"],
    rating: 4.5,
    reviewCount: 41,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Rio León Excursiones",
        descripcion: "Agencia local. Tours en grupo y privado.",
        direccion: "Puerto Río Tranquilo, Aysén",
        servicios: [
          { nombre: "Full Mármol", precio: "CLP 30.000", desc: "2.5 hrs: Barcos históricos y cavernas." },
          { nombre: "Tour Privado Full", precio: "CLP 180.000", desc: "2.5 hrs privado hasta 5 pax." }
        ]
      }
    }
  },
  {
    id: 'panchito-marmol',
    categoria: "Actividad" as Category,
    priority: 3,
    gps: { lat: -46.622578, lng: -72.674229 },
    whatsapp: "+56999678945",
    email: "panchito@marmol.cl",
    logo_url: "https://i.imgur.com/aGUeMxL.png",
    fotos_url: ["https://panchitofullmarmol.cl/images/full-marmol.jpg"],
    rating: 4.8,
    reviewCount: 33,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Panchito Full Mármol",
        descripcion: "Tours a Santuario todo el año.",
        direccion: "Puerto Río Tranquilo, Aysén",
        servicios: [
          { nombre: "Full Mármol", precio: "CLP 30.000", desc: "Navegación completa." },
          { nombre: "Simple Mármol", precio: "CLP 20.000", desc: "Navegación simple." },
          { nombre: "Full Privado", precio: "CLP 250.000", desc: "Navegación privada completa." }
        ]
      }
    }
  },
  {
    id: 'journey-life',
    categoria: "Actividad" as Category,
    priority: 3,
    gps: { lat: -46.625496, lng: -72.675910 },
    whatsapp: "+56934248269",
    email: "journeyoflife@gmail.com",
    logo_url: "https://i.imgur.com/RAzYA9Q.png",
    fotos_url: ["https://i.imgur.com/8aVoEpn.jpeg"],
    rating: 4.7,
    reviewCount: 19,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Journey of Life",
        descripcion: "Empresa dedicada a complementar actividades turísticas. Goza de tus tiempos libres.",
        direccion: "Carretera Austral km 210",
        servicios: [
          { nombre: "Tours Personalizados", precio: "Consultar", desc: "Trekking, cabalgata, navegación." }
        ]
      }
    }
  },
  {
    id: 'huente-co',
    categoria: "Actividad" as Category,
    priority: 1,
    gps: { lat: -46.622571, lng: -72.674475 },
    whatsapp: "+56982718866",
    email: "huenteco@gmail.com",
    logo_url: "https://i.imgur.com/l30CHPZ.png",
    fotos_url: ["https://i.imgur.com/huenteco-glaciar.jpg"],
    rating: 4.9,
    reviewCount: 30,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Excursiones Huente-Có",
        descripcion: "Empresa local con tours propios: Glaciar Exploradores, Kayak en Cavernas.",
        direccion: "Puerto Río Tranquilo",
        servicios: [
          { nombre: "Glaciar Exploradores", precio: "CLP 150.000", desc: "Trekking full day sobre el glaciar." },
          { nombre: "Kayak en Cavernas de Mármol", precio: "CLP 50.000", desc: "3 hrs de kayak guiado." },
          { nombre: "Rafting Río Baker", precio: "Consultar", desc: "Descenso nivel III-IV." },
          { nombre: "Laguna San Rafael", precio: "CLP 190.000", desc: "Full day en catamarán." }
        ]
      }
    }
  },
  {
    id: 'guanaco-loco',
    categoria: "Actividad" as Category,
    priority: 1,
    gps: { lat: -46.622378, lng: -72.674129 },
    whatsapp: "+56976824240",
    email: "explora@guanacoloco.cl",
    logo_url: "https://i.imgur.com/2GSH3ev.png",
    fotos_url: ["https://i.imgur.com/guanaco1.jpg"],
    rating: 5.0,
    reviewCount: 42,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Guanaco Loco – Exploradores 4x4",
        descripcion: "Experiencias auténticas en la Patagonia. Conectar al visitante con el ecosistema.",
        direccion: "Puerto Río Tranquilo",
        servicios: [
          { nombre: "Ruta Exploradores 4x4", precio: "CLP 60.000", desc: "Miradores, cascadas y caminata." },
          { nombre: "Parque Patagonia + Confluencia", precio: "CLP 80.000", desc: "Ruta sur por Carretera Austral." },
          { nombre: "Confluencia Baker & Nef", precio: "CLP 60.000", desc: "Medio día. Ruta turquesa." }
        ]
      }
    }
  },
  {
    id: 'contramarea',
    categoria: "Actividad" as Category,
    priority: 2,
    gps: { lat: -46.6239, lng: -72.6739 },
    whatsapp: "+56987986753",
    email: "contramarea@gmail.com",
    logo_url: "https://i.imgur.com/mbEV5qo.png",
    fotos_url: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5"],
    rating: 4.8,
    reviewCount: 14,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Turismo Contramarea",
        descripcion: "Agencia emergente. Tours en bote, kayak, pesca y trekking.",
        direccion: "Sector Caseta Adventure Travel",
        servicios: [
          { nombre: "Tour en Bote Full", precio: "CLP 30.000", desc: "Navegación completa al Santuario." },
          { nombre: "Tour Laguna San Rafael", precio: "CLP 180.000", desc: "Full day al glaciar." },
          { nombre: "Trekking Cerro Cototo", precio: "CLP 20.000", desc: "Vistas panorámicas." }
        ]
      }
    }
  },

  // --- RESTAURANTES ---
  {
    id: 'ruedasyrios',
    categoria: "Restaurante" as Category,
    priority: 1,
    gps: { lat: -46.622502, lng: -72.675598 },
    whatsapp: "+56962329042",
    email: "contacto@ruedasyrios.cl",
    logo_url: "https://i.imgur.com/oqPFmRj.png",
    fotos_url: ["https://i.imgur.com/ruedasyrios1.jpg"],
    rating: 4.8,
    reviewCount: 342,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Ruedas y Ríos",
        descripcion: "Bar de hamburguesas y comida contundente. Happy Hour 17-20 hrs. Pet Friendly.",
        direccion: "Carretera Austral #121",
        servicios: [
          { nombre: "Milanesa Pollo a lo Pobre", precio: "CLP 15.000", desc: "Papas fritas, 2 huevos y cebolla." },
          { nombre: "Salmón a lo Pobre", precio: "CLP 15.000", desc: "Salmón regional fresco." },
          { nombre: "Under The Bridge", precio: "CLP 22.500", desc: "400grs costillar de cerdo BBQ." },
          { nombre: "Rest in Peace", precio: "CLP 18.500", desc: "200grs lomo y filete recheo queso." },
          { nombre: "Fresca y Grasosa", precio: "CLP 15.000", desc: "Mix verde y queso azul." }
        ]
      }
    }
  },
  {
    id: 'tios-felices',
    categoria: "Restaurante" as Category,
    priority: 2,
    gps: { lat: -46.622853, lng: -72.675112 },
    whatsapp: "+56965172500",
    email: "tiosfelices@gmail.com",
    logo_url: "https://i.imgur.com/upNs8Qs.png",
    fotos_url: ["https://images.unsplash.com/photo-1543353071-873f17a7a088"],
    rating: 4.6,
    reviewCount: 120,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Restaurante Tíos Felices",
        descripcion: "Comida casera, papas fritas naturales y cervezas. Pet Friendly.",
        direccion: "Carretera Austral con Pedro Lagos N°18",
        servicios: [
          { nombre: "Papas Fritas Naturales", precio: "Consultar", desc: "Papas caseras recién hechas." },
          { nombre: "Comida Casera", precio: "Variado", desc: "Platos contundentes y sabrosos." }
        ]
      }
    }
  },
  {
    id: 'adventure-travel-resto',
    categoria: "Restaurante" as Category,
    priority: 2,
    gps: { lat: -46.623857, lng: -72.673845 },
    whatsapp: "+56964563818",
    email: "resto@adventuretravel.cl",
    logo_url: "https://i.imgur.com/VlaRbYT.png",
    fotos_url: ["https://i.imgur.com/resto1.jpg"],
    rating: 4.5,
    reviewCount: 62,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Restaurante Adventure Travel",
        descripcion: "Cocina gourmet patagónica, cordero al palo.",
        direccion: "Carretera Austral",
        servicios: [
          { nombre: "Cordero al Palo", precio: "CLP 25.000", desc: "Especialidad regional." },
          { nombre: "Menú Ejecutivo", precio: "CLP 12.000", desc: "Variedad de platos." }
        ]
      }
    }
  },
  {
    id: 'pia-resto',
    categoria: "Restaurante" as Category,
    priority: 3,
    gps: { lat: -46.623259, lng: -72.674210 },
    whatsapp: "+56966127716",
    email: "restaurantepia@gmail.com",
    logo_url: "https://i.imgur.com/pckIgGe.png",
    fotos_url: ["https://i.imgur.com/pia-interior.jpg"],
    rating: 4.4,
    reviewCount: 31,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Restaurante Turístico Pia",
        descripcion: "Cocina tradicional y gourmet.",
        direccion: "Carretera Austral #257",
        servicios: [
          { nombre: "Platos Principales", precio: "Desde CLP 8.000", desc: "Variedad casera." }
        ]
      }
    }
  },
  {
    id: 'chirifo-cafe',
    categoria: "Restaurante" as Category,
    priority: 3,
    gps: { lat: -46.624840, lng: -72.672682 },
    whatsapp: "+56944100132",
    email: "chirifo@gmail.com",
    logo_url: "https://i.imgur.com/ItkrIeg.png",
    fotos_url: ["https://i.imgur.com/chirifo1.jpg"],
    rating: 4.7,
    reviewCount: 54,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Café Chirifo",
        descripcion: "Cafetería, desayunos y banquetería.",
        direccion: "Los Chochos s/n",
        servicios: [
          { nombre: "Menú del día", precio: "CLP 15.000", desc: "Opciones vegetarianas." }
        ]
      }
    }
  },

  // --- HOSPEDAJE ---
  {
    id: 'elpuesto-hotel',
    categoria: "Hospedaje" as Category,
    priority: 1,
    gps: { lat: -46.625098, lng: -72.677340 },
    whatsapp: "+56962073794",
    email: "reservas@elpuesto.cl",
    logo_url: "https://i.imgur.com/9fh1wLz.png",
    fotos_url: ["https://i.imgur.com/elpuesto1.jpg"],
    rating: 5.0,
    reviewCount: 142,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Hotel El Puesto",
        descripcion: "Desconexión y naturaleza. Desayuno continental vegetariano.",
        direccion: "Puerto Río Tranquilo",
        servicios: [
          { nombre: "Single Room", precio: "USD 143", desc: "Habitación individual." },
          { nombre: "Double Room", precio: "USD 216", desc: "Twin o Matrimonial." },
          { nombre: "Triple Room", precio: "USD 282", desc: "1 cama mat. + 1 plaza y media." },
          { nombre: "Cuádruple Room", precio: "USD 336", desc: "2 camas plaza y media + 1 mat." }
        ]
      }
    }
  },
  {
    id: 'aves-australes',
    categoria: "Hospedaje" as Category,
    priority: 2,
    gps: { lat: -46.623857, lng: -72.673845 },
    whatsapp: "+56964563818",
    email: "posada@avesaustrales.cl",
    logo_url: "https://cdn-icons-png.flaticon.com/512/2933/2933921.png",
    fotos_url: ["https://i.imgur.com/posada1.jpg"],
    rating: 4.6,
    reviewCount: 29,
    isOpen: true,
    translations: {
      ES: {
        nombre: "Posada Aves Australes",
        descripcion: "Habitaciones estilo tiny minimalista frente al lago.",
        direccion: "Carretera Austral",
        servicios: [
          { nombre: "Habitación Baño Privado", precio: "CLP 70.000", desc: "Incluye desayuno buffet." }
        ]
      }
    }
  }
];

export const getLocalizedBusinesses = (lang: Language): Business[] => {
  return BUSINESS_CATALOG.map(item => {
    const t = item.translations[lang] || item.translations.ES;
    return {
      id: item.id,
      nombre: t.nombre,
      categoria: item.categoria,
      priority: item.priority as any,
      gps: item.gps,
      contacto: { whatsapp: item.whatsapp, email: item.email, web: "" },
      info: {
        descripcion: t.descripcion,
        horario: "09:00 - 19:00",
        direccion: t.direccion
      },
      media: {
        logo_url: item.logo_url,
        fotos_url: item.fotos_url
      },
      servicios: t.servicios.map((s, idx) => ({
        id: `${item.id}-s-${idx}`,
        nombre: s.nombre,
        precio: s.precio,
        descripcion: s.desc,
        foto_url: item.fotos_url[0] || IMAGEN_GENERICA_TOUR
      })),
      rating: item.rating,
      reviewCount: item.reviewCount,
      isOpen: item.isOpen,
      offlineReady: true
    };
  });
};

export const MOCK_BUSINESSES: Business[] = getLocalizedBusinesses('ES');
