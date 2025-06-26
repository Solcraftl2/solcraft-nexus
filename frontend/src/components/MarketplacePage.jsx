import React, { useState } from 'react';

const MarketplacePage = ({ user }) => {
  const [selectedTab, setSelectedTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  const [marketplaceAssets] = useState([
    {
      id: 1,
      name: 'Palazzo Storico Firenze',
      symbol: 'RWA-FI01',
      type: 'real_estate',
      category: 'Immobiliare Storico',
      totalValue: 3500000,
      tokenPrice: 70.00,
      totalTokens: 50000,
      availableTokens: 35000,
      soldPercentage: 30,
      yield: 6.8,
      location: 'Firenze, IT',
      image: '🏛️',
      status: 'active',
      featured: true,
      description: 'Palazzo storico del XVI secolo nel centro di Firenze, completamente restaurato con destinazione ricettiva di lusso.',
      highlights: ['Centro storico UNESCO', 'Restauro certificato', 'Rendita turistica stabile', 'Apprezzamento garantito'],
      details: {
        area: '1200 m²',
        rooms: '15 camere + servizi',
        year: '1580 (restaurato 2022)',
        condition: 'Eccellente',
        rental_yield: '5.8% annuo',
        appreciation: '15% negli ultimi 3 anni'
      },
      financials: {
        revenue_2023: 420000,
        expenses_2023: 180000,
        net_income: 240000,
        occupancy_rate: '85%'
      },
      documents_verified: true,
      minimum_investment: 1400,
      created_date: '2025-06-20'
    },
    {
      id: 2,
      name: 'BioTech Innovation Lab',
      symbol: 'RWA-BT01',
      type: 'startup_equity',
      category: 'Biotech Startup',
      totalValue: 5000000,
      tokenPrice: 125.00,
      totalTokens: 40000,
      availableTokens: 28000,
      soldPercentage: 30,
      yield: 22.5,
      location: 'Boston, US',
      image: '🧬',
      status: 'active',
      featured: true,
      description: 'Startup biotech innovativa specializzata in terapie geniche per malattie rare con pipeline promettente.',
      highlights: ['Serie B completata', 'Pipeline FDA', 'Team di esperti', 'Mercato in crescita'],
      details: {
        stage: 'Serie B',
        employees: '85 ricercatori',
        patents: '12 brevetti attivi',
        trials: '3 trial clinici fase II',
        partnerships: 'Big Pharma partnerships',
        valuation: '$50M pre-money'
      },
      financials: {
        funding_raised: 15000000,
        burn_rate: 800000,
        runway: '24 mesi',
        revenue_projection: '2026: $10M'
      },
      documents_verified: true,
      minimum_investment: 2500,
      created_date: '2025-06-18'
    },
    {
      id: 3,
      name: 'Collezione Arte Contemporanea',
      symbol: 'RWA-AC01',
      type: 'art_collectibles',
      category: 'Arte Contemporanea',
      totalValue: 2800000,
      tokenPrice: 140.00,
      totalTokens: 20000,
      availableTokens: 15000,
      soldPercentage: 25,
      yield: 12.3,
      location: 'Milano, IT',
      image: '🎨',
      status: 'active',
      featured: false,
      description: 'Collezione curata di 25 opere di artisti contemporanei emergenti con forte potenziale di apprezzamento.',
      highlights: ['Artisti emergenti', 'Curata da esperti', 'Mercato in crescita', 'Esposizioni programmate'],
      details: {
        pieces: '25 opere selezionate',
        artists: '15 artisti diversi',
        period: '2020-2025',
        style: 'Contemporaneo emergente',
        exhibitions: '5 mostre programmate',
        insurance: 'Copertura completa'
      },
      financials: {
        acquisition_cost: 2200000,
        current_valuation: 2800000,
        appreciation: '27% in 2 anni',
        exhibition_revenue: 45000
      },
      documents_verified: true,
      minimum_investment: 700,
      created_date: '2025-06-15'
    },
    {
      id: 4,
      name: 'Complesso Residenziale Roma',
      symbol: 'RWA-RO01',
      type: 'real_estate',
      category: 'Immobiliare Residenziale',
      totalValue: 4200000,
      tokenPrice: 84.00,
      totalTokens: 50000,
      availableTokens: 42000,
      soldPercentage: 16,
      yield: 7.2,
      location: 'Roma, IT',
      image: '🏢',
      status: 'active',
      featured: false,
      description: 'Complesso residenziale di nuova costruzione in zona Parioli con 24 appartamenti di lusso.',
      highlights: ['Nuova costruzione', 'Zona prestigiosa', 'Classe energetica A', 'Rendita garantita'],
      details: {
        units: '24 appartamenti',
        area: '2800 m² totali',
        year: '2024 (completamento)',
        condition: 'Nuova costruzione',
        rental_yield: '6.2% annuo',
        energy_class: 'Classe A'
      },
      financials: {
        construction_cost: 3800000,
        current_value: 4200000,
        rental_income_annual: 294000,
        occupancy_rate: '92%'
      },
      documents_verified: true,
      minimum_investment: 1680,
      created_date: '2025-06-12'
    }
  ]);

  const [myOrders] = useState([
    {
      id: 1,
      asset: 'RWA-FI01',
      type: 'buy',
      tokens: 20,
      price: 70.00,
      total: 1400,
      status: 'completed',
      date: '2025-06-22'
    },
    {
      id: 2,
      asset: 'RWA-BT01',
      type: 'buy',
      tokens: 10,
      price: 125.00,
      total: 1250,
      status: 'pending',
      date: '2025-06-24'
    }
  ]);

  const categories = [
    { id: 'all', name: 'Tutti gli Asset', icon: '🌐' },
    { id: 'real_estate', name: 'Immobiliare', icon: '🏠' },
    { id: 'startup_equity', name: 'Startup', icon: '🚀' },
    { id: 'art_collectibles', name: 'Arte', icon: '🎨' },
    { id: 'commodities', name: 'Commodities', icon: '⚡' }
  ];

  const filteredAssets = marketplaceAssets.filter(asset => 
    selectedCategory === 'all' || asset.type === selectedCategory
  );

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'yield_high':
        return b.yield - a.yield;
      case 'price_low':
        return a.tokenPrice - b.tokenPrice;
      case 'price_high':
        return b.tokenPrice - a.tokenPrice;
      default:
        return 0;
    }
  });

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
              🛒 Marketplace Asset
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Esplora e investi in asset tokenizzati verificati
            </p>
          </div>
          
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }}>
              {marketplaceAssets.length}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '1rem'
            }}>
              Asset Disponibili
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
            { id: 'browse', label: '🔍 Esplora', desc: 'Tutti gli asset' },
            { id: 'featured', label: '⭐ In Evidenza', desc: 'Asset consigliati' },
            { id: 'my_orders', label: '📋 I Miei Ordini', desc: 'Ordini attivi' },
            { id: 'watchlist', label: '👁️ Watchlist', desc: 'Asset seguiti' }
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

        {/* Browse Tab */}
        {selectedTab === 'browse' && (
          <div>
            {/* Filters and Sort */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              {/* Category Filters */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: selectedCategory === category.id ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                      background: selectedCategory === category.id ? '#f0f9ff' : 'white',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontSize: '0.9rem',
                      fontWeight: selectedCategory === category.id ? 'bold' : 'normal',
                      color: selectedCategory === category.id ? '#1e293b' : '#64748b'
                    }}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  background: 'white',
                  fontSize: '0.9rem'
                }}
              >
                <option value="newest">Più Recenti</option>
                <option value="yield_high">Rendimento Alto</option>
                <option value="price_low">Prezzo Basso</option>
                <option value="price_high">Prezzo Alto</option>
              </select>
            </div>

            {/* Assets Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {sortedAssets.map(asset => (
                <div
                  key={asset.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.3s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => setSelectedAsset(asset)}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Featured Badge */}
                  {asset.featured && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>
                      ⭐ Featured
                    </div>
                  )}

                  {/* Asset Header */}
                  <div style={{
                    background: asset.type === 'real_estate' 
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : asset.type === 'startup_equity'
                      ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                      : 'linear-gradient(135deg, #10b981, #059669)',
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
                          €{asset.tokenPrice.toFixed(2)}
                        </div>
                        <div style={{
                          opacity: 0.9,
                          fontSize: '0.9rem'
                        }}>
                          per token
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

                    {/* Highlights */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {asset.highlights.slice(0, 3).map((highlight, index) => (
                        <span
                          key={index}
                          style={{
                            background: '#f0fdf4',
                            color: '#15803d',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            border: '1px solid #bbf7d0'
                          }}
                        >
                          ✅ {highlight}
                        </span>
                      ))}
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
                          Venduto: {asset.soldPercentage}%
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#64748b'
                        }}>
                          {asset.availableTokens.toLocaleString()} token disponibili
                        </span>
                      </div>
                      <div style={{
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        height: '8px'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          height: '100%',
                          width: `${asset.soldPercentage}%`,
                          borderRadius: '8px'
                        }} />
                      </div>
                    </div>

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
                          Valore Totale
                        </div>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}>
                          €{asset.totalValue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginBottom: '0.2rem'
                        }}>
                          Min. Investimento
                        </div>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}>
                          €{asset.minimum_investment}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Acquisto ${asset.name} - Funzionalità in sviluppo`);
                        }}
                      >
                        💰 Investi Ora
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAsset(asset);
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

        {/* Featured Tab */}
        {selectedTab === 'featured' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                marginBottom: '1rem'
              }}>
                ⭐ Asset in Evidenza
              </h3>
              <p style={{
                opacity: 0.9,
                fontSize: '1.1rem'
              }}>
                I migliori asset selezionati dal nostro team di esperti
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {sortedAssets.filter(asset => asset.featured).map(asset => (
                <div
                  key={asset.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    border: '3px solid #f59e0b'
                  }}
                >
                  {/* Same asset card content as browse tab */}
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
                      <div style={{ fontSize: '2rem' }}>
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
                          €{asset.tokenPrice.toFixed(2)}
                        </div>
                        <div style={{
                          opacity: 0.9,
                          fontSize: '0.9rem'
                        }}>
                          per token
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

                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        color: '#92400e',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem'
                      }}>
                        🏆 Perché è in evidenza:
                      </div>
                      <ul style={{
                        color: '#92400e',
                        fontSize: '0.9rem',
                        margin: 0,
                        paddingLeft: '1.2rem'
                      }}>
                        {asset.highlights.map((highlight, index) => (
                          <li key={index}>{highlight}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      ⭐ Investi nell'Asset Featured
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Orders Tab */}
        {selectedTab === 'my_orders' && (
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
                📋 I Miei Ordini
              </h3>
              <p style={{
                color: '#64748b',
                margin: '0.5rem 0 0 0'
              }}>
                Cronologia e stato degli ordini di acquisto
              </p>
            </div>
            
            <div style={{ padding: '0' }}>
              {myOrders.map(order => (
                <div
                  key={order.id}
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
                      background: order.status === 'completed' 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color: 'white'
                    }}>
                      {order.status === 'completed' ? '✅' : '⏳'}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '1.1rem'
                      }}>
                        Acquisto {order.asset}
                      </div>
                      <div style={{
                        color: '#64748b',
                        fontSize: '0.9rem'
                      }}>
                        {order.tokens} token × €{order.price} • {order.date}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#1e293b',
                      fontSize: '1.1rem'
                    }}>
                      €{order.total}
                    </div>
                    <div style={{
                      color: order.status === 'completed' ? '#10b981' : '#f59e0b',
                      fontSize: '0.8rem',
                      background: order.status === 'completed' ? '#f0fdf4' : '#fef3c7',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {order.status === 'completed' ? '✅ Completato' : '⏳ In Elaborazione'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {selectedTab === 'watchlist' && (
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
              👁️ Watchlist
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              marginBottom: '2rem'
            }}>
              Tieni traccia degli asset che ti interessano
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
                📝
              </div>
              <h4 style={{
                color: '#0369a1',
                marginBottom: '1rem'
              }}>
                Watchlist Vuota
              </h4>
              <p style={{
                color: '#0369a1',
                fontSize: '0.9rem'
              }}>
                Aggiungi asset alla tua watchlist per monitorare prezzi e performance.<br/>
                Clicca sull'icona ❤️ negli asset che ti interessano.
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
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: selectedAsset.type === 'real_estate' 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                : selectedAsset.type === 'startup_equity'
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : 'linear-gradient(135deg, #10b981, #059669)',
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
                    💰 Informazioni Investimento
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
                        <strong>Prezzo Token:</strong><br/>
                        €{selectedAsset.tokenPrice.toFixed(2)}
                      </div>
                      <div>
                        <strong>Rendimento:</strong><br/>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                          +{selectedAsset.yield}%
                        </span>
                      </div>
                      <div>
                        <strong>Min. Investimento:</strong><br/>
                        €{selectedAsset.minimum_investment}
                      </div>
                      <div>
                        <strong>Token Disponibili:</strong><br/>
                        {selectedAsset.availableTokens.toLocaleString()}
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
                  📊 Dati Finanziari
                </h4>
                <div style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    {Object.entries(selectedAsset.financials).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key.replace('_', ' ').toUpperCase()}:</strong><br/>
                        {typeof value === 'number' ? `€${value.toLocaleString()}` : value}
                      </div>
                    ))}
                  </div>
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
                  onClick={() => {
                    alert(`Investimento in ${selectedAsset.name} - Funzionalità in sviluppo`);
                    setSelectedAsset(null);
                  }}
                >
                  💰 Investi Ora
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    alert(`${selectedAsset.name} aggiunto alla watchlist!`);
                    setSelectedAsset(null);
                  }}
                >
                  ❤️ Aggiungi a Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;

