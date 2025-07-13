/**
 * XUMM Service - Solcraft Nexus
 * Gestione connessione wallet e transazioni XRPL tramite XUMM
 */

import { Xumm } from 'xumm-sdk'

class XummService {
  constructor() {
    // API Key configurata nel dashboard XUMM
    this.apiKey = '0695236b-a4d2-4bd3-a01b-383693245968'
    this.xumm = new Xumm(this.apiKey)
    this.isConnected = false
    this.currentAccount = null
    this.userToken = null
    
    console.log('🦄 XUMM Service inizializzato con API Key:', this.apiKey)
  }

  /**
   * Connessione automatica wallet cliente
   * Qualsiasi utente con XUMM può connettersi automaticamente
   */
  async connectWallet() {
    try {
      console.log('🔗 Iniziando connessione XUMM...')
      
      // Crea payload di connessione (SignIn)
      const payload = await this.xumm.payload.create({
        txjson: {
          TransactionType: 'SignIn'
        },
        options: {
          submit: false, // Non inviare alla rete, solo per autenticazione
          expire: 5, // Scade in 5 minuti
          return_url: {
            app: 'https://solcraft-nexus.vercel.app/dashboard',
            web: 'https://solcraft-nexus.vercel.app/dashboard'
          }
        }
      })

      console.log('📱 Payload creato:', {
        uuid: payload.uuid,
        qr: payload.refs.qr_png,
        deeplink: payload.next.always
      })

      // Apri XUMM automaticamente (mobile) o mostra QR (desktop)
      if (this.isMobile()) {
        window.open(payload.next.always, '_blank')
      }

      // Attendi autorizzazione utente
      const result = await this.xumm.payload.subscribe(payload.uuid, (event) => {
        console.log('📡 Evento XUMM ricevuto:', event)
        
        if (event.data.signed === true) {
          console.log('✅ Utente ha autorizzato la connessione')
          return event.data
        }
        
        if (event.data.signed === false) {
          console.log('❌ Utente ha rifiutato la connessione')
          throw new Error('Connessione rifiutata dall\'utente')
        }
      })

      // Salva dati connessione
      this.isConnected = true
      this.currentAccount = result.account
      this.userToken = result.user_token

      console.log('🎉 Connessione XUMM completata:', {
        account: this.currentAccount,
        userToken: this.userToken
      })

      return {
        success: true,
        account: this.currentAccount,
        userToken: this.userToken,
        network: 'mainnet', // XUMM usa mainnet di default
        qrCode: payload.refs.qr_png,
        deeplink: payload.next.always
      }

    } catch (error) {
      console.error('❌ Errore connessione XUMM:', error)
      
      return {
        success: false,
        error: error.message,
        details: error
      }
    }
  }

  /**
   * Crea transazione di tokenizzazione per il cliente
   */
  async createTokenizationTransaction(tokenData) {
    try {
      if (!this.isConnected || !this.currentAccount) {
        throw new Error('Wallet non connesso. Connetti prima il wallet.')
      }

      console.log('💎 Creando transazione tokenizzazione per:', this.currentAccount)

      // Crea payload TrustSet per accettare il nuovo token
      const payload = await this.xumm.payload.create({
        txjson: {
          TransactionType: 'TrustSet',
          Account: this.currentAccount,
          LimitAmount: {
            currency: tokenData.currencyCode || 'SOL',
            issuer: tokenData.issuer || 'rSolCraftIssuerAddressHere123456789',
            value: tokenData.amount?.toString() || '1000000'
          }
        },
        options: {
          submit: true, // Invia automaticamente alla rete XRPL
          expire: 10, // Scade in 10 minuti
          return_url: {
            app: 'https://solcraft-nexus.vercel.app/dashboard?token=created',
            web: 'https://solcraft-nexus.vercel.app/dashboard?token=created'
          }
        }
      })

      console.log('📱 Transazione tokenizzazione creata:', {
        uuid: payload.uuid,
        qr: payload.refs.qr_png,
        deeplink: payload.next.always
      })

      // Apri XUMM per firma
      if (this.isMobile()) {
        window.open(payload.next.always, '_blank')
      }

      return {
        success: true,
        uuid: payload.uuid,
        qrCode: payload.refs.qr_png,
        deeplink: payload.next.always,
        message: 'Transazione creata. Autorizza nel tuo wallet XUMM.'
      }

    } catch (error) {
      console.error('❌ Errore creazione transazione:', error)
      
      return {
        success: false,
        error: error.message,
        details: error
      }
    }
  }

  /**
   * Verifica stato transazione
   */
  async checkTransactionStatus(uuid) {
    try {
      const result = await this.xumm.payload.get(uuid)
      
      return {
        uuid: uuid,
        signed: result.meta.signed,
        resolved: result.meta.resolved,
        txid: result.response?.txid,
        account: result.response?.account,
        timestamp: result.meta.resolved_at
      }
    } catch (error) {
      console.error('❌ Errore verifica transazione:', error)
      return { error: error.message }
    }
  }

  /**
   * Crea pagamento XRPL
   */
  async createPayment(destination, amount, currency = 'XRP') {
    try {
      if (!this.isConnected || !this.currentAccount) {
        throw new Error('Wallet non connesso')
      }

      const payload = await this.xumm.payload.create({
        txjson: {
          TransactionType: 'Payment',
          Account: this.currentAccount,
          Destination: destination,
          Amount: currency === 'XRP' 
            ? (parseFloat(amount) * 1000000).toString() // XRP in drops
            : {
                currency: currency,
                issuer: 'rIssuerAddressHere',
                value: amount.toString()
              }
        },
        options: {
          submit: true,
          expire: 10
        }
      })

      if (this.isMobile()) {
        window.open(payload.next.always, '_blank')
      }

      return {
        success: true,
        uuid: payload.uuid,
        qrCode: payload.refs.qr_png,
        deeplink: payload.next.always
      }

    } catch (error) {
      console.error('❌ Errore creazione pagamento:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Disconnetti wallet
   */
  disconnect() {
    this.isConnected = false
    this.currentAccount = null
    this.userToken = null
    
    console.log('🔌 Wallet XUMM disconnesso')
    
    return { success: true, message: 'Wallet disconnesso' }
  }

  /**
   * Ottieni informazioni account corrente
   */
  getAccountInfo() {
    return {
      isConnected: this.isConnected,
      account: this.currentAccount,
      userToken: this.userToken,
      network: 'mainnet'
    }
  }

  /**
   * Verifica se è dispositivo mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * Ottieni bilancio account (richiede API XRPL separata)
   */
  async getAccountBalance() {
    if (!this.currentAccount) {
      return { error: 'Account non connesso' }
    }

    try {
      // Qui potresti integrare con API XRPL per ottenere il bilancio
      // Per ora restituiamo un placeholder
      return {
        account: this.currentAccount,
        balance: '0 XRP',
        tokens: []
      }
    } catch (error) {
      return { error: error.message }
    }
  }
}

// Esporta istanza singleton
const xummService = new XummService()
export default xummService

// Esporta anche la classe per test
export { XummService }

