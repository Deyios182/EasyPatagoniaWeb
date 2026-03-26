import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../../App';
import ContabilidadTab from './ContabilidadTab';
import CarpetasTab from './CarpetasTab';
import CalendarioTab from './CalendarioTab';
import PresupuestoTab from './PresupuestoTab';
import ReunionesTab from './ReunionesTab';

const TABS = [
  { id: 'contabilidad', label: 'Contabilidad', icon: 'account_balance', gradient: 'from-emerald-500 to-emerald-600' },
  { id: 'carpetas', label: 'Carpetas', icon: 'folder_shared', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'calendario', label: 'Calendario', icon: 'calendar_month', gradient: 'from-purple-500 to-pink-600' },
  { id: 'presupuesto', label: 'Presupuesto', icon: 'monitoring', gradient: 'from-orange-500 to-red-500' },
  { id: 'reuniones', label: 'Reuniones', icon: 'videocam', gradient: 'from-blue-400 to-cyan-500' },
];

const IntranetScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppAuth();
  const [activeTab, setActiveTab] = useState('contabilidad');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body transition-colors">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-indigo-500/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-[120px]"></div>

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Intranet Privada</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                Easy Intranet
              </h1>
              <p className="text-slate-400 text-lg">Gestión interna • Contabilidad • Documentos • Calendario • Reuniones</p>
            </div>

            <button onClick={() => navigate('/admin')}
              className="px-5 py-3 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-primary/50 rounded-2xl font-bold text-white transition-all flex items-center gap-2 group">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Panel Admin
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                  ? `bg-gradient-to-br ${tab.gradient} text-white shadow-lg shadow-${tab.gradient.split(' ')[1]}/20 scale-[1.02]`
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'
                }`}>
                <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8 md:p-12">
        {activeTab === 'contabilidad' && <ContabilidadTab />}
        {activeTab === 'carpetas' && <CarpetasTab />}
        {activeTab === 'calendario' && <CalendarioTab />}
        {activeTab === 'presupuesto' && <PresupuestoTab />}
        {activeTab === 'reuniones' && <ReunionesTab />}
      </div>
    </div>
  );
};

export default IntranetScreen;
