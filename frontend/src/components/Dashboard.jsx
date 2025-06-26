import React, { useState, useEffect } from 'react';
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
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [portfolioData, setPortfolioData] = useState(samplePortfolio);
  const [performanceData] = useState(samplePerformanceData);
  const [assetAllocation] = useState(sampleAssetAllocation);
  const [marketTrends] = useState(sampleMarketTrends);

  // Calculate portfolio metrics
  const totalValue = portfolioData.reduce((sum, item) => sum + item.current_value, 0);
  const totalInvested = portfolioData.reduce((sum, item) => sum + item.total_invested, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercentage = ((totalGain / totalInvested) * 100).toFixed(1);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
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
          <h1 style={{ 
            margin: 0, 
            color: '#1a202c',
            fontSize: '2rem',
            fontWeight: '700'
          }}>
            🚀 SolCraft Nexus Dashboard
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: '#4a5568',
            fontSize: '1.1rem'
          }}>
            Benvenuto, <strong>{user?.name || sampleUserProfile.full_name}</strong>
          </p>
          <p style={{ 
            margin: '0.25rem 0 0 0', 
            color: '#718096',
            fontSize: '0.9rem'
          }}>
            Wallet: {user?.address || sampleUserProfile.wallet_address}
          </p>
        </div>

        {/* Navigation Menu */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['wallet', 'assets', 'tokenize', 'marketplace', 'learn'].map(page => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem'
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
              {page === 'wallet' && '💼'} 
              {page === 'assets' && '🏠'} 
              {page === 'tokenize' && '🪙'} 
              {page === 'marketplace' && '🛒'} 
              {page === 'learn' && '📚'} 
              {' ' + page}
            </button>
          ))}
          
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                padding: '0.75rem',
                background: unreadNotifications > 0 ? '#EF4444' : '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
            >
              🔔
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#DC2626',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                width: '350px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                marginTop: '0.5rem'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: 0, color: '#1F2937' }}>Notifiche</h3>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                    Nessuna notifica
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => markNotificationAsRead(notification.id)}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        background: notification.read ? 'white' : '#F0F9FF',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {notification.type === 'success' && '✅'}
                          {notification.type === 'info' && 'ℹ️'}
                          {notification.type === 'warning' && '⚠️'}
                          {notification.type === 'error' && '❌'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            margin: '0 0 0.25rem 0', 
                            fontSize: '0.9rem',
                            fontWeight: notification.read ? '500' : '600',
                            color: '#1F2937'
                          }}>
                            {notification.title}
                          </h4>
                          <p style={{ 
                            margin: '0 0 0.5rem 0', 
                            fontSize: '0.8rem',
                            color: '#6B7280',
                            lineHeight: '1.4'
                          }}>
                            {notification.message}
                          </p>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            color: '#9CA3AF' 
                          }}>
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          borderRadius: '20px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
            💼 Valore Portafoglio
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
            {formatCurrency(totalValue)}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
            <span style={{ color: totalGain >= 0 ? '#D1FAE5' : '#FEE2E2' }}>
              {totalGain >= 0 ? '↗️' : '↘️'} {formatCurrency(Math.abs(totalGain))} ({totalGainPercentage}%)
            </span>
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          borderRadius: '20px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
            🏠 Asset Tokenizzati
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
            {portfolioData.length}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
            Immobiliare, Startup, Arte
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          borderRadius: '20px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
            📈 Performance
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
            +{totalGainPercentage}%
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
            Ultimi 6 mesi
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          borderRadius: '20px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
            💰 Investimento Totale
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
            {formatCurrency(totalInvested)}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
            Capitale investito
          </p>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Performance Chart */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937', fontSize: '1.3rem' }}>
            📊 Performance vs Benchmark
          </h3>
          <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '1rem' }}>
            {performanceData.map((data, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'end', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '20px',
                    height: `${(data.portfolio / 20000) * 150}px`,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '4px 4px 0 0'
                  }}></div>
                  <div style={{
                    width: '20px',
                    height: `${(data.benchmark / 20000) * 150}px`,
                    background: '#E5E7EB',
                    borderRadius: '4px 4px 0 0'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{data.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '2px' }}></div>
              <span>Portfolio</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#E5E7EB', borderRadius: '2px' }}></div>
              <span>Benchmark</span>
            </div>
          </div>
        </div>

        {/* Asset Allocation */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937', fontSize: '1.3rem' }}>
            🥧 Allocazione Asset
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assetAllocation.map((asset, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%',
                  background: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][index]
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{asset.name}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F2937' }}>
                      {asset.percentage}%
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: '#F3F4F6', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${asset.percentage}%`,
                      height: '100%',
                      background: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][index],
                      transition: 'width 1s ease'
                    }}></div>
                  </div>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F2937', minWidth: '80px', textAlign: 'right' }}>
                  {formatCurrency(asset.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Trends & Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem'
      }}>
        {/* Market Trends */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937', fontSize: '1.3rem' }}>
            📈 Trend di Mercato
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {marketTrends.map((trend, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #F3F4F6'
              }}>
                <span style={{ color: '#374151', fontWeight: '500' }}>{trend.category}</span>
                <span style={{ 
                  color: trend.color, 
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}>
                  {trend.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937', fontSize: '1.3rem' }}>
            🔄 Transazioni Recenti
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sampleTransactions.slice(0, 3).map(transaction => (
              <div key={transaction.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #F3F4F6'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {transaction.transaction_type === 'buy' && '🛒'}
                      {transaction.transaction_type === 'sell' && '💰'}
                      {transaction.transaction_type === 'dividend' && '💎'}
                    </span>
                    <span style={{ fontWeight: '600', color: '#1F2937', textTransform: 'capitalize' }}>
                      {transaction.transaction_type}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6B7280' }}>
                    {transaction.assets.symbol} • {transaction.tokens} token
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF' }}>
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ 
                    margin: 0, 
                    fontWeight: '700', 
                    color: transaction.transaction_type === 'dividend' ? '#10B981' : '#1F2937'
                  }}>
                    {transaction.transaction_type === 'dividend' ? '+' : ''}{formatCurrency(transaction.total_amount)}
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.8rem',
                    color: transaction.status === 'completed' ? '#10B981' : '#F59E0B'
                  }}>
                    {transaction.status === 'completed' ? '✅ Completata' : '⏳ In corso'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('wallet')}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Vedi Tutte le Transazioni
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

