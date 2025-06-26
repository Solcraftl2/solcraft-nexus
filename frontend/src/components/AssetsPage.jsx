import React, { useState } from 'react';

const AssetsPage = ({ user }) => {
  const [selectedTab, setSelectedTab] = useState('portfolio');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [assets] = useState([
    {
      id: 1,
      name: 'Villa Luxury Milano Centro',
      symbol: 'RWA-RE01',
      type: 'real_estate',
      category: 'Immobiliare Residenziale',
      totalValue: 2500000,
      tokenPrice: 50.00,
      totalTokens: 50000,
      ownedTokens: 50,
      ownedValue: 2500,
      yield: 8.2,
      location: 'Milano, IT',
      image: '🏠',
      status: 'active',
      description: 'Villa di lusso nel centro di Milano con 5 camere, giardino privato e garage doppio.',
      details: {
        area: '350 m²',
        rooms: '5 camere + 3 bagni',
        year: '2018',
        condition: 'Eccellente',
        rental_yield: '6.5% annuo',
        appreciation: '12% negli ultimi 2 anni'
      },
      documents: [
        { name: 'Certificato di Proprietà', type: 'PDF', verified: true },
        { name: 'Valutazione Immobiliare', type: 'PDF', verified: true },
        { name: 'Contratto di Locazione', type: 'PDF', verified: true }
      ]
    },
    {
      id: 2,
      name: 'TechStart AI Solutions',
      symbol: 'RWA-ST02',
      type: 'startup_equity',
      category: 'Startup Technology',
      totalValue: 1875000,
      tokenPrice: 75.00,
      totalTokens: 25000,
      ownedTokens: 25,
      ownedValue: 1875,
      yield: 15.7,
      location: 'San Francisco, US',
      image: '🚀',
      status: 'active',
      description: 'Startup innovativa nel settore AI con focus su soluzioni enterprise.',
      details: {
        stage: 'Series A',
        employees: '45 dipendenti',
        revenue: '$2.5M ARR',
        growth: '+180% YoY',
        investors: 'Tier 1 VCs',
        valuation: '$25M pre-money'
      },
      documents: [
        { name: 'Cap Table', type: 'PDF', verified: true },
        { name: 'Financial Statements', type: 'PDF', verified: true },
        { name: 'Investment Agreement', type: 'PDF', verified: true }
      ]
    },
    {
      id: 3,
      name: 'Appartamento Roma Trastevere',
      symbol: 'RWA-RE03',
      type: 'real_estate',
      category: 'Immobiliare Residenziale',
      totalValue: 850000,
      tokenPrice: 25.00,
      totalTokens: 34000,
      ownedTokens: 80,
      ownedValue: 2000,
      yield: 5.8,
      location: 'Roma, IT',
      image: '🏛️',
      status: 'active',
      description: 'Appartamento storico nel cuore di Trastevere, completamente ristrutturato.',
      details: {
        area: '120 m²',
        rooms: '3 camere + 2 bagni',
        year: '1800 (ristrutturato 2020)',
        condition: 'Ottima',
        rental_yield: '5.2% annuo',
        appreciation: '8% negli ultimi 2 anni'
      },
      documents: [
        { name: 'Certificato di Proprietà', type: 'PDF', verified: true },
        { name: 'Valutazione Immobiliare', type: 'PDF', verified: true },
        { name: 'Permessi Ristrutturazione', type: 'PDF', verified: true }
      ]
    }
  ]);

  const [transactions] = useState([
    {
      id: 1,
      type: 'buy',
      asset: 'RWA-RE01',
      amount: 25,
      price: 50.00,
      total: 1250,
      date: '2025-06-20',
      status: 'completed'
    },
    {
      id: 2,
      type: 'dividend',
      asset: 'RWA-ST02',
      amount: 156.75,
      date: '2025-06-15',
      status: 'completed'
    },
    {
      id: 3,
      type: 'buy',
      asset: 'RWA-RE03',
      amount: 40,
      price: 25.00,
      total: 1000,
      date: '2025-06-10',
      status: 'completed'
    }
  ]);

  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.ownedValue, 0);
  const averageYield = assets.reduce((sum, asset) => sum + asset.yield, 0) / assets.length;

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
              🏠 Asset Tokenizzati
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Gestione e monitoraggio delle tue proprietà tokenizzate
            </p>
          </div>
          
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }}>
              €{totalPortfolioValue.toLocaleString('it-IT')}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '1rem'
            }}>
              Valore Totale Asset
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
            { id: 'portfolio', label: '📊 Portfolio', desc: 'I tuoi asset' },
            { id: 'marketplace', label: '🛒 Marketplace', desc: 'Acquista asset' },
            { id: 'transactions', label: '📋 Transazioni', desc: 'Cronologia' },
            { id: 'analytics', label: '📈 Analytics', desc: 'Performance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: selectedTab === tab.id ? '#f8fafc' : 'transparent',
                borderBottom: selectedTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
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

        {/* Portfolio Tab */}
        {selectedTab === 'portfolio' && (
          <div>
            {/* Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    🏠
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                      Asset Totali
                    </h3>
                  </div>
                </div>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#3b82f6'
                }}>
                  {assets.length}
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    💰
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                      Valore Portfolio
                    </h3>
                  </div>
                </div>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  €{totalPortfolioValue.toLocaleString('it-IT')}
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    📈
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                      Rendimento Medio
                    </h3>
                  </div>
                </div>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#8b5cf6'
                }}>
                  +{averageYield.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Assets Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {assets.map(asset => (
                <div
                  key={asset.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.3s',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedAsset(asset)}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Asset Header */}
                  <div style={{
                    background: asset.type === 'real_estate' 
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
                        {asset.image}
                      </div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1.3rem',
                          fontWeight: 'bold'
                        }}>
                          {asset.name}
                        </h3>
                        <p style={{
                          margin: 0,
                          opacity: 0.9,
                          fontSize: '0.9rem'
                        }}>
                          {asset.category} • {asset.location}
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
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          €{asset.ownedValue.toLocaleString('it-IT')}
                        </div>
                        <div style={{
                          opacity: 0.9,
                          fontSize: '0.9rem'
                        }}>
                          {asset.ownedTokens} token posseduti
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
                          +{asset.yield}%
                        </div>
                        <div style={{
                          opacity: 0.9,
                          fontSize: '0.8rem'
                        }}>
                          Rendimento
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asset Details */}
                  <div style={{ padding: '1.5rem' }}>
                    <p style={{
                      color: '#64748b',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      lineHeight: '1.5'
                    }}>
                      {asset.description}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginBottom: '0.2rem'
                        }}>
                          Prezzo Token
                        </div>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}>
                          €{asset.tokenPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginBottom: '0.2rem'
                        }}>
                          Valore Totale
                        </div>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}>
                          €{asset.totalValue.toLocaleString('it-IT')}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        📈 Compra Altri Token
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        📊 Dettagli
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {selectedTab === 'marketplace' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '2rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              🛒 Marketplace Asset
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              marginBottom: '2rem'
            }}>
              Esplora e acquista nuovi asset tokenizzati disponibili sulla piattaforma
            </p>
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '2rem'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                🚧
              </div>
              <h4 style={{
                color: '#0369a1',
                marginBottom: '1rem'
              }}>
                Marketplace in Sviluppo
              </h4>
              <p style={{
                color: '#0369a1',
                fontSize: '0.9rem'
              }}>
                Il marketplace per l'acquisto di nuovi asset tokenizzati sarà disponibile presto.<br/>
                Potrai esplorare immobili, startup e altri RWA disponibili per l'investimento.
              </p>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {selectedTab === 'transactions' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: 0
              }}>
                📋 Cronologia Transazioni Asset
              </h3>
              <p style={{
                color: '#64748b',
                margin: '0.5rem 0 0 0'
              }}>
                Tutte le tue transazioni relative agli asset tokenizzati
              </p>
            </div>
            
            <div style={{ padding: '0' }}>
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: tx.type === 'buy' 
                        ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color: 'white'
                    }}>
                      {tx.type === 'buy' ? '🛒' : '💰'}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '1.1rem'
                      }}>
                        {tx.type === 'buy' ? 'Acquisto Token' : 'Dividendo Ricevuto'}
                      </div>
                      <div style={{
                        color: '#64748b',
                        fontSize: '0.9rem'
                      }}>
                        {tx.asset} • {tx.date}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: tx.type === 'buy' ? '#ef4444' : '#10b981',
                      fontSize: '1.1rem'
                    }}>
                      {tx.type === 'buy' ? `-€${tx.total}` : `+€${tx.amount}`}
                    </div>
                    <div style={{
                      color: '#10b981',
                      fontSize: '0.8rem',
                      background: '#f0fdf4',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      ✅ Completata
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '2rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              📈 Analytics & Performance
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              marginBottom: '2rem'
            }}>
              Analisi dettagliate delle performance dei tuoi asset tokenizzati
            </p>
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '2rem'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                📊
              </div>
              <h4 style={{
                color: '#0369a1',
                marginBottom: '1rem'
              }}>
                Analytics Avanzate in Sviluppo
              </h4>
              <p style={{
                color: '#0369a1',
                fontSize: '0.9rem'
              }}>
                Grafici dettagliati, analisi di performance, comparazioni di mercato<br/>
                e insights avanzati saranno disponibili presto.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
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
              background: selectedAsset.type === 'real_estate' 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
                  {selectedAsset.image} {selectedAsset.name}
                </h2>
                <p style={{
                  margin: 0,
                  opacity: 0.9
                }}>
                  {selectedAsset.category} • {selectedAsset.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <h4 style={{
                    color: '#1e293b',
                    marginBottom: '1rem'
                  }}>
                    📊 Dettagli Investimento
                  </h4>
                  <div style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <strong>Token Posseduti:</strong><br/>
                        {selectedAsset.ownedTokens}
                      </div>
                      <div>
                        <strong>Valore Posseduto:</strong><br/>
                        €{selectedAsset.ownedValue.toLocaleString('it-IT')}
                      </div>
                      <div>
                        <strong>Prezzo Token:</strong><br/>
                        €{selectedAsset.tokenPrice.toFixed(2)}
                      </div>
                      <div>
                        <strong>Rendimento:</strong><br/>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                          +{selectedAsset.yield}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{
                    color: '#1e293b',
                    marginBottom: '1rem'
                  }}>
                    🏠 Dettagli Asset
                  </h4>
                  <div style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      lineHeight: '1.6'
                    }}>
                      {Object.entries(selectedAsset.details).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '0.5rem' }}>
                          <strong>{key.replace('_', ' ').toUpperCase()}:</strong> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  color: '#1e293b',
                  marginBottom: '1rem'
                }}>
                  📄 Documenti Verificati
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  {selectedAsset.documents.map((doc, index) => (
                    <div
                      key={index}
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '1rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ color: '#10b981' }}>✅</span>
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          color: '#1e293b'
                        }}>
                          {doc.name}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#64748b'
                        }}>
                          {doc.type} • Verificato
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <button
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  📈 Compra Altri Token
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  📤 Vendi Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;

