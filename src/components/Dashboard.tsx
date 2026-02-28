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
  Info,
  Calendar,
  Trash2
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
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  doc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TransactionForm } from './TransactionForm';
import { Insights } from './Insights';
import { IncomeView } from './IncomeView';
import { ExpenseView } from './ExpenseView';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#f43f5e', '#8b5cf6', '#ec4899'];

interface Transaction {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string;
  installments?: string;
}

interface DashboardProps {
  onLogout: () => void;
  userName: string;
  userEmail: string;
}

export const Dashboard = ({ onLogout, userName, userEmail }: DashboardProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Dashboard');
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  const [isCustomYear, setIsCustomYear] = React.useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [dismissedAlerts, setDismissedAlerts] = React.useState<string[]>([]);
  const [isWelcomeVisible, setIsWelcomeVisible] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [monthlyGoal, setMonthlyGoal] = React.useState<number | null>(null);

  // Fetch transactions on mount
  React.useEffect(() => {
    if (!userEmail) return;

    setIsLoading(true);
    const q = query(collection(db, 'transactions'), where('userEmail', '==', userEmail));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTransactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        fetchedTransactions.push({ id: doc.id, ...doc.data() } as any);
      });
      setTransactions(fetchedTransactions);
      setIsLoading(false);
    }, (error) => {
      console.error('Firestore fetch error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleSaveTransaction = async (data: any) => {
    const numInstallments = parseInt(data.installments) || 1;
    const newTransactionsToSave: any[] = [];
    
    if (numInstallments <= 1) {
      newTransactionsToSave.push({ ...data, userEmail });
    } else {
      const [year, month, day] = data.date.split('-').map(Number);
      const fullAmount = parseFloat(data.amount) || 0;

      for (let i = 0; i < numInstallments; i++) {
        const d = new Date(year, month - 1 + i, day);
        const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        newTransactionsToSave.push({
          ...data,
          userEmail,
          amount: fullAmount.toString(),
          date: formattedDate,
          description: `${data.description} (${i + 1}/${numInstallments})`
        });
      }
    }

    // Save to Firestore
    try {
      const batch = writeBatch(db);
      newTransactionsToSave.forEach(t => {
        const newDocRef = doc(collection(db, 'transactions'));
        batch.set(newDocRef, t);
      });
      await batch.commit();
    } catch (error) {
      console.error('Failed to save transaction to Firestore:', error);
      alert('Erro ao salvar transação no banco de dados.');
    }
  };

  const handleResetAccount = async () => {
    if (!window.confirm('ATENÇÃO: Isso excluirá TODOS os seus lançamentos e dados de perfil permanentemente. Deseja continuar?')) return;
    
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Delete all transactions
      transactions.forEach(t => {
        if ((t as any).id) {
          batch.delete(doc(db, 'transactions', (t as any).id));
        }
      });
      
      // Reset user profile access (optional, but requested to "clear registrations")
      const userDocRef = doc(db, 'users', auth.currentUser?.uid || '');
      batch.update(userDocRef, { hasLifetimeAccess: false });
      
      await batch.commit();
      alert('Dados excluídos com sucesso! Sua conta foi resetada.');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting account:', error);
      alert('Erro ao resetar conta.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteTransaction = async (transactionToDelete: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;

    try {
      if (transactionToDelete.id) {
        await deleteDoc(doc(db, 'transactions', transactionToDelete.id));
      } else {
        // Fallback for local-only items if any
        setTransactions(prev => prev.filter(t => t !== transactionToDelete));
      }
    } catch (error) {
      console.error('Failed to delete transaction from Firestore:', error);
      alert('Erro ao excluir transação.');
    }
  };

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      const monthMatch = selectedMonth === -1 || date.getMonth() === selectedMonth;
      const yearMatch = selectedYear === -1 || date.getFullYear() === selectedYear;
      
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        t.description.toLowerCase().includes(searchLower) || 
        t.category.toLowerCase().includes(searchLower) ||
        t.amount.includes(searchQuery);

      return monthMatch && yearMatch && searchMatch;
    });
  }, [transactions, selectedMonth, selectedYear, searchQuery]);

  // Calculate Stats
  const stats = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    
    filteredTransactions.forEach(t => {
      const val = parseFloat(t.amount) || 0;
      if (t.type === 'income') income += val;
      else expense += val;
    });

    const balance = income - expense;
    const percentSpent = income > 0 ? Math.round((expense / income) * 100) : 0;

    return { income, expense, balance, percentSpent };
  }, [filteredTransactions]);

  // Calculate Category Data for Pie Chart
  const categoryData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + parseFloat(t.amount);
    });

    return Object.entries(groups).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [filteredTransactions]);

  // Calculate Chart Data (Daily or Monthly depending on filter)
  const chartData = React.useMemo(() => {
    if (selectedMonth !== -1) {
      // Daily evolution for selected month
      const year = selectedYear === -1 ? new Date().getFullYear() : selectedYear;
      const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
      const data = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        data.push({
          name: `${i}`,
          receita: 0,
          despesa: 0,
          saldo: 0
        });
      }

      filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        const day = date.getDate();
        const val = parseFloat(t.amount) || 0;
        
        if (data[day - 1]) {
          if (t.type === 'income') data[day - 1].receita += val;
          else data[day - 1].despesa += val;
        }
      });

      let cumulativeSaldo = 0;
      return data.map(d => {
        cumulativeSaldo += (d.receita - d.despesa);
        return { ...d, saldo: cumulativeSaldo };
      });
    } else {
      // Monthly evolution
      const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const data = shortMonths.map(m => ({ name: m, receita: 0, despesa: 0, saldo: 0 }));

      filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        const monthIndex = date.getMonth();
        const val = parseFloat(t.amount) || 0;
        
        if (t.type === 'income') data[monthIndex].receita += val;
        else data[monthIndex].despesa += val;
      });

      let cumulativeSaldo = 0;
      return data.map(d => {
        cumulativeSaldo += (d.receita - d.despesa);
        return { ...d, saldo: cumulativeSaldo };
      });
    }
  }, [filteredTransactions, selectedMonth, selectedYear]);

  // Calculate Annual Goal Stats
  const annualGoalStats = React.useMemo(() => {
    if (!monthlyGoal) return null;
    
    const year = selectedYear === -1 ? new Date().getFullYear() : selectedYear;
    const target = monthlyGoal * 12;
    let realized = 0;
    
    // We need to look at all transactions for the selected year
    const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === year);
    
    for (let m = 0; m < 12; m++) {
      const monthTransactions = yearTransactions.filter(t => new Date(t.date).getMonth() === m);
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
      
      const balance = income - expense;
      // Cap contribution at monthlyGoal as per user request
      realized += Math.min(Math.max(0, balance), monthlyGoal);
    }
    
    return {
      realized,
      target,
      percent: Math.min(100, Math.round((realized / target) * 100))
    };
  }, [transactions, monthlyGoal, selectedYear]);

  const alerts = React.useMemo(() => {
    const list: any[] = [];
    
    if (transactions.length === 0) {
      list.push({
        type: 'info',
        message: 'Bem-vindo!',
        description: 'Comece adicionando sua primeira transação para ver insights reais.'
      });
      return list;
    }

    // Alert: High spending in a category
    categoryData.forEach(cat => {
      const percentage = stats.expense > 0 ? (cat.value / stats.expense) * 100 : 0;
      if (percentage > 40) {
        list.push({
          type: 'warning',
          message: `Gasto alto em ${cat.name}`,
          description: `Esta categoria representa ${Math.round(percentage)}% das suas despesas totais.`
        });
      }
    });

    // Alert: Savings goal
    if (stats.balance > 0) {
      list.push({
        type: 'success',
        message: 'Saldo positivo!',
        description: `Você economizou R$ ${stats.balance.toLocaleString('pt-BR')} até agora.`
      });
    } else if (stats.balance < 0) {
      list.push({
        type: 'warning',
        message: 'Atenção ao saldo',
        description: 'Suas despesas superaram suas receitas este mês.'
      });
    }

    // Alert: General Insight
    if (stats.percentSpent > 80) {
      list.push({
        type: 'warning',
        message: 'Limite de gastos próximo',
        description: `Você já gastou ${stats.percentSpent}% da sua receita total.`
      });
    }

    return list.filter(a => !dismissedAlerts.includes(a.message)).slice(0, 3); // Show top 3 non-dismissed alerts
  }, [transactions, stats, categoryData, dismissedAlerts]);

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Receitas' },
    { icon: <TrendingDown className="w-5 h-5" />, label: 'Despesas' },
    { icon: <PieChartIcon className="w-5 h-5" />, label: 'Análises' },
    { icon: <Settings className="w-5 h-5" />, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src="https://i.imgur.com/mPPZOMY.jpeg" 
                alt="ProcVisual Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {isSidebarOpen && <span className="text-xl font-bold tracking-tight text-slate-900">ProcVisual</span>}
          </div>

          <div className="px-4 mb-6">
            <button 
              onClick={() => setIsTransactionFormOpen(true)}
              className={`w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 ${!isSidebarOpen && 'px-0'}`}
            >
              <TrendingUp className="w-5 h-5" />
              {isSidebarOpen && <span>Novo Lançamento</span>}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  activeTab === item.label 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`${activeTab === item.label ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`}>
                  {item.icon}
                </div>
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
              <div className="flex flex-col py-1">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{userName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsTransactionFormOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] active:scale-95"
              >
                <TrendingUp className="w-5 h-5" />
                Novo Lançamento
              </button>
              <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all border border-transparent focus-within:border-emerald-100">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar lançamentos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-40"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all ${isNotificationsOpen ? 'bg-slate-100 text-emerald-600' : ''}`}
                >
                  <Bell className="w-5 h-5" />
                  {alerts.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Notificações</h3>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {alerts.length} novas
                        </span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                        {alerts.length > 0 ? (
                          alerts.map((alert, i) => (
                            <div 
                              key={i} 
                              className="p-3 rounded-xl hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer group"
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                alert.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                                alert.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {alert.type === 'success' ? <Target className="w-5 h-5" /> : 
                                 alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{alert.message}</p>
                                <p className="text-xs text-slate-500 leading-tight mt-0.5">{alert.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center">
                            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Nenhuma notificação por aqui.</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button 
                          onClick={() => {
                            const allAlertMessages = alerts.map(a => a.message);
                            setDismissedAlerts(prev => [...new Set([...prev, ...allAlertMessages])]);
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                          Marcar todas como lidas
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">Saldo atual</p>
                  <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Carregando seus dados...</p>
            </div>
          ) : activeTab === 'Dashboard' ? (
            <>
              {/* Month & Year Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
                  {isWelcomeVisible && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="hidden lg:flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl shadow-sm relative group"
                    >
                      <span className="text-xl">👋</span>
                      <p className="text-xs text-slate-600 font-medium leading-tight max-w-[180px]">
                        {transactions.length > 0 
                          ? 'Bem-vindo de volta ao seu controle financeiro.' 
                          : 'Vamos começar a organizar suas finanças?'}
                      </p>
                      <button 
                        onClick={() => setIsWelcomeVisible(false)}
                        className="p-1 text-emerald-300 hover:text-emerald-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* Tooltip arrow */}
                      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-50 border-l border-b border-emerald-100 rotate-45 hidden md:block"></div>
                    </motion.div>
                  )}

                  {monthlyGoal && annualGoalStats && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-4 px-5 py-3 rounded-3xl border shadow-lg relative group ${
                        annualGoalStats.percent < 60 ? 'bg-red-50 border-red-100' : 
                        annualGoalStats.percent < 90 ? 'bg-amber-50 border-amber-100' : 
                        'bg-emerald-50 border-emerald-100'
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <svg className="w-14 h-14 transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-slate-200/30"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={150.8}
                            strokeDashoffset={150.8 - (Math.min(annualGoalStats.realized / annualGoalStats.target, 1) * 150.8)}
                            className={`transition-all duration-1000 ease-out ${
                              annualGoalStats.percent < 60 ? 'text-red-500' : 
                              annualGoalStats.percent < 90 ? 'text-amber-500' : 
                              'text-emerald-500'
                            }`}
                          />
                        </svg>
                        <span className={`absolute text-[10px] font-black ${
                          annualGoalStats.percent < 60 ? 'text-red-700' : 
                          annualGoalStats.percent < 90 ? 'text-amber-700' : 
                          'text-emerald-700'
                        }`}>
                          {annualGoalStats.percent}%
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Target className={`w-3 h-3 ${
                            annualGoalStats.percent < 60 ? 'text-red-600' : 
                            annualGoalStats.percent < 90 ? 'text-amber-600' : 
                            'text-emerald-600'
                          }`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Meta Anual</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 leading-none mt-1">
                          R$ {annualGoalStats.target.toLocaleString('pt-BR')}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] font-medium opacity-60">Acumulado:</span>
                          <span className="text-[10px] font-bold text-slate-700">R$ {annualGoalStats.realized.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setMonthlyGoal(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-400 ml-2" />
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 pr-4 py-1 cursor-pointer"
                    >
                      <option value="-1">Todos os meses</option>
                      {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    {isCustomYear ? (
                      <div className="flex items-center">
                        <input 
                          type="number"
                          value={selectedYear === -1 ? new Date().getFullYear() : selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 px-4 py-1 w-20"
                          autoFocus
                          onBlur={() => setIsCustomYear(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsCustomYear(false);
                          }}
                        />
                        <button 
                          onClick={() => setIsCustomYear(false)}
                          className="pr-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <select 
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 px-4 py-1 cursor-pointer"
                        >
                          <option value="-1">Todos os anos</option>
                          {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                          {selectedYear !== -1 && !years.includes(selectedYear) && (
                            <option value={selectedYear}>{selectedYear}</option>
                          )}
                        </select>
                        <button 
                          onClick={() => setIsCustomYear(true)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Personalizar ano"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                  trendUp={stats.balance >= 0} 
                  icon={<Wallet className="text-blue-600" />} 
                  bgColor="bg-blue-50"
                  valueColor={stats.balance >= 0 ? 'text-slate-900' : 'text-red-600'}
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
                  <h3 className="text-lg font-bold text-slate-900 mb-6">
                    Evolução do saldo {selectedMonth !== -1 ? `em ${months[selectedMonth]}` : 'Anual'}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
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
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">
                    Receita vs despesas {selectedMonth !== -1 ? `em ${months[selectedMonth]}` : 'Anual'}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                        <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} />
                        <Bar dataKey="despesa" name="Despesa" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alerts Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Alertas e Insights</h3>
                  <div className="space-y-4">
                    {alerts.map((alert, i) => (
                      <AlertItem 
                        key={i}
                        type={alert.type} 
                        message={alert.message} 
                        description={alert.description}
                      />
                    ))}
                  </div>
                  <button className="w-full mt-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                    Ver todos os alertas
                  </button>
                </div>

                {/* Recent Transactions Section */}
                <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Lançamentos Recentes</h3>
                    <button className="text-sm font-bold text-emerald-600 hover:underline">Ver todos</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <th className="pb-4 px-4">Data</th>
                          <th className="pb-4 px-4">Descrição</th>
                          <th className="pb-4 px-4">Categoria</th>
                          <th className="pb-4 px-4 text-right">Valor</th>
                          <th className="pb-4 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.slice(0, 5).map((t, i) => (
                            <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4 text-sm text-slate-500">
                                {new Date(t.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-bold text-slate-900">{t.description}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                  {t.category}
                                </span>
                              </td>
                              <td className={`py-4 px-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'} R$ {parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button 
                                  onClick={() => handleDeleteTransaction(t)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir lançamento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 text-sm italic">
                              Nenhum lançamento encontrado para este período.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'Receitas' ? (
            <IncomeView 
              transactions={transactions} 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear} 
              onDelete={handleDeleteTransaction}
            />
          ) : activeTab === 'Despesas' ? (
            <ExpenseView 
              transactions={transactions} 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear} 
              onDelete={handleDeleteTransaction}
            />
          ) : activeTab === 'Análises' ? (
            <Insights 
              transactions={transactions} 
              stats={stats} 
              categoryData={categoryData} 
              onNavigate={(tab, value) => {
                setActiveTab(tab);
                if (tab === 'Dashboard' && value !== undefined) {
                  setMonthlyGoal(value);
                }
              }}
            />
          ) : activeTab === 'Configurações' ? (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-emerald-600" />
                  Configurações da Conta
                </h2>
                
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2">Perfil</h3>
                    <p className="text-sm text-slate-500 mb-4">Informações da sua conta conectada.</p>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Nome:</strong> {userName}</p>
                      <p className="text-sm"><strong>Email:</strong> {userEmail}</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
                    <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Zona de Perigo
                    </h3>
                    <p className="text-sm text-red-600 mb-6">
                      Use estas opções para limpar seus dados de teste. Isso não excluirá sua conta do Firebase Auth, apenas os dados no banco de dados.
                    </p>
                    
                    <button 
                      onClick={handleResetAccount}
                      disabled={isLoading}
                      className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Limpando...' : 'Resetar Todos os Meus Dados'}
                    </button>
                    <p className="text-[10px] text-red-400 mt-4 text-center">
                      *Para excluir o email e permitir novo cadastro, você deve deletar o usuário manualmente no Console do Firebase.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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

const StatCard = ({ title, value, trend, trendUp, icon, bgColor, valueColor }: any) => (
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
    <h4 className={`text-2xl font-bold ${valueColor || 'text-slate-900'}`}>{value}</h4>
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
