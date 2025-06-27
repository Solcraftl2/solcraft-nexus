import React, { useState, useEffect } from 'react';
import { 
  getUserPortfolio, 
  getUserTransactions, 
  getUserNotifications,
  markNotificationAsRead as markNotificationRead
} from '../services/supabaseService';
import { CrossmarkService } from '../services/walletService';

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

  // Carica dati reali all'avvio
  useEffect(() => {
    if (user && !user.isSimulated) {
      loadRealData();
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
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f4f6', 
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280' }}>Caricamento dati reali...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header con informazioni utente e wallet */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '1rem', 
        padding: '2rem', 
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              🚀 SolCraft Nexus Dashboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              Benvenuto, <strong>{user?.name || 'Utente'}</strong>
              {!user.isSimulated && <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>🔗 Connessione Reale</span>}
              {user.isSimulated && <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>🎭 Modalità Demo</span>}
            </p>
          </div>
          
          {/* Notifiche */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              🔔
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-0.25rem',
                  right: '-0.25rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '1.5rem',
                  height: '1.5rem',
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
          </div>
        </div>

        {/* Informazioni Wallet */}
        {user.wallet && (
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            border: '1px solid #0ea5e9'
          }}>
            <p style={{ color: '#0369a1', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <strong>Wallet {user.provider}:</strong> {user.wallet.address}
            </p>
            {walletBalance !== null && (
              <p style={{ color: '#0369a1', fontSize: '0.875rem' }}>
                <strong>Balance:</strong> {walletBalance.toFixed(6)} XRP
              </p>
            )}
            <p style={{ color: '#0369a1', fontSize: '0.75rem' }}>
              Network: {user.wallet.network} | Tipo: {user.wallet.type}
            </p>
          </div>
        )}

        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            border: '1px solid #fecaca',
            marginTop: '1rem'
          }}>
            <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { icon: '💼', label: 'Wallet', key: 'wallet' },
          { icon: '🏠', label: 'Assets', key: 'assets' },
          { icon: '🪙', label: 'Tokenize', key: 'tokenize' },
          { icon: '🛒', label: 'Marketplace', key: 'marketplace' },
          { icon: '📚', label: 'Learn', key: 'learn' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              minWidth: '100px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Portfolio Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Valore Portfolio */}
        <div style={{ 
          backgroundColor: '#10b981', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💰</span>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Valore Portafoglio</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {formatCurrency(totalValue)}
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            📈 {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({totalGainPercentage >= 0 ? '+' : ''}{totalGainPercentage}%)
          </p>
        </div>

        {/* Asset Tokenizzati */}
        <div style={{ 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🏠</span>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Asset Tokenizzati</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {portfolioData.length}
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Immobiliare, Startup, Arte
          </p>
        </div>

        {/* Performance */}
        <div style={{ 
          backgroundColor: '#8b5cf6', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📊</span>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Performance</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            +{Math.abs(parseFloat(totalGainPercentage)).toFixed(1)}%
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Ultimi 6 mesi
          </p>
        </div>

        {/* Investimento Totale */}
        <div style={{ 
          backgroundColor: '#f59e0b', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💸</span>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Investimento Totale</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {formatCurrency(totalInvested)}
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Capitale investito
          </p>
        </div>
      </div>

      {/* Transazioni Recenti */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '1rem', 
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
          📋 Transazioni Recenti
        </h3>
        
        {transactionsData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {transactionsData.slice(0, 5).map((transaction, index) => (
              <div key={transaction.id || index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {transaction.type === 'buy' && '🛒'}
                    {transaction.type === 'sell' && '💰'}
                    {transaction.type === 'dividend' && '💎'}
                  </span>
                  <div>
                    <p style={{ fontWeight: '600', color: '#1f2937' }}>
                      {transaction.type} • {transaction.asset_name || transaction.description}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(transaction.created_at || transaction.date)}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ 
                    fontWeight: 'bold', 
                    color: transaction.amount > 0 ? '#10b981' : '#ef4444' 
                  }}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ✅ {transaction.status || 'Completata'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <p>Nessuna transazione trovata</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Le tue transazioni appariranno qui
            </p>
          </div>
        )}
      </div>

      {/* Pannello Notifiche */}
      {showNotifications && (
        <div style={{
          position: 'fixed',
          top: '5rem',
          right: '1rem',
          width: '300px',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <h4 style={{ fontWeight: 'bold', color: '#1f2937' }}>Notifiche</h4>
          </div>
          <div style={{ padding: '0.5rem' }}>
            {notifications.length > 0 ? notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  backgroundColor: notification.read ? 'transparent' : '#f0f9ff',
                  borderLeft: notification.read ? 'none' : '3px solid #3b82f6',
                  marginBottom: '0.25rem'
                }}
              >
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: notification.read ? 'normal' : 'bold',
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  {notification.title}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {notification.message}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {formatDate(notification.created_at)}
                </p>
              </div>
            )) : (
              <p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                Nessuna notifica
              </p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

