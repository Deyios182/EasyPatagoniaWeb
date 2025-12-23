import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import type { UserProfile, AuthState } from '../hooks/useSupabaseAuth';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
    loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
    loginWithOAuth: (provider: 'google' | 'facebook' | 'github') => Promise<{ success: boolean; error?: AuthError }>;
    register: (email: string, password: string, firstName: string, lastName: string, username: string) => Promise<{ success: boolean; error?: AuthError }>;
    logout: () => Promise<{ success: boolean; error?: AuthError }>;
    resetPasswordRequest: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
    updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: AuthError }>;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
    refetchProfile: () => Promise<void>;  // NEW: Manual profile refresh
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const auth = useSupabaseAuth();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
