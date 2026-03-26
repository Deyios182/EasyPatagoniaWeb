import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Bottom Navigation Bar Component
 * Persistent navigation menu for mobile view
 * Shows: Imperdibles | Guía | Mapa (center) | Plan | IA
 */
const BottomNavigationBar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 pb-6 pt-3 px-6 flex justify-between items-center z-[110] h-[70px] shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">

            {/* 1. IMPERDIBLES (Left) */}
            <Link
                to="/highlights"
                className={`flex flex-col items-center gap-1 no-underline w-12 transition-colors ${isActive('/highlights') ? 'text-primary' : 'text-slate-400 hover:text-primary'
                    }`}
            >
                <span className="material-symbols-outlined text-2xl leading-none">grade</span>
                <span className="text-[8px] font-black uppercase tracking-widest leading-none scale-90">Imperdibles</span>
            </Link>

            {/* 2. GUÍA/COLABORADORES (Mid-Left) */}
            <Link
                to="/directory"
                className={`flex flex-col items-center gap-1 no-underline w-12 transition-colors ${isActive('/directory') ? 'text-primary' : 'text-slate-400 hover:text-primary'
                    }`}
            >
                <span className="material-symbols-outlined text-2xl leading-none">list_alt</span>
                <span className="text-[8px] font-black uppercase tracking-widest leading-none scale-90">Guía</span>
            </Link>

            {/* 3. MAPA (CENTER - BIG) */}
            <div className="-mt-8">
                <Link
                    to="/map"
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-background-dark active:scale-95 transition-all ${isActive('/map')
                            ? 'bg-gradient-to-tr from-primary to-orange-400 shadow-primary/40'
                            : 'bg-gradient-to-tr from-primary/80 to-orange-400/80 shadow-primary/30'
                        }`}
                >
                    <span className="material-symbols-outlined text-2xl">map</span>
                </Link>
            </div>

            {/* 4. MURAL GLOBAL (Mid-Right) */}
            <Link
                to="/community"
                className={`flex flex-col items-center gap-1 no-underline w-12 transition-colors ${isActive('/community') ? 'text-primary' : 'text-slate-400 hover:text-primary'
                    }`}
            >
                <span className="material-symbols-outlined text-2xl leading-none">diversity_3</span>
                <span className="text-[8px] font-black uppercase tracking-widest leading-none scale-90">Mural</span>
            </Link>

            {/* 5. PATAGONIA (Far Right) */}
            <Link
                to="/chat"
                className={`flex flex-col items-center gap-1 no-underline w-12 transition-colors ${isActive('/chat') || isActive('/planner') ? 'text-primary' : 'text-slate-400 hover:text-primary'
                    }`}
            >
                <span className="material-symbols-outlined text-2xl leading-none">smart_toy</span>
                <span className="text-[8px] font-black uppercase tracking-widest leading-none scale-90 whitespace-nowrap">PatagonIA</span>
            </Link>
        </div>
    );
};

export default BottomNavigationBar;
