import { WEB3AUTH_NETWORK } from "@web3auth/modal";

// Real Web3Auth Configuration - SolCraft Nexus Project
const clientId = "BI6yYQeCPTi4iCyJueGU9LFWZx8ecYxfldMsr7USMY0MrICSTynJk2Mu5p3DYg5zfLWo5OAakl66F3PUZdWeN7A"; // Real Client ID from Web3Auth Dashboard

export const web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Use devnet for development
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x1", // Ethereum Mainnet
      rpcTarget: "https://rpc.ankr.com/eth",
      displayName: "Ethereum Mainnet",
      blockExplorer: "https://etherscan.io",
      ticker: "ETH",
      tickerName: "Ethereum",
    },
    uiConfig: {
      appName: "SolCraft Nexus",
      appUrl: "https://solcraft-nexus-tokenize-v1.vercel.app",
      theme: {
        primary: "#3b82f6",
      },
      mode: "light",
      logoLight: "https://solcraft-nexus-tokenize-v1.vercel.app/favicon.ico",
      logoDark: "https://solcraft-nexus-tokenize-v1.vercel.app/favicon.ico",
      defaultLanguage: "en",
      loginGridCol: 3,
      primaryButton: "externalLogin",
    },
    storageKey: "local",
  },
};

export default web3AuthContextConfig;

