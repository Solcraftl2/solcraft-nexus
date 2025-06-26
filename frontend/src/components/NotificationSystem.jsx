import React, { useState, useEffect, useCallback } from 'react';
import { sampleNotifications } from '../data/sampleData';

const NotificationSystem = ({ userId, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [isVisible, setIsVisible] = useState(false);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new notifications every 30 seconds
      if (Math.random() > 0.7) {
        const newNotification = generateRandomNotification();
        addNotification(newNotification);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const generateRandomNotification = () => {
    const types = ['info', 'success', 'warning', 'error'];
    const messages = [
      {
        title: 'Nuovo Dividendo',
        message: 'Hai ricevuto €75.00 di dividendi da TechStart AI Solutions (TSAI)',
        type: 'success'
      },
      {
        title: 'Prezzo Asset Aggiornato',
        message: 'Il prezzo di Palazzo Storico Milano Centro (PSMC) è aumentato del 2.5%',
        type: 'info'
      },
      {
        title: 'Ordine Eseguito',
        message: 'Il tuo ordine di acquisto per Oro Fisico Certificato (GOLD) è stato eseguito',
        type: 'success'
      },
      {
        title: 'Manutenzione Programmata',
        message: 'Manutenzione del sistema programmata per domani alle 02:00',
        type: 'warning'
      },
      {
        title: 'Nuovo Asset Disponibile',
        message: 'È ora disponibile: Startup GreenTech Solutions (GTS)',
        type: 'info'
      }
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      id: Date.now(),
      user_id: userId,
      title: randomMessage.title,
      message: randomMessage.message,
      type: randomMessage.type,
      read: false,
      created_at: new Date().toISOString()
    };
  };

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setNewNotificationCount(prev => prev + 1);
    
    // Play notification sound
    if (soundEnabled) {
      playNotificationSound(notification.type);
    }

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }

    // Auto-hide success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        markAsRead(notification.id);
      }, 5000);
    }

    // Callback to parent component
    if (onNotificationUpdate) {
      onNotificationUpdate(notification);
    }
  }, [soundEnabled, userId, onNotificationUpdate]);

  const playNotificationSound = (type) => {
    // Create audio context for notification sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different notification types
    const frequencies = {
      success: 800,
      info: 600,
      warning: 400,
      error: 300
    };

    oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setNewNotificationCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setNewNotificationCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setNewNotificationCount(0);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addNotification({
          id: Date.now(),
          user_id: userId,
          title: 'Notifiche Abilitate',
          message: 'Riceverai ora notifiche del browser per aggiornamenti importanti',
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: '#10B981',
      info: '#3B82F6',
      warning: '#F59E0B',
      error: '#EF4444'
    };
    return colors[type] || '#6B7280';
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'relative',
          padding: '0.75rem',
          background: unreadCount > 0 ? '#EF4444' : '#6B7280',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontSize: '1.2rem'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#DC2626',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            animation: unreadCount > newNotificationCount ? 'none' : 'pulse 2s infinite'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          width: '400px',
          maxHeight: '600px',
          zIndex: 1000,
          marginTop: '0.5rem',
          border: '1px solid #E5E7EB'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#1F2937', fontSize: '1.2rem', fontWeight: '700' }}>
                Notifiche
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
                {unreadCount} non lette
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: unreadCount > 0 ? '#3B82F6' : '#E5E7EB',
                  color: unreadCount > 0 ? 'white' : '#9CA3AF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  cursor: unreadCount > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                Segna tutte
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  padding: '0.5rem',
                  background: soundEnabled ? '#10B981' : '#E5E7EB',
                  color: soundEnabled ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                title={soundEnabled ? 'Disabilita suoni' : 'Abilita suoni'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: '#6B7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                  Nessuna notifica
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                  Ti avviseremo quando ci saranno aggiornamenti
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: notification.read ? 'white' : '#F0F9FF',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = notification.read ? '#F9FAFB' : '#E0F2FE';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = notification.read ? 'white' : '#F0F9FF';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      flexShrink: 0,
                      marginTop: '0.25rem'
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          fontWeight: notification.read ? '500' : '700',
                          color: '#1F2937',
                          lineHeight: '1.3'
                        }}>
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '0.25rem',
                            borderRadius: '4px',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseOver={(e) => e.target.style.color = '#EF4444'}
                          onMouseOut={(e) => e.target.style.color = '#9CA3AF'}
                        >
                          ×
                        </button>
                      </div>
                      <p style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.85rem',
                        color: '#6B7280',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#9CA3AF'
                        }}>
                          {formatDate(notification.created_at)}
                        </span>
                        {!notification.read && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: getNotificationColor(notification.type)
                          }}></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={requestNotificationPermission}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'none',
                  color: '#6B7280',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#9CA3AF';
                  e.target.style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.color = '#6B7280';
                }}
              >
                🔔 Abilita notifiche browser
              </button>
              <button
                onClick={clearAllNotifications}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'none',
                  color: '#EF4444',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#FEE2E2';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                }}
              >
                🗑️ Cancella tutto
              </button>
            </div>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;

