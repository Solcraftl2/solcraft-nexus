import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MetaMaskProvider, useSDK } from '@metamask/sdk-react'
import { Web3Auth } from '@web3auth/modal'
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { Client as XRPLClient } from 'xrpl'
import apiService from '../services/apiService'

const Web3Context = createContext()

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

// Web3Auth configuration
const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1", // Ethereum Mainnet
  rpcTarget: "https://rpc.ankr.com/eth",
  displayName: "Ethereum Mainnet",
  blockExplorerUrl: "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
})

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  privateKeyProvider,
})

export const Web3Provider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState(null)
  const [web3authProvider, setWeb3authProvider] = useState(null)
  const [xrplClient, setXrplClient] = useState(null)

  // Initialize Web3Auth and XRPL client
  useEffect(() => {
    initializeProviders()
  }, [])

  const initializeProviders = async () => {
    try {
      // Initialize Web3Auth
      await web3auth.initModal()
      
      // Initialize XRPL client
      const client = new XRPLClient('wss://xrplcluster.com/')
      setXrplClient(client)
      
      // Check for existing session
      if (web3auth.connected) {
        setWeb3authProvider(web3auth.provider)
        await loadUserInfo()
      }
    } catch (error) {
      console.error('Error initializing providers:', error)
    }
  }

  const loadUserInfo = async () => {
    try {
      if (web3auth.connected && web3auth.provider) {
        const user = await web3auth.getUserInfo()
        const accounts = await web3auth.provider.request({ method: 'eth_accounts' })
        
        if (accounts.length > 0) {
          const balance = await web3auth.provider.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          })
          
          const userData = {
            id: user.verifierId || accounts[0],
            name: user.name || `User ${accounts[0].slice(0, 6)}`,
            email: user.email || `${accounts[0].slice(0, 10)}@web3auth.local`,
            avatar: user.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${accounts[0]}`,
            authMethod: 'web3auth'
          }

          const walletData = {
            address: accounts[0],
            type: 'Web3Auth',
            connected: true,
            provider: 'ethereum'
          }

          setUser(userData)
          setWallet(walletData)
          setIsAuthenticated(true)
          
          // Convert balance from wei to ETH
          const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18)
          setBalance(balanceInEth.toFixed(4))
          setNetwork('Ethereum Mainnet')

          // Save to localStorage
          localStorage.setItem('solcraft_user', JSON.stringify(userData))
          localStorage.setItem('solcraft_wallet', JSON.stringify(walletData))
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  const connectWithWeb3Auth = async () => {
    setIsConnecting(true)
    try {
      if (!web3auth) {
        throw new Error('Web3Auth not initialized')
      }

      const web3authProvider = await web3auth.connect()
      setWeb3authProvider(web3authProvider)
      
      await loadUserInfo()
      
      // Authenticate with backend
      try {
        await apiService.authenticateWallet({
          address: wallet?.address,
          type: 'Web3Auth'
        })
      } catch (error) {
        console.error('Backend authentication error:', error)
      }

      toast.success('Connesso con Web3Auth!')
      
    } catch (error) {
      console.error('Web3Auth connection error:', error)
      toast.error(`Errore connessione Web3Auth: ${error.message}`)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const connectWithMetaMask = async () => {
    setIsConnecting(true)
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask non installato. Installa MetaMask per continuare.')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('Nessun account selezionato')
      }

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      })

      // Get network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      const walletData = {
        address: accounts[0],
        type: 'MetaMask',
        connected: true,
        chainId: chainId,
        provider: 'ethereum'
      }

      const userData = {
        id: accounts[0],
        name: `MetaMask ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        email: `${accounts[0].slice(0, 10)}@metamask.local`,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${accounts[0]}`,
        address: accounts[0],
        authMethod: 'metamask'
      }

      setWallet(walletData)
      setUser(userData)
      setIsAuthenticated(true)
      
      // Convert balance from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18)
      setBalance(balanceInEth.toFixed(4))
      setNetwork(getNetworkName(chainId))

      // Save to localStorage
      localStorage.setItem('solcraft_user', JSON.stringify(userData))
      localStorage.setItem('solcraft_wallet', JSON.stringify(walletData))

      // Authenticate with backend
      try {
        await apiService.authenticateWallet({
          address: walletData.address,
          type: walletData.type
        })
      } catch (error) {
        console.error('Backend authentication error:', error)
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      toast.success('MetaMask connesso con successo!')

    } catch (error) {
      console.error('MetaMask connection error:', error)
      toast.error(`Errore connessione MetaMask: ${error.message}`)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const connectWithXRPL = async () => {
    setIsConnecting(true)
    try {
      if (!xrplClient) {
        throw new Error('XRPL client not initialized')
      }

      // Connect to XRPL
      await xrplClient.connect()
      
      // Generate a new wallet for demo (in production, use existing wallet)
      const { Wallet } = await import('xrpl')
      const testWallet = Wallet.generate()
      
      const walletData = {
        address: testWallet.address,
        type: 'XRPL',
        connected: true,
        provider: 'xrpl'
      }

      const userData = {
        id: testWallet.address,
        name: `XRPL ${testWallet.address.slice(0, 6)}...${testWallet.address.slice(-4)}`,
        email: `${testWallet.address.slice(0, 10)}@xrpl.local`,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${testWallet.address}`,
        address: testWallet.address,
        authMethod: 'xrpl'
      }

      setWallet(walletData)
      setUser(userData)
      setIsAuthenticated(true)
      setBalance('0.0000') // Demo balance
      setNetwork('XRP Ledger')

      // Save to localStorage
      localStorage.setItem('solcraft_user', JSON.stringify(userData))
      localStorage.setItem('solcraft_wallet', JSON.stringify(walletData))

      // Authenticate with backend
      try {
        await apiService.authenticateWallet({
          address: walletData.address,
          type: walletData.type
        })
      } catch (error) {
        console.error('Backend authentication error:', error)
      }

      toast.success('XRPL wallet connesso con successo!')

    } catch (error) {
      console.error('XRPL connection error:', error)
      toast.error(`Errore connessione XRPL: ${error.message}`)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const loginWithOAuth = async (provider) => {
    setIsConnecting(true)
    try {
      // Use Web3Auth for OAuth login
      await connectWithWeb3Auth()
      
      // Additional OAuth-specific logic can be added here
      const response = await apiService.loginWithOAuth(provider, {
        provider: provider,
        user: user
      })

      if (response.success) {
        toast.success(`Login ${provider} completato!`)
      }

      return response
    } catch (error) {
      console.error(`OAuth ${provider} error:`, error)
      toast.error(`Errore login ${provider}: ${error.message}`)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      // Disconnect Web3Auth
      if (web3auth.connected) {
        await web3auth.logout()
      }

      // Disconnect XRPL
      if (xrplClient && xrplClient.isConnected()) {
        await xrplClient.disconnect()
      }

      // Clear state
      setIsAuthenticated(false)
      setUser(null)
      setWallet(null)
      setBalance('0')
      setNetwork(null)
      setWeb3authProvider(null)

      // Clear localStorage
      localStorage.removeItem('solcraft_user')
      localStorage.removeItem('solcraft_wallet')
      localStorage.removeItem('solcraft_token')

      // Logout from backend
      await apiService.logout()

      toast.success('Disconnesso con successo!')
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Errore durante la disconnessione')
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      // Reload user info with new account
      loadUserInfo()
    }
  }

  const handleChainChanged = (chainId) => {
    setNetwork(getNetworkName(chainId))
    // Reload balance for new network
    loadUserInfo()
  }

  const getNetworkName = (chainId) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x2a': 'Kovan Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0xa86a': 'Avalanche Mainnet',
      '0xa869': 'Avalanche Fuji',
      '0x38': 'BSC Mainnet',
      '0x61': 'BSC Testnet'
    }
    return networks[chainId] || `Unknown Network (${chainId})`
  }

  const contextValue = {
    // State
    isAuthenticated,
    isConnecting,
    user,
    wallet,
    balance,
    network,
    web3authProvider,
    xrplClient,

    // Methods
    connectWithWeb3Auth,
    connectWithMetaMask,
    connectWithXRPL,
    loginWithOAuth,
    disconnect,
    
    // Aliases for backward compatibility
    connectWallet: connectWithMetaMask,
    authenticateWallet: connectWithMetaMask
  }

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  )
}



