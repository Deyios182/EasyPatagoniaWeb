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
  
  const [initialBalance, setInitialBalance] = useState(0);
  const [monthlyIncomes, setMonthlyIncomes] = useState<number[]>(Array(12).fill(0));

  const getMonthsApplicable = (startStr: string, limitStr: string, maxDuration: number | null) => {
    const start = new Date(startStr + 'T12:00:00');
    const limit = new Date(limitStr + 'T12:00:00');
    if (start >= limit) return 0;
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

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch budgets
    const { data: budgets } = await supabase.from('intranet_budget').select('*').eq('year', year);
    
    // 2. Fetch one-off transactions for the year
    const { data: transactions } = await supabase.from('intranet_transactions')
      .select('type, category, amount, date')
      .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);

    // 3. Fetch all active recurring transactions
    const { data: recurring } = await supabase.from('intranet_recurring_transactions').select('*').eq('is_active', true);

    // 4. Calculate Initial Balance (carryover before Jan 1st of the year)
    const startDate = `${year}-01-01`;
    const { data: pastOneOffs } = await supabase.from('intranet_transactions').select('type, amount').lt('date', startDate);
    let carryover = 0;
    pastOneOffs?.forEach(t => {
      carryover += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    });
    recurring?.forEach(r => {
      const applicableMonths = getMonthsApplicable(r.start_date, startDate, r.duration_months);
      const totalRec = Number(r.amount) * applicableMonths;
      carryover += r.type === 'income' ? totalRec : -totalRec;
    });

    const incomes = Array(12).fill(0);
    const budgetRows: BudgetRow[] = CATEGORIES.map(cat => {
      const budgeted = Array(12).fill(0);
      const actual = Array(12).fill(0);
      budgets?.filter(b => b.category === cat).forEach(b => { budgeted[b.month - 1] = Number(b.budgeted_amount); });
      
      transactions?.filter(t => t.category === cat && t.type === 'expense').forEach(t => {
        const m = new Date(t.date + 'T12:00:00').getMonth();
        actual[m] += Number(t.amount);
      });
      
      // Inject recurring into actuals
      recurring?.filter(r => r.category === cat && r.type === 'expense').forEach(r => {
         for(let m=0; m<12; m++) {
            const currentMonthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
            if (hasRecurringInMonth(r.start_date, currentMonthStr, r.duration_months)) {
               actual[m] += Number(r.amount);
            }
         }
      });
      return { category: cat, budgeted, actual };
    });

    transactions?.filter(t => t.type === 'income').forEach(t => {
        const m = new Date(t.date + 'T12:00:00').getMonth();
        incomes[m] += Number(t.amount);
    });
    
    recurring?.filter(r => r.type === 'income').forEach(r => {
        for(let m=0; m<12; m++) {
            const currentMonthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
            if (hasRecurringInMonth(r.start_date, currentMonthStr, r.duration_months)) {
               incomes[m] += Number(r.amount);
            }
         }
    });

    setInitialBalance(carryover);
    setMonthlyIncomes(incomes);
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
      const { error } = await supabase.from('intranet_budget').insert([{ category, month: month + 1, year, budgeted_amount: amount }]);
      if (error) console.error('Error saving budget:', error);
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

  const formatCLP = (n: number) => n === 0 ? '-' : '$' + Math.round(n).toLocaleString('es-CL');

  const totalBudgeted = (monthIdx: number) => rows.reduce((s, r) => s + r.budgeted[monthIdx], 0);
  const totalActualExpense = (monthIdx: number) => rows.reduce((s, r) => s + r.actual[monthIdx], 0);
  const categoryTotal = (row: BudgetRow, type: 'budgeted' | 'actual') => row[type].reduce((s, v) => s + v, 0);

  if (loading) return <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-primary"></div></div>;

  // Derive cash flows array
  const monthlyFlows = Array(12).fill(0);
  const runningBalances = Array(12).fill(0);
  let currentBalance = initialBalance;
  
  for(let m=0; m<12; m++) {
      monthlyFlows[m] = monthlyIncomes[m] - totalActualExpense(m);
      currentBalance += monthlyFlows[m];
      runningBalances[m] = currentBalance;
  }

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setYear(y => y - 1)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-white">chevron_left</span>
          </button>
          <h3 className="text-xl font-black text-white uppercase tracking-tight w-[100px] text-center">{year}</h3>
          <button onClick={() => setYear(y => y + 1)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-white">chevron_right</span>
          </button>
          {saving && <span className="text-primary text-xs font-bold animate-pulse ml-2">Guardando...</span>}
        </div>
        <p className="text-slate-400 text-[10px] font-bold md:text-right max-w-sm">
          💡 Click en Ppto para editar. 
          <span className="text-emerald-400 block mt-1">Saldo inicial enero: {formatCLP(initialBalance)}</span>
        </p>
      </div>

      {/* Budget Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-900 z-10 w-[140px] drop-shadow-[5px_0_5px_rgba(0,0,0,0.5)]">Análisis de Flujo</th>
              {MONTHS_ES.map(m => (
                <th key={m} colSpan={2} className="text-center px-1 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-white/5">{m}</th>
              ))}
              <th colSpan={2} className="text-center px-2 py-3 text-[10px] font-black text-primary uppercase tracking-widest border-l border-primary/30">Total {year}</th>
            </tr>
            <tr className="bg-white/[0.02]">
              <th className="sticky left-0 bg-slate-900 z-10 drop-shadow-[5px_0_5px_rgba(0,0,0,0.5)]"></th>
              {MONTHS_ES.map(m => (
                <React.Fragment key={m + '_sub'}>
                  <th className="text-center px-1 py-1.5 text-[8px] font-bold text-blue-400 border-l border-white/5 w-[65px]">Ppto</th>
                  <th className="text-center px-1 py-1.5 text-[8px] font-bold text-orange-400 w-[65px]">Real</th>
                </React.Fragment>
              ))}
              <th className="text-center px-1 py-1.5 text-[8px] font-bold text-blue-400 border-l border-primary/30">Ppto</th>
              <th className="text-center px-1 py-1.5 text-[8px] font-bold text-orange-400">Real</th>
            </tr>
          </thead>
          <tbody>
            
            {/* CASH INFLOW ROW */}
            <tr className="border-t-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
              <td className="px-3 py-2.5 font-black text-emerald-400 text-xs sticky left-0 z-10 bg-emerald-950/90 backdrop-blur drop-shadow-[5px_0_5px_rgba(0,0,0,0.5)]">💰 Ingressos Totales</td>
              {MONTHS_ES.map((_, mi) => (
                <React.Fragment key={'inc_'+mi}>
                   <td className="text-center px-1 py-2 border-l border-white/5 text-emerald-600/50">-</td>
                   <td className="text-center px-1 py-2 font-bold text-emerald-400">{formatCLP(monthlyIncomes[mi])}</td>
                </React.Fragment>
              ))}
              <td className="border-l border-primary/30 text-center text-emerald-600/50">-</td>
              <td className="text-center px-1 py-2 font-black text-emerald-400">{formatCLP(monthlyIncomes.reduce((a,b)=>a+b,0))}</td>
            </tr>

            {/* EXPENSE CATEGORIES */}
            {rows.map(row => (
              <tr key={row.category} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="px-3 py-2.5 text-slate-300 font-bold text-xs sticky left-0 bg-slate-900 z-10 drop-shadow-[5px_0_5px_rgba(0,0,0,0.5)] truncate max-w-[140px]">{row.category}</td>
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
            
            {/* TOTAL EXPENSES */}
            <tr className="border-t border-white/5 bg-slate-800 font-black">
              <td className="px-3 py-3 text-white text-xs sticky left-0 z-10 uppercase drop-shadow-[5px_0_5px_rgba(0,0,0,0.5)] bg-slate-800">💸 Total Gastos</td>
              {MONTHS_ES.map((_, mi) => (
                <React.Fragment key={'total_' + mi}>
                  <td className="text-center px-1 py-3 border-l border-white/5 text-blue-400">{formatCLP(totalBudgeted(mi))}</td>
                  <td className={`text-center px-1 py-3 ${totalActualExpense(mi) > totalBudgeted(mi) && totalBudgeted(mi) > 0 ? 'text-red-400' : 'text-orange-400'}`}>{formatCLP(totalActualExpense(mi))}</td>
                </React.Fragment>
              ))}
              <td className="text-center px-2 py-3 border-l border-primary/30 text-blue-400 text-sm">{formatCLP(rows.reduce((s, r) => s + categoryTotal(r, 'budgeted'), 0))}</td>
              <td className="text-center px-2 py-3 text-orange-400 text-sm">{formatCLP(rows.reduce((s, r) => s + categoryTotal(r, 'actual'), 0))}</td>
            </tr>

            {/* SPACER */}
            <tr className="h-4 bg-slate-900"><td colSpan={27}></td></tr>

            {/* FLOW & BALANCE */}
            <tr className="border-t border-indigo-500/30 bg-indigo-500/10 font-black">
              <td className="px-3 py-3 text-[10px] text-indigo-300 uppercase sticky left-0 bg-indigo-950/90 z-10 drop-shadow-[5px_0_5px_rgba(0,0,0,0.5)]">📈 Flujo Mes</td>
              {MONTHS_ES.map((_, mi) => (
                <React.Fragment key={'flow_' + mi}>
                  <td className="border-l border-indigo-500/10 text-center" colSpan={2}>
                     <span className={`${monthlyFlows[mi] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCLP(monthlyFlows[mi])}</span>
                  </td>
                </React.Fragment>
              ))}
              <td colSpan={2} className="border-l border-indigo-500/30"></td>
            </tr>
            <tr className="border-y border-white/20 bg-slate-800 font-black shadow-inner">
              <td className="px-3 py-4 text-white text-xs sticky left-0 z-10 uppercase drop-shadow-[5px_0_5px_rgba(0,0,0,0.5)] bg-slate-800">Caja Final (Real+Proy)</td>
              {MONTHS_ES.map((_, mi) => (
                <React.Fragment key={'balance_' + mi}>
                  <td className="border-l border-white/10 text-center" colSpan={2}>
                     <span className={`text-sm ${runningBalances[mi] >= 0 ? 'text-blue-400' : 'text-red-500'}`}>{formatCLP(runningBalances[mi])}</span>
                  </td>
                </React.Fragment>
              ))}
              <td colSpan={2} className="border-l border-white/20"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PresupuestoTab;
