import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';

// Definición de roles disponibles en el sistema
const ROLES = [
  { value: 'turista', label: '👤 Turista (Default)' },
  { value: 'empresa', label: '💼 Dueño de Empresa' },
  { value: 'EasyColaborador', label: '🛠️ Easy Colaborador' }, // Ajustado al nombre exacto usado en App.tsx
  { value: 'SuperAdmin', label: '👑 Super Admin' },
];

const UserAdminScreen: React.FC = () => {
  const { user: currentUser } = useAppAuth(); // Para proteger tu propio usuario
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Obtenemos todos los perfiles ordenados por fecha de creación (los más nuevos primero)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    // Protección de seguridad
    if (targetUserId === currentUser?.uid) {
        if (!confirm("⚠️ ¡CUIDADO! Estás a punto de cambiar tu propio rol. Si te quitas el rol de SuperAdmin perderás acceso a esta pantalla. ¿Estás seguro?")) {
            return;
        }
    }

    // Actualizar en base de datos
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('clerk_user_id', targetUserId);

    if (!error) {
      // Actualizamos la lista localmente para que se vea rápido
      setUsers(users.map(u => u.clerk_user_id === targetUserId ? { ...u, role: newRole } : u));
    } else {
      alert('Error al actualizar el rol. Intenta nuevamente.');
      console.error(error);
    }
  };

  // Filtrar usuarios por el buscador
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.clerk_user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen font-body">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-800">Gestión de Usuarios</h1>
           <p className="text-slate-500">Asigna roles y permisos a tu equipo y clientes.</p>
        </div>
        
        {/* BUSCADOR */}
        <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
                type="text" 
                placeholder="Buscar por email..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-700 font-bold bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-5">Usuario / Email</th>
                  <th className="p-5">Fecha Registro</th>
                  <th className="p-5">Rol Actual</th>
                  <th className="p-5">Asignar Nuevo Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.clerk_user_id} className="hover:bg-blue-50/50 transition-colors group">
                    
                    {/* COLUMNA 1: Email e ID */}
                    <td className="p-5">
                        <div className="font-bold text-slate-800 text-sm">{u.email}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 select-all cursor-pointer" title="Click para copiar ID" onClick={() => navigator.clipboard.writeText(u.clerk_user_id)}>
                            ID: {u.clerk_user_id.substring(0, 15)}...
                        </div>
                    </td>

                    {/* COLUMNA 2: Fecha */}
                    <td className="p-5 text-xs text-slate-500 font-medium">
                        {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    {/* COLUMNA 3: Etiqueta de Rol Visual */}
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border
                        ${u.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                          u.role === 'EasyColaborador' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          u.role === 'empresa' || u.role === 'DueñoEmpresa' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                          'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {u.role === 'SuperAdmin' && '👑'}
                        {u.role === 'EasyColaborador' && '🛠️'}
                        {u.role === 'empresa' || u.role === 'DueñoEmpresa' ? '💼' : ''}
                        {(u.role === 'turista' || !u.role) && '👤'}
                        <span className="ml-1">{u.role || 'Turista'}</span>
                      </span>
                    </td>

                    {/* COLUMNA 4: Selector (Mantenedor) */}
                    <td className="p-5">
                      <div className="relative">
                          <select 
                            value={u.role || 'turista'}
                            onChange={(e) => handleRoleChange(u.clerk_user_id, e.target.value)}
                            className="appearance-none w-full bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer hover:border-slate-400 transition-colors shadow-sm"
                          >
                            {ROLES.map(role => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                          {/* Flecha personalizada del select */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                          </div>
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredUsers.length === 0 && !loading && (
                    <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400">
                            No se encontraron usuarios con ese email.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
        </div>
        
        {loading && (
            <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Cargando base de datos de usuarios...
            </div>
        )}
      </div>
    </div>
  );
};

export default UserAdminScreen;
