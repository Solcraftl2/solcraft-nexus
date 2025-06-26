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

  const features = [
    {
      icon: Building,
      title: "Immobiliare",
      description: "Tokenizza proprietà immobiliari e genera rendite passive",
      stats: "€2.5M+ tokenizzati"
    },
    {
      icon: Banknote,
      title: "Startup Equity",
      description: "Investi in startup innovative con token frazionali",
      stats: "150+ startup finanziate"
    },
    {
      icon: Zap,
      title: "Energia Rinnovabile",
      description: "Partecipa a progetti green energy e sostenibilità",
      stats: "50MW+ di capacità"
    },
    {
      icon: PieChart,
      title: "Commodities",
      description: "Accesso a materie prime e beni rifugio tokenizzati",
      stats: "25+ asset class"
    }
  ];

  const stats = [
    { value: "€125M+", label: "Valore Totale Bloccato", icon: Landmark },
    { value: "12,500+", label: "Investitori Attivi", icon: Users },
    { value: "850+", label: "Asset Tokenizzati", icon: Coins },
    { value: "99.9%", label: "Uptime Garantito", icon: Shield }
  ];

  const testimonials = [
    {
      name: "Marco Rossi",
      role: "Real Estate Investor",
      company: "Rossi Holdings",
      text: "SolCraft Nexus ha rivoluzionato il modo in cui gestiamo i nostri investimenti immobiliari. La tokenizzazione ci ha permesso di diversificare e ottimizzare i rendimenti.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Elena Bianchi",
      role: "CFO",
      company: "TechStart Ventures",
      text: "La piattaforma offre una trasparenza e sicurezza senza precedenti. I nostri investitori apprezzano la possibilità di monitorare in tempo reale i loro asset.",
      rating: 5,
      avatar: "EB"
    },
    {
      name: "Giuseppe Verde",
      role: "Portfolio Manager",
      company: "Verde Capital",
      text: "L'integrazione con XRPL e la compliance automatica rendono SolCraft Nexus la scelta ideale per investimenti istituzionali di alto livello.",
      rating: 5,
      avatar: "GV"
    }
  ];

  // Auto-slide per hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">SolCraft Nexus</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise RWA Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                Documentazione
              </Button>
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                API
              </Button>
              <Button onClick={onLoginClick} className="flex items-center space-x-2">
                <Wallet size={16} />
                <span>Connetti Wallet</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section con Carousel */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <motion.div style={{ y: y1 }} className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                  <Star size={16} />
                  <span>Piattaforma #1 per RWA Tokenization</span>
                </div>
                
                <motion.h1 
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 leading-tight"
                >
                  {heroSlides[currentSlide].title}
                </motion.h1>
                
                <motion.p 
                  key={`subtitle-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-xl text-blue-600 dark:text-blue-400 font-semibold"
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.p>
                
                <motion.p 
                  key={`desc-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl"
                >
                  {heroSlides[currentSlide].description}
                </motion.p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={onLoginClick}
                  className="flex items-center space-x-2 text-lg px-8 py-4"
                >
                  <Wallet size={20} />
                  <span>Accedi alla Piattaforma</span>
                  <ArrowRight size={20} />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setIsVideoPlaying(true)}
                  className="flex items-center space-x-2 text-lg px-8 py-4"
                >
                  <Play size={20} />
                  <span>Guarda Demo</span>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 pt-6">
                <div className="flex items-center space-x-2">
                  <Shield size={20} className="text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Sicurezza Bancaria</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Compliance EU</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award size={20} className="text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">ISO 27001</span>
                </div>
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                <motion.div 
                  key={`visual-${currentSlide}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <div className="text-8xl mb-6">{heroSlides[currentSlide].image}</div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-4 text-white">
                      <div className="text-2xl font-bold">€1,250,750</div>
                      <div className="text-green-100">Portfolio Value</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">+8.5%</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Ultimo mese</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">12</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Asset attivi</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-blue-500 text-white p-3 rounded-xl shadow-lg"
              >
                <TrendingUp size={24} />
              </motion.div>
              
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 bg-green-500 text-white p-3 rounded-xl shadow-lg"
              >
                <Shield size={24} />
              </motion.div>
            </motion.div>
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center space-x-2 mt-12">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-blue-500 w-8' 
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown size={32} className="text-slate-400" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon size={32} className="text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Asset Class Supportate
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Diversifica il tuo portfolio con una vasta gamma di asset tokenizzati, 
              tutti gestiti con la massima sicurezza e trasparenza.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group hover:-translate-y-2"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {feature.description}
                  </p>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {feature.stats}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Cosa Dicono i Nostri Clienti
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Storie di successo da investitori e aziende che hanno scelto SolCraft Nexus
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Pronto a Iniziare?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Unisciti a migliaia di investitori che hanno già scelto SolCraft Nexus 
              per tokenizzare e gestire i loro asset digitali.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={onLoginClick}
                className="flex items-center space-x-2 text-lg px-8 py-4"
              >
                <Wallet size={20} />
                <span>Connetti il Tuo Wallet</span>
                <ArrowRight size={20} />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="flex items-center space-x-2 text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600"
              >
                <Globe size={20} />
                <span>Esplora la Piattaforma</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SC</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">SolCraft Nexus</h3>
                  <p className="text-slate-400 text-sm">Enterprise RWA Platform</p>
                </div>
              </div>
              <p className="text-slate-400">
                La piattaforma leader per la tokenizzazione di Real World Assets 
                con tecnologia blockchain all'avanguardia.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Tokenizzazione</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Portfolio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Sviluppatori</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SDK</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Webhooks</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Chi Siamo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carriere</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termini</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-slate-400">
              © 2025 SolCraft Nexus. Tutti i diritti riservati.
            </p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <span className="text-slate-400">Powered by XRPL</span>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;

