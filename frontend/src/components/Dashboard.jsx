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
import TransactionModal from './TransactionModal';

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

  // Stati Transazioni XRPL
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('payment');

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
        const balanceResult = await CrossmarkService.getBalance(user.wallet.address);
        if (balanceResult.success) {
          setWalletBalance(balanceResult.balance);
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
      year: 'numeric'
    });
  };

  const getKYCStatusColor = (level) => {
    switch (level) {
      case 0: return '#ef4444'; // Rosso
      case 1: return '#f59e0b'; // Arancione
      case 2: return '#eab308'; // Giallo
      case 3: return '#22c55e'; // Verde
      case 4: return '#10b981'; // Verde scuro
      default: return '#6b7280'; // Grigio
    }
  };

  const getKYCStatusText = (level) => {
    switch (level) {
      case 0: return 'Non Verificato';
      case 1: return 'Email Verificata';
      case 2: return 'Documento Verificato';
      case 3: return 'Indirizzo Verificato';
      case 4: return 'Completamente Verificato';
      default: return 'Sconosciuto';
    }
  };

  const getKYCLimitText = (level) => {
    switch (level) {
      case 0: return '€500';
      case 1: return '€2.500';
      case 2: return '€10.000';
      case 3: return '€50.000';
      case 4: return 'Illimitato';
      default: return '€0';
    }
  };

  const openTransactionModal = (type) => {
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const handleKYCComplete = () => {
    setShowKYCModal(false);
    loadKYCData(); // Ricarica i dati KYC
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        Caricamento dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header con saluto e notifiche */}
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
            Ciao, {user.name || 'Utente'}! 👋
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: '1rem'
          }}>
            Benvenuto nella tua dashboard di investimenti
          </p>
        </div>

        {/* Pulsante notifiche */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              padding: '0.75rem',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
          >
            🔔
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                backgroundColor: '#ef4444',
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

          {/* Dropdown notifiche */}
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
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      backgroundColor: notification.read ? 'white' : '#f0f9ff'
                    }}
                  >
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: notification.read ? 'normal' : '600',
                      marginBottom: '0.25rem'
                    }}>
                      {notification.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {formatDate(notification.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Errore se presente */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem' }}>
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Cards principali */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Portfolio Value */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💼</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Valore Portfolio
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            {formatCurrency(totalValue)}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: totalGain >= 0 ? '#10b981' : '#ef4444',
            fontWeight: '600'
          }}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({totalGainPercentage}%)
          </div>
        </div>

        {/* Wallet Balance */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🪙</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Saldo Wallet XRP
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            {walletBalance !== null ? `${walletBalance.toFixed(6)} XRP` : 'Caricamento...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {user.wallet?.address ? `${user.wallet.address.substring(0, 10)}...` : 'Wallet non connesso'}
          </div>
        </div>

        {/* KYC Status */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🆔</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Stato Verifica
            </h3>
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: getKYCStatusColor(kycData?.level || 0),
            marginBottom: '0.5rem'
          }}>
            {getKYCStatusText(kycData?.level || 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Limite: {getKYCLimitText(kycData?.level || 0)}
          </div>
          <button
            onClick={() => setShowKYCModal(true)}
            disabled={kycLoading}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: kycLoading ? 'not-allowed' : 'pointer',
              opacity: kycLoading ? 0.5 : 1
            }}
          >
            {kycLoading ? 'Caricamento...' : 'Verifica Ora'}
          </button>
        </div>

        {/* Azioni XRPL */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Transazioni XRPL
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => openTransactionModal('payment')}
              disabled={!user.wallet || user.provider !== 'Crossmark'}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: user.wallet && user.provider === 'Crossmark' ? '#10b981' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: user.wallet && user.provider === 'Crossmark' ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              💸 Invia XRP
            </button>
            <button
              onClick={() => openTransactionModal('tokenize')}
              disabled={!user.wallet || user.provider !== 'Crossmark'}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: user.wallet && user.provider === 'Crossmark' ? '#8b5cf6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: user.wallet && user.provider === 'Crossmark' ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              🪙 Tokenizza Asset
            </button>
          </div>
          {(!user.wallet || user.provider !== 'Crossmark') && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              Connetti Crossmark per transazioni reali
            </div>
          )}
        </div>
      </div>

      {/* Sezioni aggiuntive */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1.5rem'
      }}>
        {/* Portfolio Assets */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            📊 I Tuoi Asset
          </h3>
          {portfolioData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              Nessun asset nel portfolio
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {portfolioData.slice(0, 5).map((asset, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < portfolioData.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {asset.name || asset.asset_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {asset.type || asset.asset_type}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {formatCurrency(asset.current_value || asset.value)}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: (asset.change || 0) >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {(asset.change || 0) >= 0 ? '+' : ''}{(asset.change || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            💳 Transazioni Recenti
          </h3>
          {transactionsData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              Nessuna transazione recente
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {transactionsData.slice(0, 5).map((transaction, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < transactionsData.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {transaction.description || transaction.type}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatDate(transaction.date || transaction.created_at)}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '0.875rem',
                    color: (transaction.amount || 0) >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {(transaction.amount || 0) >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount || 0))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showKYCModal && (
        <KYCModal
          isOpen={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          onComplete={handleKYCComplete}
          user={user}
          currentLevel={kycData?.level || 0}
        />
      )}

      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          user={user}
          transactionType={transactionType}
        />
      )}
    </div>
  );
};

export default Dashboard;

