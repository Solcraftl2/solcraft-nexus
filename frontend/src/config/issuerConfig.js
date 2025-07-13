/**
 * Configurazione Issuer Address per SolCraft Nexus
 * Gestisce l'emissione centralizzata di token sulla blockchain XRPL
 */

// Configurazione Issuer Address principale
export const SOLCRAFT_ISSUER_CONFIG = {
  // Indirizzo issuer dedicato per SolCraft Nexus
  address: "rSolCraftNexusIssuer1234567890123456789", // Placeholder - da sostituire con indirizzo reale
  
  // Informazioni identificative
  name: "SolCraft Nexus",
  description: "Piattaforma di tokenizzazione asset su XRPL",
  domain: "solcraft-nexus.vercel.app",
  
  // Configurazione di rete
  network: "mainnet", // mainnet per produzione, testnet per test
  
  // Caratteristiche dell'issuer
  features: {
    requireAuth: true,        // Richiede autorizzazione per trust lines
    allowTrustLines: true,    // Permette trust lines
    freezeEnabled: true,      // Abilita freeze dei token
    rippling: false,          // Disabilita rippling
    transferFee: 0            // Commissione di trasferimento (0-2000000000)
  },
  
  // Metadati per i token
  defaultTokenMetadata: {
    platform: "SolCraft Nexus",
    version: "1.0",
    standard: "XRPL-Token",
    category: "Asset-Backed"
  },
  
  // Configurazione sicurezza
  security: {
    requireMultiSig: false,   // Multi-signature per operazioni critiche
    hotWallet: true,          // Usa hot wallet per operazioni quotidiane
    coldWalletBackup: true    // Backup su cold wallet
  }
};

// Configurazione per diversi ambienti
export const ISSUER_CONFIGS = {
  production: {
    ...SOLCRAFT_ISSUER_CONFIG,
    network: "mainnet",
    address: "rSolCraftNexusIssuer1234567890123456789" // Da configurare
  },
  
  staging: {
    ...SOLCRAFT_ISSUER_CONFIG,
    network: "testnet",
    address: "rSolCraftTestIssuer1234567890123456789" // Da configurare
  },
  
  development: {
    ...SOLCRAFT_ISSUER_CONFIG,
    network: "testnet",
    address: "rSolCraftDevIssuer1234567890123456789" // Da configurare
  }
};

// Funzione per ottenere la configurazione corrente
export const getCurrentIssuerConfig = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return ISSUER_CONFIGS.production;
    case 'staging':
      return ISSUER_CONFIGS.staging;
    default:
      return ISSUER_CONFIGS.development;
  }
};

// Validazione configurazione issuer
export const validateIssuerConfig = (config) => {
  const errors = [];
  
  if (!config.address || config.address.length < 25) {
    errors.push("Indirizzo issuer non valido");
  }
  
  if (!config.name || config.name.trim().length === 0) {
    errors.push("Nome issuer richiesto");
  }
  
  if (!['mainnet', 'testnet'].includes(config.network)) {
    errors.push("Network deve essere 'mainnet' o 'testnet'");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility per formattare informazioni issuer
export const formatIssuerInfo = (config) => {
  return {
    name: config.name,
    address: config.address,
    network: config.network.toUpperCase(),
    domain: config.domain,
    features: Object.keys(config.features).filter(key => config.features[key])
  };
};

// Configurazione per tipi di asset supportati
export const ASSET_TYPES_CONFIG = {
  real_estate: {
    prefix: "RE",
    category: "Real Estate",
    icon: "🏠",
    defaultSupply: 1000000,
    requiresKYC: true
  },
  art: {
    prefix: "ART",
    category: "Art & Collectibles", 
    icon: "🎨",
    defaultSupply: 100000,
    requiresKYC: false
  },
  insurance: {
    prefix: "INS",
    category: "Insurance",
    icon: "🛡️",
    defaultSupply: 1000000,
    requiresKYC: true
  },
  carbon_credits: {
    prefix: "CC",
    category: "Carbon Credits",
    icon: "🌱",
    defaultSupply: 1000000,
    requiresKYC: true
  },
  commodities: {
    prefix: "COM",
    category: "Commodities",
    icon: "🥇",
    defaultSupply: 1000000,
    requiresKYC: true
  },
  other: {
    prefix: "OTH",
    category: "Other Assets",
    icon: "📦",
    defaultSupply: 100000,
    requiresKYC: false
  }
};

// Funzione per generare simbolo token suggerito
export const generateTokenSymbol = (assetType, assetName) => {
  const typeConfig = ASSET_TYPES_CONFIG[assetType] || ASSET_TYPES_CONFIG.other;
  const prefix = typeConfig.prefix;
  
  // Estrae le prime lettere del nome asset
  const namePart = assetName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);
  
  return `${prefix}${namePart}`.substring(0, 12); // Max 12 caratteri per XRPL
};

export default SOLCRAFT_ISSUER_CONFIG;

