import React from 'react';
import { LayoutDashboard, ArrowLeft, Mail, Lock, Eye, EyeOff, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import emailjs from 'emailjs-com';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const EMAILJS_PUBLIC_KEY = 'ZEkDn0JfN7ugWRzPW';
const EMAILJS_SERVICE_ID = 'service_n2kfudg';
const EMAILJS_WELCOME_TEMPLATE_ID = 'template_rlnfwq7';

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
  const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');
  const [message, setMessage] = React.useState<{ text: string, type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    
    // API Connectivity Test
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log("API Health Check:", data))
      .catch(err => console.error("API Health Check Failed:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        // Firebase Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with name
        await updateProfile(user, { displayName: name });

        // Save extra data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name,
          phone,
          email,
          hasLifetimeAccess: false,
          createdAt: new Date().toISOString()
        });

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
        }

        setMessage({ text: "Conta criada com sucesso! Acesse agora para ativar seu plano.", type: 'success' });
        
        // onLoginSuccess will be handled by onAuthStateChanged in App.tsx
      } else {
        // Firebase Login
        await signInWithEmailAndPassword(auth, email, password);
        // onLoginSuccess will be handled by onAuthStateChanged in App.tsx
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      setIsLoading(false);
      
      let errorMessage = "Não foi possível processar a solicitação. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') errorMessage = "Este email já está em uso.";
      if (error.code === 'auth/invalid-credential') errorMessage = "Email ou senha inválidos.";
      if (error.code === 'auth/weak-password') errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Firebase Password Reset
      const actionCodeSettings = {
        url: 'https://proc-visual-controle-financeiro-int.vercel.app/',
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, forgotPasswordEmail, actionCodeSettings);
      
      setMessage({ text: "Enviamos um link para redefinição de senha no seu email. Verifique também sua caixa de spam.", type: 'success' });
      setIsForgotPasswordOpen(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      console.error('Error sending forgot password email:', error);
      let errorMessage = "Não foi possível enviar o email. Tente novamente.";
      if (error.code === 'auth/user-not-found') errorMessage = "Este email não está cadastrado.";
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      {/* Background Elements - Organic Waves */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top Right Wave */}
        <svg 
          className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] opacity-40 blur-[2px]" 
          viewBox="0 0 800 800" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M800 0C600 100 400 50 200 150C0 250 100 450 0 600V800H800V0Z" 
            fill="url(#paint0_linear)"
          />
          <defs>
            <linearGradient id="paint0_linear" x1="800" y1="0" x2="0" y2="800" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" stopOpacity="0.6" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Left Wave */}
        <svg 
          className="absolute bottom-[-10%] left-[-5%] w-[70%] h-[70%] opacity-30 blur-[1px]" 
          viewBox="0 0 800 800" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M0 800C200 700 400 750 600 650C800 550 700 350 800 200V0H0V800Z" 
            fill="url(#paint1_linear)"
          />
          <defs>
            <linearGradient id="paint1_linear" x1="0" y1="800" x2="800" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" stopOpacity="0.5" />
              <stop offset="1" stopColor="#10B981" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Subtle Halftone Pattern on Waves (Optional/Subtle) */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#0F172A 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Form Container */}
      <div className="max-w-md w-full bg-[#0F172A] p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <div className="flex items-center gap-2 mb-12">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
            <img 
              src="https://i.imgur.com/mPPZOMY.jpeg" 
              alt="ProcVisual Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ProcVisual</span>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-slate-400 mb-8">
            {mode === 'login' 
              ? 'Acesse sua conta para gerenciar suas finanças.' 
              : 'Comece sua jornada para a liberdade financeira hoje.'}
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Nome completo</label>
                  <input 
                    type="text" 
                    placeholder="Seu nome"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Celular</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
            <p className="text-slate-400">
              {mode === 'login' ? 'Não tem conta?' : 'Já tem uma conta?'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 font-bold text-emerald-500 hover:text-emerald-400"
              >
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </motion.div>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
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
