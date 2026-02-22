import React from 'react';
import { X, DollarSign, Calendar, Tag, FileText, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const TransactionForm = ({ isOpen, onClose, onSave }: TransactionFormProps) => {
  const [type, setType] = React.useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = React.useState('');

  const categories = type === 'income' 
    ? ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros']
    : ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ type, amount, category, date, description });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Nova Transação</h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Type Toggle */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    type === 'income' 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowUpCircle className="w-5 h-5" />
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                    type === 'expense' 
                      ? 'bg-white text-red-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowDownCircle className="w-5 h-5" />
                  Despesa
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-2xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none text-slate-900 font-medium"
                    >
                      <option value="">Selecionar...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <textarea
                    placeholder="Ex: Aluguel, Supermercado..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                SALVAR
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
