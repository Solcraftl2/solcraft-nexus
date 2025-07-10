# SolCraft Nexus XRPL Backend

Backend completo per la piattaforma SolCraft Nexus con integrazione XRPL reale per tokenizzazione di asset e funzionalità DeFi.

## 🚀 Caratteristiche

### ✅ Integrazione XRPL Completa
- **Connessione Real-time** a XRPL Testnet/Mainnet
- **Gestione Wallet** completa (generazione, import, funding)
- **Transazioni XRP** native con fee ottimizzate
- **Token Personalizzati** su XRPL con Trust Lines
- **Monitoraggio Live** di ledger e transazioni

### ✅ API RESTful Completa
- **Autenticazione JWT** con wallet signatures
- **CRUD Operations** per wallet, token, transazioni
- **WebSocket Real-time** per aggiornamenti live
- **Rate Limiting** e sicurezza enterprise
- **Documentazione API** completa

### ✅ Database Supabase
- **Persistenza Dati** completa
- **Backup Automatico** delle transazioni
- **Analytics** e statistiche
- **Scalabilità** enterprise

### ✅ Sicurezza Enterprise
- **Helmet.js** per security headers
- **CORS** configurabile
- **JWT Tokens** con scadenza
- **Validazione Input** completa
- **Error Handling** robusto

## 📋 Prerequisiti

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Account Supabase** (gratuito)
- **XRPL Testnet/Mainnet** access

## 🛠️ Installazione

### 1. Clone e Setup
```bash
cd solcraft-nexus/backend-xrpl
npm install
npm run setup
```

### 2. Configurazione Environment
Modifica il file `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# XRPL Configuration
XRPL_NETWORK=testnet

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Setup Database Supabase

Crea le seguenti tabelle nel tuo progetto Supabase:

```sql
-- Tabella Wallets
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  address VARCHAR(34) UNIQUE NOT NULL,
  balance DECIMAL(20,6) DEFAULT 0,
  sequence INTEGER DEFAULT 0,
  owner_count INTEGER DEFAULT 0,
  previous_txn_id VARCHAR(64),
  flags INTEGER DEFAULT 0,
  network VARCHAR(20) DEFAULT 'testnet',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella Transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  hash VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  account VARCHAR(34) NOT NULL,
  destination VARCHAR(34),
  amount TEXT,
  fee VARCHAR(20),
  sequence INTEGER,
  ledger_index INTEGER,
  meta JSONB,
  network VARCHAR(20) DEFAULT 'testnet',
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tabella Tokens
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  token_code VARCHAR(20) NOT NULL,
  issuer VARCHAR(34) NOT NULL,
  holder VARCHAR(34) NOT NULL,
  amount DECIMAL(20,6) NOT NULL,
  hash VARCHAR(64) NOT NULL,
  network VARCHAR(20) DEFAULT 'testnet',
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  UNIQUE(token_code, issuer, holder)
);

-- Tabella Trust Lines
CREATE TABLE trust_lines (
  id SERIAL PRIMARY KEY,
  account VARCHAR(34) NOT NULL,
  token_code VARCHAR(20) NOT NULL,
  issuer VARCHAR(34) NOT NULL,
  limit_amount VARCHAR(50) NOT NULL,
  hash VARCHAR(64) NOT NULL,
  network VARCHAR(20) DEFAULT 'testnet',
  timestamp TIMESTAMP DEFAULT NOW(),
  UNIQUE(account, token_code, issuer)
);

-- Tabella Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(34) UNIQUE NOT NULL,
  email VARCHAR(255),
  username VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_transactions_account ON transactions(account);
CREATE INDEX idx_transactions_destination ON transactions(destination);
CREATE INDEX idx_transactions_hash ON transactions(hash);
CREATE INDEX idx_tokens_issuer ON tokens(issuer);
CREATE INDEX idx_tokens_holder ON tokens(holder);
CREATE INDEX idx_trust_lines_account ON trust_lines(account);
CREATE INDEX idx_wallets_address ON wallets(address);
```

## 🚀 Avvio

### Sviluppo
```bash
npm run dev
```

### Produzione
```bash
npm start
```

Il server sarà disponibile su `http://localhost:3001`

## 📡 API Endpoints

### 🔐 Autenticazione
- `POST /api/auth/wallet-login` - Login con wallet
- `POST /api/auth/register` - Registrazione utente
- `GET /api/auth/me` - Info utente corrente
- `PUT /api/auth/profile` - Aggiorna profilo

### 💰 XRPL Core
- `GET /api/xrpl/status` - Stato connessione XRPL
- `POST /api/xrpl/wallet/generate` - Genera nuovo wallet
- `POST /api/xrpl/wallet/import` - Importa wallet da seed
- `POST /api/xrpl/wallet/fund` - Finanzia wallet testnet
- `GET /api/xrpl/account/:address` - Info account
- `GET /api/xrpl/balance/:address` - Bilancio account
- `POST /api/xrpl/payment` - Invia pagamento XRP

### 🪙 Token Management
- `POST /api/tokens/create` - Crea token personalizzato
- `GET /api/tokens/:address` - Token di un address
- `POST /api/tokens/transfer` - Trasferisci token
- `POST /api/tokens/trustline` - Crea Trust Line
- `GET /api/tokens/marketplace` - Marketplace token

### 💳 Wallet Management
- `GET /api/wallet/:address/info` - Info complete wallet
- `GET /api/wallet/:address/balance` - Bilancio dettagliato
- `GET /api/wallet/:address/transactions` - Transazioni wallet
- `POST /api/wallet/:address/subscribe` - Sottoscrivi aggiornamenti

### 📊 Transactions
- `GET /api/transactions/:hash` - Dettagli transazione
- `GET /api/transactions/account/:address` - Transazioni account
- `POST /api/transactions/send` - Invia transazione
- `POST /api/transactions/estimate-fee` - Stima fee

## 🔌 WebSocket Events

### Client → Server
```javascript
// Sottoscrivi aggiornamenti wallet
{
  "type": "subscribe_wallet",
  "address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
}

// Sottoscrivi aggiornamenti ledger
{
  "type": "subscribe_ledger"
}

// Ping
{
  "type": "ping"
}
```

### Server → Client
```javascript
// Aggiornamento ledger
{
  "type": "ledger_update",
  "data": {
    "ledger_index": 12345,
    "txn_count": 42,
    "close_time": 1234567890
  }
}

// Nuova transazione
{
  "type": "transaction_update",
  "data": { /* transaction data */ }
}

// Pong
{
  "type": "pong"
}
```

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:3001/health
```

### Test Wallet Generation
```bash
curl -X POST http://localhost:3001/api/xrpl/wallet/generate
```

### Test WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe_ledger' }));
};
```

## 🔧 Configurazione Avanzata

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minuti
RATE_LIMIT_MAX_REQUESTS=100  # Max 100 richieste per finestra
```

### XRPL Network
```env
XRPL_NETWORK=testnet  # o mainnet per produzione
```

### Logging
```env
LOG_LEVEL=info  # error, warn, info, debug
```

## 🚀 Deploy Produzione

### 1. Environment Produzione
```env
NODE_ENV=production
XRPL_NETWORK=mainnet
FRONTEND_URL=https://your-domain.com
```

### 2. Deploy su Vercel/Railway/Heroku
Il backend è pronto per deploy su qualsiasi piattaforma Node.js.

### 3. Database Produzione
Configura Supabase in modalità produzione con backup automatici.

## 📈 Monitoraggio

### Health Check
- `GET /health` - Stato server, XRPL e database

### Logs
- Logs strutturati con Morgan
- Error tracking completo
- Performance monitoring

### Metriche
- Transazioni processate
- Wallet attivi
- Token creati
- Uptime XRPL

## 🔒 Sicurezza

### Best Practices Implementate
- ✅ **Helmet.js** per security headers
- ✅ **CORS** configurabile per domini
- ✅ **Rate Limiting** per prevenire abuse
- ✅ **Input Validation** su tutti gli endpoint
- ✅ **JWT Tokens** con scadenza
- ✅ **Error Handling** senza leak di informazioni
- ✅ **Environment Variables** per secrets

### Raccomandazioni Produzione
- Usa HTTPS sempre
- Configura firewall appropriato
- Monitora logs per attività sospette
- Backup regolari del database
- Aggiorna dipendenze regolarmente

## 🤝 Contribuire

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

## 📄 Licenza

MIT License - vedi file [LICENSE](LICENSE) per dettagli.

## 🆘 Supporto

- **Issues**: [GitHub Issues](https://github.com/Solcraftl2/solcraft-nexus/issues)
- **Documentazione**: [Wiki](https://github.com/Solcraftl2/solcraft-nexus/wiki)
- **Email**: support@solcraft.com

---

**SolCraft Nexus XRPL Backend** - Tokenizzazione professionale su XRPL 🚀

