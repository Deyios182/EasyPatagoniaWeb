import { supabase } from '../supabaseClient';
import { MOCK_BUSINESSES } from '../constants';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import { Role, User } from '../types';

const AdminDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { usersRegistry, allBusinesses, registerUser } = useAppAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'businesses' | 'stats'>('stats');
  const [showUserModal, setShowUserModal] = useState(false);
  const handleMigration = async () => {
  if (!confirm("¿Subir todos los negocios locales a Supabase? Esto puede duplicar si ya existen.")) return;

  const { error } = await supabase
    .from('businesses')
    .upsert(MOCK_BUSINESSES.map(b => ({
       id: b.id,
       nombre: b.nombre,
       categoria: b.categoria,
       priority: b.priority,
       gps: b.gps,
       contacto: b.contacto,
       info: b.info,
       media: b.media,
       servicios: b.servicios,
       rating: b.rating,
       review_count: b.reviewCount,
       is_open: b.isOpen
    })));

  if (error) alert("Error en migración: " + error.message);
  else alert("¡Migración Exitosa! Ahora tus datos están en la nube ☁️");
};
  <button onClick={handleMigration} className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl mb-6 shadow-xl">
   🚀 MIGRAR DATOS A LA NUBE
</button>
  // Formulario nuevo usuario
  const [newUser, setNewUser] = useState({ name: '', email: '', rol: 'Turista' as Role });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) return;
    registerUser({
      uid: `u-${Date.now()}`,
      ...newUser,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
    });
    setShowUserModal(false);
    setNewUser({ name: '', email: '', rol: 'Turista' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col mx-auto max-w-[480px] bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar pb-10">
      <div className="p-6 pt-10">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center">
                 <span className="material-symbols-outlined">admin_panel_settings</span>
              </div>
              <h1 className="text-xl font-bold dark:text-white">Super Admin</h1>
           </div>
           <button onClick={() => navigate('/profile')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark">
              <span className="material-symbols-outlined">close</span>
           </button>
        </div>

        <div className="flex bg-white dark:bg-surface-dark p-1 rounded-3xl mb-8 border border-slate-200 dark:border-white/5">
           {['stats', 'users', 'businesses'].map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}
             >
               {tab === 'stats' ? 'Métricas' : tab === 'users' ? 'Usuarios' : 'Empresas'}
             </button>
           ))}
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                  <p className="text-4xl font-black text-primary leading-none mb-1">{allBusinesses.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresas</p>
               </div>
               <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                  <p className="text-4xl font-black text-primary leading-none mb-1">{usersRegistry.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catastro</p>
               </div>
            </div>

            <section className="space-y-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Catastro Reciente</h3>
               <div className="space-y-2">
                  {usersRegistry.slice(-4).reverse().map(u => (
                    <div key={u.uid} className="bg-white dark:bg-surface-dark p-4 rounded-3xl flex items-center gap-4 border border-slate-200 dark:border-white/5">
                       <img src={u.avatar} className="w-10 h-10 rounded-full bg-slate-100" />
                       <div className="flex-1">
                          <p className="text-sm font-bold dark:text-white">{u.name}</p>
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest">{u.rol}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setShowUserModal(true)}
              className="w-full py-4 bg-primary text-white font-black rounded-3xl shadow-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">person_add</span>
              REGISTRAR NUEVO USUARIO
            </button>

            <div className="space-y-3">
              {usersRegistry.map(u => (
                <div key={u.uid} className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-10 h-10 rounded-full" />
                      <div>
                         <p className="text-sm font-bold dark:text-white">{u.name}</p>
                         <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{u.email}</p>
                      </div>
                   </div>
                   <span className="px-3 py-1 bg-slate-100 dark:bg-background-dark text-[9px] font-black text-slate-400 rounded-full uppercase">
                      {u.rol}
                   </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => navigate('/portal')}
              className="w-full py-4 bg-accent text-white font-black rounded-3xl shadow-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add_business</span>
              CREAR EMPRESA DESDE ADMIN
            </button>

            <div className="space-y-3">
              {allBusinesses.map(b => (
                <div key={b.id} className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-slate-200 dark:border-white/5 flex items-center gap-4">
                   <img src={b.media.logo_url} className="w-12 h-12 rounded-xl object-cover" />
                   <div className="flex-1">
                      <p className="text-sm font-bold dark:text-white">{b.nombre}</p>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest">{b.categoria}</p>
                   </div>
                   <div className={`w-3 h-3 rounded-full ${b.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-surface-dark w-full max-w-[360px] rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-white/10">
            <div className="text-center">
              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Nuevo Usuario</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Añadir al catastro local</p>
            </div>
            
            <div className="space-y-4">
              <input 
                placeholder="Nombre completo"
                className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-2xl py-4 px-5 text-sm dark:text-white"
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
              />
              <input 
                placeholder="Correo electrónico"
                className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-2xl py-4 px-5 text-sm dark:text-white"
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
              />
              <select 
                className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-2xl py-4 px-5 text-sm dark:text-white"
                value={newUser.rol}
                onChange={e => setNewUser({...newUser, rol: e.target.value as Role})}
              >
                <option value="Turista">Turista</option>
                <option value="DueñoEmpresa">Dueño Empresa</option>
                <option value="EasyColaborador">Colaborador</option>
                <option value="SuperAdmin">Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-4 text-slate-500 font-bold text-xs uppercase"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateUser}
                className="flex-1 py-4 bg-primary text-white font-black rounded-2xl text-xs uppercase shadow-lg shadow-primary/20"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardScreen;
