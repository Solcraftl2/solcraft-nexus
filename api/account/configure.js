import { getXRPLClient, initializeXRPL, getAccountInfo, walletFromSeed } from '../config/xrpl.js';
import { AccountSet, convertStringToHex } from 'xrpl';
import calculateAccountFlags from '../utils/calculateAccountFlags.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req, res) {
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
      walletSeed,
      configurations = {},
      domain,
      emailHash,
      messageKey,
      transferFee,
      tickSize,
      flags = {}
    } = req.body;

    if (!walletAddress || !walletSeed) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet e seed richiesti'
      });
    }

    // Costruisci la transazione AccountSet
    const accountSetTx = {
      TransactionType: 'AccountSet',
      Account: walletAddress
    };

    const configurationSteps = [];

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

    // Configurazione Flags tramite util
    const flagData = calculateAccountFlags(flags);
    if (flagData.Flags) {
      accountSetTx.Flags = flagData.Flags;
    }
    if (flagData.SetFlag !== undefined) {
      accountSetTx.SetFlag = flagData.SetFlag;
    }
    if (flagData.ClearFlag !== undefined) {
      accountSetTx.ClearFlag = flagData.ClearFlag;
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

    // Invio reale della transazione
    try {
      await initializeXRPL().catch(() => {})
      const client = getXRPLClient()
      const wallet = walletFromSeed(walletSeed)

      const prepared = await client.autofill(accountSetTx)
      const signed = wallet.sign(prepared)
      const result = await client.submitAndWait(signed.tx_blob)

      const response = {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        message: 'Configurazione account completata con successo!',
        account: walletAddress,
        appliedConfigurations: configurationSteps,
        transaction: {
          transactionHash: result.result.hash,
          ledgerIndex: result.result.ledger_index,
          fee: result.result.Fee,
          sequence: result.result.Sequence,
          validated: result.result.validated
        },
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

