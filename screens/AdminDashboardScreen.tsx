import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';

const AdminDashboardScreen: React.FC = () => {
  const { user, logout } = useAppAuth();
  const navigate = useNavigate();

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-4xl font-black text-slate-800">Panel Super Admin</h1>
           <p className="text-slate-500">Control total del ecosistema Easy Patagonia.</p>
        </div>
        <div className="flex gap-4">
            <button onClick={logout} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 transition-colors">
                Cerrar Sesión
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* TARJETA 1: GESTIÓN DE CAMPO (MODO COLABORADOR) */}
        <div 
          onClick={() => navigate('/field')}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
           <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-3xl">travel_explore</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 mb-2">Modo Operativo</h3>
           <p className="text-slate-500 text-sm mb-6">
             Accede a las herramientas de Easy Colaborador: Crear localidades, gestionar atractivos y registrar empresas.
           </p>
           <span className="text-blue-600 font-black text-sm uppercase tracking-widest group-hover:underline">Ir al Panel de Campo →</span>
        </div>

        {/* TARJETA 2: GESTIÓN DE USUARIOS (Próximamente) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 opacity-60">
           <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">group</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 mb-2">Usuarios y Roles</h3>
           <p className="text-slate-500 text-sm mb-6">
             Administra colaboradores y dueños de empresa. Asigna roles y permisos. (En desarrollo)
           </p>
        </div>

        {/* TARJETA 3: CONTENIDO LANDING (Próximamente) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 opacity-60">
           <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">web</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 mb-2">Landing Page</h3>
           <p className="text-slate-500 text-sm mb-6">
             Edita el carrusel principal, textos de misión/visión y fotos destacadas. (En desarrollo)
           </p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardScreen;
