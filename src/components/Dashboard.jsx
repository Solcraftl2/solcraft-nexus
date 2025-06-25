import React, { useState, useEffect } from 'react'
import { useAuth } from '../App'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: '0.00',
    activeInvestments: 0,
    monthlyReturn: '+0.00%'
  })

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        totalAssets: 3,
        totalValue: '12,450.00',
        activeInvestments: 7,
        monthlyReturn: '+8.5%'
      })
    }, 1000)
  }, [])

  const quickActions = [
    {
      title: 'Tokenizza Asset',
      description: 'Trasforma i tuoi asset in token digitali',
      icon: '🏗️',
      action: () => alert('Funzionalità Tokenizzazione - Coming Soon!')
    },
    {
      title: 'Esplora Marketplace',
      description: 'Investi in asset tokenizzati',
      icon: '🏪',
      action: () => alert('Marketplace - Coming Soon!')
    },
    {
      title: 'Gestisci Wallet',
      description: 'Controlla i tuoi fondi e transazioni',
      icon: '💳',
      action: () => alert('Wallet Management - Coming Soon!')
    },
    {
      title: 'Pool di Liquidità',
      description: 'Partecipa ai pool per guadagni passivi',
      icon: '🏊‍♂️',
      action: () => alert('Liquidity Pools - Coming Soon!')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Benvenuto, {user?.name || 'Utente'}! 👋
        </h2>
        <p className="text-blue-100">
          La tua piattaforma di tokenizzazione professionale su XRP Ledger
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Asset Totali</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssets}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valore Totale</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalValue}</p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Investimenti Attivi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeInvestments}</p>
            </div>
            <div className="text-2xl">🎯</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rendimento Mensile</p>
              <p className="text-2xl font-bold text-green-600">{stats.monthlyReturn}</p>
            </div>
            <div className="text-2xl">📈</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attività Recente</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Login completato</p>
                <p className="text-xs text-gray-500">Appena ora</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🔗</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Wallet connesso</p>
                <p className="text-xs text-gray-500">Via {user?.provider || 'OAuth'}</p>
              </div>
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Inizia a tokenizzare i tuoi asset per vedere più attività qui! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

