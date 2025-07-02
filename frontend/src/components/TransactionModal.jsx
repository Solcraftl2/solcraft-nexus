import { logger } from '../../../netlify/functions/utils/logger.js';
import React, { useState, useEffect } from 'react';
import { xrplService, XRPLUtils } from '../services/xrplService';
import { CrossmarkService } from '../services/walletService';

const TransactionModal = ({ isOpen, onClose, user, transactionType = 'payment' }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Dati transazione
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    currency: 'XRP',
    memo: '',
    assetName: '',
    assetDescription: '',
    totalSupply: ''
  });
  
  // Dati account
  const [accountInfo, setAccountInfo] = useState(null);
  const [networkFees, setNetworkFees] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);

  useEffect(() => {
    if (isOpen && user?.wallet?.address) {
      loadAccountData();
    }
  }, [isOpen, user]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      // Carica info account
      const accountResult = await xrplService.getAccountInfo(user.wallet.address);
      if (accountResult.success) {
        setAccountInfo(accountResult.data);
      }
      
      // Carica commissioni di rete
      const feesResult = await xrplService.getNetworkFees();
      if (feesResult.success) {
        setNetworkFees(feesResult.data);
      }
      
    } catch (error) {
      logger.error('Errore caricamento dati account:', error);
      setError('Errore nel caricamento dei dati dell\'account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateTransaction = () => {
    if (transactionType === 'payment') {
      if (!formData.recipient) {
        setError('Inserisci l\'indirizzo del destinatario');
        return false;
      }
      
      if (!XRPLService.isValidAddress(formData.recipient)) {
        setError('Indirizzo destinatario non valido');
        return false;
      }
      
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Inserisci un importo valido');
        return false;
      }
      
      if (accountInfo && parseFloat(formData.amount) > accountInfo.balance - 10) {
        setError('Saldo insufficiente (considera la riserva di 10 XRP)');
        return false;
      }
    }
    
    if (transactionType === 'tokenize') {
      if (!formData.assetName || formData.assetName.length < 3) {
        setError('Nome asset deve essere di almeno 3 caratteri');
        return false;
      }
      
      if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) {
        setError('Inserisci una fornitura totale valida');
        return false;
      }
    }
    
    return true;
  };

  const executeTransaction = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!validateTransaction()) {
        setLoading(false);
        return;
      }

      // Ottieni wallet da Crossmark
      if (user.provider !== 'Crossmark') {
        throw new Error('Transazioni supportate solo con Crossmark');
      }

      let result;
      
      if (transactionType === 'payment') {
        // Esegui pagamento XRP
        result = await executePayment();
      } else if (transactionType === 'tokenize') {
        // Esegui tokenizzazione asset
        result = await executeTokenization();
      }
      
      if (result.success) {
        setTransactionResult(result.data);
        setSuccess(true);
        setStep(3);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      logger.error('Errore esecuzione transazione:', error);
      setError(error.message || 'Errore durante l\'esecuzione della transazione');
    } finally {
      setLoading(false);
    }
  };

  const executePayment = async () => {
    try {
      // Richiedi firma tramite Crossmark
      const paymentData = {
        TransactionType: 'Payment',
        Account: user.wallet.address,
        Destination: formData.recipient,
        Amount: XRPLUtils.xrpToDrops(formData.amount),
        Fee: '12'
      };

      if (formData.memo) {
        paymentData.Memos = [{
          Memo: {
            MemoData: Buffer.from(formData.memo, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      // Usa Crossmark per firmare e inviare
      const signResult = await CrossmarkService.signAndSubmit(paymentData);
      
      if (signResult.success) {
        return {
          success: true,
          data: {
            hash: signResult.hash,
            amount: formData.amount,
            recipient: formData.recipient,
            memo: formData.memo,
            type: 'payment'
          }
        };
      } else {
        throw new Error(signResult.error);
      }
      
    } catch (error) {
      throw error;
    }
  };

  const executeTokenization = async () => {
    try {
      const currencyCode = XRPLUtils.generateCurrencyCode(formData.assetName);
      
      // Crea token personalizzato
      const tokenData = {
        TransactionType: 'Payment',
        Account: user.wallet.address,
        Destination: user.wallet.address,
        Amount: {
          currency: currencyCode,
          value: formData.totalSupply,
          issuer: user.wallet.address
        },
        Fee: '12'
      };

      if (formData.assetDescription) {
        tokenData.Memos = [{
          Memo: {
            MemoData: Buffer.from(formData.assetDescription, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      const signResult = await CrossmarkService.signAndSubmit(tokenData);
      
      if (signResult.success) {
        return {
          success: true,
          data: {
            hash: signResult.hash,
            assetName: formData.assetName,
            currencyCode: currencyCode,
            totalSupply: formData.totalSupply,
            issuer: user.wallet.address,
            type: 'tokenization'
          }
        };
      } else {
        throw new Error(signResult.error);
      }
      
    } catch (error) {
      throw error;
    }
  };

  const resetModal = () => {
    setStep(1);
    setLoading(false);
    setError('');
    setSuccess(false);
    setFormData({
      recipient: '',
      amount: '',
      currency: 'XRP',
      memo: '',
      assetName: '',
      assetDescription: '',
      totalSupply: ''
    });
    setTransactionResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            margin: 0,
            color: '#1f2937'
          }}>
            {transactionType === 'payment' ? '💸 Invia Pagamento' : '🪙 Tokenizza Asset'}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: step >= stepNum ? '#3b82f6' : '#e5e7eb',
                color: step >= stepNum ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div style={{
                  width: '3rem',
                  height: '2px',
                  backgroundColor: step > stepNum ? '#3b82f6' : '#e5e7eb',
                  margin: '0 0.5rem'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Account Info */}
        {accountInfo && (
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
              💼 Il Tuo Account
            </h4>
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#6b7280' }}>
              Indirizzo: {user.wallet.address}
            </p>
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#6b7280' }}>
              Saldo: {accountInfo.balance} XRP
            </p>
            {networkFees && (
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                Commissione rete: {networkFees.recommendedFee} XRP
              </p>
            )}
          </div>
        )}

        {/* Step 1: Form Input */}
        {step === 1 && (
          <div>
            {transactionType === 'payment' ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Indirizzo Destinatario
                  </label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange('recipient', e.target.value)}
                    placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Importo (XRP)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.000000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Memo (opzionale)
                  </label>
                  <input
                    type="text"
                    value={formData.memo}
                    onChange={(e) => handleInputChange('memo', e.target.value)}
                    placeholder="Descrizione del pagamento"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Nome Asset
                  </label>
                  <input
                    type="text"
                    value={formData.assetName}
                    onChange={(e) => handleInputChange('assetName', e.target.value)}
                    placeholder="Villa Roma Centro"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Fornitura Totale Token
                  </label>
                  <input
                    type="number"
                    value={formData.totalSupply}
                    onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                    placeholder="1000000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Descrizione Asset
                  </label>
                  <textarea
                    value={formData.assetDescription}
                    onChange={(e) => handleInputChange('assetDescription', e.target.value)}
                    placeholder="Descrizione dettagliata dell'asset..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Caricamento...' : 'Continua'}
            </button>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              🔍 Conferma Transazione
            </h3>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {transactionType === 'payment' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Destinatario:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{formData.recipient}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Importo:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{formData.amount} XRP</span>
                  </div>
                  {formData.memo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Memo:</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{formData.memo}</span>
                    </div>
                  )}
                  {networkFees && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Commissione:</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{networkFees.recommendedFee} XRP</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Asset:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{formData.assetName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Codice Token:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{XRPLUtils.generateCurrencyCode(formData.assetName)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fornitura:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{formData.totalSupply} token</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Emittente:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.wallet.address}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Indietro
              </button>
              <button
                onClick={executeTransaction}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? 'Elaborazione...' : 'Conferma Transazione'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && success && transactionResult && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#10b981'
            }}>
              Transazione Completata!
            </h3>

            <div style={{
              backgroundColor: '#ecfdf5',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hash:</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', fontFamily: 'monospace' }}>
                  {transactionResult.hash}
                </span>
              </div>
              {transactionType === 'payment' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Importo:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{transactionResult.amount} XRP</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Destinatario:</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{transactionResult.recipient}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Token:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{transactionResult.currencyCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fornitura:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{transactionResult.totalSupply}</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginTop: '1rem'
          }}>
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
              ⚠️ {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;

