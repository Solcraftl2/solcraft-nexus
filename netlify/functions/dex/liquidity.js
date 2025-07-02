const Sentry = require('./../utils/sentry.js');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Autenticazione richiesta per operazioni POST/DELETE
  if (req.method !== 'GET') {
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
  }

  try {
    // GET - Informazioni liquidity pools
    if (req.method === 'GET') {
      const {
        action = 'pools', // pools, positions, rewards, analytics
        poolId = null,
        userAddress = null
      } = req.query;

      try {
        let poolData;

        switch (action) {
          case 'pools':
            poolData = await getLiquidityPools();
            break;
          case 'positions':
            poolData = await getUserLiquidityPositions(userAddress);
            break;
          case 'rewards':
            poolData = await getLiquidityRewards(userAddress);
            break;
          case 'analytics':
            poolData = await getLiquidityAnalytics(poolId);
            break;
          default:
            throw new Error('Azione non supportata');
        }

        return res.status(200).json({
          success: true,
          data: poolData,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore Liquidity GET:', error);
        
        // Fallback a dati mock per sviluppo
        const mockData = getMockLiquidityData(req.query.action);
        return res.status(200).json({
          success: true,
          data: mockData,
          mock: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST - Aggiungi liquidità
    if (req.method === 'POST') {
      const { action, ...liquidityData } = req.body;

      try {
        let result;

        switch (action) {
          case 'add_liquidity':
            result = await addLiquidity(liquidityData);
            break;
          case 'remove_liquidity':
            result = await removeLiquidity(liquidityData);
            break;
          case 'claim_rewards':
            result = await claimLiquidityRewards(liquidityData);
            break;
          case 'stake_lp_tokens':
            result = await stakeLPTokens(liquidityData);
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
        console.error('Errore Liquidity POST:', error);
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
    console.error('Errore generale Liquidity:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      timestamp: new Date().toISOString()
    });
  }
}

// Funzioni helper per Liquidity Pools
async function getLiquidityPools() {
  return {
    totalPools: 12,
    totalLiquidity: 15750000,
    totalVolume24h: 3850000,
    totalFees24h: 15400,
    pools: [
      {
        id: 'pool_xrp_usd',
        name: 'XRP/USD Pool',
        token0: { symbol: 'XRP', name: 'XRP', address: 'native' },
        token1: { symbol: 'USD', name: 'USD Stablecoin', address: 'rUSDIssuer...' },
        liquidity: 8500000,
        volume24h: 2100000,
        volume7d: 14700000,
        fees24h: 8400,
        apy: 12.5,
        apr: 11.8,
        fee: 0.3,
        reserve0: 16346154, // XRP
        reserve1: 8500000,  // USD
        price: 0.52,
        priceChange24h: 5.2,
        lpTokenSupply: 11747340,
        participants: 1247,
        impermanentLoss: -2.1,
        status: 'active'
      },
      {
        id: 'pool_rlusd_xrp',
        name: 'RLUSD/XRP Pool',
        token0: { symbol: 'RLUSD', name: 'Ripple USD', address: 'rRLUSDIssuer...' },
        token1: { symbol: 'XRP', name: 'XRP', address: 'native' },
        liquidity: 4200000,
        volume24h: 980000,
        volume7d: 6860000,
        fees24h: 3920,
        apy: 15.2,
        apr: 14.1,
        fee: 0.3,
        reserve0: 2187500, // RLUSD
        reserve1: 4200000, // XRP
        price: 1.92,
        priceChange24h: -2.1,
        lpTokenSupply: 3041381,
        participants: 892,
        impermanentLoss: 1.8,
        status: 'active'
      },
      {
        id: 'pool_solo_xrp',
        name: 'SOLO/XRP Pool',
        token0: { symbol: 'SOLO', name: 'Sologenic', address: 'rSOLOIssuer...' },
        token1: { symbol: 'XRP', name: 'XRP', address: 'native' },
        liquidity: 1850000,
        volume24h: 450000,
        volume7d: 3150000,
        fees24h: 1800,
        apy: 18.7,
        apr: 17.2,
        fee: 0.3,
        reserve0: 6607143, // SOLO
        reserve1: 1850000, // XRP
        price: 0.28,
        priceChange24h: 12.8,
        lpTokenSupply: 3502976,
        participants: 634,
        impermanentLoss: -5.4,
        status: 'active'
      }
    ],
    topPerformers: [
      { poolId: 'pool_solo_xrp', apy: 18.7, volume24h: 450000 },
      { poolId: 'pool_rlusd_xrp', apy: 15.2, volume24h: 980000 },
      { poolId: 'pool_xrp_usd', apy: 12.5, volume24h: 2100000 }
    ]
  };
}

async function getUserLiquidityPositions(userAddress) {
  if (!userAddress) {
    return { positions: [], totalValue: 0, totalRewards: 0 };
  }

  return {
    totalPositions: 3,
    totalValue: 125000,
    totalRewards: 2847,
    unrealizedPnL: 3420,
    positions: [
      {
        poolId: 'pool_xrp_usd',
        poolName: 'XRP/USD Pool',
        lpTokens: 2500,
        shareOfPool: 0.021, // 2.1%
        token0Amount: 2564, // XRP
        token1Amount: 1333, // USD
        currentValue: 85000,
        initialValue: 82000,
        unrealizedPnL: 3000,
        impermanentLoss: -420,
        rewards: {
          pending: 125,
          claimed: 1847,
          total: 1972
        },
        apy: 12.5,
        entryDate: '2024-05-15T10:30:00Z',
        lastRewardClaim: '2024-06-20T14:22:00Z'
      },
      {
        poolId: 'pool_rlusd_xrp',
        poolName: 'RLUSD/XRP Pool',
        lpTokens: 1200,
        shareOfPool: 0.039, // 3.9%
        token0Amount: 854, // RLUSD
        token1Amount: 1640, // XRP
        currentValue: 28000,
        initialValue: 27200,
        unrealizedPnL: 800,
        impermanentLoss: 180,
        rewards: {
          pending: 89,
          claimed: 654,
          total: 743
        },
        apy: 15.2,
        entryDate: '2024-04-22T16:45:00Z',
        lastRewardClaim: '2024-06-18T09:15:00Z'
      },
      {
        poolId: 'pool_solo_xrp',
        poolName: 'SOLO/XRP Pool',
        lpTokens: 800,
        shareOfPool: 0.023, // 2.3%
        token0Amount: 42857, // SOLO
        token1Amount: 12000, // XRP
        currentValue: 12000,
        initialValue: 11620,
        unrealizedPnL: 380,
        impermanentLoss: -280,
        rewards: {
          pending: 45,
          claimed: 87,
          total: 132
        },
        apy: 18.7,
        entryDate: '2024-06-01T11:20:00Z',
        lastRewardClaim: '2024-06-15T13:40:00Z'
      }
    ]
  };
}

async function getLiquidityRewards(userAddress) {
  if (!userAddress) {
    return { totalRewards: 0, claimableRewards: 0, rewardHistory: [] };
  }

  return {
    totalEarned: 2847,
    totalClaimed: 2588,
    claimableRewards: 259,
    estimatedDaily: 12.5,
    estimatedMonthly: 375,
    estimatedYearly: 4500,
    rewardBreakdown: [
      {
        poolId: 'pool_xrp_usd',
        poolName: 'XRP/USD Pool',
        earned: 1972,
        claimed: 1847,
        claimable: 125,
        apy: 12.5,
        dailyRate: 5.4
      },
      {
        poolId: 'pool_rlusd_xrp',
        poolName: 'RLUSD/XRP Pool',
        earned: 743,
        claimed: 654,
        claimable: 89,
        apy: 15.2,
        dailyRate: 4.2
      },
      {
        poolId: 'pool_solo_xrp',
        poolName: 'SOLO/XRP Pool',
        earned: 132,
        claimed: 87,
        claimable: 45,
        apy: 18.7,
        dailyRate: 2.9
      }
    ],
    rewardHistory: [
      {
        date: '2024-06-20',
        poolId: 'pool_xrp_usd',
        amount: 125,
        txHash: 'reward_claim_abc123',
        status: 'completed'
      },
      {
        date: '2024-06-18',
        poolId: 'pool_rlusd_xrp',
        amount: 89,
        txHash: 'reward_claim_def456',
        status: 'completed'
      }
    ]
  };
}

async function getLiquidityAnalytics(poolId) {
  const baseAnalytics = {
    timeframes: ['1h', '24h', '7d', '30d'],
    metrics: {
      volume: [125000, 2100000, 14700000, 63000000],
      liquidity: [8400000, 8500000, 8200000, 7800000],
      fees: [500, 8400, 58800, 252000],
      participants: [1240, 1247, 1198, 1089],
      apy: [12.8, 12.5, 13.2, 14.1]
    },
    priceHistory: [
      { timestamp: '2024-06-25T00:00:00Z', price: 0.52, volume: 87500 },
      { timestamp: '2024-06-24T00:00:00Z', price: 0.495, volume: 92000 },
      { timestamp: '2024-06-23T00:00:00Z', price: 0.488, volume: 78000 },
      { timestamp: '2024-06-22T00:00:00Z', price: 0.502, volume: 105000 }
    ],
    impermanentLoss: {
      current: -2.1,
      max: -8.5,
      min: 1.2,
      average: -1.8
    },
    topProviders: [
      { address: 'rProvider1...', share: 8.5, value: 722500 },
      { address: 'rProvider2...', share: 6.2, value: 527000 },
      { address: 'rProvider3...', share: 4.8, value: 408000 }
    ]
  };

  if (poolId) {
    return {
      poolId,
      ...baseAnalytics,
      poolSpecific: {
        utilization: 0.78,
        efficiency: 0.92,
        slippage: 0.15,
        correlation: 0.65
      }
    };
  }

  return baseAnalytics;
}

async function addLiquidity(liquidityData) {
  const {
    poolId,
    token0Amount,
    token1Amount,
    slippageTolerance = 0.5,
    deadline = 20 // minuti
  } = liquidityData;

  // Simulazione aggiunta liquidità
  const lpTokensReceived = Math.sqrt(parseFloat(token0Amount) * parseFloat(token1Amount));
  
  return {
    poolId,
    token0Amount: parseFloat(token0Amount),
    token1Amount: parseFloat(token1Amount),
    lpTokensReceived,
    shareOfPool: lpTokensReceived / 11747340, // Basato su supply totale
    estimatedFees: {
      daily: lpTokensReceived * 0.0034,
      monthly: lpTokensReceived * 0.104,
      yearly: lpTokensReceived * 1.25
    },
    priceImpact: 0.02,
    slippageTolerance,
    deadline: new Date(Date.now() + deadline * 60000).toISOString(),
    txHash: `add_liquidity_${Math.random().toString(36).substr(2, 16)}`,
    status: 'pending',
    estimatedConfirmation: new Date(Date.now() + 4000).toISOString()
  };
}

async function removeLiquidity(liquidityData) {
  const {
    poolId,
    lpTokenAmount,
    minToken0Amount,
    minToken1Amount
  } = liquidityData;

  return {
    poolId,
    lpTokensBurned: parseFloat(lpTokenAmount),
    token0Received: parseFloat(lpTokenAmount) * 1.02, // Esempio calcolo
    token1Received: parseFloat(lpTokenAmount) * 0.52,
    fees: {
      withdrawal: parseFloat(lpTokenAmount) * 0.001,
      currency: 'XRP'
    },
    txHash: `remove_liquidity_${Math.random().toString(36).substr(2, 16)}`,
    status: 'pending',
    estimatedConfirmation: new Date(Date.now() + 4000).toISOString()
  };
}

async function claimLiquidityRewards(liquidityData) {
  const { poolIds = [], claimAll = false } = liquidityData;

  const rewards = claimAll ? 259 : poolIds.length * 85; // Esempio

  return {
    totalClaimed: rewards,
    poolsClaimed: claimAll ? ['pool_xrp_usd', 'pool_rlusd_xrp', 'pool_solo_xrp'] : poolIds,
    breakdown: [
      { poolId: 'pool_xrp_usd', amount: 125 },
      { poolId: 'pool_rlusd_xrp', amount: 89 },
      { poolId: 'pool_solo_xrp', amount: 45 }
    ],
    txHash: `claim_rewards_${Math.random().toString(36).substr(2, 16)}`,
    status: 'pending',
    estimatedConfirmation: new Date(Date.now() + 3000).toISOString()
  };
}

async function stakeLPTokens(liquidityData) {
  const { poolId, lpTokenAmount, stakingPeriod = 30 } = liquidityData;

  return {
    poolId,
    stakedAmount: parseFloat(lpTokenAmount),
    stakingPeriod, // giorni
    bonusApy: 2.5, // Bonus APY per staking
    totalApy: 15.0, // APY base + bonus
    unlockDate: new Date(Date.now() + stakingPeriod * 24 * 60 * 60 * 1000).toISOString(),
    estimatedRewards: parseFloat(lpTokenAmount) * 0.15 * (stakingPeriod / 365),
    txHash: `stake_lp_${Math.random().toString(36).substr(2, 16)}`,
    status: 'pending'
  };
}

function getMockLiquidityData(action) {
  switch (action) {
    case 'pools':
      return getLiquidityPools();
    case 'positions':
      return getUserLiquidityPositions('rMockUser...');
    case 'rewards':
      return getLiquidityRewards('rMockUser...');
    case 'analytics':
      return getLiquidityAnalytics();
    default:
      return { message: 'Dati mock Liquidity' };
  }
}

