import React from 'react';
import { LayoutDashboard, Lightbulb, Target, ArrowRight, CheckCircle2, Menu, X } from 'lucide-react';
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
            Controle suas finanças <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">sem complicação</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Veja para onde seu dinheiro está indo e tome decisões inteligentes com dashboards automáticos e relatórios detalhados.
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
      icon: <LayoutDashboard className="w-8 h-8 text-emerald-600" />,
      title: "Visualize tudo em um só lugar",
      description: "Conecte suas contas e tenha uma visão clara de seus gastos e receitas em tempo real."
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-amber-500" />,
      title: "Receba insights inteligentes",
      description: "Nossa IA analisa seus padrões de consumo e sugere formas de economizar mais."
    },
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: "Alcance suas metas financeiras",
      description: "Defina objetivos e acompanhe seu progresso com ferramentas de planejamento intuitivas."
    }
  ];

  return (
    <section id="recursos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all group"
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
