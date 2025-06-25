import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import apiService from '../services/apiService'

const Web3Context = createContext()

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

// Simulate wallet for demo purposes
const simulateWallet = () => {
  return {
    address: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d8c8c8',
    balance: '2.5847',
    network: 'Ethereum Mainnet',
    provider: 'Simulated Wallet'
  }
}

export const Web3Provider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    setIsConnecting(true)
    try {
      // Check localStorage for existing session
      const savedUser = localStorage.getItem('solcraft_user')
      const savedWallet = localStorage.getItem('solcraft_wallet')
      
      if (savedUser && savedWallet) {
        setUser(JSON.parse(savedUser))
        setWallet(JSON.parse(savedWallet))
        setIsAuthenticated(true)
        
        // Try to reconnect wallet if available
        if (window.ethereum) {
          await reconnectWallet()
        } else {
          // Use simulated wallet if no real wallet
          const simWallet = simulateWallet()
          setWallet(simWallet)
          setBalance(simWallet.balance)
          setNetwork(simWallet.network)
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const reconnectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          })
          
          setWallet({
            address: accounts[0],
            type: 'MetaMask',
            connected: true
          })
          
          // Convert balance from wei to ETH
          const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18)
          setBalance(balanceInEth.toFixed(4))
          
          // Get network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          setNetwork(getNetworkName(chainId))
        }
      }
    } catch (error) {
      console.error('Error reconnecting wallet:', error)
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      let walletData, userData, balanceValue, networkName

      if (window.ethereum) {
        // Real MetaMask connection
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
        
        walletData = {
          address: accounts[0],
          type: 'MetaMask',
          connected: true,
          chainId: chainId
        }

        userData = {
          id: accounts[0],
          address: accounts[0],
          authMethod: 'wallet',
          connectedAt: new Date().toISOString()
        }

        // Convert balance from wei to ETH
        balanceValue = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
        networkName = getNetworkName(chainId)
      } else {
        // Simulate wallet connection
        const simWallet = simulateWallet()
        
        walletData = {
          address: simWallet.address,
          type: 'Simulated Wallet',
          connected: true,
          chainId: '0x1' // Ethereum mainnet
        }

        userData = {
          id: simWallet.address,
          address: simWallet.address,
          authMethod: 'wallet',
          connectedAt: new Date().toISOString()
        }

        balanceValue = simWallet.balance
        networkName = simWallet.network

        toast.success('Wallet simulato connesso per demo!')
      }

      setWallet(walletData)
      setUser(userData)
      setIsAuthenticated(true)
      setBalance(balanceValue)
      setNetwork(networkName)

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
        // Continue anyway since we have local auth
      }

      if (window.ethereum) {
        // Listen for account changes only if MetaMask is available
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

    } catch (error) {
      console.error('Wallet connection error:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const loginWithOAuth = async (provider) => {
    setIsConnecting(true)
    try {
      // Call real API for OAuth login
      const response = await apiService.loginWithOAuth(provider, {
        provider: provider,
        timestamp: new Date().toISOString()
      })
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          avatar: response.user.avatar,
          authMethod: provider,
          connectedAt: new Date().toISOString()
        }

        setUser(userData)
        setIsAuthenticated(true)

        // Save to localStorage
        localStorage.setItem('solcraft_user', JSON.stringify(userData))

        // After OAuth, optionally connect wallet
        if (window.ethereum) {
          try {
            await connectWalletAfterOAuth()
          } catch (error) {
            // Wallet connection is optional after OAuth
            console.log('Wallet connection skipped:', error.message)
          }
        }
      } else {
        throw new Error(response.message || 'Login fallito')
      }

    } catch (error) {
      console.error('OAuth login error:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const connectWalletAfterOAuth = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest']
        })
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        
        const walletData = {
          address: accounts[0],
          type: 'MetaMask',
          connected: true,
          chainId: chainId
        }

        setWallet(walletData)
        const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18)
        setBalance(balanceInEth.toFixed(4))
        setNetwork(getNetworkName(chainId))

        localStorage.setItem('solcraft_wallet', JSON.stringify(walletData))
      }
    } catch (error) {
      console.error('Error connecting wallet after OAuth:', error)
    }
  }

  const simulateOAuthFlow = async (provider) => {
    // Simulate OAuth API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockUsers = {
      google: {
        id: 'google_' + Math.random().toString(36).substr(2, 9),
        name: 'Mario Rossi',
        email: 'mario.rossi@gmail.com',
        avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=4285f4&color=fff'
      },
      github: {
        id: 'github_' + Math.random().toString(36).substr(2, 9),
        name: 'Mario Rossi',
        email: 'mario.rossi@github.com',
        avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=333&color=fff'
      },
      apple: {
        id: 'apple_' + Math.random().toString(36).substr(2, 9),
        name: 'Mario Rossi',
        email: 'mario.rossi@icloud.com',
        avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=000&color=fff'
      }
    }

    return mockUsers[provider] || mockUsers.google
  }

  const disconnect = async () => {
    try {
      // Clear state
      setIsAuthenticated(false)
      setUser(null)
      setWallet(null)
      setBalance('0')
      setNetwork(null)

      // Clear localStorage
      localStorage.removeItem('solcraft_user')
      localStorage.removeItem('solcraft_wallet')

      // Remove event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }

      toast.success('Disconnesso con successo')
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Errore durante la disconnessione')
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      // Update wallet address
      const updatedWallet = { ...wallet, address: accounts[0] }
      setWallet(updatedWallet)
      localStorage.setItem('solcraft_wallet', JSON.stringify(updatedWallet))
    }
  }

  const handleChainChanged = (chainId) => {
    setNetwork(getNetworkName(chainId))
    if (wallet) {
      const updatedWallet = { ...wallet, chainId }
      setWallet(updatedWallet)
      localStorage.setItem('solcraft_wallet', JSON.stringify(updatedWallet))
    }
  }

  const getNetworkName = (chainId) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0x89': 'Polygon Mainnet',
      '0x38': 'BSC Mainnet',
      '0xa4b1': 'Arbitrum One'
    }
    return networks[chainId] || 'Unknown Network'
  }

  const sendTransaction = async (to, amount, tokenAddress = null) => {
    if (!wallet) {
      throw new Error('Wallet non connesso')
    }

    try {
      const params = {
        from: wallet.address,
        to: to,
        value: '0x' + (parseFloat(amount) * Math.pow(10, 18)).toString(16)
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [params]
      })

      return txHash
    } catch (error) {
      console.error('Transaction error:', error)
      throw error
    }
  }

  const value = {
    // State
    isAuthenticated,
    isConnecting,
    user,
    wallet,
    balance,
    network,
    
    // Actions
    connectWallet,
    loginWithOAuth,
    disconnect,
    sendTransaction,
    
    // Utils
    getNetworkName
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

