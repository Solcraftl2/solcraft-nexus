import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Coins, 
  PlusCircle,
  AlertCircle,
  Activity,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useWeb3 } from '../providers/Web3Provider'
import { toast } from 'sonner'

export default function Dashboard() {
  const { user, isAuthenticated, balance, walletAddress } = useWeb3()
  const [portfolio, setPortfolio] = useState(null)
  const [assets, setAssets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Load user data from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData()
    } else {
      // Reset data when not authenticated
      setPortfolio(null)
      setAssets([])
      setTransactions([])
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const loadUserData = async () => {
    setLoading(true)
    
    try {
      // Load user's assets
      const userAssets = JSON.parse(localStorage.getItem(`assets_${user.address}`) || '[]')
      setAssets(userAssets)

      // Load user's transactions
      const userTransactions = JSON.parse(localStorage.getItem(`transactions_${user.address}`) || '[]')
      setTransactions(userTransactions)

      // Calculate portfolio value
      const totalValue = userAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0)
      const totalInvested = userAssets.reduce((sum, asset) => sum + (asset.investedAmount || 0), 0)
      const totalReturn = totalValue - totalInvested
      const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

      setPortfolio({
        totalValue: totalValue,
        totalInvested: totalInvested,
        totalReturn: totalReturn,
        returnPercentage: returnPercentage,
        walletBalance: parseFloat(balance || 0),
        assetsCount: userAssets.length
      })

    } catch (error) {
      console.error('Errore caricamento dati:', error)
      toast.error('Errore caricamento portfolio')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connetti il tuo Wallet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connetti il tuo wallet per iniziare a utilizzare SolCraft Nexus
            </p>
            <Button onClick={() => window.location.reload()}>
              Connetti Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Empty state - no assets or transactions
  if (!portfolio || (portfolio.assetsCount === 0 && portfolio.walletBalance === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Benvenuto, {user?.first_name || 'Utente'}
            </p>
          </div>
        </div>

        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Il Tuo Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Indirizzo:</span>
                <span className="font-mono text-sm">{walletAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-semibold">{parseFloat(balance || 0).toFixed(4)} ETH</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inizia il tuo Journey</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Il tuo portfolio è vuoto. Inizia tokenizzando i tuoi primi asset o investendo nel marketplace.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => window.location.href = '/tokenization'}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Tokenizza Asset
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/marketplace'}>
                <Activity className="h-4 w-4 mr-2" />
                Esplora Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Benvenuto, {user?.first_name || 'Utente'}
          </p>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio + Wallet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investito</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio.totalInvested.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Capitale investito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimento</CardTitle>
            {portfolio.totalReturn >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolio.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(portfolio.totalReturn).toFixed(2)}
            </div>
            <p className={`text-xs flex items-center ${portfolio.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.returnPercentage >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(portfolio.returnPercentage).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.assetsCount}</div>
            <p className="text-xs text-muted-foreground">
              Asset tokenizzati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">I Miei Asset</TabsTrigger>
          <TabsTrigger value="transactions">Transazioni Recenti</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>I Miei Asset Tokenizzati</CardTitle>
              <CardDescription>
                Asset che hai creato o in cui hai investito
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessun asset ancora</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/tokenization'}>
                    Tokenizza il tuo primo asset
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground">{asset.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${asset.currentValue?.toFixed(2) || '0.00'}</p>
                        <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                          {asset.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transazioni Recenti</CardTitle>
              <CardDescription>
                Le tue ultime transazioni blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessuna transazione ancora</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{tx.type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{tx.amount} {tx.currency}</p>
                        <Badge variant={tx.status === 'success' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

