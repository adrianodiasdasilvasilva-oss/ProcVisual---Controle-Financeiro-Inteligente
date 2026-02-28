/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header, Hero, Features, Footer } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CheckCircle2, CreditCard, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ResetPasswordProps {
  onSuccess: () => void;
  onBack: () => void;
}

const ResetPassword = ({ onSuccess, onBack }: ResetPasswordProps) => {
  const [resetEmail, setResetEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [resetMessage, setResetMessage] = React.useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResetMessage(null);
    
    if (newPassword !== confirmPassword) {
      setResetMessage({ text: "As senhas não coincidem.", type: 'error' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if email exists in Firestore
      const q = query(collection(db, 'users'), where('email', '==', resetEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setResetMessage({ text: "Email não encontrado em nossa base de dados.", type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Check for oobCode in URL (Firebase standard for password reset)
      const urlParams = new URLSearchParams(window.location.search);
      const oobCode = urlParams.get('oobCode');

      if (oobCode) {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setResetMessage({ text: "Senha alterada com sucesso! Redirecionando...", type: 'success' });
        setTimeout(() => onSuccess(), 2000);
      } else {
        // If no code, send the reset email
        await sendPasswordResetEmail(auth, resetEmail);
        setResetMessage({ 
          text: "Para sua segurança, enviamos um link de confirmação para seu email. Clique no link recebido para concluir a alteração da senha.", 
          type: 'success' 
        });
      }
    } catch (error: any) {
      console.error('Reset Error:', error);
      let errorMsg = "Ocorreu um erro ao processar sua solicitação.";
      if (error.code === 'auth/invalid-action-code') errorMsg = "O link de redefinição expirou ou já foi usado.";
      if (error.code === 'auth/weak-password') errorMsg = "A nova senha deve ter pelo menos 6 caracteres.";
      
      setResetMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Redefinir Senha</h1>
        <p className="text-slate-500 mb-8">Digite seu email e a nova senha abaixo.</p>
        
        {resetMessage && (
          <div className={`p-4 rounded-xl text-sm font-medium mb-4 ${
            resetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {resetMessage.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleResetSubmit}>
          <input 
            type="email" 
            placeholder="Seu email cadastrado" 
            required 
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
          <input 
            type="password" 
            placeholder="Nova senha" 
            required 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
          <input 
            type="password" 
            placeholder="Confirmar nova senha" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
          <button 
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting && resetMessage?.type === 'success' ? 'Redirecionando...' : 'Salvar Nova Senha'}
          </button>
        </form>
        
        <button 
          onClick={onBack}
          className="mt-6 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = React.useState<'landing' | 'auth' | 'dashboard' | 'reset-password'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/reset-password' || hash === '#reset-password' || hash.includes('reset-password')) {
        return 'reset-password';
      }
    }
    return 'landing';
  });

  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [user, setUser] = React.useState<any>(null);
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [hasLifetimeAccess, setHasLifetimeAccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = React.useState(false);

  // 1. Auth Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setUserName(firebaseUser.displayName || '');
        setUserEmail(firebaseUser.email || '');
        if (view === 'landing' || view === 'auth') {
          setView('dashboard');
        }
      } else {
        setUserName('');
        setUserEmail('');
        setHasLifetimeAccess(false);
        if (view === 'dashboard') setView('landing');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Access & Payment Check
  const checkAccess = React.useCallback(async () => {
    if (!user) return;
    
    setIsCheckingAccess(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let access = false;
      if (userDoc.exists()) {
        access = userDoc.data().hasLifetimeAccess;
      }

      // If payment just succeeded, update Firestore
      if (paymentStatus === 'success' && !access) {
        await setDoc(userDocRef, { 
          hasLifetimeAccess: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        access = true;
        
        // Clean up URL
        const cleanSearch = window.location.search.replace(/[?&]payment=success/, '');
        const newUrl = window.location.pathname + (cleanSearch === '?' ? '' : cleanSearch);
        window.history.replaceState(null, '', newUrl);
      }
      
      setHasLifetimeAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setIsCheckingAccess(false);
    }
  }, [user]);

  React.useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#reset-password') {
        setView('reset-password');
      } else if ((hash === '' || hash === '#') && view === 'reset-password') {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [view]);

  const handleLogin = () => {
    setAuthMode('login');
    setView('auth');
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setView('auth');
  };

  const handleBack = () => {
    setView('landing');
  };

  const handleLoginSuccess = (name: string, email: string) => {
    // This is now handled by onAuthStateChanged
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('landing');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const handleResetSuccess = () => {
    // Completely remove the hash from the URL including the '#' symbol
    if (window.history && window.history.replaceState) {
      const url = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', url || '/');
    } else {
      window.location.hash = '';
    }
    
    setAuthMode('login');
    setView('auth');
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (view === 'dashboard') {
    if (!hasLifetimeAccess) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <CreditCard className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Ative seu acesso vitalício</h1>
            <p className="text-slate-600 mb-8 text-lg">
              Para liberar o acesso completo ao dashboard e todas as funcionalidades do ProcVisual, é necessário concluir o pagamento único.
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                O que você recebe:
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  Acesso vitalício sem mensalidades
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  Dashboard completo de receitas e despesas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  Insights inteligentes com IA
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  Suporte prioritário
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <a 
                href="https://buy.stripe.com/6oUeV6ggQ1Kq30B9nRdMI00"
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 text-lg"
              >
                Pagar agora
                <ArrowRight className="w-5 h-5" />
              </a>
              <button 
                onClick={checkAccess}
                disabled={isCheckingAccess}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCheckingAccess ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                ) : (
                  'Já paguei, liberar acesso'
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-slate-500 font-medium hover:text-slate-800 transition-colors"
              >
                Sair da conta
              </button>
            </div>
          </motion.div>
        </div>
      );
    }
    return <Dashboard onLogout={handleLogout} userName={userName} userEmail={userEmail} />;
  }

  if (view === 'auth') {
    return <Auth onBack={handleBack} onLoginSuccess={handleLoginSuccess} initialMode={authMode} />;
  }

  if (view === 'reset-password') {
    return <ResetPassword onSuccess={handleResetSuccess} onBack={() => setView('auth')} />;
  }

  return (
    <div className="min-h-screen">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main>
        <Hero onSignup={handleSignup} />
        <Features />
        
        {/* Extra Section for better flow */}
        <section className="py-24 bg-emerald-600 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
              Pronto para transformar sua vida financeira?
            </h2>
            <p className="text-emerald-50 text-lg mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já estão economizando mais e vivendo melhor com o ProcVisual.
            </p>
            <button 
              onClick={handleSignup}
              className="bg-white text-emerald-600 px-10 py-4 rounded-full text-lg font-bold hover:bg-emerald-50 transition-all shadow-xl"
            >
              Ativar meu acesso
            </button>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
