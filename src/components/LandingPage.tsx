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
  onShowDemo: () => void;
}

export const Header = ({ onLogin, onSignup, onShowDemo }: HeaderProps) => {
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
            onClick={() => {
              onSignup();
              setIsMenuOpen(false);
            }}
            className="w-full bg-emerald-600 text-white px-5 py-3 rounded-xl text-base font-medium"
          >
            Ativar meu acesso
          </button>
          <button 
            onClick={() => {
              onShowDemo();
              setIsMenuOpen(false);
            }}
            className="w-full bg-white text-slate-700 px-5 py-3 rounded-xl text-base font-medium border border-slate-200"
          >
            Ver demonstração
          </button>
        </motion.div>
      )}
    </header>
  );
};

interface HeroProps {
  onSignup: () => void;
  onShowDemo: () => void;
}

export const Hero = ({ onSignup, onShowDemo }: HeroProps) => {
  return (
    <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-blue-50/50 to-transparent">
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
            A ProcVisual é o controle inteligente que te avisa direto no celular, gera relatórios instantâneos e te ajuda a tomar as melhores decisões para o seu dinheiro.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onSignup}
              className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
            >
              Ativar meu acesso
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onShowDemo}
              className="w-full sm:w-auto bg-white text-slate-700 px-8 py-4 rounded-full text-lg font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Ver demonstração
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export const DemoModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-2xl border-[8px] border-slate-800"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm"
        >
          <X className="w-6 h-6" />
        </button>
        
        <iframe 
          src="https://drive.google.com/file/d/1S9M_VGp46kLeITAcyFip47B7j-xug25U/preview"
          className="w-full h-full border-none"
          allow="autoplay"
          allowFullScreen
        ></iframe>
      </motion.div>
    </div>
  );
};

export const Features = () => {
  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-emerald-500" />,
      title: "Notificações no Whatsapp",
      description: "Receba avisos automáticos das suas contas a vencer diretamente no seu WhatsApp. Nunca mais esqueça um pagamento."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: "Tomada de Decisão",
      description: "Informações claras em uma única tela para você saber exatamente para onde seu dinheiro está indo e decidir com confiança."
    },
    {
      icon: <FileText className="w-8 h-8 text-slate-700" />,
      title: "Relatórios Instantâneos",
      description: "Extraia relatórios detalhados em PDF ou Excel e compartilhe resumos financeiros de forma simples com um clique."
    },
    {
      icon: <Target className="w-8 h-8 text-rose-500" />,
      title: "Simulador de Metas",
      description: "Planeje seus sonhos com nosso simulador. Defina quanto quer poupar e acompanhe seu progresso mês a mês."
    },
    {
      icon: <Smartphone className="w-8 h-8 text-indigo-600" />,
      title: "App no seu Celular",
      description: "Instale a ProcVisual como um aplicativo no seu celular sem precisar baixar nada na loja. Rápido e prático."
    },
    {
      icon: <Headphones className="w-8 h-8 text-emerald-600" />,
      title: "Suporte VIP Prioritário",
      description: "Clientes ativos contam com suporte humanizado e prioritário da equipe ProcVisual sempre que você precisar."
    }
  ];

  return (
    <section id="recursos" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tudo o que você precisa para organizar sua vida financeira</h2>
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
                <span className="text-emerald-400">onde você já está</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Esqueça planilhas complexas que você nunca abre. A ProcVisual te mantém informado no seu Whatsapp. Receba alertas de vencimento, envie relatórios para sócios ou familiares e tire dúvidas com nosso suporte, tudo de forma prática.
              </p>
              
              <div className="space-y-4">
                {[
                  "Alertas de contas a pagar",
                  "Envio de relatórios em PDF por mensagem",
                  "Resumos financeiros rápidos",
                  "Suporte técnico humanizado"
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
              <div className="bg-[#E5DDD5] w-full max-w-[320px] mx-auto rounded-[32px] border-[8px] border-slate-800 shadow-2xl overflow-hidden min-h-[400px] pb-8">
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
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[95%]">
                    <div className="text-[10px] text-slate-800 space-y-1">
                      <p>Olá! 👋 Passando para avisar que a sua categoria de <b>Moradia</b> vence 11/03/2026</p>
                      <p>━━━━━━━━━━━━━━━</p>
                      <p>🧾 Descrição: Internet</p>
                      <p>💰 Valor: R$ 100,00</p>
                      <p>━━━━━━━━━━━━━━━</p>
                      <p>📊 Resumo do mês:</p>
                      <p>• Total gasto: R$ 1.837,27</p>
                      <p>• Restante do orçamento: R$ 1.662,73</p>
                      <br />
                      <p>⚠️ Atenção: Você já utilizou 52% da sua receita.</p>
                      <p>━━━━━━━━━━━━━━━</p>
                    </div>
                    <p className="text-[8px] text-slate-400 text-right mt-1">09:41</p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Plano Mensal</h2>
          <p className="text-slate-600">Controle total das suas finanças com o melhor custo-benefício.</p>
        </div>
        
        <div className="max-w-lg mx-auto bg-white rounded-[32px] border-2 border-emerald-500 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-2xl text-xs font-bold uppercase tracking-widest">
            Oferta Especial
          </div>
          
          <div className="p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Pro Mensal</h3>
            <div className="flex items-center justify-center gap-1 mb-6">
              <span className="text-slate-400 text-lg line-through">R$ 49,90</span>
              <span className="text-slate-900 text-5xl font-black">R$ 19,90</span>
              <span className="text-slate-500 font-medium">/mês</span>
            </div>
            
            <ul className="space-y-4 text-left mb-10">
              {[
                "Dashboard Financeiro Completo",
                "Notificações de Contas Automáticas",
                "Relatórios em PDF e Excel",
                "Simulador de Metas e Objetivos",
                "Instalação como App no Celular",
                "Suporte VIP Humanizado",
                "Atualizações Inclusas"
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
          </div>
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  const [activeModal, setActiveModal] = React.useState<'terms' | 'privacy' | 'contact' | 'about' | null>(null);

  const modals = {
    terms: {
      title: "Termos de Uso",
      content: (
        <div className="space-y-6 text-slate-600">
          <section>
            <h4 className="font-bold text-slate-900 mb-2">1. Aceitação dos termos</h4>
            <p>Ao utilizar a ProcVisual, você concorda com os termos e condições descritos nesta página.</p>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 mb-2">2. Uso da plataforma</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>O usuário é responsável pelos dados inseridos.</li>
              <li>A ProcVisual é uma ferramenta de organização financeira.</li>
              <li>Não oferecemos aconselhamento financeiro profissional.</li>
            </ul>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 mb-2">3. Responsabilidade do usuário</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manter senha segura.</li>
              <li>Informações financeiras são inseridas pelo próprio usuário.</li>
            </ul>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 mb-2">4. Limitação de responsabilidade</h4>
            <p>A ProcVisual não se responsabiliza por decisões financeiras tomadas com base nas informações registradas no sistema.</p>
          </section>
          <section>
            <h4 className="font-bold text-slate-900 mb-2">5. Alterações</h4>
            <p>Os termos podem ser atualizados a qualquer momento para melhorar o serviço.</p>
          </section>
        </div>
      )
    },
    privacy: {
      title: "Política de Privacidade",
      content: (
        <div className="space-y-6 text-slate-600">
          <p>Utilizamos práticas de segurança para proteger suas informações. Seus dados financeiros são privados e não são vendidos ou compartilhados com terceiros.</p>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <p className="text-emerald-800 font-medium text-sm">Seus dados financeiros são visíveis apenas para você.</p>
          </div>
          <p>O usuário pode solicitar a exclusão de seus dados a qualquer momento.</p>
        </div>
      )
    },
    contact: {
      title: "Contato",
      content: (
        <div className="space-y-6 text-slate-600">
          <div className="text-center py-4">
            <h4 className="font-bold text-slate-900 text-xl mb-2">Suporte ProcVisual</h4>
            <p className="mb-6">Se tiver dúvidas, sugestões ou problemas, entre em contato:</p>
            <a href="mailto:procvisual.dashboard@gmail.com" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
              📧 Email: procvisual.dashboard@gmail.com
            </a>
          </div>
          <p className="text-center text-sm italic">Nossa equipe está sempre trabalhando para melhorar a ProcVisual. Ficaremos felizes em ouvir você.</p>
        </div>
      )
    },
    about: {
      title: "Sobre a ProcVisual",
      content: (
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>A ProcVisual foi criada para ajudar pessoas a visualizar suas finanças de forma simples, clara e inteligente.</p>
          <p>Acreditamos que entender para onde o dinheiro está indo é o primeiro passo para conquistar uma vida financeira mais equilibrada. Por isso, a ProcVisual oferece ferramentas práticas para registrar receitas, acompanhar despesas e analisar hábitos financeiros de forma visual e fácil de compreender.</p>
          <p>Com gráficos intuitivos, relatórios organizados e indicadores de saúde financeira, nossa missão é transformar números em informações úteis para o dia a dia. Assim, cada usuário pode tomar decisões financeiras com mais consciência, planejamento e segurança.</p>
          <p>A ProcVisual foi pensada para ser acessível a qualquer pessoa, independentemente do nível de conhecimento em finanças. Nosso objetivo é simplificar o controle financeiro e ajudar você a ter mais clareza sobre sua vida financeira.</p>
          <p>Estamos sempre trabalhando para melhorar a plataforma e desenvolver novas funcionalidades que tornem a experiência cada vez mais prática, eficiente e útil para nossos usuários.</p>
          <p className="font-bold text-slate-900 mt-6">ProcVisual — visualize melhor suas finanças e tome decisões mais inteligentes.</p>
        </div>
      )
    }
  };

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
          
          <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
            <button onClick={() => setActiveModal('about')} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Sobre</button>
            <button onClick={() => setActiveModal('terms')} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Termos</button>
            <button onClick={() => setActiveModal('privacy')} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Privacidade</button>
            <button onClick={() => setActiveModal('contact')} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contato</button>
          </nav>

          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} ProcVisual. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{modals[activeModal].title}</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              {modals[activeModal].content}
            </div>
            <div className="p-6 border-t border-slate-100 text-center bg-slate-50/50">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </footer>
  );
};
