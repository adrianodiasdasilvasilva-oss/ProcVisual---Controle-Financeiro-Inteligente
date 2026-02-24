import React from 'react';
import { LayoutDashboard, ArrowLeft, Mail, Lock, Eye, EyeOff, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import emailjs from 'emailjs-com';

const EMAILJS_PUBLIC_KEY = 'ZEkDn0JfN7ugWRzPW';
const EMAILJS_SERVICE_ID = 'service_n2kfudg';
const EMAILJS_WELCOME_TEMPLATE_ID = 'template_rlnfwq7';
const EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID = 'template_di20fjt';

interface AuthProps {
  onBack: () => void;
  onLoginSuccess: (userName: string, userEmail: string) => void;
  initialMode?: 'login' | 'signup';
}

export const Auth = ({ onBack, onLoginSuccess, initialMode = 'login' }: AuthProps) => {
  const [mode, setMode] = React.useState<'login' | 'signup'>(initialMode);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
  const [forgotPasswordData, setForgotPasswordData] = React.useState({ name: '', phone: '', email: '' });
  const [message, setMessage] = React.useState<{ text: string, type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        // Register user in backend
        const signupResponse = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password }),
        });

        let signupData;
        const contentType = signupResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          signupData = await signupResponse.json();
        } else {
          const text = await signupResponse.text();
          console.error("Non-JSON response from signup:", text);
          throw new Error(`Erro no servidor: ${signupResponse.status}`);
        }

        if (!signupResponse.ok) {
          throw new Error(signupData.message || 'Erro ao criar conta');
        }

        // Send welcome email via EmailJS
        const templateParams = {
          to_name: name,
          to_phone: phone,
          to_email: email,
          password: password,
        };

        try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_WELCOME_TEMPLATE_ID, templateParams);
        } catch (emailErr) {
          console.error('EmailJS Error:', emailErr);
          // Don't block signup if email fails, but maybe log it
        }

        setMessage({ text: "Conta criada com sucesso! Enviamos seus dados de acesso para seu email.", type: 'success' });
        
        // Auto login after signup
        setTimeout(() => {
          onLoginSuccess(name, email);
        }, 1500);
      } else {
        // Login
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        let loginData;
        const contentType = loginResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          loginData = await loginResponse.json();
        } else {
          const text = await loginResponse.text();
          console.error("Non-JSON response from login:", text);
          throw new Error(`Erro no servidor: ${loginResponse.status}`);
        }

        if (!loginResponse.ok) {
          throw new Error(loginData.message || 'Email ou senha inválidos');
        }

        onLoginSuccess(loginData.user.name, loginData.user.email);
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      setIsLoading(false);
      setMessage({ text: error.message || "Não foi possível processar a solicitação. Tente novamente.", type: 'error' });
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const templateParams = {
        to_name: forgotPasswordData.name,
        to_phone: forgotPasswordData.phone,
        to_email: forgotPasswordData.email,
        reset_link: `${window.location.origin}/#reset-password`,
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID, templateParams);
      setMessage({ text: "Enviamos um link para redefinição de senha no seu email.", type: 'success' });
      setIsForgotPasswordOpen(false);
      setForgotPasswordData({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error sending forgot password email:', error);
      setMessage({ text: "Não foi possível enviar o email. Tente novamente.", type: 'error' });
    } finally {
      setIsLoading(false);
    }
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
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src="https://i.imgur.com/mPPZOMY.jpeg" 
                alt="ProcVisual Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
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
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo</label>
                    <input 
                      type="text" 
                      placeholder="Seu nome"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Celular</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="tel" 
                        placeholder="(00) 00000-0000"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.text}
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
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">Recuperar Senha</h2>
                <button 
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleForgotPasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={forgotPasswordData.name}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                  <input 
                    type="tel" 
                    required
                    value={forgotPasswordData.phone}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    value={forgotPasswordData.email}
                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                
                <button 
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Enviar link de redefinição'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
