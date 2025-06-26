import React, { useState } from 'react';

const TokenizePage = ({ user }) => {
  const [selectedTab, setSelectedTab] = useState('create');
  const [currentStep, setCurrentStep] = useState(1);
  const [assetType, setAssetType] = useState('');
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    category: '',
    location: '',
    
    // Financial Info
    totalValue: '',
    tokenPrice: '',
    totalTokens: '',
    minimumInvestment: '',
    expectedYield: '',
    
    // Asset Details
    details: {},
    
    // Documents
    documents: [],
    
    // Legal
    legalStructure: '',
    jurisdiction: '',
    compliance: []
  });

  const [myTokens] = useState([
    {
      id: 1,
      name: 'Ufficio Milano Porta Nuova',
      symbol: 'RWA-OF01',
      status: 'pending_review',
      totalValue: 1500000,
      tokensSold: 0,
      totalTokens: 30000,
      createdDate: '2025-06-25'
    },
    {
      id: 2,
      name: 'Startup GreenTech Solutions',
      symbol: 'RWA-GT01',
      status: 'active',
      totalValue: 2000000,
      tokensSold: 15000,
      totalTokens: 40000,
      createdDate: '2025-06-20'
    }
  ]);

  const assetTypes = [
    {
      id: 'real_estate',
      name: 'Immobiliare',
      icon: '🏠',
      description: 'Proprietà residenziali, commerciali e industriali',
      examples: ['Appartamenti', 'Uffici', 'Negozi', 'Magazzini']
    },
    {
      id: 'startup_equity',
      name: 'Equity Startup',
      icon: '🚀',
      description: 'Quote di partecipazione in startup innovative',
      examples: ['Tech Startup', 'Biotech', 'Fintech', 'Cleantech']
    },
    {
      id: 'art_collectibles',
      name: 'Arte e Collezioni',
      icon: '🎨',
      description: 'Opere d\'arte, collezioni e beni di lusso',
      examples: ['Dipinti', 'Sculture', 'Vini pregiati', 'Orologi']
    },
    {
      id: 'commodities',
      name: 'Commodities',
      icon: '⚡',
      description: 'Materie prime e risorse naturali',
      examples: ['Oro', 'Petrolio', 'Gas naturale', 'Metalli preziosi']
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              1️⃣ Seleziona Tipo di Asset
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Scegli la categoria dell'asset che vuoi tokenizzare
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {assetTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => setAssetType(type.id)}
                  style={{
                    border: assetType === type.id ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: assetType === type.id ? '#f0f9ff' : 'white'
                  }}
                >
                  <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    {type.icon}
                  </div>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}>
                    {type.name}
                  </h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    {type.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center'
                  }}>
                    {type.examples.map(example => (
                      <span
                        key={example}
                        style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              2️⃣ Informazioni Base
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Inserisci le informazioni principali del tuo asset
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Nome Asset *
                </label>
                <input
                  type="text"
                  placeholder="es. Villa Luxury Milano Centro"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="">Seleziona categoria</option>
                  <option value="residential">Residenziale</option>
                  <option value="commercial">Commerciale</option>
                  <option value="industrial">Industriale</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Descrizione *
                </label>
                <textarea
                  placeholder="Descrivi dettagliatamente l'asset, le sue caratteristiche principali e i vantaggi per gli investitori..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Località *
                </label>
                <input
                  type="text"
                  placeholder="es. Milano, IT"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              3️⃣ Struttura Finanziaria
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Definisci la struttura economica della tokenizzazione
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Valore Totale Asset (€) *
                </label>
                <input
                  type="number"
                  placeholder="2500000"
                  value={formData.totalValue}
                  onChange={(e) => handleInputChange('totalValue', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Prezzo per Token (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  value={formData.tokenPrice}
                  onChange={(e) => handleInputChange('tokenPrice', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Numero Totale Token *
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={formData.totalTokens}
                  onChange={(e) => handleInputChange('totalTokens', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Investimento Minimo (€) *
                </label>
                <input
                  type="number"
                  placeholder="1000"
                  value={formData.minimumInvestment}
                  onChange={(e) => handleInputChange('minimumInvestment', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Rendimento Atteso (% annuo) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="8.5"
                  value={formData.expectedYield}
                  onChange={(e) => handleInputChange('expectedYield', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {/* Calculation Preview */}
            {formData.totalValue && formData.tokenPrice && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '1.5rem',
                marginTop: '2rem'
              }}>
                <h4 style={{
                  color: '#0369a1',
                  marginBottom: '1rem'
                }}>
                  📊 Anteprima Calcoli
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.9rem',
                  color: '#0369a1'
                }}>
                  <div>
                    <strong>Token Totali:</strong><br/>
                    {Math.floor(formData.totalValue / formData.tokenPrice).toLocaleString()}
                  </div>
                  <div>
                    <strong>Valore per Token:</strong><br/>
                    €{formData.tokenPrice}
                  </div>
                  <div>
                    <strong>Raccolta Totale:</strong><br/>
                    €{formData.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              4️⃣ Documenti e Verifiche
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Carica i documenti necessari per la verifica dell'asset
            </p>

            <div style={{
              display: 'grid',
              gap: '2rem'
            }}>
              {/* Document Upload Areas */}
              {[
                { id: 'ownership', name: 'Certificato di Proprietà', required: true },
                { id: 'valuation', name: 'Valutazione Professionale', required: true },
                { id: 'legal', name: 'Documenti Legali', required: true },
                { id: 'financial', name: 'Documentazione Finanziaria', required: false },
                { id: 'insurance', name: 'Polizza Assicurativa', required: false }
              ].map(doc => (
                <div
                  key={doc.id}
                  style={{
                    border: '2px dashed #e2e8f0',
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{
                    fontSize: '2rem',
                    marginBottom: '1rem'
                  }}>
                    📄
                  </div>
                  <h4 style={{
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    {doc.name} {doc.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                  }}>
                    Trascina i file qui o clicca per selezionare
                  </p>
                  <button
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Seleziona File
                  </button>
                </div>
              ))}

              {/* Compliance Checklist */}
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <h4 style={{
                  color: '#92400e',
                  marginBottom: '1rem'
                }}>
                  ✅ Checklist Compliance
                </h4>
                <div style={{
                  display: 'grid',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#92400e'
                }}>
                  {[
                    'Asset verificato da professionista qualificato',
                    'Documentazione legale completa e aggiornata',
                    'Conformità alle normative locali',
                    'Assicurazione adeguata attiva',
                    'Due diligence completata'
                  ].map((item, index) => (
                    <label key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input type="checkbox" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              5️⃣ Revisione e Conferma
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Controlla tutti i dettagli prima di inviare la richiesta di tokenizzazione
            </p>

            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* Summary Header */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                padding: '1.5rem'
              }}>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.3rem'
                }}>
                  {formData.name || 'Nome Asset'}
                </h4>
                <p style={{
                  margin: 0,
                  opacity: 0.9
                }}>
                  {formData.category} • {formData.location}
                </p>
              </div>

              {/* Summary Content */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      marginBottom: '0.3rem'
                    }}>
                      Valore Totale
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      €{formData.totalValue?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      marginBottom: '0.3rem'
                    }}>
                      Prezzo Token
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      €{formData.tokenPrice || '0'}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      marginBottom: '0.3rem'
                    }}>
                      Token Totali
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      {formData.totalTokens?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      marginBottom: '0.3rem'
                    }}>
                      Rendimento Atteso
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#10b981'
                    }}>
                      +{formData.expectedYield || '0'}%
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '2rem'
                }}>
                  <h5 style={{
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Descrizione
                  </h5>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {formData.description || 'Nessuna descrizione inserita'}
                  </p>
                </div>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <h5 style={{
                    color: '#15803d',
                    marginBottom: '0.5rem'
                  }}>
                    ✅ Prossimi Passi
                  </h5>
                  <ul style={{
                    color: '#15803d',
                    fontSize: '0.9rem',
                    margin: 0,
                    paddingLeft: '1.2rem'
                  }}>
                    <li>Revisione documentazione da parte del team legale</li>
                    <li>Valutazione indipendente dell'asset</li>
                    <li>Creazione smart contract su XRPL</li>
                    <li>Pubblicazione sul marketplace</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
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
              🪙 Tokenizzazione Asset
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Trasforma i tuoi asset in token digitali negoziabili
            </p>
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
            { id: 'create', label: '🆕 Crea Token', desc: 'Nuovo asset' },
            { id: 'my_tokens', label: '📋 I Miei Token', desc: 'Asset creati' },
            { id: 'guide', label: '📚 Guida', desc: 'Come funziona' }
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

        {/* Create Token Tab */}
        {selectedTab === 'create' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Progress Bar */}
            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#1e293b'
                }}>
                  Creazione Nuovo Token
                </h3>
                <span style={{
                  color: '#64748b',
                  fontSize: '0.9rem'
                }}>
                  Step {currentStep} di 5
                </span>
              </div>
              
              <div style={{
                background: '#e2e8f0',
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  height: '100%',
                  width: `${(currentStep / 5) * 100}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            {/* Step Content */}
            <div style={{ padding: '2rem' }}>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '2px solid #e2e8f0',
                  background: 'white',
                  color: currentStep === 1 ? '#94a3b8' : '#64748b',
                  borderRadius: '8px',
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ← Indietro
              </button>
              
              <button
                onClick={currentStep === 5 ? () => alert('Token creato con successo! Sarà sottoposto a revisione.') : handleNextStep}
                disabled={currentStep === 1 && !assetType}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: (currentStep === 1 && !assetType) 
                    ? '#94a3b8' 
                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: (currentStep === 1 && !assetType) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {currentStep === 5 ? '🚀 Crea Token' : 'Avanti →'}
              </button>
            </div>
          </div>
        )}

        {/* My Tokens Tab */}
        {selectedTab === 'my_tokens' && (
          <div>
            <div style={{
              display: 'grid',
              gap: '2rem'
            }}>
              {myTokens.map(token => (
                <div
                  key={token.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    background: token.status === 'active' 
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
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
                        {token.name}
                      </h3>
                      <p style={{
                        margin: 0,
                        opacity: 0.9
                      }}>
                        {token.symbol} • Creato il {token.createdDate}
                      </p>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      {token.status === 'active' ? '✅ Attivo' : '⏳ In Revisione'}
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginBottom: '0.3rem'
                        }}>
                          Valore Totale
                        </div>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}>
                          €{token.totalValue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginBottom: '0.3rem'
                        }}>
                          Token Venduti
                        </div>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#1e293b'
                        }}>
                          {token.tokensSold.toLocaleString()} / {token.totalTokens.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginBottom: '0.3rem'
                        }}>
                          Progresso Vendita
                        </div>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#10b981'
                        }}>
                          {Math.round((token.tokensSold / token.totalTokens) * 100)}%
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: '#f1f5f9',
                      borderRadius: '8px',
                      height: '8px',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        height: '100%',
                        width: `${(token.tokensSold / token.totalTokens) * 100}%`,
                        borderRadius: '8px'
                      }} />
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '1rem'
                    }}>
                      <button
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        📊 Gestisci
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
                          cursor: 'pointer'
                        }}
                      >
                        📈 Analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guide Tab */}
        {selectedTab === 'guide' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '2rem',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              📚 Guida alla Tokenizzazione
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              marginBottom: '2rem'
            }}>
              Tutto quello che devi sapere per tokenizzare i tuoi asset
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {[
                {
                  icon: '🏠',
                  title: 'Cos\'è la Tokenizzazione?',
                  description: 'La tokenizzazione trasforma asset fisici in token digitali negoziabili, permettendo investimenti frazionali e maggiore liquidità.'
                },
                {
                  icon: '⚖️',
                  title: 'Aspetti Legali',
                  description: 'Ogni asset deve essere supportato da documentazione legale completa e conforme alle normative locali e internazionali.'
                },
                {
                  icon: '💰',
                  title: 'Struttura Finanziaria',
                  description: 'Definisci valore totale, prezzo per token e rendimenti attesi basati su valutazioni professionali indipendenti.'
                },
                {
                  icon: '🔒',
                  title: 'Sicurezza e Compliance',
                  description: 'Utilizziamo smart contract su XRPL con standard di sicurezza enterprise e compliance normativa completa.'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{
                    fontSize: '2rem',
                    marginBottom: '1rem'
                  }}>
                    {item.icon}
                  </div>
                  <h4 style={{
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    {item.title}
                  </h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenizePage;

