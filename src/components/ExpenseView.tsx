import React from 'react';
import { 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  AlertCircle, 
  Calendar,
  ChevronRight,
  Receipt
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
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string;
}

interface ExpenseViewProps {
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#991b1b'];

export const ExpenseView = ({ transactions, selectedMonth, selectedYear }: ExpenseViewProps) => {
  const expenseTransactions = React.useMemo(() => 
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );

  const stats = React.useMemo(() => {
    const currentPeriod = expenseTransactions.filter(t => {
      const d = new Date(t.date);
      return (selectedMonth === -1 || d.getMonth() === selectedMonth) && 
             (selectedYear === -1 || d.getFullYear() === selectedYear);
    });

    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    
    const previousPeriod = expenseTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const currentTotal = currentPeriod.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const prevTotal = previousPeriod.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    
    const variation = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    
    // Calculate Burn Rate (Expense / Total Income in period)
    const totalIncome = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'income' && 
               (selectedMonth === -1 || d.getMonth() === selectedMonth) && 
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
  }, [expenseTransactions, transactions, selectedMonth, selectedYear]);

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
          const d = new Date(t.date);
          return d.getMonth() === i && d.getFullYear() === (selectedYear === -1 ? new Date().getFullYear() : selectedYear);
        })
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);
      return { name: m, value: total };
    });
  }, [expenseTransactions, selectedYear]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Análise de Despesas</h2>
        <p className="text-slate-500">Controle seus gastos e identifique economias.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Despesa Total"
          value={`R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${stats.variation >= 0 ? '+' : ''}${stats.variation.toFixed(1)}%`}
          trendUp={stats.variation <= 0} // Inverted for expenses: lower is better
          icon={<TrendingDown className="w-6 h-6 text-red-600" />}
          bgColor="bg-red-50"
          description="vs. mês anterior"
        />
        <KPICard 
          title="Burn Rate"
          value={`${stats.burnRate.toFixed(1)}%`}
          icon={<AlertCircle className="w-6 h-6 text-orange-600" />}
          bgColor="bg-orange-50"
          description="Consumo da receita"
        />
        <KPICard 
          title="Maior Saída"
          value={`R$ ${stats.maxExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CreditCard className="w-6 h-6 text-slate-600" />}
          bgColor="bg-slate-50"
          description="Gasto recorde"
        />
        <KPICard 
          title="Lançamentos"
          value={stats.count.toString()}
          icon={<Receipt className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
          description="Total de notas/recibos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Evolução de Gastos</h3>
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
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Onde está o dinheiro?</h3>
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
                  <span className="text-sm text-slate-600">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {((cat.value / stats.total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Expenses Table */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Maiores Gastos do Período</h3>
            <button className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1">
              Analisar todos os gastos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-4 px-4">Data</th>
                  <th className="pb-4 px-4">Descrição</th>
                  <th className="pb-4 px-4">Categoria</th>
                  <th className="pb-4 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.currentPeriod
                  .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                  .slice(0, 5)
                  .map((t, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-sm text-slate-500">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-slate-900">{t.description}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-red-600">
                        - R$ {parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                {stats.currentPeriod.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
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

const KPICard = ({ title, value, trend, trendUp, icon, bgColor, description }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${bgColor}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
    <p className="text-xs text-slate-400 mt-1">{description}</p>
  </motion.div>
);
