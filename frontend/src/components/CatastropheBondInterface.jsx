import React, { useState, useEffect } from 'react';
import { availableRiskTokens } from '../data/insuranceData';
import oracleService from '../services/oracleService';

const CatastropheBondInterface = ({ user, onNavigate }) => {
  const [selectedBond, setSelectedBond] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [triggerEvents, setTriggerEvents] = useState([]);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);

  // Filter catastrophe bonds
  const catastropheBonds = availableRiskTokens.filter(token => 
    token.category === 'catastrophe'
  );

  useEffect(() => {
    // Subscribe to weather oracle for real-time updates
    const unsubscribe = oracleService.subscribeToOracle('weather', (data) => {
      setWeatherData(data);
    });

    // Get recent trigger events
    const events = oracleService.getRecentEvents().filter(event => 
      event.oracleType === 'weather'
    );
    setTriggerEvents(events);

    return unsubscribe;
  }, []);

  const handleInvest = async (bond) => {
    setSelectedBond(bond);
    setShowInvestModal(true);
  };

  const confirmInvestment = () => {
    const amount = parseFloat(investmentAmount);
    if (amount >= selectedBond.minInvestment) {
      // Simulate investment
      alert(`Investimento di €${amount.toLocaleString()} in ${selectedBond.name} completato!`);
      setShowInvestModal(false);
      setInvestmentAmount('');
      setSelectedBond(null);
    }
  };

  const getRiskLevel = (bond) => {
    const riskLevels = {
      'low': { color: '#10B981', label: 'Basso' },
      'medium': { color: '#F59E0B', label: 'Medio' },
      'high': { color: '#EF4444', label: 'Alto' }
    };
    return riskLevels[bond.riskLevel] || riskLevels.medium;
  };

  const getTriggerStatus = (bond) => {
    const recentEvent = triggerEvents.find(event => 
      event.tokenId === bond.id
    );
    
    if (recentEvent && recentEvent.triggered) {
      return {
        status: 'triggered',
        color: '#EF4444',
        label: 'Trigger Attivato',
        details: recentEvent.details
      };
    }
    
    return {
      status: 'monitoring',
      color: '#10B981',
      label: 'Monitoraggio Attivo',
      details: 'Parametri sotto soglia'
    };
  };

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
          🌪️ Catastrophe Bonds
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Investimenti in bond parametrici per rischi naturali con trigger automatici basati su dati meteorologici in tempo reale
        </p>
      </div>

      {/* Weather Oracle Status */}
      {weatherData && (
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
            📡 Oracle Meteorologico - Status Live
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Ultimo Aggiornamento</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>
                {new Date(weatherData.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Velocità Vento (km/h)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>
                {weatherData.windSpeed}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Pressione (hPa)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>
                {weatherData.pressure}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Temperatura (°C)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>
                {weatherData.temperature}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catastrophe Bonds Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {catastropheBonds.map(bond => {
          const riskLevel = getRiskLevel(bond);
          const triggerStatus = getTriggerStatus(bond);
          
          return (
            <div key={bond.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              {/* Bond Header */}
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
                    {bond.name}
                  </h3>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    {bond.emittente} • {bond.geography}
                  </div>
                </div>
                <div style={{
                  backgroundColor: riskLevel.color,
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {riskLevel.label}
                </div>
              </div>

              {/* Trigger Status */}
              <div style={{
                backgroundColor: triggerStatus.status === 'triggered' ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${triggerStatus.color}`,
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: triggerStatus.color
                  }}></div>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: triggerStatus.color
                  }}>
                    {triggerStatus.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#64748b'
                }}>
                  {triggerStatus.details}
                </div>
              </div>

              {/* Bond Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Rendimento Annuo</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#059669' }}>
                    {bond.yield}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Liquidità</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>
                    {bond.liquidity}/100
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Min. Investimento</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                    €{bond.minInvestment.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Scadenza</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                    {bond.maturity}
                  </div>
                </div>
              </div>

              {/* Trigger Parameters */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '0.5rem'
                }}>
                  Parametri Trigger
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  lineHeight: '1.4'
                }}>
                  {bond.triggerCondition}
                </div>
              </div>

              {/* Investment Button */}
              <button
                onClick={() => handleInvest(bond)}
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
                Investi in questo Bond
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent Trigger Events */}
      {triggerEvents.length > 0 && (
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
            🚨 Eventi Trigger Recenti
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {triggerEvents.slice(0, 10).map((event, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                borderBottom: index < triggerEvents.length - 1 ? '1px solid #e2e8f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: event.triggered ? '#dc2626' : '#059669'
                  }}>
                    {event.triggered ? '🔴 Trigger Attivato' : '🟢 Monitoraggio'}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}>
                    {event.details}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#64748b'
                }}>
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestModal && selectedBond && (
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
              Investi in {selectedBond.name}
            </h3>
            
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Rendimento: </span>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                  {selectedBond.yield}% annuo
                </span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Min. Investimento: </span>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  €{selectedBond.minInvestment.toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Commissione SolCraft: </span>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  {selectedBond.solcraftFee}%
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
                Importo Investimento (€)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                min={selectedBond.minInvestment}
                step="100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder={`Min. €${selectedBond.minInvestment.toLocaleString()}`}
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
                  setSelectedBond(null);
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
                disabled={!investmentAmount || parseFloat(investmentAmount) < selectedBond.minInvestment}
                style={{
                  flex: 1,
                  backgroundColor: parseFloat(investmentAmount) >= selectedBond.minInvestment ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: parseFloat(investmentAmount) >= selectedBond.minInvestment ? 'pointer' : 'not-allowed'
                }}
              >
                Conferma Investimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatastropheBondInterface;

