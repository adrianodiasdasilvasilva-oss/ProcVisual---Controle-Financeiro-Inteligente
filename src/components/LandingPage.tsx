import React from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Target, 
  ArrowRight, 
  CheckCircle2, 
  Menu, 
  X, 
  MessageCircle, 
  FileText, 
  Smartphone, 
  Headphones, 
  BarChart3,
  ShieldCheck,
  Zap,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

export const Header = ({ onLogin, onSignup }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
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
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Recursos</a>
            <a href="#precos" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Preços</a>
            <button 
              onClick={onLogin}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={onSignup}
              className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all"
            >
              Ativar meu acesso
            </button>
          </nav>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4"
        >
          <a href="#recursos" className="block text-base font-medium text-slate-600">Recursos</a>
          <a href="#precos" className="block text-base font-medium text-slate-600">Preços</a>
          <button 
            onClick={onLogin}
            className="block w-full text-left text-base font-medium text-slate-600"
          >
            Login
          </button>
          <button 
            onClick={onSignup}
            className="w-full bg-emerald-600 text-white px-5 py-3 rounded-xl text-base font-medium"
          >
            Ativar meu acesso
          </button>
        </motion.div>
      )}
    </header>
  );
};

interface HeroProps {
  onSignup: () => void;
}

export const Hero = ({ onSignup }: HeroProps) => {
  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50/50 to-transparent">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6">
            Sua vida financeira <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">na palma da mão</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            O ProcVisual é o controle inteligente que te avisa no WhatsApp, gera relatórios instantâneos e te ajuda a tomar as melhores decisões para o seu dinheiro.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button 
              onClick={onSignup}
              className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
            >
              Ativar meu acesso
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto bg-white text-slate-700 px-8 py-4 rounded-full text-lg font-semibold border border-slate-200 hover:bg-slate-50 transition-all">
              Ver demonstração
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-3xl p-4 md:p-8 card-shadow border border-slate-100 overflow-hidden">
            {/* Mockup Dashboard Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-bottom border-slate-100">
              <div className="flex gap-4">
                <div className="w-32 h-8 bg-slate-100 rounded-md animate-pulse"></div>
                <div className="w-24 h-8 bg-slate-100 rounded-md animate-pulse"></div>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
            
            {/* Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl mb-4 shadow-sm"></div>
                  <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                  <div className="h-8 w-32 bg-slate-300 rounded"></div>
                </div>
              ))}
            </div>

            {/* Mockup Chart Area */}
            <div className="h-64 bg-slate-50 rounded-2xl border border-slate-100 p-6 flex items-end gap-2">
              {[40, 70, 45, 90, 65, 80, 55, 95, 75, 60, 85, 50].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-emerald-500/20 rounded-t-lg transition-all hover:bg-emerald-500/40"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
        </motion.div>
      </div>
    </section>
  );
};

export const Features = () => {
  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-emerald-500" />,
      title: "Notificações no WhatsApp",
      description: "Receba alertas automáticos das suas contas a vencer diretamente no seu WhatsApp. Nunca mais esqueça um pagamento."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: "Tomada de Decisão",
      description: "Informações claras em uma única tela para você saber exatamente para onde seu dinheiro está indo e decidir com confiança."
    },
    {
      icon: <FileText className="w-8 h-8 text-slate-700" />,
      title: "Relatórios Inteligentes",
      description: "Extraia relatórios detalhados em PDF ou Excel e compartilhe resumos financeiros via WhatsApp com um clique."
    },
    {
      icon: <Target className="w-8 h-8 text-rose-500" />,
      title: "Simulador de Metas",
      description: "Planeje seus sonhos com nosso simulador. Defina quanto quer poupar e acompanhe seu progresso mês a mês."
    },
    {
      icon: <Smartphone className="w-8 h-8 text-indigo-600" />,
      title: "App no seu Celular",
      description: "Instale o ProcVisual como um aplicativo no seu celular sem precisar baixar nada na loja. Rápido e prático."
    },
    {
      icon: <Headphones className="w-8 h-8 text-emerald-600" />,
      title: "Suporte VIP via WhatsApp",
      description: "Clientes ativos contam com suporte humanizado e prioritário da equipe ProcVisual diretamente pelo WhatsApp."
    }
  ];

  return (
    <section id="recursos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tudo o que você precisa para prosperar</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Funcionalidades exclusivas desenhadas para quem busca clareza e controle total.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all group"
            >
              <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const WhatsAppSection = () => {
  return (
    <section className="py-24 bg-slate-900 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold mb-6 border border-emerald-500/20">
                Diferencial Exclusivo
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Seu financeiro conversa <br />
                <span className="text-emerald-400">com seu WhatsApp</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Esqueça planilhas complexas que você nunca abre. O ProcVisual te mantém informado onde você já está. Receba alertas de vencimento, envie relatórios para sócios ou familiares e tire dúvidas com nosso suporte, tudo pelo WhatsApp.
              </p>
              
              <div className="space-y-4">
                {[
                  "Alertas de contas a pagar e receber",
                  "Envio de relatórios PDF/Excel por mensagem",
                  "Resumos financeiros rápidos via chat",
                  "Suporte técnico humanizado e instantâneo"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          <div className="flex-1 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              {/* Mockup WhatsApp UI */}
              <div className="bg-[#E5DDD5] w-full max-w-[320px] mx-auto rounded-[32px] border-[8px] border-slate-800 shadow-2xl overflow-hidden aspect-[9/19]">
                <div className="bg-[#075E54] p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden">
                    <img src="https://i.imgur.com/mPPZOMY.jpeg" alt="ProcVisual" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">ProcVisual Notifica</p>
                    <p className="text-emerald-200 text-[10px]">online</p>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%]">
                    <p className="text-[11px] text-slate-800">Olá! 👋 Passando para avisar que a conta <b>Aluguel</b> vence amanhã (12/03).</p>
                    <p className="text-[9px] text-slate-400 text-right mt-1">09:41</p>
                  </div>
                  
                  <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none shadow-sm max-w-[85%] ml-auto">
                    <p className="text-[11px] text-slate-800">Obrigado! Pode me enviar o relatório de gastos deste mês?</p>
                    <p className="text-[9px] text-slate-400 text-right mt-1">09:42</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%]">
                    <p className="text-[11px] text-slate-800">Com certeza! Segue o relatório detalhado em PDF e Excel. 👇</p>
                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-[9px] font-bold">Relatorio_Março.pdf</span>
                    </div>
                    <p className="text-[9px] text-slate-400 text-right mt-1">09:42</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/20 rounded-full blur-[100px] -z-10"></div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Pricing = ({ onSignup }: { onSignup: () => void }) => {
  return (
    <section id="precos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Acesso Vitalício</h2>
          <p className="text-slate-600">Sem mensalidades, sem taxas escondidas. Pague uma vez e use para sempre.</p>
        </div>
        
        <div className="max-w-lg mx-auto bg-white rounded-[32px] border-2 border-emerald-500 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-2xl text-xs font-bold uppercase tracking-widest">
            Oferta Especial
          </div>
          
          <div className="p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Pro Vitalício</h3>
            <div className="flex items-center justify-center gap-1 mb-6">
              <span className="text-slate-400 text-lg line-through">R$ 297</span>
              <span className="text-slate-900 text-5xl font-black">R$ 97</span>
              <span className="text-slate-500 font-medium">/único</span>
            </div>
            
            <ul className="space-y-4 text-left mb-10">
              {[
                "Dashboard Financeiro Completo",
                "Notificações de Contas via WhatsApp",
                "Relatórios em PDF e Excel",
                "Simulador de Metas e Objetivos",
                "Instalação como App no Celular",
                "Suporte VIP via WhatsApp",
                "Atualizações Vitalícias Inclusas"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={onSignup}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
            >
              Ativar meu acesso agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Pagamento seguro e garantia de 7 dias
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
              <img 
                src="https://i.imgur.com/mPPZOMY.jpeg" 
                alt="ProcVisual Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">ProcVisual</span>
          </div>
          
          <nav className="flex gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Termos</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Privacidade</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contato</a>
          </nav>

          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} ProcVisual. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};
