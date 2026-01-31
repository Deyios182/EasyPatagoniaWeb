import React from 'react';

// Marcador para atractivos turísticos generales (naranja)
export const AttractionMarker: React.FC = () => (
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        {/* Pin exterior */}
        <path
            d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z"
            fill="#FF6B35"
            stroke="#fff"
            strokeWidth="2"
        />
        {/* Icono de montaña */}
        <g transform="translate(8, 8)">
            <path
                d="M8 4l-6 10h12L8 4zm0 3l3.5 6h-7L8 7z"
                fill="white"
            />
        </g>
    </svg>
);

// Marcador para bencineras/gasolineras (rojo)
export const GasStationMarker: React.FC = () => (
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        {/* Pin exterior */}
        <path
            d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z"
            fill="#DC2626"
            stroke="#fff"
            strokeWidth="2"
        />
        {/* Icono de bomba de gasolina */}
        <g transform="translate(7, 7)" fill="white">
            <rect x="2" y="2" width="8" height="3" rx="1" />
            <rect x="1" y="5" width="10" height="9" rx="1" />
            <rect x="11" y="7" width="3" height="6" rx="1" />
            <circle cx="4" cy="9" r="1.5" />
            <circle cx="8" cy="9" r="1.5" />
        </g>
    </svg>
);

// Marcador para campings (verde)
export const CampingMarker: React.FC = () => (
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        {/* Pin exterior */}
        <path
            d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z"
            fill="#16A34A"
            stroke="#fff"
            strokeWidth="2"
        />
        {/* Icono de carpa */}
        <g transform="translate(6, 7)" fill="white">
            <path d="M10 4L4 14h12L10 4z" />
            <path d="M10 6l4 8H6l4-8z" fill="#16A34A" />
            <rect x="3" y="14" width="14" height="1.5" />
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
        case 'attraction':
        default:
            return AttractionMarker;
    }
};
