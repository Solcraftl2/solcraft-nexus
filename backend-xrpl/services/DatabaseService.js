const { createClient } = require('@supabase/supabase-js');

/**
 * DatabaseService - Servizio per gestione database Supabase
 * Gestisce persistenza di wallet, transazioni, token e utenti
 */
class DatabaseService {
  constructor() {
    this.supabase = null;
    this.isConnectedFlag = false;
  }

  /**
   * Inizializza connessione Supabase
   */
  async initialize() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        console.log('⚠️  Supabase non configurato - modalità sviluppo senza database');
        this.isConnectedFlag = false;
        return { success: false, message: 'Database non configurato' };
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection
      const { data, error } = await this.supabase
        .from('wallets')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
        throw error;
      }

      this.isConnectedFlag = true;
      console.log('✅ Database Supabase connesso');

      // Create tables if they don't exist
      await this.createTables();

      return { success: true };
    } catch (error) {
      console.error('❌ Errore connessione database:', error);
      this.isConnectedFlag = false;
      console.log('⚠️  Continuando senza database - funzionalità limitate');
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea tabelle se non esistono
   */
  async createTables() {
    try {
      // Note: In production, tables should be created via Supabase dashboard or migrations
      // This is just for development/testing
      console.log('📋 Verificando struttura database...');
      
      // Tables will be created via SQL in Supabase dashboard
      // Here we just verify they exist
      const tables = ['wallets', 'transactions', 'tokens', 'trust_lines', 'users'];
      
      for (const table of tables) {
        const { error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error && error.code === 'PGRST116') {
          console.log(`⚠️  Tabella '${table}' non trovata - crearla nel dashboard Supabase`);
        }
      }
      
    } catch (error) {
      console.error('❌ Errore verifica tabelle:', error);
    }
  }

  /**
   * Verifica connessione
   */
  isConnected() {
    return this.isConnectedFlag && this.supabase !== null;
  }

  /**
   * Chiudi connessione
   */
  async close() {
    this.isConnectedFlag = false;
    this.supabase = null;
    console.log('✅ Database disconnesso');
  }

  /**
   * WALLET OPERATIONS
   */
  async saveWallet(walletData) {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .insert([{
          address: walletData.address,
          balance: walletData.balance,
          network: walletData.network,
          created_at: walletData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      console.log('✅ Wallet salvato:', walletData.address);
      return data[0];
    } catch (error) {
      console.error('❌ Errore salvataggio wallet:', error);
      throw error;
    }
  }

  async getWallet(address) {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .select('*')
        .eq('address', address)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('❌ Errore recupero wallet:', error);
      return null;
    }
  }

  async updateAccount(accountInfo) {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .upsert([{
          address: accountInfo.address,
          balance: accountInfo.balance,
          sequence: accountInfo.sequence,
          owner_count: accountInfo.ownerCount,
          previous_txn_id: accountInfo.previousTxnID,
          flags: accountInfo.flags,
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('❌ Errore aggiornamento account:', error);
      throw error;
    }
  }

  /**
   * TRANSACTION OPERATIONS
   */
  async saveTransaction(transactionData) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert([{
          hash: transactionData.hash,
          type: transactionData.type,
          account: transactionData.account,
          destination: transactionData.destination,
          amount: transactionData.amount,
          fee: transactionData.fee,
          sequence: transactionData.sequence,
          ledger_index: transactionData.ledger_index,
          meta: transactionData.meta,
          network: transactionData.network,
          timestamp: transactionData.timestamp || new Date().toISOString()
        }])
        .select();

      if (error && error.code !== '23505') { // 23505 = unique violation (duplicate)
        throw error;
      }
      
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Errore salvataggio transazione:', error);
      throw error;
    }
  }

  async getTransactions(address, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .or(`account.eq.${address},destination.eq.${address}`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('❌ Errore recupero transazioni:', error);
      return [];
    }
  }

  async getTransaction(hash) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('hash', hash)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('❌ Errore recupero transazione:', error);
      return null;
    }
  }

  /**
   * TOKEN OPERATIONS
   */
  async saveToken(tokenData) {
    try {
      const { data, error } = await this.supabase
        .from('tokens')
        .insert([{
          token_code: tokenData.tokenCode,
          issuer: tokenData.issuer,
          holder: tokenData.holder,
          amount: tokenData.amount,
          hash: tokenData.hash,
          network: tokenData.network || 'testnet',
          timestamp: tokenData.timestamp || new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      console.log('✅ Token salvato:', tokenData.tokenCode);
      return data[0];
    } catch (error) {
      console.error('❌ Errore salvataggio token:', error);
      throw error;
    }
  }

  async getTokens(address) {
    try {
      const { data, error } = await this.supabase
        .from('tokens')
        .select('*')
        .or(`issuer.eq.${address},holder.eq.${address}`)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('❌ Errore recupero token:', error);
      return [];
    }
  }

  async getToken(tokenCode, issuer) {
    try {
      const { data, error } = await this.supabase
        .from('tokens')
        .select('*')
        .eq('token_code', tokenCode)
        .eq('issuer', issuer)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('❌ Errore recupero token:', error);
      return null;
    }
  }

  /**
   * TRUST LINE OPERATIONS
   */
  async saveTrustLine(trustLineData) {
    try {
      const { data, error } = await this.supabase
        .from('trust_lines')
        .insert([{
          account: trustLineData.account,
          token_code: trustLineData.tokenCode,
          issuer: trustLineData.issuerAddress,
          limit_amount: trustLineData.limit,
          hash: trustLineData.hash,
          network: trustLineData.network || 'testnet',
          timestamp: trustLineData.timestamp || new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      console.log('✅ Trust Line salvata:', trustLineData.tokenCode);
      return data[0];
    } catch (error) {
      console.error('❌ Errore salvataggio trust line:', error);
      throw error;
    }
  }

  async getTrustLines(address) {
    try {
      const { data, error } = await this.supabase
        .from('trust_lines')
        .select('*')
        .eq('account', address)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('❌ Errore recupero trust lines:', error);
      return [];
    }
  }

  /**
   * USER OPERATIONS
   */
  async saveUser(userData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert([{
          wallet_address: userData.walletAddress,
          email: userData.email,
          username: userData.username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      console.log('✅ Utente salvato:', userData.walletAddress);
      return data[0];
    } catch (error) {
      console.error('❌ Errore salvataggio utente:', error);
      throw error;
    }
  }

  async getUser(walletAddress) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('❌ Errore recupero utente:', error);
      return null;
    }
  }

  async updateUser(walletAddress, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress)
        .select();

      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('❌ Errore aggiornamento utente:', error);
      throw error;
    }
  }

  /**
   * ANALYTICS OPERATIONS
   */
  async getWalletStats(address) {
    try {
      const [transactions, tokens, trustLines] = await Promise.all([
        this.getTransactions(address, 100),
        this.getTokens(address),
        this.getTrustLines(address)
      ]);

      const stats = {
        totalTransactions: transactions.length,
        totalTokens: tokens.length,
        totalTrustLines: trustLines.length,
        lastActivity: transactions.length > 0 ? transactions[0].timestamp : null
      };

      return stats;
    } catch (error) {
      console.error('❌ Errore recupero statistiche:', error);
      return {
        totalTransactions: 0,
        totalTokens: 0,
        totalTrustLines: 0,
        lastActivity: null
      };
    }
  }

  async getNetworkStats() {
    try {
      const { data: transactionCount } = await this.supabase
        .from('transactions')
        .select('count');

      const { data: walletCount } = await this.supabase
        .from('wallets')
        .select('count');

      const { data: tokenCount } = await this.supabase
        .from('tokens')
        .select('count');

      return {
        totalTransactions: transactionCount?.[0]?.count || 0,
        totalWallets: walletCount?.[0]?.count || 0,
        totalTokens: tokenCount?.[0]?.count || 0
      };
    } catch (error) {
      console.error('❌ Errore recupero statistiche network:', error);
      return {
        totalTransactions: 0,
        totalWallets: 0,
        totalTokens: 0
      };
    }
  }
}

// Istanza singleton
const databaseService = new DatabaseService();

module.exports = databaseService;

