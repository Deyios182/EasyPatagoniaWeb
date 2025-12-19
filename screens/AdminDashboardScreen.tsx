import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';

const AdminDashboardScreen: React.FC = () => {
  const { logout } = useAppAuth();
  const navigate = useNavigate();

  return (
    <div className="p-10 bg-slate-50 min-h-screen font-body">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-4xl font-black text-slate-800">Panel Super Admin</h1>
           <p className="text-slate-500">Control total del ecosistema Easy Patagonia.</p>
        </div>
        <button onClick={logout} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 transition-colors">
            Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. MODO OPERATIVO (Ve todas las empresas y las edita) */}
        <div onClick={() => navigate('/field')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group">
           <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">travel_explore</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 mb-2">Empresas y Campo</h3>
           <p className="text-slate-500 text-sm mb-6">Ver todas las empresas, editar información, crear localidades y asignar atractivos.</p>
           <span className="text-blue-600 font-black text-sm uppercase tracking-widest group-hover:underline">Ir al Panel →</span>
        </div>

        {/* 2. USUARIOS (Nuevo) */}
        <div onClick={() => navigate('/admin/users')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group">
           <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">group</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 mb-2">Usuarios y Roles</h3>
           <p className="text-slate-500 text-sm mb-6">Administrar cuentas, asignar roles de Colaborador o Dueño de Empresa.</p>
           <span className="text-purple-600 font-black text-sm uppercase tracking-widest group-hover:underline">Gestionar Usuarios →</span>
        </div>

        {/* 3. LANDING (Nuevo) */}
        <div onClick={() => navigate('/admin/landing')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group">
           <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">web</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 mb-2">Landing Page</h3>
           <p className="text-slate-500 text-sm mb-6">Editar textos de la portada, cambiar imágenes de misión/visión y carrusel.</p>
           <span className="text-orange-600 font-black text-sm uppercase tracking-widest group-hover:underline">Editar Web →</span>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardScreen;
