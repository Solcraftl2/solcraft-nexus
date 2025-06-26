import React, { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  FileText, 
  Video, 
  Users, 
  Award,
  Clock,
  CheckCircle,
  ArrowRight,
  Download,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

const LearnPage = ({ user }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedLessons, setCompletedLessons] = useState(['basics-1', 'basics-2']);

  const categories = [
    { id: 'all', label: 'Tutti i Corsi' },
    { id: 'basics', label: 'Fondamentali' },
    { id: 'advanced', label: 'Avanzato' },
    { id: 'legal', label: 'Aspetti Legali' },
    { id: 'technical', label: 'Tecnico' }
  ];

  const courses = [
    {
      id: 'basics-tokenization',
      title: 'Introduzione alla Tokenizzazione',
      category: 'basics',
      description: 'Scopri i concetti base della tokenizzazione di asset reali.',
      duration: '45 min',
      lessons: 6,
      level: 'Principiante',
      progress: 33,
      type: 'video',
      featured: true
    },
    {
      id: 'blockchain-fundamentals',
      title: 'Fondamenti di Blockchain',
      category: 'basics',
      description: 'Comprendi come funziona la tecnologia blockchain.',
      duration: '60 min',
      lessons: 8,
      level: 'Principiante',
      progress: 0,
      type: 'interactive',
      featured: false
    },
    {
      id: 'xrpl-deep-dive',
      title: 'XRPL per Sviluppatori',
      category: 'technical',
      description: 'Guida completa al XRP Ledger per sviluppatori.',
      duration: '120 min',
      lessons: 12,
      level: 'Avanzato',
      progress: 0,
      type: 'code',
      featured: false
    },
    {
      id: 'legal-compliance',
      title: 'Compliance e Regolamentazione',
      category: 'legal',
      description: 'Aspetti legali della tokenizzazione in Europa.',
      duration: '90 min',
      lessons: 10,
      level: 'Intermedio',
      progress: 0,
      type: 'document',
      featured: false
    }
  ];

  const resources = [
    {
      id: 1,
      title: 'Whitepaper SolCraft Nexus',
      type: 'PDF',
      size: '2.4 MB',
      description: 'Documento tecnico completo sulla piattaforma',
      icon: FileText
    },
    {
      id: 2,
      title: 'Guida API Developer',
      type: 'PDF',
      size: '1.8 MB',
      description: 'Documentazione completa delle API',
      icon: FileText
    },
    {
      id: 3,
      title: 'Video Tutorial Completo',
      type: 'Video',
      size: '45 min',
      description: 'Tutorial passo-passo per iniziare',
      icon: Video
    }
  ];

  const filteredCourses = courses.filter(course => 
    selectedCategory === 'all' || course.category === selectedCategory
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return Video;
      case 'interactive':
        return Play;
      case 'code':
        return FileText;
      case 'document':
        return BookOpen;
      default:
        return BookOpen;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Principiante':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Intermedio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Avanzato':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Centro Formativo
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Impara tutto sulla tokenizzazione e blockchain
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Corsi Completati</h3>
              <p className="text-blue-100 text-sm">Il tuo progresso</p>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">
            {completedLessons.length}
          </div>
          <div className="text-blue-100">
            di {courses.reduce((sum, course) => sum + course.lessons, 0)} lezioni
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Award size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Certificazioni</h3>
              <p className="text-green-100 text-sm">Ottenute</p>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">1</div>
          <div className="text-green-100">Tokenization Basics</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Tempo Totale</h3>
              <p className="text-purple-100 text-sm">Di studio</p>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">12h</div>
          <div className="text-purple-100">Questa settimana</div>
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Featured Course */}
      {filteredCourses.some(course => course.featured) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Play size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Corso in Evidenza</h3>
                <p className="text-indigo-100">Inizia il tuo percorso di apprendimento</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Inizia Ora
            </Button>
          </div>
          
          {filteredCourses.filter(course => course.featured).map(course => (
            <div key={course.id} className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-2">{course.title}</h4>
              <p className="text-indigo-100 mb-3">{course.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span>{course.duration}</span>
                <span>•</span>
                <span>{course.lessons} lezioni</span>
                <span>•</span>
                <span>{course.level}</span>
              </div>
              {course.progress > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progresso</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.filter(course => !course.featured).map((course, index) => {
          const TypeIcon = getTypeIcon(course.type);
          
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <TypeIcon size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                  {course.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {course.description}
                </p>

                <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen size={14} />
                    <span>{course.lessons} lezioni</span>
                  </div>
                </div>

                {course.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button className="w-full group-hover:scale-105 transition-transform">
                  {course.progress > 0 ? 'Continua' : 'Inizia Corso'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resources Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Risorse Aggiuntive
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Documenti e materiali di approfondimento
          </p>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {resources.map((resource) => {
            const Icon = resource.icon;
            
            return (
              <div key={resource.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Icon size={20} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {resource.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-500 mt-1">
                      <span>{resource.type}</span>
                      <span>•</span>
                      <span>{resource.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download size={16} className="mr-2" />
                    Scarica
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearnPage;

