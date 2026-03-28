import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAppAuth } from '../../App';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  folder_year?: number;
  folder_month?: number;
  icon: string;
  color: string;
  folder_date?: string;
  description?: string;
}

interface FileItem {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
  notes?: string;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CarpetasTab: React.FC = () => {
  const { user } = useAppAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDate, setNewFolderDate] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const fetchFolders = async (parentId: string | null = null) => {
    setLoading(true);
    let query = supabase.from('intranet_folders').select('*');
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }
    const { data } = await query.order('folder_year', { ascending: false }).order('folder_month', { ascending: true }).order('name');
    if (data) setFolders(data);

    if (parentId) {
      const { data: fileData } = await supabase
        .from('intranet_files')
        .select('*')
        .eq('folder_id', parentId)
        .order('created_at', { ascending: false });
      if (fileData) setFiles(fileData);
    } else {
      setFiles([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFolders(); }, []);

  const initYearFolders = async () => {
    const year = new Date().getFullYear();
    // Check if year folder exists
    const { data: existing } = await supabase.from('intranet_folders').select('id').eq('name', String(year)).is('parent_id', null);
    if (existing && existing.length > 0) return alert(`La carpeta ${year} ya existe`);

    // Create year folder
    const { data: yearFolder, error: yearError } = await supabase.from('intranet_folders')
      .insert([{ name: String(year), folder_year: year, icon: 'calendar_today', color: '#6366f1' }])
      .select().single();

    if (yearError) { console.error('Error creating year folder:', yearError); alert('Error: ' + yearError.message); return; }
    if (!yearFolder) return;

    // Create monthly subfolders
    const monthFolders = MONTHS.map((m, i) => ({
      name: m,
      parent_id: yearFolder.id,
      folder_year: year,
      folder_month: i + 1,
      icon: 'folder',
      color: '#3b82f6'
    }));
    const { error: monthError } = await supabase.from('intranet_folders').insert(monthFolders);
    if (monthError) console.error('Error creating month folders:', monthError);
    fetchFolders(currentFolder?.id || null);
  };

  const openFolder = (folder: Folder) => {
    setBreadcrumbs(prev => [...prev, folder]);
    setCurrentFolder(folder);
    fetchFolders(folder.id);
  };

  const goBack = (index?: number) => {
    if (index !== undefined) {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      const target = newBreadcrumbs[newBreadcrumbs.length - 1];
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolder(target);
      fetchFolders(target.id);
    } else {
      if (breadcrumbs.length <= 1) {
        setBreadcrumbs([]);
        setCurrentFolder(null);
        fetchFolders(null);
      } else {
        const newBreadcrumbs = breadcrumbs.slice(0, -1);
        const parent = newBreadcrumbs[newBreadcrumbs.length - 1];
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolder(parent);
        fetchFolders(parent.id);
      }
    }
  };

  const goRoot = () => {
    setBreadcrumbs([]);
    setCurrentFolder(null);
    fetchFolders(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !currentFolder) return;
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `intranet/${currentFolder.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage.from('intranet').upload(filePath, file);
    if (uploadError) {
      alert('Error subiendo archivo: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('intranet').getPublicUrl(filePath);
    // Force download url by appending download=true query parameter
    const downloadUrl = `${urlData.publicUrl}?download=${encodeURIComponent(file.name)}`;

    const { error: fileError } = await supabase.from('intranet_files').insert([{
      folder_id: currentFolder.id,
      name: file.name,
      file_url: downloadUrl,
      file_size: file.size,
      file_type: file.type
    }]);
    if (fileError) console.error('Error saving file record:', fileError);

    setUploading(false);
    e.target.value = '';
    fetchFolders(currentFolder.id);
  };

  const handleDeleteFile = async (fileItem: FileItem) => {
    if (!confirm(`¿Eliminar "${fileItem.name}"?`)) return;
    await supabase.from('intranet_files').delete().eq('id', fileItem.id);
    fetchFolders(currentFolder?.id || null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const { error: folderError } = await supabase.from('intranet_folders').insert([{
      name: newFolderName.trim(),
      parent_id: currentFolder?.id || null,
      icon: 'folder',
      color: '#3b82f6',
      folder_date: newFolderDate || null,
      description: newFolderDesc || null
    }]);
    if (folderError) { console.error('Error creating folder:', folderError); alert('Error: ' + folderError.message); return; }
    setNewFolderName('');
    setNewFolderDate('');
    setNewFolderDesc('');
    setShowNewFolder(false);
    fetchFolders(currentFolder?.id || null);
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`¿Eliminar carpeta "${folder.name}" y todo su contenido?`)) return;
    await supabase.from('intranet_folders').delete().eq('id', folder.id);
    fetchFolders(currentFolder?.id || null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const isPreviewable = (type: string) => type?.includes('image') || type?.includes('pdf');
  // Helper to remove ?download parameter for previewing in iframe
  const getPreviewUrl = (url: string) => url.split('?')[0];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {currentFolder && (
          <button onClick={() => goBack()} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Volver
          </button>
        )}
        {!currentFolder && (
          <button onClick={initYearFolders} className="px-5 py-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl font-bold text-indigo-400 text-sm flex items-center gap-2 hover:bg-indigo-500/30 transition-all">
            <span className="material-symbols-outlined text-lg">create_new_folder</span> Crear Carpetas {new Date().getFullYear()}
          </button>
        )}
        <button onClick={() => setShowNewFolder(!showNewFolder)} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-lg">add</span> Nueva Carpeta
        </button>
        {currentFolder && (
          <label className="px-5 py-2.5 bg-primary rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:bg-primary/80 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-lg">{uploading ? 'hourglass_top' : 'upload_file'}</span>
            {uploading ? 'Subiendo...' : 'Subir Archivo'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-white/5 p-4 rounded-xl border border-white/10">
          <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nombre carpeta..."
            className="flex-1 w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50"
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
          <input type="date" value={newFolderDate} onChange={e => setNewFolderDate(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-primary/50" title="Fecha (opcional)" />
          <input type="text" value={newFolderDesc} onChange={e => setNewFolderDesc(e.target.value)} placeholder="Observaciones..."
            className="flex-1 w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-primary/50"
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
          <button onClick={handleCreateFolder} className="w-full md:w-auto px-6 py-2.5 bg-primary rounded-xl font-bold text-white text-sm shrink-0">Crear</button>
        </div>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <button onClick={goRoot} className="text-primary font-bold hover:underline">📁 Raíz</button>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.id}>
              <span className="text-slate-600">/</span>
              <button onClick={() => goBack(i)} className={`font-bold hover:underline ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-primary'}`}>{b.name}</button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-primary"></div></div>
      ) : (
        <div className="space-y-4">
          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.map(f => (
                <div key={f.id} className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 cursor-pointer transition-all hover:scale-[1.02]" onClick={() => openFolder(f)}>
                  <button onClick={e => { e.stopPropagation(); handleDeleteFolder(f); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all">
                    <span className="material-symbols-outlined text-xs text-red-400">close</span>
                  </button>
                  <div className="flex items-start gap-4 mb-2">
                    <span className="material-symbols-outlined text-4xl shrink-0" style={{ color: f.color }}>{f.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{f.name}</p>
                      {f.folder_month && <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Mes {f.folder_month}</p>}
                      {f.folder_date && <p className="text-emerald-400 text-[10px] font-bold mt-0.5">{new Date(f.folder_date + 'T12:00:00').toLocaleDateString('es-CL')}</p>}
                    </div>
                  </div>
                  {f.description && (
                    <div className="mt-2 text-xs text-slate-400 line-clamp-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                      {f.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Archivos</p>
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/20 transition-all group">
                  <span className="material-symbols-outlined text-2xl text-blue-400">
                    {f.file_type?.includes('image') ? 'image' : f.file_type?.includes('pdf') ? 'picture_as_pdf' : 'description'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{f.name}</p>
                    <p className="text-slate-500 text-[10px]">{formatSize(f.file_size)} • {new Date(f.created_at).toLocaleDateString('es-CL')}</p>
                  </div>
                  {isPreviewable(f.file_type) && (
                    <button onClick={() => setPreviewFile(f)} className="p-2 hover:bg-white/10 rounded-lg transition-all" title="Ver archivo">
                      <span className="material-symbols-outlined text-sm text-blue-400">visibility</span>
                    </button>
                  )}
                  <a href={f.file_url} download={f.name} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-all" title="Descargar">
                    <span className="material-symbols-outlined text-sm text-emerald-400">download</span>
                  </a>
                  <button onClick={() => handleDeleteFile(f)} className="p-2 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Eliminar">
                    <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {folders.length === 0 && files.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">folder_off</span>
              <p className="text-slate-500 font-bold">{currentFolder ? 'Carpeta vacía' : 'No hay carpetas aún'}</p>
              <p className="text-slate-600 text-sm mt-1">{!currentFolder && 'Usa "Crear Carpetas" para generar la estructura del año'}</p>
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-md" onClick={() => setPreviewFile(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-blue-400">{previewFile.file_type.includes('image') ? 'image' : 'picture_as_pdf'}</span>
                <h3 className="text-white font-bold truncate">{previewFile.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a href={previewFile.file_url} download={previewFile.name} className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm rounded-xl hover:bg-emerald-500/30 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span className="hidden md:inline">Descargar</span>
                </a>
                <button onClick={() => setPreviewFile(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  <span className="material-symbols-outlined text-white">close</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-black/50 p-4 md:p-8 flex items-center justify-center overflow-auto">
              {previewFile.file_type.includes('image') ? (
                <img src={getPreviewUrl(previewFile.file_url)} alt={previewFile.name} className="max-w-full max-h-full object-contain touch-pinch-zoom rounded-lg shadow-2xl" />
              ) : previewFile.file_type.includes('pdf') ? (
                <iframe src={getPreviewUrl(previewFile.file_url)} className="w-full h-full rounded-xl bg-white" title={previewFile.name} />
              ) : (
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">description</span>
                  <p className="text-white font-bold">Vista previa no disponible</p>
                  <p className="text-slate-500 text-sm mt-2">Por favor descarga el archivo para verlo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarpetasTab;
