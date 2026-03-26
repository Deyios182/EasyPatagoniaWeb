import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAppAuth } from '../../App';

interface Transaction {
  id: string;
  created_at: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  receipt_url?: string;
  notes?: string;
}

const CATEGORIES = [
  'Operaciones', 'Marketing', 'Sueldos', 'Arriendo', 'Servicios Básicos',
  'Insumos', 'Transporte', 'Impuestos', 'Ventas', 'Inversiones', 'Otros'
];

const ContabilidadTab: React.FC = () => {
  const { user } = useAppAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    const [year, month] = filterMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('intranet_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (!error && data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, [filterMonth]);

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

    if (editId) {
      const { error } = await supabase.from('intranet_transactions').update(payload).eq('id', editId);
      if (error) { console.error('Error updating:', error); alert('Error: ' + error.message); }
    } else {
      const { error } = await supabase.from('intranet_transactions').insert([payload]);
      if (error) { console.error('Error inserting:', error); alert('Error: ' + error.message); }
    }

    setForm({ type: 'expense', category: 'Operaciones', amount: '', description: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setShowForm(false);
    setEditId(null);
    setSaving(false);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await supabase.from('intranet_transactions').delete().eq('id', id);
    fetchTransactions();
  };

  const handleEdit = (t: Transaction) => {
    setForm({ type: t.type, category: t.category, amount: String(t.amount), description: t.description || '', date: t.date, notes: t.notes || '' });
    setEditId(t.id);
    setShowForm(true);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const formatCLP = (n: number) => '$' + n.toLocaleString('es-CL');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Ingresos</p>
          <p className="text-3xl font-black text-emerald-400">{formatCLP(totalIncome)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Gastos</p>
          <p className="text-3xl font-black text-red-400">{formatCLP(totalExpense)}</p>
        </div>
        <div className={`p-5 rounded-2xl ${balance >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
          <p className={`text-3xl font-black ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatCLP(balance)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold focus:border-primary/50 outline-none" />
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="px-5 py-2.5 bg-primary rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:bg-primary/80 transition-all">
          <span className="material-symbols-outlined text-lg">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nueva Transacción'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
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
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" placeholder="Ej: Pago de luz" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Notas (opcional)</label>
            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-primary/50" placeholder="Notas adicionales..." />
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-3 bg-primary rounded-xl font-bold text-white text-sm hover:bg-primary/80 transition-all disabled:opacity-50">
            {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Registrar Transacción'}
          </button>
        </form>
      )}

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-primary"></div></div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">receipt_long</span>
          <p className="text-slate-500 font-bold">No hay transacciones este mes</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-slate-300 font-bold">{new Date(t.date + 'T12:00:00').toLocaleDateString('es-CL')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-bold">{t.category}</td>
                  <td className="px-4 py-3 text-slate-400">{t.description}{t.notes && <span className="text-slate-600 ml-1">({t.notes})</span>}</td>
                  <td className={`px-4 py-3 text-right font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCLP(Number(t.amount))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all mr-1" title="Editar">
                      <span className="material-symbols-outlined text-sm text-slate-400">edit</span>
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all" title="Eliminar">
                      <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContabilidadTab;
