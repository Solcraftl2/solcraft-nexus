import React, { createContext, useContext, useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';

const Web3AuthContext = createContext();

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

export const Web3AuthProvider = ({ children }) => {
  const [web3auth, setWeb3auth] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Real Web3Auth configuration with actual Client ID
        const clientId = "BI6yYQeCPTi4iCyJueGU9LFWZx8ecYxfldMsr7USMY0MrICSTynJk2Mu5p3DYg5zfLWo5OAakl66F3PUZdWeN7A";
        
        const web3AuthInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
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
            defaultLanguage: "en",
            loginGridCol: 3,
            primaryButton: "externalLogin",
          },
        });

        // Configure OpenLogin adapter for social logins
        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "optional",
          },
          adapterSettings: {
            uxMode: "popup",
            whiteLabel: {
              appName: "SolCraft Nexus",
              appUrl: "https://solcraft-nexus-tokenize-v1.vercel.app",
              logoLight: "https://web3auth.io/images/web3authlog.png",
              logoDark: "https://web3auth.io/images/web3authlogodark.png",
              defaultLanguage: "en",
              mode: "light",
              theme: {
                primary: "#3b82f6",
              },
            },
          },
        });

        web3AuthInstance.configureAdapter(openloginAdapter);
        setWeb3auth(web3AuthInstance);

        await web3AuthInstance.initModal();
        
        // Check if user is already logged in
        if (web3AuthInstance.connected) {
          setProvider(web3AuthInstance.provider);
          setLoggedIn(true);
          const user = await web3AuthInstance.getUserInfo();
          setUserInfo(user);
        }
      } catch (error) {
        console.error("Web3Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (loginProvider = "google") => {
    if (!web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }
    
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
      
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      
      return {
        provider: web3authProvider,
        userInfo: user
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    if (!web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }
    
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("Provider not initialized yet");
      return [];
    }
    
    try {
      const accounts = await provider.request({
        method: "eth_accounts",
      });
      return accounts;
    } catch (error) {
      console.error("Get accounts error:", error);
      return [];
    }
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("Provider not initialized yet");
      return "0";
    }
    
    try {
      const accounts = await getAccounts();
      if (accounts.length === 0) return "0";
      
      const balance = await provider.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });
      
      // Convert from wei to ETH
      return (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
    } catch (error) {
      console.error("Get balance error:", error);
      return "0";
    }
  };

  const signMessage = async (message) => {
    if (!provider) {
      console.log("Provider not initialized yet");
      return;
    }
    
    try {
      const accounts = await getAccounts();
      if (accounts.length === 0) throw new Error("No accounts found");
      
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, accounts[0]],
      });
      
      return signature;
    } catch (error) {
      console.error("Sign message error:", error);
      throw error;
    }
  };

  const contextValue = {
    web3auth,
    provider,
    loggedIn,
    loading,
    userInfo,
    login,
    logout,
    getAccounts,
    getBalance,
    signMessage,
  };

  return (
    <Web3AuthContext.Provider value={contextValue}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export default Web3AuthProvider;

