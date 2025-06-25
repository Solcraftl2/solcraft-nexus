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

export const Web3Provider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState('0')
  const [network, setNetwork] = useState(null)

  // Initialize provider
  useEffect(() => {
    // Check if user is already authenticated
    const savedUser = localStorage.getItem('solcraft_user')
    const savedToken = localStorage.getItem('solcraft_token')
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
        
        // Set wallet info if available
        if (userData.address) {
          setWallet({
            address: userData.address,
            type: userData.walletType || 'Unknown',
            chainId: userData.chainId || '1'
          })
        }
      } catch (error) {
        console.error('Error loading saved user:', error)
        localStorage.removeItem('solcraft_user')
        localStorage.removeItem('solcraft_token')
      }
    }
  }, [])

  // OAuth Login Functions
  const loginWithGoogle = async () => {
    setIsConnecting(true)
    try {
      const response = await apiService.loginWithOAuth('google', {
        name: 'Google User',
        email: 'user@gmail.com'
      })
      
      if (response.success) {
        setUser(response.user)
        setIsAuthenticated(true)
        
        // Save to localStorage
        localStorage.setItem('solcraft_user', JSON.stringify(response.user))
        localStorage.setItem('solcraft_token', response.token)
        
        toast.success('Login Google completato!')
        return true
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Google login error:', error)
      toast.error(`Errore login Google: ${error.message}`)
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const loginWithGitHub = async () => {
    setIsConnecting(true)
    try {
      const response = await apiService.loginWithOAuth('github', {
        name: 'GitHub User',
        email: 'user@github.com'
      })
      
      if (response.success) {
        setUser(response.user)
        setIsAuthenticated(true)
        
        // Save to localStorage
        localStorage.setItem('solcraft_user', JSON.stringify(response.user))
        localStorage.setItem('solcraft_token', response.token)
        
        toast.success('Login GitHub completato!')
        return true
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('GitHub login error:', error)
      toast.error(`Errore login GitHub: ${error.message}`)
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const loginWithApple = async () => {
    setIsConnecting(true)
    try {
      const response = await apiService.loginWithOAuth('apple', {
        name: 'Apple User',
        email: 'user@icloud.com'
      })
      
      if (response.success) {
        setUser(response.user)
        setIsAuthenticated(true)
        
        // Save to localStorage
        localStorage.setItem('solcraft_user', JSON.stringify(response.user))
        localStorage.setItem('solcraft_token', response.token)
        
        toast.success('Login Apple completato!')
        return true
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Apple login error:', error)
      toast.error(`Errore login Apple: ${error.message}`)
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  // Wallet Connection Functions
  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Try MetaMask first
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts.length > 0) {
          const address = accounts[0]
          const chainId = await window.ethereum.request({ 
            method: 'eth_chainId' 
          })
          
          // Authenticate with backend
          const response = await apiService.authenticateWallet({
            address,
            type: 'MetaMask',
            chainId
          })
          
          if (response.success) {
            setUser(response.user)
            setWallet({
              address,
              type: 'MetaMask',
              chainId
            })
            setIsAuthenticated(true)
            
            // Save to localStorage
            localStorage.setItem('solcraft_user', JSON.stringify(response.user))
            localStorage.setItem('solcraft_token', response.token)
            
            toast.success('Wallet connesso con successo!')
            return true
          } else {
            throw new Error(response.error || 'Wallet authentication failed')
          }
        }
      } else {
        // Fallback: simulate wallet connection for demo
        const mockAddress = '0x' + Math.random().toString(16).substr(2, 40)
        const response = await apiService.authenticateWallet({
          address: mockAddress,
          type: 'Demo Wallet',
          chainId: '1'
        })
        
        if (response.success) {
          setUser(response.user)
          setWallet({
            address: mockAddress,
            type: 'Demo Wallet',
            chainId: '1'
          })
          setIsAuthenticated(true)
          
          // Save to localStorage
          localStorage.setItem('solcraft_user', JSON.stringify(response.user))
          localStorage.setItem('solcraft_token', response.token)
          
          toast.success('Demo wallet connesso!')
          return true
        } else {
          throw new Error(response.error || 'Wallet authentication failed')
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      toast.error(`Errore connessione wallet: ${error.message}`)
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    setIsAuthenticated(false)
    setUser(null)
    setWallet(null)
    setBalance('0')
    setNetwork(null)
    
    // Clear localStorage
    localStorage.removeItem('solcraft_user')
    localStorage.removeItem('solcraft_token')
    
    toast.success('Disconnesso con successo!')
  }

  const value = {
    // State
    isAuthenticated,
    isConnecting,
    user,
    wallet,
    balance,
    network,
    
    // Functions
    loginWithGoogle,
    loginWithGitHub,
    loginWithApple,
    connectWallet,
    disconnect
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

