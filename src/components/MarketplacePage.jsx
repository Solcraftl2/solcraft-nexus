import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Store, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Eye,
  ShoppingCart
} from 'lucide-react'
import { useWeb3 } from '../providers/Web3Provider'
import { toast } from 'sonner'

export default function MarketplacePage() {
  const { user, isAuthenticated, sendTransaction } = useWeb3()
  const [assets, setAssets] = useState([])
  const [filteredAssets, setFilteredAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [isInvesting, setIsInvesting] = useState(false)

  useEffect(() => {
    loadMarketplaceAssets()
  }, [])

  useEffect(() => {
    filterAssets()
  }, [assets, searchTerm, selectedCategory])

  const loadMarketplaceAssets = () => {
    setLoading(true)
    try {
      // Load all assets from all users (in a real app, this would come from a backend)
      const allAssets = []
      
      // Get all localStorage keys that contain tokens
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('tokens_0x')) {
          try {
            const userAssets = JSON.parse(localStorage.getItem(key) || '[]')
            // Only include active assets that are not created by current user
            const publicAssets = userAssets.filter(asset => 
              asset.status === 'active' && 
              (!user || asset.creator !== user.address)
            )
            allAssets.push(...publicAssets)
          } catch (error) {
            console.error('Errore parsing asset:', error)
          }
        }
      }

      setAssets(allAssets)
    } catch (error) {
      console.error('Errore caricamento marketplace:', error)
      toast.error('Errore caricamento marketplace')
    } finally {
      setLoading(false)
    }
  }

  const filterAssets = () => {
    let filtered = assets

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.assetType === selectedCategory)
    }

    setFilteredAssets(filtered)
  }

  const handleInvestment = async () => {
    if (!isAuthenticated) {
      toast.error('Connetti il wallet per investire')
      return
    }

    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error('Inserisci un importo valido')
      return
    }

    if (!selectedAsset) {
      toast.error('Seleziona un asset')
      return
    }

    setIsInvesting(true)

    try {
      // Calculate tokens to receive
      const tokensToReceive = parseFloat(investmentAmount) / parseFloat(selectedAsset.tokenPrice || 1)

      // Simulate investment transaction
      const txResult = await sendTransaction(
        selectedAsset.creator, // Send to asset creator
        investmentAmount,
        '0x' // Investment data
      )

      // Save investment to localStorage
      const newInvestment = {
        assetId: selectedAsset.id,
        assetName: selectedAsset.assetName,
        assetType: selectedAsset.assetType,
        amount: parseFloat(investmentAmount),
        tokens: tokensToReceive,
        tokenPrice: selectedAsset.tokenPrice,
        investmentDate: Date.now(),
        status: 'active',
        txHash: txResult.hash
      }

      const existingInvestments = JSON.parse(localStorage.getItem(`investments_${user.address}`) || '[]')
      existingInvestments.push(newInvestment)
      localStorage.setItem(`investments_${user.address}`, JSON.stringify(existingInvestments))

      // Update asset with new investment
      const updatedAsset = {
        ...selectedAsset,
        raised: (selectedAsset.raised || 0) + parseFloat(investmentAmount),
        investors: (selectedAsset.investors || 0) + 1
      }

      // Update the asset in the original creator's storage
      // This is simplified - in a real app, this would be handled by the backend
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('tokens_')) {
          try {
            const userAssets = JSON.parse(localStorage.getItem(key) || '[]')
            const assetIndex = userAssets.findIndex(a => a.id === selectedAsset.id)
            if (assetIndex !== -1) {
              userAssets[assetIndex] = updatedAsset
              localStorage.setItem(key, JSON.stringify(userAssets))
              break
            }
          } catch (error) {
            console.error('Errore aggiornamento asset:', error)
          }
        }
      }

      toast.success(`Investimento di $${investmentAmount} completato!`)
      toast.info(`Ricevuti ${tokensToReceive.toFixed(4)} ${selectedAsset.tokenSymbol || 'tokens'}`)

      // Reset form and reload assets
      setInvestmentAmount('')
      setSelectedAsset(null)
      loadMarketplaceAssets()

    } catch (error) {
      console.error('Errore investimento:', error)
      toast.error('Errore durante l\'investimento')
    } finally {
      setIsInvesting(false)
    }
  }

  const getAssetCategories = () => {
    const categories = [...new Set(assets.map(asset => asset.assetType).filter(Boolean))]
    return categories
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Marketplace</h1>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Investi in asset tokenizzati dalla community
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca asset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {getAssetCategories().map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {assets.length === 0 ? 'Marketplace Vuoto' : 'Nessun Asset Trovato'}
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {assets.length === 0 
                ? 'Non ci sono ancora asset disponibili per l\'investimento. Torna più tardi o crea il tuo primo asset.'
                : 'Nessun asset corrisponde ai tuoi criteri di ricerca. Prova a modificare i filtri.'
              }
            </p>
            {assets.length === 0 && (
              <Button onClick={() => window.location.href = '/tokenization'}>
                <Target className="h-4 w-4 mr-2" />
                Crea il primo asset
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{asset.assetName}</CardTitle>
                    <CardDescription>{asset.assetType}</CardDescription>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Attivo
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

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progresso</span>
                    <span>{Math.min(((asset.raised || 0) / (asset.totalValue || 1)) * 100, 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(((asset.raised || 0) / (asset.totalValue || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>

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
                          Dettagli completi dell'asset di investimento
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Informazioni Asset</h4>
                            <div className="space-y-1 text-sm">
                              <div><span className="text-muted-foreground">Tipo:</span> {asset.assetType}</div>
                              <div><span className="text-muted-foreground">Valore:</span> ${asset.totalValue?.toLocaleString()}</div>
                              <div><span className="text-muted-foreground">Creato:</span> {new Date(asset.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Investimento</h4>
                            <div className="space-y-1 text-sm">
                              <div><span className="text-muted-foreground">Prezzo Token:</span> ${asset.tokenPrice}</div>
                              <div><span className="text-muted-foreground">Raccolto:</span> ${asset.raised?.toLocaleString() || '0'}</div>
                              <div><span className="text-muted-foreground">Investitori:</span> {asset.investors || 0}</div>
                            </div>
                          </div>
                        </div>
                        
                        {asset.description && (
                          <div>
                            <h4 className="font-semibold mb-2">Descrizione</h4>
                            <p className="text-sm text-muted-foreground">{asset.description}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        disabled={!isAuthenticated}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Investi
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Investi in {asset.assetName}</DialogTitle>
                        <DialogDescription>
                          Acquista token di questo asset
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Prezzo per token:</span>
                              <div className="font-semibold">${asset.tokenPrice}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Token disponibili:</span>
                              <div className="font-semibold">{((asset.tokenSupply || 0) - (asset.raised || 0) / (asset.tokenPrice || 1)).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Importo Investimento ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                          />
                          {investmentAmount && (
                            <p className="text-xs text-muted-foreground">
                              Riceverai: {(parseFloat(investmentAmount) / parseFloat(asset.tokenPrice || 1)).toFixed(4)} token
                            </p>
                          )}
                        </div>

                        <Button 
                          onClick={handleInvestment}
                          disabled={isInvesting || !investmentAmount || !isAuthenticated}
                          className="w-full"
                        >
                          {isInvesting ? 'Investimento in corso...' : 'Conferma Investimento'}
                        </Button>

                        {!isAuthenticated && (
                          <p className="text-xs text-muted-foreground text-center">
                            Connetti il wallet per investire
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

