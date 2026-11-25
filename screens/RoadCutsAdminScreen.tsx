import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { RoadCut, RoadCutSeverity } from '../types';

// ─── Helpers de UI ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  total:   { label: 'Corte Total',           icon: '⛔', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',    badge: 'bg-red-500/20 text-red-300' },
  partial: { label: 'Interrupción Parcial',  icon: '⚠️', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  caution: { label: 'Precaución',            icon: '🛑', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300' },
};

const EMPTY_FORM: Omit<RoadCut, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
  severity: 'partial',
  route_name: '',
  sector: '',
  description: '',
  schedule: '',
  validity: '',
  source: 'MOP Aysén, Vialidad, Carabineros',
  valid_from: '',
  valid_until: '',
  latitude: undefined,
  longitude: undefined,
  is_active: true,
};

// ─── Componente principal ──────────────────────────────────────────────────

const RoadCutsAdminScreen: React.FC = () => {
  const navigate = useNavigate();
  const [cuts, setCuts] = useState<RoadCut[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterSeverity, setFilterSeverity] = useState<RoadCutSeverity | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Carga de datos ───────────────────────────────────────────────────────
  const fetchCuts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('road_cuts')
      .select('*')
      .order('severity', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error) setCuts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCuts(); }, []);

  // ── Formulario ───────────────────────────────────────────────────────────
  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (cut: RoadCut) => {
    setForm({
      severity:    cut.severity,
      route_name:  cut.route_name,
      sector:      cut.sector || '',
      description: cut.description,
      schedule:    cut.schedule || '',
      validity:    cut.validity || '',
      source:      cut.source || 'MOP Aysén, Vialidad, Carabineros',
      valid_from:  cut.valid_from || '',
      valid_until: cut.valid_until || '',
      latitude:    cut.latitude,
      longitude:   cut.longitude,
      is_active:   cut.is_active,
    });
    setEditingId(cut.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.route_name.trim() || !form.description.trim()) {
      alert('Ruta y descripción son obligatorias.');
      return;
    }
    setSaving(true);

    const payload = {
      severity:    form.severity,
      route_name:  form.route_name.trim(),
      sector:      form.sector?.trim() || null,
      description: form.description.trim(),
      schedule:    form.schedule?.trim() || null,
      validity:    form.validity?.trim() || null,
      source:      form.source?.trim() || null,
      valid_from:  form.valid_from || null,
      valid_until: form.valid_until || null,
      latitude:    form.latitude || null,
      longitude:   form.longitude || null,
      is_active:   form.is_active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('road_cuts').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('road_cuts').insert(payload));
    }

    setSaving(false);
    if (error) { alert('Error al guardar: ' + error.message); return; }
    setShowForm(false);
    fetchCuts();
  };

  const handleToggleActive = async (cut: RoadCut) => {
    await supabase.from('road_cuts').update({ is_active: !cut.is_active }).eq('id', cut.id);
    fetchCuts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('road_cuts').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchCuts();
  };

  // ── Filtrado ─────────────────────────────────────────────────────────────
  const filtered = cuts.filter(c =>
    filterSeverity === 'all' ? true : c.severity === filterSeverity
  );

  // ── Conteo ───────────────────────────────────────────────────────────────
  const countByType = {
    total:   cuts.filter(c => c.severity === 'total'   && c.is_active).length,
    partial: cuts.filter(c => c.severity === 'partial' && c.is_active).length,
    caution: cuts.filter(c => c.severity === 'caution' && c.is_active).length,
  };

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-white">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-[150px]" />

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-slate-400">arrow_back</span>
            </button>
            <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Super Admin</p>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                Estado de Rutas
              </h1>
            </div>
            <button
              onClick={openNew}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
            >
              <span className="material-symbols-outlined text-lg">add_road</span>
              Nuevo Corte
            </button>
          </div>

          {/* ── STAT CHIPS ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {(['total', 'partial', 'caution'] as RoadCutSeverity[]).map(s => {
              const cfg = SEVERITY_CONFIG[s];
              return (
                <div key={s} className={`${cfg.bg} border rounded-2xl p-4 flex items-center gap-3`}>
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <p className={`text-2xl font-black ${cfg.color}`}>{countByType[s]}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FILTROS ──────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-12 py-4 flex gap-3 overflow-x-auto">
        {(['all', 'total', 'partial', 'caution'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterSeverity(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              filterSeverity === f
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
            }`}
          >
            {f === 'all' ? 'Todos' : `${SEVERITY_CONFIG[f].icon} ${SEVERITY_CONFIG[f].label}`}
          </button>
        ))}
      </div>

      {/* ── LISTA ────────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-12 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-5xl animate-spin">sync</span>
            <p className="mt-4 font-bold text-sm uppercase tracking-widest">Cargando cortes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <span className="material-symbols-outlined text-5xl">road</span>
            <p className="mt-4 font-bold text-sm uppercase tracking-widest">Sin cortes registrados</p>
          </div>
        ) : (
          filtered.map(cut => {
            const cfg = SEVERITY_CONFIG[cut.severity];
            return (
              <div
                key={cut.id}
                className={`relative bg-white/5 border ${cut.is_active ? cfg.bg : 'border-white/5 opacity-50'} rounded-3xl p-6 transition-all`}
              >
                {/* Badge de tipo */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${cfg.badge} ${cfg.bg}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {!cut.is_active && (
                      <span className="text-xs font-black text-slate-500 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">
                        Inactivo
                      </span>
                    )}
                    {cut.latitude && cut.longitude && (
                      <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-full font-bold">
                        📍 En mapa
                      </span>
                    )}
                  </div>
                  {/* Acciones */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(cut)}
                      title={cut.is_active ? 'Desactivar' : 'Activar'}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                        cut.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {cut.is_active ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                    <button
                      onClick={() => openEdit(cut)}
                      className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteId(cut.id)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {/* Contenido */}
                <h3 className="text-white font-black text-lg tracking-tight leading-tight">
                  📌 {cut.route_name}
                  {cut.sector && <span className="text-slate-400 font-bold">, {cut.sector}</span>}
                </h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{cut.description}</p>

                <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
                  {cut.schedule && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {cut.schedule}
                    </span>
                  )}
                  {cut.validity && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">calendar_month</span>
                      {cut.validity}
                    </span>
                  )}
                  {cut.latitude && cut.longitude && (
                    <span className="flex items-center gap-1 text-teal-500">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {cut.latitude.toFixed(4)}, {cut.longitude.toFixed(4)}
                    </span>
                  )}
                  {cut.source && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">info</span>
                      Fuente: {cut.source}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL: FORMULARIO ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-8 py-6 flex items-center justify-between rounded-t-[2rem] z-10">
              <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                {editingId ? 'Editar Corte' : 'Nuevo Corte en Ruta'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <div className="p-8 space-y-5">
              {/* Severidad */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Tipo de alerta *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['total', 'partial', 'caution'] as RoadCutSeverity[]).map(s => {
                    const cfg = SEVERITY_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, severity: s }))}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          form.severity === s ? `${cfg.bg} border-opacity-80` : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xl mb-1">{cfg.icon}</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${form.severity === s ? cfg.color : 'text-slate-400'}`}>
                          {cfg.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ruta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ruta *</label>
                  <input
                    type="text"
                    value={form.route_name}
                    onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))}
                    placeholder="Ej: Ruta 7 Sur"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sector / Tramo</label>
                  <input
                    type="text"
                    value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                    placeholder="Ej: Acceso Bahía Murta - Puente El Belga"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descripción *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe el corte o interrupción…"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder-slate-600 resize-none"
                />
              </div>

              {/* Horario y Vigencia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Horario de corte</label>
                  <input
                    type="text"
                    value={form.schedule}
                    onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                    placeholder="Ej: 14:00 a 18:00 horas"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Vigencia (texto)</label>
                  <input
                    type="text"
                    value={form.validity}
                    onChange={e => setForm(f => ({ ...f, validity: e.target.value }))}
                    placeholder="Ej: Lunes a viernes hasta el 31 de dic 2026"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Válido desde</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Válido hasta</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Coordenadas */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  📍 Coordenadas GPS (para mostrar en el mapa)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    step="0.0001"
                    value={form.latitude ?? ''}
                    onChange={e => setForm(f => ({ ...f, latitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="Latitud (Ej: -45.5720)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-500/50 placeholder-slate-600"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={form.longitude ?? ''}
                    onChange={e => setForm(f => ({ ...f, longitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="Longitud (Ej: -72.0620)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-500/50 placeholder-slate-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  💡 Sin coordenadas: el corte aparece en la lista del mapa pero sin marcador.
                </p>
              </div>

              {/* Fuente */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fuente de información</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Activo */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-sm font-bold text-slate-300">Corte activo (visible en mapa y app)</span>
              </label>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-lg shadow-red-500/20"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Guardando…
                    </span>
                  ) : editingId ? 'Actualizar Corte' : 'Crear Corte'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR BORRADO ──────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/20 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tight">¿Eliminar corte?</h3>
            <p className="text-sm text-slate-400 mb-6">Esta acción es permanente. El corte será eliminado del mapa y la lista.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-slate-400 text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-2xl font-black text-white text-sm uppercase tracking-widest transition-all">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadCutsAdminScreen;
