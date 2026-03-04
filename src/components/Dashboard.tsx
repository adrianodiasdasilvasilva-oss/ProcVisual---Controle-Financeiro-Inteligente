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
  Sun,
  Moon
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
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply theme
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
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

    return { 
      income, 
      expense, 
      balance, 
      percentSpent,
      paidIncome,
      pendingIncome,
      paidExpense,
      pendingExpense
    };
  }, [filteredTransactions]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
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
            {isSidebarOpen && <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ProcVisual</span>}
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
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className={`${activeTab === item.label ? 'text-white' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                  {item.icon}
                </div>
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
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
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex flex-col py-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{userName}</h1>
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
              <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 gap-2 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all border border-transparent focus-within:border-emerald-100 dark:focus-within:border-emerald-900/50">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar lançamentos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-40 dark:text-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all"
                  title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all ${isNotificationsOpen ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600' : ''}`}
                  >
                    <Bell className="w-5 h-5" />
                    {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    )}
                  </button>

                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white">Notificações</h3>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          {alerts.length} novas
                        </span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                        {alerts.length > 0 ? (
                          alerts.map((alert, i) => (
                            <div 
                              key={i} 
                              className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex gap-3 cursor-pointer group"
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 
                                alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                              }`}>
                                {alert.type === 'success' ? <Target className="w-5 h-5" /> : 
                                 alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{alert.message}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{alert.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center">
                            <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma notificação por aqui.</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800 text-center">
                        <button 
                          onClick={() => {
                            const allAlertMessages = alerts.map(a => a.message);
                            setDismissedAlerts(prev => [...new Set([...prev, ...allAlertMessages])]);
                          }}
                          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          Marcar todas como lidas
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">Saldo atual</p>
                  <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
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
                  
                  <div className="relative">
                    <button 
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      <PieChartIcon className="w-4 h-4 text-emerald-500" />
                      {selectedCategories.length === 0 ? 'Todas categorias' : 
                       selectedCategories.length === 1 ? selectedCategories[0] :
                       `${selectedCategories.length} categorias`}
                    </button>
                    
                    {isCategoryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-2 border-b border-slate-50 dark:border-slate-800 mb-1 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase">Filtrar Categorias</span>
                            <button 
                              onClick={() => {
                                if (selectedCategories.length === allCategories.length) setSelectedCategories([]);
                                else setSelectedCategories([...allCategories]);
                              }}
                              className="text-[10px] font-bold text-emerald-600 hover:underline"
                            >
                              {selectedCategories.length === allCategories.length ? 'Limpar' : 'Todas'}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto p-1">
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
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all text-left ${
                                    selectedCategories.includes(cat) 
                                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold' 
                                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <span className="truncate">{cat}</span>
                                  {selectedCategories.includes(cat) && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-xs text-slate-400 italic">
                                Nenhuma categoria encontrada
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

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
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setIsWelcomeVisible(false)}
                          className="p-1 text-emerald-300 hover:text-emerald-600 transition-colors"
                          title="Fechar por agora"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={handlePermanentDismissWelcome}
                          className="p-1 text-emerald-300 hover:text-red-500 transition-colors"
                          title="Remover definitivamente"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
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
                        onClick={handleDeleteGoal}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remover meta definitivamente"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button 
                      onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                      className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
                    >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {selectedMonths.length === 0 ? 'Todos os meses' : 
                       selectedMonths.length === 12 ? 'Todos os meses' :
                       selectedMonths.length === 1 ? months[selectedMonths[0]] :
                       `${selectedMonths.length} meses`}
                    </button>
                    
                    {isMonthDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMonthDropdownOpen(false)}></div>
                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-2 border-b border-slate-50 mb-1 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase">Selecionar Meses</span>
                            <button 
                              onClick={() => {
                                if (selectedMonths.length === 12) setSelectedMonths([]);
                                else setSelectedMonths(Array.from({ length: 12 }, (_, i) => i));
                              }}
                              className="text-[10px] font-bold text-emerald-600 hover:underline"
                            >
                              {selectedMonths.length === 12 ? 'Limpar' : 'Todos'}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto p-1">
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
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                                  selectedMonths.includes(index) 
                                    ? 'bg-emerald-50 text-emerald-700 font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {month}
                                {selectedMonths.includes(index) && <CheckCircle2 className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
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
                          className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-300 px-4 py-1 cursor-pointer"
                        >
                          <option value="-1" className="dark:bg-slate-900">Todos os anos</option>
                          {years.map((year) => (
                            <option key={year} value={year} className="dark:bg-slate-900">{year}</option>
                          ))}
                          {selectedYear !== -1 && !years.includes(selectedYear) && (
                            <option value={selectedYear} className="dark:bg-slate-900">{selectedYear}</option>
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

                  {/* Status Filter */}
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        statusFilter === 'all' 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setStatusFilter('paid')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        statusFilter === 'paid' 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Pagos/Recebidos
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        statusFilter === 'pending' 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Pendentes
                    </button>
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
                  valueColor="text-emerald-600"
                  chartData={chartData}
                  dataKey="receita"
                  strokeColor="#10b981"
                />
                <StatCard 
                  title="Despesas do mês" 
                  value={`R$ ${stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend="+0%" 
                  trendUp={false} 
                  icon={<TrendingDown className="text-red-600" />} 
                  bgColor="bg-red-50"
                  valueColor="text-red-600"
                  chartData={chartData}
                  dataKey="despesa"
                  strokeColor="#ef4444"
                />
                <StatCard 
                  title="Economia" 
                  value={`R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  trend="+0%" 
                  trendUp={stats.balance >= 0} 
                  icon={<Wallet className="text-blue-600" />} 
                  bgColor="bg-blue-50"
                  valueColor={stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  chartData={chartData}
                  dataKey="saldo"
                  strokeColor="#3b82f6"
                />
                <StatCard 
                  title="Percentual gasto" 
                  value={`${stats.percentSpent}%`} 
                  trend="0%" 
                  trendUp={true} 
                  icon={<PieChartIcon className="text-amber-600" />} 
                  bgColor="bg-amber-50"
                  chartData={chartData}
                  dataKey="despesa"
                  strokeColor="#f59e0b"
                />
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow flex flex-col transition-colors duration-300">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Status de Receitas</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Recebido</p>
                      <p className="text-xl font-black text-emerald-600">R$ {stats.paidIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Pendente</p>
                      <p className="text-xl font-black text-red-600">R$ {stats.pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${stats.income > 0 ? (stats.paidIncome / stats.income) * 100 : 0}%` }}
                    />
                  </div>

                  {pendingStatsByMonth.income.length > 0 && (
                    <>
                      <div className="my-6 border-t border-slate-100 dark:border-slate-800 border-dashed"></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Pendências por Mês</p>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pendingStatsByMonth.income}>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={5} />
                              <Tooltip 
                                cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                                contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px', color: isDarkMode ? '#fff' : '#000' }}
                                itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Pendente']}
                              />
                              <Bar dataKey="pending" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow flex flex-col transition-colors duration-300">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Status de Despesas</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Pago</p>
                      <p className="text-xl font-black text-emerald-600">R$ {stats.paidExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Pendente</p>
                      <p className="text-xl font-black text-red-600">R$ {stats.pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${stats.expense > 0 ? (stats.paidExpense / stats.expense) * 100 : 0}%` }}
                    />
                  </div>

                  {pendingStatsByMonth.expense.length > 0 && (
                    <>
                      <div className="my-6 border-t border-slate-100 dark:border-slate-800 border-dashed"></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Pendências por Mês</p>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pendingStatsByMonth.expense}>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={5} />
                              <Tooltip 
                                cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                                contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px', color: isDarkMode ? '#fff' : '#000' }}
                                itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Pendente']}
                              />
                              <Bar dataKey="pending" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income Pie Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow transition-colors duration-300">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Receitas por categoria</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeCategoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                          labelLine={false}
                        >
                          {incomeCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => {
                            const percentage = stats.income > 0 ? (value / stats.income) * 100 : 0;
                            return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentage.toFixed(1)}%)`, 'Receita'];
                          }}
                          contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: isDarkMode ? '#fff' : '#000' }}
                          itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                    {incomeCategoryData.map((cat, i) => {
                      const percentage = stats.income > 0 ? (cat.value / stats.income) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 dark:text-white block">R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {incomeCategoryData.length === 0 && (
                      <p className="text-center text-slate-400 dark:text-slate-500 text-sm italic py-4">Nenhuma receita no período</p>
                    )}
                  </div>
                </div>

                {/* Expense Pie Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow transition-colors duration-300">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Gastos por categoria</h3>
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
                          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => {
                            const percentage = stats.expense > 0 ? (value / stats.expense) * 100 : 0;
                            return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentage.toFixed(1)}%)`, 'Gasto'];
                          }}
                          contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: isDarkMode ? '#fff' : '#000' }}
                          itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                    {categoryData.map((cat, i) => {
                      const percentage = stats.expense > 0 ? (cat.value / stats.expense) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 dark:text-white block">R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {categoryData.length === 0 && (
                      <p className="text-center text-slate-400 dark:text-slate-500 text-sm italic py-4">Nenhum gasto no período</p>
                    )}
                  </div>
                </div>

                {/* Line Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow transition-colors duration-300">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                    Evolução do saldo {selectedMonths.length === 1 ? `em ${months[selectedMonths[0]]}` : 'Anual'}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: isDarkMode ? '#fff' : '#000' }}
                          itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
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
                <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">
                    Receita vs despesas {selectedMonths.length === 1 ? `em ${months[selectedMonths[0]]}` : 'Anual'}
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
                        <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alerts Section */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow transition-colors duration-300">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Alertas e Insights</h3>
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
                  <button className="w-full mt-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Ver todos os alertas
                  </button>
                </div>

                {/* Recent Transactions Section */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow transition-colors duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lançamentos Recentes</h3>
                      {selectedTransactions.length > 0 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={handleBulkDelete}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir ({selectedTransactions.length})
                        </motion.button>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowAllTransactions(!showAllTransactions)}
                      className="text-sm font-bold text-emerald-600 hover:underline"
                    >
                      {showAllTransactions ? 'Ver menos' : 'Ver todos'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-4 px-4 w-10">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                              checked={(() => {
                                const limit = showAllTransactions ? filteredTransactions.length : 5;
                                const ids = filteredTransactions.slice(0, limit).map(t => t.id).filter((id): id is string => !!id);
                                return ids.length > 0 && ids.every(id => selectedTransactions.includes(id));
                              })()}
                              onChange={() => {
                                const limit = showAllTransactions ? filteredTransactions.length : 5;
                                const ids = filteredTransactions.slice(0, limit).map(t => t.id).filter((id): id is string => !!id);
                                toggleSelectAll(ids);
                              }}
                            />
                          </th>
                          <th className="pb-4 px-4">Data</th>
                          <th className="pb-4 px-4">Descrição</th>
                          <th className="pb-4 px-4">Categoria</th>
                          <th className="pb-4 px-4 text-right">Valor</th>
                          <th className="pb-4 px-4 text-center">Pago/Recebido</th>
                          <th className="pb-4 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredTransactions.length > 0 ? (
                          (showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 5)).map((t, i) => (
                            <tr key={i} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${t.id && selectedTransactions.includes(t.id) ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>
                              <td className="py-4 px-4">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                                  checked={!!t.id && selectedTransactions.includes(t.id)}
                                  onChange={() => t.id && toggleSelectTransaction(t.id)}
                                />
                              </td>
                              <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                                {parseDate(t.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{t.description}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {t.category}
                                </span>
                              </td>
                              <td className={`py-4 px-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'} R$ {parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button 
                                  onClick={() => handleTogglePaid(t)}
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
                                    onClick={() => handleDeleteTransaction(t)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Excluir lançamento"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 text-sm italic">
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
              <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-emerald-600" />
                  Configurações da Conta
                </h2>
                
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4">Perfil</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-emerald-100 flex items-center justify-center">
                          {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-3xl font-bold text-emerald-600">
                              {userName.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-emerald-700 transition-all group-hover:scale-110">
                          <Camera className="w-4 h-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                      </div>
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <p className="text-sm"><strong>Nome:</strong> {userName}</p>
                        <p className="text-sm"><strong>Email:</strong> {userEmail}</p>
                        <p className="text-xs text-slate-500 mt-2">Clique no ícone da câmera para alterar sua foto de perfil.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                      Notificações WhatsApp
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Ativar Lembretes</p>
                          <p className="text-xs text-slate-500">Receba avisos 5 dias antes e no dia do vencimento.</p>
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
              <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow">
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
                        className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <PhoneIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase mb-1">WhatsApp</span>
                        <span className="text-lg font-bold text-slate-900">(19) 9 9131-2218</span>
                      </a>
                      
                      <a 
                        href="mailto:procvisual.dashboard@gmail.com?subject=Suporte%20Dashboard%20ProcVisual" 
                        className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all group"
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

const StatCard = ({ title, value, trend, trendUp, icon, bgColor, valueColor, chartData, dataKey, strokeColor }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow relative overflow-hidden transition-colors duration-300"
  >
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${bgColor}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <h4 className={`text-2xl font-bold ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</h4>
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
