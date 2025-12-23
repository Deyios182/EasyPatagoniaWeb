import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const AuthCallbackScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [timeoutReached, setTimeoutReached] = useState(false);

    useEffect(() => {
        // 🔍 MANUAL TOKEN PARSING FOR HASH ROUTER 🔍
        // Supabase + HashRouter creates URLs like: /#/auth/callback#access_token=...
        // The standard client might miss the second hash. We parse it manually here.
        const handleManualSession = async () => {
            const hash = window.location.hash; // e.g., "#/auth/callback#access_token=..."
            console.log('Current URL Hash:', hash);

            // Check if we have an access_token hidden in the hash
            if (hash.includes('access_token=') && !user) {
                try {
                    // Extract the part after the last #
                    const tokenPart = hash.substring(hash.lastIndexOf('#') + 1);
                    const params = new URLSearchParams(tokenPart);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken) {
                        console.log('Found access token manually. Setting session...');
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (error) {
                            console.error('Manual session set failed:', error);
                        } else {
                            console.log('Manual session set success:', data.session);
                            // The useAuth hook should pick up the change automatically
                        }
                    }
                } catch (err) {
                    console.error('Error parsing manual token:', err);
                }
            }
        };

        handleManualSession();

        // Set a timeout to avoid getting stuck
        const timer = setTimeout(() => {
            setTimeoutReached(true);
        }, 2000); // 2 seconds timeout - optimized

        return () => clearTimeout(timer);
    }, []); // Run once on mount

    useEffect(() => {
        // Redirect immediately if we have a user
        if (user) {
            // Clear the hash and redirect instantly
            window.history.replaceState(null, '', window.location.pathname + '#/map');
            navigate('/map', { replace: true });
            return;
        }

        // If no user and loading is done, check if we should redirect to login
        if (!loading && !user && timeoutReached) {
            const hasTokenInUrl = window.location.hash.includes('access_token=');
            if (!hasTokenInUrl) {
                navigate('/auth/login', { replace: true });
            }
        }
    }, [user, loading, timeoutReached, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Completando inicio de sesión...</p>
                {timeoutReached && (
                    <div className="mt-6 flex flex-col items-center gap-3">
                        <button
                            onClick={async () => {
                                // HARDENED NAVIGATION: Force full redirect if necessary, but try navigate first
                                console.log('FORCE CONTINUE clicked');
                                // Clear the hash to prevent re-triggering auth logic
                                window.history.replaceState(null, '', window.location.pathname);
                                navigate('/map', { replace: true });
                            }}
                            className="text-[#dd6e42] font-black text-sm uppercase tracking-widest hover:underline cursor-pointer"
                        >
                            Continuar de todos modos →
                        </button>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                navigate('/auth/login', { replace: true });
                            }}
                            className="text-gray-400 text-xs hover:text-gray-600"
                        >
                            Cancelar y volver
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthCallbackScreen;
