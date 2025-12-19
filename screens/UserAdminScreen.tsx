import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ROLES = [
  { value: 'turista', label: 'Turista' },
  { value: 'empresa', label: 'Dueño de Empresa' },
  { value: 'collaborator', label: 'Easy Colaborador' },
  { value: 'super_admin', label: 'Super Admin' },
];

const UserAdminScreen: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Traemos todos los perfiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('clerk_user_id', userId);

    if (!error) {
      alert('Rol actualizado correctamente');
      fetchUsers(); // Recargar lista
    } else {
      alert('Error actualizando rol');
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-body">
      <h1 className="text-3xl font-black text-slate-800 mb-6">Administración de Usuarios</h1>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">ID Usuario</th>
              <th className="p-4">Rol Actual</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.clerk_user_id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{user.email}</td>
                <td className="p-4 text-xs text-slate-400 font-mono">{user.clerk_user_id}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase 
                    ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 
                      user.role === 'collaborator' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'empresa' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <select 
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.clerk_user_id, e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-10 text-center text-slate-400">Cargando usuarios...</p>}
      </div>
    </div>
  );
};

export default UserAdminScreen;
