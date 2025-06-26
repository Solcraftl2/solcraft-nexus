import React, { useState, useEffect } from 'react';
import { 
  sampleUserProfile, 
  samplePortfolio, 
  sampleTransactions, 
  sampleOrders,
  sampleAssets 
} from '../data/sampleData';

const WalletPage = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioData] = useState(samplePortfolio);
  const [transactions] = useState(sampleTransactions);
  const [orders] = useState(sampleOrders);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('100');

  // Calculate metrics
  const totalValue = portfolioData.reduce((sum, item) => sum + item.current_value, 0);
  const totalInvested = portfolioData.reduce((sum, item) => sum + item.total_invested, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercentage = ((totalGain / totalInvested) * 100).toFixed(1);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateQRCode = (data) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  };

  const handleSend = () => {
    if (!sendAmount || !sendAddress) {
      alert('Inserisci importo e indirizzo di destinazione');
      return;
    }
    alert(`Transazione inviata: ${sendAmount} EUR a ${sendAddress}`);
    setSendAmount('');
    setSendAddress('');
  };

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: '📊' },
    { id: 'assets', label: 'Asset', icon: '🏠' },
    { id: 'transactions', label: 'Transazioni', icon: '🔄' },
    { id: 'send', label: 'Invia', icon: '📤' },
    { id: 'receive', label: 'Ricevi', icon: '📥' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            ← 
          </button>
          <h1 style={{ 
            margin: 0, 
            color: '#1a202c',
            fontSize: '2rem',
            fontWeight: '700',
            display: 'inline'
          }}>
            💼 Wallet
          </h1>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          background: '#F3F4F6',
          padding: '0.75rem 1rem',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Saldo Totale:</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '1rem',
        marginBottom: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6B7280',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        minHeight: '500px'
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>📊 Panoramica Wallet</h2>
            
            {/* Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                color: 'white'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>
                  Valore Totale
                </h3>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
                  {formatCurrency(totalValue)}
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                color: 'white'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>
                  Investimento
                </h3>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
                  {formatCurrency(totalInvested)}
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                color: 'white'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>
                  Guadagno/Perdita
                </h3>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
                  {formatCurrency(totalGain)}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
                  ({totalGainPercentage}%)
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                color: 'white'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>
                  Asset Posseduti
                </h3>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
                  {portfolioData.length}
                </p>
              </div>
            </div>

            {/* Wallet Info */}
            <div style={{
              background: '#F9FAFB',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>Informazioni Wallet</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Tipo Wallet:</span>
                  <span style={{ fontWeight: '600', color: '#1F2937', textTransform: 'uppercase' }}>
                    {user?.walletType || sampleUserProfile.wallet_type}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Indirizzo:</span>
                  <span style={{ fontWeight: '600', color: '#1F2937', fontFamily: 'monospace' }}>
                    {user?.address || sampleUserProfile.wallet_address}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Status KYC:</span>
                  <span style={{ 
                    fontWeight: '600', 
                    color: sampleUserProfile.kyc_status === 'approved' ? '#10B981' : '#F59E0B',
                    textTransform: 'capitalize'
                  }}>
                    {sampleUserProfile.kyc_status === 'approved' ? '✅ Approvato' : '⏳ In corso'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>🏠 I Tuoi Asset</h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {portfolioData.map(item => (
                <div key={item.id} style={{
                  background: '#F9FAFB',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {item.assets.asset_categories.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: '#1F2937' }}>
                        {item.assets.name}
                      </h3>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                        {item.assets.symbol} • {item.tokens_owned} token posseduti
                      </p>
                      <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.8rem' }}>
                        Acquistato il {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#1F2937' }}>
                      {formatCurrency(item.current_value)}
                    </p>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#6B7280' }}>
                      Investito: {formatCurrency(item.total_invested)}
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      color: item.current_value >= item.total_invested ? '#10B981' : '#EF4444'
                    }}>
                      {item.current_value >= item.total_invested ? '+' : ''}{formatCurrency(item.current_value - item.total_invested)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>🔄 Cronologia Transazioni</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {transactions.map(transaction => (
                <div key={transaction.id} style={{
                  background: '#F9FAFB',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: transaction.transaction_type === 'buy' ? '#3B82F6' : 
                                 transaction.transaction_type === 'sell' ? '#EF4444' : '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {transaction.transaction_type === 'buy' && '🛒'}
                      {transaction.transaction_type === 'sell' && '💰'}
                      {transaction.transaction_type === 'dividend' && '💎'}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: '#1F2937', textTransform: 'capitalize' }}>
                        {transaction.transaction_type} {transaction.assets.symbol}
                      </h3>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                        {transaction.tokens} token • {formatCurrency(transaction.price_per_token)} per token
                      </p>
                      <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.8rem' }}>
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ 
                      margin: '0 0 0.25rem 0', 
                      fontSize: '1.2rem', 
                      fontWeight: '700',
                      color: transaction.transaction_type === 'dividend' ? '#10B981' : '#1F2937'
                    }}>
                      {transaction.transaction_type === 'dividend' ? '+' : ''}{formatCurrency(transaction.total_amount)}
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.9rem',
                      color: transaction.status === 'completed' ? '#10B981' : '#F59E0B'
                    }}>
                      {transaction.status === 'completed' ? '✅ Completata' : '⏳ In corso'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>📤 Invia Fondi</h2>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                  Importo (EUR)
                </label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                  Indirizzo Destinatario
                </label>
                <input
                  type="text"
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  placeholder="rN7n7otQDd6FczFgLdSqnVgqiTZUA9CN1xJ"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    fontFamily: 'monospace'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <button
                onClick={handleSend}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                📤 Invia Transazione
              </button>

              {sendAmount && sendAddress && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#F0F9FF',
                  borderRadius: '12px',
                  border: '1px solid #BAE6FD'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369A1' }}>Riepilogo Transazione</h4>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#0284C7' }}>
                    Importo: <strong>{formatCurrency(parseFloat(sendAmount))}</strong>
                  </p>
                  <p style={{ margin: 0, color: '#0284C7', fontSize: '0.9rem' }}>
                    Destinatario: <code>{sendAddress}</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Receive Tab */}
        {activeTab === 'receive' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>📥 Ricevi Fondi</h2>
            <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                  Importo da Ricevere (EUR)
                </label>
                <input
                  type="number"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  placeholder="100.00"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    textAlign: 'center'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid #E5E7EB',
                marginBottom: '1.5rem'
              }}>
                <img 
                  src={generateQRCode(`${user?.address || sampleUserProfile.wallet_address}?amount=${receiveAmount}`)}
                  alt="QR Code"
                  style={{ width: '200px', height: '200px', borderRadius: '12px' }}
                />
              </div>

              <div style={{
                background: '#F9FAFB',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>Il Tuo Indirizzo Wallet</h4>
                <div style={{
                  background: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  color: '#374151',
                  wordBreak: 'break-all'
                }}>
                  {user?.address || sampleUserProfile.wallet_address}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.address || sampleUserProfile.wallet_address);
                    alert('Indirizzo copiato negli appunti!');
                  }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  📋 Copia Indirizzo
                </button>
              </div>

              <div style={{
                background: '#FEF3C7',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #F59E0B'
              }}>
                <p style={{ margin: 0, color: '#92400E', fontSize: '0.9rem' }}>
                  ⚠️ Condividi questo QR code o indirizzo solo con persone fidate. 
                  Verifica sempre l'importo prima di confermare la transazione.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;

