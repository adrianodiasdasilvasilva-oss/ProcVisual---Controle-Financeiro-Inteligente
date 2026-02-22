import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  Target, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  AlertTriangle,
  Menu,
  X,
  Info
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { TransactionForm } from './TransactionForm';
import { Insights } from './Insights';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#f43f5e', '#8b5cf6', '#ec4899'];

interface Transaction {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string;
}

interface DashboardProps {
  onLogout: () => void;
  userName: string;
}

export const Dashboard = ({ onLogout, userName }: DashboardProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Dashboard');
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  const handleSaveTransaction = (data: Transaction) => {
    setTransactions(prev => [...prev, data]);
  };

  // Calculate Stats
  const stats = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach(t => {
      const val = parseFloat(t.amount) || 0;
      if (t.type === 'income') income += val;
      else expense += val;
    });

    const balance = income - expense;
    const percentSpent = income > 0 ? Math.round((expense / income) * 100) : 0;

    return { income, expense, balance, percentSpent };
  }, [transactions]);

  // Calculate Category Data for Pie Chart
  const categoryData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + parseFloat(t.amount);
    });

    return Object.entries(groups).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [transactions]);

  // Calculate Monthly Data for Line and Bar Charts
  const monthlyData = React.useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const groups: Record<string, { receita: number, despesa: number, saldo: number }> = {};
    
    // Initialize current and past 3 months if empty, or just show months with data
    const currentMonthIndex = new Date().getMonth();
    for (let i = 3; i >= 0; i--) {
      const m = months[(currentMonthIndex - i + 12) % 12];
      groups[m] = { receita: 0, despesa: 0, saldo: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.date);
      const m = months[date.getMonth()];
      const val = parseFloat(t.amount) || 0;
      
      if (!groups[m]) groups[m] = { receita: 0, despesa: 0, saldo: 0 };
      
      if (t.type === 'income') groups[m].receita += val;
      else groups[m].despesa += val;
      
      groups[m].saldo = groups[m].receita - groups[m].despesa;
    });

    return Object.entries(groups).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => {
      const indexA = months.indexOf(a.name);
      const indexB = months.indexOf(b.name);
      return indexA - indexB;
    });
  }, [transactions]);

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Receitas' },
    { icon: <TrendingDown className="w-5 h-5" />, label: 'Despesas' },
    { icon: <PieChartIcon className="w-5 h-5" />, label: 'Relatórios' },
    { icon: <Target className="w-5 h-5" />, label: 'Metas' },
    { icon: <Settings className="w-5 h-5" />, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            {isSidebarOpen && <span className="text-xl font-bold tracking-tight text-slate-900">ProcVisual</span>}
          </div>

          <div className="px-4 mb-6">
            <button 
              onClick={() => setIsTransactionFormOpen(true)}
              className={`w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 ${!isSidebarOpen && 'px-0'}`}
            >
              <TrendingUp className="w-5 h-5" />
              {isSidebarOpen && <span>Nova Transação</span>}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  activeTab === item.label 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Olá, {userName} 👋</h1>
                <p className="text-sm text-slate-500">Bem-vindo de volta ao seu controle financeiro.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsTransactionFormOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <TrendingUp className="w-4 h-4" />
                Nova Transação
              </button>
              <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="bg-transparent border-none outline-none text-sm w-40"
                />
              </div>
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">Saldo atual</p>
                  <p className="text-lg font-bold text-emerald-600">R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'Dashboard' ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Receita do mês" 
                  value={`R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend="+0%" 
                  trendUp={true} 
                  icon={<TrendingUp className="text-emerald-600" />} 
                  bgColor="bg-emerald-50"
                />
                <StatCard 
                  title="Despesas do mês" 
                  value={`R$ ${stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend="+0%" 
                  trendUp={false} 
                  icon={<TrendingDown className="text-red-600" />} 
                  bgColor="bg-red-50"
                />
                <StatCard 
                  title="Economia" 
                  value={`R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend="+0%" 
                  trendUp={true} 
                  icon={<Wallet className="text-blue-600" />} 
                  bgColor="bg-blue-50"
                />
                <StatCard 
                  title="Percentual gasto" 
                  value={`${stats.percentSpent}%`} 
                  trend="0%" 
                  trendUp={true} 
                  icon={<PieChartIcon className="text-amber-600" />} 
                  bgColor="bg-amber-50"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pie Chart */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Gastos por categoria</h3>
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
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-slate-600">{cat.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">R$ {cat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Line Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Evolução do saldo mensal</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="saldo" 
                          stroke="#10b981" 
                          strokeWidth={4} 
                          dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Receita vs despesas</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                        <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="despesa" name="Despesa" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alerts Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Alertas e Insights</h3>
                  <div className="space-y-4">
                    <AlertItem 
                      type="warning" 
                      message="Você gastou 30% em lazer" 
                      description="Isso está acima da sua meta de 20% para esta categoria."
                    />
                    <AlertItem 
                      type="info" 
                      message="Seus gastos aumentaram 15%" 
                      description="Comparado ao mesmo período do mês passado."
                    />
                    <AlertItem 
                      type="success" 
                      message="Meta de economia atingida!" 
                      description="Parabéns! Você guardou R$ 2.350 este mês."
                    />
                  </div>
                  <button className="w-full mt-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                    Ver todos os alertas
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'Relatórios' ? (
            <Insights />
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
              <Info className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Esta seção está em desenvolvimento.</p>
              <button 
                onClick={() => setActiveTab('Dashboard')}
                className="mt-4 text-emerald-600 font-bold hover:underline"
              >
                Voltar para o Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      <TransactionForm 
        isOpen={isTransactionFormOpen} 
        onClose={() => setIsTransactionFormOpen(false)} 
        onSave={handleSaveTransaction} 
      />

      {/* Mobile FAB */}
      <button 
        onClick={() => setIsTransactionFormOpen(true)}
        className="sm:hidden fixed bottom-8 right-8 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all"
      >
        <TrendingUp className="w-6 h-6" />
      </button>
    </div>
  );
};

const StatCard = ({ title, value, trend, trendUp, icon, bgColor }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${bgColor}`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
  </motion.div>
);

const AlertItem = ({ type, message, description }: any) => {
  const styles = {
    warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: <AlertTriangle className="text-amber-600" /> },
    info: { bg: 'bg-blue-50', border: 'border-blue-100', icon: <Bell className="text-blue-600" /> },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <Target className="text-emerald-600" /> },
  }[type as 'warning' | 'info' | 'success'];

  return (
    <div className={`p-4 rounded-2xl border ${styles.bg} ${styles.border} flex gap-4`}>
      <div className="shrink-0 mt-1">{styles.icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-900">{message}</p>
        <p className="text-xs text-slate-600 mt-1">{description}</p>
      </div>
    </div>
  );
};
