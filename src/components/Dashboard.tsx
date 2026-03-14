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
  Smartphone,
  Plus,
  FileText,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart,
  Area,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend,
  Treemap,
  ResponsiveContainer,
  LabelList
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
import { Reports } from './Reports';
import { AnimatePresence } from 'motion/react';
import { sendWhatsAppMessage } from '../services/whapiService';
import { MessageSquare, Phone as PhoneIcon } from 'lucide-react';

const COLORS = ['#F85151', '#F79E44', '#4699A3', '#89B16B', '#8B5CF6', '#F59E0B', '#B158A3'];

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

const getHealthStatus = (health: number) => {
  if (health >= 40) return { label: 'Excelente', color: 'bg-emerald-500', textColor: 'text-emerald-600', vibrantTextColor: 'text-emerald-400' };
  if (health >= 20) return { label: 'Bom', color: 'bg-green-400', textColor: 'text-green-500', vibrantTextColor: 'text-green-400' };
  if (health >= 10) return { label: 'Atenção', color: 'bg-yellow-400', textColor: 'text-yellow-500', vibrantTextColor: 'text-yellow-400' };
  return { label: 'Crítico', color: 'bg-red-500', textColor: 'text-red-600', vibrantTextColor: 'text-red-400' };
};

export const Dashboard = ({ onLogout, userName, userEmail }: DashboardProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth >= 1024);
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
  const [totalGoal, setTotalGoal] = React.useState<number | null>(null);
  const [goalTracking, setGoalTracking] = React.useState<Record<number, boolean[]>>({});
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [customCategories, setCustomCategories] = React.useState<{income: string[], expense: string[]}>({ income: [], expense: [] });
  const [selectedTransactions, setSelectedTransactions] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'paid' | 'pending'>('all');
  const [userPhone, setUserPhone] = React.useState('');
  const [isSavingPhone, setIsSavingPhone] = React.useState(false);
  const [phoneUpdateSuccess, setPhoneUpdateSuccess] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [showAllTransactions, setShowAllTransactions] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const processingNotificationsRef = React.useRef<Set<string>>(new Set());
  const isProcessingNotificationsRef = React.useRef(false);

  // PWA Install Prompt Logic
  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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
        setTotalGoal(data.totalGoal !== undefined ? data.totalGoal : (data.monthlyGoal !== undefined ? data.monthlyGoal : null));
        setGoalTracking(data.goalTracking || {});
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
      const percentUtilizado = totalReceitaMes > 0 ? Math.round((totalGastoMes / totalReceitaMes) * 100) : 0;

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

        const buildMessage = () => `
Olá! 👋 Passando para avisar que a sua conta referente a categoria de ${t.category} vence ${formatDate(dueDate)} 
━━━━━━━━━━━━━━━
🧾 Descrição: ${t.description}
💰 Valor: ${formatCurrency(parseFloat(t.amount))}
━━━━━━━━━━━━━━━
📊 Resumo do mês:
• Total gasto: ${formatCurrency(totalGastoMes)}
• Restante do orçamento: ${formatCurrency(economia)}

⚠️ Atenção: Você já utilizou ${percentUtilizado}% da sua receita.
━━━━━━━━━━━━━━━

🔗 *ProcVisual*
Acesse seu dashboard: https://proc-visual-controle-financeiro-int.vercel.app/

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

          const message = buildMessage();
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

          const message = buildMessage();
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
      checkAndSendNotifications(transactions, userPhone, notificationsEnabled, totalGoal ? totalGoal / 12 : null);
    }
  }, [transactions, userPhone, notificationsEnabled, totalGoal, checkAndSendNotifications]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const monthsLabel = React.useMemo(() => {
    if (selectedMonths.length === 0 || selectedMonths.length === 12) return 'Todos os meses';
    if (selectedMonths.length === 1) return months[selectedMonths[0]];
    return selectedMonths.map(m => months[m].substring(0, 3)).join('_');
  }, [selectedMonths, months]);

  const handleUpdateGoalTracking = async (year: number, monthIdx: number, achieved: boolean) => {
    if (!auth.currentUser) return;
    
    const currentYearTracking = goalTracking[year] || Array(12).fill(false);
    const updatedYearTracking = [...currentYearTracking];
    updatedYearTracking[monthIdx] = achieved;
    
    const updatedTracking = {
      ...goalTracking,
      [year]: updatedYearTracking
    };
    
    setGoalTracking(updatedTracking);
    
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { goalTracking: updatedTracking }, { merge: true });
    } catch (error) {
      console.error('Error updating goal tracking:', error);
    }
  };

  const handleSavePhone = async () => {
    if (!auth.currentUser) return;
    setIsSavingPhone(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { phone: userPhone }, { merge: true });
      setPhoneUpdateSuccess(true);
      setTimeout(() => setPhoneUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving phone:', error);
    } finally {
      setIsSavingPhone(false);
    }
  };

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

    // Validate file type and size (max 210MB)
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo válido (imagem ou vídeo).');
      return;
    }
    if (file.size > 210 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 210MB.');
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

  const handleUpdateGoal = async (value: number) => {
    if (!auth.currentUser) return;
    setTotalGoal(value);
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { totalGoal: value }, { merge: true });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async () => {
    if (!auth.currentUser) return;
    if (!window.confirm('Deseja remover esta meta definitivamente?')) return;

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { 
        totalGoal: deleteField(),
        monthlyGoal: deleteField() 
      });
      setTotalGoal(null);
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
    const financialHealth = income > 0 ? ((income - expense) / income) * 100 : (expense > 0 ? -100 : 0);
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
      financialHealth,
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

    return Object.entries(groups)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
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

  // Calculate Annual Goal Stats
  const annualGoalStats = React.useMemo(() => {
    if (!totalGoal) return null;
    
    const year = selectedYear === -1 ? new Date().getFullYear() : selectedYear;
    const target = totalGoal;
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
      // Contribution is the positive balance
      realized += Math.max(0, balance);
    }
    
    return {
      realized,
      target,
      percent: Math.min(100, Math.round((realized / target) * 100))
    };
  }, [transactions, totalGoal, selectedYear]);

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

    return list.filter(a => !dismissedAlerts.includes(a.message)).slice(0, 3);
  }, [transactions, stats, categoryData, dismissedAlerts]);

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Receitas' },
    { icon: <TrendingDown className="w-5 h-5" />, label: 'Despesas' },
    { icon: <PieChartIcon className="w-5 h-5" />, label: 'Análises' },
    { icon: <FileText className="w-5 h-5" />, label: 'Relatórios' },
    { icon: <Settings className="w-5 h-5" />, label: 'Configurações' },
    { icon: <LifeBuoy className="w-5 h-5" />, label: 'Suporte' },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F5F7FB] flex transition-colors duration-300 relative">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0F172A] border-r border-[#1E293B] transition-all duration-300 
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
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
      <main className={`flex-1 min-w-0 h-screen flex flex-col bg-[#F5F7FB] transition-all duration-300 pb-16 lg:pb-0 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Topbar */}
        <header className="bg-[#0F172A] border-b border-[#1E293B] shrink-0 sticky top-0 z-30">
          <div className="px-4 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-[#9CA3AF] hover:bg-[#1E293B] rounded-lg"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex flex-col py-1 overflow-hidden">
                <h1 className="text-base lg:text-2xl font-bold text-white leading-tight truncate max-w-[120px] sm:max-w-none">{userName}</h1>
                <div className="lg:hidden flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${getHealthStatus(stats.financialHealth).color}`}></div>
                  <span className={`text-[10px] font-bold ${stats.financialHealth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Saúde: {Math.round(stats.financialHealth)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-xs mx-8 hidden lg:block group relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Saúde Financeira</span>
                <span className={`text-[10px] font-bold ${getHealthStatus(stats.financialHealth).vibrantTextColor}`}>
                  Status: {getHealthStatus(stats.financialHealth).label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(100, stats.financialHealth))}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${getHealthStatus(stats.financialHealth).color}`}
                  />
                </div>
                <span className={`text-xs font-bold min-w-[32px] drop-shadow-sm ${stats.financialHealth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {Math.round(stats.financialHealth)}%
                </span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                <h4 className="text-xs font-bold text-[#111827] mb-3 border-b border-slate-100 pb-2">Detalhes da Saúde Financeira</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Receita Total</span>
                    <span className="font-bold text-emerald-600">R$ {stats.income.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Despesa Total</span>
                    <span className="font-bold text-red-600">R$ {stats.expense.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Saldo do Mês</span>
                    <span className={`font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      R$ {stats.balance.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Percentual de Saúde</span>
                    <span className={`font-bold ${stats.financialHealth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stats.financialHealth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-white uppercase tracking-wider hidden sm:block">Saldo atual</p>
                  <p className={`text-xs sm:text-sm font-bold ${stats.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1E293B] rounded-full overflow-hidden border border-[#1E293B] shrink-0">
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

        <div className={`flex-1 min-w-0 p-2 lg:p-4 ${activeTab === 'Dashboard' ? 'overflow-y-auto lg:overflow-hidden' : 'overflow-y-auto'}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Carregando seus dados...</p>
            </div>
          ) : activeTab === 'Dashboard' ? (
            <div className="h-full flex flex-col space-y-2 min-h-0">
              {/* Header Section: Title, Filters & Action Buttons */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 shrink-0 bg-white p-2 rounded-2xl border border-[#E5E7EB] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                  <h2 className="text-lg lg:text-xl font-bold text-[#111827] whitespace-nowrap">Painel Financeiro</h2>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <button 
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-[11px] font-bold text-[#111827] hover:bg-slate-100 transition-all"
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

                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-[#E5E7EB]">
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
                        className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-[11px] font-bold text-[#111827] hover:bg-slate-100 transition-all"
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

                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-[#E5E7EB]">
                      <CheckCircle2 className="w-3 h-3 text-[#6B7280] ml-2" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-transparent border-none outline-none text-[11px] font-bold text-[#111827] px-2 py-0.5 cursor-pointer"
                      >
                        <option value="all">Todos os status</option>
                        <option value="paid">Pago / Recebido</option>
                        <option value="pending">Pendente</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsTransactionFormOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#22C55E] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#16A34A] transition-all shadow-sm active:scale-95"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Novo Lançamento
                  </button>
                  <button 
                    onClick={() => setActiveTab('Atualizar Lançamentos')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#3B82F6] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#2563EB] transition-all shadow-sm active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" />
                    Atualizar Lançamentos
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
                <StatCard 
                  title="Receita" 
                  value={`R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
                  icon={<TrendingUp className="text-emerald-600 w-5 h-5" />} 
                  bgColor="bg-emerald-50"
                  valueColor="text-emerald-600"
                />
                <StatCard 
                  title="Despesa" 
                  value={`R$ ${stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
                  icon={<TrendingDown className="text-red-600 w-5 h-5" />} 
                  bgColor="bg-red-50"
                  valueColor="text-red-600"
                />
                <StatCard 
                  title="Economia" 
                  value={`R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
                  icon={<Wallet className="text-blue-600 w-5 h-5" />} 
                  bgColor="bg-blue-50"
                  valueColor={stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}
                />
                <StatCard 
                  title="% Gasto" 
                  value={`${stats.percentSpent}%`} 
                  icon={<AlertTriangle className="text-amber-600 w-5 h-5" />} 
                  bgColor="bg-amber-50"
                  valueColor="text-amber-600"
                />
              </div>

              {/* Charts Section */}
              <div className="flex-1 min-h-0 flex flex-col mt-2">
                {/* Chart: Para onde está indo seu dinheiro? (Treemap) */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex-1 flex flex-col min-h-0">
                  <h3 className="text-sm font-bold text-[#111827] mb-4">
                    Para onde está indo seu dinheiro?
                  </h3>
                  <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoryData}
                          layout="vertical"
                          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                          barCategoryGap={10}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={120}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b', textAnchor: 'start' }}
                            dx={-110}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                            formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                            cursor={{ fill: 'transparent' }}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[0, 10, 10, 0]} 
                            barSize={20}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList 
                              dataKey="value" 
                              position="right" 
                              formatter={(value: number) => {
                                const total = categoryData.reduce((acc, curr) => acc + curr.value, 0);
                                return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';
                              }}
                              style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }}
                              offset={10}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <PieChartIcon className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs font-medium">Nenhuma despesa para exibir</p>
                      </div>
                    )}
                  </div>
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
              alerts={alerts}
              goalTracking={goalTracking}
              onUpdateGoalTracking={handleUpdateGoalTracking}
              totalGoal={totalGoal}
              onUpdateGoal={handleUpdateGoal}
              onNavigate={(tab, value) => {
                setActiveTab(tab);
                if (value !== undefined) {
                  handleUpdateGoal(value);
                }
              }}
            />
          ) : activeTab === 'Relatórios' ? (
            <Reports 
              transactions={transactions} 
              totalGoal={totalGoal} 
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
                      Notificações no Celular
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
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Seu Número (DDD + Celular)</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                              type="tel" 
                              value={userPhone}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length > 11) val = val.slice(0, 11);
                                if (val.length > 10) {
                                  val = val.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                                } else if (val.length > 5) {
                                  val = val.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                                } else if (val.length > 2) {
                                  val = val.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
                                } else if (val.length > 0) {
                                  val = val.replace(/^(\d{0,2}).*/, '($1');
                                }
                                setUserPhone(val);
                              }}
                              placeholder="(00) 00000-0000"
                              className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 font-bold text-sm"
                            />
                          </div>
                          <button
                            onClick={handleSavePhone}
                            disabled={isSavingPhone}
                            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95 ${
                              phoneUpdateSuccess 
                                ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                                : 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
                            }`}
                          >
                            {isSavingPhone ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : phoneUpdateSuccess ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Salvo
                              </>
                            ) : (
                              'Atualizar'
                            )}
                          </button>
                        </div>
                        {phoneUpdateSuccess && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] text-emerald-600 font-bold mt-2 ml-1 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Número atualizado! Você começará a receber notificações neste novo número.
                          </motion.p>
                        )}
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

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-[#22C55E]" />
                      Instalar Aplicativo (Atalho)
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">Transforme a ProcVisual em um aplicativo no seu celular para acesso rápido.</p>
                    
                    {deferredPrompt && (
                      <button
                        onClick={handleInstallClick}
                        className="w-full mb-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Smartphone className="w-5 h-5" />
                        Instalar Agora no Celular
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">No Android (Chrome)</p>
                        <ol className="text-xs text-slate-600 space-y-2 list-decimal ml-4">
                          <li>Toque nos <span className="font-bold">três pontos (⋮)</span> no canto superior direito.</li>
                          <li>Selecione <span className="font-bold">"Instalar aplicativo"</span> ou <span className="font-bold">"Adicionar à tela inicial"</span>.</li>
                          <li>Confirme em <span className="font-bold">"Instalar"</span>.</li>
                        </ol>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">No iPhone (Safari)</p>
                        <ol className="text-xs text-slate-600 space-y-2 list-decimal ml-4">
                          <li>Toque no ícone de <span className="font-bold">Compartilhar (□ com seta)</span> na barra inferior.</li>
                          <li>Role para baixo e toque em <span className="font-bold">"Adicionar à Tela de Início"</span>.</li>
                          <li>Toque em <span className="font-bold">"Adicionar"</span> no canto superior.</li>
                        </ol>
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
                        <span className="text-xs font-bold text-slate-400 uppercase mb-1">Fale Conosco</span>
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
      {!['Dashboard', 'Análises', 'Configurações', 'Relatórios'].includes(activeTab) && (
        <button 
          onClick={() => setIsTransactionFormOpen(true)}
          className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all"
        >
          {['Receitas', 'Despesas'].includes(activeTab) ? <Plus className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
        </button>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] h-16 flex items-center justify-around px-2 lg:hidden z-40">
        {menuItems.slice(0, 5).map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(item.label)}
            className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 ${
              activeTab === item.label ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div className={`${activeTab === item.label ? 'scale-110' : ''} transition-transform`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor, valueColor }: any) => {
  return (
    <div className={`p-2 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-2 h-full ${bgColor} transition-all hover:shadow-md`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider leading-none mb-1">{title}</p>
        <p className={`text-base font-black ${valueColor || 'text-[#111827]'} leading-none truncate`}>{value}</p>
      </div>
    </div>
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
