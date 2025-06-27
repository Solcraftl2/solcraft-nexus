import React, { useState, useEffect } from 'react';
import { 
  getUserPortfolio, 
  getUserTransactions, 
  getUserNotifications,
  markNotificationAsRead as markNotificationRead
} from '../services/supabaseService';
import { CrossmarkService } from '../services/walletService';
import { KYCService } from '../services/kycService';
import KYCModal from './KYCModal';

// Fallback ai dati simulati se non ci sono dati reali
import { 
  sampleUserProfile, 
  samplePortfolio, 
  sampleTransactions, 
  sampleNotifications,
  samplePerformanceData,
  sampleAssetAllocation,
  sampleMarketTrends 
} from '../data/sampleData';

const Dashboard = ({ user, onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [portfolioData, setPortfolioData] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [performanceData] = useState(samplePerformanceData);
  const [assetAllocation] = useState(sampleAssetAllocation);
  const [marketTrends] = useState(sampleMarketTrends);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  
  // Stati KYC
  const [kycData, setKycData] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);

  // Carica dati reali all'avvio
  useEffect(() => {
    if (user && !user.isSimulated) {
      loadRealData();
      loadKYCData();
    } else {
      // Usa dati simulati per utenti demo
      setNotifications(sampleNotifications);
      setPortfolioData(samplePortfolio);
      setTransactionsData(sampleTransactions);
      setLoading(false);
    }
  }, [user]);

  const loadRealData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carica dati dal database se l'utente ha un ID
      if (user.userId) {
        // Carica portfolio reale
        const portfolio = await getUserPortfolio(user.userId);
        setPortfolioData(portfolio || []);

        // Carica transazioni reali
        const transactions = await getUserTransactions(user.userId, 10);
        setTransactionsData(transactions || []);

        // Carica notifiche reali
        const notifications = await getUserNotifications(user.userId);
        setNotifications(notifications || []);
      }

      // Carica balance del wallet se connesso a Crossmark
      if (user.wallet && user.provider === 'Crossmark') {
        await loadWalletBalance();
      }

    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setError('Errore nel caricamento dei dati. Usando dati di esempio.');
      
      // Fallback ai dati simulati in caso di errore
      setNotifications(sampleNotifications);
      setPortfolioData(samplePortfolio);
      setTransactionsData(sampleTransactions);
    } finally {
      setLoading(false);
    }
  };

  const loadKYCData = async () => {
    try {
      setKycLoading(true);
      if (user.userId) {
        const result = await KYCService.getUserKYCStatus(user.userId);
        if (result.success) {
          setKycData(result);
        }
      }
    } catch (error) {
      console.error('Errore caricamento dati KYC:', error);
    } finally {
      setKycLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      if (user.provider === 'Crossmark' && user.wallet?.address) {
        const accountInfo = await CrossmarkService.getAccountInfo(user.wallet.address);
        if (accountInfo?.account_data?.Balance) {
          // Converti da drops a XRP
          const balanceXRP = parseInt(accountInfo.account_data.Balance) / 1000000;
          setWalletBalance(balanceXRP);
        }
      }
    } catch (error) {
      console.error('Errore caricamento balance wallet:', error);
      // Non bloccare l'interfaccia per errori di balance
    }
  };

  // Calculate portfolio metrics
  const totalValue = portfolioData.reduce((sum, item) => sum + (item.current_value || 0), 0);
  const totalInvested = portfolioData.reduce((sum, item) => sum + (item.total_invested || 0), 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercentage = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : '0.0';

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = async (id) => {
    try {
      if (!user.isSimulated) {
        await markNotificationRead(id);
      }
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Errore marcatura notifica:', error);
    }
  };

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

  const handleKYCUpdate = () => {
    loadKYCData(); // Ricarica i dati KYC dopo un aggiornamento
  };

  const renderKYCStatus = () => {
    if (kycLoading) {
      return (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: 0, color: '#6b7280' }}>🔄 Caricamento stato KYC...</p>
        </div>
      );
    }

    if (!kycData) return null;

    const level = kycData.levelInfo;
    const needsKYC = kycData.kycLevel < 2;

    return (
      <div style={{
        padding: '1rem',
        backgroundColor: needsKYC ? '#fef3c7' : '#ecfdf5',
        borderRadius: '0.5rem',
        border: `2px solid ${needsKYC ? '#f59e0b' : level.color}`,
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ 
            margin: '0 0 0.25rem 0', 
            color: needsKYC ? '#92400e' : level.color,
            fontWeight: '600'
          }}>
            {needsKYC ? '⚠️ Verifica Identità Richiesta' : `🆔 Livello KYC: ${level.name}`}
          </h4>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem', 
            color: needsKYC ? '#92400e' : '#6b7280'
          }}>
            {needsKYC 
              ? `Limite attuale: €${level.limit.toLocaleString()}. Completa la verifica per aumentare i limiti.`
              : `Limite transazioni: ${level.limit === Infinity ? 'Illimitato' : `€${level.limit.toLocaleString()}`}`
            }
          </p>
        </div>
        
        {needsKYC && (
          <button
            onClick={() => setShowKYCModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Verifica Ora
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Caricamento dashboard...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.5rem',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            margin: '0 0 0.5rem 0',
            color: '#1f2937'
          }}>
            🚀 SolCraft Nexus Dashboard
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Benvenuto, <strong>{user?.name || user?.email || 'Utente'}</strong>
          </p>
          {user?.wallet?.address && (
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#9ca3af', 
              margin: '0.25rem 0 0 0',
              fontFamily: 'monospace'
            }}>
              Wallet: {user.wallet.address}
              {walletBalance !== null && (
                <span style={{ marginLeft: '1rem', color: '#10b981', fontWeight: '600' }}>
                  Balance: {walletBalance.toFixed(2)} XRP
                </span>
              )}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('wallet')}
            style={{
              padding: '0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
            title="Portafoglio"
          >
            💼
          </button>
          
          <button
            onClick={() => onNavigate('assets')}
            style={{
              padding: '0.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
            title="I Miei Asset"
          >
            🏠
          </button>
          
          <button
            onClick={() => onNavigate('tokenize')}
            style={{
              padding: '0.5rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
            title="Tokenizza"
          >
            🪙
          </button>
          
          <button
            onClick={() => onNavigate('marketplace')}
            style={{
              padding: '0.5rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
            title="Marketplace"
          >
            🛒
          </button>
          
          <button
            onClick={() => onNavigate('learn')}
            style={{
              padding: '0.5rem',
              backgroundColor: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
            title="Impara"
          >
            📚
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.25rem',
                position: 'relative'
              }}
            >
              🔔
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-0.25rem',
                  right: '-0.25rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '50%',
                  width: '1.25rem',
                  height: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                width: '300px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 10,
                marginTop: '0.5rem'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                    Notifiche
                  </h3>
                </div>
                
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                    Nessuna notifica
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markNotificationAsRead(notification.id)}
                      style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        backgroundColor: notification.read ? 'white' : '#f0f9ff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ 
                            margin: '0 0 0.25rem 0', 
                            fontSize: '0.875rem',
                            fontWeight: notification.read ? '400' : '600'
                          }}>
                            {notification.title}
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.75rem', 
                            color: '#6b7280' 
                          }}>
                            {notification.message}
                          </p>
                          <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            fontSize: '0.625rem', 
                            color: '#9ca3af' 
                          }}>
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            marginLeft: '0.5rem',
                            marginTop: '0.25rem'
                          }} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KYC Status */}
      {renderKYCStatus()}

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Portfolio Value */}
        <div style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💰</span>
            <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Valore Portafoglio</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            {formatCurrency(totalValue || 11500)}
          </p>
          <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.8 }}>
            📈 {formatCurrency(totalGain || 850)} ({totalGainPercentage || '8.0'}%)
          </p>
        </div>

        {/* Asset Count */}
        <div style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🏠</span>
            <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Asset Tokenizzati</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            {portfolioData.length || 3}
          </p>
          <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.8 }}>
            Immobiliare, Startup, Arte
          </p>
        </div>

        {/* Performance */}
        <div style={{
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📊</span>
            <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Performance</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            +{totalGainPercentage || '8.0'}%
          </p>
          <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.8 }}>
            Ultimi 6 mesi
          </p>
        </div>

        {/* Total Investment */}
        <div style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💎</span>
            <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Investimento Totale</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            {formatCurrency(totalInvested || 10650)}
          </p>
          <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.8 }}>
            Capitale investito
          </p>
        </div>
      </div>

      {/* Charts and Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Portfolio Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            📈 Andamento Portfolio
          </h3>
          
          {/* Simple chart representation */}
          <div style={{ height: '200px', position: 'relative', backgroundColor: '#f8fafc', borderRadius: '0.5rem', padding: '1rem' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 150">
              <polyline
                points="0,120 50,100 100,80 150,70 200,60 250,50 300,45 350,40 400,35"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
              <polyline
                points="0,130 50,125 100,115 150,110 200,105 250,100 300,95 350,90 400,85"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
            <div style={{ position: 'absolute', bottom: '0.5rem', left: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
              <span style={{ color: '#10b981' }}>■</span> Portfolio
              <span style={{ marginLeft: '1rem', color: '#6b7280' }}>■</span> Benchmark
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem' }}>
            <span>Gen</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>Mag</span>
            <span>Giu</span>
          </div>
        </div>

        {/* Asset Allocation */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            🥧 Allocazione Asset
          </h3>
          
          {assetAllocation.map((asset, index) => (
            <div key={index} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{asset.name}</span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{asset.percentage}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatCurrency(asset.value)}</span>
                <span style={{ fontSize: '0.75rem', color: asset.change >= 0 ? '#10b981' : '#ef4444' }}>
                  {asset.change >= 0 ? '+' : ''}{asset.change}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '0.5rem',
                backgroundColor: '#e5e7eb',
                borderRadius: '0.25rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${asset.percentage}%`,
                  height: '100%',
                  backgroundColor: asset.color,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Trends */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
          📊 Tendenze di Mercato
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {marketTrends.map((trend, index) => (
            <div key={index} style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{trend.category}</span>
                <span style={{
                  fontSize: '0.75rem',
                  color: trend.change >= 0 ? '#10b981' : '#ef4444',
                  fontWeight: '600'
                }}>
                  {trend.change >= 0 ? '+' : ''}{trend.change}%
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                {trend.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            💳 Transazioni Recenti
          </h3>
          <button
            onClick={() => onNavigate('transactions')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Vedi Tutte
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                  Tipo
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                  Asset
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                  Data
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                  Importo
                </th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                  Stato
                </th>
              </tr>
            </thead>
            <tbody>
              {(transactionsData.length > 0 ? transactionsData : sampleTransactions).slice(0, 5).map((transaction, index) => (
                <tr key={transaction.id || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>
                      {transaction.type === 'buy' ? '🛒' : 
                       transaction.type === 'sell' ? '💰' : 
                       transaction.type === 'dividend' ? '💎' : '🔄'}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      {transaction.type === 'buy' ? 'buy' : 
                       transaction.type === 'sell' ? 'sell' : 
                       transaction.type === 'dividend' ? 'dividend' : transaction.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {transaction.asset_symbol || transaction.description}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatDate(transaction.created_at || transaction.date)}
                  </td>
                  <td style={{ 
                    padding: '0.75rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    textAlign: 'right',
                    color: transaction.amount >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: transaction.status === 'completed' ? '#dcfce7' : 
                                     transaction.status === 'pending' ? '#fef3c7' : '#fecaca',
                      color: transaction.status === 'completed' ? '#166534' : 
                             transaction.status === 'pending' ? '#92400e' : '#991b1b',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {transaction.status === 'completed' ? '✅ Completata' : 
                       transaction.status === 'pending' ? '⏳ In Corso' : '❌ Fallita'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Modal */}
      <KYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        user={user}
        onKYCUpdate={handleKYCUpdate}
      />

      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;

