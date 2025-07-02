import { logger } from '../../../netlify/functions/utils/logger.js';
import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';

const AuthCallback = () => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Ottieni l'utente corrente dopo il redirect OAuth
        const { user, success, error } = await AuthService.getCurrentUser();
        
        if (!success || !user) {
          throw new Error(error || 'Errore durante l\'autenticazione');
        }

        // Crea/aggiorna il profilo utente
        const profileResult = await AuthService.createUserProfile(user);
        
        if (!profileResult.success) {
          logger.warn('Errore creazione profilo:', profileResult.error);
        }

        setStatus('success');
        
        // Redirect alla dashboard dopo 2 secondi
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
      } catch (error) {
        logger.error('Errore callback OAuth:', error);
        setError(error.message);
        setStatus('error');
        
        // Redirect alla homepage dopo 3 secondi in caso di errore
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleAuthCallback();
  }, []);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#1f2937'
          }}>
            🔐 Autenticazione in corso...
          </h2>
          
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Stiamo completando il tuo login. Attendere prego...
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f9ff',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          border: '2px solid #10b981'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            ✅
          </div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#10b981'
          }}>
            Login Completato!
          </h2>
          
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            marginBottom: '1.5rem'
          }}>
            Benvenuto in SolCraft Nexus. Reindirizzamento alla dashboard...
          </p>
          
          <div style={{
            backgroundColor: '#ecfdf5',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #10b981'
          }}>
            <p style={{
              color: '#10b981',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              🚀 Accesso autorizzato con successo
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#fef2f2',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          border: '2px solid #dc2626'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            ❌
          </div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#dc2626'
          }}>
            Errore di Autenticazione
          </h2>
          
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            marginBottom: '1.5rem'
          }}>
            Si è verificato un errore durante il login. Reindirizzamento alla homepage...
          </p>
          
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #dc2626',
              marginBottom: '1rem'
            }}>
              <p style={{
                color: '#dc2626',
                fontSize: '0.875rem'
              }}>
                <strong>Dettagli errore:</strong> {error}
              </p>
            </div>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Torna alla Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;

