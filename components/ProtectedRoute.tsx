import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin = false,
    requireRole
}) => {
    const { isAuthenticated, isAdmin, hasRole, loading, user, profile } = useAuth();
    const location = useLocation();

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-primary mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-semibold animate-pulse">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated && !user) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // Require admin but user is not admin
    if (requireAdmin && !isAdmin) {
        // ... existing admin logic ...
        // For now, if profile is missing, isAdmin will be false, so this block might block us
        // So let's add a safe check: if no profile, we can't be admin, so true block.
        // BUT for debugging, if we are just trying to map, we probably don't need admin.
        // Assuming map is not admin only.
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">block</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Denegado</h2>
                    <p className="text-slate-600 mb-6">No tienes permisos de administrador para acceder a esta página.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // Require specific role
    if (requireRole && !hasRole(requireRole)) {
        // Same here, need robust check
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Restringido</h2>
                    <p className="text-slate-600 mb-6">
                        Necesitas el rol de <span className="font-bold text-primary">{requireRole}</span> para acceder a esta página.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // All checks passed - render children
    return <>{children}</>;
};

export default ProtectedRoute;
