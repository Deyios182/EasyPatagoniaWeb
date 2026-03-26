import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAppAuth } from '../../App';

const CATEGORIES = ['Operaciones', 'Marketing', 'Sueldos', 'Arriendo', 'Servicios Básicos', 'Insumos', 'Transporte', 'Impuestos', 'Otros'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface BudgetRow { category: string; budgeted: number[]; actual: number[]; }

const PresupuestoTab: React.FC = () => {
  const { user } = useAppAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editCell, setEditCell] = useState<{ cat: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchData = async () => {
    setLoading(true);
    // Fetch budget entries for the year
    const { data: budgets } = await supabase.from('intranet_budget').select('*').eq('year', year);
    // Fetch actual expenses for the year
    const { data: transactions } = await supabase.from('intranet_transactions')
      .select('category, amount, date, type')
      .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
      .eq('type', 'expense');

    const budgetRows: BudgetRow[] = CATEGORIES.map(cat => {
      const budgeted = Array(12).fill(0);
      const actual = Array(12).fill(0);
      budgets?.filter(b => b.category === cat).forEach(b => { budgeted[b.month - 1] = Number(b.budgeted_amount); });
      transactions?.filter(t => t.category === cat).forEach(t => {
        const m = new Date(t.date + 'T12:00:00').getMonth();
        actual[m] += Number(t.amount);
      });
      return { category: cat, budgeted, actual };
    });
    setRows(budgetRows);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [year]);

  const saveBudget = async (category: string, month: number, amount: number) => {
    setSaving(true);
    const { data: existing } = await supabase.from('intranet_budget').select('id').eq('category', category).eq('month', month + 1).eq('year', year).single();
    if (existing) {
      await supabase.from('intranet_budget').update({ budgeted_amount: amount }).eq('id', existing.id);
    } else {
      await supabase.from('intranet_budget').insert([{ category, month: month + 1, year, budgeted_amount: amount, created_by: user?.uid ?? null }]);
    }
    setSaving(false);
    fetchData();
  };

  const handleCellClick = (cat: string, month: number, currentValue: number) => {
    setEditCell({ cat, month });
    setEditValue(String(currentValue || ''));
  };

  const handleCellSave = () => {
    if (!editCell) return;
    const amount = parseFloat(editValue) || 0;
    saveBudget(editCell.cat, editCell.month, amount);
    setEditCell(null);
  };

  const formatCLP = (n: number) => n ? '$' + Math.round(n).toLocaleString('es-CL') : '-';

  const totalBudgeted = (monthIdx: number) => rows.reduce((s, r) => s + r.budgeted[monthIdx], 0);
  const totalActual = (monthIdx: number) => rows.reduce((s, r) => s + r.actual[monthIdx], 0);
  const categoryTotal = (row: BudgetRow, type: 'budgeted' | 'actual') => row[type].reduce((s, v) => s + v, 0);

  if (loading) return <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center gap-3">
        <button onClick={() => setYear(y => y - 1)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-white">chevron_left</span>
        </button>
        <h3 className="text-xl font-black text-white uppercase tracking-tight min-w-[100px] text-center">{year}</h3>
        <button onClick={() => setYear(y => y + 1)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-white">chevron_right</span>
        </button>
        {saving && <span className="text-primary text-xs font-bold animate-pulse">Guardando...</span>}
      </div>

      <p className="text-slate-500 text-xs font-bold">💡 Haz click en una celda de presupuesto para editarla. Los gastos reales se calculan automáticamente.</p>

      {/* Budget Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-900 z-10 min-w-[120px]">Categoría</th>
              {MONTHS_ES.map((m, i) => (
                <th key={m} colSpan={2} className="text-center px-1 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-l border-white/5">{m}</th>
              ))}
              <th colSpan={2} className="text-center px-2 py-3 text-[9px] font-black text-primary uppercase tracking-widest border-l border-primary/30">Total</th>
            </tr>
            <tr className="bg-white/[0.02]">
              <th className="sticky left-0 bg-slate-900 z-10"></th>
              {MONTHS_ES.map(m => (
                <React.Fragment key={m + '_sub'}>
                  <th className="text-center px-1 py-1.5 text-[8px] font-bold text-blue-400 border-l border-white/5">Ppto</th>
                  <th className="text-center px-1 py-1.5 text-[8px] font-bold text-orange-400">Real</th>
                </React.Fragment>
              ))}
              <th className="text-center px-1 py-1.5 text-[8px] font-bold text-blue-400 border-l border-primary/30">Ppto</th>
              <th className="text-center px-1 py-1.5 text-[8px] font-bold text-orange-400">Real</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.category} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="px-3 py-2.5 text-slate-300 font-bold text-xs sticky left-0 bg-slate-900 z-10">{row.category}</td>
                {MONTHS_ES.map((_, mi) => {
                  const isEditing = editCell?.cat === row.category && editCell?.month === mi;
                  const diff = row.budgeted[mi] > 0 ? row.actual[mi] - row.budgeted[mi] : 0;
                  const overBudget = diff > 0 && row.budgeted[mi] > 0;
                  return (
                    <React.Fragment key={mi}>
                      <td className="text-center px-1 py-2 border-l border-white/5 cursor-pointer hover:bg-blue-500/10 transition-colors" onClick={() => handleCellClick(row.category, mi, row.budgeted[mi])}>
                        {isEditing ? (
                          <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleCellSave} onKeyDown={e => e.key === 'Enter' && handleCellSave()} autoFocus
                            className="w-16 px-1 py-0.5 bg-primary/20 border border-primary/50 rounded text-white text-xs font-bold text-center outline-none" />
                        ) : (
                          <span className="text-blue-300 font-bold">{formatCLP(row.budgeted[mi])}</span>
                        )}
                      </td>
                      <td className={`text-center px-1 py-2 ${overBudget ? 'bg-red-500/10' : ''}`}>
                        <span className={`font-bold ${overBudget ? 'text-red-400' : 'text-slate-400'}`}>{formatCLP(row.actual[mi])}</span>
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="text-center px-2 py-2 border-l border-primary/30 font-black text-blue-400">{formatCLP(categoryTotal(row, 'budgeted'))}</td>
                <td className={`text-center px-2 py-2 font-black ${categoryTotal(row, 'actual') > categoryTotal(row, 'budgeted') && categoryTotal(row, 'budgeted') > 0 ? 'text-red-400' : 'text-slate-300'}`}>{formatCLP(categoryTotal(row, 'actual'))}</td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="border-t-2 border-primary/30 bg-white/5 font-black">
              <td className="px-3 py-3 text-white text-xs sticky left-0 bg-slate-800 z-10 uppercase">Total</td>
              {MONTHS_ES.map((_, mi) => (
                <React.Fragment key={'total_' + mi}>
                  <td className="text-center px-1 py-3 border-l border-white/5 text-blue-400">{formatCLP(totalBudgeted(mi))}</td>
                  <td className={`text-center px-1 py-3 ${totalActual(mi) > totalBudgeted(mi) && totalBudgeted(mi) > 0 ? 'text-red-400' : 'text-slate-300'}`}>{formatCLP(totalActual(mi))}</td>
                </React.Fragment>
              ))}
              <td className="text-center px-2 py-3 border-l border-primary/30 text-blue-400 text-sm">{formatCLP(rows.reduce((s, r) => s + categoryTotal(r, 'budgeted'), 0))}</td>
              <td className="text-center px-2 py-3 text-slate-300 text-sm">{formatCLP(rows.reduce((s, r) => s + categoryTotal(r, 'actual'), 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PresupuestoTab;
