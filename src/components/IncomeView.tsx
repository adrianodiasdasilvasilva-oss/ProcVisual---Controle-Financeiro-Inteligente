import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Target, 
  Calendar,
  ChevronRight,
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

interface IncomeViewProps {
  transactions: Transaction[];
  selectedMonths: number[];
  selectedYear: number;
  statusFilter?: 'all' | 'paid' | 'pending';
  onDelete?: (transaction: Transaction) => void;
  onTogglePaid?: (transaction: Transaction) => void;
}

const COLORS = ['#10b981', '#34d399', '#059669', '#065f46', '#064e3b'];

const parseDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  return new Date(y, m - 1, d);
};

export const IncomeView = ({ 
  transactions, 
  selectedMonths, 
  selectedYear, 
  statusFilter = 'all',
  onDelete, 
  onTogglePaid 
}: IncomeViewProps) => {
  const incomeTransactions = React.useMemo(() => 
    transactions.filter(t => t.type === 'income'),
    [transactions]
  );

  const stats = React.useMemo(() => {
    const currentPeriod = incomeTransactions.filter(t => {
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
    
    const previousPeriod = isSingleMonth ? incomeTransactions.filter(t => {
      const d = parseDate(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    }) : [];

    const currentTotal = currentPeriod.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const prevTotal = previousPeriod.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    
    const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    const avgTicket = currentPeriod.length > 0 ? currentTotal / currentPeriod.length : 0;
    const maxIncome = currentPeriod.length > 0 ? Math.max(...currentPeriod.map(t => parseFloat(t.amount))) : 0;

    return {
      total: currentTotal,
      prevTotal,
      growth,
      avgTicket,
      maxIncome,
      count: currentPeriod.length,
      currentPeriod
    };
  }, [incomeTransactions, selectedMonths, selectedYear]);

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
      const total = incomeTransactions
        .filter(t => {
          const d = parseDate(t.date);
          return d.getMonth() === i && d.getFullYear() === (selectedYear === -1 ? new Date().getFullYear() : selectedYear);
        })
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);
      return { name: m, value: total };
    });
  }, [incomeTransactions, selectedYear]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Análise de Receitas</h2>
          <p className="text-[#6B7280]">Acompanhe seu faturamento e crescimento.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Receita Total"
          value={`R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${stats.growth.toFixed(1)}%`}
          trendUp={stats.growth >= 0}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          bgColor="bg-emerald-50"
          description="vs. mês anterior"
        />
        <KPICard 
          title="Ticket Médio"
          value={`R$ ${stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Target className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
          description="Por lançamento"
        />
        <KPICard 
          title="Maior Entrada"
          value={`R$ ${stats.maxIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          bgColor="bg-purple-50"
          description="Recorde do período"
        />
        <KPICard 
          title="Volume"
          value={stats.count.toString()}
          icon={<Calendar className="w-6 h-6 text-amber-600" />}
          bgColor="bg-amber-50"
          description="Recebimentos totais"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
          <h3 className="text-lg font-bold text-[#111827] mb-6">Evolução de Faturamento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#000' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
          <h3 className="text-lg font-bold text-[#111827] mb-6">Fontes de Receita</h3>
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

        {/* Top Transactions Table */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#111827]">Maiores Entradas do Período</h3>
            <button className="text-sm font-bold text-emerald-600 hover:underline flex items-center gap-1">
              Ver histórico completo <ChevronRight className="w-4 h-4" />
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
                  <th className="pb-4 px-4 text-center">Recebido</th>
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-600">
                        + R$ {parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => onTogglePaid?.(t)}
                          title={t.paid ? "Marcar como pendente" : "Marcar como recebido"}
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
                      Nenhuma receita registrada neste período.
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
    className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${bgColor}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-sm font-medium text-[#6B7280] mb-1">{title}</p>
    <h4 className="text-2xl font-bold text-[#111827]">{value}</h4>
    <p className="text-xs text-[#6B7280] mt-1">{description}</p>
  </motion.div>
);
