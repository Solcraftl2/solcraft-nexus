import React, { useState } from 'react';
import xrplTokenizationService from '../services/xrplTokenizationService.js';

/**
 * Sistema di Tokenizzazione Reale per SolCraft Nexus
 * Integrazione completa con XRPL per creazione token reali
 */
const TokenizationSimple = ({ walletData, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);
  
  const [assetData, setAssetData] = useState({
    name: '',
    value: '',
    tokenSymbol: '',
    description: '',
    assetType: 'real_estate',
    totalSupply: ''
  });

  const assetTypes = [
    { id: 'real_estate', name: 'Immobiliare', icon: '🏠' },
    { id: 'art', name: 'Arte & Collectibles', icon: '🎨' },
    { id: 'insurance', name: 'Assicurazioni', icon: '🛡️' },
    { id: 'carbon_credits', name: 'Crediti Carbonio', icon: '🌱' },
    { id: 'commodities', name: 'Commodities', icon: '🥇' },
    { id: 'other', name: 'Altro', icon: '📦' }
  ];

  const handleInputChange = (field, value) => {
    setAssetData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateStep1 = () => {
    return assetData.name && 
           assetData.value && 
           assetData.tokenSymbol && 
           assetData.description &&
           assetData.totalSupply &&
           parseFloat(assetData.value) > 0 &&
           parseInt(assetData.totalSupply) > 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      setError('Compila tutti i campi richiesti con valori validi');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
    setError(null);
  };

  const handleTokenize = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Iniziando tokenizzazione reale...', assetData);

      // Prepara i dati per la tokenizzazione
      const tokenData = {
        currency: assetData.tokenSymbol,
        name: assetData.name,
        description: assetData.description,
        assetType: assetData.assetType,
        totalSupply: parseInt(assetData.totalSupply),
        assetValue: parseFloat(assetData.value),
        issuer: walletData.address,
        metadata: {
          createdAt: new Date().toISOString(),
          platform: 'SolCraft Nexus',
          version: '1.0'
        }
      };

      // Crea il token reale su XRPL
      const result = await xrplTokenizationService.createToken(tokenData, walletData);

      if (result.success) {
        setSuccess(true);
        setTransactionHash(result.transactionHash);
        console.log('✅ Token creato con successo:', result);
        
        // Notifica successo dopo 3 secondi
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Errore durante la creazione del token');
      }

    } catch (error) {
      console.error('❌ Errore tokenizzazione:', error);
      setError(error.message || 'Errore durante la creazione del token');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
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
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ color: '#10b981', marginBottom: '15px' }}>Token Creato con Successo!</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Il token <strong>{assetData.tokenSymbol}</strong> è stato creato sulla blockchain XRPL.
          </p>
          {transactionHash && (
            <div style={{ 
              background: '#f0f9ff', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              wordBreak: 'break-all'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#0369a1' }}>
                <strong>Hash Transazione:</strong><br />
                {transactionHash}
              </p>
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Il token apparirà nella tua dashboard a breve...
          </p>
        </div>
      </div>
    );
  }

  return (
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
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#1a202c' }}>🏷️ Tokenizza Asset</h2>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#666',
              opacity: loading ? 0.5 : 1
            }}
          >
            ×
          </button>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            {[1, 2, 3].map(stepNum => (
              <div
                key={stepNum}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: step >= stepNum ? '#3b82f6' : '#e5e7eb',
                  color: step >= stepNum ? 'white' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
            <span>Asset</span>
            <span>Revisione</span>
            <span>Creazione</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#dc2626'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Content */}
        {step === 1 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>📋 Informazioni Asset</h3>
            
            {/* Tipo Asset */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tipo Asset</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                {assetTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleInputChange('assetType', type.id)}
                    style={{
                      padding: '8px',
                      border: assetData.assetType === type.id ? '2px solid #3b82f6' : '1px solid #ccc',
                      borderRadius: '6px',
                      background: assetData.assetType === type.id ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textAlign: 'center'
                    }}
                  >
                    <div>{type.icon}</div>
                    <div>{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nome Asset */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome Asset *</label>
              <input
                type="text"
                value={assetData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="es. Appartamento Milano Centro"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Descrizione */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrizione *</label>
              <textarea
                value={assetData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrizione dettagliata dell'asset..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Valore e Supply */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Valore Asset (€) *</label>
                <input
                  type="number"
                  value={assetData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder="450000"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Supply Totale *</label>
                <input
                  type="number"
                  value={assetData.totalSupply}
                  onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                  placeholder="1000000"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {/* Simbolo Token */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Simbolo Token *</label>
              <input
                type="text"
                value={assetData.tokenSymbol}
                onChange={(e) => handleInputChange('tokenSymbol', e.target.value.toUpperCase().substring(0, 12))}
                placeholder="MILAPP"
                maxLength="12"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Massimo 12 caratteri, solo lettere e numeri
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>📊 Riepilogo</h3>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Tipo:</strong> {assetTypes.find(t => t.id === assetData.assetType)?.name || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Asset:</strong> {assetData.name || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Descrizione:</strong> {assetData.description || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Valore:</strong> €{assetData.value ? parseFloat(assetData.value).toLocaleString() : '0'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Token:</strong> {assetData.tokenSymbol || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Supply:</strong> {assetData.totalSupply ? parseInt(assetData.totalSupply).toLocaleString() : '0'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Wallet:</strong> {walletData?.name || walletData?.type || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Indirizzo:</strong> 
                <code style={{ 
                  background: '#e5e7eb', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem',
                  marginLeft: '8px'
                }}>
                  {walletData?.address || 'N/A'}
                </code>
              </div>
            </div>
            
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '15px'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#92400e', margin: 0 }}>
                ⚠️ <strong>Attenzione:</strong> La creazione del token richiederà una transazione XRPL. 
                Assicurati di avere XRP sufficienti per le commissioni di rete.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px' }}>🚀 Creazione Token</h3>
            
            {loading ? (
              <div>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <p style={{ color: '#666', marginBottom: '10px' }}>
                  Creazione token in corso...
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  Autorizza la transazione nel tuo wallet
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚡</div>
                <p style={{ marginBottom: '20px', color: '#666' }}>
                  Pronto per creare il token <strong>{assetData.tokenSymbol}</strong> sulla blockchain XRPL?
                </p>
                <button
                  onClick={handleTokenize}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#059669'}
                  onMouseOut={(e) => e.target.style.background = '#10b981'}
                >
                  🏷️ Crea Token su XRPL
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={step > 1 ? handlePrev : onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {step > 1 ? '← Indietro' : 'Annulla'}
          </button>
          
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={!validateStep1() || loading}
              style={{
                background: validateStep1() && !loading ? '#3b82f6' : '#ccc',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: validateStep1() && !loading ? 'pointer' : 'not-allowed'
              }}
            >
              Avanti →
            </button>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TokenizationSimple;

