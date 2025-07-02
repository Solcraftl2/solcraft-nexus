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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      // Authorization is optional for marketplace browsing
      const authHeader = req.headers.authorization
      let isAuthenticated = !!authHeader

      // Get query parameters for filtering and pagination
      const { 
        type, 
        minPrice, 
        maxPrice,
        minYield,
        maxYield,
        location,
        riskLevel,
        limit = 12, 
        offset = 0, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        search,
        featured = false
      } = req.query

      // In a real implementation, you would:
      // 1. Query database for all available tokenized assets
      // 2. Apply filters and search criteria
      // 3. Get real-time prices and availability
      // 4. Calculate yields and performance metrics

      // Mock marketplace assets data
      const marketplaceAssets = [
        {
          id: 'market_1',
          name: 'Villa Toscana Premium',
          type: 'Immobiliare',
          category: 'real_estate',
          description: 'Villa storica del 1800 con 200mq e giardino privato in Chianti',
          images: [
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
          ],
          totalValue: 450000,
          currency: 'EUR',
          token: {
            symbol: 'VTOS',
            name: 'Villa Toscana Token',
            totalSupply: 45000,
            price: 10.0,
            availableTokens: 15000,
            minPurchase: 100,
            maxPurchase: 5000
          },
          performance: {
            annualYield: 8.5,
            historicalReturns: [6.2, 7.8, 8.1, 8.5],
            projectedYield: 9.2,
            riskLevel: 'medium',
            riskScore: 6
          },
          location: {
            region: 'Toscana',
            city: 'Greve in Chianti',
            country: 'Italy',
            coordinates: { lat: 43.5853, lng: 11.3094 }
          },
          details: {
            size: '200 mq',
            bedrooms: 4,
            bathrooms: 3,
            yearBuilt: 1800,
            renovated: 2020,
            features: ['Giardino privato', 'Piscina', 'Vista panoramica', 'Cantina vini']
          },
          financials: {
            rentalIncome: 2500, // monthly
            expenses: 800, // monthly
            netYield: 8.5,
            occupancyRate: 92
          },
          verification: {
            verified: true,
            auditDate: '2024-12-15',
            legalCompliance: true,
            insurance: true
          },
          seller: {
            name: 'Immobiliare Toscana SRL',
            rating: 4.8,
            verified: true,
            totalSales: 25
          },
          featured: true,
          createdAt: '2024-11-01T10:00:00Z',
          updatedAt: '2025-06-20T14:30:00Z'
        },
        {
          id: 'market_2',
          name: 'Startup GreenTech Solutions',
          type: 'Equity',
          category: 'business',
          description: 'Startup innovativa nel settore delle energie rinnovabili',
          images: [
            'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800',
            'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800'
          ],
          totalValue: 2000000,
          currency: 'EUR',
          token: {
            symbol: 'GREEN',
            name: 'GreenTech Equity Token',
            totalSupply: 200000,
            price: 10.0,
            availableTokens: 50000,
            minPurchase: 500,
            maxPurchase: 10000
          },
          performance: {
            annualYield: 15.2,
            historicalReturns: [12.1, 14.5, 15.2],
            projectedYield: 18.5,
            riskLevel: 'high',
            riskScore: 8
          },
          business: {
            sector: 'Clean Energy',
            employees: 45,
            revenue: 1200000,
            growth: 85, // percentage
            stage: 'Series B',
            founded: '2021-06-01'
          },
          financials: {
            revenue: 1200000,
            profit: 180000,
            burnRate: 50000, // monthly
            runway: 24, // months
            lastRound: 5000000
          },
          verification: {
            verified: true,
            auditDate: '2024-10-30',
            legalCompliance: true,
            insurance: true
          },
          seller: {
            name: 'GreenTech Ventures',
            rating: 4.9,
            verified: true,
            totalSales: 8
          },
          featured: true,
          createdAt: '2024-09-15T09:00:00Z',
          updatedAt: '2025-06-18T16:45:00Z'
        },
        {
          id: 'market_3',
          name: 'Collezione Orologi Vintage',
          type: 'Collectibles',
          category: 'luxury',
          description: 'Collezione di 12 orologi vintage Rolex e Patek Philippe',
          images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
            'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800'
          ],
          totalValue: 180000,
          currency: 'EUR',
          token: {
            symbol: 'WATCH',
            name: 'Vintage Watch Token',
            totalSupply: 18000,
            price: 10.0,
            availableTokens: 9000,
            minPurchase: 50,
            maxPurchase: 2000
          },
          performance: {
            annualYield: 12.8,
            historicalReturns: [10.2, 11.5, 12.8],
            projectedYield: 14.2,
            riskLevel: 'medium-high',
            riskScore: 7
          },
          collection: {
            pieces: 12,
            brands: ['Rolex', 'Patek Philippe', 'Audemars Piguet'],
            period: '1950-1980',
            condition: 'Excellent',
            authenticated: true,
            insured: true
          },
          financials: {
            appreciationRate: 12.8,
            maintenanceCost: 200, // monthly
            insuranceCost: 150, // monthly
            storageSecure: true
          },
          verification: {
            verified: true,
            auditDate: '2024-08-20',
            legalCompliance: true,
            insurance: true
          },
          seller: {
            name: 'Luxury Collectibles Ltd',
            rating: 4.7,
            verified: true,
            totalSales: 15
          },
          featured: false,
          createdAt: '2024-08-01T11:30:00Z',
          updatedAt: '2025-06-10T13:20:00Z'
        },
        {
          id: 'market_4',
          name: 'Appartamento Roma Centro',
          type: 'Immobiliare',
          category: 'real_estate',
          description: 'Appartamento di 120mq nel centro storico di Roma',
          images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
          ],
          totalValue: 320000,
          currency: 'EUR',
          token: {
            symbol: 'ROMA',
            name: 'Roma Centro Token',
            totalSupply: 32000,
            price: 10.0,
            availableTokens: 20000,
            minPurchase: 100,
            maxPurchase: 3000
          },
          performance: {
            annualYield: 7.2,
            historicalReturns: [6.8, 7.0, 7.2],
            projectedYield: 7.8,
            riskLevel: 'low-medium',
            riskScore: 4
          },
          location: {
            region: 'Lazio',
            city: 'Roma',
            neighborhood: 'Centro Storico',
            country: 'Italy',
            coordinates: { lat: 41.9028, lng: 12.4964 }
          },
          details: {
            size: '120 mq',
            bedrooms: 3,
            bathrooms: 2,
            yearBuilt: 1920,
            renovated: 2022,
            features: ['Balcone', 'Ascensore', 'Aria condizionata', 'Vista monumenti']
          },
          financials: {
            rentalIncome: 1800, // monthly
            expenses: 400, // monthly
            netYield: 7.2,
            occupancyRate: 95
          },
          verification: {
            verified: true,
            auditDate: '2024-05-10',
            legalCompliance: true,
            insurance: true
          },
          seller: {
            name: 'Roma Properties SpA',
            rating: 4.6,
            verified: true,
            totalSales: 32
          },
          featured: false,
          createdAt: '2024-05-01T14:00:00Z',
          updatedAt: '2025-06-05T10:15:00Z'
        }
      ]

      // Apply filters
      let filteredAssets = marketplaceAssets

      if (type) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.type.toLowerCase() === type.toLowerCase()
        )
      }

      if (minPrice) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.token.price >= parseFloat(minPrice)
        )
      }

      if (maxPrice) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.token.price <= parseFloat(maxPrice)
        )
      }

      if (minYield) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.performance.annualYield >= parseFloat(minYield)
        )
      }

      if (maxYield) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.performance.annualYield <= parseFloat(maxYield)
        )
      }

      if (location) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.location && asset.location.city.toLowerCase().includes(location.toLowerCase())
        )
      }

      if (riskLevel) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.performance.riskLevel === riskLevel
        )
      }

      if (featured === 'true') {
        filteredAssets = filteredAssets.filter(asset => asset.featured)
      }

      if (search) {
        const searchLower = search.toLowerCase()
        filteredAssets = filteredAssets.filter(asset => 
          asset.name.toLowerCase().includes(searchLower) ||
          asset.description.toLowerCase().includes(searchLower) ||
          asset.type.toLowerCase().includes(searchLower)
        )
      }

      // Apply sorting
      filteredAssets.sort((a, b) => {
        let aValue, bValue
        
        switch (sortBy) {
          case 'price':
            aValue = a.token.price
            bValue = b.token.price
            break
          case 'yield':
            aValue = a.performance.annualYield
            bValue = b.performance.annualYield
            break
          case 'value':
            aValue = a.totalValue
            bValue = b.totalValue
            break
          case 'risk':
            aValue = a.performance.riskScore
            bValue = b.performance.riskScore
            break
          default:
            aValue = new Date(a[sortBy])
            bValue = new Date(b[sortBy])
        }
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1
        } else {
          return aValue > bValue ? 1 : -1
        }
      })

      // Apply pagination
      const startIndex = parseInt(offset)
      const endIndex = startIndex + parseInt(limit)
      const paginatedAssets = filteredAssets.slice(startIndex, endIndex)

      // Calculate market statistics
      const marketStats = {
        totalAssets: filteredAssets.length,
        totalValue: filteredAssets.reduce((sum, asset) => sum + asset.totalValue, 0),
        averageYield: filteredAssets.reduce((sum, asset) => sum + asset.performance.annualYield, 0) / filteredAssets.length,
        averagePrice: filteredAssets.reduce((sum, asset) => sum + asset.token.price, 0) / filteredAssets.length,
        byType: {},
        byRisk: {}
      }

      // Group by type and risk
      filteredAssets.forEach(asset => {
        // By type
        if (!marketStats.byType[asset.type]) {
          marketStats.byType[asset.type] = { count: 0, value: 0 }
        }
        marketStats.byType[asset.type].count++
        marketStats.byType[asset.type].value += asset.totalValue

        // By risk
        const risk = asset.performance.riskLevel
        if (!marketStats.byRisk[risk]) {
          marketStats.byRisk[risk] = { count: 0, avgYield: 0 }
        }
        marketStats.byRisk[risk].count++
        marketStats.byRisk[risk].avgYield = (marketStats.byRisk[risk].avgYield + asset.performance.annualYield) / 2
      })

      return res.status(200).json({
        success: true,
        data: {
          assets: paginatedAssets,
          marketStats: marketStats,
          pagination: {
            total: filteredAssets.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: endIndex < filteredAssets.length
          },
          filters: {
            availableTypes: ['Immobiliare', 'Equity', 'Collectibles', 'Commodities'],
            priceRange: { min: 1, max: 50 },
            yieldRange: { min: 3, max: 20 },
            riskLevels: ['low', 'low-medium', 'medium', 'medium-high', 'high'],
            locations: ['Milano', 'Roma', 'Firenze', 'Napoli', 'Torino']
          }
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Marketplace list error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use GET to retrieve marketplace assets.' 
  })
}

