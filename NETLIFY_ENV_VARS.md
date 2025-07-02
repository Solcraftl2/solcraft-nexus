# 🔧 Configurazione Environment Variables - Netlify

## 📍 DOVE CONFIGURARE
1. Accedi a **Netlify Dashboard**
2. Vai al tuo sito **solcraft-nexus-production**
3. Vai a **Site Settings > Environment Variables**
4. Clicca **Add a variable** per ogni variabile sotto

## 🔑 VARIABILI RICHIESTE (CRITICHE)

### Database Supabase
```
SUPABASE_URL=https://dtzlkcqddjaoubrjnzjw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[INSERIRE_CHIAVE_SERVICE_ROLE_SICURA]
SUPABASE_ANON_KEY=[INSERIRE_CHIAVE_ANON_SICURA]
```

### Sicurezza JWT
```
JWT_SECRET=[GENERARE_STRINGA_CASUALE_32_CARATTERI]
```
**Esempio generazione:** `openssl rand -base64 32`

### Cache Redis (Upstash)
```
UPSTASH_REDIS_REST_URL=[URL_REDIS_UPSTASH]
UPSTASH_REDIS_REST_TOKEN=[TOKEN_REDIS_UPSTASH]
```

## ⚙️ VARIABILI CONFIGURAZIONE

### Environment
```
NODE_ENV=production
LOG_LEVEL=info
```

### CORS Security
```
CORS_ORIGINS=https://solcraft-nexus-production.netlify.app
```

## 🚨 IMPORTANTE
- **NON** usare le chiavi hardcoded rimosse dal codice
- **GENERA** nuovo JWT_SECRET sicuro
- **VERIFICA** che tutte le chiavi siano valide
- **TESTA** la connessione dopo configurazione

## ✅ VERIFICA CONFIGURAZIONE
Dopo aver configurato le variabili:
1. Redeploy il sito su Netlify
2. Testa: `https://solcraft-nexus-production.netlify.app/.netlify/functions/test-simple`
3. Verifica che non ci siano errori di configurazione nei logs

## 🔍 TROUBLESHOOTING
- **Error: SUPABASE_URL required** → Verifica nome variabile esatto
- **JWT Error** → Genera nuovo JWT_SECRET
- **Redis Connection Failed** → Verifica credenziali Upstash

