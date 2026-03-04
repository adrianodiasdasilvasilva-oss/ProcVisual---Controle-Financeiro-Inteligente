import React from 'react';
import { motion } from 'motion/react';

interface FinancialHealthGaugeProps {
  income: number;
  expense: number;
}

export const FinancialHealthGauge: React.FC<FinancialHealthGaugeProps> = ({ income, expense }) => {
  const surplus = income - expense;
  const healthPercent = income > 0 ? (surplus / income) * 100 : (surplus >= 0 ? 100 : -100);
  
  // Map healthPercent to rotation
  // -20% (or less) -> 0 degrees (Red start)
  // 0% -> 45 degrees
  // 10% -> 90 degrees
  // 20% -> 135 degrees
  // 40% (or more) -> 180 degrees (Green end)
  
  const getRotation = (percent: number) => {
    if (percent <= -20) return 0;
    if (percent >= 40) return 180;
    
    // Simple linear mapping for demo, can be more precise
    // We have 180 degrees total.
    // Let's map -20 to 40 (range of 60) to 0 to 180
    return ((percent + 20) / 60) * 180;
  };

  const rotation = getRotation(healthPercent);
  
  const getStatusColor = (percent: number) => {
    if (percent < 0) return 'text-red-600';
    if (percent <= 10) return 'text-amber-500';
    if (percent <= 20) return 'text-emerald-500';
    return 'text-emerald-600';
  };

  const getStatusBg = (percent: number) => {
    if (percent < 0) return 'bg-red-500';
    if (percent <= 10) return 'bg-amber-500';
    if (percent <= 20) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 card-shadow flex flex-col items-center h-full min-h-[320px]">
      <div className="w-full flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Saúde Financeira</h3>
          <p className="text-xs text-slate-500">Balanço entre ganhos e gastos</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
          healthPercent > 20 ? 'bg-emerald-100 text-emerald-700' :
          healthPercent >= 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        }`}>
          {healthPercent > 0 ? 'Positivo' : healthPercent < 0 ? 'Déficit' : 'Equilibrado'}
        </div>
      </div>

      <div className="relative w-full max-w-[280px] aspect-[2/1] mt-4">
        {/* Gauge Background */}
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <path
            d="M 25 90 A 75 75 0 0 1 175 90"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="12"
          />
          {/* Red Zone (180° to 120°) */}
          <path
            d="M 25 90 A 75 75 0 0 1 62.5 25.1"
            fill="none"
            stroke="#fee2e2"
            strokeWidth="12"
          />
          {/* Yellow Zone (120° to 90°) */}
          <path
            d="M 62.5 25.1 A 75 75 0 0 1 100 15"
            fill="none"
            stroke="#fef3c7"
            strokeWidth="12"
          />
          {/* Green Zone (90° to 0°) */}
          <path
            d="M 100 15 A 75 75 0 0 1 175 90"
            fill="none"
            stroke="#d1fae5"
            strokeWidth="12"
          />
          
          {/* Ticks */}
          {[0, 45, 90, 135, 180].map((deg) => (
            <line
              key={deg}
              x1={100 + 82 * Math.cos((deg + 180) * Math.PI / 180)}
              y1={90 + 82 * Math.sin((deg + 180) * Math.PI / 180)}
              x2={100 + 72 * Math.cos((deg + 180) * Math.PI / 180)}
              y2={90 + 72 * Math.sin((deg + 180) * Math.PI / 180)}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-1 h-[70%] origin-bottom transition-transform duration-1000 ease-out"
          style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
        >
          <div className={`w-full h-full rounded-full shadow-lg ${getStatusBg(healthPercent)}`}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-800 border-4 border-white shadow-md"></div>
        </div>

        {/* Center Text */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center w-full">
          <motion.p 
            key={surplus}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-2xl font-black ${getStatusColor(healthPercent)}`}
          >
            {surplus >= 0 ? '+' : '-'} R$ {Math.abs(surplus).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </motion.p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {surplus >= 0 ? 'de sobra' : 'de déficit'}
          </p>
        </div>
      </div>

      <div className="mt-8 w-full grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
          <p className={`text-xs font-black ${getStatusColor(healthPercent)}`}>
            {healthPercent < 0 ? 'Crítico' : healthPercent <= 10 ? 'Alerta' : 'Saudável'}
          </p>
        </div>
        <div className="text-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Saúde</p>
          <p className="text-xs font-black text-slate-900">{healthPercent.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ideal</p>
          <p className="text-xs font-black text-emerald-600">{'>'} 20%</p>
        </div>
      </div>
    </div>
  );
};
