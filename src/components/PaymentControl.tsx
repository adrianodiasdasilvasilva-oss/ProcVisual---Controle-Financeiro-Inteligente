import React from 'react';
import { 
  CheckCircle2, 
  Trash2,
  Search,
  Pencil
} from 'lucide-react';
import { motion } from 'motion/react';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string;
  paid?: boolean;
}

interface PaymentControlProps {
  transactions: Transaction[];
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onTogglePaid: (transaction: Transaction) => void;
  onBulkDelete: () => void;
  selectedTransactions: string[];
  toggleSelectTransaction: (id: string) => void;
  toggleSelectAll: (ids: string[]) => void;
}

const parseDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  return new Date(y, m - 1, d);
};

export const PaymentControl = ({ 
  transactions, 
  onDelete, 
  onEdit,
  onTogglePaid,
  onBulkDelete,
  selectedTransactions,
  toggleSelectTransaction,
  toggleSelectAll
}: PaymentControlProps) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Atualizar Lançamentos</h2>
          <p className="text-[#6B7280]">Gerencie seus pagamentos e recebimentos de forma detalhada.</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-[16px] border border-[#E5E7EB] card-shadow transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-[#111827]">Todos os Lançamentos</h3>
            {selectedTransactions.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir ({selectedTransactions.length})
              </motion.button>
            )}
          </div>
        </div>
        
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full text-left min-w-[900px] table-fixed sm:table-auto border-collapse">
            <thead>
              <tr className="text-xs font-bold text-[#6B7280] uppercase tracking-wider border-b border-slate-100">
                <th className="pb-4 px-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 bg-white text-[#22C55E] focus:ring-emerald-500"
                    checked={transactions.length > 0 && transactions.every(t => t.id && selectedTransactions.includes(t.id))}
                    onChange={() => {
                      const ids = transactions.map(t => t.id).filter((id): id is string => !!id);
                      toggleSelectAll(ids);
                    }}
                  />
                </th>
                <th className="pb-4 px-4 w-28">Data</th>
                <th className="pb-4 px-4">Descrição</th>
                <th className="pb-4 px-4 w-32">Categoria</th>
                <th className="pb-4 px-4 w-32 text-right">Valor</th>
                <th className="pb-4 px-4 w-32 text-center">Pago/Recebido</th>
                <th className="pb-4 px-4 w-20 text-right">Editar</th>
                <th className="pb-4 px-4 w-20 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length > 0 ? (
                transactions.map((t, i) => (
                  <tr key={i} className={`group hover:bg-slate-50 transition-colors ${t.id && selectedTransactions.includes(t.id) ? 'bg-slate-50' : ''}`}>
                    <td className="py-4 px-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 bg-white text-[#22C55E] focus:ring-emerald-500"
                        checked={!!t.id && selectedTransactions.includes(t.id)}
                        onChange={() => t.id && toggleSelectTransaction(t.id)}
                      />
                    </td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">
                      {parseDate(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold text-[#111827]">{t.description}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#6B7280]">
                        {t.category}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right font-bold ${t.type === 'income' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => onTogglePaid(t)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            t.paid ? 'bg-[#22C55E]' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              t.paid ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => onEdit(t)}
                          className="p-2 text-[#6B7280] hover:text-[#22C55E] hover:bg-emerald-50 rounded-lg transition-all"
                          title="Editar lançamento"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => onDelete(t)}
                          className="p-2 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all"
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
                  <td colSpan={8} className="py-8 text-center text-[#6B7280] text-sm italic">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
