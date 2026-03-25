import React from 'react';
import { 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  AlertCircle, 
  Calendar,
  ChevronRight,
  Receipt,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string;
  paid?: boolean;
}

interface ExpenseViewProps {
  transactions: Transaction[];
  selectedMonths: number[];
  selectedYear: number;
  statusFilter?: 'all' | 'paid' | 'pending';
  onDelete?: (transaction: Transaction) => void;
  onTogglePaid?: (transaction: Transaction) => void;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#991b1b'];

const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const ExpenseView = ({ 
  transactions, 
  selectedMonths, 
  selectedYear, 
  statusFilter = 'all',
  onDelete, 
  onTogglePaid 
}: ExpenseViewProps) => {
  const expenseTransactions = React.useMemo(() => 
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );

  const stats = React.useMemo(() => {
    const currentPeriod = expenseTransactions.filter(t => {
      const d = parseDate(t.date);
      const periodMatch = (selectedMonths.length === 0 || selectedMonths.includes(d.getMonth())) && 
                         (selectedYear === -1 || d.getFullYear() === selectedYear);
      const statusMatch = statusFilter === 'all' || 
                         (statusFilter === 'paid' && t.paid) || 
                         (statusFilter === 'pending' && !t.paid);
      return periodMatch && statusMatch;
    });

    const isSingleMonth = selectedMonths.length === 1;
    const selectedMonth = isSingleMonth ? selectedMonths[0] : -1;
    
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    
    const previousPeriod = isSingleMonth ? expenseTransactions.filter(t => {
      const d = parseDate(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    }) : [];

    const currentTotal = currentPeriod.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const prevTotal = previousPeriod.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    
    const variation = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    
    // Calculate Burn Rate (Expense / Total Income in period)
    const totalIncome = transactions
      .filter(t => {
        const d = parseDate(t.date);
        return t.type === 'income' && 
               (selectedMonths.length === 0 || selectedMonths.includes(d.getMonth())) && 
               (selectedYear === -1 || d.getFullYear() === selectedYear);
      })
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);
    
    const burnRate = totalIncome > 0 ? (currentTotal / totalIncome) * 100 : 0;
    const maxExpense = currentPeriod.length > 0 ? Math.max(...currentPeriod.map(t => parseFloat(t.amount))) : 0;

    return {
      total: currentTotal,
      prevTotal,
      variation,
      burnRate,
      maxExpense,
      count: currentPeriod.length,
      currentPeriod
    };
  }, [expenseTransactions, transactions, selectedMonths, selectedYear]);

  const categoryData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    stats.currentPeriod.forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + parseFloat(t.amount);
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats.currentPeriod]);

  const evolutionData = React.useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((m, i) => {
      const total = expenseTransactions
        .filter(t => {
          const d = parseDate(t.date);
          return d.getMonth() === i && d.getFullYear() === (selectedYear === -1 ? new Date().getFullYear() : selectedYear);
        })
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);
      return { name: m, value: total };
    });
  }, [expenseTransactions, selectedYear]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#111827]">Análise de Despesas</h2>
        <p className="text-[#6B7280]">Controle seus gastos e identifique economias.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <KPICard 
          title="Despesa Total"
          value={`R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          trend={`${stats.variation >= 0 ? '+' : ''}${stats.variation.toFixed(1)}%`}
          trendUp={stats.variation <= 0} // Inverted for expenses: lower is better
          icon={<TrendingDown className="w-4 h-4 text-red-600" />}
          bgColor="bg-red-50"
          valueColor="text-red-600"
        />
        <KPICard 
          title="Burn Rate"
          value={`${stats.burnRate.toFixed(1)}%`}
          icon={<AlertCircle className="w-4 h-4 text-orange-600" />}
          bgColor="bg-orange-50"
          valueColor="text-orange-600"
        />
        <KPICard 
          title="Maior Saída"
          value={`R$ ${stats.maxExpense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          icon={<CreditCard className="w-4 h-4 text-slate-600" />}
          bgColor="bg-slate-50"
          valueColor="text-slate-600"
        />
        <KPICard 
          title="Lançamentos"
          value={stats.count.toString()}
          icon={<Receipt className="w-4 h-4 text-blue-600" />}
          bgColor="bg-blue-50"
          valueColor="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
          <h3 className="text-lg font-bold text-[#111827] mb-6">Evolução de Gastos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#000' }}
                  itemStyle={{ color: '#ef4444' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Despesa']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
          <h3 className="text-lg font-bold text-[#111827] mb-6">Onde está o dinheiro?</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-sm text-[#6B7280]">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-[#111827]">
                  {((cat.value / stats.total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Expenses Table */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#111827]">Maiores Gastos do Período</h3>
            <button className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1">
              Analisar todos os gastos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-left min-w-[900px] border-collapse">
              <thead>
                <tr className="text-xs font-bold text-[#6B7280] uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-4 px-4">Data</th>
                  <th className="pb-4 px-4">Descrição</th>
                  <th className="pb-4 px-4">Categoria</th>
                  <th className="pb-4 px-4 text-right">Valor</th>
                  <th className="pb-4 px-4 text-center">Pago</th>
                  <th className="pb-4 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.currentPeriod
                  .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                  .slice(0, 5)
                  .map((t, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-[#6B7280]">
                        {parseDate(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-[#111827]">{t.description}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-red-600">
                        - R$ {parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => onTogglePaid?.(t)}
                          title={t.paid ? "Marcar como pendente" : "Marcar como pago"}
                          className={`p-2 rounded-lg transition-all ${
                            t.paid 
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                              : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => onDelete?.(t)}
                            className="p-2 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {stats.currentPeriod.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280] italic">
                      Nenhuma despesa registrada neste período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, trend, trendUp, icon, bgColor, valueColor }: any) => (
  <div className={`p-2 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-2 h-full ${bgColor} transition-all hover:shadow-md`}>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider leading-none mb-1 truncate">{title}</p>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[8px] font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'} shrink-0`}>
            {trendUp ? <ArrowDownRight className="w-2 h-2" /> : <ArrowUpRight className="w-2 h-2" />}
            {trend}
          </div>
        )}
      </div>
      <p className={`text-base font-black ${valueColor || 'text-[#111827]'} leading-none truncate`}>{value}</p>
    </div>
  </div>
);
