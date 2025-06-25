import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Wallet, 
  Send, 
  Download, 
  Copy, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react'
import { useWeb3 } from '../providers/Web3Provider'
import { toast } from 'sonner'

export default function WalletPage() {
  const { 
    user, 
    isAuthenticated, 
    balance, 
    walletAddress, 
    sendTransaction, 
    chainId, 
    networkName,
    nativeCurrency,
    formatAddress,
    formatBalance,
    provider
  } = useWeb3()
  
  const [transactions, setTransactions] = useState([])
  const [sendAmount, setSendAmount] = useState('')
  const [sendAddress, setSendAddress] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load user transactions
  useEffect(() => {
    if (isAuthenticated && user) {
      loadTransactions()
    } else {
      setTransactions([])
    }
  }, [isAuthenticated, user])

  const loadTransactions = () => {
    try {
      const userTransactions = JSON.parse(localStorage.getItem(`transactions_${user.address}`) || '[]')
      setTransactions(userTransactions.sort((a, b) => b.timestamp - a.timestamp))
    } catch (error) {
      console.error('Errore caricamento transazioni:', error)
    }
  }

  const handleSendTransaction = async () => {
    if (!sendAmount || !sendAddress) {
      toast.error('Inserisci importo e indirizzo destinatario')
      return
    }

    if (parseFloat(sendAmount) <= 0) {
      toast.error('Importo deve essere maggiore di 0')
      return
    }

    if (parseFloat(sendAmount) > parseFloat(balance)) {
      toast.error('Saldo insufficiente')
      return
    }

    setIsSending(true)

    try {
      const txResult = await sendTransaction(sendAddress, sendAmount)
      
      // Save transaction to localStorage
      const newTransaction = {
        hash: txResult.hash,
        type: 'send',
        amount: sendAmount,
        currency: nativeCurrency,
        to: sendAddress,
        from: walletAddress,
        status: 'success',
        timestamp: Date.now(),
        gasUsed: txResult.gasUsed,
        blockNumber: txResult.blockNumber
      }

      const existingTx = JSON.parse(localStorage.getItem(`transactions_${user.address}`) || '[]')
      existingTx.unshift(newTransaction)
      localStorage.setItem(`transactions_${user.address}`, JSON.stringify(existingTx))

      // Reset form
      setSendAmount('')
      setSendAddress('')
      
      // Reload transactions
      loadTransactions()
      
      toast.success('Transazione inviata con successo!')
      
    } catch (error) {
      console.error('Errore invio transazione:', error)
      toast.error('Errore durante l\'invio della transazione')
    } finally {
      setIsSending(false)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    toast.success('Indirizzo copiato!')
  }

  const refreshBalance = async () => {
    if (!provider || !walletAddress) return
    
    setRefreshing(true)
    try {
      // Force refresh by reloading the page or calling a refresh method
      window.location.reload()
    } catch (error) {
      console.error('Errore refresh:', error)
      toast.error('Errore aggiornamento balance')
    } finally {
      setRefreshing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Wallet</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connetti il tuo Wallet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connetti il tuo wallet per gestire le tue crypto
            </p>
            <Button onClick={() => window.location.reload()}>
              Connetti Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">
            Gestisci le tue crypto e transazioni
          </p>
        </div>
        <Button variant="outline" onClick={refreshBalance} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Wallet Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Il Tuo Wallet
            </CardTitle>
            <CardDescription>
              Informazioni del wallet connesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Indirizzo Wallet</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={walletAddress} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button size="sm" variant="outline" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Network</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{networkName}</Badge>
                <Badge variant="secondary">Chain ID: {chainId}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>
              Il tuo saldo attuale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatBalance(balance)} {nativeCurrency}
                </div>
                <p className="text-muted-foreground">
                  Saldo disponibile
                </p>
              </div>
              
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Invia
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invia {nativeCurrency}</DialogTitle>
                      <DialogDescription>
                        Invia crypto dal tuo wallet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Indirizzo Destinatario</Label>
                        <Input
                          placeholder="0x..."
                          value={sendAddress}
                          onChange={(e) => setSendAddress(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Importo ({nativeCurrency})</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Disponibile: {formatBalance(balance)} {nativeCurrency}
                        </p>
                      </div>
                      <Button 
                        onClick={handleSendTransaction} 
                        disabled={isSending || !sendAmount || !sendAddress}
                        className="w-full"
                      >
                        {isSending ? 'Invio in corso...' : 'Invia Transazione'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Ricevi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Storico Transazioni</CardTitle>
          <CardDescription>
            Le tue transazioni recenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nessuna transazione ancora</p>
              <p className="text-sm text-muted-foreground mt-2">
                Le tue transazioni appariranno qui dopo il primo invio
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      {tx.type === 'send' ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold capitalize">{tx.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString()}
                      </p>
                      {tx.to && (
                        <p className="text-xs text-muted-foreground font-mono">
                          A: {formatAddress(tx.to)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">
                      {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.currency}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={tx.status === 'success' ? 'default' : 
                                tx.status === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {tx.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {tx.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {tx.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {tx.status}
                      </Badge>
                      {tx.hash && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            const explorerUrl = chainId === 1 ? 
                              `https://etherscan.io/tx/${tx.hash}` :
                              chainId === 137 ?
                              `https://polygonscan.com/tx/${tx.hash}` :
                              `https://etherscan.io/tx/${tx.hash}`
                            window.open(explorerUrl, '_blank')
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

