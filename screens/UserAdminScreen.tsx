import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';
import { useAuth } from '../contexts/AuthContext';  // NEW: Import Supabase auth hook
import { uploadImage } from './imageHandler';
import { Company } from '../types';

// Roles (constantes)
const ROLES = [
  { value: 'tourist', label: '👤 Turista' },
  { value: 'business_owner', label: '💼 Dueño de Empresa' },
  { value: 'collaborator', label: '🛠️ Easy Colaborador' },
  { value: 'super_admin', label: '👑 Super Admin' },
  { value: 'admin', label: '🛡️ Admin' },
  { value: 'agency', label: '🏢 Agencia' }
];

const ImageUploader = ({ currentImage, onUpload }: { currentImage?: string, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 overflow-hidden relative group shadow-xl">
        {currentImage ? (
          <img src={currentImage} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-4xl text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>
        )}
        <label className="absolute inset-0 bg-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-[10px] tracking-wider uppercase text-center p-2">
          Cambiar Foto
          <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
        </label>
      </div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Foto de Perfil</p>
    </div>
  );
};

interface UserData {
  id: string;
  email: string;
  username?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: string;
  avatar?: string;
  is_active: boolean;
  phone?: string;
  bio?: string;
  last_login?: string;
  created_at?: string;
}

const UserAdminScreen: React.FC = () => {
  const { user: currentUser } = useAppAuth();
  const supabaseAuth = useAuth();  // NEW: Access Supabase auth hook for refetchProfile
  const [users, setUsers] = useState<UserData[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]); // List of all companies
  const [userCompanies, setUserCompanies] = useState<string[]>([]); // IDs of companies assigned to selectedUser
  const [loading, setLoading] = useState(true);
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // NEW: Role Filter

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    role: 'tourist',
    avatar_url: ''
  });

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('name');
    if (data) setAllCompanies(data);
  };

  const fetchUserCompanies = async (userId: string) => {
    const { data } = await supabase.from('company_owners').select('company_id').eq('owner_id', userId);
    if (data) {
      setUserCompanies(data.map((item: any) => item.company_id));
    } else {
      setUserCompanies([]);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    // 2025-12-23: MIGRATED TO USE 'profiles' TABLE
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching users from profiles:', error);

    if (data) {
      const mapped = data.map((p: any) => ({
        id: p.id,
        username: p.email?.split('@')[0] || 'user',
        is_active: p.is_active ?? true,
        last_login: p.last_sign_in_at,
        created_at: p.created_at,
        email: p.email || 'Sin email',
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Usuario',
        avatar: p.avatar_url,
        phone: p.phone,
        bio: p.bio,
        role: p.role || 'tourist'
      }));
      setUsers(mapped);
    }
    setLoading(false);
  };

  // --- ACTIONS ---

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ email: '', password: '', first_name: '', last_name: '', phone: '', bio: '', role: 'tourist', avatar_url: '' });
    setShowModal(true);
  };

  const handleEdit = (u: UserData) => {
    setModalMode('edit');
    setSelectedUser(u);
    fetchUserCompanies(u.id); // Load assigned companies
    setShowPasswordReset(false);
    setNewPassword('');
    setFormData({
      email: u.email,
      password: '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      bio: u.bio || '',
      role: u.role,
      avatar_url: u.avatar || ''
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        console.log('📤 [ADMIN] Subiendo avatar...');
        const url = await uploadImage(file, 'avatars');
        console.log('📤 [ADMIN] URL recibida:', url);
        if (url) {
          setFormData(prev => {
            const updated = { ...prev, avatar_url: url };
            console.log('📤 [ADMIN] FormData actualizado:', updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('📤 [ADMIN] Error en handleFileUpload:', error);
        alert("Error subiendo imagen");
      }
    }
  };

  const handleView = (u: UserData) => {
    setModalMode('view');
    setSelectedUser(u);
    fetchUserCompanies(u.id);
    setShowModal(true);
  };

  const handleDelete = async (u: UserData) => {
    if (!confirm(`¿Estás SEGURO de eliminar a ${u.name}? Esta acción es irreversible.`)) return;

    // Call RPC
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: u.id });

    if (error) {
      alert("Error al eliminar (¿Tienes permisos de Super Admin?): " + error.message);
    } else {
      setUsers(users.filter(user => user.id !== u.id));
      alert("Usuario eliminado correctamente.");
    }
  };

  const submitForm = async () => {
    if (modalMode === 'create') {
      if (!formData.email || !formData.password || !formData.first_name) {
        alert("Email, Password y Nombre son obligatorios");
        return;
      }
      const { error } = await supabase.rpc('admin_create_user', {
        p_email: formData.email,
        p_password: formData.password,
        p_first_name: formData.first_name,
        p_last_name: formData.last_name,
        p_role: formData.role
      });

      if (error) alert("Error al crear usuario: " + error.message);
      else {
        alert("Usuario creado exitosamente");
        setShowModal(false);
        fetchUsers();
      }
    } else if (modalMode === 'edit' && selectedUser) {
      console.log('💾 [ADMIN] Guardando cambios de usuario...');
      console.log('💾 [ADMIN] FormData completo:', formData);
      console.log('💾 [ADMIN] Avatar URL a guardar:', formData.avatar_url);

      // 1. Actualizar Datos Personales + Avatar
      const { data: updateData, error } = await supabase.rpc('admin_update_user_person', {
        p_user_id: selectedUser.id,
        p_first_name: formData.first_name,
        p_last_name: formData.last_name,
        p_phone: formData.phone,
        p_bio: formData.bio,
        p_avatar_url: formData.avatar_url
      });

      console.log('💾 [ADMIN] Respuesta de RPC:', { data: updateData, error });

      if (error) {
        console.error('💾 [ADMIN] Error al actualizar:', error);
        alert("Error al actualizar perfil: " + error.message);
        return;
      }

      // 2. Actualizar Password si se solicitó
      if (showPasswordReset && newPassword.length > 0) {
        const { error: passError } = await supabase.rpc('admin_reset_password', {
          p_user_id: selectedUser.id,
          p_new_password: newPassword
        });
        if (passError) alert("Error al actualizar contraseña: " + passError.message);
        else alert("Contraseña actualizada correctamente.");
      } else {
        alert("Usuario actualizado");
      }

      // 3. NEW: If editing current user, refresh their profile to update avatar in sidebar/profile
      if (selectedUser.id === currentUser?.uid && supabaseAuth.refetchProfile) {
        console.log('🔄 [ADMIN] Refrescando perfil del usuario actual...');
        await supabaseAuth.refetchProfile();
      }

      setShowModal(false);
      fetchUsers();
    }
  };

  const toggleStatus = async (userId: string, current: boolean) => {
    if (userId === currentUser?.uid) return alert("No puedes bloquearte a ti mismo.");

    // Optimistic
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u));

    const { error } = await supabase.from('users').update({ is_active: !current }).eq('id', userId);
    if (error) {
      alert("Error al cambiar estado");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: current } : u));
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    // 2025-12-23: MIGRATED TO UPDATE 'profiles' TABLE DIRECTLY
    console.log('🔄 [ADMIN] Updating role for user:', userId, 'to:', newRole);

    // Optimistic UI update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    // Update in database
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('❌ [ADMIN] Error updating role:', error);
      alert('Error al actualizar rol: ' + error.message);
      // Revert optimistic update on error
      fetchUsers();
    } else {
      console.log('✅ [ADMIN] Role updated successfully');
    }
  };

  const assignCompanyToUser = async (companyId: string) => {
    if (!selectedUser) return;
    const { error } = await supabase.from('company_owners').insert({ owner_id: selectedUser.id, company_id: companyId });
    if (error) alert("Error asignando empresa: " + error.message);
    else {
      setUserCompanies([...userCompanies, companyId]);
    }
  };

  const removeCompanyFromUser = async (companyId: string) => {
    if (!selectedUser) return;
    const { error } = await supabase.from('company_owners').delete().match({ owner_id: selectedUser.id, company_id: companyId });
    if (error) alert("Error desasignando empresa: " + error.message);
    else {
      setUserCompanies(userCompanies.filter(id => id !== companyId));
    }
  };

  const filtered = users.filter(u =>
    (filterRole === 'all' || u.role === filterRole) &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-white transition-colors">

      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-primary/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/30 rounded-full blur-[120px]"></div>

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-400">group</span>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Gestión de Usuarios</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Usuarios y Roles</h1>
              <p className="text-slate-400">Gestión completa de accesos, roles y datos de usuarios.</p>
            </div>
            <button onClick={handleCreate} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/30 flex items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-2xl">
              <span className="material-symbols-outlined">person_add</span>
              Crear Usuario
            </button>
          </div>

          {/* TOOLBAR */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-lg">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none text-white placeholder:text-slate-500"
              />
            </div>

            {/* NEW: Role Filter Dropdown */}
            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">filter_list</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl font-medium focus:ring-2 focus:ring-primary outline-none text-white appearance-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Todos los Roles</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>
                ))}
              </select>
            </div>

            <button onClick={fetchUsers} className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 hover:border-primary/50 hover:bg-white/10 text-slate-400 hover:text-primary transition-all group">
              <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="p-8 md:p-12 pt-0">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400 font-bold">
              <tr>
                <th className="p-5">Usuario</th>
                <th className="p-5">Rol</th>
                <th className="p-5">Estado</th>
                <th className="p-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className={`hover:bg-white/5 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 text-slate-400 overflow-hidden border-2 ${u.is_active ? 'border-white/10' : 'border-red-500/50'}`}>
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined">person</span>}
                      </div>
                      <div>
                        <p className="font-bold leading-tight text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-white/10 border border-white/10 rounded-xl text-xs font-bold py-2 px-3 cursor-pointer focus:ring-2 focus:ring-primary text-white"
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>)}
                    </select>
                  </td>
                  <td className="p-5">
                    <button
                      onClick={() => toggleStatus(u.id, u.is_active)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 w-fit ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">{u.is_active ? 'check_circle' : 'block'}</span>
                      {u.is_active ? 'ACTIVO' : 'BLOQUEADO'}
                    </button>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleView(u)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-blue-400 transition-colors" title="Ver Detalles"><span className="material-symbols-outlined">visibility</span></button>
                      <button onClick={() => handleEdit(u)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-orange-400 transition-colors" title="Editar"><span className="material-symbols-outlined">edit</span></button>
                      <button onClick={() => handleDelete(u)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-red-400 transition-colors" title="Eliminar"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-12 text-center text-slate-500">No se encontraron usuarios.</div>}
        </div>
      </div>

      {/* MODAL */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm">
            <div className="bg-slate-900 md:rounded-3xl rounded-t-3xl p-6 w-full max-w-lg shadow-2xl relative border-t md:border border-white/10 animate-in slide-in-from-bottom-5 md:zoom-in-95 h-[90vh] md:max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10 shrink-0">
                <h3 className="text-xl font-black text-white">
                  {modalMode === 'create' && 'Crear Nuevo Usuario'}
                  {modalMode === 'edit' && 'Editar Usuario'}
                  {modalMode === 'view' && 'Detalles del Usuario'}
                </h3>
                <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 overflow-y-auto flex-1 pb-20 custom-scrollbar">

                {modalMode === 'view' && selectedUser && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <img src={selectedUser.avatar || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-2xl bg-white/10 object-cover border-2 border-white/10 shadow-xl" />
                      <div>
                        <h4 className="text-2xl font-black text-white">{selectedUser.name}</h4>
                        <p className="text-slate-500 font-mono text-sm">{selectedUser.email}</p>
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold mt-2 inline-block border border-primary/30">{selectedUser.role}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">ID Sistema</label>
                        <p className="font-mono text-xs truncate text-white mt-1" title={selectedUser.id}>{selectedUser.id}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Estado</label>
                        <p className={`font-bold text-sm mt-1 ${selectedUser.is_active ? 'text-emerald-400' : 'text-red-400'}`}>{selectedUser.is_active ? 'Activo' : 'Bloqueado'}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Registrado</label>
                        <p className="font-bold text-sm mt-1 text-white">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Último Login</label>
                        <p className="font-bold text-sm mt-1 text-white">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Nunca'}</p>
                      </div>
                    </div>

                    {selectedUser.bio && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biografía</label>
                        <p className="text-sm bg-white/5 border border-white/10 p-4 rounded-xl mt-2 text-slate-300 italic">"{selectedUser.bio}"</p>
                      </div>
                    )}

                    {/* SHOW ASSIGNED COMPANIES IN VIEW MODE */}
                    {selectedUser.role === 'business_owner' && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Empresas Asignadas</h4>
                        <div className="flex flex-wrap gap-2">
                          {userCompanies.length > 0 ? (
                            userCompanies.map(coId => {
                              const co = allCompanies.find(c => c.id === coId);
                              return (
                                <span key={coId} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/30">
                                  {co?.name || 'Empresa Desconocida'}
                                </span>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-500 italic">Sin empresas asignadas.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(modalMode === 'create' || modalMode === 'edit') && (
                  <>
                    {/* NEW: IMAGE UPLOADER */}
                    <ImageUploader currentImage={formData.avatar_url} onUpload={handleFileUpload} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nombre</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="Ej. Juan" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Apellido</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="Ej. Pérez" />
                      </div>
                    </div>

                    {modalMode === 'create' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Email (Login)</label>
                          <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder:text-slate-500"
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="usuario@easypatagonia.com" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Contraseña Inicial</label>
                          <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder:text-slate-500"
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} type="password" placeholder="******" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Rol de Usuario</label>
                        <select className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                          value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                          style={{ backgroundImage: 'none' }} // Fix mobile safari appearance
                        >
                          {ROLES.map(r => <option key={r.value} value={r.value} className="bg-slate-900 py-2">{r.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Teléfono</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+56 9 ..." />
                      </div>
                    </div>

                    {modalMode === 'edit' && (
                      <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowPasswordReset(!showPasswordReset)}>
                          <label className="text-xs font-bold text-red-400 uppercase flex items-center gap-2 cursor-pointer tracking-wider">
                            <span className="material-symbols-outlined text-sm">lock_reset</span>
                            Resetear Contraseña
                          </label>
                          <span className="material-symbols-outlined text-red-400 text-sm">{showPasswordReset ? 'expand_less' : 'expand_more'}</span>
                        </div>

                        {showPasswordReset && (
                          <div className="mt-3 animate-in slide-in-from-top-2">
                            <input
                              type="text"
                              className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm font-bold text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-red-400/50"
                              placeholder="Escribe la nueva contraseña..."
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                            />
                            <p className="text-[10px] text-red-400/70 mt-2">⚠️ Cuidado: El usuario perderá acceso hasta que ingrese esta nueva clave.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Teléfono</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder:text-slate-500"
                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+56 9 ..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Biografía / Notas</label>
                      <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary h-24 resize-none text-white placeholder:text-slate-500"
                        value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Información adicional..." />
                    </div>

                    {/* COMPANY ASSIGNMENT SECTION (Only for Business Owners in Edit Mode) */}
                    {modalMode === 'edit' && formData.role === 'business_owner' && (
                      <div className="mt-6 bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">store</span>
                          Gestionar Empresas
                        </h4>

                        <div className="space-y-3">
                          {userCompanies.map(coId => {
                            const co = allCompanies.find(c => c.id === coId);
                            return (
                              <div key={coId} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-white/5">
                                <span className="text-sm font-bold text-white">{co?.name || 'Cargando...'}</span>
                                <button onClick={() => removeCompanyFromUser(coId)} className="text-red-400 hover:bg-red-500/10 p-1 rounded-md transition-colors">
                                  <span className="material-symbols-outlined text-base">close</span>
                                </button>
                              </div>
                            );
                          })}

                          <div className="flex gap-2 mt-2">
                            <select
                              id="company-selector"
                              className="flex-1 bg-slate-900 border border-white/10 rounded-lg text-xs p-2 text-white outline-none"
                            >
                              <option value="">Seleccionar Empresa...</option>
                              {allCompanies.filter(c => !userCompanies.includes(c.id)).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const select = document.getElementById('company-selector') as HTMLSelectElement;
                                if (select.value) {
                                  assignCompanyToUser(select.value);
                                  select.value = "";
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                            >
                              Asignar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                {modalMode !== 'view' ? (
                  <>
                    <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/10 transition-colors">Cancelar</button>
                    <button onClick={submitForm} className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl transition-all">
                      {modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors">Cerrar</button>
                )}
              </div>

            </div>
          </div>
        )
      }
    </div>
  );
};

export default UserAdminScreen;
