import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';

// Roles disponibles
const ROLES = [
  { value: 'turista', label: '👤 Turista (Default)' },
  { value: 'empresa', label: '💼 Dueño de Empresa' },
  { value: 'EasyColaborador', label: '🛠️ Easy Colaborador' },
  { value: 'SuperAdmin', label: '👑 Super Admin' },
];

const UserAdminScreen: React.FC = () => {
  const { user: currentUser } = useAppAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el Modal de Importación Manual
  const [showImportModal, setShowImportModal] = useState(false);
  const [newUser, setNewUser] = useState({ id: '', email: '', role: 'EasyColaborador' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (targetUserId === currentUser?.uid) {
        if (!confirm("⚠️ CUIDADO: Estás cambiando tu propio rol. ¿Seguro?")) return;
    }
    const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('clerk_user_id', targetUserId);
    if (!error) {
      setUsers(users.map(u => u.clerk_user_id === targetUserId ? { ...u, role: newRole } : u));
    } else {
      alert('Error al actualizar rol.');
    }
  };

  // --- FUNCIÓN PARA IMPORTAR USUARIO DE CLERK MANUALMENTE ---
  const handleImportUser = async () => {
      if (!newUser.id || !newUser.email) {
          alert("Debes ingresar el ID de Clerk y el Email.");
          return;
      }

      // 1. Insertamos manualmente en Supabase
      const { error } = await supabase.from('user_profiles').insert([
          {
              clerk_user_id: newUser.id.trim(),
              email: newUser.email.trim(),
              role: newUser.role
          }
      ]);

      if (error) {
          if (error.code === '23505') { // Código de error para duplicados
              alert("Este usuario YA existe en la base de datos.");
          } else {
              console.error(error);
              alert("Error al importar: " + error.message);
          }
      } else {
          alert("✅ Usuario importado y rol asignado correctamente.");
          setShowImportModal(false);
          setNewUser({ id: '', email: '', role: 'EasyColaborador' });
          fetchUsers(); // Recargamos la lista
      }
  };

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
           <p className="text-slate-500">Asigna roles y permisos a tu equipo.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
            {/* BUSCADOR */}
            <div className="relative flex-1 md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* BOTÓN IMPORTAR */}
            <button 
                onClick={() => setShowImportModal(true)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 shadow-lg"
            >
                <span className="material-symbols-outlined">person_add</span>
                <span className="hidden md:inline">Importar de Clerk</span>
            </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-5">Usuario</th>
                  <th className="p-5">ID Sistema</th>
                  <th className="p-5">Rol Visual</th>
                  <th className="p-5">Editar Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.clerk_user_id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-5 font-bold text-slate-800">{u.email}</td>
                    <td className="p-5 text-[10px] text-slate-400 font-mono">{u.clerk_user_id}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold uppercase border
                        ${u.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                          u.role === 'EasyColaborador' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          u.role === 'empresa' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                          'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {u.role === 'SuperAdmin' && '👑'} {u.role === 'EasyColaborador' && '🛠️'} {u.role || 'Turista'}
                      </span>
                    </td>
                    <td className="p-5">
                        <select 
                            value={u.role || 'turista'}
                            onChange={(e) => handleRoleChange(u.clerk_user_id, e.target.value)}
                            className="bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg py-1 px-2 outline-none cursor-pointer"
                        >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        {loading && <div className="p-10 text-center text-slate-400">Cargando...</div>}
      </div>

      {/* --- MODAL IMPORTAR USUARIO --- */}
      {showImportModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-slate-800">Importar Usuario</h3>
                      <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-red-500 font-bold">CERRAR</button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 mb-6 border border-blue-100">
                      <strong>¿Cómo obtener el ID?</strong>
                      <ol className="list-decimal ml-4 mt-1 space-y-1">
                          <li>Ve a tu Panel de <b>Clerk</b> &rarr; Users.</li>
                          <li>Haz clic en el usuario que deseas importar.</li>
                          <li>Copia el <b>User ID</b> (ej: <code>user_2qk...</code>).</li>
                      </ol>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Clerk User ID (Requerido)</label>
                          <input 
                              type="text" 
                              placeholder="user_2qk..." 
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-sm"
                              value={newUser.id}
                              onChange={e => setNewUser({...newUser, id: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email del Usuario</label>
                          <input 
                              type="email" 
                              placeholder="nombre@correo.com" 
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3"
                              value={newUser.email}
                              onChange={e => setNewUser({...newUser, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Rol Inicial</label>
                          <select 
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold"
                              value={newUser.role}
                              onChange={e => setNewUser({...newUser, role: e.target.value})}
                          >
                              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                      </div>
                  </div>

                  <button 
                      onClick={handleImportUser}
                      className="w-full mt-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
                  >
                      Crear e Importar
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserAdminScreen;
