import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import { supabase } from '../supabaseClient';

interface Stats {
   totalCompanies: number;
   totalServices: number;
   totalUsers: number;
   totalLocalities: number;
   totalAttractions: number;
   activeCompanies: number;
   recentUsers: number;
}

const AdminDashboardScreen: React.FC = () => {
   const { logout } = useAppAuth();
   const navigate = useNavigate();
   const [stats, setStats] = useState<Stats>({
      totalCompanies: 0,
      totalServices: 0,
      totalUsers: 0,
      totalLocalities: 0,
      totalAttractions: 0,
      activeCompanies: 0,
      recentUsers: 0
   });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchStats();
   }, []);

   const fetchStats = async () => {
      setLoading(true);

      const [companies, services, users, localities, attractions] = await Promise.all([
         supabase.from('companies').select('id, is_active', { count: 'exact' }),
         supabase.from('services').select('id', { count: 'exact' }),
         supabase.from('profiles').select('id, created_at', { count: 'exact' }), // Fixed: Query 'profiles', not 'users'
         supabase.from('localities').select('id', { count: 'exact' }),
         supabase.from('attractions').select('id', { count: 'exact' })
      ]);

      const activeCompanies = companies.data?.filter(c => c.is_active).length || 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = users.data?.filter(u => new Date(u.created_at) > thirtyDaysAgo).length || 0;

      setStats({
         totalCompanies: companies.count || 0,
         totalServices: services.count || 0,
         totalUsers: users.count || 0,
         totalLocalities: localities.count || 0,
         totalAttractions: attractions.count || 0,
         activeCompanies,
         recentUsers
      });

      setLoading(false);
   };

   const StatCard = ({ icon, label, value, gradient, trend }: { icon: string, label: string, value: number | string, gradient: string, trend?: string }) => (
      <div className={`relative overflow-hidden p-6 rounded-3xl bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 hover:border-primary/30 transition-all duration-300 group hover:scale-[1.02]`}>
         <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${gradient} opacity-20 group-hover:opacity-40 transition-opacity blur-2xl`}></div>
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
               <div className={`w-12 h-12 ${gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-2xl text-white">{icon}</span>
               </div>
               {trend && (
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 uppercase tracking-widest">{trend}</span>
               )}
            </div>
            <h3 className="text-4xl font-black text-white mb-1 tracking-tight">
               {loading ? <span className="animate-pulse">···</span> : value}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</p>
         </div>
      </div>
   );

   const ActionCard = ({ onClick, icon, title, description, color, cta }: { onClick: () => void, icon: string, title: string, description: string, color: string, cta: string }) => (
      <div
         onClick={onClick}
         className="relative overflow-hidden bg-white/5 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 cursor-pointer hover:border-primary/50 transition-all duration-500 group hover:shadow-2xl hover:shadow-primary/10"
      >
         <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-all duration-500 blur-3xl`}></div>
         <div className="relative z-10">
            <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
               <span className="material-symbols-outlined text-3xl text-white">{icon}</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{description}</p>
            <span className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
               {cta}
               <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </span>
         </div>
      </div>
   );

   return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-body transition-colors">

         {/* HERO HEADER */}
         <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-[120px]"></div>

            <div className="relative z-10 p-8 md:p-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Panel Activo</span>
                     </div>
                     <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                        Super Admin
                     </h1>
                     <p className="text-slate-400 text-lg">Control total del ecosistema Easy Patagonia.</p>
                  </div>

                  <div className="flex gap-3">
                     <button
                        onClick={fetchStats}
                        className="px-5 py-3 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-primary/50 rounded-2xl font-bold text-white transition-all flex items-center gap-2 group"
                     >
                        <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">refresh</span>
                        Actualizar
                     </button>
                     <button
                        onClick={logout}
                        className="px-5 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-2xl font-bold text-red-400 transition-all flex items-center gap-2"
                     >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Salir
                     </button>
                  </div>
               </div>

               {/* STATISTICS GRID */}
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <StatCard icon="business" label="Empresas" value={stats.totalCompanies} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
                  <StatCard icon="check_circle" label="Activas" value={stats.activeCompanies} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
                  <StatCard icon="room_service" label="Servicios" value={stats.totalServices} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
                  <StatCard icon="group" label="Usuarios" value={stats.totalUsers} gradient="bg-gradient-to-br from-orange-500 to-orange-600" />
                  <StatCard icon="person_add" label="Nuevos (30d)" value={stats.recentUsers} gradient="bg-gradient-to-br from-pink-500 to-pink-600" trend="+nuevo" />
                  <StatCard icon="location_city" label="Localidades" value={stats.totalLocalities} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
                  <StatCard icon="photo_camera" label="Atractivos" value={stats.totalAttractions} gradient="bg-gradient-to-br from-teal-500 to-teal-600" />
               </div>
            </div>
         </div>

         {/* MAIN CONTENT */}
         <div className="p-8 md:p-12 space-y-10">

            {/* Section Header */}
            <div className="flex items-center gap-4">
               <div className="w-12 h-1 bg-primary rounded-full"></div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">Acciones Principales</h2>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <ActionCard
                  onClick={() => navigate('/field')}
                  icon="travel_explore"
                  title="Empresas y Campo"
                  description="Ver todas las empresas, editar información, crear localidades y asignar atractivos turísticos."
                  color="bg-gradient-to-br from-blue-500 to-indigo-600"
                  cta="Ir al Panel"
               />
               <ActionCard
                  onClick={() => navigate('/admin/users')}
                  icon="group"
                  title="Usuarios y Roles"
                  description="Administrar cuentas, asignar roles de Colaborador, Dueño de Empresa o Super Admin."
                  color="bg-gradient-to-br from-purple-500 to-pink-600"
                  cta="Gestionar"
               />
               <ActionCard
                  onClick={() => navigate('/admin/photos')}
                  icon="photo_library"
                  title="Revisar Fotos"
                  description="Aprobar o rechazar contribuciones de usuarios para atractivos turísticos."
                  color="bg-gradient-to-br from-green-500 to-emerald-600"
                  cta="Ver Pendientes"
               />
               <ActionCard
                  onClick={() => navigate('/admin/landing')}
                  icon="web"
                  title="Landing Page"
                  description="Editar textos de la portada, cambiar imágenes de misión/visión y carrusel principal."
                  color="bg-gradient-to-br from-orange-500 to-red-500"
                  cta="Editar Web"
               />
               <ActionCard
                  onClick={() => navigate('/admin/intranet')}
                  icon="business_center"
                  title="Intranet Easy"
                  description="Contabilidad, carpetas compartidas, calendario y presupuesto para gestión interna."
                  color="bg-gradient-to-br from-emerald-500 to-teal-600"
                  cta="Abrir Intranet"
               />
               <ActionCard
                  onClick={() => navigate('/admin/gamification')}
                  icon="military_tech"
                  title="Gamificación"
                  description="Gestionar XP, rangos, medallas australes y Easy Rutas. Aprobar posts y otorgar puntos de experiencia."
                  color="bg-gradient-to-br from-purple-500 to-pink-600"
                  cta="Administrar"
               />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
               {[
                  { icon: 'map', label: 'Ver Mapa', path: '/map' },
                  { icon: 'explore', label: 'Descubrir', path: '/discover' },
                  { icon: 'list_alt', label: 'Directorio', path: '/directory' },
                  { icon: 'smart_toy', label: 'Chat AI', path: '/chat' }
               ].map(link => (
                  <button
                     key={link.path}
                     onClick={() => navigate(link.path)}
                     className="flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/50 hover:bg-white/10 transition-all group"
                  >
                     <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">{link.icon}</span>
                     <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">{link.label}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
   );
};

export default AdminDashboardScreen;
