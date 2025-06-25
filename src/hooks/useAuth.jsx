import { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Backend URL - in produzione sarà configurato tramite environment
  const BACKEND_URL = 'https://5000-iaa933lc3wmw61ckjmjsk-894babb9.manusvm.computer'

  useEffect(() => {
    // Controlla se c'è un token salvato
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Verifica il token con il backend
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token non valido, rimuovilo
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Errore verifica token:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('auth_token', data.access_token)
        setUser(data.user)
        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${data.user.first_name}!`
        })
        return { success: true }
      } else {
        toast({
          title: "Errore di login",
          description: data.message || "Credenziali non valide",
          variant: "destructive"
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Errore login:', error)
      toast({
        title: "Errore di connessione",
        description: "Impossibile connettersi al server",
        variant: "destructive"
      })
      return { success: false, message: "Errore di connessione" }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Registrazione completata",
          description: "Account creato con successo. Effettua il login."
        })
        return { success: true }
      } else {
        toast({
          title: "Errore di registrazione",
          description: data.message || "Errore durante la registrazione",
          variant: "destructive"
        })
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Errore registrazione:', error)
      toast({
        title: "Errore di connessione",
        description: "Impossibile connettersi al server",
        variant: "destructive"
      })
      return { success: false, message: "Errore di connessione" }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    toast({
      title: "Logout effettuato",
      description: "Arrivederci!"
    })
  }

  const oauthLogin = async (provider) => {
    try {
      // Simula login OAuth per demo
      const mockUser = {
        id: Date.now(),
        email: `user@${provider}.com`,
        first_name: 'Demo',
        last_name: 'User',
        wallet_address: `r${provider}MockWallet123456789`
      }

      const mockToken = `mock_token_${provider}_${Date.now()}`
      localStorage.setItem('auth_token', mockToken)
      setUser(mockUser)

      toast({
        title: `Login ${provider} effettuato`,
        description: `Benvenuto tramite ${provider}!`
      })

      return { success: true }
    } catch (error) {
      console.error(`Errore login ${provider}:`, error)
      toast({
        title: `Errore login ${provider}`,
        description: "Errore durante l'autenticazione",
        variant: "destructive"
      })
      return { success: false }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    oauthLogin,
    BACKEND_URL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider')
  }
  return context
}

