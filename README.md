# 🚀 SolCraft Nexus - Real World Asset Tokenization Platform

## 🌟 Overview

SolCraft Nexus è una piattaforma avanzata per la tokenizzazione di Real World Assets (RWA) costruita su XRPL (XRP Ledger). La piattaforma permette agli utenti di tokenizzare asset fisici e digitali in modo sicuro e trasparente.

## 🏗️ Architettura

### **Frontend**
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4.1
- **UI Components:** Radix UI + Shadcn/ui
- **State Management:** TanStack Query
- **Routing:** React Router DOM 7

### **Backend & API**
- **Platform:** Netlify Functions (Serverless)
- **Runtime:** Node.js 20
- **Database:** Supabase (PostgreSQL)
- **Cache:** Redis (Upstash)
- **Authentication:** Web3Auth + Wallet Connect

### **Blockchain**
- **Network:** XRPL (XRP Ledger)
- **Libraries:** xrpl 4.3, ripple-lib
- **Wallets:** XUMM, Crossmark, Web3Auth

## 🚀 Deployment

### **Production Environment**
- **Platform:** Netlify
- **URL:** https://solcraft-nexus-production.netlify.app
- **API Endpoint:** `/.netlify/functions/`
- **CDN:** Global edge network

### **Environment Variables**
```bash
# Redis Configuration
UPSTASH_REDIS_REST_URL=https://trusted-grackle-16855.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Supabase Configuration  
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# XRPL Configuration
XRPL_NETWORK=mainnet
XRPL_SERVER=wss://xrplcluster.com
```

## 🛠️ Development

### **Prerequisites**
- Node.js 20+
- npm 10+
- Git

### **Installation**
```bash
# Clone repository
git clone https://github.com/Solcraftl2/solcraft-nexus.git
cd solcraft-nexus

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Build**
```bash
# Production build
npm run build

# Preview build
npm run preview
```

### **Local Testing**
```bash
# Test Netlify Functions locally
npx netlify dev

# Run unit tests with Vitest
npm test
```

## 📁 Project Structure

```
solcraft-nexus/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilities
│   └── public/             # Static assets
├── netlify/                 # Netlify Functions
│   └── functions/          # Serverless API endpoints
│       ├── auth/           # Authentication APIs
│       ├── tokenization/   # Tokenization APIs
│       ├── health/         # Health check APIs
│       └── assets/         # Asset management APIs
├── tests/                  # Unit tests
├── netlify.toml            # Netlify configuration
├── package.json            # Dependencies & scripts
└── README.md              # This file
```

## 🔧 API Endpoints

### **Health Checks**
- `GET /.netlify/functions/health/system` - System status
- `GET /.netlify/functions/health/redis` - Redis connectivity

### **Authentication**
- `POST /.netlify/functions/auth/login` - User login
- `POST /.netlify/functions/auth/register` - User registration
- `POST /.netlify/functions/auth/web3auth` - Web3 authentication

### **Tokenization**
- `POST /.netlify/functions/tokenization/create` - Create new token
- `GET /.netlify/functions/tokenization/list` - List user tokens
- `GET /.netlify/functions/tokenization/details/:id` - Token details

### **Assets**
- `GET /.netlify/functions/assets/list` - List available assets
- `POST /.netlify/functions/assets/upload` - Upload asset metadata

## 🔒 Security Features

- **Rate Limiting:** 10 requests/minute per user
- **CORS Protection:** Configured headers
- **Input Validation:** Zod schema validation
- **Authentication:** JWT + Web3 signatures
- **Environment Isolation:** Separate dev/prod configs

## 🚀 Performance

- **Edge Computing:** Global CDN deployment
- **Caching:** Redis-based caching layer
- **Optimization:** Tree-shaking, code splitting
- **Monitoring:** Built-in health checks

## 📊 Monitoring & Analytics

- **Health Endpoints:** Real-time system monitoring
- **Error Tracking:** Comprehensive error handling
- **Performance Metrics:** Response time tracking
- **User Analytics:** Usage statistics

## 🚀 Deployment on Netlify

The project is configured for Netlify using Node.js **20**. Run `npm run netlify:build` to test the build locally and `npm run netlify:dev` to serve the frontend and functions. See [docs/netlify_deployment.md](docs/netlify_deployment.md) for the full list of required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** [Wiki](https://github.com/Solcraftl2/solcraft-nexus/wiki)
- **Issues:** [GitHub Issues](https://github.com/Solcraftl2/solcraft-nexus/issues)
- **Email:** info@solcraftl2.com

## 🎯 Roadmap

- [x] ✅ XRPL Integration
- [x] ✅ Web3 Authentication
- [x] ✅ Netlify Functions Migration
- [x] ✅ Redis Caching
- [ ] 🔄 Advanced Analytics
- [ ] 🔄 Multi-chain Support
- [ ] 🔄 Mobile App

---

**Built with ❤️ by the SolCraft Team**

**Powered by XRPL | Deployed on Netlify | Secured by Web3**

