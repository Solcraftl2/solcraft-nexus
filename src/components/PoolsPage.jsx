import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Waves,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Shield,
  Vote,
  Plus,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  Droplets,
  Coins
} from 'lucide-react'
import { useWeb3 } from '../providers/Web3Provider'
import { poolService } from '../services/poolService'
import { toast } from 'sonner'

export default function PoolsPage() {
  const { user, isAuthenticated } = useWeb3()
  const [pools, setPools] = useState([])
  const [userPools, setUserPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [liquidityForm, setLiquidityForm] = useState({ token0: '', token1: '' })
  const [stakingForm, setStakingForm] = useState({ amount: '', lockPeriod: '365' })
  const [proposalForm, setProposalForm] = useState({ title: '', description: '', type: 'parameter_change' })

  useEffect(() => {
    if (isAuthenticated) {
      loadPools()
    }
  }, [isAuthenticated])

  const loadPools = async () => {
    try {
      setLoading(true)
      
      // Carica pool dal localStorage
      poolService.loadPoolsFromStorage()
      const allPools = poolService.getAllPools()
      setPools(allPools)
      
      if (user) {
        const userPoolData = poolService.getUserPools(user.address)
        setUserPools(userPoolData)
      }
      
    } catch (error) {
      toast.error('Errore caricamento pool')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLiquidity = async (poolId) => {
    try {
      if (!liquidityForm.token0 || !liquidityForm.token1) {
        toast.error('Inserisci entrambi gli importi')
        return
      }

      await poolService.addLiquidity(poolId, {
        token0Amount: liquidityForm.token0,
        token1Amount: liquidityForm.token1,
        userAddress: user.address
      })

      setLiquidityForm({ token0: '', token1: '' })
      loadPools()
      
    } catch (error) {
      toast.error(`Errore aggiunta liquidità: ${error.message}`)
    }
  }

  const handleStakeTokens = async (poolId) => {
    try {
      if (!stakingForm.amount) {
        toast.error('Inserisci importo da stakare')
        return
      }

      await poolService.stakeTokens(
        poolId,
        stakingForm.amount,
        user.address,
        parseInt(stakingForm.lockPeriod)
      )

      setStakingForm({ amount: '', lockPeriod: '365' })
      loadPools()
      
    } catch (error) {
      toast.error(`Errore staking: ${error.message}`)
    }
  }

  const handleCreateProposal = async (poolId) => {
    try {
      if (!proposalForm.title || !proposalForm.description) {
        toast.error('Compila tutti i campi della proposta')
        return
      }

      await poolService.createProposal(poolId, proposalForm, user.address)
      setProposalForm({ title: '', description: '', type: 'parameter_change' })
      loadPools()
      
    } catch (error) {
      toast.error(`Errore creazione proposta: ${error.message}`)
    }
  }

  const handleVoteProposal = async (poolId, proposalId, vote) => {
    try {
      await poolService.voteProposal(poolId, proposalId, vote, user.address)
      loadPools()
    } catch (error) {
      toast.error(`Errore voto: ${error.message}`)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Connessione Richiesta</CardTitle>
            <CardDescription>
              Connetti il tuo wallet per accedere ai pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => toast.info('Usa il pulsante "Connetti Wallet" in alto')}>
              Connetti Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pool Management</h1>
        <p className="text-gray-600">
          Gestisci liquidità, staking e governance dei pool di tokenizzazione
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidità</TabsTrigger>
          <TabsTrigger value="staking">Staking</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">TVL Totale</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(pools.reduce((sum, pool) => sum + (pool.metrics?.tvl || 0), 0))}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pool Attivi</p>
                    <p className="text-2xl font-bold">{pools.length}</p>
                  </div>
                  <Waves className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">I Miei Pool</p>
                    <p className="text-2xl font-bold">{userPools.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">APY Medio</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(pools.reduce((sum, pool) => sum + (pool.stakingPool?.rewardRate * 100 || 0), 0) / Math.max(pools.length, 1))}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Pools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5" />
                Tutti i Pool
              </CardTitle>
              <CardDescription>
                Pool di tokenizzazione disponibili
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pools.length === 0 ? (
                  <div className="text-center py-12">
                    <Waves className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Nessun pool disponibile</h3>
                    <p className="text-gray-600 mb-4">
                      I pool verranno creati automaticamente quando gli asset vengono tokenizzati
                    </p>
                  </div>
                ) : (
                  pools.map((pool) => {
                    const metrics = poolService.calculatePoolMetrics(pool.id)
                    return (
                      <Card key={pool.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{pool.assetName}</h3>
                              <p className="text-sm text-gray-600">{pool.poolType} pool</p>
                            </div>
                            <Badge variant={pool.status === 'active' ? 'default' : 'secondary'}>
                              {pool.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">TVL</p>
                              <p className="font-medium">{formatCurrency(metrics?.tvl || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">APY</p>
                              <p className="font-medium text-green-600">{formatPercentage(metrics?.stakingAPY || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Partecipanti</p>
                              <p className="font-medium">{metrics?.participants || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Volume 24h</p>
                              <p className="font-medium">{formatCurrency(metrics?.volume24h || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Risk Score</p>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{metrics?.riskScore || 0}</span>
                                <div className={`w-2 h-2 rounded-full ${
                                  (metrics?.riskScore || 0) < 30 ? 'bg-green-500' :
                                  (metrics?.riskScore || 0) < 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" onClick={() => setSelectedPool(pool)}>
                                  <Droplets className="h-4 w-4 mr-2" />
                                  Aggiungi Liquidità
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Aggiungi Liquidità - {pool.assetName}</DialogTitle>
                                  <DialogDescription>
                                    Fornisci liquidità al pool per guadagnare commissioni di trading
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="token0">Token Asset</Label>
                                    <Input
                                      id="token0"
                                      type="number"
                                      placeholder="0.00"
                                      value={liquidityForm.token0}
                                      onChange={(e) => setLiquidityForm({...liquidityForm, token0: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="token1">USDC</Label>
                                    <Input
                                      id="token1"
                                      type="number"
                                      placeholder="0.00"
                                      value={liquidityForm.token1}
                                      onChange={(e) => setLiquidityForm({...liquidityForm, token1: e.target.value})}
                                    />
                                  </div>
                                  <Button 
                                    className="w-full" 
                                    onClick={() => handleAddLiquidity(pool.id)}
                                  >
                                    Aggiungi Liquidità
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedPool(pool)}>
                                  <Coins className="h-4 w-4 mr-2" />
                                  Stake
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Stake Token - {pool.assetName}</DialogTitle>
                                  <DialogDescription>
                                    Metti in stake i tuoi token per guadagnare rewards
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="stakeAmount">Importo da Stakare</Label>
                                    <Input
                                      id="stakeAmount"
                                      type="number"
                                      placeholder="0.00"
                                      value={stakingForm.amount}
                                      onChange={(e) => setStakingForm({...stakingForm, amount: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="lockPeriod">Periodo di Lock (giorni)</Label>
                                    <Input
                                      id="lockPeriod"
                                      type="number"
                                      placeholder="365"
                                      value={stakingForm.lockPeriod}
                                      onChange={(e) => setStakingForm({...stakingForm, lockPeriod: e.target.value})}
                                    />
                                  </div>
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                      <strong>Reward Stimato:</strong> {formatPercentage(pool.stakingPool?.rewardRate * 100 || 0)} APY
                                    </p>
                                  </div>
                                  <Button 
                                    className="w-full" 
                                    onClick={() => handleStakeTokens(pool.id)}
                                  >
                                    Stake Token
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button size="sm" variant="outline">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liquidity Tab */}
        <TabsContent value="liquidity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Le Mie Posizioni di Liquidità
              </CardTitle>
              <CardDescription>
                Gestisci le tue posizioni di liquidità nei pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userPools.filter(up => up.position.liquidity).length === 0 ? (
                <div className="text-center py-12">
                  <Droplets className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Nessuna posizione di liquidità</h3>
                  <p className="text-gray-600">
                    Fornisci liquidità ai pool per iniziare a guadagnare commissioni
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPools.filter(up => up.position.liquidity).map((userPool) => (
                    <Card key={userPool.pool.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{userPool.pool.assetName}</h3>
                            <p className="text-sm text-gray-600">
                              LP Tokens: {userPool.position.liquidity.lpTokens.toFixed(4)}
                            </p>
                          </div>
                          <Badge variant="default">Attiva</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Token Asset</p>
                            <p className="font-medium">{userPool.position.liquidity.token0Amount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">USDC</p>
                            <p className="font-medium">{userPool.position.liquidity.token1Amount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valore Totale</p>
                            <p className="font-medium">
                              {formatCurrency(
                                userPool.position.liquidity.token0Amount * userPool.pool.tokenPrice +
                                userPool.position.liquidity.token1Amount
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">APY</p>
                            <p className="font-medium text-green-600">
                              {formatPercentage(userPool.metrics?.liquidityAPY || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Aggiungi
                          </Button>
                          <Button size="sm" variant="outline">
                            <Minus className="h-4 w-4 mr-2" />
                            Rimuovi
                          </Button>
                          <Button size="sm" variant="outline">
                            <Award className="h-4 w-4 mr-2" />
                            Claim Rewards
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staking Tab */}
        <TabsContent value="staking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Le Mie Posizioni di Staking
              </CardTitle>
              <CardDescription>
                Gestisci i tuoi token in staking e i relativi rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userPools.filter(up => up.position.staking).length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Nessuna posizione di staking</h3>
                  <p className="text-gray-600">
                    Metti in stake i tuoi token per guadagnare rewards passivi
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPools.filter(up => up.position.staking).map((userPool) => {
                    const stakingPosition = userPool.position.staking
                    const timeRemaining = stakingPosition.startTime + stakingPosition.lockPeriod - Date.now()
                    const isLocked = timeRemaining > 0
                    
                    return (
                      <Card key={userPool.pool.id} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{userPool.pool.assetName}</h3>
                              <p className="text-sm text-gray-600">
                                Stakato: {stakingPosition.amount} token
                              </p>
                            </div>
                            <Badge variant={isLocked ? "secondary" : "default"}>
                              {isLocked ? "Locked" : "Unlocked"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Valore Stakato</p>
                              <p className="font-medium">
                                {formatCurrency(stakingPosition.amount * userPool.pool.tokenPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Rewards Guadagnati</p>
                              <p className="font-medium text-green-600">
                                {formatCurrency(stakingPosition.claimedRewards)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">APY</p>
                              <p className="font-medium">
                                {formatPercentage(userPool.pool.stakingPool.rewardRate * 100)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Tempo Rimanente</p>
                              <p className="font-medium">
                                {isLocked ? `${Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))} giorni` : 'Sbloccato'}
                              </p>
                            </div>
                          </div>

                          {isLocked && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progresso Lock Period</span>
                                <span>{Math.round(((stakingPosition.lockPeriod - timeRemaining) / stakingPosition.lockPeriod) * 100)}%</span>
                              </div>
                              <Progress value={((stakingPosition.lockPeriod - timeRemaining) / stakingPosition.lockPeriod) * 100} />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" disabled={isLocked}>
                              <Minus className="h-4 w-4 mr-2" />
                              Unstake
                            </Button>
                            <Button size="sm" variant="outline">
                              <Award className="h-4 w-4 mr-2" />
                              Claim Rewards
                            </Button>
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4 mr-2" />
                              Compound
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Governance e Proposte
              </CardTitle>
              <CardDescription>
                Partecipa alla governance dei pool e vota le proposte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Create Proposal */}
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Crea Nuova Proposta</CardTitle>
                    <CardDescription>
                      Proponi modifiche ai parametri del pool o nuove funzionalità
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="proposalTitle">Titolo Proposta</Label>
                      <Input
                        id="proposalTitle"
                        placeholder="es. Modifica fee del pool al 0.25%"
                        value={proposalForm.title}
                        onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="proposalDescription">Descrizione</Label>
                      <textarea
                        id="proposalDescription"
                        className="w-full p-2 border rounded-md"
                        rows={3}
                        placeholder="Descrivi dettagliatamente la proposta..."
                        value={proposalForm.description}
                        onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})}
                      />
                    </div>
                    <Button onClick={() => selectedPool && handleCreateProposal(selectedPool.id)}>
                      <Vote className="h-4 w-4 mr-2" />
                      Crea Proposta
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Proposals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Proposte Attive</h3>
                  {pools.flatMap(pool => 
                    pool.governance?.proposals?.filter(p => p.status === 'active') || []
                  ).length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Vote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">Nessuna proposta attiva</h3>
                        <p className="text-gray-600">
                          Le proposte di governance appariranno qui quando create
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    pools.flatMap(pool => 
                      (pool.governance?.proposals?.filter(p => p.status === 'active') || []).map(proposal => (
                        <Card key={proposal.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-semibold">{proposal.title}</h4>
                                <p className="text-sm text-gray-600">{pool.assetName}</p>
                              </div>
                              <Badge variant="outline">{proposal.type}</Badge>
                            </div>

                            <p className="text-gray-700 mb-4">{proposal.description}</p>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="text-center">
                                <p className="text-sm text-gray-600">A Favore</p>
                                <p className="text-lg font-bold text-green-600">{proposal.votes.for}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Contro</p>
                                <p className="text-lg font-bold text-red-600">{proposal.votes.against}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Astenuti</p>
                                <p className="text-lg font-bold text-gray-600">{proposal.votes.abstain}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Tempo rimanente</span>
                                <span>{Math.ceil((proposal.votingEnds - Date.now()) / (24 * 60 * 60 * 1000))} giorni</span>
                              </div>
                              <Progress value={((Date.now() - proposal.createdAt) / (proposal.votingEnds - proposal.createdAt)) * 100} />
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleVoteProposal(pool.id, proposal.id, 'for')}
                                disabled={proposal.voters.has(user?.address)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                A Favore
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleVoteProposal(pool.id, proposal.id, 'against')}
                                disabled={proposal.voters.has(user?.address)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Contro
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleVoteProposal(pool.id, proposal.id, 'abstain')}
                                disabled={proposal.voters.has(user?.address)}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Astenuto
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

