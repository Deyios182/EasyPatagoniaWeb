// Google Analytics 4 Configuration
export const GA_MEASUREMENT_ID = 'G-ZAM3CD1DZ1';

// Meta Pixel Configuration
export const META_PIXEL_ID = '1013240253378766';

// Initialize Google Analytics
export const initGA = () => {
    if (typeof window === 'undefined') return;

    // Google Analytics 4
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
        window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
    });

    // Make gtag globally available
    (window as any).gtag = gtag;
};

// Initialize Meta Pixel
export const initMetaPixel = () => {
    if (typeof window === 'undefined') return;

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
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    (window as any).fbq('init', META_PIXEL_ID);
    (window as any).fbq('track', 'PageView');
};

// Track custom events in GA4
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, eventParams);
    }
};

// Track custom events in Meta Pixel
export const trackMetaEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', eventName, eventParams);
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
        // GA4
        if ((window as any).gtag) {
            (window as any).gtag('config', GA_MEASUREMENT_ID, {
                page_path: url,
            });
        }

        // Meta Pixel
        if ((window as any).fbq) {
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
