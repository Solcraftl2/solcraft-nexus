import { getXRPLClient, initializeXRPL, getAccountInfo, walletFromSeed, createTrustLine, removeTrustLine } from '../config/xrpl.js';
import { convertStringToHex } from 'xrpl';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
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

    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet richiesto'
      });
    }

    // GET - Recupera trust lines esistenti
    if (req.method === 'GET') {
      try {
        await initializeXRPL();
        const client = getXRPLClient();
        
        // Ottieni informazioni account
        const accountInfo = await getAccountInfo(walletAddress);
        
        // Ottieni trust lines
        const trustLines = await client.request({
          command: 'account_lines',
          account: walletAddress,
          ledger_index: 'validated'
        });

        const processedTrustLines = trustLines.result.lines.map(line => ({
          currency: line.currency,
          issuer: line.account,
          balance: parseFloat(line.balance),
          limit: parseFloat(line.limit),
          limitPeer: parseFloat(line.limit_peer || '0'),
          qualityIn: line.quality_in || 0,
          qualityOut: line.quality_out || 0,
          noRipple: line.no_ripple || false,
          noRipplePeer: line.no_ripple_peer || false,
          authorized: line.authorized || false,
          peerAuthorized: line.peer_authorized || false,
          frozen: line.freeze || false,
          peerFrozen: line.freeze_peer || false
        }));

        return res.status(200).json({
          success: true,
          account: walletAddress,
          trustLines: processedTrustLines,
          totalLines: processedTrustLines.length,
          accountInfo: {
            balance: accountInfo.Balance,
            sequence: accountInfo.Sequence,
            ownerCount: accountInfo.OwnerCount,
            reserve: (accountInfo.OwnerCount + 1) * 2000000 // Base + Owner reserve
          }
        });

      } catch (error) {
        console.error('Trust lines fetch error:', error);
        
        return res.status(500).json({
          success: false,
          error: "Errore durante il recupero delle trust lines",
          message: error.message
        });
      }
    }

    // POST - Crea nuova trust line
    if (req.method === 'POST') {
      const {
        currency,
        issuer,
        limit,
        walletSeed,
        qualityIn = 0,
        qualityOut = 0,
        noRipple = false
      } = req.body;

      if (!currency || !issuer || !limit || !walletSeed) {
        return res.status(400).json({
          success: false,
          error: 'Currency, issuer, limit e walletSeed sono richiesti'
        });
      }

      // Validazione currency code
      if (currency.length !== 3 && currency.length !== 40) {
        return res.status(400).json({
          success: false,
          error: 'Currency code deve essere 3 caratteri (es. USD) o 40 caratteri hex'
        });
      }

      try {
        await initializeXRPL();
        const client = getXRPLClient();
        const wallet = walletFromSeed(walletSeed);

        const cur = currency.length === 3 ? currency : convertStringToHex(currency);
        const result = await createTrustLine(wallet, cur, issuer, limit.toString());

        if (result.success) {
          return res.status(201).json({
            success: true,
            message: 'Trust line creata con successo!',
            trustLine: {
              currency: currency,
              issuer: issuer,
              limit: parseFloat(limit),
              qualityIn: qualityIn,
              qualityOut: qualityOut,
              noRipple: noRipple,
              status: 'created'
            },
            transaction: {
              hash: result.hash,
              validated: result.validated
            }
          });
        }

        return res.status(400).json({
          success: false,
          error: 'Trust line creation failed',
          message: result.error
        });

      } catch (error) {
        console.error('Trust line creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la creazione della trust line',
          message: error.message
        });
      }
    }

    // DELETE - Rimuovi trust line (imposta limit a 0)
    if (req.method === 'DELETE') {
      const { currency, issuer, walletSeed } = req.body;

      if (!currency || !issuer || !walletSeed) {
        return res.status(400).json({
          success: false,
          error: 'Currency, issuer e walletSeed sono richiesti per rimuovere trust line'
        });
      }

      try {
        await initializeXRPL();
        const client = getXRPLClient();
        const wallet = walletFromSeed(walletSeed);

        const cur = currency.length === 3 ? currency : convertStringToHex(currency);
        const result = await removeTrustLine(wallet, cur, issuer);

        if (result.success) {
          return res.status(200).json({
            success: true,
            message: 'Trust line rimossa con successo!',
            removedTrustLine: {
              currency: currency,
              issuer: issuer,
              status: 'removed'
            },
            transaction: {
              hash: result.hash,
              validated: result.validated
            }
          });
        }

        return res.status(400).json({
          success: false,
          error: 'Trust line removal failed',
          message: result.error
        });

      } catch (error) {
        console.error('Trust line removal error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la rimozione della trust line',
          message: error.message
        });
      }
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Trust lines API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

