// Insurance and Risk Marketplace Data for SolCraft Nexus

// Risk Categories
export const riskCategories = [
  {
    id: 'catastrophe',
    name: 'Catastrophe Bonds',
    description: 'Rischi catastrofali naturali (uragani, terremoti, alluvioni)',
    icon: '🌪️',
    color: '#e74c3c',
    commission_rate: 0.015, // 1.5%
    management_fee: 0.0075, // 0.75%
    min_investment: 1000,
    typical_yield: 0.085 // 8.5%
  },
  {
    id: 'cyber',
    name: 'Cyber Risk Pools',
    description: 'Rischi informatici (data breach, ransomware, business interruption)',
    icon: '🔒',
    color: '#9b59b6',
    commission_rate: 0.02, // 2%
    management_fee: 0.01, // 1%
    min_investment: 500,
    typical_yield: 0.12 // 12%
  },
  {
    id: 'pandemic',
    name: 'Pandemic Preparedness',
    description: 'Preparazione pandemica e emergenze sanitarie globali',
    icon: '🦠',
    color: '#f39c12',
    commission_rate: 0.025, // 2.5%
    management_fee: 0.0075, // 0.75%
    min_investment: 2000,
    typical_yield: 0.07 // 7%
  },
  {
    id: 'climate',
    name: 'Climate Risk',
    description: 'Rischi climatici e transizione energetica',
    icon: '🌡️',
    color: '#27ae60',
    commission_rate: 0.018, // 1.8%
    management_fee: 0.008, // 0.8%
    min_investment: 1500,
    typical_yield: 0.095 // 9.5%
  },
  {
    id: 'surety',
    name: 'Fidejussioni & Garanzie',
    description: 'Fidejussioni bancarie, garanzie contrattuali, performance bonds',
    icon: '🤝',
    color: '#3498db',
    commission_rate: 0.012, // 1.2%
    management_fee: 0.006, // 0.6%
    min_investment: 250,
    typical_yield: 0.055 // 5.5%
  },
  {
    id: 'automotive',
    name: 'Rischi Automotive',
    description: 'Assicurazioni auto, flotte aziendali, mobilità condivisa',
    icon: '🚗',
    color: '#e67e22',
    commission_rate: 0.008, // 0.8%
    management_fee: 0.004, // 0.4%
    min_investment: 100,
    typical_yield: 0.045 // 4.5%
  },
  {
    id: 'carbon',
    name: 'Carbon Credits & Tax',
    description: 'Crediti di carbonio, carbon tax, mercati emissioni CO2',
    icon: '🌱',
    color: '#2ecc71',
    commission_rate: 0.015, // 1.5%
    management_fee: 0.0075, // 0.75%
    min_investment: 500,
    typical_yield: 0.08 // 8%
  }
];

// Sample Risk Tokens Available for Investment
export const availableRiskTokens = [
  {
    id: 'cat_florida_2025',
    category: 'catastrophe',
    name: 'Florida Hurricane CAT Bond 2025',
    issuer: 'Generali Italia',
    description: 'Copertura rischio uragano Florida per portafoglio €500M',
    total_value: 500000000, // €500M
    tokens_available: 500000,
    token_price: 1000,
    tokens_sold: 325000,
    yield_rate: 0.085,
    maturity_date: '2025-12-31',
    trigger: {
      type: 'parametric',
      description: 'Uragano categoria 5+ (157+ mph) per 24h consecutive in Miami-Dade, Broward, Palm Beach',
      probability: 0.02, // 2% annuale
      data_source: 'National Hurricane Center'
    },
    risk_layer: 'primary',
    geography: 'Florida, USA',
    status: 'active',
    created_date: '2024-01-15',
    performance_ytd: 0.065,
    liquidity_score: 85
  },
  {
    id: 'cyber_eu_tech_2025',
    category: 'cyber',
    name: 'EU Tech Consortium Cyber Pool',
    issuer: 'Cyber Risk Syndicate',
    description: 'Pool cyber risk per 50 aziende tech europee - €2B exposure',
    total_value: 500000000, // €500M (Layer 3)
    tokens_available: 500000,
    token_price: 1000,
    tokens_sold: 180000,
    yield_rate: 0.15,
    maturity_date: '2025-06-30',
    trigger: {
      type: 'parametric',
      description: 'Data breach >1M record OR ransomware >€50M OR business interruption >30 giorni',
      probability: 0.08, // 8% annuale
      data_source: 'CyberSec Oracle Network'
    },
    risk_layer: 'excess',
    geography: 'Europa',
    status: 'active',
    created_date: '2024-03-01',
    performance_ytd: 0.12,
    liquidity_score: 72
  },
  {
    id: 'pandemic_who_2025',
    category: 'pandemic',
    name: 'WHO Pandemic Preparedness Bond',
    issuer: 'World Health Organization',
    description: 'Meccanismo finanziamento rapido per future pandemie - $10B pool',
    total_value: 2000000000, // €2B (tranche europea)
    tokens_available: 2000000,
    token_price: 1000,
    tokens_sold: 450000,
    yield_rate: 0.07,
    maturity_date: '2027-12-31',
    trigger: {
      type: 'parametric',
      description: 'PHEIC declaration + mortality rate >2% in 3+ continenti per 30 giorni',
      probability: 0.03, // 3% annuale
      data_source: 'WHO Emergency Response'
    },
    risk_layer: 'primary',
    geography: 'Globale',
    status: 'active',
    created_date: '2024-02-01',
    performance_ytd: 0.055,
    liquidity_score: 95
  },
  {
    id: 'climate_transition_2025',
    category: 'climate',
    name: 'Energy Transition Risk Bond',
    issuer: 'European Climate Bank',
    description: 'Rischi transizione energetica per utilities europee',
    total_value: 750000000, // €750M
    tokens_available: 750000,
    token_price: 1000,
    tokens_sold: 290000,
    yield_rate: 0.095,
    maturity_date: '2026-12-31',
    trigger: {
      type: 'parametric',
      description: 'Carbon price >€150/ton OR renewable capacity shortfall >20%',
      probability: 0.05, // 5% annuale
      data_source: 'EU ETS & Energy Oracle'
    },
    risk_layer: 'primary',
    geography: 'Europa',
    status: 'active',
    created_date: '2024-01-30',
    performance_ytd: 0.078,
    liquidity_score: 68
  },
  {
    id: 'surety_construction_2025',
    category: 'surety',
    name: 'Construction Performance Bond Pool',
    issuer: 'Italian Construction Guarantee Consortium',
    description: 'Pool fidejussioni per grandi opere infrastrutturali italiane - €1B exposure',
    total_value: 200000000, // €200M
    tokens_available: 200000,
    token_price: 1000,
    tokens_sold: 145000,
    yield_rate: 0.055,
    maturity_date: '2026-12-31',
    trigger: {
      type: 'indemnity',
      description: 'Inadempimento contrattuale OR ritardo >6 mesi OR qualità non conforme',
      probability: 0.12, // 12% annuale
      data_source: 'Construction Monitoring Oracle'
    },
    risk_layer: 'primary',
    geography: 'Italia',
    status: 'active',
    created_date: '2024-02-15',
    performance_ytd: 0.042,
    liquidity_score: 65
  },
  {
    id: 'surety_banking_2025',
    category: 'surety',
    name: 'Banking Guarantee Pool',
    issuer: 'European Banking Guarantee Association',
    description: 'Fidejussioni bancarie per PMI europee - €500M exposure',
    total_value: 100000000, // €100M
    tokens_available: 100000,
    token_price: 1000,
    tokens_sold: 78000,
    yield_rate: 0.048,
    maturity_date: '2025-12-31',
    trigger: {
      type: 'indemnity',
      description: 'Default PMI OR insolvenza OR mancato pagamento >90 giorni',
      probability: 0.08, // 8% annuale
      data_source: 'Credit Bureau Oracle'
    },
    risk_layer: 'primary',
    geography: 'Europa',
    status: 'active',
    created_date: '2024-03-10',
    performance_ytd: 0.038,
    liquidity_score: 70
  },
  {
    id: 'auto_fleet_2025',
    category: 'automotive',
    name: 'European Fleet Insurance Pool',
    issuer: 'Continental Auto Insurance',
    description: 'Pool assicurativo per flotte aziendali europee - 500K veicoli',
    total_value: 300000000, // €300M
    tokens_available: 300000,
    token_price: 1000,
    tokens_sold: 220000,
    yield_rate: 0.045,
    maturity_date: '2025-12-31',
    trigger: {
      type: 'aggregate',
      description: 'Sinistri aggregati >€150M OR frequenza sinistri >15% OR catastrofe naturale',
      probability: 0.18, // 18% annuale
      data_source: 'Automotive Telematics Oracle'
    },
    risk_layer: 'primary',
    geography: 'Europa',
    status: 'active',
    created_date: '2024-01-20',
    performance_ytd: 0.035,
    liquidity_score: 80
  },
  {
    id: 'auto_sharing_2025',
    category: 'automotive',
    name: 'Mobility Sharing Risk Pool',
    issuer: 'Urban Mobility Consortium',
    description: 'Rischi per piattaforme car/bike sharing in città europee',
    total_value: 150000000, // €150M
    tokens_available: 150000,
    token_price: 1000,
    tokens_sold: 95000,
    yield_rate: 0.065,
    maturity_date: '2025-06-30',
    trigger: {
      type: 'parametric',
      description: 'Incidenti >200/mese OR furto veicoli >5% OR responsabilità civile >€10M',
      probability: 0.25, // 25% annuale
      data_source: 'Mobility Platform Oracle'
    },
    risk_layer: 'excess',
    geography: 'Europa',
    status: 'active',
    created_date: '2024-02-28',
    performance_ytd: 0.052,
    liquidity_score: 60
  },
  {
    id: 'carbon_eu_ets_2025',
    category: 'carbon',
    name: 'EU ETS Carbon Price Risk Bond',
    issuer: 'European Carbon Exchange',
    description: 'Protezione contro volatilità prezzi CO2 nel sistema ETS europeo',
    total_value: 400000000, // €400M
    tokens_available: 400000,
    token_price: 1000,
    tokens_sold: 280000,
    yield_rate: 0.08,
    maturity_date: '2026-12-31',
    trigger: {
      type: 'parametric',
      description: 'Prezzo CO2 <€30/ton OR >€200/ton per 30 giorni consecutivi',
      probability: 0.15, // 15% annuale
      data_source: 'EU ETS Price Oracle'
    },
    risk_layer: 'primary',
    geography: 'Europa',
    status: 'active',
    created_date: '2024-01-10',
    performance_ytd: 0.065,
    liquidity_score: 85
  },
  {
    id: 'carbon_offset_2025',
    category: 'carbon',
    name: 'Global Carbon Offset Verification Pool',
    issuer: 'International Carbon Registry',
    description: 'Rischio di invalidazione crediti di carbonio per progetti globali',
    total_value: 250000000, // €250M
    tokens_available: 250000,
    token_price: 1000,
    tokens_sold: 160000,
    yield_rate: 0.095,
    maturity_date: '2027-12-31',
    trigger: {
      type: 'indemnity',
      description: 'Invalidazione crediti >20% OR frode progetti OR non-addizionalità',
      probability: 0.12, // 12% annuale
      data_source: 'Carbon Verification Oracle'
    },
    risk_layer: 'excess',
    geography: 'Globale',
    status: 'active',
    created_date: '2024-02-05',
    performance_ytd: 0.078,
    liquidity_score: 55
  },
  {
    id: 'carbon_tax_2025',
    category: 'carbon',
    name: 'Carbon Border Tax Adjustment Pool',
    issuer: 'EU Trade Commission',
    description: 'Rischi implementazione CBAM e carbon tax per importatori UE',
    total_value: 180000000, // €180M
    tokens_available: 180000,
    token_price: 1000,
    tokens_sold: 125000,
    yield_rate: 0.075,
    maturity_date: '2025-12-31',
    trigger: {
      type: 'regulatory',
      description: 'Modifica CBAM >50% OR dispute WTO OR esenzioni settoriali >30%',
      probability: 0.20, // 20% annuale
      data_source: 'EU Regulatory Oracle'
    },
    risk_layer: 'primary',
    geography: 'Europa',
    status: 'active',
    created_date: '2024-03-15',
    performance_ytd: 0.058,
    liquidity_score: 75
  }
];

// Risk Layers for Multi-Layer Structure
export const riskLayers = [
  {
    id: 'primary',
    name: 'Primary Layer',
    description: 'Primo livello di rischio - probabilità più alta, perdite limitate',
    typical_yield_range: [0.04, 0.08],
    loss_probability: [0.05, 0.15],
    max_loss: 0.25,
    investor_profile: 'Conservative, Pension Funds, Insurance'
  },
  {
    id: 'excess',
    name: 'Excess Layer',
    description: 'Livello eccedenza - probabilità media, perdite moderate',
    typical_yield_range: [0.08, 0.15],
    loss_probability: [0.02, 0.08],
    max_loss: 0.75,
    investor_profile: 'Balanced, Hedge Funds, Family Offices'
  },
  {
    id: 'catastrophic',
    name: 'Catastrophic Layer',
    description: 'Livello catastrofale - probabilità bassa, perdite totali',
    typical_yield_range: [0.15, 0.25],
    loss_probability: [0.005, 0.03],
    max_loss: 1.0,
    investor_profile: 'Aggressive, Specialized Funds, Sophisticated Investors'
  }
];

// Revenue Streams for SolCraft (Zero Risk Model)
export const revenueStreams = [
  {
    id: 'tokenization_fees',
    name: 'Commissioni di Tokenizzazione',
    description: 'Commissioni una tantum per strutturazione e tokenizzazione rischi',
    rate_range: [0.005, 0.03], // 0.5% - 3%
    frequency: 'one_time',
    scalability: 'high',
    margin: 0.95
  },
  {
    id: 'trading_fees',
    name: 'Commissioni di Trading',
    description: 'Commissioni ricorrenti su volume trading secondario',
    rate_range: [0.001, 0.005], // 0.1% - 0.5%
    frequency: 'per_transaction',
    scalability: 'very_high',
    margin: 0.85
  },
  {
    id: 'management_fees',
    name: 'Commissioni di Gestione',
    description: 'Commissioni annuali su asset under management',
    rate_range: [0.005, 0.015], // 0.5% - 1.5%
    frequency: 'annual',
    scalability: 'high',
    margin: 0.80
  },
  {
    id: 'premium_services',
    name: 'Servizi Premium',
    description: 'Data analytics, risk modeling, consulting',
    rate_range: [50000, 5000000], // €50K - €5M
    frequency: 'project_based',
    scalability: 'medium',
    margin: 0.90
  }
];

// Oracle Data Sources for Trigger Monitoring
export const oracleDataSources = [
  {
    id: 'weather_oracle',
    name: 'Weather & Climate Oracle',
    description: 'Dati meteorologici e climatici in tempo reale',
    providers: ['National Hurricane Center', 'ECMWF', 'NOAA'],
    update_frequency: 'hourly',
    reliability: 0.995,
    cost_per_query: 0.1
  },
  {
    id: 'cyber_oracle',
    name: 'Cybersecurity Oracle',
    description: 'Monitoraggio incidenti cyber e data breach',
    providers: ['CrowdStrike', 'FireEye', 'IBM Security'],
    update_frequency: 'real_time',
    reliability: 0.98,
    cost_per_query: 0.5
  },
  {
    id: 'health_oracle',
    name: 'Global Health Oracle',
    description: 'Dati sanitari globali e monitoraggio pandemie',
    providers: ['WHO', 'CDC', 'ECDC'],
    update_frequency: 'daily',
    reliability: 0.99,
    cost_per_query: 0.2
  },
  {
    id: 'financial_oracle',
    name: 'Financial Markets Oracle',
    description: 'Dati finanziari e di mercato per trigger economici',
    providers: ['Bloomberg', 'Reuters', 'ICE'],
    update_frequency: 'real_time',
    reliability: 0.999,
    cost_per_query: 0.05
  }
];

// Sample Investor Profiles for Risk Tokens
export const investorProfiles = [
  {
    id: 'pension_fund',
    name: 'Fondi Pensione',
    risk_tolerance: 'low',
    preferred_layers: ['primary'],
    typical_allocation: 0.05, // 5% of portfolio
    min_investment: 1000000,
    preferred_duration: [3, 7], // 3-7 anni
    geographic_preference: 'domestic'
  },
  {
    id: 'insurance_company',
    name: 'Compagnie Assicurative',
    risk_tolerance: 'low_medium',
    preferred_layers: ['primary', 'excess'],
    typical_allocation: 0.15,
    min_investment: 5000000,
    preferred_duration: [1, 5],
    geographic_preference: 'diversified'
  },
  {
    id: 'hedge_fund',
    name: 'Hedge Funds',
    risk_tolerance: 'high',
    preferred_layers: ['excess', 'catastrophic'],
    typical_allocation: 0.25,
    min_investment: 500000,
    preferred_duration: [1, 3],
    geographic_preference: 'global'
  },
  {
    id: 'family_office',
    name: 'Family Offices',
    risk_tolerance: 'medium',
    preferred_layers: ['primary', 'excess'],
    typical_allocation: 0.10,
    min_investment: 2000000,
    preferred_duration: [2, 5],
    geographic_preference: 'regional'
  },
  {
    id: 'retail_investor',
    name: 'Investitori Retail',
    risk_tolerance: 'medium',
    preferred_layers: ['primary'],
    typical_allocation: 0.03,
    min_investment: 1000,
    preferred_duration: [1, 3],
    geographic_preference: 'domestic'
  }
];

// Performance Metrics for Risk Assessment
export const performanceMetrics = [
  {
    metric: 'sharpe_ratio',
    name: 'Sharpe Ratio',
    description: 'Rendimento aggiustato per il rischio',
    benchmark: 1.5,
    calculation: 'excess_return / volatility'
  },
  {
    metric: 'max_drawdown',
    name: 'Maximum Drawdown',
    description: 'Perdita massima dal picco',
    benchmark: 0.15,
    calculation: 'max_loss_from_peak'
  },
  {
    metric: 'correlation',
    name: 'Correlazione con Mercati',
    description: 'Correlazione con asset tradizionali',
    benchmark: 0.2,
    calculation: 'correlation_coefficient'
  },
  {
    metric: 'liquidity_score',
    name: 'Score di Liquidità',
    description: 'Facilità di trading secondario',
    benchmark: 70,
    calculation: 'volume_weighted_score'
  }
];

// Sample Historical Performance Data
export const historicalPerformance = {
  'cat_florida_2025': {
    monthly_returns: [0.007, 0.008, 0.007, 0.009, 0.006, 0.008, 0.007, 0.009, 0.008, 0.007, 0.008, 0.009],
    volatility: 0.12,
    max_drawdown: 0.05,
    sharpe_ratio: 1.8,
    correlation_sp500: 0.15
  },
  'cyber_eu_tech_2025': {
    monthly_returns: [0.012, 0.015, 0.011, 0.014, 0.013, 0.016, 0.012, 0.015, 0.014, 0.013, 0.015, 0.016],
    volatility: 0.25,
    max_drawdown: 0.18,
    sharpe_ratio: 1.2,
    correlation_sp500: 0.25
  },
  'pandemic_who_2025': {
    monthly_returns: [0.006, 0.005, 0.006, 0.007, 0.005, 0.006, 0.006, 0.007, 0.006, 0.005, 0.006, 0.007],
    volatility: 0.08,
    max_drawdown: 0.03,
    sharpe_ratio: 2.1,
    correlation_sp500: 0.05
  },
  'climate_transition_2025': {
    monthly_returns: [0.008, 0.009, 0.007, 0.010, 0.008, 0.009, 0.008, 0.010, 0.009, 0.008, 0.009, 0.010],
    volatility: 0.18,
    max_drawdown: 0.12,
    sharpe_ratio: 1.6,
    correlation_sp500: 0.30
  }
};

// Market Size and Growth Projections
export const marketData = {
  global_insurance_market: 4000000000000, // $4T
  catastrophe_bond_market: 50000000000, // $50B
  cyber_insurance_market: 20000000000, // $20B
  pandemic_bond_market: 5000000000, // $5B
  projected_growth_rate: 0.15, // 15% CAGR
  solcraft_target_share: {
    year_1: 0.001, // 0.1%
    year_3: 0.01, // 1%
    year_5: 0.05 // 5%
  }
};

export default {
  riskCategories,
  availableRiskTokens,
  riskLayers,
  revenueStreams,
  oracleDataSources,
  investorProfiles,
  performanceMetrics,
  historicalPerformance,
  marketData
};

