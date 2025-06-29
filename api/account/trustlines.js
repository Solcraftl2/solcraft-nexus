import { getXRPLClient, initializeXRPL, getAccountInfo, walletFromSeed, createTrustLine } from '../config/xrpl.js';
import { TrustSet, convertStringToHex } from 'xrpl';
import { supabase, insertTransaction } from '../config/supabaseClient.js';
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
        
        // Fallback con dati mock se XRPL non disponibile
        const mockTrustLines = [
          {
            currency: 'USD',
            issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
            balance: 100.50,
            limit: 1000000,
            limitPeer: 0,
            qualityIn: 0,
            qualityOut: 0,
            noRipple: false,
            noRipplePeer: false,
            authorized: true,
            peerAuthorized: true,
            frozen: false,
            peerFrozen: false
          },
          {
            currency: 'EUR',
            issuer: 'rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w',
            balance: 250.75,
            limit: 500000,
            limitPeer: 0,
            qualityIn: 0,
            qualityOut: 0,
            noRipple: false,
            noRipplePeer: false,
            authorized: true,
            peerAuthorized: true,
            frozen: false,
            peerFrozen: false
          }
        ];

        return res.status(200).json({
          success: true,
          account: walletAddress,
          trustLines: mockTrustLines,
          totalLines: mockTrustLines.length,
          accountInfo: {
            balance: '25000000', // 25 XRP
            sequence: 1,
            ownerCount: 2,
            reserve: 6000000 // 6 XRP reserve
          },
          note: 'Dati simulati - XRPL non disponibile'
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
          error: 'Currency, issuer, limit e seed sono richiesti'
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
        await initializeXRPL().catch(() => {});
        const client = getXRPLClient();
        const wallet = walletFromSeed(walletSeed);

        let result;
        if (qualityIn === 0 && qualityOut === 0 && !noRipple) {
          result = await createTrustLine(wallet, currency, issuer, limit.toString());
          if (!result.success) throw new Error(result.error);
        } else {
          const trustSetTx = {
            TransactionType: 'TrustSet',
            Account: wallet.address,
            LimitAmount: {
              currency: currency.length === 3 ? currency : convertStringToHex(currency),
              issuer: issuer,
              value: limit.toString()
            },
            QualityIn: qualityIn,
            QualityOut: qualityOut,
            Flags: noRipple ? 0x00020000 : 0
          };

          const prepared = await client.autofill(trustSetTx);
          const signed = wallet.sign(prepared);
          const submit = await client.submitAndWait(signed.tx_blob);
          if (submit.result.meta?.TransactionResult !== 'tesSUCCESS') {
            throw new Error(submit.result.meta?.TransactionResult || 'TrustSet failed');
          }
          result = { success: true, hash: submit.result.hash, validated: submit.result.validated, ledgerIndex: submit.result.ledger_index, fee: prepared.Fee };
        }

        const createdAt = new Date().toISOString();
        try {
          await insertTransaction({
            tx_hash: result.hash,
            type: 'trust_set',
            from_address: wallet.address,
            to_address: issuer,
            amount: 0,
            currency: currency.length === 3 ? currency : 'HEX',
            user_id: decoded.userId,
            status: result.validated ? 'confirmed' : 'pending',
            blockchain_network: process.env.XRPL_NETWORK || 'testnet',
            block_height: result.ledgerIndex,
            gas_fee: parseFloat(result.fee) / 1000000,
            description: 'Create trust line',
            metadata: { issuer, limit, qualityIn, qualityOut, noRipple },
            created_at: createdAt
          });

          await supabase.from('user_activities').insert({
            user_id: decoded.userId,
            activity_type: 'trust_line_create',
            description: `Created trust line for ${currency}`,
            metadata: { txHash: result.hash, issuer },
            created_at: createdAt
          });
        } catch (dbError) {
          console.error('Supabase logging error:', dbError);
        }

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
            ledgerIndex: result.ledgerIndex,
            validated: result.validated,
            fee: result.fee
          }
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
          error: 'Currency, issuer e seed sono richiesti per rimuovere trust line'
        });
      }

      try {
        await initializeXRPL().catch(() => {});
        const client = getXRPLClient();
        const wallet = walletFromSeed(walletSeed);

        const trustSetTx = {
          TransactionType: 'TrustSet',
          Account: wallet.address,
          LimitAmount: {
            currency: currency.length === 3 ? currency : convertStringToHex(currency),
            issuer: issuer,
            value: '0'
          }
        };

        const prepared = await client.autofill(trustSetTx);
        const signed = wallet.sign(prepared);
        const submit = await client.submitAndWait(signed.tx_blob);
        if (submit.result.meta?.TransactionResult !== 'tesSUCCESS') {
          throw new Error(submit.result.meta?.TransactionResult || 'TrustSet failed');
        }

        const createdAt = new Date().toISOString();
        try {
          await insertTransaction({
            tx_hash: submit.result.hash,
            type: 'trust_remove',
            from_address: wallet.address,
            to_address: issuer,
            amount: 0,
            currency: currency.length === 3 ? currency : 'HEX',
            user_id: decoded.userId,
            status: submit.result.validated ? 'confirmed' : 'pending',
            blockchain_network: process.env.XRPL_NETWORK || 'testnet',
            block_height: submit.result.ledger_index,
            gas_fee: parseFloat(prepared.Fee) / 1000000,
            description: 'Remove trust line',
            metadata: { issuer, currency },
            created_at: createdAt
          });

          await supabase.from('user_activities').insert({
            user_id: decoded.userId,
            activity_type: 'trust_line_remove',
            description: `Removed trust line for ${currency}`,
            metadata: { txHash: submit.result.hash, issuer },
            created_at: createdAt
          });
        } catch (dbError) {
          console.error('Supabase logging error:', dbError);
        }

        return res.status(200).json({
          success: true,
          message: 'Trust line rimossa con successo!',
          removedTrustLine: {
            currency: currency,
            issuer: issuer,
            status: 'removed'
          },
          transaction: {
            hash: submit.result.hash,
            ledgerIndex: submit.result.ledger_index,
            validated: submit.result.validated,
            fee: prepared.Fee
          }
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

