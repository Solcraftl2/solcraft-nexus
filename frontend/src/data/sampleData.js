// Sample data for SolCraft Nexus platform
export const sampleAssetCategories = [
  {
    id: 1,
    name: 'real_estate',
    description: 'Immobiliare',
    icon: '🏠'
  },
  {
    id: 2,
    name: 'startup_equity',
    description: 'Equity Startup',
    icon: '🚀'
  },
  {
    id: 3,
    name: 'art_collectibles',
    description: 'Arte e Collezioni',
    icon: '🎨'
  },
  {
    id: 4,
    name: 'commodities',
    description: 'Commodities',
    icon: '⚡'
  }
];

export const sampleAssets = [
  {
    id: 1,
    name: 'Palazzo Storico Milano Centro',
    symbol: 'PSMC',
    description: 'Palazzo storico del XVIII secolo nel cuore di Milano, completamente ristrutturato con appartamenti di lusso.',
    category_id: 1,
    total_value: 2500000.00,
    token_price: 100.00,
    total_tokens: 25000,
    available_tokens: 8500,
    minimum_investment: 500.00,
    expected_yield: 8.5,
    location: 'Milano, Italia',
    status: 'active',
    featured: true,
    documents_verified: true,
    asset_categories: { name: 'real_estate', icon: '🏠' },
    asset_details: {
      details: {
        superficie: '1,200 m²',
        appartamenti: 8,
        anno_costruzione: 1750,
        anno_ristrutturazione: 2023,
        classe_energetica: 'A+',
        rendita_annua: '€212,500'
      },
      financials: {
        cap_rate: 8.5,
        noi: 212500,
        occupancy_rate: 95,
        maintenance_reserve: 25000
      },
      highlights: [
        'Posizione strategica nel centro storico',
        'Completamente ristrutturato nel 2023',
        'Contratti di locazione a lungo termine',
        'Rendimento garantito per 5 anni'
      ]
    }
  },
  {
    id: 2,
    name: 'TechStart AI Solutions',
    symbol: 'TSAI',
    description: 'Startup innovativa nel settore AI per automazione industriale con brevetti proprietari.',
    category_id: 2,
    total_value: 5000000.00,
    token_price: 50.00,
    total_tokens: 100000,
    available_tokens: 35000,
    minimum_investment: 250.00,
    expected_yield: 25.0,
    location: 'Torino, Italia',
    status: 'active',
    featured: true,
    documents_verified: true,
    asset_categories: { name: 'startup_equity', icon: '🚀' },
    asset_details: {
      details: {
        settore: 'Artificial Intelligence',
        dipendenti: 45,
        anno_fondazione: 2021,
        brevetti: 12,
        clienti_enterprise: 25,
        fatturato_2024: '€2.1M'
      },
      financials: {
        revenue_growth: 180,
        gross_margin: 75,
        burn_rate: 150000,
        runway_months: 24
      },
      highlights: [
        'Crescita del 180% nel 2024',
        '12 brevetti registrati',
        'Partnership con aziende Fortune 500',
        'Round Series A in corso'
      ]
    }
  },
  {
    id: 3,
    name: 'Collezione Arte Contemporanea',
    symbol: 'CART',
    description: 'Collezione curata di opere d\'arte contemporanea di artisti emergenti e affermati.',
    category_id: 3,
    total_value: 1200000.00,
    token_price: 75.00,
    total_tokens: 16000,
    available_tokens: 4200,
    minimum_investment: 300.00,
    expected_yield: 12.0,
    location: 'Roma, Italia',
    status: 'active',
    featured: false,
    documents_verified: true,
    asset_categories: { name: 'art_collectibles', icon: '🎨' },
    asset_details: {
      details: {
        opere_totali: 24,
        artisti: 12,
        periodo: '2015-2024',
        valutazione_peritale: '€1.2M',
        assicurazione: '€1.5M',
        conservazione: 'Clima controllato'
      },
      financials: {
        appreciation_rate: 12,
        insurance_cost: 15000,
        storage_cost: 8000,
        management_fee: 2.5
      },
      highlights: [
        'Opere di artisti quotati in gallerie internazionali',
        'Apprezzamento medio del 12% annuo',
        'Conservazione professionale',
        'Possibilità di esposizione pubblica'
      ]
    }
  },
  {
    id: 4,
    name: 'Oro Fisico Certificato',
    symbol: 'GOLD',
    description: 'Lingotti d\'oro fisico 999.9 conservati in caveau svizzero con certificazione LBMA.',
    category_id: 4,
    total_value: 800000.00,
    token_price: 40.00,
    total_tokens: 20000,
    available_tokens: 12000,
    minimum_investment: 200.00,
    expected_yield: 6.5,
    location: 'Zurigo, Svizzera',
    status: 'active',
    featured: false,
    documents_verified: true,
    asset_categories: { name: 'commodities', icon: '⚡' },
    asset_details: {
      details: {
        peso_totale: '12.8 kg',
        purezza: '999.9',
        certificazione: 'LBMA Good Delivery',
        caveau: 'UBS Zurigo',
        assicurazione: 'Lloyd\'s of London',
        audit: 'Trimestrale'
      },
      financials: {
        storage_fee: 0.5,
        insurance_fee: 0.3,
        management_fee: 1.0,
        liquidity: 'T+2'
      },
      highlights: [
        'Oro fisico certificato LBMA',
        'Conservazione in caveau svizzero',
        'Assicurazione Lloyd\'s of London',
        'Liquidità garantita T+2'
      ]
    }
  }
];

export const sampleUserProfile = {
  id: 'user-123',
  email: 'investor@solcraft.com',
  full_name: 'Marco Investitore',
  avatar_url: null,
  wallet_address: 'rN7n7otQDd6FczFgLdSqnVgqiTZUA9CN1xJ',
  wallet_type: 'xumm',
  kyc_status: 'approved',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-06-26T15:30:00Z',
  last_login: '2024-06-26T15:30:00Z'
};

export const samplePortfolio = [
  {
    id: 1,
    user_id: 'user-123',
    asset_id: 1,
    tokens_owned: 50,
    purchase_price: 95.00,
    current_value: 5000.00,
    total_invested: 4750.00,
    created_at: '2024-03-10T14:20:00Z',
    assets: {
      name: 'Palazzo Storico Milano Centro',
      symbol: 'PSMC',
      token_price: 100.00,
      asset_categories: { name: 'real_estate', icon: '🏠' }
    }
  },
  {
    id: 2,
    user_id: 'user-123',
    asset_id: 2,
    tokens_owned: 100,
    purchase_price: 45.00,
    current_value: 5000.00,
    total_invested: 4500.00,
    created_at: '2024-04-15T09:15:00Z',
    assets: {
      name: 'TechStart AI Solutions',
      symbol: 'TSAI',
      token_price: 50.00,
      asset_categories: { name: 'startup_equity', icon: '🚀' }
    }
  },
  {
    id: 3,
    user_id: 'user-123',
    asset_id: 3,
    tokens_owned: 20,
    purchase_price: 70.00,
    current_value: 1500.00,
    total_invested: 1400.00,
    created_at: '2024-05-20T16:45:00Z',
    assets: {
      name: 'Collezione Arte Contemporanea',
      symbol: 'CART',
      token_price: 75.00,
      asset_categories: { name: 'art_collectibles', icon: '🎨' }
    }
  }
];

export const sampleTransactions = [
  {
    id: 1,
    user_id: 'user-123',
    asset_id: 1,
    transaction_type: 'buy',
    tokens: 50,
    price_per_token: 95.00,
    total_amount: 4750.00,
    status: 'completed',
    transaction_hash: '0x1234567890abcdef',
    created_at: '2024-03-10T14:20:00Z',
    completed_at: '2024-03-10T14:22:00Z',
    assets: {
      name: 'Palazzo Storico Milano Centro',
      symbol: 'PSMC',
      asset_categories: { name: 'real_estate', icon: '🏠' }
    }
  },
  {
    id: 2,
    user_id: 'user-123',
    asset_id: 2,
    transaction_type: 'buy',
    tokens: 100,
    price_per_token: 45.00,
    total_amount: 4500.00,
    status: 'completed',
    transaction_hash: '0xabcdef1234567890',
    created_at: '2024-04-15T09:15:00Z',
    completed_at: '2024-04-15T09:17:00Z',
    assets: {
      name: 'TechStart AI Solutions',
      symbol: 'TSAI',
      asset_categories: { name: 'startup_equity', icon: '🚀' }
    }
  },
  {
    id: 3,
    user_id: 'user-123',
    asset_id: 1,
    transaction_type: 'dividend',
    tokens: 50,
    price_per_token: 2.50,
    total_amount: 125.00,
    status: 'completed',
    transaction_hash: '0xfedcba0987654321',
    created_at: '2024-06-01T10:00:00Z',
    completed_at: '2024-06-01T10:01:00Z',
    assets: {
      name: 'Palazzo Storico Milano Centro',
      symbol: 'PSMC',
      asset_categories: { name: 'real_estate', icon: '🏠' }
    }
  }
];

export const sampleOrders = [
  {
    id: 1,
    user_id: 'user-123',
    asset_id: 4,
    order_type: 'buy',
    tokens: 25,
    price_per_token: 40.00,
    total_amount: 1000.00,
    status: 'pending',
    created_at: '2024-06-26T15:00:00Z',
    expires_at: '2024-06-27T15:00:00Z',
    assets: {
      name: 'Oro Fisico Certificato',
      symbol: 'GOLD',
      token_price: 40.00,
      asset_categories: { name: 'commodities', icon: '⚡' }
    }
  }
];

export const sampleWatchlist = [
  {
    id: 1,
    user_id: 'user-123',
    asset_id: 4,
    created_at: '2024-06-25T12:00:00Z',
    assets: {
      name: 'Oro Fisico Certificato',
      symbol: 'GOLD',
      token_price: 40.00,
      expected_yield: 6.5,
      asset_categories: { name: 'commodities', icon: '⚡' }
    }
  }
];

export const sampleNotifications = [
  {
    id: 1,
    user_id: 'user-123',
    title: 'Dividendo Ricevuto',
    message: 'Hai ricevuto €125.00 di dividendi da Palazzo Storico Milano Centro (PSMC)',
    type: 'success',
    read: false,
    created_at: '2024-06-01T10:01:00Z'
  },
  {
    id: 2,
    user_id: 'user-123',
    title: 'Nuovo Asset Disponibile',
    message: 'È disponibile un nuovo asset: Oro Fisico Certificato (GOLD)',
    type: 'info',
    read: false,
    created_at: '2024-06-25T09:00:00Z'
  },
  {
    id: 3,
    user_id: 'user-123',
    title: 'Ordine in Attesa',
    message: 'Il tuo ordine di acquisto per GOLD è in attesa di esecuzione',
    type: 'warning',
    read: true,
    created_at: '2024-06-26T15:00:00Z'
  }
];

// Performance data for analytics
export const samplePerformanceData = [
  { month: 'Gen', portfolio: 8500, benchmark: 8200 },
  { month: 'Feb', portfolio: 9200, benchmark: 8800 },
  { month: 'Mar', portfolio: 10750, benchmark: 9500 },
  { month: 'Apr', portfolio: 15250, benchmark: 10200 },
  { month: 'Mag', portfolio: 16650, benchmark: 11000 },
  { month: 'Giu', portfolio: 17500, benchmark: 11500 }
];

export const sampleAssetAllocation = [
  { name: 'Immobiliare', value: 5000, percentage: 28.6 },
  { name: 'Startup Equity', value: 5000, percentage: 28.6 },
  { name: 'Arte', value: 1500, percentage: 8.6 },
  { name: 'Liquidità', value: 6000, percentage: 34.2 }
];

export const sampleMarketTrends = [
  { category: 'Immobiliare', trend: '+8.5%', color: '#10B981' },
  { category: 'Startup Equity', trend: '+25.0%', color: '#3B82F6' },
  { category: 'Arte', trend: '+12.0%', color: '#8B5CF6' },
  { category: 'Commodities', trend: '+6.5%', color: '#F59E0B' }
];

