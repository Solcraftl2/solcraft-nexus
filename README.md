# 🚀 SolCraft Nexus - Piattaforma di Tokenizzazione Asset

Una piattaforma completa per la tokenizzazione di asset reali, gestione portfolio crypto e sistema di pool per distribuzione guadagni.

## ✨ Funzionalità

### 🔐 Autenticazione
- **OAuth Integration** - Google, GitHub, Apple Sign-In
- **Web3 Wallet Connection** - MetaMask, WalletConnect
- **JWT Authentication** - Sicurezza enterprise-grade

### 🏗️ Tokenizzazione Asset
- **Wizard Completo** - 5 step per tokenizzazione
- **Upload Documenti** - Sistema file sicuro
- **Smart Contracts** - Integrazione blockchain
- **Gestione Portfolio** - Dashboard completa

### 🏊‍♂️ Sistema Pool
- **Liquidity Pools** - AMM integrato
- **Staking Pools** - Rewards automatici
- **Governance** - Sistema voting
- **Yield Farming** - Incentivi LP

### 💰 Marketplace
- **Trading Asset** - Compra/vendi token
- **Ricerca Avanzata** - Filtri e categorie
- **Analytics** - Metriche e performance
- **Portfolio Management** - Gestione completa

## 🛠️ Tecnologie

### Frontend
- **React 18** + **Vite** - Performance ottimali
- **TailwindCSS** + **shadcn/ui** - Design system
- **Lucide Icons** - Iconografia moderna
- **React Router** - Navigazione SPA

### Backend
- **Vercel Serverless** - API scalabili
- **Python Flask** - Framework robusto
- **SQLite** - Database embedded
- **JWT** - Autenticazione sicura

### Blockchain
- **XRP Ledger** - Transazioni native
- **Web3.js** - Integrazione wallet
- **MetaMask** - Provider principale

## 🚀 Deploy

### Vercel (Raccomandato)
```bash
# Clone repository
git clone https://github.com/your-username/solcraft-nexus.git
cd solcraft-nexus

# Install dependencies
npm install

# Deploy to Vercel
vercel --prod
```

### Sviluppo Locale
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Struttura Progetto

```
solcraft-nexus/
├── api/                    # Vercel Serverless Functions
│   ├── auth.py            # Autenticazione OAuth
│   ├── assets.py          # Gestione asset
│   └── tokenization.py    # Tokenizzazione
├── src/
│   ├── components/        # Componenti React
│   ├── hooks/            # Custom hooks
│   ├── providers/        # Context providers
│   ├── services/         # API services
│   └── config/           # Configurazioni
├── public/               # Asset statici
└── vercel.json          # Configurazione Vercel
```

## 🔧 Configurazione

### Variabili Ambiente
```env
VITE_API_URL=https://your-app.vercel.app
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

### OAuth Setup
1. **Google OAuth** - Console Google Cloud
2. **GitHub OAuth** - GitHub Developer Settings
3. **Apple Sign-In** - Apple Developer Portal

## 📊 API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/oauth` - OAuth callback
- `GET /api/auth/profile` - Profilo utente

### Asset Management
- `GET /api/assets` - Lista asset
- `POST /api/assets` - Crea asset
- `PUT /api/assets/:id` - Aggiorna asset
- `DELETE /api/assets/:id` - Elimina asset

### Pool Management
- `GET /api/pools` - Lista pool
- `POST /api/pools/stake` - Stake token
- `POST /api/pools/unstake` - Unstake token
- `GET /api/pools/rewards` - Rewards utente

## 🎯 Roadmap

- [x] **v1.0** - Piattaforma base
- [x] **v1.1** - OAuth integration
- [x] **v1.2** - Web3 wallet connection
- [x] **v1.3** - Tokenizzazione asset
- [x] **v1.4** - Sistema pool
- [ ] **v2.0** - Mobile app
- [ ] **v2.1** - Multi-chain support
- [ ] **v2.2** - Advanced analytics

## 🤝 Contribuire

1. Fork il repository
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi `LICENSE` per dettagli.

## 🆘 Supporto

- **Documentation**: [docs.solcraft-nexus.com](https://docs.solcraft-nexus.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/solcraft-nexus/issues)
- **Discord**: [Community Discord](https://discord.gg/solcraft-nexus)

---

**SolCraft Nexus** - Trasformiamo gli asset reali in opportunità digitali 🚀

