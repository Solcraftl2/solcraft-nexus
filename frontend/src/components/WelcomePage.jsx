import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from './ui/button';
import { 
  Coins, 
  Shield, 
  TrendingUp, 
  Users, 
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Building,
  Banknote,
  PieChart,
  Lock,
  Zap,
  Award,
  ChevronDown,
  Play,
  BarChart3,
  Landmark,
  Wallet
} from 'lucide-react';

const WelcomePage = ({ onLoginClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  const heroSlides = [
    {
      title: "Il Futuro della Tokenizzazione RWA",
      subtitle: "Trasforma i tuoi asset fisici in token digitali su XRPL",
      description: "La piattaforma enterprise per la tokenizzazione di Real World Assets con tecnologia blockchain all'avanguardia",
      image: "🏢"
    },
    {
      title: "Sicurezza di Livello Bancario",
      subtitle: "Protezione multi-livello per i tuoi investimenti",
      description: "Compliance automatica, audit trail immutabile e crittografia militare per la massima sicurezza",
      image: "🔒"
    },
    {
      title: "Portfolio Management Avanzato",
      subtitle: "Gestisci e monitora i tuoi asset in tempo reale",
      description: "Analytics professionali, reporting automatico e insights di mercato per decisioni informate",
      image: "📊"
    }
  ];

  const services = [
    {
      icon: <Building className="h-12 w-12 text-amber-600" />,
      title: "Tokenizzazione Immobiliare",
      description: "Trasforma proprietà immobiliari in token digitali frazionabili per investimenti accessibili",
      features: ["Valutazione professionale", "Compliance legale", "Liquidità immediata"]
    },
    {
      icon: <Banknote className="h-12 w-12 text-emerald-600" />,
      title: "Asset Finanziari",
      description: "Tokenizza strumenti finanziari, commodities e investimenti alternativi",
      features: ["Diversificazione portfolio", "Accesso globale", "Trasparenza totale"]
    },
    {
      icon: <PieChart className="h-12 w-12 text-blue-600" />,
      title: "Portfolio Istituzionale",
      description: "Soluzioni enterprise per gestori patrimoniali e investitori istituzionali",
      features: ["Reporting avanzato", "Risk management", "Compliance automatica"]
    },
    {
      icon: <Landmark className="h-12 w-12 text-purple-600" />,
      title: "Private Banking",
      description: "Servizi esclusivi per clienti private con patrimoni significativi",
      features: ["Consulenza dedicata", "Prodotti esclusivi", "Gestione personalizzata"]
    }
  ];

  const stats = [
    { value: "€2.5B+", label: "Asset Under Management", icon: <BarChart3 className="h-6 w-6" /> },
    { value: "150+", label: "Asset Tokenizzati", icon: <Coins className="h-6 w-6" /> },
    { value: "25+", label: "Paesi Serviti", icon: <Globe className="h-6 w-6" /> },
    { value: "99.9%", label: "Uptime Garantito", icon: <Shield className="h-6 w-6" /> }
  ];

  const benefits = [
    "Tokenizzazione professionale certificata",
    "Compliance automatica KYC/AML/MiFID II",
    "Trading su DEX nativo XRPL",
    "Rendimenti automatici distribuiti",
    "Supporto dedicato 24/7/365",
    "Assicurazione fino a €10M per cliente"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="bg-gradient-to-r from-slate-800 to-slate-600 p-3 rounded-xl">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SolCraft Nexus</h1>
                <p className="text-sm text-slate-600 font-medium">Enterprise Tokenization Platform</p>
              </div>
            </motion.div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Servizi</a>
              <a href="#platform" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Piattaforma</a>
              <a href="#about" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Chi Siamo</a>
              <a href="#contact" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Contatti</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Scopri di Più
              </Button>
              <Button 
                onClick={onLoginClick}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6"
              >
                Accedi alla Piattaforma
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
            <motion.div
              style={{ y: y1 }}
              className="text-white"
            >
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-6xl mb-6">{heroSlides[currentSlide].image}</div>
                <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  {heroSlides[currentSlide].title}
                </h2>
                <h3 className="text-xl lg:text-2xl text-slate-300 mb-6 font-light">
                  {heroSlides[currentSlide].subtitle}
                </h3>
                <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-xl">
                  {heroSlides[currentSlide].description}
                </p>
              </motion.div>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  onClick={onLoginClick}
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold"
                >
                  Inizia Ora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
                  onClick={() => setIsVideoPlaying(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Guarda Demo
                </Button>
              </div>

              {/* Slide Indicators */}
              <div className="flex space-x-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              style={{ y: y2 }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-white/80 mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-slate-300">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-4xl font-bold text-slate-900 mb-6">
                Servizi di Tokenizzazione Enterprise
              </h3>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Soluzioni complete per la digitalizzazione e tokenizzazione di asset reali, 
                con tecnologia blockchain XRPL e compliance regolamentare
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-slate-50 to-gray-50 p-8 rounded-2xl border border-slate-200 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">
                  {service.title}
                </h4>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {service.description}
                </p>
                <div className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section id="platform" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <h3 className="text-4xl font-bold mb-6">
                Tecnologia All'Avanguardia
              </h3>
              <p className="text-xl text-slate-300 mb-8">
                La nostra piattaforma combina la sicurezza di XRPL con l'innovazione 
                dei Multi-Purpose Tokens per offrire soluzioni di tokenizzazione 
                enterprise di livello mondiale.
              </p>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4"
                  >
                    <div className="bg-emerald-600 p-1 rounded-full">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Velocità</h4>
                    <p className="text-slate-300 text-sm">Transazioni in 3-5 secondi</p>
                  </div>
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Sicurezza</h4>
                    <p className="text-slate-300 text-sm">Crittografia militare</p>
                  </div>
                  <div className="text-center">
                    <Award className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Compliance</h4>
                    <p className="text-slate-300 text-sm">Regolamentazioni EU</p>
                  </div>
                  <div className="text-center">
                    <Wallet className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Liquidità</h4>
                    <p className="text-slate-300 text-sm">Trading 24/7</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Star className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h3 className="text-4xl font-bold text-white mb-6">
              Pronto per il Futuro degli Investimenti?
            </h3>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Unisciti alle istituzioni finanziarie leader che stanno già tokenizzando 
              asset per oltre €2.5 miliardi con SolCraft Nexus
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onLoginClick}
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold"
              >
                Accedi alla Piattaforma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                Richiedi Demo Privata
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-3 rounded-xl">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold">SolCraft Nexus</h4>
                  <p className="text-slate-400">Enterprise Tokenization Platform</p>
                </div>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                La piattaforma leader per la tokenizzazione di Real World Assets 
                su blockchain XRPL, con tecnologia enterprise e compliance regolamentare.
              </p>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <Globe className="h-4 w-4" />
                <span>Autorizzata • Regolamentata • Assicurata</span>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Servizi</h5>
              <ul className="space-y-2 text-slate-400">
                <li>Tokenizzazione Immobiliare</li>
                <li>Asset Finanziari</li>
                <li>Portfolio Istituzionale</li>
                <li>Private Banking</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Supporto</h5>
              <ul className="space-y-2 text-slate-400">
                <li>Centro Assistenza</li>
                <li>Documentazione API</li>
                <li>Compliance</li>
                <li>Contatti</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">
            <p>&copy; 2025 SolCraft Nexus. Tutti i diritti riservati. | Powered by XRPL</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;

