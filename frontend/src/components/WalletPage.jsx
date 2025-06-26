import React, { useState } from 'react';

const WalletPage = ({ user }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [transactions] = useState([
    {
      id: 1,
      type: 'receive',
      amount: '+250.00 XRP',
      from: 'rDNvpJMWqxQtCkjQ3wQpLrTwKjBF8CX2dm',
      date: '2025-06-26',
      time: '14:30',
      status: 'confirmed',
      hash: '8F4B2C1A9E7D6F3B5A8C2E1D4F7B9A6C3E8D1F4B7A9C2E5D8F1B4A7C9E2D5F8'
    },
    {
      id: 2,
      type: 'send',
      amount: '-100.00 XRP',
      to: 'rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w',
      date: '2025-06-25',
      time: '09:15',
      status: 'confirmed',
      hash: '3A7F9C2E5D8B1F4A7C9E2D5F8B1A4C7E9D2F5A8C1E4D7F9B2A5C8E1D4F7B9A'
    },
    {
      id: 3,
      type: 'receive',
      amount: '+500.00 XRP',
      from: 'rMPCGeneratedAddress123456789',
      date: '2025-06-24',
      time: '16:45',
      status: 'confirmed',
      hash: '9E2D5F8B1A4C7E9D2F5A8C1E4D7F9B2A5C8E1D4F7B9A3C6E9D2F5A8B1E4D7F'
    }
  ]);

  const [assets] = useState([
    {
      id: 1,
      symbol: 'XRP',
      name: 'XRP Ledger',
      balance: '1,250.75',
      value: '€625.38',
      change: '+2.5%',
      icon: '💎'
    },
    {
      id: 2,
      symbol: 'RWA-RE01',
      name: 'Real Estate Token #1',
      balance: '50.00',
      value: '€2,500.00',
      change: '+8.2%',
      icon: '🏠'
    },
    {
      id: 3,
      symbol: 'RWA-ST02',
      name: 'Startup Equity Token',
      balance: '25.00',
      value: '€1,875.00',
      change: '+15.7%',
      icon: '🚀'
    }
  ]);

  const totalBalance = assets.reduce((sum, asset) => {
    return sum + parseFloat(asset.value.replace('€', '').replace(',', ''));
  }, 0);

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
              💰 Portafoglio
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Gestione completa dei tuoi asset digitali e tokenizzati
            </p>
          </div>
          
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              €{totalBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '1rem'
            }}>
              Valore Totale Portafoglio
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
            { id: 'overview', label: '📊 Panoramica', desc: 'Saldo e statistiche' },
            { id: 'assets', label: '💎 Asset', desc: 'Token e criptovalute' },
            { id: 'transactions', label: '📋 Transazioni', desc: 'Cronologia movimenti' },
            { id: 'send', label: '📤 Invia', desc: 'Trasferisci fondi' },
            { id: 'receive', label: '📥 Ricevi', desc: 'Genera indirizzo' }
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

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    💰
                  </div>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.3rem',
                      color: '#1e293b'
                    }}>
                      Saldo Totale
                    </h3>
                    <p style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '0.9rem'
                    }}>
                      Tutti gli asset
                    </p>
                  </div>
                </div>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: '#10b981',
                  marginBottom: '0.5rem'
                }}>
                  €{totalBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </div>
                <div style={{
                  color: '#10b981',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>↗️</span>
                  +8.5% questo mese
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    💎
                  </div>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.3rem',
                      color: '#1e293b'
                    }}>
                      Asset Diversi
                    </h3>
                    <p style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '0.9rem'
                    }}>
                      Portafoglio diversificato
                    </p>
                  </div>
                </div>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                  marginBottom: '0.5rem'
                }}>
                  {assets.length}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.9rem'
                }}>
                  Criptovalute e RWA
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    📈
                  </div>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.3rem',
                      color: '#1e293b'
                    }}>
                      Performance
                    </h3>
                    <p style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '0.9rem'
                    }}>
                      Rendimento 30gg
                    </p>
                  </div>
                </div>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: '#8b5cf6',
                  marginBottom: '0.5rem'
                }}>
                  +12.3%
                </div>
                <div style={{
                  color: '#8b5cf6',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>🚀</span>
                  Trend positivo
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1.5rem'
              }}>
                ⚡ Azioni Rapide
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {[
                  { action: 'send', label: '📤 Invia Fondi', desc: 'Trasferisci XRP o token' },
                  { action: 'receive', label: '📥 Ricevi Fondi', desc: 'Genera indirizzo wallet' },
                  { action: 'swap', label: '🔄 Scambia', desc: 'Converti tra asset' },
                  { action: 'stake', label: '🏦 Staking', desc: 'Guadagna rendimenti' }
                ].map(item => (
                  <button
                    key={item.action}
                    onClick={() => setSelectedTab(item.action)}
                    style={{
                      padding: '1.5rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: '0.5rem'
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.9rem'
                    }}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {selectedTab === 'assets' && (
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
                💎 I Tuoi Asset
              </h3>
              <p style={{
                color: '#64748b',
                margin: '0.5rem 0 0 0'
              }}>
                Gestisci e monitora tutti i tuoi token e criptovalute
              </p>
            </div>
            
            <div style={{ padding: '0' }}>
              {assets.map(asset => (
                <div
                  key={asset.id}
                  style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.target.style.background = 'white'}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {asset.icon}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '1.1rem'
                      }}>
                        {asset.symbol}
                      </div>
                      <div style={{
                        color: '#64748b',
                        fontSize: '0.9rem'
                      }}>
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#1e293b',
                      fontSize: '1.1rem'
                    }}>
                      {asset.balance} {asset.symbol}
                    </div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.9rem'
                    }}>
                      {asset.value}
                    </div>
                  </div>
                  
                  <div style={{
                    color: asset.change.startsWith('+') ? '#10b981' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textAlign: 'right'
                  }}>
                    {asset.change}
                  </div>
                </div>
              ))}
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
                📋 Cronologia Transazioni
              </h3>
              <p style={{
                color: '#64748b',
                margin: '0.5rem 0 0 0'
              }}>
                Tutte le tue transazioni recenti su XRPL
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
                    justifyContent: 'space-between',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.target.style.background = 'white'}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: tx.type === 'receive' 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color: 'white'
                    }}>
                      {tx.type === 'receive' ? '📥' : '📤'}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '1.1rem'
                      }}>
                        {tx.type === 'receive' ? 'Ricevuto' : 'Inviato'}
                      </div>
                      <div style={{
                        color: '#64748b',
                        fontSize: '0.9rem'
                      }}>
                        {tx.type === 'receive' ? `Da: ${tx.from.substring(0, 20)}...` : `A: ${tx.to.substring(0, 20)}...`}
                      </div>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.8rem'
                      }}>
                        {tx.date} alle {tx.time}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: tx.type === 'receive' ? '#10b981' : '#ef4444',
                      fontSize: '1.1rem'
                    }}>
                      {tx.amount}
                    </div>
                    <div style={{
                      color: '#10b981',
                      fontSize: '0.8rem',
                      background: '#f0fdf4',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      ✅ Confermata
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Tab */}
        {selectedTab === 'send' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '600px'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              📤 Invia Fondi
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Trasferisci XRP o token ad altri wallet XRPL
            </p>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Indirizzo Destinatario
                </label>
                <input
                  type="text"
                  placeholder="rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Importo
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    placeholder="0.00"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <select style={{
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white'
                  }}>
                    <option>XRP</option>
                    <option>RWA-RE01</option>
                    <option>RWA-ST02</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Memo (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Descrizione transazione"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#0369a1',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  💡 Riepilogo Transazione
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#0369a1'
                }}>
                  • Commissione di rete: ~0.00001 XRP<br/>
                  • Tempo di conferma: ~3-5 secondi<br/>
                  • La transazione sarà irreversibile una volta confermata
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📤 Invia Transazione
              </button>
            </form>
          </div>
        )}

        {/* Receive Tab */}
        {selectedTab === 'receive' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              📥 Ricevi Fondi
            </h3>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Condividi questo indirizzo per ricevere XRP o token
            </p>

            <div style={{
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '150px',
                height: '150px',
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                margin: '0 auto 1.5rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem'
              }}>
                📱
              </div>
              
              <div style={{
                fontSize: '0.9rem',
                color: '#64748b',
                marginBottom: '1rem'
              }}>
                Il tuo indirizzo XRPL:
              </div>
              
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#1e293b',
                wordBreak: 'break-all',
                marginBottom: '1rem'
              }}>
                {user?.address || 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'}
              </div>
              
              <button
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onClick={() => {
                  navigator.clipboard.writeText(user?.address || 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH');
                  alert('Indirizzo copiato negli appunti!');
                }}
              >
                📋 Copia Indirizzo
              </button>
            </div>

            <div style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#92400e',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                ⚠️ Importante
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#92400e'
              }}>
                • Invia solo XRP e token compatibili XRPL a questo indirizzo<br/>
                • Non inviare altre criptovalute (Bitcoin, Ethereum, ecc.)<br/>
                • Verifica sempre l'indirizzo prima di inviare fondi
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;

