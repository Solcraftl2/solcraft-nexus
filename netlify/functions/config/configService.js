import { logger } from '../utils/logger.js';

const { parse } = require('querystring');

// Helper per compatibilità Vercel -> Netlify
function createReqRes(event) {
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? (event.headers['content-type']?.includes('application/json') ? JSON.parse(event.body) : parse(event.body)) : {},
    query: event.queryStringParameters || {},
    ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'
  };
  
  const res = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: '',
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.body = JSON.stringify(data);
      return this;
    },
    
    end: function(data) {
      if (data) this.body = data;
      return this;
    },
    
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
  
  return { req, res };
}

// Servizio di configurazione sicuro per produzione
// Sostituisce il file .env.production rimosso per motivi di sicurezza

class ConfigService {
  constructor() {
    this.config = {};
    this.initialized = false;
  }

  // Inizializzazione configurazione
  initialize() {
    if (this.initialized) return this.config;

    // Configurazioni da variabili ambiente (Vercel Environment Variables)
    this.config = {
      // Database Configuration
      supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      },

      // Redis Configuration
      redis: {
        url: process.env.REDIS_URL,
        upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
        upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN
      },

      // XRPL Configuration
      xrpl: {
        mainnetUrl: process.env.XRPL_MAINNET_URL || 'wss://xrplcluster.com',
        testnetUrl: process.env.XRPL_TESTNET_URL || 'wss://s.altnet.rippletest.net:51233',
        devnetUrl: process.env.XRPL_DEVNET_URL || 'wss://s.devnet.rippletest.net:51233',
        defaultNetwork: process.env.DEFAULT_NETWORK || 'testnet'
      },

      // Security Configuration
      security: {
        jwtSecret: process.env.JWT_SECRET,
        sessionSecret: process.env.SESSION_SECRET,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        sessionTtl: parseInt(process.env.SESSION_TTL) || 86400
      },

      // API Configuration
      api: {
        baseUrl: process.env.API_BASE_URL,
        frontendUrl: process.env.FRONTEND_URL,
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*']
      },

      // Cache Configuration
      cache: {
        defaultTtl: parseInt(process.env.CACHE_TTL_DEFAULT) || 3600,
        pricesTtl: parseInt(process.env.CACHE_TTL_PRICES) || 300,
        portfolioTtl: parseInt(process.env.CACHE_TTL_PORTFOLIO) || 600,
        transactionsTtl: parseInt(process.env.CACHE_TTL_TRANSACTIONS) || 3600
      },

      // Rate Limiting Configuration
      rateLimit: {
        requestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR) || 1000,
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 100,
        tokenizationPerHour: parseInt(process.env.RATE_LIMIT_TOKENIZATION_PER_HOUR) || 10,
        tradingPerHour: parseInt(process.env.RATE_LIMIT_TRADING_PER_HOUR) || 50
      },

      // Compliance Configuration
      compliance: {
        kycRequired: process.env.KYC_REQUIRED === 'true',
        auditEnabled: process.env.AUDIT_ENABLED === 'true',
        maxTransactionAmount: parseFloat(process.env.MAX_TRANSACTION_AMOUNT) || 100000,
        restrictedCountries: process.env.RESTRICTED_COUNTRIES?.split(',') || []
      },

      // Monitoring Configuration
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        logLevel: process.env.LOG_LEVEL || 'info',
        alertWebhook: process.env.ALERT_WEBHOOK_URL,
        metricsEndpoint: process.env.METRICS_ENDPOINT
      },

      // Environment
      environment: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development'
    };

    // Validazione configurazioni critiche
    this.validateConfig();
    
    this.initialized = true;
    return this.config;
  }

  // Validazione configurazioni critiche
  validateConfig() {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validazione formato URL
    if (this.config.supabase.url && !this.config.supabase.url.startsWith('https://')) {
      throw new Error('SUPABASE_URL must be a valid HTTPS URL');
    }

    // Validazione JWT Secret (minimo 32 caratteri)
    if (this.config.security.jwtSecret && this.config.security.jwtSecret.length < 32) {
      logger.warn('⚠️ JWT_SECRET should be at least 32 characters long for security');
    }
  }

  // Getters per accesso sicuro alle configurazioni
  get supabase() {
    return this.initialize().supabase;
  }

  get redis() {
    return this.initialize().redis;
  }

  get xrpl() {
    return this.initialize().xrpl;
  }

  get security() {
    return this.initialize().security;
  }

  get api() {
    return this.initialize().api;
  }

  get cache() {
    return this.initialize().cache;
  }

  get rateLimit() {
    return this.initialize().rateLimit;
  }

  get compliance() {
    return this.initialize().compliance;
  }

  get monitoring() {
    return this.initialize().monitoring;
  }

  get environment() {
    return this.initialize().environment;
  }

  get isProduction() {
    return this.initialize().isProduction;
  }

  get isDevelopment() {
    return this.initialize().isDevelopment;
  }

  // Helper per ottenere URL XRPL basato sulla rete
  getXRPLUrl(network = null) {
    const targetNetwork = network || this.xrpl.defaultNetwork;
    
    switch (targetNetwork) {
      case 'mainnet':
        return this.xrpl.mainnetUrl;
      case 'testnet':
        return this.xrpl.testnetUrl;
      case 'devnet':
        return this.xrpl.devnetUrl;
      default:
        return this.xrpl.testnetUrl;
    }
  }

  // Helper per configurazione CORS
  getCorsConfig() {
    return {
      origin: this.api.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
    };
  }

  // Helper per configurazione rate limiting
  getRateLimitConfig(type = 'standard') {
    const configs = {
      standard: {
        limit: this.rateLimit.requestsPerHour,
        window: 3600
      },
      tokenization: {
        limit: this.rateLimit.tokenizationPerHour,
        window: 3600
      },
      trading: {
        limit: this.rateLimit.tradingPerHour,
        window: 3600
      },
      minute: {
        limit: this.rateLimit.requestsPerMinute,
        window: 60
      }
    };

    return configs[type] || configs.standard;
  }

  // Helper per logging sicuro (nasconde dati sensibili)
  getSafeConfig() {
    const safe = JSON.parse(JSON.stringify(this.initialize()));
    
    // Nascondi dati sensibili
    if (safe.supabase.anonKey) {
      safe.supabase.anonKey = safe.supabase.anonKey.substring(0, 10) + '...';
    }
    if (safe.supabase.serviceRoleKey) {
      safe.supabase.serviceRoleKey = '***';
    }
    if (safe.security.jwtSecret) {
      safe.security.jwtSecret = '***';
    }
    if (safe.security.sessionSecret) {
      safe.security.sessionSecret = '***';
    }
    if (safe.redis.upstashToken) {
      safe.redis.upstashToken = safe.redis.upstashToken.substring(0, 10) + '...';
    }

    return safe;
  }

  // Health check configurazione
  healthCheck() {
    try {
      const config = this.initialize();
      
      return {
        status: 'healthy',
        environment: config.environment,
        services: {
          supabase: !!config.supabase.url,
          redis: !!(config.redis.url || config.redis.upstashUrl),
          xrpl: !!config.xrpl.defaultNetwork
        },
        features: {
          kyc: config.compliance.kycRequired,
          audit: config.compliance.auditEnabled,
          monitoring: config.monitoring.enabled
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const configService = new ConfigService();

export default configService;

// Named exports per compatibilità
export const config = configService;
export const getConfig = () => configService.initialize();
export const isProduction = () => configService.isProduction;
export const isDevelopment = () => configService.isDevelopment;

