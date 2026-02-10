import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterScreen: React.FC = () => {
    const navigate = useNavigate();
    const { register, loginWithOAuth, loading } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validations
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        const { success, error: registerError } = await register(
            formData.email,
            formData.password,
            formData.firstName,
            formData.lastName,
            formData.username
        );

        if (success) {
            navigate('/map');
        } else {
            setError(registerError?.message || 'Error al registrarse');
        }

        setIsLoading(false);
    };

    const handleOAuthRegister = async (provider: 'google' | 'facebook') => {
        setError('');
        const { success, error: oauthError } = await loginWithOAuth(provider);

        if (!success && oauthError) {
            setError(oauthError.message || `Error al registrarse con ${provider}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm font-body overflow-y-auto py-8">
            <div className="relative w-full max-w-md mx-4">
                {/* Close button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20"
                    aria-label="Cerrar"
                >
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>

                {/* Register Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                    {/* Logo/Title */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-black text-slate-800">Crear Cuenta</h1>
                        <p className="text-slate-500 text-sm mt-1">Únete a EasyPatagonia</p>
                    </div>

                    {/* Social Register */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => handleOAuthRegister('google')}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Registrarse con Google
                        </button>

                        <button
                            onClick={() => handleOAuthRegister('facebook')}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#1877F2] text-white rounded-xl font-bold hover:bg-[#166FE5] transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Registrarse con Facebook
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500 font-medium">o</span>
                        </div>
                    </div>

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                                    placeholder="Juan"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Apellido</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                                    placeholder="Pérez"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="tu@email.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de usuario</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                minLength={3}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="juanperez"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar contraseña</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || loading}
                            className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta →'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center text-sm text-slate-600">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/auth/login" className="text-primary font-bold hover:underline">
                            Inicia sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;
