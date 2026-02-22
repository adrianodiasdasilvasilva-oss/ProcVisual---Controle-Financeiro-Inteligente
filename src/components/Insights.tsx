import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Target, 
  Sparkles,
  DollarSign,
  Info
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
import { motion } from 'motion/react';

const categoryData = [
  { name: 'Delivery', value: 650, color: '#f43f5e' },
  { name: 'Assinaturas', value: 150, color: '#8b5cf6' },
  { name: 'Mercado', value: 1200, color: '#10b981' },
  { name: 'Transporte', value: 300, color: '#3b82f6' },
];

const monthlyComparison = [
  { month: 'Jan', gastos: 2100, media: 2300 },
  { month: 'Fev', gastos: 2400, media: 2300 },
  { month: 'Mar', gastos: 2200, media: 2300 },
  { month: 'Abr', gastos: 2650, media: 2300 },
];

export const Insights = () => {
  const [monthlySaving, setMonthlySaving] = React.useState('500');
  const [interestRate, setInterestRate] = React.useState('10'); // 10% ao ano

  const calculateProjection = () => {
    const data = [];
    const monthly = parseFloat(monthlySaving) || 0;
    const rate = (parseFloat(interestRate) || 0) / 100 / 12;
    let total = 0;

    for (let i = 0; i <= 12; i++) {
      data.push({
        month: i === 0 ? 'Hoje' : `${i}m`,
        valor: Math.round(total),
      });
      total = (total + monthly) * (1 + rate);
    }
    return data;
  };

  const projectionData = calculateProjection();
  const oneYearTotal = projectionData[12].valor;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Insights Financeiros</h2>
          <p className="text-slate-500">Análise inteligente baseada no seu comportamento de consumo.</p>
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
        className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
            <Lightbulb className="w-12 h-12 text-yellow-300" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Oportunidade de Economia</h3>
            <p className="text-emerald-50 text-lg leading-relaxed">
              Você poderia economizar <span className="font-bold text-white">R$ 400,00/mês</span> reduzindo gastos em delivery. 
              Esse valor investido renderia <span className="font-bold text-white">R$ 5.120,00</span> em um ano.
            </p>
          </div>
          <button className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all shrink-0">
            Ver Detalhes
          </button>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Comparison */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Comparação Mensal</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Gastos</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Média</div>
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="gastos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="media" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Future Projection */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Projeção Futura</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Simulador de Metas</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Se eu economizar por mês</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <input 
                  type="number" 
                  value={monthlySaving}
                  onChange={(e) => setMonthlySaving(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xl font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Rendimento anual esperado (%)</label>
              <input 
                type="number" 
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xl font-bold"
              />
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col md:flex-row items-center justify-around p-8 bg-slate-50 rounded-3xl border border-slate-100 gap-8">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Em 1 ano você terá</p>
              <h4 className="text-5xl font-black text-emerald-600">R$ {oneYearTotal.toLocaleString('pt-BR')}</h4>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                <Info className="w-3 h-3" /> Cálculo baseado em juros compostos mensais
              </p>
            </div>
            <div className="h-20 w-px bg-slate-200 hidden md:block"></div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rendimento total</p>
                  <p className="font-bold text-slate-900">R$ {(oneYearTotal - (parseFloat(monthlySaving) * 12)).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                Começar a poupar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
