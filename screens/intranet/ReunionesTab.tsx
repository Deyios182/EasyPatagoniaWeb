import React, { useState } from 'react';
import { useAppAuth } from '../../App';

const ReunionesTab: React.FC = () => {
  const { user } = useAppAuth();
  const [roomName, setRoomName] = useState('EasyPatagonia-Admin-Room-' + new Date().getFullYear());

  const displayName = user?.email?.split('@')[0] || 'Administrador';

  const generateRandomRoom = () => {
    const randomStr = Math.random().toString(36).substring(2, 10);
    setRoomName(`EasyPatagonia-Direct-${randomStr}`);
  };

  const copyLink = () => {
    const link = `https://meet.jit.si/${roomName}`;
    navigator.clipboard.writeText(link);
    alert('¡Enlace de la sala copiado! Puedes enviárselo a quien quieras.');
  };

  const joinMeeting = () => {
    const url = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/5 border border-white/10 p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">videocam</span>
            Video Reuniones
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Sala actual: <span className="text-indigo-300 font-mono font-bold bg-indigo-500/20 px-2 py-0.5 rounded">{roomName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={generateRandomRoom} className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">shuffle</span> Sala Aleatoria
          </button>
          <button onClick={copyLink} className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">content_copy</span> Copiar Link
          </button>
          <button onClick={joinMeeting} className="px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Abrir Sala de Video
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-indigo-400">group</span>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Sala de Oficina Permanente</h3>
          <p className="text-slate-400 text-sm mb-6">Usa esta sala para reuniones internas rápidas con el equipo. Siempre está abierta y el link es el mismo.</p>
          <button onClick={() => { setRoomName('EasyPatagonia-Admin-Room-' + new Date().getFullYear()); joinMeeting(); }} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all w-full md:w-auto flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-sm">login</span>
            Entrar a la Oficina
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-purple-400">lock</span>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Salas Privadas o Clientes</h3>
          <p className="text-slate-400 text-sm mb-6">Genera una sala temporal de un solo uso para invitar a proveedores o clientes por fuera de la intranet.</p>
          <button onClick={() => { generateRandomRoom(); setTimeout(joinMeeting, 100); }} className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all w-full md:w-auto flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-sm">rocket_launch</span>
            Iniciar Sala Nueva
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReunionesTab;
