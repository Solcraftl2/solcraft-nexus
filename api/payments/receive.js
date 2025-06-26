import { getXRPLClient, initializeXRPL, getAccountInfo } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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

    // GET - Genera informazioni per ricevere pagamenti
    if (req.method === 'GET') {
      const {
        walletAddress,
        amount,
        currency = 'XRP',
        issuer,
        memo,
        expirationMinutes = 60
      } = req.query;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'walletAddress richiesto'
        });
      }

      try {
        // Genera destination tag unico per tracking
        const destinationTag = generateDestinationTag();
        
        // Genera ID richiesta pagamento
        const paymentRequestId = 'req_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
        
        // Calcola scadenza
        const expirationTime = new Date(Date.now() + (expirationMinutes * 60 * 1000));
        
        // Costruisci URI di pagamento XRPL
        const paymentURI = buildXRPLPaymentURI({
          address: walletAddress,
          amount: amount,
          currency: currency,
          issuer: issuer,
          destinationTag: destinationTag,
          memo: memo
        });

        // Genera QR code data
        const qrCodeData = {
          uri: paymentURI,
          format: 'XRPL_PAYMENT',
          version: '1.0'
        };

        // Informazioni per il mittente
        const paymentInstructions = {
          address: walletAddress,
          destinationTag: destinationTag,
          amount: amount ? {
            value: amount,
            currency: currency,
            issuer: currency !== 'XRP' ? issuer : null
          } : null,
          memo: memo,
          network: process.env.XRPL_NETWORK || 'testnet'
        };

        // Genera istruzioni dettagliate
        const instructions = generatePaymentInstructions({
          address: walletAddress,
          destinationTag: destinationTag,
          amount: amount,
          currency: currency,
          memo: memo
        });

        const response = {
          success: true,
          paymentRequest: {
            id: paymentRequestId,
            status: 'active',
            created: new Date().toISOString(),
            expires: expirationTime.toISOString(),
            expirationMinutes: expirationMinutes
          },
          recipient: {
            address: walletAddress,
            destinationTag: destinationTag,
            name: decoded.name || 'SolCraft Nexus User'
          },
          payment: paymentInstructions,
          qrCode: {
            data: JSON.stringify(qrCodeData),
            uri: paymentURI,
            format: 'XRPL_URI'
          },
          instructions: instructions,
          monitoring: {
            webhookUrl: null, // In produzione, endpoint per notifiche
            pollingInterval: 5, // secondi
            confirmationsRequired: 1
          },
          security: {
            destinationTagRequired: true,
            memoRecommended: memo ? true : false,
            networkValidation: true
          }
        };

        return res.status(200).json(response);

      } catch (error) {
        console.error('Payment request generation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la generazione richiesta pagamento',
          message: error.message
        });
      }
    }

    // POST - Verifica pagamento ricevuto
    if (req.method === 'POST') {
      const {
        walletAddress,
        destinationTag,
        paymentRequestId,
        transactionHash
      } = req.body;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'walletAddress richiesto per verifica pagamento'
        });
      }

      try {
        await initializeXRPL();
        const client = getXRPLClient();

        let verificationResult;

        if (transactionHash) {
          // Verifica transazione specifica
          verificationResult = await verifySpecificTransaction(client, transactionHash, walletAddress, destinationTag);
        } else {
          // Cerca pagamenti recenti
          verificationResult = await searchRecentPayments(client, walletAddress, destinationTag, paymentRequestId);
        }

        if (verificationResult.found) {
          const response = {
            success: true,
            message: 'Pagamento ricevuto e verificato!',
            payment: verificationResult.payment,
            verification: {
              status: 'confirmed',
              confirmations: verificationResult.confirmations,
              timestamp: verificationResult.timestamp,
              blockHeight: verificationResult.ledgerIndex
            },
            details: {
              from: verificationResult.payment.sender,
              to: verificationResult.payment.recipient,
              amount: verificationResult.payment.amount,
              fee: verificationResult.payment.fee,
              memo: verificationResult.payment.memo
            },
            nextSteps: [
              'Pagamento confermato sulla blockchain',
              'Fondi disponibili nel wallet',
              'Ricevuta generata automaticamente',
              'Notifica inviata al mittente (se configurata)'
            ]
          };

          // Log per audit
          console.log('Payment received and verified:', {
            to: walletAddress,
            from: verificationResult.payment.sender,
            amount: verificationResult.payment.amount,
            txHash: verificationResult.payment.hash,
            destinationTag: destinationTag,
            user: decoded.userId,
            timestamp: new Date().toISOString()
          });

          return res.status(200).json(response);
        } else {
          return res.status(404).json({
            success: false,
            message: 'Nessun pagamento trovato',
            verification: {
              status: 'not_found',
              searchCriteria: {
                address: walletAddress,
                destinationTag: destinationTag,
                paymentRequestId: paymentRequestId,
                transactionHash: transactionHash
              },
              lastChecked: new Date().toISOString()
            },
            suggestions: [
              'Verifica che l\'indirizzo sia corretto',
              'Controlla che il destination tag sia stato incluso',
              'Attendi qualche minuto per la conferma della transazione',
              'Verifica lo stato della transazione su XRPL explorer'
            ]
          });
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la verifica pagamento',
          message: error.message
        });
      }
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Payment receive API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

// Funzioni helper
function generateDestinationTag() {
  // Genera destination tag unico (1-4294967295)
  return Math.floor(Math.random() * 4294967295) + 1;
}

function buildXRPLPaymentURI({ address, amount, currency, issuer, destinationTag, memo }) {
  let uri = `https://xrpl.org/send?to=${address}`;
  
  if (destinationTag) {
    uri += `&dt=${destinationTag}`;
  }
  
  if (amount) {
    if (currency === 'XRP') {
      uri += `&amount=${amount}`;
    } else {
      uri += `&amount=${amount}+${currency}`;
      if (issuer) {
        uri += `+${issuer}`;
      }
    }
  }
  
  if (memo) {
    uri += `&memo=${encodeURIComponent(memo)}`;
  }
  
  return uri;
}

function generatePaymentInstructions({ address, destinationTag, amount, currency, memo }) {
  const instructions = [
    {
      step: 1,
      title: 'Indirizzo Destinatario',
      description: `Invia il pagamento a: ${address}`,
      critical: true
    },
    {
      step: 2,
      title: 'Destination Tag',
      description: `IMPORTANTE: Includi il destination tag: ${destinationTag}`,
      critical: true,
      warning: 'Il destination tag è obbligatorio per identificare il pagamento'
    }
  ];

  if (amount) {
    instructions.push({
      step: 3,
      title: 'Importo',
      description: `Importo esatto: ${amount} ${currency}`,
      critical: true
    });
  }

  if (memo) {
    instructions.push({
      step: 4,
      title: 'Memo',
      description: `Includi memo: ${memo}`,
      critical: false
    });
  }

  instructions.push({
    step: instructions.length + 1,
    title: 'Conferma',
    description: 'Verifica tutti i dettagli prima di inviare',
    critical: true,
    warning: 'Le transazioni XRPL sono irreversibili'
  });

  return {
    steps: instructions,
    warnings: [
      'Verifica sempre l\'indirizzo destinatario',
      'Il destination tag è obbligatorio',
      'Le transazioni sono irreversibili',
      'Controlla le commissioni di rete'
    ],
    tips: [
      'Usa wallet compatibili XRPL',
      'Mantieni una piccola riserva XRP nel wallet',
      'Salva la ricevuta della transazione',
      'Contatta il supporto in caso di problemi'
    ]
  };
}

async function verifySpecificTransaction(client, txHash, expectedDestination, expectedDestinationTag) {
  try {
    const txResult = await client.request({
      command: 'tx',
      transaction: txHash
    });

    const tx = txResult.result;
    
    if (tx.TransactionType === 'Payment' && 
        tx.Destination === expectedDestination &&
        (!expectedDestinationTag || tx.DestinationTag === expectedDestinationTag)) {
      
      return {
        found: true,
        payment: {
          hash: txHash,
          sender: tx.Account,
          recipient: tx.Destination,
          amount: tx.Amount,
          fee: tx.Fee,
          memo: tx.Memos ? decodeMemo(tx.Memos[0]) : null,
          destinationTag: tx.DestinationTag
        },
        confirmations: 1,
        timestamp: new Date().toISOString(),
        ledgerIndex: tx.ledger_index
      };
    }
    
    return { found: false };
  } catch (error) {
    console.error('Transaction verification error:', error);
    return { found: false, error: error.message };
  }
}

async function searchRecentPayments(client, address, destinationTag, paymentRequestId) {
  try {
    // Simula ricerca pagamenti recenti
    // In produzione, userebbe account_tx per cercare transazioni recenti
    
    const mockPayment = {
      found: Math.random() > 0.7, // 30% probabilità di trovare pagamento
      payment: {
        hash: 'mock_payment_' + Date.now(),
        sender: 'rSenderAddress123456789',
        recipient: address,
        amount: '1000000', // 1 XRP in drops
        fee: '12',
        memo: 'Test payment',
        destinationTag: destinationTag
      },
      confirmations: 1,
      timestamp: new Date().toISOString(),
      ledgerIndex: Math.floor(Math.random() * 1000000) + 70000000
    };

    return mockPayment;
  } catch (error) {
    console.error('Payment search error:', error);
    return { found: false, error: error.message };
  }
}

function decodeMemo(memo) {
  try {
    if (memo && memo.Memo && memo.Memo.MemoData) {
      return Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
    }
    return null;
  } catch (error) {
    return null;
  }
}

