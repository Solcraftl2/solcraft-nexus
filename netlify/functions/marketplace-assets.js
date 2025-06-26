import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // GET - Lista asset marketplace con integrazione DEX
    if (req.method === 'GET') {
      const {
        category = 'all', // all, real_estate, commodities, art, energy, financial
        sortBy = 'market_cap', // market_cap, price, volume, yield, performance, liquidity
        sortOrder = 'desc',
        search = '',
        minPrice = 0,
        maxPrice = null,
        minYield = 0,
        maxYield = null,
        minLiquidity = 0,
        page = 1,
        limit = 20,
        featured = false,
        verified = true,
        tradeable = false // Solo asset tradabili su DEX
      } = req.query;

      try {
        const marketplaceAssets = await getMarketplaceAssetsWithDEX({
          category,
          sortBy,
          sortOrder,
          search,
          filters: {
            minPrice: parseFloat(minPrice),
            maxPrice: maxPrice ? parseFloat(maxPrice) : null,
            minYield: parseFloat(minYield),
            maxYield: maxYield ? parseFloat(maxYield) : null,
            minLiquidity: parseFloat(minLiquidity),
            featured: featured === 'true',
            verified: verified === 'true',
            tradeable: tradeable === 'true'
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          }
        });

        return res.status(200).json({
          success: true,
          data: marketplaceAssets,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore Marketplace GET:', error);
        
        // Fallback a dati mock per sviluppo
        const mockData = getMockMarketplaceData(req.query);
        return res.status(200).json({
          success: true,
          data: mockData,
          mock: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST - Crea nuovo asset o listing
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
      
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Token non valido'
        });
      }

      const { action, ...assetData } = req.body;

      try {
        let result;

        switch (action) {
          case 'create_listing':
            result = await createMarketplaceListing(assetData, decoded.userId);
            break;
          case 'buy_asset':
            result = await buyMarketplaceAsset(assetData, decoded.userId);
            break;
          case 'sell_asset':
            result = await sellMarketplaceAsset(assetData, decoded.userId);
            break;
          case 'place_bid':
            result = await placeAssetBid(assetData, decoded.userId);
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
        console.error('Errore Marketplace POST:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // PUT - Aggiorna asset esistente
    if (req.method === 'PUT') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token di autenticazione richiesto'
        });
      }

      const { assetId, ...updateData } = req.body;

      try {
        const result = await updateMarketplaceAsset(assetId, updateData);
        
        return res.status(200).json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore Marketplace PUT:', error);
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
    console.error('Errore generale Marketplace:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      timestamp: new Date().toISOString()
    });
  }
}

// Funzioni helper per Marketplace con integrazione DEX
async function getMarketplaceAssetsWithDEX(params) {
  const { category, sortBy, sortOrder, search, filters, pagination } = params;

  // Simulazione recupero asset con dati DEX integrati
  const allAssets = await generateMarketplaceAssets();
  
  // Filtri
  let filteredAssets = allAssets.filter(asset => {
    if (category !== 'all' && asset.category !== category) return false;
    if (search && !asset.name.toLowerCase().includes(search.toLowerCase()) && 
        !asset.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (asset.price < filters.minPrice) return false;
    if (filters.maxPrice && asset.price > filters.maxPrice) return false;
    if (asset.yield < filters.minYield) return false;
    if (filters.maxYield && asset.yield > filters.maxYield) return false;
    if (asset.dexData.liquidity < filters.minLiquidity) return false;
    if (filters.featured && !asset.featured) return false;
    if (filters.verified && !asset.verified) return false;
    if (filters.tradeable && !asset.dexData.tradeable) return false;
    
    return true;
  });

  // Ordinamento
  filteredAssets.sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'price':
        aVal = a.price;
        bVal = b.price;
        break;
      case 'yield':
        aVal = a.yield;
        bVal = b.yield;
        break;
      case 'volume':
        aVal = a.dexData.volume24h;
        bVal = b.dexData.volume24h;
        break;
      case 'liquidity':
        aVal = a.dexData.liquidity;
        bVal = b.dexData.liquidity;
        break;
      case 'performance':
        aVal = a.performance.return30d;
        bVal = b.performance.return30d;
        break;
      case 'market_cap':
      default:
        aVal = a.marketCap;
        bVal = b.marketCap;
        break;
    }
    
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Paginazione
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  return {
    assets: paginatedAssets,
    pagination: {
      currentPage: pagination.page,
      totalPages: Math.ceil(filteredAssets.length / pagination.limit),
      totalItems: filteredAssets.length,
      itemsPerPage: pagination.limit,
      hasNext: endIndex < filteredAssets.length,
      hasPrev: pagination.page > 1
    },
    summary: {
      totalAssets: allAssets.length,
      filteredAssets: filteredAssets.length,
      categories: getAssetCategories(allAssets),
      priceRange: getPriceRange(filteredAssets),
      yieldRange: getYieldRange(filteredAssets),
      totalMarketCap: filteredAssets.reduce((sum, asset) => sum + asset.marketCap, 0),
      totalVolume24h: filteredAssets.reduce((sum, asset) => sum + asset.dexData.volume24h, 0),
      avgLiquidity: filteredAssets.reduce((sum, asset) => sum + asset.dexData.liquidity, 0) / filteredAssets.length
    },
    dexStats: {
      totalLiquidity: 15750000,
      totalVolume24h: 3850000,
      activePairs: 18,
      avgSpread: 0.15
    }
  };
}

async function generateMarketplaceAssets() {
  return [
    {
      id: 'asset_manhattan_office_001',
      name: 'Manhattan Office Complex A',
      description: 'Premium office building in Midtown Manhattan with 95% occupancy rate',
      category: 'real_estate',
      subcategory: 'commercial_office',
      price: 125.50,
      marketCap: 12550000,
      totalSupply: 100000,
      circulatingSupply: 85000,
      yield: 8.5,
      featured: true,
      verified: true,
      images: [
        'https://example.com/manhattan-office-1.jpg',
        'https://example.com/manhattan-office-2.jpg'
      ],
      location: {
        address: '123 Park Avenue, New York, NY 10017',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        neighborhood: 'Midtown Manhattan'
      },
      assetDetails: {
        propertyType: 'Office Building',
        totalArea: 250000, // sq ft
        yearBuilt: 1985,
        lastRenovated: 2020,
        occupancyRate: 0.95,
        avgRentPsf: 85,
        tenants: 45,
        parkingSpaces: 150
      },
      financials: {
        grossRent: 21250000,
        operatingExpenses: 8500000,
        noi: 12750000,
        capRate: 0.085,
        cashFlow: 1062500,
        appreciation: 0.035
      },
      performance: {
        return1d: 0.2,
        return7d: 1.8,
        return30d: 5.2,
        return1y: 12.8,
        volatility: 0.15,
        sharpeRatio: 1.85
      },
      dexData: {
        tradeable: true,
        tokenAddress: 'rManhattanOffice001...',
        liquidity: 2850000,
        volume24h: 485000,
        volume7d: 3395000,
        priceChange24h: 0.2,
        spread: 0.12,
        marketDepth: {
          bids: 1425000,
          asks: 1425000
        },
        lastTrade: new Date(Date.now() - 300000).toISOString(),
        tradingPairs: ['MANO/XRP', 'MANO/USD']
      },
      compliance: {
        secCompliant: true,
        kycRequired: true,
        accreditedOnly: true,
        jurisdiction: 'US',
        regulatoryStatus: 'Approved'
      },
      issuer: {
        name: 'Manhattan Real Estate Tokenization LLC',
        address: 'rManhattanRETokens...',
        verified: true,
        rating: 'A+',
        totalAssetsTokenized: 15
      },
      createdAt: '2024-03-15T10:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'asset_gold_bars_002',
      name: 'LBMA Gold Bars Vault A',
      description: 'Physical gold bars stored in LBMA certified vault with full insurance',
      category: 'commodities',
      subcategory: 'precious_metals',
      price: 2045.75,
      marketCap: 20457500,
      totalSupply: 10000,
      circulatingSupply: 8500,
      yield: 0.0, // Gold doesn't yield
      featured: true,
      verified: true,
      images: [
        'https://example.com/gold-bars-1.jpg',
        'https://example.com/vault-storage.jpg'
      ],
      location: {
        address: 'LBMA Certified Vault, London, UK',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        facility: 'Brinks Vault London'
      },
      assetDetails: {
        metalType: 'Gold',
        purity: 0.9999, // 99.99% pure
        totalWeight: 10000, // troy ounces
        barCount: 400,
        avgBarWeight: 25, // troy ounces
        certification: 'LBMA Good Delivery',
        assayReport: 'Available',
        insurance: 'Lloyd\'s of London'
      },
      financials: {
        spotPrice: 2045.75,
        premiumOverSpot: 0.015, // 1.5%
        storageFeesAnnual: 0.005, // 0.5%
        insuranceFeesAnnual: 0.002, // 0.2%
        totalFeesAnnual: 0.007 // 0.7%
      },
      performance: {
        return1d: -0.5,
        return7d: 2.1,
        return30d: 3.8,
        return1y: 8.2,
        volatility: 0.18,
        sharpeRatio: 0.95
      },
      dexData: {
        tradeable: true,
        tokenAddress: 'rGoldBarsVaultA...',
        liquidity: 4250000,
        volume24h: 820000,
        volume7d: 5740000,
        priceChange24h: -0.5,
        spread: 0.08,
        marketDepth: {
          bids: 2125000,
          asks: 2125000
        },
        lastTrade: new Date(Date.now() - 180000).toISOString(),
        tradingPairs: ['GOLD/XRP', 'GOLD/USD', 'GOLD/RLUSD']
      },
      compliance: {
        secCompliant: true,
        kycRequired: true,
        accreditedOnly: false,
        jurisdiction: 'UK',
        regulatoryStatus: 'Approved'
      },
      issuer: {
        name: 'Precious Metals Tokenization Ltd',
        address: 'rPreciousMetals...',
        verified: true,
        rating: 'AA',
        totalAssetsTokenized: 8
      },
      createdAt: '2024-02-20T14:30:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'asset_picasso_painting_003',
      name: 'Picasso Blue Period Masterpiece',
      description: 'Authenticated Picasso painting from Blue Period, museum quality',
      category: 'art',
      subcategory: 'paintings',
      price: 8500.00,
      marketCap: 8500000,
      totalSupply: 1000,
      circulatingSupply: 750,
      yield: 0.0, // Art appreciation only
      featured: true,
      verified: true,
      images: [
        'https://example.com/picasso-painting.jpg',
        'https://example.com/authentication-cert.jpg'
      ],
      location: {
        address: 'Secure Art Storage Facility, Geneva, Switzerland',
        coordinates: { lat: 46.2044, lng: 6.1432 },
        facility: 'Geneva Freeport'
      },
      assetDetails: {
        artist: 'Pablo Picasso',
        title: 'Blue Period Study #47',
        year: 1903,
        medium: 'Oil on Canvas',
        dimensions: '73 x 60 cm',
        provenance: 'Documented since 1920',
        authentication: 'Picasso Administration',
        condition: 'Excellent',
        insurance: 'AXA Art Insurance'
      },
      financials: {
        lastAppraisal: 8500000,
        appraisalDate: '2024-01-15',
        appreciationRate: 0.12, // 12% annual
        insuranceValue: 8500000,
        storageFeesAnnual: 0.01, // 1%
        insuranceFeesAnnual: 0.005 // 0.5%
      },
      performance: {
        return1d: 0.0,
        return7d: 0.8,
        return30d: 2.5,
        return1y: 15.2,
        volatility: 0.25,
        sharpeRatio: 1.25
      },
      dexData: {
        tradeable: true,
        tokenAddress: 'rPicassoBlue003...',
        liquidity: 1275000,
        volume24h: 127500,
        volume7d: 892500,
        priceChange24h: 0.0,
        spread: 0.25,
        marketDepth: {
          bids: 637500,
          asks: 637500
        },
        lastTrade: new Date(Date.now() - 3600000).toISOString(),
        tradingPairs: ['PICA/XRP', 'PICA/USD']
      },
      compliance: {
        secCompliant: true,
        kycRequired: true,
        accreditedOnly: true,
        jurisdiction: 'CH',
        regulatoryStatus: 'Approved'
      },
      issuer: {
        name: 'Fine Art Tokenization SA',
        address: 'rFineArtTokens...',
        verified: true,
        rating: 'A',
        totalAssetsTokenized: 25
      },
      createdAt: '2024-01-20T09:15:00Z',
      updatedAt: new Date().toISOString()
    }
  ];
}

async function createMarketplaceListing(assetData, userId) {
  const {
    assetType,
    name,
    description,
    category,
    price,
    totalSupply,
    yield: assetYield,
    location,
    assetDetails,
    compliance
  } = assetData;

  const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    listingId,
    assetId: `asset_${Date.now()}`,
    name,
    description,
    category,
    price: parseFloat(price),
    totalSupply: parseInt(totalSupply),
    yield: parseFloat(assetYield),
    status: 'pending_review',
    seller: userId,
    location,
    assetDetails,
    compliance,
    dexIntegration: {
      tokenAddress: `r${listingId.toUpperCase()}...`,
      tradeable: false, // Attivato dopo approvazione
      estimatedLiquidity: parseFloat(price) * parseInt(totalSupply) * 0.1
    },
    fees: {
      listingFee: parseFloat(price) * parseInt(totalSupply) * 0.001,
      tradingFee: 0.003, // 0.3%
      withdrawalFee: 0.001 // 0.1%
    },
    timeline: {
      listed: new Date().toISOString(),
      reviewPeriod: 7, // giorni
      estimatedApproval: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

async function buyMarketplaceAsset(assetData, userId) {
  const {
    assetId,
    quantity,
    maxPrice,
    orderType = 'market' // market, limit
  } = assetData;

  const orderId = `buy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    orderId,
    assetId,
    type: 'buy',
    orderType,
    quantity: parseInt(quantity),
    maxPrice: parseFloat(maxPrice),
    estimatedTotal: parseInt(quantity) * parseFloat(maxPrice),
    fees: {
      tradingFee: parseInt(quantity) * parseFloat(maxPrice) * 0.003,
      networkFee: 2.5,
      total: (parseInt(quantity) * parseFloat(maxPrice) * 0.003) + 2.5
    },
    status: 'pending',
    buyer: userId,
    dexExecution: {
      useAMM: true,
      slippageTolerance: 0.5,
      priceImpact: 0.12,
      estimatedSettlement: new Date(Date.now() + 30000).toISOString()
    },
    createdAt: new Date().toISOString()
  };
}

async function sellMarketplaceAsset(assetData, userId) {
  const {
    assetId,
    quantity,
    minPrice,
    orderType = 'market'
  } = assetData;

  const orderId = `sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    orderId,
    assetId,
    type: 'sell',
    orderType,
    quantity: parseInt(quantity),
    minPrice: parseFloat(minPrice),
    estimatedTotal: parseInt(quantity) * parseFloat(minPrice),
    fees: {
      tradingFee: parseInt(quantity) * parseFloat(minPrice) * 0.003,
      networkFee: 2.5,
      total: (parseInt(quantity) * parseFloat(minPrice) * 0.003) + 2.5
    },
    status: 'pending',
    seller: userId,
    dexExecution: {
      useAMM: true,
      slippageTolerance: 0.5,
      priceImpact: 0.08,
      estimatedSettlement: new Date(Date.now() + 30000).toISOString()
    },
    createdAt: new Date().toISOString()
  };
}

async function placeAssetBid(assetData, userId) {
  const {
    assetId,
    bidPrice,
    quantity,
    expirationHours = 24
  } = assetData;

  const bidId = `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    bidId,
    assetId,
    bidder: userId,
    bidPrice: parseFloat(bidPrice),
    quantity: parseInt(quantity),
    totalBid: parseFloat(bidPrice) * parseInt(quantity),
    status: 'active',
    expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
    escrow: {
      amount: parseFloat(bidPrice) * parseInt(quantity),
      currency: 'XRP',
      escrowAddress: 'rEscrowBid...',
      releaseConditions: 'Bid acceptance or expiration'
    },
    createdAt: new Date().toISOString()
  };
}

async function updateMarketplaceAsset(assetId, updateData) {
  return {
    assetId,
    updatedFields: Object.keys(updateData),
    updateData,
    status: 'updated',
    updatedAt: new Date().toISOString(),
    dexSync: {
      priceUpdated: updateData.price ? true : false,
      liquidityAdjusted: updateData.totalSupply ? true : false,
      metadataRefreshed: true
    }
  };
}

// Funzioni helper
function getAssetCategories(assets) {
  const categories = {};
  assets.forEach(asset => {
    categories[asset.category] = (categories[asset.category] || 0) + 1;
  });
  return categories;
}

function getPriceRange(assets) {
  if (assets.length === 0) return { min: 0, max: 0 };
  const prices = assets.map(asset => asset.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

function getYieldRange(assets) {
  if (assets.length === 0) return { min: 0, max: 0 };
  const yields = assets.map(asset => asset.yield);
  return {
    min: Math.min(...yields),
    max: Math.max(...yields)
  };
}

function getMockMarketplaceData(query) {
  return {
    assets: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20,
      hasNext: false,
      hasPrev: false
    },
    summary: {
      totalAssets: 0,
      filteredAssets: 0,
      categories: {},
      priceRange: { min: 0, max: 0 },
      yieldRange: { min: 0, max: 0 },
      totalMarketCap: 0,
      totalVolume24h: 0,
      avgLiquidity: 0
    },
    dexStats: {
      totalLiquidity: 15750000,
      totalVolume24h: 3850000,
      activePairs: 18,
      avgSpread: 0.15
    }
  };
}

