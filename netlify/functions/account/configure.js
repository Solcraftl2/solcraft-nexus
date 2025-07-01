import { createReqRes } from '../config/requestWrapper.js';
import { getXRPLClient, initializeXRPL, getAccountInfo } from '../config/xrpl.js';
import { AccountSet, convertStringToHex } from 'xrpl';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

exports.handler = async (event, context) => {
  const { req, res } = createReqRes(event);
  
  try {
    await originalHandler(req, res);
    
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: res.headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function originalHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST or PUT for account configuration.' 
    })
  }

  try {
    // Verifica autenticazione
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione richiesto'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }

    const {
      walletAddress,
      configurations = {},
      domain,
      emailHash,
      messageKey,
      transferFee,
      tickSize,
      flags = {}
    } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet richiesto'
      });
    }

    // Costruisci la transazione AccountSet
    const accountSetTx = {
      TransactionType: 'AccountSet',
      Account: walletAddress
    };

    const configurationSteps = [];
    let txFlags = 0;

    // Configurazione Domain
    if (domain) {
      try {
        accountSetTx.Domain = convertStringToHex(domain);
        configurationSteps.push({
          type: 'domain',
          value: domain,
          description: `Impostazione dominio: ${domain}`
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Formato dominio non valido'
        });
      }
    }

    // Configurazione Email Hash
    if (emailHash) {
      // Verifica che sia un hash MD5 valido
      if (!/^[a-f0-9]{32}$/i.test(emailHash)) {
        return res.status(400).json({
          success: false,
          error: 'Email hash deve essere un MD5 valido (32 caratteri hex)'
        });
      }
      accountSetTx.EmailHash = emailHash.toUpperCase();
      configurationSteps.push({
        type: 'email_hash',
        value: emailHash,
        description: 'Impostazione hash email per identificazione'
      });
    }

    // Configurazione Message Key
    if (messageKey) {
      try {
        accountSetTx.MessageKey = messageKey;
        configurationSteps.push({
          type: 'message_key',
          value: messageKey,
          description: 'Impostazione chiave pubblica per messaggi'
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Message key non valida'
        });
      }
    }

    // Configurazione Transfer Fee (solo per token issuer)
    if (transferFee !== undefined) {
      if (transferFee < 0 || transferFee > 2000000000) {
        return res.status(400).json({
          success: false,
          error: 'Transfer fee deve essere tra 0 e 2,000,000,000'
        });
      }
      accountSetTx.TransferFee = transferFee;
      configurationSteps.push({
        type: 'transfer_fee',
        value: transferFee,
        description: `Impostazione fee di trasferimento: ${transferFee / 1000000}%`
      });
    }

    // Configurazione Tick Size (per trading)
    if (tickSize !== undefined) {
      if (tickSize < 3 || tickSize > 15) {
        return res.status(400).json({
          success: false,
          error: 'Tick size deve essere tra 3 e 15'
        });
      }
      accountSetTx.TickSize = tickSize;
      configurationSteps.push({
        type: 'tick_size',
        value: tickSize,
        description: `Impostazione tick size per trading: ${tickSize} cifre significative`
      });
    }

    // Configurazione Flags
    const flagMappings = {
      requireDestinationTag: { flag: 0x00000001, name: 'RequireDestTag' },
      requireAuth: { flag: 0x00000002, name: 'RequireAuth' },
      disallowXRP: { flag: 0x00000003, name: 'DisallowXRP' },
      disableMaster: { flag: 0x00000004, name: 'DisableMaster' },
      accountTxnID: { flag: 0x00000005, name: 'AccountTxnID' },
      noFreeze: { flag: 0x00000006, name: 'NoFreeze' },
      globalFreeze: { flag: 0x00000007, name: 'GlobalFreeze' },
      defaultRipple: { flag: 0x00000008, name: 'DefaultRipple' },
      depositAuth: { flag: 0x00000009, name: 'DepositAuth' }
    };

    Object.entries(flags).forEach(([flagName, enable]) => {
      if (flagMappings[flagName]) {
        const mapping = flagMappings[flagName];
        if (enable) {
          txFlags |= mapping.flag;
          configurationSteps.push({
            type: 'flag_enable',
            value: flagName,
            description: `Attivazione flag: ${mapping.name}`
          });
        } else {
          txFlags |= (mapping.flag | 0x00020000); // Clear flag
          configurationSteps.push({
            type: 'flag_disable',
            value: flagName,
            description: `Disattivazione flag: ${mapping.name}`
          });
        }
      }
    });

    if (txFlags > 0) {
      accountSetTx.Flags = txFlags;
    }

    // Configurazioni specifiche per account di tokenizzazione
    const tokenizationConfig = {};
    if (configurations.isTokenIssuer) {
      tokenizationConfig.issuerType = 'rwa_tokenization';
      tokenizationConfig.capabilities = [
        'issue_tokens',
        'manage_trustlines',
        'set_transfer_fees',
        'freeze_tokens'
      ];
      
      // Configurazioni consigliate per issuer RWA
      if (!flags.requireAuth) {
        configurationSteps.push({
          type: 'recommendation',
          value: 'require_auth',
          description: 'RACCOMANDATO: Attivare RequireAuth per controllo emissioni'
        });
      }
      
      if (!flags.noFreeze) {
        configurationSteps.push({
          type: 'recommendation',
          value: 'no_freeze',
          description: 'CONSIDERARE: NoFreeze per maggiore fiducia degli utenti'
        });
      }
    }

    // Simula l'invio della transazione
    try {
      const simulatedTxResult = {
        success: true,
        transactionHash: 'mock_config_' + Date.now(),
        ledgerIndex: Math.floor(Math.random() * 1000000),
        fee: '12',
        sequence: Math.floor(Math.random() * 1000),
        validated: true
      };

      const response = {
        success: true,
        message: 'Configurazione account completata con successo!',
        account: walletAddress,
        appliedConfigurations: configurationSteps,
        transaction: simulatedTxResult,
        accountSettings: {
          domain: domain,
          emailHash: emailHash,
          messageKey: messageKey,
          transferFee: transferFee,
          tickSize: tickSize,
          flags: flags
        },
        tokenizationConfig: Object.keys(tokenizationConfig).length > 0 ? tokenizationConfig : null,
        nextSteps: [
          'Verifica che tutte le configurazioni siano applicate correttamente',
          configurations.isTokenIssuer ? 'Configura le trust lines per i token da emettere' : null,
          'Testa le funzionalità configurate prima dell\'uso in produzione',
          'Mantieni backup sicuri delle chiavi di configurazione'
        ].filter(Boolean),
        warnings: [
          flags.disableMaster ? 'ATTENZIONE: Master key disabilitata - assicurati di avere chiavi alternative configurate' : null,
          flags.globalFreeze ? 'ATTENZIONE: Global freeze attivo - tutti i token sono congelati' : null,
          transferFee > 1000000 ? 'ATTENZIONE: Transfer fee elevata potrebbe scoraggiare l\'uso' : null
        ].filter(Boolean)
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('Account configuration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore durante la configurazione account',
        message: error.message
      });
    }

  } catch (error) {
    console.error('Account configure API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server durante la configurazione',
      message: error.message
    });
  }
}

