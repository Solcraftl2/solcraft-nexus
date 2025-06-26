import React, { useState, useEffect } from 'react';
import { 
  sampleAssets, 
  sampleOrders, 
  sampleUserProfile,
  samplePortfolio 
} from '../data/sampleData';

const TradingSystem = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('market');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [orderType, setOrderType] = useState('buy');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [priceType, setPriceType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [orders, setOrders] = useState(sampleOrders);
  const [marketData, setMarketData] = useState(sampleAssets);
  const [watchlist, setWatchlist] = useState([]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map(asset => ({
          ...asset,
          current_price: asset.current_price * (1 + (Math.random() - 0.5) * 0.02), // ±1% volatility
          price_change_24h: (Math.random() - 0.5) * 10, // ±5% daily change
          volume_24h: asset.volume_24h * (1 + (Math.random() - 0.5) * 0.1)
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
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

  const handlePlaceOrder = () => {
    if (!selectedAsset || !orderAmount || !orderQuantity) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    const totalAmount = parseFloat(orderAmount);
    const quantity = parseInt(orderQuantity);
    const price = priceType === 'market' ? selectedAsset.current_price : parseFloat(limitPrice);

    if (totalAmount <= 0 || quantity <= 0 || (priceType === 'limit' && price <= 0)) {
      alert('Inserisci valori validi');
      return;
    }

    // Check available balance (simplified)
    const userBalance = 10000; // Mock balance
    if (orderType === 'buy' && totalAmount > userBalance) {
      alert('Saldo insufficiente');
      return;
    }

    const newOrder = {
      id: Date.now(),
      user_id: user?.id || sampleUserProfile.id,
      asset_id: selectedAsset.id,
      order_type: orderType,
      quantity: quantity,
      price_per_token: price,
      total_amount: totalAmount,
      status: priceType === 'market' ? 'completed' : 'pending',
      created_at: new Date().toISOString(),
      asset: selectedAsset
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Reset form
    setOrderAmount('');
    setOrderQuantity('');
    setLimitPrice('');
    
    alert(`Ordine ${orderType === 'buy' ? 'di acquisto' : 'di vendita'} ${priceType === 'market' ? 'eseguito' : 'inserito'} con successo!`);
  };

  const cancelOrder = (orderId) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' }
          : order
      )
    );
    alert('Ordine cancellato con successo');
  };

  const addToWatchlist = (asset) => {
    if (!watchlist.find(item => item.id === asset.id)) {
      setWatchlist(prev => [...prev, asset]);
      alert(`${asset.name} aggiunto alla watchlist`);
    }
  };

  const removeFromWatchlist = (assetId) => {
    setWatchlist(prev => prev.filter(item => item.id !== assetId));
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      completed: '#10B981',
      pending: '#F59E0B',
      cancelled: '#EF4444',
      partial: '#3B82F6'
    };
    return colors[status] || '#6B7280';
  };

  const getOrderStatusText = (status) => {
    const texts = {
      completed: '✅ Completato',
      pending: '⏳ In attesa',
      cancelled: '❌ Cancellato',
      partial: '🔄 Parziale'
    };
    return texts[status] || status;
  };

  const tabs = [
    { id: 'market', label: 'Mercato', icon: '📈' },
    { id: 'trade', label: 'Trading', icon: '💱' },
    { id: 'orders', label: 'Ordini', icon: '📋' },
    { id: 'watchlist', label: 'Watchlist', icon: '👁️' }
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
            💱 Trading Live
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
          <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Saldo Disponibile:</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(10000)}
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
        minHeight: '600px'
      }}>
        {/* Market Tab */}
        {activeTab === 'market' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>📈 Mercato Asset</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {marketData.map(asset => (
                <div key={asset.id} style={{
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
                      {asset.asset_categories.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: '#1F2937' }}>
                        {asset.name}
                      </h3>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                        {asset.symbol} • {asset.asset_categories.name}
                      </p>
                      <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.8rem' }}>
                        Volume 24h: {formatCurrency(asset.volume_24h)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#1F2937' }}>
                      {formatCurrency(asset.current_price)}
                    </p>
                    <p style={{ 
                      margin: '0 0 0.5rem 0', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      color: asset.price_change_24h >= 0 ? '#10B981' : '#EF4444'
                    }}>
                      {formatPercentage(asset.price_change_24h)}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setActiveTab('trade');
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        Trade
                      </button>
                      <button
                        onClick={() => addToWatchlist(asset)}
                        style={{
                          padding: '0.5rem',
                          background: '#6B7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade Tab */}
        {activeTab === 'trade' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>💱 Pannello Trading</h2>
            
            {!selectedAsset ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6B7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                  Seleziona un asset dal mercato per iniziare a fare trading
                </p>
                <button
                  onClick={() => setActiveTab('market')}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Vai al Mercato
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Asset Info */}
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #E5E7EB'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>
                    Asset Selezionato
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}>
                      {selectedAsset.asset_categories.icon}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#1F2937' }}>
                        {selectedAsset.name}
                      </h4>
                      <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                        {selectedAsset.symbol}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Prezzo Corrente:</span>
                      <span style={{ fontWeight: '700', color: '#1F2937' }}>
                        {formatCurrency(selectedAsset.current_price)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Variazione 24h:</span>
                      <span style={{ 
                        fontWeight: '600',
                        color: selectedAsset.price_change_24h >= 0 ? '#10B981' : '#EF4444'
                      }}>
                        {formatPercentage(selectedAsset.price_change_24h)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Volume 24h:</span>
                      <span style={{ fontWeight: '600', color: '#1F2937' }}>
                        {formatCurrency(selectedAsset.volume_24h)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Form */}
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #E5E7EB'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>
                    Nuovo Ordine
                  </h3>
                  
                  {/* Order Type */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                      Tipo Ordine
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setOrderType('buy')}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: orderType === 'buy' ? '#10B981' : '#E5E7EB',
                          color: orderType === 'buy' ? 'white' : '#6B7280',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        🛒 Acquista
                      </button>
                      <button
                        onClick={() => setOrderType('sell')}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: orderType === 'sell' ? '#EF4444' : '#E5E7EB',
                          color: orderType === 'sell' ? 'white' : '#6B7280',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        💰 Vendi
                      </button>
                    </div>
                  </div>

                  {/* Price Type */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                      Tipo Prezzo
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setPriceType('market')}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: priceType === 'market' ? '#3B82F6' : '#E5E7EB',
                          color: priceType === 'market' ? 'white' : '#6B7280',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Mercato
                      </button>
                      <button
                        onClick={() => setPriceType('limit')}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: priceType === 'limit' ? '#3B82F6' : '#E5E7EB',
                          color: priceType === 'limit' ? 'white' : '#6B7280',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Limite
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                      Quantità Token
                    </label>
                    <input
                      type="number"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Limit Price */}
                  {priceType === 'limit' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                        Prezzo Limite (EUR)
                      </label>
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={selectedAsset.current_price.toFixed(2)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Total Amount */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                      Importo Totale (EUR)
                    </label>
                    <input
                      type="number"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: orderType === 'buy' 
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {orderType === 'buy' ? '🛒 Acquista' : '💰 Vendi'} {selectedAsset.symbol}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>📋 I Tuoi Ordini</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {orders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6B7280'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                    Nessun ordine presente
                  </p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} style={{
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
                        background: order.order_type === 'buy' ? '#10B981' : '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>
                        {order.order_type === 'buy' ? '🛒' : '💰'}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem 0', color: '#1F2937', textTransform: 'capitalize' }}>
                          {order.order_type} {order.asset?.symbol || 'Asset'}
                        </h3>
                        <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                          {order.quantity} token • {formatCurrency(order.price_per_token)} per token
                        </p>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.8rem' }}>
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        margin: '0 0 0.25rem 0', 
                        fontSize: '1.2rem', 
                        fontWeight: '700',
                        color: '#1F2937'
                      }}>
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p style={{ 
                        margin: '0 0 0.5rem 0', 
                        fontSize: '0.9rem',
                        color: getOrderStatusColor(order.status),
                        fontWeight: '600'
                      }}>
                        {getOrderStatusText(order.status)}
                      </p>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}
                        >
                          Cancella
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div>
            <h2 style={{ margin: '0 0 2rem 0', color: '#1F2937' }}>👁️ La Tua Watchlist</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {watchlist.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6B7280'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👁️</div>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                    La tua watchlist è vuota
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    Aggiungi asset dal mercato per monitorarli
                  </p>
                </div>
              ) : (
                watchlist.map(asset => (
                  <div key={asset.id} style={{
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
                        {asset.asset_categories.icon}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem 0', color: '#1F2937' }}>
                          {asset.name}
                        </h3>
                        <p style={{ margin: '0 0 0.25rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                          {asset.symbol} • {asset.asset_categories.name}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#1F2937' }}>
                        {formatCurrency(asset.current_price)}
                      </p>
                      <p style={{ 
                        margin: '0 0 0.5rem 0', 
                        fontSize: '0.9rem', 
                        fontWeight: '600',
                        color: asset.price_change_24h >= 0 ? '#10B981' : '#EF4444'
                      }}>
                        {formatPercentage(asset.price_change_24h)}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setActiveTab('trade');
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(asset.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingSystem;

