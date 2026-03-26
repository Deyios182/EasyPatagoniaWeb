import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAppAuth } from '../../App';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  all_day: boolean;
  color: string;
  event_type: string;
}

const EVENT_COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
const EVENT_TYPES = ['general', 'reunión', 'pago', 'deadline', 'viaje', 'otro'];

const CalendarioTab: React.FC = () => {
  const { user } = useAppAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', start_date: '', end_date: '', location: '', all_day: false, color: '#6366f1', event_type: 'general'
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const fetchEvents = async () => {
    setLoading(true);
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase.from('intranet_events').select('*')
      .gte('start_date', startOfMonth).lte('start_date', endOfMonth).order('start_date');
    if (data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getEventsForDay = (day: number) => {
    return events.filter(e => {
      const d = new Date(e.start_date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setEditId(null);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T09:00`;
    setForm({ title: '', description: '', start_date: dateStr, end_date: '', location: '', all_day: false, color: '#6366f1', event_type: 'general' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, created_by: user?.uid, start_date: new Date(form.start_date).toISOString(), end_date: form.end_date ? new Date(form.end_date).toISOString() : null };
    if (editId) {
      await supabase.from('intranet_events').update(payload).eq('id', editId);
    } else {
      await supabase.from('intranet_events').insert([payload]);
    }
    setShowForm(false);
    setEditId(null);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    await supabase.from('intranet_events').delete().eq('id', id);
    fetchEvents();
  };

  const handleEdit = (ev: CalendarEvent) => {
    const startLocal = new Date(ev.start_date);
    const startStr = `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}T${String(startLocal.getHours()).padStart(2, '0')}:${String(startLocal.getMinutes()).padStart(2, '0')}`;
    let endStr = '';
    if (ev.end_date) {
      const endLocal = new Date(ev.end_date);
      endStr = `${endLocal.getFullYear()}-${String(endLocal.getMonth() + 1).padStart(2, '0')}-${String(endLocal.getDate()).padStart(2, '0')}T${String(endLocal.getHours()).padStart(2, '0')}:${String(endLocal.getMinutes()).padStart(2, '0')}`;
    }
    setForm({ title: ev.title, description: ev.description || '', start_date: startStr, end_date: endStr, location: ev.location || '', all_day: ev.all_day, color: ev.color, event_type: ev.event_type });
    setEditId(ev.id);
    setShowForm(true);
  };

  const exportICS = (ev: CalendarEvent) => {
    const formatICSDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EasyPatagonia//Intranet//ES',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(ev.start_date)}`,
      ev.end_date ? `DTEND:${formatICSDate(ev.end_date)}` : '',
      `SUMMARY:${ev.title}`,
      ev.description ? `DESCRIPTION:${ev.description}` : '',
      ev.location ? `LOCATION:${ev.location}` : '',
      `UID:${ev.id}@easypatagonia.cl`,
      'END:VEVENT', 'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${ev.title.replace(/\s+/g, '_')}.ics`;
    a.click();
  };

  const exportAllICS = () => {
    if (events.length === 0) return;
    const formatICSDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const vevents = events.map(ev => [
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(ev.start_date)}`,
      ev.end_date ? `DTEND:${formatICSDate(ev.end_date)}` : '',
      `SUMMARY:${ev.title}`,
      ev.description ? `DESCRIPTION:${ev.description}` : '',
      ev.location ? `LOCATION:${ev.location}` : '',
      `UID:${ev.id}@easypatagonia.cl`,
      'END:VEVENT'
    ].filter(Boolean).join('\r\n')).join('\r\n');
    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//EasyPatagonia//Intranet//ES\r\n${vevents}\r\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `easy_calendario_${MONTHS_ES[month]}_${year}.ics`;
    a.click();
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-white">chevron_left</span>
          </button>
          <h3 className="text-xl font-black text-white uppercase tracking-tight min-w-[200px] text-center">{MONTHS_ES[month]} {year}</h3>
          <button onClick={nextMonth} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-white">chevron_right</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={exportAllICS} disabled={events.length === 0} className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl font-bold text-indigo-400 text-sm flex items-center gap-2 hover:bg-indigo-500/30 transition-all disabled:opacity-30">
            <span className="material-symbols-outlined text-lg">download</span> Exportar .ics
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-7 bg-white/5">
          {DAYS_ES.map(d => (<div key={d} className="p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            return (
              <div key={i} onClick={() => day && handleDayClick(day)} className={`min-h-[90px] p-2 border-t border-r border-white/5 cursor-pointer transition-all hover:bg-white/5 ${!day ? 'bg-white/[0.02]' : ''} ${day && isToday(day) ? 'bg-primary/10 border-primary/30' : ''}`}>
                {day && (
                  <>
                    <span className={`text-sm font-bold ${isToday(day) ? 'text-primary' : 'text-slate-400'}`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} onClick={e => { e.stopPropagation(); handleEdit(ev); }} className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded truncate" style={{ backgroundColor: ev.color + '40', borderLeft: `2px solid ${ev.color}` }}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <p className="text-[9px] text-slate-500 font-bold">+{dayEvents.length - 3} más</p>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{editId ? 'Editar Evento' : 'Nuevo Evento'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded-lg"><span className="material-symbols-outlined text-slate-400">close</span></button>
            </div>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Título del evento"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-primary/50" />
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción (opcional)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-primary/50" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inicio</label>
                <input type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fin (opcional)</label>
                <input type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" />
              </div>
            </div>
            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="📍 Ubicación (opcional)"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-primary/50" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50">
                  {EVENT_TYPES.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Color</label>
                <div className="flex gap-1.5 flex-wrap">
                  {EVENT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-3 bg-primary rounded-xl font-bold text-white text-sm hover:bg-primary/80 transition-all">
                {editId ? 'Actualizar' : 'Crear Evento'}
              </button>
              {editId && (
                <>
                  <button type="button" onClick={() => exportICS(events.find(e => e.id === editId)!)} className="py-3 px-4 bg-indigo-500/20 border border-indigo-500/30 rounded-xl font-bold text-indigo-400 text-sm hover:bg-indigo-500/30 transition-all" title="Exportar .ics">
                    <span className="material-symbols-outlined text-lg">download</span>
                  </button>
                  <button type="button" onClick={() => { handleDelete(editId); setShowForm(false); }} className="py-3 px-4 bg-red-500/20 border border-red-500/30 rounded-xl font-bold text-red-400 text-sm hover:bg-red-500/30 transition-all" title="Eliminar">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Events List below calendar */}
      {events.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Eventos del mes ({events.length})</p>
          {events.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/20 transition-all cursor-pointer group" onClick={() => handleEdit(ev)}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ev.color }}></div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{ev.title}</p>
                <p className="text-slate-500 text-[10px]">
                  {new Date(ev.start_date).toLocaleDateString('es-CL')} {new Date(ev.start_date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  {ev.location && ` • 📍 ${ev.location}`}
                </p>
              </div>
              <button onClick={e => { e.stopPropagation(); exportICS(ev); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Exportar .ics">
                <span className="material-symbols-outlined text-sm text-slate-400">download</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarioTab;
