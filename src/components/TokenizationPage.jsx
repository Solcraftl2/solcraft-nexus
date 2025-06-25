import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { 
  Building2, 
  Coins, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Shield,
  Zap
} from 'lucide-react'
import { useWeb3 } from '../providers/Web3Provider'
import { poolService } from '../services/poolService'
import { toast } from 'sonner'

export default function TokenizationPage() {
  const { user, isAuthenticated, sendTransaction } = useWeb3()
  const [activeStep, setActiveStep] = useState(1)
  const [formData, setFormData] = useState({
    assetType: '',
    assetName: '',
    description: '',
    totalValue: '',
    tokenSupply: '',
    tokenPrice: '',
    minimumInvestment: '',
    duration: '',
    expectedReturn: '',
    riskLevel: '',
    documents: []
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myTokens, setMyTokens] = useState([])

  // Carica i token dell'utente
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserTokens()
    }
  }, [isAuthenticated, user])

  const loadUserTokens = async () => {
    try {
      // Simula caricamento token dell'utente
      const userTokens = JSON.parse(localStorage.getItem(`tokens_${user.address}`) || '[]')
      setMyTokens(userTokens)
    } catch (error) {
      console.error('Errore caricamento token:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (files) => {
    const fileList = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: true
    }))
    
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...fileList]
    }))
    
    toast.success(`${files.length} documento/i caricato/i`)
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.assetType && formData.assetName && formData.description
      case 2:
        return formData.totalValue && formData.tokenSupply && formData.tokenPrice
      case 3:
        return formData.minimumInvestment && formData.duration && formData.expectedReturn
      case 4:
        return formData.documents.length > 0
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 5))
    } else {
      toast.error('Completa tutti i campi obbligatori')
    }
  }

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1))
  }

  const submitTokenization = async () => {
    if (!isAuthenticated) {
      toast.error('Connetti il wallet per continuare')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simula creazione del token
      const newToken = {
        id: Date.now().toString(),
        ...formData,
        creator: user.address,
        createdAt: new Date().toISOString(),
        status: 'pending',
        tokenAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        tokenSymbol: formData.assetName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
        raised: 0,
        investors: 0
      }

      // Salva nel localStorage (in produzione sarebbe su blockchain)
      const existingTokens = JSON.parse(localStorage.getItem(`tokens_${user.address}`) || '[]')
      existingTokens.push(newToken)
      localStorage.setItem(`tokens_${user.address}`, JSON.stringify(existingTokens))

      // Simula transazione blockchain
      await sendTransaction(
        '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e4c2', // Indirizzo contratto factory
        '0.01', // Fee di creazione
        '0x' // Dati del contratto
      )

      // Crea automaticamente il pool per l'asset tokenizzato
      const poolConfig = {
        type: 'liquidity',
        minimumStake: parseFloat(formData.minimumInvestment),
        fee: 0.003, // 0.3%
        yieldFarming: true,
        yieldMultiplier: 1.5,
        governance: true,
        maxLeverage: 1,
        initialLiquidity: {
          token0Amount: parseFloat(formData.tokenSupply) * 0.1, // 10% della supply iniziale
          token1Amount: parseFloat(formData.tokenPrice) * parseFloat(formData.tokenSupply) * 0.1,
          userAddress: user.address
        }
      }

      // Crea il pool
      const createdPool = await poolService.createAssetPool(newToken, poolConfig)
      
      toast.success('Asset tokenizzato e pool creato con successo!')
      toast.info(`Pool ID: ${createdPool.id}`)
      
      setActiveStep(5)
      loadUserTokens()
      
    } catch (error) {
      toast.error('Errore durante la tokenizzazione')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      assetType: '',
      assetName: '',
      description: '',
      totalValue: '',
      tokenSupply: '',
      tokenPrice: '',
      minimumInvestment: '',
      duration: '',
      expectedReturn: '',
      riskLevel: '',
      documents: []
    })
    setActiveStep(1)
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Connessione Richiesta</CardTitle>
            <CardDescription>
              Connetti il tuo wallet per accedere alla tokenizzazione
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tokenizzazione Asset</h1>
        <p className="text-gray-600">
          Trasforma i tuoi asset fisici in token digitali negoziabili
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Crea Nuovo Token</TabsTrigger>
          <TabsTrigger value="manage">I Miei Token ({myTokens.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step <= activeStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step < activeStep ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                ))}
              </div>
              <Progress value={(activeStep / 5) * 100} className="h-2" />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Asset Info</span>
                <span>Valutazione</span>
                <span>Termini</span>
                <span>Documenti</span>
                <span>Conferma</span>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Asset Information */}
          {activeStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informazioni Asset
                </CardTitle>
                <CardDescription>
                  Fornisci i dettagli base del tuo asset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="assetType">Tipo di Asset *</Label>
                  <Select value={formData.assetType} onValueChange={(value) => handleInputChange('assetType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo di asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-estate">Immobiliare</SelectItem>
                      <SelectItem value="precious-metals">Metalli Preziosi</SelectItem>
                      <SelectItem value="art">Arte e Collezioni</SelectItem>
                      <SelectItem value="business">Attività Commerciale</SelectItem>
                      <SelectItem value="commodities">Materie Prime</SelectItem>
                      <SelectItem value="intellectual-property">Proprietà Intellettuale</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assetName">Nome Asset *</Label>
                  <Input
                    id="assetName"
                    value={formData.assetName}
                    onChange={(e) => handleInputChange('assetName', e.target.value)}
                    placeholder="es. Appartamento Milano Centro"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrizione *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrivi dettagliatamente l'asset..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Valuation */}
          {activeStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valutazione e Tokenomics
                </CardTitle>
                <CardDescription>
                  Definisci il valore e la struttura dei token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalValue">Valore Totale Asset (USD) *</Label>
                    <Input
                      id="totalValue"
                      type="number"
                      value={formData.totalValue}
                      onChange={(e) => handleInputChange('totalValue', e.target.value)}
                      placeholder="1000000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tokenSupply">Supply Totale Token *</Label>
                    <Input
                      id="tokenSupply"
                      type="number"
                      value={formData.tokenSupply}
                      onChange={(e) => handleInputChange('tokenSupply', e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tokenPrice">Prezzo per Token (USD) *</Label>
                  <Input
                    id="tokenPrice"
                    type="number"
                    step="0.01"
                    value={formData.tokenPrice}
                    onChange={(e) => handleInputChange('tokenPrice', e.target.value)}
                    placeholder="100.00"
                  />
                  {formData.totalValue && formData.tokenSupply && (
                    <p className="text-sm text-gray-600 mt-1">
                      Prezzo calcolato: ${(parseFloat(formData.totalValue) / parseFloat(formData.tokenSupply) || 0).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="riskLevel">Livello di Rischio</Label>
                  <Select value={formData.riskLevel} onValueChange={(value) => handleInputChange('riskLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona livello di rischio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basso</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Investment Terms */}
          {activeStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Termini di Investimento
                </CardTitle>
                <CardDescription>
                  Definisci i termini per gli investitori
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minimumInvestment">Investimento Minimo (USD) *</Label>
                    <Input
                      id="minimumInvestment"
                      type="number"
                      value={formData.minimumInvestment}
                      onChange={(e) => handleInputChange('minimumInvestment', e.target.value)}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Durata (mesi) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expectedReturn">Rendimento Atteso Annuo (%) *</Label>
                  <Input
                    id="expectedReturn"
                    type="number"
                    step="0.1"
                    value={formData.expectedReturn}
                    onChange={(e) => handleInputChange('expectedReturn', e.target.value)}
                    placeholder="8.5"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Documents */}
          {activeStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentazione
                </CardTitle>
                <CardDescription>
                  Carica i documenti necessari per la verifica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Carica Documenti</p>
                  <p className="text-gray-600 mb-4">
                    Trascina i file qui o clicca per selezionare
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Seleziona File
                    </label>
                  </Button>
                </div>

                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Documenti Caricati:</h4>
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{doc.name}</span>
                        <Badge variant="secondary">
                          {doc.uploaded ? 'Caricato' : 'In caricamento...'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Documenti richiesti:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Certificato di proprietà</li>
                    <li>Valutazione professionale</li>
                    <li>Documenti di identità</li>
                    <li>Business plan (se applicabile)</li>
                    <li>Certificazioni di qualità</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Confirmation */}
          {activeStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Riepilogo e Conferma
                </CardTitle>
                <CardDescription>
                  Verifica tutti i dettagli prima di procedere
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Asset</h4>
                      <p className="text-gray-600">{formData.assetName}</p>
                      <p className="text-sm text-gray-500">{formData.assetType}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">Valore Totale</h4>
                      <p className="text-2xl font-bold text-green-600">
                        ${parseFloat(formData.totalValue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Token</h4>
                      <p className="text-gray-600">{formData.tokenSupply} token</p>
                      <p className="text-sm text-gray-500">${formData.tokenPrice} per token</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">Rendimento Atteso</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {formData.expectedReturn}% annuo
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Importante</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        La tokenizzazione comporta costi di gas e commissioni. 
                        Assicurati di avere fondi sufficienti nel wallet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={submitTokenization}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Tokenizzazione in corso...
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4 mr-2" />
                        Conferma Tokenizzazione
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Ricomincia
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          {activeStep < 5 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={activeStep === 1}
              >
                Indietro
              </Button>
              <Button onClick={nextStep}>
                {activeStep === 4 ? 'Rivedi' : 'Avanti'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-6">
            {myTokens.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Coins className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Nessun token creato</h3>
                  <p className="text-gray-600 mb-4">
                    Non hai ancora tokenizzato nessun asset
                  </p>
                  <Button onClick={() => setActiveStep(1)}>
                    Crea il tuo primo token
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myTokens.map((token) => (
                <Card key={token.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{token.assetName}</CardTitle>
                        <CardDescription>{token.assetType}</CardDescription>
                      </div>
                      <Badge variant={token.status === 'active' ? 'default' : 'secondary'}>
                        {token.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Valore Totale</p>
                        <p className="font-medium">${parseFloat(token.totalValue).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Token Supply</p>
                        <p className="font-medium">{token.tokenSupply}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Raccolto</p>
                        <p className="font-medium">${token.raised.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Investitori</p>
                        <p className="font-medium">{token.investors}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Gestisci
                      </Button>
                      <Button size="sm" variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

