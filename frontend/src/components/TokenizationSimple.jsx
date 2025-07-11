import React, { useState } from 'react';

/**
 * Sistema di Tokenizzazione Semplificato per Debug
 */
const TokenizationSimple = ({ walletData, onClose }) => {
  const [step, setStep] = useState(1);
  const [assetData, setAssetData] = useState({
    name: '',
    value: '',
    tokenSymbol: ''
  });

  const handleInputChange = (field, value) => {
    setAssetData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleTokenize = () => {
    alert(`Token ${assetData.tokenSymbol} creato con successo!`);
    onClose();
  };

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
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
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

        {/* Content */}
        {step === 1 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>📋 Informazioni Asset</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome Asset</label>
              <input
                type="text"
                value={assetData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="es. Appartamento Milano"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Valore (€)</label>
              <input
                type="number"
                value={assetData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="es. 450000"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Simbolo Token</label>
              <input
                type="text"
                value={assetData.tokenSymbol}
                onChange={(e) => handleInputChange('tokenSymbol', e.target.value.toUpperCase())}
                placeholder="es. MILAPP"
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
        )}

        {step === 2 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>📊 Riepilogo</h3>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Asset:</strong> {assetData.name || 'N/A'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Valore:</strong> €{assetData.value ? parseFloat(assetData.value).toLocaleString() : '0'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Token:</strong> {assetData.tokenSymbol || 'N/A'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Wallet:</strong> {walletData?.type || 'N/A'}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px' }}>🚀 Creazione Token</h3>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚡</div>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Pronto per creare il token <strong>{assetData.tokenSymbol}</strong>?
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
                cursor: 'pointer'
              }}
            >
              🏷️ Crea Token
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={step > 1 ? handlePrev : onClose}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {step > 1 ? '← Indietro' : 'Annulla'}
          </button>
          
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={!assetData.name || !assetData.value || !assetData.tokenSymbol}
              style={{
                background: assetData.name && assetData.value && assetData.tokenSymbol ? '#3b82f6' : '#ccc',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: assetData.name && assetData.value && assetData.tokenSymbol ? 'pointer' : 'not-allowed'
              }}
            >
              Avanti →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenizationSimple;

