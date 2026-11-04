import { getStoredPreferences } from '../utils/cookieConsent';

// Google Analytics 4 Configuration
export const GA_MEASUREMENT_ID = 'G-Z6MSCD1DZ1';

// Meta Pixel Configuration
export const META_PIXEL_ID = '1613240233378766';

let gaScriptLoaded = false;
let metaPixelLoaded = false;

// Initialize Google Analytics SOLO con consentimiento explícito
export const initGA = () => {
    if (typeof window === 'undefined') return;

    const prefs = getStoredPreferences();
    if (!prefs || !prefs.analytics) {
        console.log('🔒 GA4 bloqueado previo al consentimiento explícito (Ley 21.719)');
        return;
    }

    if (gaScriptLoaded) {
        console.log('✅ GA4 ya inicializado');
        return;
    }

    console.log('🔄 Inicializando Google Analytics 4 con consentimiento...');

    // Inyectar script de GA4 de forma dinámica
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.onload = () => {
        gaScriptLoaded = true;
        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
            (window as any).dataLayer.push(args);
        }
        (window as any).gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            anonymize_ip: true,
        });
        console.log('✅ Google Analytics 4 cargado tras consentimiento explícito');
    };
    script.onerror = () => {
        console.error('❌ Error al cargar GA4');
    };
    document.head.appendChild(script);
};

// Initialize Meta Pixel SOLO con consentimiento explícito
export const initMetaPixel = () => {
    if (typeof window === 'undefined') return;

    const prefs = getStoredPreferences();
    if (!prefs || !prefs.marketing) {
        console.log('🔒 Meta Pixel bloqueado previo al consentimiento explícito (Ley 21.719)');
        return;
    }

    if (metaPixelLoaded) {
        console.log('✅ Meta Pixel ya inicializado');
        return;
    }

    console.log('🔄 Inicializando Meta Pixel con consentimiento...');

    // Meta Pixel Base Code
    !(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        t.onload = () => {
            metaPixelLoaded = true;
            console.log('✅ Meta Pixel cargado exitosamente tras consentimiento');
        };
        t.onerror = () => {
            console.error('❌ Error cargando Meta Pixel');
        };
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    (window as any).fbq('init', META_PIXEL_ID);
    (window as any).fbq('track', 'PageView');
};

// Track custom events in GA4
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        const prefs = getStoredPreferences();
        if (prefs?.analytics) {
            (window as any).gtag('event', eventName, eventParams);
        }
    }
};

// Track custom events in Meta Pixel
export const trackMetaEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        const prefs = getStoredPreferences();
        if (prefs?.marketing) {
            (window as any).fbq('track', eventName, eventParams);
        }
    }
};

// Combined tracking for both platforms
export const trackCustomEvent = (eventName: string, eventParams?: Record<string, any>) => {
    trackEvent(eventName, eventParams);
    trackMetaEvent(eventName, eventParams);
};

// Page view tracking
export const trackPageView = (url: string) => {
    if (typeof window !== 'undefined') {
        const prefs = getStoredPreferences();

        // GA4
        if (prefs?.analytics && (window as any).gtag) {
            (window as any).gtag('config', GA_MEASUREMENT_ID, {
                page_path: url,
            });
        }

        // Meta Pixel
        if (prefs?.marketing && (window as any).fbq) {
            (window as any).fbq('track', 'PageView');
        }
    }
};

// Conversion events
export const trackConversion = (conversionType: string, value?: number) => {
    trackCustomEvent('Conversion', {
        conversion_type: conversionType,
        value: value,
        currency: 'CLP',
    });
};

// Business interactions
export const trackBusinessClick = (businessName: string, category: string) => {
    trackCustomEvent('business_click', {
        business_name: businessName,
        business_category: category,
    });
};

// Attraction interactions
export const trackAttractionView = (attractionName: string, locality: string) => {
    trackCustomEvent('attraction_view', {
        attraction_name: attractionName,
        locality: locality,
    });
};

// Chatbot interactions
export const trackChatbotInteraction = (action: string) => {
    trackCustomEvent('chatbot_interaction', {
        action: action,
    });
};

// Map interactions
export const trackMapInteraction = (action: string, zoom?: number) => {
    trackCustomEvent('map_interaction', {
        action: action,
        zoom_level: zoom,
    });
};

// Search tracking
export const trackSearch = (searchQuery: string, resultsCount: number) => {
    trackCustomEvent('search', {
        search_term: searchQuery,
        results_count: resultsCount,
    });
};

// User engagement
export const trackEngagement = (engagementType: string, duration?: number) => {
    trackCustomEvent('user_engagement', {
        engagement_type: engagementType,
        duration_seconds: duration,
    });
};

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
        fbq: (...args: any[]) => void;
        _fbq: any;
    }
}

