import { createReqRes } from '../config/requestWrapper.js';
import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';

exports.handler = async (event, context) => {
  const { req, res } = createReqRes(event);
  
  try {
    await originalHandler(req, res);
    
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: res.headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function originalHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // GET - Informazioni arbitrage e price discovery
    if (req.method === 'GET') {
      const {
        action = 'opportunities', // opportunities, prices, analytics, alerts
        asset = 'XRP',
        minProfit = 0.5, // Percentuale minima profitto
        maxRisk = 2.0    // Percentuale massima rischio
      } = req.query;

      try {
        let arbitrageData;

        switch (action) {
          case 'opportunities':
            arbitrageData = await getArbitrageOpportunities(asset, minProfit, maxRisk);
            break;
          case 'prices':
            arbitrageData = await getCrossPlatformPrices(asset);
            break;
          case 'analytics':
            arbitrageData = await getArbitrageAnalytics();
            break;
          case 'alerts':
            arbitrageData = await getArbitrageAlerts();
            break;
          default:
            throw new Error('Azione non supportata');
        }

        return res.status(200).json({
          success: true,
          data: arbitrageData,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore Arbitrage GET:', error);
        
        // Fallback a dati mock per sviluppo
        const mockData = getMockArbitrageData(req.query.action, req.query.asset);
        return res.status(200).json({
          success: true,
          data: mockData,
          mock: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST - Esegui arbitrage
    if (req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token di autenticazione richiesto'
        });
      }

      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
      
      try {
        jwt.verify(token, jwtSecret);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Token non valido'
        });
      }

      const { action, ...arbitrageData } = req.body;

      try {
        let result;

        switch (action) {
          case 'execute_arbitrage':
            result = await executeArbitrage(arbitrageData);
            break;
          case 'simulate_arbitrage':
            result = await simulateArbitrage(arbitrageData);
            break;
          case 'set_alert':
            result = await setArbitrageAlert(arbitrageData);
            break;
          default:
            throw new Error('Azione non supportata');
        }

        return res.status(200).json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore Arbitrage POST:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('Errore generale Arbitrage:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      timestamp: new Date().toISOString()
    });
  }
}

// Funzioni helper per Arbitrage e Price Discovery
async function getArbitrageOpportunities(asset, minProfit, maxRisk) {
  return {
    asset,
    totalOpportunities: 8,
    activeOpportunities: 5,
    avgProfitPotential: 1.8,
    totalVolume24h: 2450000,
    opportunities: [
      {
        id: 'arb_xrp_001',
        asset: 'XRP',
        type: 'cross_exchange',
        buyExchange: 'XRPL DEX',
        sellExchange: 'Binance',
        buyPrice: 0.5195,
        sellPrice: 0.5267,
        profitPercentage: 1.39,
        profitAmount: 0.0072,
        volume: 50000,
        maxProfit: 360,
        risk: 'low',
        riskScore: 1.2,
        executionTime: 45, // secondi
        gasFeesEstimate: 2.5,
        netProfit: 357.5,
        confidence: 0.92,
        lastUpdated: new Date(Date.now() - 30000).toISOString(),
        status: 'active'
      },
      {
        id: 'arb_rlusd_002',
        asset: 'RLUSD',
        type: 'triangular',
        path: ['RLUSD', 'XRP', 'USD', 'RLUSD'],
        exchanges: ['XRPL DEX', 'XRPL DEX', 'XRPL DEX'],
        startAmount: 10000,
        endAmount: 10185,
        profitPercentage: 1.85,
        profitAmount: 185,
        risk: 'medium',
        riskScore: 1.8,
        executionTime: 120,
        gasFeesEstimate: 8.5,
        netProfit: 176.5,
        confidence: 0.87,
        lastUpdated: new Date(Date.now() - 45000).toISOString(),
        status: 'active'
      },
      {
        id: 'arb_solo_003',
        asset: 'SOLO',
        type: 'cross_exchange',
        buyExchange: 'XRPL DEX',
        sellExchange: 'CoinEx',
        buyPrice: 0.2785,
        sellPrice: 0.2856,
        profitPercentage: 2.55,
        profitAmount: 0.0071,
        volume: 25000,
        maxProfit: 177.5,
        risk: 'medium',
        riskScore: 2.1,
        executionTime: 90,
        gasFeesEstimate: 5.2,
        netProfit: 172.3,
        confidence: 0.84,
        lastUpdated: new Date(Date.now() - 60000).toISOString(),
        status: 'active'
      },
      {
        id: 'arb_csc_004',
        asset: 'CSC',
        type: 'statistical',
        strategy: 'mean_reversion',
        currentPrice: 0.00452,
        targetPrice: 0.00467,
        profitPercentage: 3.32,
        volume: 15000,
        maxProfit: 225,
        risk: 'high',
        riskScore: 2.8,
        executionTime: 300,
        confidence: 0.76,
        lastUpdated: new Date(Date.now() - 90000).toISOString(),
        status: 'monitoring'
      },
      {
        id: 'arb_xrp_005',
        asset: 'XRP',
        type: 'flash_loan',
        strategy: 'liquidity_mining',
        borrowAmount: 100000,
        expectedReturn: 1250,
        profitPercentage: 1.25,
        risk: 'low',
        riskScore: 0.8,
        executionTime: 15,
        flashLoanFee: 50,
        netProfit: 1200,
        confidence: 0.95,
        lastUpdated: new Date(Date.now() - 15000).toISOString(),
        status: 'ready'
      }
    ],
    riskAnalysis: {
      lowRisk: 2,
      mediumRisk: 2,
      highRisk: 1,
      avgExecutionTime: 110,
      successRate: 0.89,
      avgSlippage: 0.15
    },
    marketConditions: {
      volatility: 'medium',
      liquidity: 'high',
      spread: 'normal',
      recommendation: 'favorable'
    }
  };
}

async function getCrossPlatformPrices(asset) {
  return {
    asset,
    lastUpdated: new Date().toISOString(),
    prices: [
      {
        exchange: 'XRPL DEX',
        price: 0.5195,
        volume24h: 2100000,
        spread: 0.0008,
        liquidity: 8500000,
        lastTrade: new Date(Date.now() - 5000).toISOString()
      },
      {
        exchange: 'Binance',
        price: 0.5267,
        volume24h: 45000000,
        spread: 0.0002,
        liquidity: 125000000,
        lastTrade: new Date(Date.now() - 2000).toISOString()
      },
      {
        exchange: 'Coinbase',
        price: 0.5251,
        volume24h: 28000000,
        spread: 0.0003,
        liquidity: 89000000,
        lastTrade: new Date(Date.now() - 3000).toISOString()
      },
      {
        exchange: 'Kraken',
        price: 0.5243,
        volume24h: 18000000,
        spread: 0.0005,
        liquidity: 52000000,
        lastTrade: new Date(Date.now() - 8000).toISOString()
      },
      {
        exchange: 'Bitfinex',
        price: 0.5238,
        volume24h: 12000000,
        spread: 0.0006,
        liquidity: 34000000,
        lastTrade: new Date(Date.now() - 12000).toISOString()
      }
    ],
    statistics: {
      highestPrice: 0.5267,
      lowestPrice: 0.5195,
      priceSpread: 0.0072,
      spreadPercentage: 1.39,
      weightedAverage: 0.5248,
      standardDeviation: 0.0025,
      coefficient: 0.0048
    },
    arbitrageSignals: [
      {
        buyFrom: 'XRPL DEX',
        sellTo: 'Binance',
        profit: 1.39,
        confidence: 0.92
      },
      {
        buyFrom: 'XRPL DEX',
        sellTo: 'Coinbase',
        profit: 1.08,
        confidence: 0.88
      }
    ]
  };
}

async function getArbitrageAnalytics() {
  return {
    performance: {
      totalTrades: 1247,
      successfulTrades: 1109,
      successRate: 0.889,
      totalProfit: 28450,
      avgProfitPerTrade: 25.67,
      maxProfit: 850,
      maxLoss: -125,
      profitFactor: 3.42,
      sharpeRatio: 2.18
    },
    timeframes: {
      '24h': {
        trades: 45,
        profit: 1125,
        successRate: 0.91,
        avgExecutionTime: 87
      },
      '7d': {
        trades: 298,
        profit: 7650,
        successRate: 0.89,
        avgExecutionTime: 92
      },
      '30d': {
        trades: 1247,
        profit: 28450,
        successRate: 0.889,
        avgExecutionTime: 95
      }
    },
    strategies: [
      {
        name: 'Cross-Exchange',
        trades: 687,
        successRate: 0.92,
        avgProfit: 28.5,
        totalProfit: 19580
      },
      {
        name: 'Triangular',
        trades: 324,
        successRate: 0.85,
        avgProfit: 22.1,
        totalProfit: 7160
      },
      {
        name: 'Statistical',
        trades: 156,
        successRate: 0.78,
        avgProfit: 18.7,
        totalProfit: 2917
      },
      {
        name: 'Flash Loan',
        trades: 80,
        successRate: 0.95,
        avgProfit: 45.2,
        totalProfit: 3616
      }
    ],
    riskMetrics: {
      var95: -45.2,
      maxDrawdown: -8.5,
      volatility: 0.125,
      beta: 0.78,
      alpha: 0.045
    },
    marketImpact: {
      avgSlippage: 0.15,
      priceImpact: 0.08,
      liquidityUtilization: 0.23
    }
  };
}

async function getArbitrageAlerts() {
  return {
    activeAlerts: 12,
    triggeredToday: 8,
    alerts: [
      {
        id: 'alert_001',
        type: 'profit_threshold',
        asset: 'XRP',
        condition: 'profit > 1.5%',
        status: 'active',
        lastTriggered: '2024-06-25T14:30:00Z',
        triggerCount: 3
      },
      {
        id: 'alert_002',
        type: 'price_divergence',
        asset: 'RLUSD',
        condition: 'spread > 2%',
        status: 'triggered',
        lastTriggered: '2024-06-25T15:45:00Z',
        triggerCount: 1
      },
      {
        id: 'alert_003',
        type: 'volume_spike',
        asset: 'SOLO',
        condition: 'volume > 500k',
        status: 'monitoring',
        lastTriggered: '2024-06-24T22:15:00Z',
        triggerCount: 5
      }
    ],
    recommendations: [
      {
        type: 'opportunity',
        message: 'XRP cross-exchange arbitrage disponibile: 1.39% profit',
        priority: 'high',
        action: 'execute'
      },
      {
        type: 'risk',
        message: 'Volatilità SOLO aumentata: monitorare posizioni',
        priority: 'medium',
        action: 'monitor'
      }
    ]
  };
}

async function executeArbitrage(arbitrageData) {
  const {
    opportunityId,
    amount,
    maxSlippage = 0.5,
    autoExecute = false
  } = arbitrageData;

  // Simulazione esecuzione arbitrage
  return {
    executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    opportunityId,
    amount: parseFloat(amount),
    status: 'executing',
    steps: [
      {
        step: 1,
        action: 'buy_asset',
        exchange: 'XRPL DEX',
        amount: parseFloat(amount),
        price: 0.5195,
        status: 'pending',
        txHash: null
      },
      {
        step: 2,
        action: 'transfer_asset',
        fromExchange: 'XRPL DEX',
        toExchange: 'Binance',
        amount: parseFloat(amount),
        status: 'waiting',
        estimatedTime: 30
      },
      {
        step: 3,
        action: 'sell_asset',
        exchange: 'Binance',
        amount: parseFloat(amount),
        price: 0.5267,
        status: 'waiting',
        txHash: null
      }
    ],
    estimatedProfit: parseFloat(amount) * 0.0072,
    estimatedFees: parseFloat(amount) * 0.0015,
    netProfit: parseFloat(amount) * 0.0057,
    maxSlippage,
    startTime: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 120000).toISOString(),
    riskScore: 1.2,
    confidence: 0.92
  };
}

async function simulateArbitrage(arbitrageData) {
  const {
    strategy,
    asset,
    amount,
    exchanges
  } = arbitrageData;

  return {
    simulationId: `sim_${Date.now()}`,
    strategy,
    asset,
    amount: parseFloat(amount),
    exchanges,
    results: {
      estimatedProfit: parseFloat(amount) * 0.0125,
      estimatedFees: parseFloat(amount) * 0.002,
      netProfit: parseFloat(amount) * 0.0105,
      profitPercentage: 1.05,
      executionTime: 95,
      slippage: 0.12,
      priceImpact: 0.08,
      successProbability: 0.87,
      riskScore: 1.5
    },
    scenarios: [
      {
        name: 'Best Case',
        probability: 0.15,
        profit: parseFloat(amount) * 0.018,
        profitPercentage: 1.8
      },
      {
        name: 'Expected',
        probability: 0.70,
        profit: parseFloat(amount) * 0.0105,
        profitPercentage: 1.05
      },
      {
        name: 'Worst Case',
        probability: 0.15,
        profit: parseFloat(amount) * -0.005,
        profitPercentage: -0.5
      }
    ],
    recommendations: [
      'Eseguire durante alta liquidità',
      'Monitorare spread in tempo reale',
      'Impostare stop-loss a -0.3%'
    ]
  };
}

async function setArbitrageAlert(alertData) {
  const {
    type,
    asset,
    condition,
    threshold,
    notification = 'email'
  } = alertData;

  return {
    alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    asset,
    condition,
    threshold: parseFloat(threshold),
    notification,
    status: 'active',
    createdAt: new Date().toISOString(),
    estimatedTriggers: 3, // per giorno
    priority: threshold > 2 ? 'high' : 'medium'
  };
}

function getMockArbitrageData(action, asset = 'XRP') {
  switch (action) {
    case 'opportunities':
      return getArbitrageOpportunities(asset, 0.5, 2.0);
    case 'prices':
      return getCrossPlatformPrices(asset);
    case 'analytics':
      return getArbitrageAnalytics();
    case 'alerts':
      return getArbitrageAlerts();
    default:
      return { message: 'Dati mock Arbitrage' };
  }
}

