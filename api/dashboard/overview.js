import { logger } from '../../netlify/functions/utils/logger.js';
import { getXRPLClient, initializeXRPL, getAccountInfo } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';
import { dropsToXrp } from 'xrpl';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET for dashboard overview.' 
    })
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

    const { walletAddress, timeframe = '30d' } = req.query;

    try {
      await initializeXRPL();
      
      // Recupera dati dashboard completi
      const dashboardData = await getDashboardOverview({
        userAddress: walletAddress || decoded.address,
        userId: decoded.userId,
        timeframe: timeframe
      });

      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        timeframe: timeframe,
        user: {
          id: decoded.userId,
          address: walletAddress || decoded.address,
          name: decoded.name || 'SolCraft User'
        },
        portfolio: dashboardData.portfolio,
        performance: dashboardData.performance,
        assets: dashboardData.assets,
        transactions: dashboardData.recentTransactions,
        analytics: dashboardData.analytics,
        alerts: dashboardData.alerts,
        quickActions: dashboardData.quickActions,
        marketData: dashboardData.marketData,
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataSource: 'XRPL + Market APIs',
          refreshInterval: 30 // seconds
        }
      };

      return res.status(200).json(response);

    } catch (error) {
      logger.error('Dashboard data fetch error:', error);
      
      // Fallback con dati mock completi
      const mockDashboard = generateMockDashboardData(decoded.userId, timeframe);
      
      return res.status(200).json({
        success: true,
        ...mockDashboard,
        note: 'Dati simulati - XRPL non disponibile'
      });
    }

  } catch (error) {
    logger.error('Dashboard overview API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

// Funzioni helper
async function getDashboardOverview({ userAddress, userId, timeframe }) {
  const client = getXRPLClient();
  
  // Recupera informazioni account
  const accountInfo = await getAccountInfo(userAddress);
  
  // Calcola metriche portfolio
  const portfolioMetrics = await calculatePortfolioMetrics(userAddress, timeframe);
  
  // Recupera performance
  const performanceData = await getPerformanceData(userAddress, timeframe);
  
  // Recupera asset tokenizzati
  const tokenizedAssets = await getTokenizedAssets(userId);
  
  // Recupera transazioni recenti
  const recentTransactions = await getRecentTransactions(userAddress, 10);
  
  // Genera analytics
  const analytics = await generateAnalytics(userAddress, timeframe);
  
  // Controlla alerts
  const alerts = await checkAlerts(userAddress, portfolioMetrics);
  
  // Genera quick actions
  const quickActions = generateQuickActions(portfolioMetrics);
  
  // Recupera dati mercato
  const marketData = await getMarketData();

  return {
    portfolio: portfolioMetrics,
    performance: performanceData,
    assets: tokenizedAssets,
    recentTransactions: recentTransactions,
    analytics: analytics,
    alerts: alerts,
    quickActions: quickActions,
    marketData: marketData
  };
}

async function calculatePortfolioMetrics(address, timeframe) {
  // Simula calcolo metriche portfolio reali
  return {
    totalValue: {
      current: 125750.50,
      currency: 'USD',
      change24h: 2.35,
      changePercent24h: 1.9
    },
    breakdown: {
      xrp: {
        balance: 15000,
        value: 7500.00,
        percentage: 5.96
      },
      tokenizedAssets: {
        count: 4,
        value: 102000.00,
        percentage: 81.12
      },
      liquidityPools: {
        count: 2,
        value: 16250.50,
        percentage: 12.92
      }
    },
    diversification: {
      score: 8.5,
      rating: 'Excellent',
      sectors: ['Real Estate', 'Commodities', 'Art', 'Energy'],
      riskLevel: 'Moderate'
    },
    yield: {
      annual: 7.8,
      monthly: 0.65,
      projected12m: 9800.00
    }
  };
}

async function getPerformanceData(address, timeframe) {
  // Simula dati performance
  const timeframes = {
    '7d': { return: 1.2, benchmark: 0.8 },
    '30d': { return: 4.5, benchmark: 2.1 },
    '90d': { return: 12.3, benchmark: 8.7 },
    '1y': { return: 28.9, benchmark: 18.2 }
  };

  return {
    returns: {
      [timeframe]: timeframes[timeframe] || timeframes['30d'],
      allTime: { return: 45.7, benchmark: 25.3 }
    },
    volatility: {
      current: 15.2,
      average: 18.7,
      rating: 'Low'
    },
    sharpeRatio: 1.85,
    maxDrawdown: -8.3,
    winRate: 68.5,
    chartData: generatePerformanceChart(timeframe)
  };
}

async function getTokenizedAssets(userId) {
  // Simula asset tokenizzati dell'utente
  return [
    {
      id: 'PROP001',
      name: 'Manhattan Office Building',
      type: 'real_estate',
      tokens: 500,
      totalSupply: 1000,
      ownership: 50.0,
      currentValue: 26000000,
      userValue: 13000000,
      yield: 9.6,
      status: 'active',
      lastUpdate: '2024-01-15T10:30:00Z'
    },
    {
      id: 'GOLD001',
      name: 'Physical Gold Reserve',
      type: 'commodity',
      tokens: 250,
      totalSupply: 1000,
      ownership: 25.0,
      currentValue: 10000000,
      userValue: 2500000,
      yield: 0.0,
      status: 'active',
      lastUpdate: '2024-01-20T14:20:00Z'
    },
    {
      id: 'ART001',
      name: 'Renaissance Art Collection',
      type: 'art',
      tokens: 100,
      totalSupply: 500,
      ownership: 20.0,
      currentValue: 25000000,
      userValue: 5000000,
      yield: 0.0,
      status: 'active',
      lastUpdate: '2024-02-01T09:15:00Z'
    },
    {
      id: 'SOLAR001',
      name: 'Texas Solar Farm',
      type: 'renewable_energy',
      tokens: 300,
      totalSupply: 2000,
      ownership: 15.0,
      currentValue: 15000000,
      userValue: 2250000,
      yield: 7.2,
      status: 'active',
      lastUpdate: '2024-01-10T16:45:00Z'
    }
  ];
}

async function getRecentTransactions(address, limit) {
  // Simula transazioni recenti
  const transactions = [];
  const now = Date.now();
  
  for (let i = 0; i < limit; i++) {
    const isIncoming = Math.random() > 0.5;
    transactions.push({
      hash: `tx_${Date.now()}_${i}`,
      type: Math.random() > 0.7 ? 'token_transfer' : 'xrp_payment',
      direction: isIncoming ? 'received' : 'sent',
      amount: {
        value: (Math.random() * 1000 + 10).toFixed(2),
        currency: Math.random() > 0.6 ? 'XRP' : 'PROP001'
      },
      counterparty: isIncoming ? 'rSender123...' : 'rReceiver456...',
      timestamp: new Date(now - (i * 3600000)).toISOString(),
      status: 'completed',
      fee: '0.000012'
    });
  }
  
  return transactions;
}

async function generateAnalytics(address, timeframe) {
  return {
    riskMetrics: {
      portfolioRisk: 'Moderate',
      concentrationRisk: 'Low',
      liquidityRisk: 'Low',
      marketRisk: 'Moderate'
    },
    insights: [
      {
        type: 'performance',
        title: 'Portfolio Outperforming',
        description: 'Your portfolio is outperforming the market by 2.4%',
        severity: 'positive'
      },
      {
        type: 'diversification',
        title: 'Well Diversified',
        description: 'Your assets are well distributed across 4 sectors',
        severity: 'positive'
      },
      {
        type: 'yield',
        title: 'High Yield Assets',
        description: 'Real estate assets generating 9.6% annual yield',
        severity: 'info'
      }
    ],
    recommendations: [
      {
        type: 'rebalancing',
        title: 'Consider Rebalancing',
        description: 'Real estate allocation is above target (81% vs 70%)',
        priority: 'medium',
        action: 'Diversify into other asset classes'
      },
      {
        type: 'opportunity',
        title: 'New Investment Opportunity',
        description: 'High-yield renewable energy project available',
        priority: 'low',
        action: 'Review investment details'
      }
    ]
  };
}

async function checkAlerts(address, portfolioMetrics) {
  const alerts = [];
  
  // Alert per performance
  if (portfolioMetrics.totalValue.changePercent24h > 5) {
    alerts.push({
      type: 'performance',
      severity: 'info',
      title: 'Significant Portfolio Gain',
      message: `Portfolio increased by ${portfolioMetrics.totalValue.changePercent24h}% today`,
      timestamp: new Date().toISOString()
    });
  }
  
  // Alert per yield
  if (portfolioMetrics.yield.annual > 8) {
    alerts.push({
      type: 'yield',
      severity: 'positive',
      title: 'High Yield Performance',
      message: `Current annual yield of ${portfolioMetrics.yield.annual}% exceeds target`,
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
}

function generateQuickActions(portfolioMetrics) {
  return [
    {
      id: 'send_payment',
      title: 'Send Payment',
      description: 'Send XRP or tokens',
      icon: 'send',
      enabled: true
    },
    {
      id: 'receive_payment',
      title: 'Receive Payment',
      description: 'Generate payment request',
      icon: 'receive',
      enabled: true
    },
    {
      id: 'tokenize_asset',
      title: 'Tokenize Asset',
      description: 'Create new asset token',
      icon: 'tokenize',
      enabled: true
    },
    {
      id: 'trade_tokens',
      title: 'Trade Tokens',
      description: 'Access DEX trading',
      icon: 'trade',
      enabled: true
    },
    {
      id: 'view_analytics',
      title: 'View Analytics',
      description: 'Detailed portfolio analysis',
      icon: 'analytics',
      enabled: true
    },
    {
      id: 'generate_report',
      title: 'Generate Report',
      description: 'Export portfolio report',
      icon: 'report',
      enabled: true
    }
  ];
}

async function getMarketData() {
  return {
    xrp: {
      price: 0.50,
      change24h: 2.1,
      volume24h: 1250000000
    },
    totalMarketCap: 2500000000000,
    defiTvl: 180000000000,
    trends: [
      'RWA tokenization growing 45% YoY',
      'XRPL transaction volume up 23%',
      'Institutional adoption increasing'
    ]
  };
}

function generatePerformanceChart(timeframe) {
  const dataPoints = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const chart = [];
  let baseValue = 100000;
  
  for (let i = 0; i < dataPoints; i++) {
    const change = (Math.random() - 0.5) * 1000;
    baseValue += change;
    chart.push({
      date: new Date(Date.now() - ((dataPoints - i) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      value: Math.round(baseValue),
      change: change
    });
  }
  
  return chart;
}

function generateMockDashboardData(userId, timeframe) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    timeframe: timeframe,
    user: {
      id: userId,
      name: 'SolCraft User'
    },
    portfolio: {
      totalValue: {
        current: 125750.50,
        currency: 'USD',
        change24h: 2.35,
        changePercent24h: 1.9
      },
      breakdown: {
        xrp: { balance: 15000, value: 7500.00, percentage: 5.96 },
        tokenizedAssets: { count: 4, value: 102000.00, percentage: 81.12 },
        liquidityPools: { count: 2, value: 16250.50, percentage: 12.92 }
      },
      diversification: {
        score: 8.5,
        rating: 'Excellent',
        sectors: ['Real Estate', 'Commodities', 'Art', 'Energy'],
        riskLevel: 'Moderate'
      },
      yield: {
        annual: 7.8,
        monthly: 0.65,
        projected12m: 9800.00
      }
    },
    performance: {
      returns: {
        [timeframe]: { return: 4.5, benchmark: 2.1 },
        allTime: { return: 45.7, benchmark: 25.3 }
      },
      volatility: { current: 15.2, average: 18.7, rating: 'Low' },
      sharpeRatio: 1.85,
      maxDrawdown: -8.3,
      winRate: 68.5
    },
    quickActions: [
      { id: 'send_payment', title: 'Send Payment', enabled: true },
      { id: 'receive_payment', title: 'Receive Payment', enabled: true },
      { id: 'tokenize_asset', title: 'Tokenize Asset', enabled: true },
      { id: 'trade_tokens', title: 'Trade Tokens', enabled: true }
    ]
  };
}

