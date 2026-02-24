/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header, Hero, Features, Footer } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

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

  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#reset-password') {
        setView('reset-password');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');

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
    setUserName(name);
    setUserEmail(email);
    setView('dashboard');
  };

  const handleLogout = () => {
    setView('landing');
  };

  if (view === 'dashboard') {
    return <Dashboard onLogout={handleLogout} userName={userName} userEmail={userEmail} />;
  }

  if (view === 'auth') {
    return <Auth onBack={handleBack} onLoginSuccess={handleLoginSuccess} initialMode={authMode} />;
  }

  if (view === 'reset-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Redefinir Senha</h1>
          <p className="text-slate-500 mb-8">Digite sua nova senha abaixo para recuperar o acesso à sua conta.</p>
          
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setView('auth'); }}>
            <input 
              type="password" 
              placeholder="Nova senha" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            <input 
              type="password" 
              placeholder="Confirmar nova senha" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Salvar Nova Senha
            </button>
          </form>
          
          <button 
            onClick={() => setView('auth')}
            className="mt-6 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
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
              Criar minha conta grátis
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
