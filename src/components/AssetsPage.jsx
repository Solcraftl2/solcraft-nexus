import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Coins, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react'
import { useWeb3 } from '../providers/Web3Provider'
import { toast } from 'sonner'

export default function AssetsPage() {
  const { user, isAuthenticated } = useWeb3()
  const [assets, setAssets] = useState([])
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserAssets()
    } else {
      setAssets([])
      setInvestments([])
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const loadUserAssets = () => {
    setLoading(true)
    try {
      // Load assets created by user
      const userAssets = JSON.parse(localStorage.getItem(`tokens_${user.address}`) || '[]')
      setAssets(userAssets)

      // Load investments made by user
      const userInvestments = JSON.parse(localStorage.getItem(`investments_${user.address}`) || '[]')
      setInvestments(userInvestments)

    } catch (error) {
      console.error('Errore caricamento asset:', error)
      toast.error('Errore caricamento asset')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      case 'completed': return 'default'
      case 'failed': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'pending': return <Clock className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'failed': return <AlertCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">I Miei Asset</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Coins className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connetti il tuo Wallet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connetti il tuo wallet per visualizzare i tuoi asset tokenizzati
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
          <h1 className="text-3xl font-bold">I Miei Asset</h1>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">I Miei Asset</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi asset tokenizzati e investimenti
          </p>
        </div>
        <Button onClick={() => window.location.href = '/tokenization'}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Tokenizza Asset
        </Button>
      </div>

      <Tabs defaultValue="created" className="space-y-4">
        <TabsList>
          <TabsTrigger value="created">Asset Creati ({assets.length})</TabsTrigger>
          <TabsTrigger value="investments">Investimenti ({investments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="space-y-4">
          {assets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun Asset Creato</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Non hai ancora tokenizzato nessun asset. Inizia creando il tuo primo token.
                </p>
                <Button onClick={() => window.location.href = '/tokenization'}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tokenizza il tuo primo asset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{asset.assetName}</CardTitle>
                        <CardDescription>{asset.assetType}</CardDescription>
                      </div>
                      <Badge variant={getStatusColor(asset.status)}>
                        {getStatusIcon(asset.status)}
                        <span className="ml-1">{asset.status || 'pending'}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valore Totale:</span>
                        <span className="font-semibold">${asset.totalValue?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Token Supply:</span>
                        <span>{asset.tokenSupply?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prezzo Token:</span>
                        <span>${asset.tokenPrice || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Raccolto:</span>
                        <span>${asset.raised?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Investitori:</span>
                        <span>{asset.investors || 0}</span>
                      </div>
                    </div>

                    {asset.tokenSymbol && (
                      <div className="p-2 bg-muted rounded text-center">
                        <span className="text-sm font-mono">{asset.tokenSymbol}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            Dettagli
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{asset.assetName}</DialogTitle>
                            <DialogDescription>
                              Dettagli completi dell'asset tokenizzato
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Informazioni Base</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="text-muted-foreground">Tipo:</span> {asset.assetType}</div>
                                  <div><span className="text-muted-foreground">Creato:</span> {new Date(asset.createdAt).toLocaleDateString()}</div>
                                  <div><span className="text-muted-foreground">Status:</span> {asset.status}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Token Info</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="text-muted-foreground">Symbol:</span> {asset.tokenSymbol}</div>
                                  <div><span className="text-muted-foreground">Supply:</span> {asset.tokenSupply?.toLocaleString()}</div>
                                  <div><span className="text-muted-foreground">Prezzo:</span> ${asset.tokenPrice}</div>
                                </div>
                              </div>
                            </div>
                            
                            {asset.description && (
                              <div>
                                <h4 className="font-semibold mb-2">Descrizione</h4>
                                <p className="text-sm text-muted-foreground">{asset.description}</p>
                              </div>
                            )}

                            {asset.tokenAddress && (
                              <div>
                                <h4 className="font-semibold mb-2">Contratto</h4>
                                <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                                  {asset.tokenAddress}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button size="sm" variant="outline" className="flex-1">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          {investments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun Investimento</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Non hai ancora investito in nessun asset. Esplora il marketplace per trovare opportunità.
                </p>
                <Button onClick={() => window.location.href = '/marketplace'}>
                  <Target className="h-4 w-4 mr-2" />
                  Esplora Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {investments.map((investment, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{investment.assetName}</h3>
                        <p className="text-sm text-muted-foreground">{investment.assetType}</p>
                        <p className="text-xs text-muted-foreground">
                          Investito il {new Date(investment.investmentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${investment.amount?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{investment.tokens} tokens</p>
                        <Badge variant={getStatusColor(investment.status)}>
                          {investment.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

