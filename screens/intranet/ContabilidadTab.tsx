import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAppAuth } from '../../App';

interface Transaction {
  id: string;
  created_at?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  receipt_url?: string;
  notes?: string;
  is_recurring?: boolean;
}

interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  start_date: string;
  duration_months: number | null;
  is_active: boolean;
  notes?: string;
}

const CATEGORIES = [
  'Operaciones', 'Marketing', 'Sueldos', 'Arriendo', 'Servicios Básicos',
  'Insumos', 'Transporte', 'Impuestos', 'Ventas', 'Inversiones', 'Otros'
];

const ContabilidadTab: React.FC = () => {
  const { user } = useAppAuth();
  const [viewMode, setViewMode] = useState<'normal' | 'recurring'>('normal');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [carryoverBalance, setCarryoverBalance] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'Operaciones',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [reqForm, setReqForm] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'Operaciones',
    amount: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_months: '',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Helper to calculate months difference (months elapsed before a certain date)
  const getMonthsApplicable = (startStr: string, limitStr: string, maxDuration: number | null) => {
    const start = new Date(startStr + 'T12:00:00');
    const limit = new Date(limitStr + 'T12:00:00');
    if (start >= limit) return 0;
    
    let months = (limit.getFullYear() - start.getFullYear()) * 12 + (limit.getMonth() - start.getMonth());
    if (limit.getDate() < start.getDate()) months--; // haven't reached the exact day yet
    
    // We want inclusive months for carryover, actually let's just count how many 1sts of month passed if we evaluate at start of month
    // Simplified: Number of months from start YYYY-MM to limit YYYY-MM
    let simpleMonths = (limit.getFullYear() - start.getFullYear()) * 12 + (limit.getMonth() - start.getMonth());
    if (simpleMonths < 0) simpleMonths = 0;
    
    if (maxDuration !== null && simpleMonths > maxDuration) return maxDuration;
    return simpleMonths;
  };

  const hasRecurringInMonth = (startStr: string, currentYm: string, maxDuration: number | null) => {
    const start = new Date(startStr + 'T12:00:00');
    const currParts = currentYm.split('-');
    const currDate = new Date(parseInt(currParts[0]), parseInt(currParts[1]) - 1, 1);
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    
    if (startMonth > currDate) return false;
    
    const monthsDiff = (currDate.getFullYear() - startMonth.getFullYear()) * 12 + (currDate.getMonth() - startMonth.getMonth());
    if (maxDuration !== null && monthsDiff >= maxDuration) return false;
    
    return true;
  };

  const fetchAllData = async () => {
    setLoading(true);
    const [year, month] = filterMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    // 1. One-off transactions for current month
    const { data: monthData } = await supabase
      .from('intranet_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    // 2. All active recurring
    const { data: recData } = await supabase.from('intranet_recurring_transactions').select('*').eq('is_active', true);
    if (recData) setRecurringList(recData);

    // 3. Inject Recurring into month transactions
    let injectedTrans: Transaction[] = monthData ? [...monthData] : [];
    if (recData) {
      recData.forEach(r => {
        if (hasRecurringInMonth(r.start_date, filterMonth, r.duration_months)) {
          // Calculate the exact date for this month
          const sdDate = new Date(r.start_date + 'T12:00:00');
          let day = sdDate.getDate();
          const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
          if (day > lastDayOfMonth) day = lastDayOfMonth;
          
          injectedTrans.push({
            id: 'rec_' + r.id,
            type: r.type,
            category: r.category,
            amount: r.amount,
            description: r.description,
            date: `${year}-${month}-${String(day).padStart(2, '0')}`,
            notes: (r.duration_months ? `Cuota de ${r.duration_months} meses.` : 'Recurrente infinito.') + (r.notes ? ` ${r.notes}` : ''),
            is_recurring: true
          });
        }
      });
    }
    
    // sort injected
    injectedTrans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(injectedTrans);

    // 4. Calculate Carryover
    const { data: pastOneOffs } = await supabase.from('intranet_transactions').select('type, amount').lt('date', startDate);
    let carryover = 0;
    
    pastOneOffs?.forEach(t => {
      carryover += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    });
    
    recData?.forEach(r => {
      const applicableMonths = getMonthsApplicable(r.start_date, startDate, r.duration_months);
      const totalRec = Number(r.amount) * applicableMonths;
      carryover += r.type === 'income' ? totalRec : -totalRec;
    });
    
    setCarryoverBalance(carryover);
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, [filterMonth, viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
      notes: form.notes
    };

    if (editId && !editId.startsWith('rec_')) {
      await supabase.from('intranet_transactions').update(payload).eq('id', editId);
    } else {
      await supabase.from('intranet_transactions').insert([payload]);
    }

    setForm({ type: 'expense', category: 'Operaciones', amount: '', description: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setShowForm(false);
    setEditId(null);
    setSaving(false);
    fetchAllData();
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      type: reqForm.type,
      category: reqForm.category,
      amount: parseFloat(reqForm.amount),
      description: reqForm.description,
      start_date: reqForm.start_date,
      duration_months: reqForm.duration_months ? parseInt(reqForm.duration_months) : null,
      notes: reqForm.notes,
      is_active: true
    };

    if (editId) {
      await supabase.from('intranet_recurring_transactions').update(payload).eq('id', editId);
    } else {
      await supabase.from('intranet_recurring_transactions').insert([payload]);
    }

    setReqForm({ type: 'expense', category: 'Operaciones', amount: '', description: '', start_date: new Date().toISOString().split('T')[0], duration_months: '', notes: '' });
    setShowForm(false);
    setEditId(null);
    setSaving(false);
    fetchAllData();
  };

  const handleDelete = async (id: string, isRecurring = false) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    if (isRecurring) {
      if (id.startsWith('rec_')) id = id.replace('rec_', '');
      await supabase.from('intranet_recurring_transactions').delete().eq('id', id);
    } else {
      await supabase.from('intranet_transactions').delete().eq('id', id);
    }
    fetchAllData();
  };

  const stopRecurring = async (id: string) => {
    if (!confirm('¿Detener esta recurrencia? (Dejará de generar cargos futuros)')) return;
    await supabase.from('intranet_recurring_transactions').update({ is_active: false }).eq('id', id);
    fetchAllData();
  };

  const handleEdit = (t: Transaction) => {
    if (t.is_recurring) return alert('Debes editar esto desde la pestaña de Gastos Recurrentes.');
    setForm({ type: t.type, category: t.category, amount: String(t.amount), description: t.description || '', date: t.date, notes: t.notes || '' });
    setEditId(t.id);
    setShowForm(true);
  };
  
  const handleEditRecurring = (r: RecurringTransaction) => {
    setReqForm({ type: r.type, category: r.category, amount: String(r.amount), description: r.description, start_date: r.start_date, duration_months: r.duration_months ? String(r.duration_months) : '', notes: r.notes || '' });
    setEditId(r.id);
    setShowForm(true);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const monthlyFlow = totalIncome - totalExpense;
  const currentRealBalance = carryoverBalance + monthlyFlow;

  const formatCLP = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');

  // RENDER NORMAL VIEW
  if (viewMode === 'normal') {
    return (
      <div className="space-y-6">
        {/* Real Cash Flow Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Anterior</p>
             <p className={`text-xl font-black ${carryoverBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatCLP(carryoverBalance)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Ingresos Mes</p>
            <p className="text-xl font-black text-emerald-400">{formatCLP(totalIncome)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Gastos Mes</p>
            <p className="text-xl font-black text-red-400">{formatCLP(totalExpense)}</p>
          </div>
          <div className={`p-4 rounded-2xl ${currentRealBalance >= 0 ? 'bg-primary border-primary/50' : 'bg-orange-500 border-orange-600'}`}>
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Saldo Actual</p>
            <p className="text-2xl font-black text-white">{formatCLP(currentRealBalance)}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold focus:border-primary/50 outline-none" />
            <button onClick={() => { setShowForm(!showForm); setEditId(null); }}
              className="px-5 py-2.5 bg-primary rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:bg-primary/80 transition-all">
              <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
              Transacción Única
            </button>
          </div>
          <button onClick={() => { setViewMode('recurring'); setShowForm(false); }} className="px-5 py-2.5 border border-indigo-400/50 rounded-xl font-bold text-indigo-400 text-sm flex items-center gap-2 hover:bg-indigo-500/10 transition-all">
            <span className="material-symbols-outlined text-lg">event_repeat</span> Gastos Recurrentes
          </button>
        </div>

        {/* Form Modal / Inline */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-primary/30 space-y-4 shadow-xl">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-black uppercase text-sm">Transacción Manual (Solo un mes)</h3>
             </div>
             {/* ... form fields same as original ... */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                <div className="flex gap-2">
                  {(['income', 'expense'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${form.type === t ? (t === 'income' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                      {t === 'income' ? '💰 Ingreso' : '💸 Gasto'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoría</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Monto ($)</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="1"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Descripción</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" placeholder="Ej: Vuelo Aysén" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha de pago</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Notas (opcional)</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-primary rounded-xl font-bold text-white text-sm hover:bg-primary/80 transition-all disabled:opacity-50">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
            </button>
          </form>
        )}

        {/* Transactions Table */}
        {loading ? (
          <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-primary"></div></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16"><span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">receipt_long</span><p className="text-slate-500 font-bold">Sin movimientos este mes.</p></div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className={`border-t border-white/5 transition-colors ${t.is_recurring ? 'bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06]' : 'hover:bg-white/5'}`}>
                    <td className="px-4 py-3 text-slate-300 font-bold whitespace-nowrap">{new Date(t.date + 'T12:00:00').toLocaleDateString('es-CL')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                      {t.is_recurring && <span className="ml-2 material-symbols-outlined text-[12px] text-indigo-400 align-middle" title="Generado por sistema">sync</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 font-bold">{t.description}</p>
                      <p className="text-slate-500 text-[10px]">{t.category} {t.notes && `• ${t.notes}`}</p>
                    </td>
                    <td className={`px-4 py-3 text-right font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCLP(Number(t.amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!t.is_recurring && (
                        <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all mr-1" title="Editar"><span className="material-symbols-outlined text-sm text-slate-400">edit</span></button>
                      )}
                      <button onClick={() => handleDelete(t.id, t.is_recurring)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all" title="Eliminar"><span className="material-symbols-outlined text-sm text-red-400">delete</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // RENDER RECURRING VIEW
  return (
    <div className="space-y-6">
       <button onClick={() => { setViewMode('normal'); setShowForm(false); }} className="px-4 py-2 mb-4 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span> Volver a Contabilidad
       </button>
       
       <div className="flex flex-wrap items-center justify-between gap-3 bgGradientPill p-6 rounded-2xl border border-indigo-500/30">
          <div>
            <h2 className="text-xl font-black text-white italic">Transacciones Recurrentes</h2>
            <p className="text-slate-300 text-sm">Se inyectarán automáticamente cada mes en el flujo de caja.</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="px-5 py-2.5 bg-primary rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:bg-primary/80 transition-all">
            <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span> Nuevo Recurrente
          </button>
       </div>

       {showForm && (
          <form onSubmit={handleRecurringSubmit} className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/50 space-y-4 shadow-xl">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                <select value={reqForm.type} onChange={e => setReqForm({ ...reqForm, type: e.target.value as any })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold">
                  <option value="expense">Gasto / Deuda</option>
                  <option value="income">Ingreso Renovable</option>
                </select>
              </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoría</label>
                <select value={reqForm.category} onChange={e => setReqForm({ ...reqForm, category: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Monto Fijo Mensual ($)</label>
                <input type="number" value={reqForm.amount} onChange={e => setReqForm({ ...reqForm, amount: e.target.value })} required min="1" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Concepto (Ej: Cuota crédito x)</label>
                <input type="text" value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold" />
              </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha de Inicio</label>
                <input type="date" value={reqForm.start_date} onChange={e => setReqForm({ ...reqForm, start_date: e.target.value })} required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold" />
              </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Duración (Meses)</label>
                <input type="number" value={reqForm.duration_months} onChange={e => setReqForm({ ...reqForm, duration_months: e.target.value })} min="1" placeholder="Vació = Siempre" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-primary rounded-xl font-bold text-white text-sm hover:bg-primary/80 transition-all disabled:opacity-50">
              {saving ? 'Guardando...' : editId ? 'Actualizar Regla' : 'Crear Regla Recurrente'}
            </button>
          </form>
       )}

      {loading ? <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-primary"></div></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {recurringList.map(r => (
                <div key={r.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                   <div>
                     <div className="flex justify-between items-start mb-2">
                       <span className={`px-2 py-1 inline-block rounded text-[9px] font-black uppercase ${r.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {r.type === 'income' ? 'Ingreso Fijo' : 'Deuda/Gasto Fijo'}
                       </span>
                       <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded">Activo</span>
                     </div>
                     <p className="text-white font-bold">{r.description}</p>
                     <p className="text-xl font-black text-primary">{formatCLP(r.amount)} / mes</p>
                     <div className="mt-3 space-y-1 text-xs text-slate-400">
                        <p>📍 Categoría: {r.category}</p>
                        <p>📅 Inicia: {new Date(r.start_date + 'T12:00:00').toLocaleDateString()}</p>
                        <p>⏳ Plazo: {r.duration_months ? `${r.duration_months} cuotas` : 'Infinito'}</p>
                     </div>
                   </div>
                   <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                      <button onClick={() => handleEditRecurring(r)} className="flex-1 bg-white/5 hover:bg-white/10 py-1.5 rounded-lg text-xs font-bold text-white transition-all">Editar</button>
                      <button onClick={() => stopRecurring(r.id)} className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 py-1.5 rounded-lg text-xs font-bold text-orange-400 transition-all">Detener</button>
                   </div>
                </div>
             ))}
             {recurringList.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 font-bold">No hay transacciones recurrentes activas.</div>
             )}
          </div>
       )}
    </div>
  );
};

export default ContabilidadTab;
