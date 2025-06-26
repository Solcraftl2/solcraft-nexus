import React, { useState } from 'react';
import LoginModal from './LoginModal';

const WelcomePage = ({ onLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginSuccess = (userData) => {
    setShowLoginModal(false);
    onLogin(userData);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              SC
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e3a8a'
              }}>
                SolCraft Nexus
              </h1>
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                Tokenizzazione RWA su XRPL
              </p>
            </div>
          </div>

          <nav style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <a href="#services" style={{
              textDecoration: 'none',
              color: '#475569',
              fontWeight: '500',
              transition: 'color 0.3s'
            }}>
              Servizi
            </a>
            <a href="#about" style={{
              textDecoration: 'none',
              color: '#475569',
              fontWeight: '500',
              transition: 'color 0.3s'
            }}>
              Chi Siamo
            </a>
            <a href="#contact" style={{
              textDecoration: 'none',
              color: '#475569',
              fontWeight: '500',
              transition: 'color 0.3s'
            }}>
              Contatti
            </a>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                fontSize: '0.9rem'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Accedi
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9), rgba(59, 130, 246, 0.8)), url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '1000px',
          padding: '0 2rem'
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            La Prima Piattaforma Enterprise per la Tokenizzazione di Real World Assets
          </h1>
          
          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
            marginBottom: '3rem',
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto 3rem auto'
          }}>
            Oltre 5 anni di esperienza nella tokenizzazione di asset reali su XRPL. 
            Trasformiamo proprietà immobiliari, opere d'arte e investimenti in token digitali sicuri e liquidi.
          </p>

          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '4rem'
          }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'white',
                color: '#1e3a8a',
                border: 'none',
                padding: '1rem 2.5rem',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 35px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
              }}
            >
              🚀 Inizia Ora
            </button>
            
            <button
              style={{
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                padding: '1rem 2.5rem',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#1e3a8a';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              📖 Scopri di Più
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                €50M+
              </div>
              <div style={{ opacity: 0.9 }}>Asset Tokenizzati</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                1,200+
              </div>
              <div style={{ opacity: 0.9 }}>Investitori Attivi</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                99.9%
              </div>
              <div style={{ opacity: 0.9 }}>Uptime Garantito</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                24/7
              </div>
              <div style={{ opacity: 0.9 }}>Supporto Enterprise</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{
        padding: '6rem 2rem',
        background: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              I Nostri Servizi
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Soluzioni complete per la tokenizzazione e gestione di asset digitali
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {/* Tokenizzazione Immobiliare */}
            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'transform 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                fontSize: '1.5rem'
              }}>
                🏠
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Tokenizzazione Immobiliare
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Trasforma proprietà immobiliari in token digitali frazionabili. 
                Accesso democratico agli investimenti immobiliari con liquidità istantanea.
              </p>
              <ul style={{
                color: '#64748b',
                paddingLeft: '1.2rem'
              }}>
                <li>Frazionamento automatico</li>
                <li>Liquidità 24/7</li>
                <li>Rendimenti distribuiti automaticamente</li>
                <li>Compliance normativa completa</li>
              </ul>
            </div>

            {/* Asset Management */}
            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'transform 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                fontSize: '1.5rem'
              }}>
                📊
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Asset Management Digitale
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Gestione professionale di portafogli di asset tokenizzati con 
                algoritmi avanzati e strategie di investimento personalizzate.
              </p>
              <ul style={{
                color: '#64748b',
                paddingLeft: '1.2rem'
              }}>
                <li>Portfolio diversificati</li>
                <li>Rebalancing automatico</li>
                <li>Analytics in tempo reale</li>
                <li>Risk management avanzato</li>
              </ul>
            </div>

            {/* Marketplace */}
            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'transform 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                fontSize: '1.5rem'
              }}>
                🛒
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Marketplace Istituzionale
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Piattaforma di trading sicura per asset tokenizzati con 
                liquidità istituzionale e spread competitivi.
              </p>
              <ul style={{
                color: '#64748b',
                paddingLeft: '1.2rem'
              }}>
                <li>Trading istituzionale</li>
                <li>Orderbook professionale</li>
                <li>Settlement istantaneo</li>
                <li>Custody sicuro</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #1e293b, #334155)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            Tecnologia Enterprise
          </h2>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.9,
            marginBottom: '4rem',
            maxWidth: '600px',
            margin: '0 auto 4rem auto'
          }}>
            Costruito su XRPL per garantire sicurezza, scalabilità e compliance normativa
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Sicurezza Istituzionale
              </h3>
              <p style={{ opacity: 0.9 }}>
                Multi-signature, cold storage e audit di sicurezza continui
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Performance Elevate
              </h3>
              <p style={{ opacity: 0.9 }}>
                3-5 secondi per settlement, 1500+ TPS, costi minimi
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Compliance Globale
              </h3>
              <p style={{ opacity: 0.9 }}>
                Conformità MiCA, SEC, FINMA e altre normative internazionali
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌍</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Interoperabilità
              </h3>
              <p style={{ opacity: 0.9 }}>
                Integrazione con sistemi bancari tradizionali e DeFi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem'
          }}>
            Pronto a Tokenizzare i Tuoi Asset?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '3rem',
            opacity: 0.9
          }}>
            Unisciti a oltre 1,200 investitori che hanno già scelto SolCraft Nexus 
            per la tokenizzazione dei loro asset reali.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              background: 'white',
              color: '#1e3a8a',
              border: 'none',
              padding: '1.2rem 3rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
            }}
          >
            🚀 Accedi alla Piattaforma
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1e293b',
        color: 'white',
        padding: '3rem 2rem 2rem 2rem'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              SC
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>SolCraft Nexus</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
                Tokenizzazione RWA Enterprise su XRPL
              </p>
            </div>
          </div>
          
          <div style={{
            borderTop: '1px solid #334155',
            paddingTop: '2rem',
            opacity: 0.7,
            fontSize: '0.9rem'
          }}>
            <p>© 2025 SolCraft Nexus. Tutti i diritti riservati.</p>
            <p>Piattaforma regolamentata per la tokenizzazione di Real World Assets</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};

export default WelcomePage;

