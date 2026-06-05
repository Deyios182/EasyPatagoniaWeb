import React from 'react';

// Marcador para atractivos turísticos generales (naranja con estrella)
export const AttractionMarker: React.FC = () => (
    <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        {/* Pin exterior */}
        <path
            d="M13 0C5.82 0 0 5.82 0 13c0 7.18 13 21 13 21s13-13.82 13-21C26 5.82 20.18 0 13 0z"
            fill="#F97316"
            stroke="#fff"
            strokeWidth="2"
        />
        {/* Icono de estrella */}
        <g transform="translate(6, 5)">
            <path
                d="M7 0l2.1 4.3 4.7.7-3.4 3.3.8 4.7L7 10.9 2.8 13l.8-4.7L0 5l4.7-.7L7 0z"
                fill="white"
                transform="scale(0.9)"
            />
        </g>
    </svg>
);

// Marcador para mercados/artesanías (azul con carrito)
export const MarketMarker: React.FC = () => (
    <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        {/* Pin exterior */}
        <path
            d="M13 0C5.82 0 0 5.82 0 13c0 7.18 13 21 13 21s13-13.82 13-21C26 5.82 20.18 0 13 0z"
            fill="#2563EB"
            stroke="#fff"
            strokeWidth="2"
        />
        {/* Icono de carrito de compras */}
        <g transform="translate(5, 5)" fill="white">
            <path d="M0 0h2l1 2h11l-1.5 6H4L2 2H0V0z" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="12" cy="12" r="1.2" />
            <rect x="4" y="2" width="10" height="5" rx="0.5" />
        </g>
    </svg>
);

// Marcador para bencineras/gasolineras (negro)
export const GasStationMarker: React.FC = () => (
    <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        {/* Pin exterior */}
        <path
            d="M13 0C5.82 0 0 5.82 0 13c0 7.18 13 21 13 21s13-13.82 13-21C26 5.82 20.18 0 13 0z"
            fill="#1A1A1A"
            stroke="#fff"
            strokeWidth="2"
        />
        {/* Icono de bomba de gasolina */}
        <g transform="translate(5.5, 5)" fill="white">
            <rect x="2" y="1.5" width="7" height="2.5" rx="0.8" />
            <rect x="1" y="4" width="9" height="7.5" rx="0.8" />
            <rect x="10" y="5.5" width="2.5" height="5" rx="0.8" />
            <circle cx="3.5" r="1.2" cy="7.5" />
            <circle cx="7.5" r="1.2" cy="7.5" />
        </g>
    </svg>
);

// Marcador para campings (verde)
export const CampingMarker: React.FC = () => (
    <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        {/* Pin exterior */}
        <path
            d="M13 0C5.82 0 0 5.82 0 13c0 7.18 13 21 13 21s13-13.82 13-21C26 5.82 20.18 0 13 0z"
            fill="#22C55E"
            stroke="#fff"
            strokeWidth="2"
        />
        {/* Icono de carpa */}
        <g transform="translate(4.5, 5)" fill="white">
            <path d="M8.5 3.5L3 11.5h11L8.5 3.5z" />
            <path d="M8.5 5.5l3.5 6H5l3.5-6z" fill="#22C55E" />
            <rect x="2.5" y="11.5" width="12" height="1.2" />
        </g>
    </svg>
);

// Función helper para obtener el marcador correcto según categoría
export const getMarkerComponent = (category?: string) => {
    switch (category) {
        case 'gas_station':
            return GasStationMarker;
        case 'camping':
            return CampingMarker;
        case 'market':
            return MarketMarker;
        case 'attraction':
        default:
            return AttractionMarker;
    }
};
