import { createConfig } from '@wagmi/core'
import { http } from 'viem'
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'viem/chains'
import { injected, walletConnect, metaMask, coinbaseWallet } from '@wagmi/connectors'

// Project ID da WalletConnect Cloud
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'

// Configurazione delle chain supportate
export const chains = [
  mainnet,
  sepolia, // Testnet per sviluppo
  polygon,
  arbitrum,
  optimism
]

// Configurazione dei connettori wallet
const connectors = [
  injected({ shimDisconnect: true }),
  metaMask({
    dappMetadata: {
      name: 'SolCraft Nexus',
      description: 'Piattaforma Professionale di Tokenizzazione',
      url: 'https://solcraft-nexus.vercel.app',
      icons: ['https://solcraft-nexus.vercel.app/favicon.ico']
    }
  }),
  walletConnect({ 
    projectId,
    metadata: {
      name: 'SolCraft Nexus',
      description: 'Piattaforma Professionale di Tokenizzazione',
      url: 'https://solcraft-nexus.vercel.app',
      icons: ['https://solcraft-nexus.vercel.app/favicon.ico']
    }
  }),
  coinbaseWallet({
    appName: 'SolCraft Nexus',
    appLogoUrl: 'https://solcraft-nexus.vercel.app/favicon.ico'
  })
]

// Configurazione Wagmi
export const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http()
  }
})

// Configurazione XRP Ledger
export const xrplConfig = {
  server: 'wss://xrplcluster.com/', // Mainnet
  testServer: 'wss://s.altnet.rippletest.net:51233', // Testnet
  explorerUrl: 'https://livenet.xrpl.org',
  testExplorerUrl: 'https://testnet.xrpl.org'
}

// Indirizzi dei contratti (da aggiornare con indirizzi reali)
export const contracts = {
  // Ethereum Mainnet
  [mainnet.id]: {
    tokenFactory: '0x...',
    marketplace: '0x...',
    staking: '0x...'
  },
  // Sepolia Testnet
  [sepolia.id]: {
    tokenFactory: '0x...',
    marketplace: '0x...',
    staking: '0x...'
  }
}

// Configurazione API esterne
export const apiConfig = {
  coingecko: 'https://api.coingecko.com/api/v3',
  moralis: 'https://deep-index.moralis.io/api/v2',
  alchemy: 'https://eth-mainnet.g.alchemy.com/v2',
  infura: 'https://mainnet.infura.io/v3'
}

export default config

