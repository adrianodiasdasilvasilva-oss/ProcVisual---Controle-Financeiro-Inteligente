import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Target, 
  Sparkles,
  DollarSign,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface InsightsProps {
  transactions: any[];
  stats: any;
  categoryData: any[];
  alerts: any[];
  goalTracking: Record<number, boolean[]>;
  onUpdateGoalTracking: (year: number, monthIdx: number, achieved: boolean) => void;
  onNavigate?: (tab: string, value?: number) => void;
  totalGoal: number | null;
  onUpdateGoal: (value: number) => void;
}

export const Insights = ({ 
  transactions, 
  stats, 
  categoryData, 
  alerts, 
  goalTracking,
  onUpdateGoalTracking,
  onNavigate,
  totalGoal,
  onUpdateGoal
}: InsightsProps) => {
  const [simYears, setSimYears] = React.useState('1');
  const [showTracking, setShowTracking] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(totalGoal?.toString() || '');

  React.useEffect(() => {
    setInputValue(totalGoal?.toString() || '');
  }, [totalGoal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onUpdateGoal(num);
    } else if (val === '') {
      onUpdateGoal(0);
    }
  };

  // Calculate Monthly Saving needed to reach totalGoal
  const monthlySavingNeeded = React.useMemo(() => {
    if (!totalGoal) return 0;
    const totalMonths = (parseInt(simYears) || 1) * 12;
    return totalGoal / totalMonths;
  }, [totalGoal, simYears]);

  // Find highest expense category for a real insight
  const topExpense = React.useMemo(() => {
    if (categoryData.length === 0) return null;
    return [...categoryData].sort((a, b) => b.value - a.value)[0];
  }, [categoryData]);

  // Calculate Monthly Data for Comparison
  const monthlyComparison = React.useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const expenseGroups: Record<string, number> = {};
    const incomeGroups: Record<string, number> = {};
    
    // Past 4 months
    const currentMonthIndex = new Date().getMonth();
    const relevantMonths = [];
    for (let i = 3; i >= 0; i--) {
      const m = months[(currentMonthIndex - i + 12) % 12];
      relevantMonths.push(m);
      expenseGroups[m] = 0;
      incomeGroups[m] = 0;
    }

    transactions.forEach(t => {
      if (!t.date) return;
      const [y, m, d] = t.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const mName = months[date.getMonth()];
      if (expenseGroups[mName] !== undefined) {
        if (t.type === 'expense') {
          expenseGroups[mName] += parseFloat(t.amount);
        } else {
          incomeGroups[mName] += parseFloat(t.amount);
        }
      }
    });

    return relevantMonths.map(m => ({
      month: m,
      gastos: expenseGroups[m],
      receitas: incomeGroups[m]
    }));
  }, [transactions]);

  const calculateProjection = () => {
    const data = [];
    const monthly = monthlySavingNeeded;
    const totalMonths = (parseInt(simYears) || 1) * 12;
    let total = 0;

    for (let i = 0; i <= totalMonths; i++) {
      data.push({
        month: i === 0 ? 'Hoje' : `${i}m`,
        valor: Math.round(total),
      });
      total += monthly;
    }
    return data;
  };

  const projectionData = calculateProjection();
  const finalTotal = projectionData[projectionData.length - 1].valor;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#111827]">Insights Financeiros</h2>
          <p className="text-[#6B7280]">Análise inteligente baseada no seu comportamento de consumo.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold">
          <Sparkles className="w-4 h-4" />
          IA Ativada
        </div>
      </div>

      {/* Main Insight Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-100"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
            <Lightbulb className="w-8 h-8 text-yellow-300" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-1">Oportunidade de Economia</h3>
            {topExpense ? (
              <p className="text-emerald-50 text-sm leading-relaxed">
                Você poderia economizar <span className="font-bold text-white">R$ {(topExpense.value * 0.2).toLocaleString('pt-BR')}/mês</span> reduzindo gastos em <span className="font-bold text-white">{topExpense.name.toLowerCase()}</span> em 20%. 
                Esse valor investido renderia <span className="font-bold text-white">R$ {(topExpense.value * 0.2 * 12.8).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span> em um ano.
              </p>
            ) : (
              <p className="text-emerald-50 text-sm leading-relaxed">
                Adicione suas despesas para identificar oportunidades de economia personalizadas.
              </p>
            )}
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </motion.div>

      {/* Financial Health Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <HealthCard 
          title="Reserva de Emergência"
          status={stats.balance > 0 ? 'good' : 'warning'}
          message={stats.balance > 0 ? 'Você está no caminho certo para construir sua reserva.' : 'Tente reduzir gastos supérfluos para começar sua reserva.'}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <HealthCard 
          title="Diversificação"
          status={categoryData.length > 3 ? 'good' : 'info'}
          message={categoryData.length > 3 ? 'Seus gastos estão bem distribuídos.' : 'Você tem poucos registros de categorias diferentes.'}
          icon={<PieChartIcon className="w-5 h-5" />}
        />
        <HealthCard 
          title="Poder de Investimento"
          status={stats.percentSpent < 70 ? 'good' : 'warning'}
          message={stats.percentSpent < 70 ? 'Ótimo! Você tem margem para investir.' : 'Sua margem para investimentos está apertada.'}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        
        {/* Alerts & Insights Card moved here */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow flex flex-col min-h-[200px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">Alertas & Insights</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert, i) => (
                <div key={i} className={`p-3 rounded-xl border flex gap-3 ${
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <div className={`shrink-0 mt-0.5 ${alert.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {alert.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#111827] leading-tight">{alert.message}</p>
                    <p className="text-[10px] text-[#6B7280] leading-tight mt-1">{alert.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs font-medium">Tudo sob controle!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#111827]">Comparação Mensal</h3>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receitas</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Gastos</div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#000' }}
                itemStyle={{ color: '#000' }}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
              />
              <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-white p-8 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-[#111827]">Simulador de Metas</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#6B7280] mb-3">Minha meta total é</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <input 
                  type="number" 
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Ex: 10000"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xl font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#6B7280] mb-3">Período (anos)</label>
              <input 
                type="number" 
                value={simYears}
                onChange={(e) => setSimYears(e.target.value)}
                min="1"
                max="30"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xl font-bold"
              />
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col md:flex-row items-center justify-around p-8 bg-slate-50 rounded-[16px] border border-slate-100 gap-8">
            <div className="text-center">
              <p className="text-sm font-bold text-[#6B7280] mb-2 uppercase tracking-wider">
                Para isso, você deve economizar por mês
              </p>
              <h4 className="text-5xl font-black text-[#22C55E]">R$ {monthlySavingNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
              <p className="text-xs text-[#6B7280] mt-2 flex items-center justify-center gap-1">
                <Info className="w-3 h-3" /> Não está sendo considerado no cálculo juros mensais
              </p>
            </div>
            <div className="h-20 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Total a economizar</p>
                <p className="font-bold text-[#111827]">R$ {(totalGoal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => setShowTracking(!showTracking)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${
              showTracking 
                ? 'bg-slate-100 text-slate-600' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700'
            }`}
          >
            {showTracking ? (
              <>Ocultar Acompanhamento</>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Iniciar Acompanhamento de Metas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Goal Tracking Section */}
      <AnimatePresence>
        {showTracking && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-8 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#111827]">Acompanhamento de Metas</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#6B7280]">Marque os meses em que você atingiu sua meta de economia.</p>
                      {totalGoal && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Meta Total: R$ {totalGoal.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 px-2">Ano:</span>
                  <select 
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 cursor-pointer"
                    value={new Date().getFullYear()}
                    disabled
                  >
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  </select>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Progresso Anual</span>
                    {totalGoal && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        Acumulado: R$ {((goalTracking[new Date().getFullYear()]?.filter(Boolean).length || 0) * (totalGoal / 12)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} de R$ {totalGoal.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {Math.round(((goalTracking[new Date().getFullYear()]?.filter(Boolean).length || 0) / 12) * 100)}%
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((goalTracking[new Date().getFullYear()]?.filter(Boolean).length || 0) / 12) * 100}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                  {goalTracking[new Date().getFullYear()]?.filter(Boolean).length || 0} de 12 meses concluídos
                </p>
              </div>

              {/* Monthly Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month, idx) => {
                  const isAchieved = goalTracking[new Date().getFullYear()]?.[idx] || false;
                  return (
                    <button
                      key={idx}
                      onClick={() => onUpdateGoalTracking(new Date().getFullYear(), idx, !isAchieved)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                        isAchieved 
                          ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100' 
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-400'
                      }`}
                    >
                      {isAchieved && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1 right-1"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isAchieved ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {month}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isAchieved ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'
                      }`}>
                        <Target className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

const HealthCard = ({ title, status, message, icon }: any) => {
  const styles = {
    good: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  }[status as 'good' | 'warning' | 'info'];

  return (
    <div className={`p-6 rounded-[16px] border ${styles.bg} ${styles.border} card-shadow transition-colors duration-300`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${styles.bg} border ${styles.border}`}>
        <div className={styles.text}>{icon}</div>
      </div>
      <h4 className="font-bold text-[#111827] mb-1">{title}</h4>
      <p className="text-sm text-[#6B7280] leading-relaxed">{message}</p>
    </div>
  );
};
