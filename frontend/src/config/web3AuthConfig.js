import { WEB3AUTH_NETWORK } from "@web3auth/modal";

// Real Web3Auth Configuration following official documentation
const clientId = "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw"; // Official example from docs

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
      logoLight: "https://web3auth.io/images/web3authlog.png",
      logoDark: "https://web3auth.io/images/web3authlogodark.png",
      defaultLanguage: "en",
      loginGridCol: 3,
      primaryButton: "externalLogin",
    },
    storageKey: "local",
  },
};

export default web3AuthContextConfig;

