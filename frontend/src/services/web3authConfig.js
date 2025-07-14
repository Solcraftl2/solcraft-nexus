// Web3Auth Configuration for Solcraft Nexus
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { XrplPrivateKeyProvider } from "@web3auth/xrpl-provider";

// Add Buffer polyfill for browser compatibility
if (typeof window !== 'undefined' && !window.Buffer) {
  const { Buffer } = require('buffer');
  window.Buffer = Buffer;
}

// Demo configuration - replace with real client ID for production
const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

// XRPL Mainnet configuration
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.XRPL,
  chainId: "0x1", // Mainnet
  rpcTarget: "https://s1.ripple.com:51234/",
  displayName: "XRPL Mainnet",
  ticker: "XRP",
  tickerName: "XRP",
  blockExplorer: "https://livenet.xrpl.org",
};

// Create Web3Auth instance
export const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  chainConfig,
  uiConfig: {
    appName: "Solcraft Nexus",
    appLogo: "https://i.imgur.com/j8VHv7L.png", // Professional logo
    theme: {
      primary: "#3B82F6", // Blue color matching our design
    },
    mode: "dark",
    logoLight: "https://i.imgur.com/j8VHv7L.png",
    logoDark: "https://i.imgur.com/j8VHv7L.png",
    defaultLanguage: "en",
    loginGridCol: 3,
    primaryButton: "socialLogin",
  },
});

// Create XRPL provider
export const xrplProvider = new XrplPrivateKeyProvider({ 
  config: { chainConfig } 
});

// Initialize Web3Auth
export const initializeWeb3Auth = async () => {
  try {
    await web3auth.initModal();
    if (web3auth.connected) {
      await web3auth.addAndSwitchChain(chainConfig);
    }
    console.log("Web3Auth initialized successfully");
    return true;
  } catch (error) {
    console.error("Web3Auth initialization failed:", error);
    return false;
  }
};

// Social login providers configuration
export const socialProviders = {
  google: {
    name: "Google",
    icon: "🔍",
    verifier: "google",
    typeOfLogin: "google",
  },
  twitter: {
    name: "Twitter/X",
    icon: "🐦",
    verifier: "twitter",
    typeOfLogin: "twitter",
  },
  github: {
    name: "GitHub",
    icon: "🐙",
    verifier: "github",
    typeOfLogin: "github",
  },
  discord: {
    name: "Discord",
    icon: "🎮",
    verifier: "discord",
    typeOfLogin: "discord",
  },
};

export default web3auth;