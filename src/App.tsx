/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header, Hero, Features, Footer } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [view, setView] = React.useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');

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

  const handleLoginSuccess = () => {
    setView('dashboard');
  };

  const handleLogout = () => {
    setView('landing');
  };

  if (view === 'dashboard') {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (view === 'auth') {
    return <Auth onBack={handleBack} onLoginSuccess={handleLoginSuccess} initialMode={authMode} />;
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
