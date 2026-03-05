import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface UserProfile {
    user_id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    person_type: string;
    is_active: boolean;
    roles: string[];
    person_id: string;
}

export interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    error: AuthError | null;
}

export const useSupabaseAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        profile: null,
        session: null,
        loading: true,
        error: null
    });

    // Cache and deduplication for profile fetches
    const profileCache = useRef<{ [userId: string]: { data: UserProfile | null, timestamp: number } }>({});
    const pendingFetches = useRef<{ [userId: string]: Promise<UserProfile | null> }>({});
    const CACHE_TTL = 300000; // 5 minutes cache - optimized for active sessions

    // Fetch user profile from our custom tables
    // 2025-12-21: MIGRATED TO UNIFIED 'profiles' TABLE
    const fetchUserProfile = async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
        try {
            // Check cache first
            const cached = profileCache.current[userId];
            if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
                console.log('✅ [PROFILE] Using cached profile for:', userId);
                return cached.data;
            }

            // Deduplication
            if (pendingFetches.current[userId]) return pendingFetches.current[userId];

            console.log('🔵 [PROFILE] Fetching from profiles table for:', userId);

            const fetchPromise = (async () => {
                try {
                    // Use direct fetch to REST API instead of Supabase client
                    // This bypasses any potential issues with the JS client
                    // @ts-ignore - Vite env vars
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
                    // @ts-ignore - Vite env vars
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

                    const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;

                    // FIX: Use user's JWT session token for RLS (falls back to anon key if no session)
                    const { data: sessionData } = await supabase.auth.getSession();
                    const authToken = sessionData?.session?.access_token || supabaseKey;

                    console.log('📤 [PROFILE] Fetching via REST API...');

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.pgrst.object+json' // Get single object instead of array
                        },
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ [PROFILE] REST API error:', response.status, errorText);
                        throw new Error(`REST API error: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('📦 [PROFILE] REST API result:', data);

                    if (data && data.id) {
                        console.log('✅ [PROFILE] Found profile with role:', data.role);

                        const profile: UserProfile = {
                            user_id: data.id,
                            username: data.email?.split('@')[0] || 'user',
                            email: data.email || '',
                            first_name: data.first_name || '',
                            last_name: data.last_name || '',
                            full_name: data.full_name || `${data.first_name} ${data.last_name}`.trim(),
                            person_type: 'tourist',
                            is_active: data.is_active ?? true,
                            avatar_url: data.avatar_url,
                            phone: null,
                            roles: [data.role || 'tourist'],
                            person_id: data.id
                        };

                        profileCache.current[userId] = { data: profile, timestamp: Date.now() };
                        return profile;
                    }

                    // Profile not found - try to create it
                    console.warn('⚠️ [PROFILE] No profile found, will use fallback for userId:', userId);
                    return null;
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.error('❌ [PROFILE] Request aborted (timeout)');
                    } else if (err?.message?.includes('406')) {
                        // 406 = No rows found - don't cache this as it might be a new user
                        console.warn('⚠️ [PROFILE] Profile not in DB (406), will use OAuth fallback');
                        return null; // Don't cache - let fallback handle it
                    } else {
                        console.error('❌ [PROFILE] Error:', err?.message || err);
                    }
                    // Only cache errors that are NOT 406 (profile not found)
                    // This allows retry for new users
                    return null;
                } finally {
                    delete pendingFetches.current[userId];
                }
            })();

            pendingFetches.current[userId] = fetchPromise;
            return fetchPromise;

        } catch (error) {
            console.error('❌ [PROFILE] Outer error:', error);
            return null;
        }
    };

    // Initialize auth state
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Get current session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    if (mounted) {
                        setAuthState(prev => ({ ...prev, loading: false, error }));
                    }
                    return;
                }

                if (session?.user) {
                    // IMMEDIATE UPDATE: Tell the app we have a user
                    if (mounted) {
                        setAuthState(prev => ({
                            ...prev,
                            user: session.user,
                            session: session,
                            loading: true,
                            error: null
                        }));
                    }

                    // Try to fetch profile from database
                    const profile = await fetchUserProfile(session.user.id, session.user.email);

                    // FALLBACK: If profile fetch fails, create one from OAuth metadata
                    // Assign super_admin role to known admin emails
                    const adminEmails = ['thejozx.182@gmail.com', 'fco.tejos.c@gmail.com', 'fel.ramirez.fig@gmail.com'];
                    const userEmail = session.user.email || '';
                    const fallbackRole = adminEmails.includes(userEmail) ? 'super_admin' : 'tourist';

                    const finalProfile = profile || {
                        user_id: session.user.id,
                        username: session.user.email?.split('@')[0] || 'user',
                        email: userEmail,
                        first_name: session.user.user_metadata?.full_name?.split(' ')[0] || session.user.user_metadata?.name || 'Usuario',
                        last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuario',
                        person_type: 'tourist',
                        is_active: true,
                        avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                        phone: null,
                        roles: [fallbackRole],
                        person_id: session.user.id
                    };

                    if (mounted) {
                        setAuthState({
                            user: session.user,
                            profile: finalProfile,
                            session,
                            loading: false,
                            error: null
                        });
                    }
                } else {
                    if (mounted) {
                        setAuthState({
                            user: null,
                            profile: null,
                            session: null,
                            loading: false,
                            error: null
                        });
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                if (mounted) {
                    setAuthState(prev => ({ ...prev, loading: false }));
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                if (session?.user) {
                    // OPTIMIZED GUARD: Skip fetch if we have valid cached data for this user
                    const currentProfile = authState.profile;
                    const isSameUser = currentProfile?.user_id === session.user.id;
                    const hasValidCache = profileCache.current[session.user.id] &&
                        (Date.now() - profileCache.current[session.user.id].timestamp) < CACHE_TTL;

                    // Skip fetch for SIGNED_IN and TOKEN_REFRESHED events if we have valid cache
                    if (isSameUser && hasValidCache && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                        console.log('⏭️ [AUTH] Skipping profile fetch - using cached data');
                        if (mounted) {
                            setAuthState(prev => ({
                                ...prev,
                                user: session.user,
                                session: session,
                                loading: false
                            }));
                        }
                        return;
                    }

                    // IMMEDIATE UPDATE: Tell the app we have a user
                    if (mounted) {
                        setAuthState(prev => ({
                            ...prev,
                            user: session.user,
                            session: session,
                            loading: true,
                            error: null
                        }));
                    }

                    const profile = await fetchUserProfile(session.user.id, session.user.email);

                    // FALLBACK: If profile fetch fails, create one from OAuth metadata
                    // Assign super_admin role to known admin emails
                    const adminEmails = ['thejozx.182@gmail.com', 'fco.tejos.c@gmail.com', 'fel.ramirez.fig@gmail.com'];
                    const userEmail = session.user.email || '';
                    const fallbackRole = adminEmails.includes(userEmail) ? 'super_admin' : 'tourist';

                    const finalProfile = profile || {
                        user_id: session.user.id,
                        username: session.user.email?.split('@')[0] || 'user',
                        email: userEmail,
                        first_name: session.user.user_metadata?.full_name?.split(' ')[0] || session.user.user_metadata?.name || 'Usuario',
                        last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuario',
                        person_type: 'tourist',
                        is_active: true,
                        avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                        phone: null,
                        roles: [fallbackRole],
                        person_id: session.user.id
                    };

                    if (mounted) {
                        setAuthState({
                            user: session.user,
                            profile: finalProfile,
                            session,
                            loading: false,
                            error: null
                        });
                    }
                } else {
                    // User signed out - clear everything
                    console.log('🔴 [AUTH] User signed out, clearing all state and cache');
                    profileCache.current = {};
                    pendingFetches.current = {};
                    if (mounted) {
                        setAuthState({
                            user: null,
                            profile: null,
                            session: null,
                            loading: false,
                            error: null
                        });
                    }
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Login with email and password
    const loginWithEmail = async (email: string, password: string) => {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setAuthState(prev => ({ ...prev, loading: false, error }));
            return { success: false, error };
        }

        return { success: true, data };
    };

    // Login with OAuth (Google, Facebook, etc.)
    const loginWithOAuth = async (provider: 'google' | 'facebook' | 'github') => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/#/auth/callback`
            }
        });

        if (error) {
            setAuthState(prev => ({ ...prev, error }));
            return { success: false, error };
        }

        return { success: true, data };
    };

    // Register new user
    const register = async (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        username: string
    ) => {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // 1. Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        username
                    }
                }
            });

            if (authError) {
                setAuthState(prev => ({ ...prev, loading: false, error: authError }));
                return { success: false, error: authError };
            }

            if (!authData.user) {
                const error = new Error('No user returned from signup') as AuthError;
                setAuthState(prev => ({ ...prev, loading: false, error }));
                return { success: false, error };
            }

            // 2. Create user record using our function
            const { error: createError } = await supabase.rpc('create_user_complete', {
                p_email: email,
                p_first_name: firstName,
                p_last_name: lastName,
                p_username: username,
                p_password_hash: 'managed_by_supabase_auth',
                p_auth_provider: 'email',
                p_provider_user_id: authData.user.id
            });

            if (createError) {
                console.error('Error creating user profile:', createError);
                // Auth user was created but profile failed - still return success
                // Profile will be created on next login attempt
            }

            setAuthState(prev => ({ ...prev, loading: false }));
            return { success: true, data: authData };
        } catch (error) {
            console.error('Registration error:', error);
            const authError = error as AuthError;
            setAuthState(prev => ({ ...prev, loading: false, error: authError }));
            return { success: false, error: authError };
        }
    };

    // Logout - Optimized for speed
    const logout = async () => {
        // Clear caches immediately
        profileCache.current = {};
        pendingFetches.current = {};

        // Reset auth state first for instant UI update
        setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null
        });

        // Sign out from Supabase (async, non-blocking for UI)
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error);
            return { success: false, error };
        }

        return { success: true };
    };

    // Reset password request
    const resetPasswordRequest = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
            return { success: false, error };
        }

        return { success: true };
    };

    // Update password
    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            return { success: false, error };
        }

        return { success: true };
    };

    // Check if user has permission
    const hasPermission = (permission: string): boolean => {
        if (!authState.profile?.roles) return false;

        // Super admin has all permissions
        if (authState.profile.roles.includes('super_admin')) return true;

        // Check specific permission (would need to fetch from roles table)
        // For now, basic role check
        return authState.profile.roles.length > 0;
    };

    // Check if user has role
    const hasRole = (role: string): boolean => {
        return authState.profile?.roles?.includes(role) || false;
    };

    // Manually refetch the current user's profile (useful after updates like avatar change)
    const refetchProfile = async () => {
        const currentUserId = authState.user?.id;
        if (!currentUserId) {
            console.warn('[REFETCH] No user logged in, cant refetch profile');
            return;
        }

        console.log('🔄 [REFETCH] Clearing cache and refetching profile for:', currentUserId);

        // Clear the cache for this user to force a fresh fetch
        delete profileCache.current[currentUserId];

        const freshProfile = await fetchUserProfile(currentUserId);

        if (freshProfile) {
            console.log('✅ [REFETCH] Profile updated:', freshProfile);
            setAuthState(prev => ({ ...prev, profile: freshProfile }));
        } else {
            console.error('❌ [REFETCH] Failed to refetch profile');
        }
    };

    return {
        ...authState,
        loginWithEmail,
        loginWithOAuth,
        register,
        logout,
        resetPasswordRequest,
        updatePassword,
        hasPermission,
        hasRole,
        refetchProfile,  // NEW: Expose the refetch function
        isAuthenticated: !!authState.user,
        isAdmin: hasRole('admin') || hasRole('super_admin')
    };
};
