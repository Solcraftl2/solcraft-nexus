const Redis = require('ioredis');
const EventEmitter = require('events');

/**
 * RedisService - Servizio completo per caching, sessioni e real-time data
 * Ottimizza le performance della piattaforma XRPL
 */
class RedisService extends EventEmitter {
  constructor() {
    super();
    this.redis = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnectedFlag = false;
    
    // Configurazione Redis - supporta sia URL che configurazione separata
    console.log('🔍 Debug REDIS_URL:', process.env.REDIS_URL);
    if (process.env.REDIS_URL) {
      // Usa REDIS_URL per Upstash o altri servizi cloud
      this.config = process.env.REDIS_URL;
      console.log('🔗 Usando REDIS_URL:', this.config);
    } else {
      // Configurazione tradizionale per Redis locale
      this.config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };
      console.log('🔗 Usando configurazione locale:', this.config);
    }
    
    // Database mappings (solo per Redis tradizionale)
    this.databases = {
      CACHE: 0,      // Cache dati XRPL
      SESSIONS: 1,   // Sessioni utente
      RATE_LIMIT: 2, // Rate limiting
      QUEUE: 3,      // Queue eventi
      SEARCH: 4      // Search cache
    };
  }

  /**
   * Inizializza connessione Redis
   */
  async connect() {
    try {
      // Configurazione per connessione
      let connectionConfig;
      
      if (typeof this.config === 'string') {
        // REDIS_URL (Upstash o altri servizi cloud)
        connectionConfig = this.config;
        console.log('🔗 Connessione Redis via URL:', this.config.substring(0, 30) + '...');
      } else {
        // Configurazione tradizionale
        connectionConfig = {
          ...this.config,
          db: this.databases.CACHE
        };
        console.log('🔗 Connessione Redis locale:', this.config.host + ':' + this.config.port);
      }

      // Main Redis connection
      this.redis = new Redis(connectionConfig);

      // Per Upstash, usiamo la stessa connessione per subscriber e publisher
      if (typeof this.config === 'string') {
        this.subscriber = new Redis(this.config);
        this.publisher = new Redis(this.config);
      } else {
        // Subscriber per Pub/Sub (Redis tradizionale)
        this.subscriber = new Redis({
          ...this.config,
          db: this.databases.QUEUE
        });

        // Publisher per Pub/Sub (Redis tradizionale)
        this.publisher = new Redis({
          ...this.config,
          db: this.databases.QUEUE
        });
      }

      // Setup event listeners
      this.setupEventListeners();

      // Test connection
      await this.redis.ping();
      this.isConnectedFlag = true;

      const connectionInfo = typeof this.config === 'string' 
        ? { url: this.config.substring(0, 30) + '...', type: 'cloud' }
        : { host: this.config.host, port: this.config.port, databases: Object.keys(this.databases).length };

      console.log('✅ Redis connesso:', connectionInfo);

      this.emit('connected');
      return true;
    } catch (error) {
      console.error('❌ Errore connessione Redis:', error);
      this.isConnectedFlag = false;
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.redis.on('connect', () => {
      console.log('🔌 Redis connected');
      this.isConnectedFlag = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis error:', error);
      this.isConnectedFlag = false;
      this.emit('error', error);
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis disconnected');
      this.isConnectedFlag = false;
      this.emit('disconnected');
    });
  }

  /**
   * Verifica se Redis è connesso
   */
  isConnected() {
    return this.isConnectedFlag && this.redis && this.redis.status === 'ready';
  }

  // ==========================================
  // CACHE METHODS
  // ==========================================

  /**
   * Cache wallet balance
   */
  async cacheWalletBalance(address, balance, ttl = 30) {
    try {
      const key = `wallet:balance:${address}`;
      await this.redis.setex(key, ttl, JSON.stringify(balance));
      console.log(`💾 Cached wallet balance: ${address}`);
      return true;
    } catch (error) {
      console.error('❌ Error caching wallet balance:', error);
      return false;
    }
  }

  /**
   * Get cached wallet balance
   */
  async getCachedWalletBalance(address) {
    try {
      const key = `wallet:balance:${address}`;
      const cached = await this.redis.get(key);
      if (cached) {
        console.log(`⚡ Cache hit: wallet balance ${address}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached wallet balance:', error);
      return null;
    }
  }

  /**
   * Cache token info
   */
  async cacheTokenInfo(tokenId, tokenData, ttl = 300) {
    try {
      const key = `token:info:${tokenId}`;
      await this.redis.setex(key, ttl, JSON.stringify(tokenData));
      console.log(`💾 Cached token info: ${tokenId}`);
      return true;
    } catch (error) {
      console.error('❌ Error caching token info:', error);
      return false;
    }
  }

  /**
   * Get cached token info
   */
  async getCachedTokenInfo(tokenId) {
    try {
      const key = `token:info:${tokenId}`;
      const cached = await this.redis.get(key);
      if (cached) {
        console.log(`⚡ Cache hit: token info ${tokenId}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached token info:', error);
      return null;
    }
  }

  /**
   * Cache ledger data
   */
  async cacheLedgerData(ledgerIndex, ledgerData, ttl = 10) {
    try {
      const key = `ledger:${ledgerIndex}`;
      await this.redis.setex(key, ttl, JSON.stringify(ledgerData));
      console.log(`💾 Cached ledger: ${ledgerIndex}`);
      return true;
    } catch (error) {
      console.error('❌ Error caching ledger data:', error);
      return false;
    }
  }

  /**
   * Get cached ledger data
   */
  async getCachedLedgerData(ledgerIndex) {
    try {
      const key = `ledger:${ledgerIndex}`;
      const cached = await this.redis.get(key);
      if (cached) {
        console.log(`⚡ Cache hit: ledger ${ledgerIndex}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached ledger data:', error);
      return null;
    }
  }

  // ==========================================
  // SESSION METHODS
  // ==========================================

  /**
   * Store user session
   */
  async storeSession(userId, sessionData, ttl = 3600) {
    try {
      const sessionRedis = new Redis({ ...this.config, db: this.databases.SESSIONS });
      const key = `session:${userId}`;
      await sessionRedis.setex(key, ttl, JSON.stringify(sessionData));
      console.log(`👤 Session stored: ${userId}`);
      await sessionRedis.quit();
      return true;
    } catch (error) {
      console.error('❌ Error storing session:', error);
      return false;
    }
  }

  /**
   * Get user session
   */
  async getSession(userId) {
    try {
      const sessionRedis = new Redis({ ...this.config, db: this.databases.SESSIONS });
      const key = `session:${userId}`;
      const session = await sessionRedis.get(key);
      await sessionRedis.quit();
      
      if (session) {
        console.log(`👤 Session found: ${userId}`);
        return JSON.parse(session);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
  }

  /**
   * Delete user session
   */
  async deleteSession(userId) {
    try {
      const sessionRedis = new Redis({ ...this.config, db: this.databases.SESSIONS });
      const key = `session:${userId}`;
      await sessionRedis.del(key);
      console.log(`👤 Session deleted: ${userId}`);
      await sessionRedis.quit();
      return true;
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      return false;
    }
  }

  /**
   * Track active wallet
   */
  async trackActiveWallet(walletAddress) {
    try {
      const sessionRedis = new Redis({ ...this.config, db: this.databases.SESSIONS });
      await sessionRedis.sadd('active_wallets', walletAddress);
      console.log(`🔗 Active wallet tracked: ${walletAddress}`);
      await sessionRedis.quit();
      return true;
    } catch (error) {
      console.error('❌ Error tracking active wallet:', error);
      return false;
    }
  }

  /**
   * Get active wallets
   */
  async getActiveWallets() {
    try {
      const sessionRedis = new Redis({ ...this.config, db: this.databases.SESSIONS });
      const wallets = await sessionRedis.smembers('active_wallets');
      await sessionRedis.quit();
      return wallets;
    } catch (error) {
      console.error('❌ Error getting active wallets:', error);
      return [];
    }
  }

  // ==========================================
  // RATE LIMITING METHODS
  // ==========================================

  /**
   * Check rate limit
   */
  async checkRateLimit(identifier, limit = 100, window = 60) {
    try {
      const rateLimitRedis = new Redis({ ...this.config, db: this.databases.RATE_LIMIT });
      const key = `rate_limit:${identifier}`;
      
      const current = await rateLimitRedis.incr(key);
      if (current === 1) {
        await rateLimitRedis.expire(key, window);
      }
      
      await rateLimitRedis.quit();
      
      if (current > limit) {
        console.log(`🚫 Rate limit exceeded: ${identifier} (${current}/${limit})`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking rate limit:', error);
      return true; // Allow on error
    }
  }

  // ==========================================
  // QUEUE METHODS
  // ==========================================

  /**
   * Queue event for user
   */
  async queueEvent(userId, event) {
    try {
      const queueRedis = new Redis({ ...this.config, db: this.databases.QUEUE });
      const key = `events:${userId}`;
      await queueRedis.lpush(key, JSON.stringify({
        ...event,
        timestamp: new Date().toISOString()
      }));
      console.log(`📬 Event queued for user: ${userId}`);
      await queueRedis.quit();
      return true;
    } catch (error) {
      console.error('❌ Error queuing event:', error);
      return false;
    }
  }

  /**
   * Get queued events for user
   */
  async getQueuedEvents(userId, limit = 50) {
    try {
      const queueRedis = new Redis({ ...this.config, db: this.databases.QUEUE });
      const key = `events:${userId}`;
      const events = await queueRedis.lrange(key, 0, limit - 1);
      await queueRedis.quit();
      
      return events.map(event => JSON.parse(event));
    } catch (error) {
      console.error('❌ Error getting queued events:', error);
      return [];
    }
  }

  /**
   * Publish real-time update
   */
  async publishUpdate(channel, data) {
    try {
      await this.publisher.publish(channel, JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }));
      console.log(`📡 Published to channel: ${channel}`);
      return true;
    } catch (error) {
      console.error('❌ Error publishing update:', error);
      return false;
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribeToChannel(channel, callback) {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const data = JSON.parse(message);
            callback(data);
          } catch (error) {
            console.error('❌ Error parsing subscribed message:', error);
          }
        }
      });
      console.log(`📡 Subscribed to channel: ${channel}`);
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to channel:', error);
      return false;
    }
  }

  // ==========================================
  // SEARCH CACHE METHODS
  // ==========================================

  /**
   * Cache search results
   */
  async cacheSearchResults(query, results, ttl = 300) {
    try {
      const searchRedis = new Redis({ ...this.config, db: this.databases.SEARCH });
      const key = `search:${Buffer.from(query).toString('base64')}`;
      await searchRedis.setex(key, ttl, JSON.stringify(results));
      console.log(`🔍 Cached search results: ${query}`);
      await searchRedis.quit();
      return true;
    } catch (error) {
      console.error('❌ Error caching search results:', error);
      return false;
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(query) {
    try {
      const searchRedis = new Redis({ ...this.config, db: this.databases.SEARCH });
      const key = `search:${Buffer.from(query).toString('base64')}`;
      const cached = await searchRedis.get(key);
      await searchRedis.quit();
      
      if (cached) {
        console.log(`⚡ Cache hit: search ${query}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting cached search results:', error);
      return null;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Clear all cache
   */
  async clearCache() {
    try {
      await this.redis.flushdb();
      console.log('🧹 Cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache stats
   */
  async getCacheStats() {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: this.isConnected(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Disconnect Redis
   */
  async disconnect() {
    try {
      if (this.redis) await this.redis.quit();
      if (this.subscriber) await this.subscriber.quit();
      if (this.publisher) await this.publisher.quit();
      
      this.isConnectedFlag = false;
      console.log('👋 Redis disconnected');
      return true;
    } catch (error) {
      console.error('❌ Error disconnecting Redis:', error);
      return false;
    }
  }
}

// Export class instead of singleton instance
module.exports = RedisService;

