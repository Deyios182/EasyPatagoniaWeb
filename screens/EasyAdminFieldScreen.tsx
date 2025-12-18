
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EasyAdminFieldScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null);
  const [offlineQueue, setOfflineQueue] = useState(0);

  useEffect(() => {
    // Check if there are pending items in local storage
    const stored = localStorage.getItem('ep_field_queue');
    if (stored) setOfflineQueue(JSON.parse(stored).length);
  }, []);

  const captureGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert("Error capturando GPS. Asegúrate de tener permisos.")
      );
    }
  };

  const handleSave = () => {
    setLoading(true);
    // Simulate offline saving
    setTimeout(() => {
      const newQueue = offlineQueue + 1;
      setOfflineQueue(newQueue);
      localStorage.setItem('ep_field_queue', JSON.stringify(new Array(newQueue).fill(1)));
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setGps(null);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full flex-col mx-auto max-w-[480px] bg-background-light dark:bg-background-dark">
      <div className="p-6 pt-12 space-y-6 overflow-y-auto no-scrollbar pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">add_location_alt</span>
            </div>
            <div>
              <h1 className="text-xl font-bold dark:text-white">EasyAdmin Campo</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Colaborador en Terreno</p>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {offlineQueue > 0 && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary animate-pulse">cloud_sync</span>
              <p className="text-xs font-bold text-primary">{offlineQueue} registros pendientes de sincronizar</p>
            </div>
            <span className="text-[10px] font-black text-primary bg-white px-2 py-0.5 rounded-full">SINCRO AUTO</span>
          </div>
        )}

        <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1 px-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Negocio</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-2xl py-4 px-5 text-sm dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50" placeholder="Ej: Pizzería El Baker" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-100 dark:border-white/10 rounded-3xl text-slate-400 hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined">add_a_photo</span>
                <span className="text-[9px] font-black uppercase tracking-widest">Foto Local</span>
              </button>
              <button onClick={captureGPS} className={`flex flex-col items-center justify-center gap-2 py-6 border-2 rounded-3xl transition-all ${gps ? 'border-green-500 bg-green-500/5 text-green-500' : 'border-primary/20 bg-primary/5 text-primary'}`}>
                <span className="material-symbols-outlined">{gps ? 'gps_fixed' : 'location_searching'}</span>
                <span className="text-[9px] font-black uppercase tracking-widest">{gps ? 'GPS Capturado' : 'Fijar GPS'}</span>
              </button>
            </div>

            {gps && (
              <div className="p-3 bg-slate-50 dark:bg-background-dark rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400">Coordenadas capturadas</p>
                  <p className="text-[10px] font-black dark:text-white truncate">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</p>
                </div>
                <span className="material-symbols-outlined text-green-500 text-sm">verified_user</span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-white font-black h-16 rounded-full shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Procesando...' : success ? '¡Guardado con Éxito!' : 'Finalizar Registro'}
          {!loading && !success && <span className="material-symbols-outlined">save</span>}
          {success && <span className="material-symbols-outlined">check_circle</span>}
        </button>

        <p className="text-center text-[10px] text-slate-500 font-medium px-8">
          Los datos se guardarán localmente si no hay conexión y se sincronizarán al detectar señal automáticamente.
        </p>
      </div>
    </div>
  );
};

export default EasyAdminFieldScreen;
