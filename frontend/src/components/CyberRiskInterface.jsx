import React, { useState, useEffect } from 'react';
import { availableRiskTokens } from '../data/insuranceData';
import oracleService from '../services/oracleService';

const CyberRiskInterface = ({ user, onNavigate }) => {
  const [selectedPool, setSelectedPool] = useState(null);
  const [cyberData, setCyberData] = useState(null);
  const [threatEvents, setThreatEvents] = useState([]);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pools');

  // Filter cyber risk pools
  const cyberPools = availableRiskTokens.filter(token => 
    token.category === 'cyber'
  );

  useEffect(() => {
    // Subscribe to cyber oracle for real-time updates
    const unsubscribe = oracleService.subscribeToOracle('cyber', (data) => {
      setCyberData(data);
    });

    // Get recent cyber threat events
    const events = oracleService.getRecentEvents().filter(event => 
      event.oracleType === 'cyber'
    );
    setThreatEvents(events);

    return unsubscribe;
  }, []);

  const handleInvest = async (pool) => {
    setSelectedPool(pool);
    setShowInvestModal(true);
  };

  const confirmInvestment = () => {
    const amount = parseFloat(investmentAmount);
    if (amount >= selectedPool.minInvestment) {
      // Simulate investment
      alert(`Investimento di €${amount.toLocaleString()} in ${selectedPool.name} completato!`);
      setShowInvestModal(false);
      setInvestmentAmount('');
      setSelectedPool(null);
    }
  };

  const getThreatLevel = (severity) => {
    const levels = {
      'low': { color: '#10B981', label: 'Basso', icon: '🟢' },
      'medium': { color: '#F59E0B', label: 'Medio', icon: '🟡' },
      'high': { color: '#EF4444', label: 'Alto', icon: '🔴' },
      'critical': { color: '#7C2D12', label: 'Critico', icon: '🚨' }
    };
    return levels[severity] || levels.medium;
  };

  const getCyberMetrics = () => {
    if (!cyberData) return null;
    
    return {
      globalThreats: cyberData.globalThreats || Math.floor(Math.random() * 1000) + 500,
      dataBreaches: cyberData.dataBreaches || Math.floor(Math.random() * 50) + 10,
      ransomwareAttacks: cyberData.ransomwareAttacks || Math.floor(Math.random() * 100) + 25,
      threatLevel: cyberData.threatLevel || 'medium'
    };
  };

  const metrics = getCyberMetrics();

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '0.5rem'
        }}>
          🔒 Cyber Risk Pools
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Pool di rischio cyber per protezione da data breach, ransomware e interruzioni business con monitoraggio threat intelligence in tempo reale
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '0.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {[
          { id: 'pools', label: '🛡️ Risk Pools', icon: '🛡️' },
          { id: 'threats', label: '🚨 Threat Monitor', icon: '🚨' },
          { id: 'analytics', label: '📊 Analytics', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cyber Oracle Dashboard */}
      {metrics && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🌐 Cyber Threat Intelligence - Global Status
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌍</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Minacce Globali (24h)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                {metrics.globalThreats.toLocaleString()}
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fde68a'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💾</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Data Breach (24h)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>
                {metrics.dataBreaches}
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#f3e8ff',
              borderRadius: '8px',
              border: '1px solid #ddd6fe'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Ransomware (24h)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#7c3aed' }}>
                {metrics.ransomwareAttacks}
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: getThreatLevel(metrics.threatLevel).color + '20',
              borderRadius: '8px',
              border: `1px solid ${getThreatLevel(metrics.threatLevel).color}40`
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {getThreatLevel(metrics.threatLevel).icon}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Livello Minaccia</div>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: '700', 
                color: getThreatLevel(metrics.threatLevel).color 
              }}>
                {getThreatLevel(metrics.threatLevel).label}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'pools' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {cyberPools.map(pool => {
            const threatLevel = getThreatLevel(pool.riskLevel);
            
            return (
              <div key={pool.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                {/* Pool Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.5rem'
                    }}>
                      {pool.name}
                    </h3>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#64748b'
                    }}>
                      {pool.emittente} • {pool.geography}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: threatLevel.color,
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {threatLevel.label}
                  </div>
                </div>

                {/* Coverage Details */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Copertura Cyber Risk
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    lineHeight: '1.4'
                  }}>
                    {pool.description}
                  </div>
                </div>

                {/* Pool Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Rendimento APY</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#059669' }}>
                      {pool.yield}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>TVL Pool</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>
                      €{pool.totalValue}M
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Min. Stake</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                      €{pool.minInvestment.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Liquidità</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                      {pool.liquidity}/100
                    </div>
                  </div>
                </div>

                {/* Trigger Conditions */}
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#dc2626',
                    marginBottom: '0.5rem'
                  }}>
                    🚨 Trigger Conditions
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    lineHeight: '1.4'
                  }}>
                    {pool.triggerCondition}
                  </div>
                </div>

                {/* Investment Button */}
                <button
                  onClick={() => handleInvest(pool)}
                  style={{
                    width: '100%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  Investi nel Pool
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'threats' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            🚨 Real-Time Threat Monitor
          </h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {threatEvents.length > 0 ? threatEvents.slice(0, 20).map((event, index) => (
              <div key={index} style={{
                padding: '1rem',
                borderBottom: index < threatEvents.length - 1 ? '1px solid #e2e8f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: event.triggered ? '#dc2626' : '#059669'
                    }}>
                      {event.triggered ? '🔴 Threat Detected' : '🟢 Monitoring'}
                    </div>
                    <div style={{
                      backgroundColor: getThreatLevel(event.severity || 'medium').color,
                      color: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      {getThreatLevel(event.severity || 'medium').label}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#64748b',
                    marginBottom: '0.25rem'
                  }}>
                    {event.details}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#9ca3af'
                  }}>
                    Target: {event.target || 'Multiple sectors'} • 
                    Impact: {event.impact || 'Medium'}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  textAlign: 'right',
                  minWidth: '120px'
                }}>
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                <div>Nessuna minaccia rilevata nelle ultime 24 ore</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              📊 Pool Performance (YTD)
            </h4>
            {cyberPools.map(pool => (
              <div key={pool.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>
                    {pool.name.split(' ').slice(0, 3).join(' ')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    €{pool.totalValue}M TVL
                  </div>
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: pool.performanceYTD > 0 ? '#059669' : '#dc2626'
                }}>
                  {pool.performanceYTD > 0 ? '+' : ''}{pool.performanceYTD}%
                </div>
              </div>
            ))}
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              🎯 Risk Distribution
            </h4>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Data Breach</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>45%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '45%',
                  height: '100%',
                  backgroundColor: '#3b82f6'
                }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Ransomware</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>30%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '30%',
                  height: '100%',
                  backgroundColor: '#ef4444'
                }}></div>
              </div>
            </div>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Business Interruption</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>25%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '25%',
                  height: '100%',
                  backgroundColor: '#f59e0b'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestModal && selectedPool && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              Investi in {selectedPool.name}
            </h3>
            
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>APY: </span>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                  {selectedPool.yield}%
                </span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Min. Stake: </span>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  €{selectedPool.minInvestment.toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Commissione SolCraft: </span>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  {selectedPool.solcraftFee}%
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Importo Stake (€)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                min={selectedPool.minInvestment}
                step="100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder={`Min. €${selectedPool.minInvestment.toLocaleString()}`}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setShowInvestModal(false);
                  setInvestmentAmount('');
                  setSelectedPool(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                onClick={confirmInvestment}
                disabled={!investmentAmount || parseFloat(investmentAmount) < selectedPool.minInvestment}
                style={{
                  flex: 1,
                  backgroundColor: parseFloat(investmentAmount) >= selectedPool.minInvestment ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: parseFloat(investmentAmount) >= selectedPool.minInvestment ? 'pointer' : 'not-allowed'
                }}
              >
                Conferma Stake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberRiskInterface;

