import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'

// Simple Login Page Component
function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/oauth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          user: {
            name: 'Test User',
            email: 'test@gmail.com'
          }
        })
      })
      
      const data = await response.json()
      console.log('Google login response:', data)
      
      if (data.success) {
        alert('Login Google riuscito!')
      } else {
        alert('Errore login Google: ' + data.error)
      }
    } catch (error) {
      console.error('Google login error:', error)
      alert('Errore login Google: ' + error.message)
    }
  }

  const handleGitHubLogin = async () => {
    try {
      const response = await fetch('/api/auth/oauth/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'github',
          user: {
            name: 'Test User',
            email: 'test@github.com'
          }
        })
      })
      
      const data = await response.json()
      console.log('GitHub login response:', data)
      
      if (data.success) {
        alert('Login GitHub riuscito!')
      } else {
        alert('Errore login GitHub: ' + data.error)
      }
    } catch (error) {
      console.error('GitHub login error:', error)
      alert('Errore login GitHub: ' + error.message)
    }
  }

  const handleWalletConnect = async () => {
    try {
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40)
      
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: mockAddress,
          type: 'Demo Wallet',
          chainId: '1'
        })
      })
      
      const data = await response.json()
      console.log('Wallet connect response:', data)
      
      if (data.success) {
        alert('Wallet connesso!')
      } else {
        alert('Errore wallet: ' + data.error)
      }
    } catch (error) {
      console.error('Wallet connect error:', error)
      alert('Errore wallet: ' + error.message)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: '#1f2937'
        }}>
          SolCraft Nexus
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: '#6b7280'
        }}>
          Tokenizzazione Professionale su XRP Ledger
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleGoogleLogin}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔴 Login con Google
          </button>

          <button
            onClick={handleGitHubLogin}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ⚫ Login con GitHub
          </button>

          <button
            onClick={handleWalletConnect}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔵 Connetti Wallet
          </button>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <strong>Test API:</strong><br/>
          Clicca i pulsanti per testare le API di autenticazione.
          Controlla la console del browser per i dettagli.
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App

