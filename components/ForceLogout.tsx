import React from 'react';
import { supabase } from '../supabaseClient';

const ForceLogout: React.FC = () => {
    const handleForceLogout = async () => {
        // 1. Logout de Supabase
        await supabase.auth.signOut();

        // 2. Limpiar localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) {
                localStorage.removeItem(key);
            }
        });

        // 3. Limpiar sessionStorage
        sessionStorage.clear();

        // 4. Recargar
        window.location.href = '/';
    };

    return (
        <div className="fixed top-4 right-4 z-[9999]">
            <button
                onClick={handleForceLogout}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-red-700 transition-all"
            >
                🔧 FORZAR LOGOUT
            </button>
        </div>
    );
};

export default ForceLogout;
