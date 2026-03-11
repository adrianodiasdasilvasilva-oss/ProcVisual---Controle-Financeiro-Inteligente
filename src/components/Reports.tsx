import React from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  Filter, 
  ChevronDown, 
  PieChart as PieChartIcon, 
  Table as TableIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  MessageCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string;
  paid?: boolean;
}

interface ReportsProps {
  transactions: Transaction[];
  monthlyGoal: number | null;
}

const COLORS = ['#F85151', '#F79E44', '#4699A3', '#89B16B', '#8B5CF6', '#F59E0B', '#B158A3'];

export const Reports = ({ transactions, monthlyGoal }: ReportsProps) => {
  const [reportType, setReportType] = React.useState<'detailed' | 'category' | 'monthly' | 'forecast'>('detailed');
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [sortConfig, setSortConfig] = React.useState<{ key: 'date' | 'amount'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date + 'T00:00:00');
      const monthMatch = date.getMonth() === selectedMonth;
      const yearMatch = date.getFullYear() === selectedYear;
      const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
      return monthMatch && yearMatch && categoryMatch;
    }).sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const amountA = parseFloat(a.amount);
        const amountB = parseFloat(b.amount);
        return sortConfig.direction === 'asc' ? amountA - amountB : amountB - amountA;
      }
    });
  }, [transactions, selectedMonth, selectedYear, categoryFilter, sortConfig]);

  const categories = React.useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  const categoryStats = React.useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    
    const groups: Record<string, number> = {};
    expenses.forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + parseFloat(t.amount);
    });

    return Object.entries(groups)
      .map(([name, value], index) => ({
        name,
        value,
        percent: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyStats = React.useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const balance = income - expense;
    const expensePercentOfIncome = income > 0 ? (expense / income) * 100 : 0;

    return { income, expense, balance, expensePercentOfIncome };
  }, [filteredTransactions]);

  const forecastStats = React.useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get all transactions for current month
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentIncome = monthTransactions.filter(t => t.type === 'income' && t.paid).reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const currentExpense = monthTransactions.filter(t => t.type === 'expense' && t.paid).reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const currentBalance = currentIncome - currentExpense;

    const futureIncome = monthTransactions.filter(t => t.type === 'income' && !t.paid).reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const futureExpense = monthTransactions.filter(t => t.type === 'expense' && !t.paid).reduce((acc, t) => acc + parseFloat(t.amount), 0);

    const estimatedBalance = currentBalance + futureIncome - futureExpense;

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (estimatedBalance < 0) status = 'danger';
    else if (estimatedBalance < (monthlyGoal || 500)) status = 'warning';

    return { currentBalance, futureIncome, futureExpense, estimatedBalance, status };
  }, [transactions, monthlyGoal]);

  const exportToExcel = () => {
    const data = filteredTransactions.map(t => ({
      Data: t.date,
      Descrição: t.description,
      Categoria: t.category,
      Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
      Valor: parseFloat(t.amount),
      Status: t.paid ? 'Pago' : 'Pendente'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `Relatorio_Financeiro_${months[selectedMonth]}_${selectedYear}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = `Relatório Financeiro - ${months[selectedMonth]} / ${selectedYear}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    if (reportType === 'detailed') {
      const tableData = filteredTransactions.map(t => [
        t.date,
        t.description,
        t.category,
        `R$ ${parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        t.paid ? 'Pago' : 'Pendente'
      ]);

      (doc as any).autoTable({
        startY: 40,
        head: [['Data', 'Descrição', 'Categoria', 'Valor', 'Status']],
        body: tableData,
      });
    } else if (reportType === 'category') {
      const tableData = categoryStats.map(c => [
        c.name,
        `R$ ${c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `${c.percent.toFixed(1)}%`
      ]);

      (doc as any).autoTable({
        startY: 40,
        head: [['Categoria', 'Total Gasto', 'Percentual']],
        body: tableData,
      });
    } else if (reportType === 'monthly') {
      doc.text(`Resumo Financeiro:`, 14, 45);
      doc.text(`Receitas Totais: R$ ${monthlyStats.income.toLocaleString('pt-BR')}`, 14, 55);
      doc.text(`Despesas Totais: R$ ${monthlyStats.expense.toLocaleString('pt-BR')}`, 14, 65);
      doc.text(`Saldo do Mês: R$ ${monthlyStats.balance.toLocaleString('pt-BR')}`, 14, 75);
      doc.text(`Comprometimento da Renda: ${monthlyStats.expensePercentOfIncome.toFixed(1)}%`, 14, 85);

      const topExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5)
        .map(t => [t.description, t.category, `R$ ${parseFloat(t.amount).toLocaleString('pt-BR')}`]);

      doc.text(`Top 5 Maiores Gastos:`, 14, 105);
      (doc as any).autoTable({
        startY: 110,
        head: [['Descrição', 'Categoria', 'Valor']],
        body: topExpenses,
      });
    }

    doc.save(`Relatorio_${reportType}_${months[selectedMonth]}.pdf`);
  };

  const shareOnWhatsApp = () => {
    const lines = [];
    lines.push("*Relatório Financeiro - ProcVisual*");
    lines.push("--------------------------------");
    lines.push(`📅 *Período:* ${months[selectedMonth]} / ${selectedYear}`);
    lines.push("");

    if (reportType === 'monthly') {
      lines.push("📊 *RESUMO MENSAL*");
      lines.push(`✅ Receitas: R$ ${monthlyStats.income.toLocaleString('pt-BR')}`);
      lines.push(`🔻 Despesas: R$ ${monthlyStats.expense.toLocaleString('pt-BR')}`);
      lines.push(`💰 Saldo: R$ ${monthlyStats.balance.toLocaleString('pt-BR')}`);
      lines.push("");
      lines.push(`💡 *Insight:* Suas despesas representam ${monthlyStats.expensePercentOfIncome.toFixed(1)}% da sua renda.`);
    } else if (reportType === 'forecast') {
      lines.push("🔮 *PREVISÃO DE SALDO*");
      lines.push(`💰 Saldo Atual: R$ ${forecastStats.currentBalance.toLocaleString('pt-BR')}`);
      lines.push(`✅ Receitas Previstas: R$ ${forecastStats.futureIncome.toLocaleString('pt-BR')}`);
      lines.push(`🔻 Despesas Previstas: R$ ${forecastStats.futureExpense.toLocaleString('pt-BR')}`);
      lines.push(`🏁 *Saldo Estimado:* R$ ${forecastStats.estimatedBalance.toLocaleString('pt-BR')}`);
    } else if (reportType === 'detailed') {
      lines.push("📝 *RELATÓRIO DETALHADO*");
      lines.push(`Total de transações: ${filteredTransactions.length}`);
      lines.push(`Total gasto: R$ ${monthlyStats.expense.toLocaleString('pt-BR')}`);
    } else {
      lines.push("📂 *GASTOS POR CATEGORIA*");
      categoryStats.slice(0, 5).forEach(c => {
        lines.push(`• ${c.name}: R$ ${c.value.toLocaleString('pt-BR')} (${c.percent.toFixed(1)}%)`);
      });
    }

    lines.push("");
    lines.push("--------------------------------");
    lines.push("*ProcVisual - Controle Inteligente*");

    const message = lines.join("\n");
    const url = new URL("https://wa.me/");
    url.searchParams.set("text", message);
    window.open(url.toString(), '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 overflow-y-auto h-full pb-24">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Relatórios
          </h2>
          <p className="text-slate-500 text-sm">Analise e exporte seus dados financeiros</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer border-l border-slate-200"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button 
              onClick={shareOnWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {[
          { id: 'detailed', label: 'Detalhadas', icon: <TableIcon className="w-4 h-4" /> },
          { id: 'category', label: 'Por Categoria', icon: <PieChartIcon className="w-4 h-4" /> },
          { id: 'monthly', label: 'Resumo Mensal', icon: <FileText className="w-4 h-4" /> },
          { id: 'forecast', label: 'Previsão', icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              reportType === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={reportType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {reportType === 'detailed' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-slate-800">Despesas Detalhadas</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none font-medium text-slate-600"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c === 'all' ? 'Todas Categorias' : c}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th 
                        className="p-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:text-blue-600"
                        onClick={() => setSortConfig({ key: 'date', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      >
                        Data {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                      <th 
                        className="p-4 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:text-blue-600"
                        onClick={() => setSortConfig({ key: 'amount', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                      >
                        Valor {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.filter(t => t.type === 'expense').map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-sm text-slate-600">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-sm font-bold text-slate-800">{t.description}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-red-600">
                          R$ {parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${t.paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {t.paid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {t.paid ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.filter(t => t.type === 'expense').length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                          Nenhuma despesa encontrada para este período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'category' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6">Distribuição das Despesas</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <h3 className="font-bold text-slate-800 mb-6">Resumo por Categoria</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Total Gasto</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Percentual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {categoryStats.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="text-sm font-bold text-slate-800">{c.name}</span>
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700 text-right">
                            R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-500 text-right">
                            {c.percent.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500 rounded-lg text-white">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-emerald-700 uppercase">Receitas</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">R$ {monthlyStats.income.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-rose-500 rounded-lg text-white">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-rose-700 uppercase">Despesas</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-900">R$ {monthlyStats.expense.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500 rounded-lg text-white">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-blue-700 uppercase">Saldo</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">R$ {monthlyStats.balance.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">Resumo Automático</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Neste mês de <span className="font-bold text-slate-800">{months[selectedMonth]}</span>, suas despesas representaram <span className={`font-bold ${monthlyStats.expensePercentOfIncome > 80 ? 'text-red-600' : 'text-blue-600'}`}>{monthlyStats.expensePercentOfIncome.toFixed(1)}%</span> da sua renda total.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-500">
                        {monthlyStats.expensePercentOfIncome > 100 
                          ? "⚠️ Atenção: Suas despesas superaram sua receita. Revise seus gastos fixos."
                          : monthlyStats.expensePercentOfIncome > 70
                          ? "💡 Dica: Você está comprometendo uma grande parte da sua renda. Tente reduzir gastos não essenciais."
                          : "✅ Parabéns! Seu nível de gastos está saudável em relação à sua renda."}
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:w-64 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Receita', value: monthlyStats.income, color: '#10B981' },
                        { name: 'Despesa', value: monthlyStats.expense, color: '#F43F5E' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                          <Cell fill="#10B981" />
                          <Cell fill="#F43F5E" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6">Top 5 Maiores Gastos</h3>
                <div className="space-y-4">
                  {filteredTransactions
                    .filter(t => t.type === 'expense')
                    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                    .slice(0, 5)
                    .map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400">
                            <TrendingDown className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{t.description}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</p>
                          </div>
                        </div>
                        <p className="font-bold text-red-600">R$ {parseFloat(t.amount).toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {reportType === 'forecast' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Previsão de Saldo do Mês</h3>
                    <p className="text-slate-500 text-sm">Projeção baseada em transações pendentes</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold ${
                    forecastStats.status === 'safe' ? 'bg-emerald-100 text-emerald-700' :
                    forecastStats.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      forecastStats.status === 'safe' ? 'bg-emerald-500' :
                      forecastStats.status === 'warning' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`} />
                    {forecastStats.status === 'safe' ? 'Saldo Confortável' :
                     forecastStats.status === 'warning' ? 'Atenção Necessária' :
                     'Risco de Saldo Negativo'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Saldo Atual (Pago)</p>
                    <p className="text-xl font-bold text-slate-800">R$ {forecastStats.currentBalance.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Receitas Previstas</p>
                    <p className="text-xl font-bold text-emerald-700">+ R$ {forecastStats.futureIncome.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Despesas Previstas</p>
                    <p className="text-xl font-bold text-rose-700">- R$ {forecastStats.futureExpense.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-6 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                    <p className="text-[10px] font-bold text-blue-100 uppercase mb-1">Saldo Estimado Final</p>
                    <p className="text-xl font-bold text-white">R$ {forecastStats.estimatedBalance.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6">Visualização da Projeção</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Atual', value: forecastStats.currentBalance },
                      { name: 'Final Estimado', value: forecastStats.estimatedBalance }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                        <Cell fill="#94a3b8" />
                        <Cell fill={forecastStats.estimatedBalance >= 0 ? '#2563eb' : '#e11d48'} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
