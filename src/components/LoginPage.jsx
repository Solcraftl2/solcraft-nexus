import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../providers/Web3Provider'
import { toast } from 'sonner'
import { 
  Wallet, 
  Chrome, 
  Github, 
  Apple, 
  Shield, 
  Zap, 
  TrendingUp,
  Users,
  Lock,
  Globe
} from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { connectWallet, loginWithOAuth, isAuthenticated, isConnecting } = useWeb3()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleWalletConnect = async () => {
    setLoading(true)
    try {
      await connectWallet()
      toast.success('Wallet connesso con successo!')
      navigate('/')
    } catch (error) {
      toast.error('Errore connessione wallet: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider) => {
    setLoading(true)
    try {
      await loginWithOAuth(provider)
      toast.success(`Login ${provider} completato!`)
      navigate('/')
    } catch (error) {
      toast.error(`Errore login ${provider}: ` + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Autenticazione in corso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SolCraft Nexus</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>Sicurezza Bancaria</span>
              </span>
              <span className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>XRP Ledger</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Side - Hero */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
          <div className="max-w-md mx-auto my-auto">
            <h1 className="text-4xl font-bold mb-6">
              Tokenizzazione Professionale su XRP Ledger
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              La piattaforma più avanzata per tokenizzare asset reali e gestire investimenti crypto.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span>Rendimenti fino al 15% APY</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span>+10,000 investitori attivi</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <span>Sicurezza di livello istituzionale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Accedi alla Piattaforma
              </h2>
              <p className="text-gray-600">
                Connetti il tuo wallet o usa OAuth per iniziare
              </p>
            </div>

            <div className="space-y-4">
              {/* Wallet Connection */}
              <button
                onClick={handleWalletConnect}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Wallet className="w-5 h-5" />
                <span>{loading ? 'Connessione...' : 'Connetti Wallet'}</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">oppure</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                >
                  <Chrome className="w-5 h-5 text-red-500" />
                  <span>Continua con Google</span>
                </button>

                <button
                  onClick={() => handleOAuthLogin('github')}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
                >
                  <Github className="w-5 h-5" />
                  <span>Continua con GitHub</span>
                </button>

                <button
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-900 transition-all duration-200 disabled:opacity-50"
                >
                  <Apple className="w-5 h-5" />
                  <span>Continua con Apple</span>
                </button>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>
                Accedendo accetti i nostri{' '}
                <a href="#" className="text-blue-600 hover:underline">Termini di Servizio</a>
                {' '}e la{' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              </p>
            </div>

            {/* Features Preview */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Cosa puoi fare:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Tokenizza asset reali (immobili, arte, startup)</li>
                <li>• Investi in pool di liquidità con rewards</li>
                <li>• Trading su marketplace globale</li>
                <li>• Governance e voting sui progetti</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

