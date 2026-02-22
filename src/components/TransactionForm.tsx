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
  const [installments, setInstallments] = React.useState('1');

  // Reset form when opened
  React.useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setCategory('');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
      setInstallments('1');
    }
  }, [isOpen]);

  const categories = type === 'income' 
    ? ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros']
    : ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ type, amount, category, date, description, installments });
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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Insira a Receita ou Despesa</h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Type Toggle */}
              <div className="flex p-1 bg-slate-100/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${
                    type === 'income' 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowUpCircle className={`w-4 h-4 ${type === 'income' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${
                    type === 'expense' 
                      ? 'bg-white text-red-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowDownCircle className={`w-4 h-4 ${type === 'expense' ? 'text-red-600' : 'text-slate-400'}`} />
                  Despesa
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Valor</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-3xl font-black text-slate-900 placeholder:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Categoria</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none text-slate-900 font-bold text-sm"
                    >
                      <option value="">Selecionar...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Installments */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Data</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Qtd. Parcelas</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Descrição</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Ex: Aluguel, Supermercado..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 font-bold text-sm placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/40 mt-2"
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
