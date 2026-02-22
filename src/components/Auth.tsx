import React from 'react';
import { LayoutDashboard, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

export const Auth = ({ onBack, onLoginSuccess, initialMode = 'login' }: AuthProps) => {
  const [mode, setMode] = React.useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Side - Image/Visual */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" 
            alt="Análise de dados" 
            className="w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 p-12 flex flex-col justify-end h-full text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold mb-4">Transforme seus dados em decisões.</h2>
            <p className="text-slate-300 text-lg max-w-md">
              Acompanhe cada centavo e veja seu patrimônio crescer com ferramentas de análise profissional simplificadas para você.
            </p>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-1/4 right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col p-6 md:p-12 lg:p-20 justify-center relative">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">ProcVisual</span>
          </div>

          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h1>
            <p className="text-slate-500 mb-8">
              {mode === 'login' 
                ? 'Acesse sua conta para gerenciar suas finanças.' 
                : 'Comece sua jornada para a liberdade financeira hoje.'}
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo</label>
                  <input 
                    type="text" 
                    placeholder="Seu nome"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <button 
                disabled={isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  mode === 'login' ? 'Entrar' : 'Criar conta'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500">
                {mode === 'login' ? 'Não tem conta?' : 'Já tem uma conta?'}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="ml-2 font-bold text-emerald-600 hover:text-emerald-700"
                >
                  {mode === 'login' ? 'Criar conta' : 'Fazer login'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
