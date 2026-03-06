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
  Trash2,
  Camera,
  Upload,
  CheckCircle2,
  LifeBuoy,
  Mail,
  CreditCard,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
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
import { PaymentControl } from './PaymentControl';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  doc,
  writeBatch,
  setDoc,
  updateDoc,
  getDoc,
  deleteField
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TransactionForm } from './TransactionForm';
import { Insights } from './Insights';
import { IncomeView } from './IncomeView';
import { ExpenseView } from './ExpenseView';
import { ImageCropper } from './ImageCropper';
import { FinancialHealthGauge } from './FinancialHealthGauge';
import { AnimatePresence } from 'motion/react';
import { sendWhatsAppMessage } from '../services/whapiService';
import { MessageSquare, Phone as PhoneIcon } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#f43f5e', '#8b5cf6', '#ec4899'];

const parseDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  return new Date(y, m - 1, d);
};

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string;
  installments?: string;
  notified5DaysBefore?: boolean;
  notifiedOnDueDate?: boolean;
  paid?: boolean;
  createdAt?: string;
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
  const [selectedMonths, setSelectedMonths] = React.useState<number[]>([new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  const [isCustomYear, setIsCustomYear] = React.useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = React.useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [dismissedAlerts, setDismissedAlerts] = React.useState<string[]>([]);
  const [isWelcomeVisible, setIsWelcomeVisible] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [monthlyGoal, setMonthlyGoal] = React.useState<number | null>(null);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [customCategories, setCustomCategories] = React.useState<{income: string[], expense: string[]}>({ income: [], expense: [] });
  const [selectedTransactions, setSelectedTransactions] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'paid' | 'pending'>('all');
  const [userPhone, setUserPhone] = React.useState('');
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = React.useState(false);
  const processingNotificationsRef = React.useRef<Set<string>>(new Set());
  const isProcessingNotificationsRef = React.useRef(false);

  // Fetch user profile data (including image, custom categories, and phone)
  React.useEffect(() => {
    if (!auth.currentUser) return;
    
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfileImage(data.profileImage || null);
        setCustomCategories(data.customCategories || { income: [], expense: [] });
        setUserPhone(data.phone || '');
        setNotificationsEnabled(data.notificationsEnabled !== false);
        setMonthlyGoal(data.monthlyGoal || null);
        if (data.welcomeDismissed) {
          setIsWelcomeVisible(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAndSendNotifications = React.useCallback(async (currentTransactions: Transaction[], phone: string, enabled: boolean, goal: number | null) => {
    if (!enabled || !phone || currentTransactions.length === 0 || isProcessingNotificationsRef.current) return;

    isProcessingNotificationsRef.current = true;
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      today.setHours(0, 0, 0, 0);

      // Calculate current month stats for the message
      let totalGastoMes = 0;
      let totalReceitaMes = 0;
      
      currentTransactions.forEach(t => {
        if (!t.date) return;
        // Robust date parsing to avoid timezone shifts (YYYY-MM-DD)
        const parts = t.date.split('-');
        if (parts.length !== 3) return;
        
        const [y, m, d] = parts.map(Number);
        const tDate = new Date(y, m - 1, d);
        
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          const amount = parseFloat(t.amount) || 0;
          if (t.type === 'expense') {
            totalGastoMes += amount;
          } else {
            totalReceitaMes += amount;
          }
        }
      });

      const economia = totalReceitaMes - totalGastoMes;
      const goalValue = goal || totalReceitaMes || 0;
      const percentUtilizado = goalValue > 0 ? Math.round((totalGastoMes / goalValue) * 100) : 0;

      for (const t of currentTransactions) {
        // Only notify for unpaid expenses
        if (t.type !== 'expense' || !t.id || !t.date || t.paid) continue;

        // Skip notifications if the expense was created today or later (to avoid immediate alerts for newly launched items)
        if (t.createdAt) {
          const createdDate = new Date(t.createdAt);
          createdDate.setHours(0, 0, 0, 0);
          if (createdDate.getTime() >= today.getTime()) {
            continue;
          }
        }

        const parts = t.date.split('-');
        if (parts.length !== 3) continue;
        
        const [year, month, day] = parts.map(Number);
        const dueDate = new Date(year, month - 1, day);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const fiveDayKey = `${t.id}_5days`;
        const dueDayKey = `${t.id}_due`;

        const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formatDate = (date: Date) => date.toLocaleDateString('pt-BR');

        const buildMessage = (title: string) => `
${title} 

━━━━━━━━━━━━━━━

📂 Categoria: ${t.category}
🧾 Descrição: ${t.description}
💰 Valor: ${formatCurrency(parseFloat(t.amount))}

📅 Data: ${formatDate(dueDate)}

━━━━━━━━━━━━━━━

📊 Resumo do mês:
• Total gasto: ${formatCurrency(totalGastoMes)}
• Restante do orçamento: ${formatCurrency(economia)}

⚠️ Atenção: Você já utilizou ${percentUtilizado}% do seu limite mensal.

━━━━━━━━━━━━━━━

🔗 *ProcVisual*
Acesse seu dashboard: \u200B${window.location.origin}

Seu controle financeiro inteligente`.trim();

        // 5 days before (or less, but more than 0)
        if (diffDays <= 5 && diffDays > 0 && !t.notified5DaysBefore && !processingNotificationsRef.current.has(fiveDayKey)) {
          processingNotificationsRef.current.add(fiveDayKey);
          
          // Double check with a fresh fetch to be absolutely sure
          try {
            const freshDoc = await getDoc(doc(db, 'transactions', t.id));
            if (freshDoc.exists() && freshDoc.data().notified5DaysBefore) {
              continue; 
            }
          } catch (e) {
            console.error("Error double checking notification status:", e);
          }

          const message = buildMessage('💸 Alerta de vencimento próximo');
          const res = await sendWhatsAppMessage(phone, message);
          if (res.success) {
            // Update immediately to prevent duplicate if app closes or re-runs
            await updateDoc(doc(db, 'transactions', t.id), { notified5DaysBefore: true });
          } else {
            processingNotificationsRef.current.delete(fiveDayKey);
          }
        }

        // On due date
        if (diffDays === 0 && !t.notifiedOnDueDate && !processingNotificationsRef.current.has(dueDayKey)) {
          processingNotificationsRef.current.add(dueDayKey);

          // Double check with a fresh fetch
          try {
            const freshDoc = await getDoc(doc(db, 'transactions', t.id));
            if (freshDoc.exists() && freshDoc.data().notifiedOnDueDate) {
              continue; 
            }
          } catch (e) {
            console.error("Error double checking notification status:", e);
          }

          const message = buildMessage('🚨 Alerta de vencimento HOJE');
          const res = await sendWhatsAppMessage(phone, message);
          if (res.success) {
            // Update immediately
            await updateDoc(doc(db, 'transactions', t.id), { notifiedOnDueDate: true });
          } else {
            processingNotificationsRef.current.delete(dueDayKey);
          }
        }
      }
    } catch (error) {
      console.error('Error in notification cycle:', error);
    } finally {
      isProcessingNotificationsRef.current = false;
    }
  }, []);

  // Fetch transactions on mount
  React.useEffect(() => {
    if (!userEmail) return;

    setIsLoading(true);
    const q = query(collection(db, 'transactions'), where('userEmail', '==', userEmail));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const fetchedTransactions: Transaction[] = [];
        snapshot.forEach((doc) => {
          fetchedTransactions.push({ id: doc.id, ...doc.data() } as any);
        });
        setTransactions(fetchedTransactions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing transactions snapshot:', error);
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Firestore fetch error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userEmail]);

  // Separate effect for notifications to avoid blocking UI updates
  React.useEffect(() => {
    if (userPhone && transactions.length > 0) {
      checkAndSendNotifications(transactions, userPhone, notificationsEnabled, monthlyGoal);
    }
  }, [transactions, userPhone, notificationsEnabled, monthlyGoal, checkAndSendNotifications]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleSaveTransaction = async (data: any) => {
    const numInstallments = parseInt(data.installments) || 1;
    const newTransactionsToSave: any[] = [];
    
    // Check if this is a new custom category and save it to user profile
    if (auth.currentUser) {
      const type = data.type as 'income' | 'expense';
      const currentCustom = customCategories[type] || [];
      const defaultCategories = type === 'income' 
        ? ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros']
        : ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];
      
      if (!defaultCategories.includes(data.category) && !currentCustom.includes(data.category)) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const updatedCustom = [...currentCustom, data.category];
        await setDoc(userDocRef, { 
          customCategories: {
            ...customCategories,
            [type]: updatedCustom
          }
        }, { merge: true });
      }
    }

    if (numInstallments <= 1) {
      newTransactionsToSave.push({ 
        ...data, 
        userEmail,
        createdAt: new Date().toISOString()
      });
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
          description: `${data.description} (${i + 1}/${numInstallments})`,
          createdAt: new Date().toISOString()
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

  const handleDeleteCustomCategory = async (type: 'income' | 'expense', categoryToDelete: string) => {
    if (!auth.currentUser) return;
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${categoryToDelete}"?`)) return;

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const updatedCategories = {
        ...customCategories,
        [type]: (customCategories[type] || []).filter(cat => cat !== categoryToDelete)
      };
      
      await setDoc(userDocRef, { customCategories: updatedCategories }, { merge: true });
    } catch (error) {
      console.error('Error deleting custom category:', error);
      alert('Erro ao excluir categoria.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Validate file type and size (max 6MB)
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 6MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Clear the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    if (!auth.currentUser) return;
    
    setIsUploading(true);
    setImageToCrop(null);
    
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { profileImage: croppedImage }, { merge: true });
      setProfileImage(croppedImage);
    } catch (error) {
      console.error('Error saving cropped image:', error);
      alert('Erro ao salvar imagem ajustada.');
    } finally {
      setIsUploading(false);
    }
  };
  const handlePermanentDismissWelcome = async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { welcomeDismissed: true });
      setIsWelcomeVisible(false);
    } catch (error) {
      console.error('Error dismissing welcome permanently:', error);
    }
  };

  const handleDeleteGoal = async () => {
    if (!auth.currentUser) return;
    if (!window.confirm('Deseja remover esta meta definitivamente?')) return;

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { monthlyGoal: deleteField() });
      setMonthlyGoal(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Erro ao excluir meta.');
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

  const handleTogglePaid = async (transaction: Transaction) => {
    if (!transaction.id) return;
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), {
        paid: !transaction.paid
      });
    } catch (error) {
      console.error('Failed to toggle paid status:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedTransactions.length} lançamentos?`)) return;

    try {
      const batch = writeBatch(db);
      selectedTransactions.forEach(id => {
        batch.delete(doc(db, 'transactions', id));
      });
      await batch.commit();
      setSelectedTransactions([]);
    } catch (error) {
      console.error('Failed to delete transactions:', error);
      alert('Erro ao excluir lançamentos selecionados.');
    }
  };

  const toggleSelectAll = (ids: string[]) => {
    const allSelected = ids.length > 0 && ids.every(id => selectedTransactions.includes(id));
    if (allSelected) {
      setSelectedTransactions(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedTransactions(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const toggleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const allCategories = React.useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const date = parseDate(t.date);
      const monthMatch = selectedMonths.length === 0 || selectedMonths.includes(date.getMonth());
      const yearMatch = selectedYear === -1 || date.getFullYear() === selectedYear;
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(t.category);
      
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        (t.description || '').toLowerCase().includes(searchLower) || 
        (t.category || '').toLowerCase().includes(searchLower) ||
        (t.amount || '').includes(searchQuery);

      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'paid' && t.paid) || 
        (statusFilter === 'pending' && !t.paid);

      return monthMatch && yearMatch && categoryMatch && searchMatch && statusMatch;
    }).sort((a, b) => {
      const dateA = parseDate(a.date).getTime();
      const dateB = parseDate(b.date).getTime();
      return dateB - dateA;
    });
  }, [transactions, selectedMonths, selectedYear, selectedCategories, searchQuery, statusFilter]);

  // Calculate Stats
  const stats = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    let paidIncome = 0;
    let pendingIncome = 0;
    let paidExpense = 0;
    let pendingExpense = 0;
    
    filteredTransactions.forEach(t => {
      const val = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        income += val;
        if (t.paid) paidIncome += val;
        else pendingIncome += val;
      } else {
        expense += val;
        if (t.paid) paidExpense += val;
        else pendingExpense += val;
      }
    });

    const balance = income - expense;
    const percentSpent = income > 0 ? Math.round((expense / income) * 100) : 0;

    // Trend calculation (compared to previous month if single month selected)
    let incomeTrend = 0;
    let expenseTrend = 0;
    let balanceTrend = 0;
    let percentSpentTrend = 0;

    if (selectedMonths.length === 1 && selectedYear !== -1) {
      const currentMonth = selectedMonths[0];
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? selectedYear - 1 : selectedYear;

      let prevIncome = 0;
      let prevExpense = 0;

      transactions.forEach(t => {
        if (!t.date) return;
        const d = parseDate(t.date);
        if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
          const val = parseFloat(t.amount) || 0;
          if (t.type === 'income') prevIncome += val;
          else prevExpense += val;
        }
      });

      const prevBalance = prevIncome - prevExpense;
      const prevPercentSpent = prevIncome > 0 ? Math.round((prevExpense / prevIncome) * 100) : 0;

      incomeTrend = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
      expenseTrend = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;
      balanceTrend = prevBalance !== 0 ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100 : 0;
      percentSpentTrend = prevPercentSpent > 0 ? ((percentSpent - prevPercentSpent) / prevPercentSpent) * 100 : 0;
    }

    return { 
      income, 
      expense, 
      balance, 
      percentSpent,
      paidIncome,
      pendingIncome,
      paidExpense,
      pendingExpense,
      incomeTrend,
      expenseTrend,
      balanceTrend,
      percentSpentTrend
    };
  }, [filteredTransactions, transactions, selectedMonths, selectedYear]);

  // Calculate pending values by month for the status cards
  const pendingStatsByMonth = React.useMemo(() => {
    const incomeByMonth = Array(12).fill(0).map((_, i) => ({ name: months[i].substring(0, 3), pending: 0 }));
    const expenseByMonth = Array(12).fill(0).map((_, i) => ({ name: months[i].substring(0, 3), pending: 0 }));

    transactions.forEach(t => {
      if (!t.date || t.paid) return;
      const date = parseDate(t.date);
      if (date.getFullYear() !== selectedYear && selectedYear !== -1) return;
      
      const monthIdx = date.getMonth();
      const val = parseFloat(t.amount) || 0;
      
      if (t.type === 'income') {
        incomeByMonth[monthIdx].pending += val;
      } else {
        expenseByMonth[monthIdx].pending += val;
      }
    });

    return {
      income: incomeByMonth.filter(m => m.pending > 0),
      expense: expenseByMonth.filter(m => m.pending > 0)
    };
  }, [transactions, selectedYear, months]);

  // Calculate Category Data for Pie Charts
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

  const incomeCategoryData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'income').forEach(t => {
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
    if (selectedMonths.length === 1) {
      const selectedMonth = selectedMonths[0];
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
        const date = parseDate(t.date);
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
        const date = parseDate(t.date);
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
  }, [filteredTransactions, selectedMonths, selectedYear]);

  // Calculate Annual Goal Stats
  const annualGoalStats = React.useMemo(() => {
    if (!monthlyGoal) return null;
    
    const year = selectedYear === -1 ? new Date().getFullYear() : selectedYear;
    const target = monthlyGoal * 12;
    let realized = 0;
    
    // We need to look at all transactions for the selected year
    const yearTransactions = transactions.filter(t => parseDate(t.date).getFullYear() === year);
    
    for (let m = 0; m < 12; m++) {
      const monthTransactions = yearTransactions.filter(t => parseDate(t.date).getMonth() === m);
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
    { icon: <LifeBuoy className="w-5 h-5" />, label: 'Suporte' },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0F172A] border-r border-[#1E293B] transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
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
            {isSidebarOpen && <span className="text-xl font-bold tracking-tight text-[#F9FAFB]">ProcVisual</span>}
          </div>

          <div className="px-4 mb-6 space-y-3">
            <button 
              onClick={() => setIsTransactionFormOpen(true)}
              className={`w-full flex items-center justify-center gap-2 primary-button-gradient py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95 ${!isSidebarOpen && 'px-0'}`}
            >
              <TrendingUp className="w-5 h-5" />
              {isSidebarOpen && <span>Novo Lançamento</span>}
            </button>
            <button 
              onClick={() => setActiveTab('Atualizar Lançamentos')}
              className={`w-full flex items-center justify-center gap-2 secondary-button-gradient py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/10 active:scale-95 ${!isSidebarOpen && 'px-0'} ${activeTab === 'Atualizar Lançamentos' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0F172A]' : ''}`}
            >
              <CreditCard className="w-5 h-5" />
              {isSidebarOpen && <span>Atualizar Lançamentos</span>}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  activeTab === item.label 
                    ? 'bg-[#1F2937] text-[#F9FAFB] shadow-lg shadow-black/20' 
                    : 'text-[#9CA3AF] hover:bg-[#1E293B] hover:text-[#F9FAFB]'
                }`}
              >
                <div className={`${activeTab === item.label ? 'text-[#F9FAFB]' : 'text-[#9CA3AF] group-hover:text-[#F9FAFB]'} font-bold`}>
                  {item.icon}
                </div>
                {isSidebarOpen && <span className="font-bold">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-[#1E293B]">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-[#9CA3AF] hover:bg-red-900/20 hover:text-red-400 transition-all"
            >
              <LogOut className="w-5 h-5 font-bold" />
              {isSidebarOpen && <span className="font-bold">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 h-screen flex flex-col bg-[#F8FAFC] transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Topbar */}
        <header className="bg-white border-b border-[#E5E7EB] shrink-0">
          <div className="px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-[#6B7280] hover:bg-slate-100 rounded-lg"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex flex-col py-1">
                <h1 className="text-2xl font-bold text-[#111827] leading-tight">{userName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsTransactionFormOpen(true)}
                className="hidden sm:flex items-center gap-2 primary-button-gradient px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
              >
                <TrendingUp className="w-5 h-5" />
                Novo Lançamento
              </button>
              <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all border border-transparent focus-within:border-emerald-100">
                <Search className="w-4 h-4 text-[#6B7280]" />
                <input 
                  type="text" 
                  placeholder="Buscar lançamentos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-40 text-[#111827] placeholder:text-[#9CA3AF]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-[#6B7280]" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`relative p-2 text-[#6B7280] hover:bg-slate-100 rounded-full transition-all ${isNotificationsOpen ? 'bg-slate-100 text-emerald-600' : ''}`}
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
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-[#111827]">Notificações</h3>
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
                                <p className="text-sm font-bold text-[#111827] group-hover:text-emerald-600 transition-colors">{alert.message}</p>
                                <p className="text-xs text-[#6B7280] leading-tight mt-0.5">{alert.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center">
                            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Nenhuma notificação por aqui.</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 border-t border-[#E5E7EB] text-center">
                        <button 
                          onClick={() => {
                            const allAlertMessages = alerts.map(a => a.message);
                            setDismissedAlerts(prev => [...new Set([...prev, ...allAlertMessages])]);
                          }}
                          className="text-xs font-bold text-[#6B7280] hover:text-emerald-600 transition-colors"
                        >
                          Marcar todas como lidas
                        </button>
                      </div>
                    </div>
                  </>
                )}
                </div>
              </div>
              <div className="flex items-center gap-3 pl-6 border-l border-[#E5E7EB]">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-[#6B7280]">Saldo atual</p>
                  <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-[#E5E7EB]">
                  {profileImage ? (
                    <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold">
                      {userName.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Carregando seus dados...</p>
            </div>
          ) : activeTab === 'Dashboard' ? (
            <div className="h-full flex flex-col space-y-3 min-h-0">
              {/* Title Section */}
              <div className="text-center shrink-0">
                <h2 className="text-xl font-bold text-[#111827]">Painel Financeiro</h2>
              </div>

              {/* Filters Section */}
              <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
                <div className="relative">
                  <button 
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#E5E7EB] shadow-sm px-3 py-1.5 text-[11px] font-bold text-[#111827] hover:bg-slate-50 transition-all"
                  >
                    <PieChartIcon className="w-3 h-3 text-emerald-500" />
                    {selectedCategories.length === 0 ? 'Todas categorias' : 
                     selectedCategories.length === 1 ? selectedCategories[0] :
                     `${selectedCategories.length} categorias`}
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                      <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-[#E5E7EB] mb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#6B7280] uppercase">Filtrar Categorias</span>
                          <button 
                            onClick={() => {
                              if (selectedCategories.length === allCategories.length) setSelectedCategories([]);
                              else setSelectedCategories([...allCategories]);
                            }}
                            className="text-[9px] font-bold text-emerald-600 hover:underline"
                          >
                            {selectedCategories.length === allCategories.length ? 'Limpar' : 'Todas'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto p-1">
                          {allCategories.length > 0 ? (
                            allCategories.map((cat, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSelectedCategories(prev => 
                                    prev.includes(cat) 
                                      ? prev.filter(c => c !== cat) 
                                      : [...prev, cat].sort()
                                  );
                                }}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all text-left ${
                                  selectedCategories.includes(cat) 
                                    ? 'bg-emerald-50 text-emerald-600 font-bold' 
                                    : 'text-[#6B7280] hover:bg-slate-50'
                                }`}
                              >
                                <span className="truncate">{cat}</span>
                                {selectedCategories.includes(cat) && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-[10px] text-[#6B7280] italic">
                              Nenhuma categoria encontrada
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#E5E7EB] shadow-sm">
                  {isCustomYear ? (
                    <div className="flex items-center">
                      <input 
                        type="number"
                        value={selectedYear === -1 ? new Date().getFullYear() : selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-transparent border-none outline-none text-[11px] font-bold text-[#111827] px-2 py-0.5 w-16"
                        autoFocus
                        onBlur={() => setIsCustomYear(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsCustomYear(false);
                        }}
                      />
                      <button 
                        onClick={() => setIsCustomYear(false)}
                        className="pr-1 text-[#6B7280] hover:text-[#111827]"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-transparent border-none outline-none text-[11px] font-bold text-[#111827] px-3 py-0.5 cursor-pointer"
                      >
                        <option value="-1">Todos os anos</option>
                        {years.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setIsCustomYear(true)}
                        className="p-1 text-[#6B7280] hover:text-emerald-600 transition-colors"
                      >
                        <Calendar className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#E5E7EB] shadow-sm px-3 py-1.5 text-[11px] font-bold text-[#111827] hover:bg-slate-50 transition-all"
                  >
                    <Calendar className="w-3 h-3 text-[#6B7280]" />
                    {selectedMonths.length === 0 ? 'Todos os meses' : 
                     selectedMonths.length === 12 ? 'Todos os meses' :
                     selectedMonths.length === 1 ? months[selectedMonths[0]] :
                     `${selectedMonths.length} meses`}
                  </button>
                  
                  {isMonthDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMonthDropdownOpen(false)}></div>
                      <div className="absolute left-0 mt-1 w-48 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-[#E5E7EB] mb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#6B7280] uppercase">Selecionar Meses</span>
                          <button 
                            onClick={() => {
                              if (selectedMonths.length === 12) setSelectedMonths([]);
                              else setSelectedMonths(Array.from({ length: 12 }, (_, i) => i));
                            }}
                            className="text-[9px] font-bold text-emerald-600 hover:underline"
                          >
                            {selectedMonths.length === 12 ? 'Limpar' : 'Todos'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto p-1">
                          {months.map((month, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedMonths(prev => 
                                  prev.includes(index) 
                                    ? prev.filter(m => m !== index) 
                                    : [...prev, index].sort((a, b) => a - b)
                                );
                              }}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${
                                selectedMonths.includes(index) 
                                  ? 'bg-emerald-50 text-emerald-600 font-bold' 
                                  : 'text-[#6B7280] hover:bg-slate-50'
                              }`}
                            >
                              {month}
                              {selectedMonths.includes(index) && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] px-3 py-1 rounded-xl shadow-sm">
                  <span className={`text-[10px] font-bold transition-colors ${statusFilter === 'all' ? 'text-[#111827]' : 'text-[#6B7280]'}`}>Todos</span>
                  <button
                    onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                      statusFilter === 'paid' ? 'bg-[#22C55E]' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                        statusFilter === 'paid' ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-[10px] font-bold transition-colors ${statusFilter === 'paid' ? 'text-[#111827]' : 'text-[#6B7280]'}`}>Pagos</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-5 gap-3 shrink-0">
                <div className="col-span-1">
                  <FinancialHealthGauge income={stats.income} expense={stats.expense} compact />
                </div>
                <StatCard 
                  title="Receita" 
                  value={`R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  icon={<TrendingUp className="text-emerald-600 w-3.5 h-3.5" />} 
                  bgColor="bg-emerald-50"
                  valueColor="text-emerald-600"
                  compact
                />
                <StatCard 
                  title="Despesa" 
                  value={`R$ ${stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  icon={<TrendingDown className="text-red-600 w-3.5 h-3.5" />} 
                  bgColor="bg-red-50"
                  valueColor="text-red-600"
                  compact
                />
                <StatCard 
                  title="Economia" 
                  value={`R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  icon={<Wallet className="text-blue-600 w-3.5 h-3.5" />} 
                  bgColor="bg-blue-50"
                  valueColor={stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  compact
                />
                <StatCard 
                  title="% Gasto" 
                  value={`${stats.percentSpent}%`} 
                  icon={<PieChartIcon className="text-amber-600 w-3.5 h-3.5" />} 
                  bgColor="bg-amber-50"
                  compact
                />
              </div>

              {/* Middle Row: Charts & Alerts */}
              <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
                {/* Income Pie Chart */}
                <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] card-shadow flex flex-col min-h-0">
                  <h3 className="text-[11px] font-bold text-[#111827] mb-1">Receitas por categoria</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeCategoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="75%"
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {incomeCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                          contentStyle={{ fontSize: '9px', padding: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 space-y-0.5 overflow-y-auto max-h-20 scrollbar-hide">
                    {incomeCategoryData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-[9px]">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-slate-600 truncate max-w-[70px]">{cat.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">R$ {cat.value.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Pie Chart */}
                <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] card-shadow flex flex-col min-h-0">
                  <h3 className="text-[11px] font-bold text-[#111827] mb-1">Gastos por categoria</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="75%"
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                          contentStyle={{ fontSize: '9px', padding: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 space-y-0.5 overflow-y-auto max-h-20 scrollbar-hide">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-[9px]">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-slate-600 truncate max-w-[70px]">{cat.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">R$ {cat.value.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts Section */}
                <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] card-shadow flex flex-col min-h-0">
                  <h3 className="text-[11px] font-bold text-[#111827] mb-1">Alertas & Insights</h3>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
                    {alerts.map((alert, i) => (
                      <div key={i} className={`p-1.5 rounded-xl border flex gap-1.5 ${
                        alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                      }`}>
                        <div className={`shrink-0 mt-0.5 ${alert.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {alert.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-[#111827] leading-tight">{alert.message}</p>
                          <p className="text-[8px] text-[#6B7280] leading-tight mt-0.5">{alert.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Bar Chart */}
              <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] card-shadow shrink-0 h-36">
                <h3 className="text-[11px] font-bold text-[#111827] mb-1">
                  Receita vs despesas {selectedMonths.length === 1 ? `em ${months[selectedMonths[0]]}` : 'Anual'}
                </h3>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 7 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 7 }} />
                      <Tooltip contentStyle={{ fontSize: '9px', padding: '4px' }} />
                      <Bar dataKey="receita" fill="#22C55E" radius={[2, 2, 0, 0]} barSize={6} />
                      <Bar dataKey="despesa" fill="#EF4444" radius={[2, 2, 0, 0]} barSize={6} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : activeTab === 'Atualizar Lançamentos' ? (
            <PaymentControl 
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
              onTogglePaid={handleTogglePaid}
              onBulkDelete={handleBulkDelete}
              selectedTransactions={selectedTransactions}
              toggleSelectTransaction={toggleSelectTransaction}
              toggleSelectAll={toggleSelectAll}
            />
          ) : activeTab === 'Receitas' ? (
            <IncomeView 
              transactions={transactions} 
              selectedMonths={selectedMonths} 
              selectedYear={selectedYear} 
              statusFilter={statusFilter}
              onDelete={handleDeleteTransaction}
              onTogglePaid={handleTogglePaid}
            />
          ) : activeTab === 'Despesas' ? (
            <ExpenseView 
              transactions={transactions} 
              selectedMonths={selectedMonths} 
              selectedYear={selectedYear} 
              statusFilter={statusFilter}
              onDelete={handleDeleteTransaction}
              onTogglePaid={handleTogglePaid}
            />
          ) : activeTab === 'Análises' ? (
            <Insights 
              transactions={transactions} 
              stats={stats} 
              categoryData={categoryData} 
              onNavigate={async (tab, value) => {
                setActiveTab(tab);
                if (tab === 'Dashboard' && value !== undefined) {
                  setMonthlyGoal(value);
                  if (auth.currentUser) {
                    await setDoc(doc(db, 'users', auth.currentUser.uid), { monthlyGoal: value }, { merge: true });
                  }
                }
              }}
            />
          ) : activeTab === 'Configurações' ? (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-[16px] border border-[#E5E7EB] card-shadow">
                <h2 className="text-2xl font-bold text-[#111827] mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-[#22C55E]" />
                  Configurações da Conta
                </h2>
                
                <div className="space-y-6">
                  <div className="p-6 rounded-[16px] bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-[#111827] mb-4">Perfil</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-emerald-100 flex items-center justify-center">
                          {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-3xl font-bold text-[#22C55E]">
                              {userName.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-[#22C55E] text-white rounded-full shadow-lg cursor-pointer hover:bg-[#15803D] transition-all group-hover:scale-110">
                          <Camera className="w-4 h-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                      </div>
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <p className="text-sm text-[#111827]"><strong>Nome:</strong> {userName}</p>
                        <p className="text-sm text-[#111827]"><strong>Email:</strong> {userEmail}</p>
                        <p className="text-xs text-[#6B7280] mt-2">Clique no ícone da câmera para alterar sua foto de perfil.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[16px] bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#22C55E]" />
                      Notificações WhatsApp
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E5E7EB]">
                        <div>
                          <p className="text-sm font-bold text-[#111827]">Ativar Lembretes</p>
                          <p className="text-xs text-[#6B7280]">Receba avisos 5 dias antes e no dia do vencimento.</p>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!auth.currentUser) return;
                            const newStatus = !notificationsEnabled;
                            setNotificationsEnabled(newStatus);
                            await setDoc(doc(db, 'users', auth.currentUser.uid), { notificationsEnabled: newStatus }, { merge: true });
                          }}
                          className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Número do WhatsApp</label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="tel" 
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            onBlur={async () => {
                              if (!auth.currentUser) return;
                              await setDoc(doc(db, 'users', auth.currentUser.uid), { phone: userPhone }, { merge: true });
                            }}
                            placeholder="(00) 00000-0000"
                            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 font-bold text-sm"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 ml-1">O número deve incluir o DDD. Ex: (11) 99999-9999</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Categorias Personalizadas</h3>
                    <div className="space-y-4">
                      {/* Income Categories */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Receitas</p>
                        <div className="flex flex-wrap gap-2">
                          {customCategories.income.length > 0 ? (
                            customCategories.income.map((cat, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700 shadow-sm group">
                                {cat}
                                <button 
                                  onClick={() => handleDeleteCustomCategory('income', cat)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Nenhuma categoria de receita personalizada.</p>
                          )}
                        </div>
                      </div>

                      {/* Expense Categories */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Despesas</p>
                        <div className="flex flex-wrap gap-2">
                          {customCategories.expense.length > 0 ? (
                            customCategories.expense.map((cat, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700 shadow-sm group">
                                {cat}
                                <button 
                                  onClick={() => handleDeleteCustomCategory('expense', cat)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Nenhuma categoria de despesa personalizada.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Suporte' ? (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 card-shadow">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <LifeBuoy className="w-6 h-6 text-emerald-600" />
                  Suporte ProcVisual
                </h2>
                
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <LifeBuoy className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Como podemos ajudar?</h3>
                    <p className="text-slate-600 mb-6">Entre em contato conosco através dos canais abaixo para tirar dúvidas ou solicitar suporte técnico.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <a 
                        href="https://wa.me/5519991312218" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <PhoneIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase mb-1">WhatsApp</span>
                        <span className="text-lg font-bold text-slate-900">(19) 9 9131-2218</span>
                      </a>
                      
                      <a 
                        href="mailto:procvisual.dashboard@gmail.com?subject=Suporte%20Dashboard%20ProcVisual" 
                        className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Mail className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase mb-1">E-mail</span>
                        <span className="text-lg font-bold text-slate-900 break-all">procvisual.dashboard@gmail.com</span>
                      </a>
                    </div>
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
        customCategories={customCategories}
      />

      <AnimatePresence>
        {imageToCrop && (
          <ImageCropper
            image={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={() => setImageToCrop(null)}
          />
        )}
      </AnimatePresence>

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

const StatCard = ({ title, value, icon, bgColor, valueColor, chartData, dataKey, strokeColor, compact = false }: any) => {
  if (compact) {
    return (
      <div className={`p-2 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-2 h-full ${bgColor}`}>
        <div className="shrink-0">{icon}</div>
        <div>
          <p className="text-[9px] font-bold text-[#6B7280] uppercase leading-none">{title}</p>
          <p className={`text-[11px] font-black ${valueColor || 'text-[#111827]'} mt-0.5`}>{value}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] card-shadow relative overflow-hidden transition-colors duration-300"
    >
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${bgColor}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-[#6B7280] mb-1">{title}</p>
      <h4 className={`text-2xl font-bold ${valueColor || 'text-[#111827]'}`}>{value}</h4>
    </div>
    
    {chartData && (
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={strokeColor} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#gradient-${dataKey})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
    </motion.div>
  );
};

const AlertItem = ({ type, message, description }: any) => {
  const styles = {
    warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: <AlertTriangle className="text-amber-600" /> },
    info: { bg: 'bg-blue-50', border: 'border-blue-100', icon: <Bell className="text-blue-600" /> },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <Target className="text-emerald-600" /> },
  }[type as 'warning' | 'info' | 'success'];

  return (
    <div className={`p-4 rounded-[16px] border ${styles.bg} ${styles.border} flex gap-4`}>
      <div className="shrink-0 mt-1">{styles.icon}</div>
      <div>
        <p className="text-sm font-bold text-[#111827]">{message}</p>
        <p className="text-xs text-[#6B7280] mt-1">{description}</p>
      </div>
    </div>
  );
};
