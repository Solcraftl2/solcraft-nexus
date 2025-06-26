import React, { useState } from 'react';

const LearnPage = ({ user }) => {
  const [selectedTab, setSelectedTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([1, 2, 5]);

  const [courses] = useState([
    {
      id: 1,
      title: 'Introduzione alla Tokenizzazione',
      category: 'Fondamentali',
      level: 'Principiante',
      duration: '2 ore',
      lessons: 8,
      completed: 3,
      description: 'Scopri i concetti base della tokenizzazione di asset reali e come funziona la tecnologia blockchain.',
      image: '🏠',
      topics: ['Cos\'è la tokenizzazione', 'Vantaggi per gli investitori', 'Tipi di asset tokenizzabili', 'Aspetti legali base'],
      lessons_detail: [
        { id: 1, title: 'Che cos\'è la tokenizzazione?', duration: '15 min', completed: true },
        { id: 2, title: 'Storia e evoluzione', duration: '12 min', completed: true },
        { id: 3, title: 'Vantaggi della tokenizzazione', duration: '18 min', completed: false },
        { id: 4, title: 'Tipi di asset tokenizzabili', duration: '20 min', completed: false },
        { id: 5, title: 'Blockchain e smart contract', duration: '25 min', completed: true },
        { id: 6, title: 'Aspetti legali e normativi', duration: '22 min', completed: false },
        { id: 7, title: 'Casi di studio reali', duration: '15 min', completed: false },
        { id: 8, title: 'Quiz finale', duration: '10 min', completed: false }
      ]
    },
    {
      id: 2,
      title: 'Investimenti Immobiliari Tokenizzati',
      category: 'Immobiliare',
      level: 'Intermedio',
      duration: '3 ore',
      lessons: 12,
      completed: 0,
      description: 'Approfondisci gli investimenti immobiliari attraverso la tokenizzazione: analisi, valutazione e strategie.',
      image: '🏢',
      topics: ['Valutazione immobiliare', 'Due diligence', 'Analisi dei rendimenti', 'Gestione del rischio'],
      lessons_detail: [
        { id: 1, title: 'Mercato immobiliare tradizionale vs tokenizzato', duration: '20 min', completed: false },
        { id: 2, title: 'Come valutare un immobile', duration: '25 min', completed: false },
        { id: 3, title: 'Analisi della location', duration: '18 min', completed: false },
        { id: 4, title: 'Calcolo dei rendimenti', duration: '22 min', completed: false },
        { id: 5, title: 'Rischi e mitigazione', duration: '20 min', completed: false },
        { id: 6, title: 'Due diligence documentale', duration: '30 min', completed: false },
        { id: 7, title: 'Gestione della proprietà', duration: '25 min', completed: false },
        { id: 8, title: 'Aspetti fiscali', duration: '20 min', completed: false },
        { id: 9, title: 'Liquidità e exit strategy', duration: '15 min', completed: false },
        { id: 10, title: 'Casi di studio: successi', duration: '20 min', completed: false },
        { id: 11, title: 'Casi di studio: fallimenti', duration: '15 min', completed: false },
        { id: 12, title: 'Esame finale', duration: '15 min', completed: false }
      ]
    },
    {
      id: 3,
      title: 'Investire in Startup: Equity Tokenizzato',
      category: 'Startup',
      level: 'Avanzato',
      duration: '4 ore',
      lessons: 15,
      completed: 0,
      description: 'Impara a valutare e investire in startup attraverso equity tokenizzato: analisi, metriche e strategie.',
      image: '🚀',
      topics: ['Valutazione startup', 'Metriche chiave', 'Due diligence tecnica', 'Portfolio diversification'],
      lessons_detail: [
        { id: 1, title: 'Ecosistema startup e venture capital', duration: '25 min', completed: false },
        { id: 2, title: 'Fasi di crescita delle startup', duration: '20 min', completed: false },
        { id: 3, title: 'Modelli di business e scalabilità', duration: '30 min', completed: false },
        { id: 4, title: 'Valutazione pre-money e post-money', duration: '25 min', completed: false },
        { id: 5, title: 'Metriche finanziarie chiave', duration: '22 min', completed: false },
        { id: 6, title: 'Analisi del team e management', duration: '20 min', completed: false },
        { id: 7, title: 'Mercato e competizione', duration: '25 min', completed: false },
        { id: 8, title: 'Tecnologia e proprietà intellettuale', duration: '30 min', completed: false },
        { id: 9, title: 'Due diligence legale e finanziaria', duration: '35 min', completed: false },
        { id: 10, title: 'Struttura degli investimenti', duration: '20 min', completed: false },
        { id: 11, title: 'Gestione del portfolio', duration: '25 min', completed: false },
        { id: 12, title: 'Exit strategy e liquidità', duration: '20 min', completed: false },
        { id: 13, title: 'Rischi e mitigazione', duration: '18 min', completed: false },
        { id: 14, title: 'Casi di studio: unicorni', duration: '25 min', completed: false },
        { id: 15, title: 'Progetto finale', duration: '30 min', completed: false }
      ]
    },
    {
      id: 4,
      title: 'XRPL e Tecnologia Blockchain',
      category: 'Tecnologia',
      level: 'Intermedio',
      duration: '2.5 ore',
      lessons: 10,
      completed: 0,
      description: 'Comprendi la tecnologia alla base della piattaforma: XRPL, smart contract e sicurezza blockchain.',
      image: '⛓️',
      topics: ['XRPL basics', 'Smart contracts', 'Sicurezza blockchain', 'Wallet e chiavi private'],
      lessons_detail: [
        { id: 1, title: 'Introduzione a XRPL', duration: '20 min', completed: false },
        { id: 2, title: 'Consensus algorithm', duration: '25 min', completed: false },
        { id: 3, title: 'Token e asset su XRPL', duration: '18 min', completed: false },
        { id: 4, title: 'Smart contract e automazione', duration: '22 min', completed: false },
        { id: 5, title: 'Wallet e gestione chiavi', duration: '20 min', completed: false },
        { id: 6, title: 'Sicurezza e best practices', duration: '25 min', completed: false },
        { id: 7, title: 'Transazioni e commissioni', duration: '15 min', completed: false },
        { id: 8, title: 'Interoperabilità', duration: '20 min', completed: false },
        { id: 9, title: 'Sviluppi futuri', duration: '15 min', completed: false },
        { id: 10, title: 'Hands-on: prima transazione', duration: '20 min', completed: false }
      ]
    }
  ]);

  const [articles] = useState([
    {
      id: 1,
      title: 'Il Futuro degli Investimenti Immobiliari',
      category: 'Immobiliare',
      author: 'Marco Rossi',
      date: '2025-06-20',
      readTime: '8 min',
      image: '🏠',
      excerpt: 'Come la tokenizzazione sta rivoluzionando il mercato immobiliare, rendendo gli investimenti più accessibili e liquidi...',
      content: 'Contenuto completo dell\'articolo...'
    },
    {
      id: 2,
      title: 'Startup Unicorni: Cosa Cercare negli Investimenti',
      category: 'Startup',
      author: 'Laura Bianchi',
      date: '2025-06-18',
      readTime: '12 min',
      image: '🦄',
      excerpt: 'Analisi delle caratteristiche comuni delle startup che raggiungono valutazioni miliardarie e come identificarle...',
      content: 'Contenuto completo dell\'articolo...'
    },
    {
      id: 3,
      title: 'Diversificazione del Portfolio con Asset Tokenizzati',
      category: 'Strategia',
      author: 'Giuseppe Verdi',
      date: '2025-06-15',
      readTime: '10 min',
      image: '📊',
      excerpt: 'Strategie avanzate per costruire un portfolio diversificato utilizzando asset tokenizzati di diverse categorie...',
      content: 'Contenuto completo dell\'articolo...'
    }
  ]);

  const [webinars] = useState([
    {
      id: 1,
      title: 'Live Q&A: Investimenti Immobiliari 2025',
      date: '2025-07-05',
      time: '18:00',
      duration: '60 min',
      speaker: 'Dott. Andrea Neri',
      description: 'Sessione live di domande e risposte sulle tendenze del mercato immobiliare e opportunità di investimento.',
      registered: false,
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Workshop: Valutazione Startup Tech',
      date: '2025-07-12',
      time: '19:30',
      duration: '90 min',
      speaker: 'Maria Conti',
      description: 'Workshop pratico su come valutare startup tecnologiche e identificare opportunità di investimento.',
      registered: true,
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'Blockchain e Futuro della Finanza',
      date: '2025-06-22',
      time: '17:00',
      duration: '45 min',
      speaker: 'Prof. Luca Ferrari',
      description: 'Discussione sulle implicazioni della blockchain per il futuro del sistema finanziario.',
      registered: false,
      status: 'completed'
    }
  ]);

  const calculateProgress = (course) => {
    return Math.round((course.completed / course.lessons) * 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '2rem'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: '0 0 0.5rem 0'
            }}>
              📚 Centro Educativo
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Impara tutto sugli investimenti in asset tokenizzati
            </p>
          </div>
          
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#8b5cf6',
              marginBottom: '0.5rem'
            }}>
              {completedLessons.length}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '1rem'
            }}>
              Lezioni Completate
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {[
            { id: 'courses', label: '🎓 Corsi', desc: 'Percorsi formativi' },
            { id: 'articles', label: '📰 Articoli', desc: 'Guide e insights' },
            { id: 'webinars', label: '🎥 Webinar', desc: 'Eventi live' },
            { id: 'resources', label: '📋 Risorse', desc: 'Tools e template' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: selectedTab === tab.id ? '#f8fafc' : 'transparent',
                borderBottom: selectedTab === tab.id ? '3px solid #8b5cf6' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left'
              }}
            >
              <div style={{
                fontWeight: selectedTab === tab.id ? 'bold' : 'normal',
                color: selectedTab === tab.id ? '#1e293b' : '#64748b',
                fontSize: '1rem',
                marginBottom: '0.2rem'
              }}>
                {tab.label}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}>
                {tab.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Courses Tab */}
        {selectedTab === 'courses' && (
          <div>
            {/* Progress Overview */}
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                marginBottom: '1rem'
              }}>
                🎯 Il Tuo Percorso di Apprendimento
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    {courses.length}
                  </div>
                  <div style={{
                    opacity: 0.9
                  }}>
                    Corsi Disponibili
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    {courses.reduce((sum, course) => sum + course.completed, 0)}
                  </div>
                  <div style={{
                    opacity: 0.9
                  }}>
                    Lezioni Completate
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    {Math.round(courses.reduce((sum, course) => sum + calculateProgress(course), 0) / courses.length)}%
                  </div>
                  <div style={{
                    opacity: 0.9
                  }}>
                    Progresso Medio
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {courses.map(course => (
                <div
                  key={course.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.3s',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedCourse(course)}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Course Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    padding: '1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        fontSize: '2rem'
                      }}>
                        {course.image}
                      </div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1.3rem',
                          fontWeight: 'bold'
                        }}>
                          {course.title}
                        </h3>
                        <p style={{
                          margin: 0,
                          opacity: 0.9,
                          fontSize: '0.9rem'
                        }}>
                          {course.category} • {course.level}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}>
                          {course.lessons} Lezioni
                        </div>
                        <div style={{
                          opacity: 0.9,
                          fontSize: '0.9rem'
                        }}>
                          {course.duration}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#10b981'
                        }}>
                          {calculateProgress(course)}%
                        </div>
                        <div style={{
                          opacity: 0.9,
                          fontSize: '0.8rem'
                        }}>
                          Completato
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div style={{ padding: '1.5rem' }}>
                    <p style={{
                      color: '#64748b',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      lineHeight: '1.5'
                    }}>
                      {course.description}
                    </p>

                    {/* Topics */}
                    <div style={{
                      marginBottom: '1rem'
                    }}>
                      <h5 style={{
                        color: '#1e293b',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        Argomenti trattati:
                      </h5>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {course.topics.slice(0, 3).map((topic, index) => (
                          <span
                            key={index}
                            style={{
                              background: '#f0f9ff',
                              color: '#0369a1',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              border: '1px solid #bae6fd'
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                        {course.topics.length > 3 && (
                          <span style={{
                            color: '#64748b',
                            fontSize: '0.8rem',
                            padding: '0.3rem 0.6rem'
                          }}>
                            +{course.topics.length - 3} altri
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#64748b'
                        }}>
                          Progresso: {course.completed}/{course.lessons} lezioni
                        </span>
                      </div>
                      <div style={{
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        height: '8px'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          height: '100%',
                          width: `${calculateProgress(course)}%`,
                          borderRadius: '8px'
                        }} />
                      </div>
                    </div>

                    <button
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: course.completed > 0 
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {course.completed > 0 ? '📚 Continua Corso' : '🚀 Inizia Corso'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Articles Tab */}
        {selectedTab === 'articles' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem'
            }}>
              {articles.map(article => (
                <div
                  key={article.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                    padding: '2rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '3rem',
                      marginBottom: '1rem'
                    }}>
                      {article.image}
                    </div>
                    <span style={{
                      background: '#3b82f6',
                      color: 'white',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {article.category}
                    </span>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{
                      color: '#1e293b',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      {article.title}
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem',
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      <span>👤 {article.author}</span>
                      <span>📅 {article.date}</span>
                      <span>⏱️ {article.readTime}</span>
                    </div>

                    <p style={{
                      color: '#64748b',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      marginBottom: '1.5rem'
                    }}>
                      {article.excerpt}
                    </p>

                    <button
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      📖 Leggi Articolo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Webinars Tab */}
        {selectedTab === 'webinars' && (
          <div>
            <div style={{
              display: 'grid',
              gap: '2rem'
            }}>
              {webinars.map(webinar => (
                <div
                  key={webinar.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    background: webinar.status === 'upcoming' 
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #64748b, #475569)',
                    color: 'white',
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.3rem'
                      }}>
                        {webinar.title}
                      </h3>
                      <p style={{
                        margin: 0,
                        opacity: 0.9
                      }}>
                        🎤 {webinar.speaker} • {webinar.duration}
                      </p>
                    </div>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}>
                        {webinar.date}
                      </div>
                      <div style={{
                        opacity: 0.9
                      }}>
                        {webinar.time}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <p style={{
                      color: '#64748b',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      marginBottom: '1.5rem'
                    }}>
                      {webinar.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center'
                    }}>
                      {webinar.status === 'upcoming' && (
                        <button
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: webinar.registered 
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {webinar.registered ? '✅ Registrato' : '📝 Registrati'}
                        </button>
                      )}
                      
                      {webinar.status === 'completed' && (
                        <button
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          🎥 Guarda Registrazione
                        </button>
                      )}

                      <div style={{
                        background: webinar.status === 'upcoming' ? '#f0fdf4' : '#f1f5f9',
                        color: webinar.status === 'upcoming' ? '#15803d' : '#64748b',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {webinar.status === 'upcoming' ? '🔴 Prossimo' : '✅ Completato'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {selectedTab === 'resources' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {[
                {
                  title: 'Calcolatore ROI Immobiliare',
                  description: 'Tool per calcolare il ritorno sull\'investimento per proprietà immobiliari tokenizzate.',
                  icon: '🏠',
                  type: 'Calculator'
                },
                {
                  title: 'Template Due Diligence',
                  description: 'Checklist completa per valutare startup e opportunità di investimento.',
                  icon: '📋',
                  type: 'Template'
                },
                {
                  title: 'Glossario Finanziario',
                  description: 'Dizionario completo dei termini finanziari e blockchain utilizzati nella piattaforma.',
                  icon: '📚',
                  type: 'Reference'
                },
                {
                  title: 'Guida Fiscale',
                  description: 'Informazioni sugli aspetti fiscali degli investimenti in asset tokenizzati.',
                  icon: '💼',
                  type: 'Guide'
                }
              ].map((resource, index) => (
                <div
                  key={index}
                  style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    transition: 'transform 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>
                    {resource.icon}
                  </div>
                  
                  <span style={{
                    background: '#f0f9ff',
                    color: '#0369a1',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    display: 'inline-block'
                  }}>
                    {resource.type}
                  </span>

                  <h3 style={{
                    color: '#1e293b',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                  }}>
                    {resource.title}
                  </h3>

                  <p style={{
                    color: '#64748b',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    marginBottom: '1.5rem'
                  }}>
                    {resource.description}
                  </p>

                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    📥 Scarica Risorsa
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              padding: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h2 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.8rem'
                }}>
                  {selectedCourse.image} {selectedCourse.title}
                </h2>
                <p style={{
                  margin: 0,
                  opacity: 0.9
                }}>
                  {selectedCourse.category} • {selectedCourse.level} • {selectedCourse.duration}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <p style={{
                color: '#64748b',
                fontSize: '1rem',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                {selectedCourse.description}
              </p>

              <h4 style={{
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                📋 Programma del Corso
              </h4>

              <div style={{
                display: 'grid',
                gap: '0.5rem'
              }}>
                {selectedCourse.lessons_detail.map(lesson => (
                  <div
                    key={lesson.id}
                    style={{
                      background: lesson.completed ? '#f0fdf4' : '#f8fafc',
                      border: lesson.completed ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        background: lesson.completed ? '#10b981' : '#e2e8f0',
                        color: lesson.completed ? 'white' : '#64748b',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {lesson.completed ? '✓' : lesson.id}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}>
                          {lesson.title}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#64748b'
                        }}>
                          {lesson.duration}
                        </div>
                      </div>
                    </div>
                    
                    {!lesson.completed && (
                      <button
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ▶️ Inizia
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '2rem',
                textAlign: 'center'
              }}>
                <button
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                  onClick={() => {
                    alert(`Iniziando il corso: ${selectedCourse.title}`);
                    setSelectedCourse(null);
                  }}
                >
                  🚀 {selectedCourse.completed > 0 ? 'Continua Corso' : 'Inizia Corso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnPage;

