import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Business } from '../types';

interface LogoTickerProps {
    businesses: Business[];
    speed?: number; // Duration in seconds for one complete cycle
}

const LogoTicker: React.FC<LogoTickerProps> = ({ businesses, speed = 40 }) => {
    const navigate = useNavigate();

    // Filter businesses that have a logo
    const validBusinesses = React.useMemo(() => {
        return businesses.filter(b => b.media && b.media.logo_url);
    }, [businesses]);

    if (validBusinesses.length === 0) return null;

    return (
        <div className="w-full bg-[#1a2a30] py-6 border-t border-white/5 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#1a2a30] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1a2a30] to-transparent z-10 pointer-events-none"></div>

            <div className="flex w-full">
                <div
                    className="flex gap-12 items-center animate-infinite-scroll whitespace-nowrap"
                    style={{ animationDuration: `${speed}s` }}
                >
                    {/* Render content twice for seamless loop */}
                    {[...validBusinesses, ...validBusinesses].map((business, index) => (
                        <button
                            key={`${business.id}-${index}`}
                            onClick={() => navigate(`/attraction/${business.id}`)} // Or business details if different
                            className="group relative flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-500 opacity-50 hover:opacity-100 hover:scale-110"
                            title={business.nombre}
                        >
                            <img
                                src={business.media.logo_url}
                                className="h-12 w-auto object-contain max-w-[120px]"
                                alt={business.nombre}
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes infinite-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll linear infinite;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
};

export default LogoTicker;
