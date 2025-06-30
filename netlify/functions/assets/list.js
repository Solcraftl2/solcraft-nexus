
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
      // Get user from authorization header
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Token di autorizzazione richiesto'
        })
      }

      // Get query parameters for filtering and pagination
      const { 
        type, 
        status, 
        limit = 10, 
        offset = 0, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        search 
      } = req.query

      // In a real implementation, you would:
      // 1. Verify the JWT token and get user ID
      // 2. Query database for user's assets with filters
      // 3. Apply pagination and sorting
      // 4. Get real-time values from external APIs

      // Mock user assets data based on the live platform
      const userAssets = [
        {
          id: 'asset_1',
          name: 'Appartamento Milano',
          type: 'Immobiliare',
          category: 'real_estate',
          description: 'Appartamento di 85mq in zona Porta Nuova, Milano',
          value: 85000,
          currency: 'EUR',
          status: 'active',
          tokenized: true,
          token: {
            symbol: 'APMIL',
            name: 'Appartamento Milano Token',
            totalSupply: 10000,
            price: 8.5,
            currency: 'EUR',
            network: 'xrp',
            contractAddress: 'rAPMILXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
          },
          ownership: {
            totalTokens: 10000,
            ownedTokens: 1000,
            percentage: 10,
            availableForSale: 500
          },
          performance: {
            annualYield: 6.2,
            monthlyYield: 0.52,
            totalReturn: 12.5,
            lastDividend: {
              amount: 100,
              currency: 'XRP',
              date: '2025-06-25',
              perToken: 0.01
            }
          },
          location: {
            address: 'Via Porta Nuova, Milano, Italy',
            coordinates: { lat: 45.4842, lng: 9.1900 },
            neighborhood: 'Porta Nuova',
            city: 'Milano',
            country: 'Italy'
          },
          documents: [
            { type: 'deed', name: 'Atto di Proprietà', verified: true },
            { type: 'valuation', name: 'Perizia 2024', verified: true },
            { type: 'insurance', name: 'Polizza Assicurativa', verified: true }
          ],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2025-06-25T10:30:00Z',
          nextDividendDate: '2025-07-25T00:00:00Z'
        },
        {
          id: 'asset_2',
          name: 'Startup TechCorp',
          type: 'Equity',
          category: 'business',
          description: 'Startup tecnologica specializzata in AI e blockchain',
          value: 15000,
          currency: 'EUR',
          status: 'active',
          tokenized: true,
          token: {
            symbol: 'TECH',
            name: 'TechCorp Equity Token',
            totalSupply: 5000,
            price: 3.0,
            currency: 'EUR',
            network: 'xrp',
            contractAddress: 'rTECHXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
          },
          ownership: {
            totalTokens: 5000,
            ownedTokens: 500,
            percentage: 10,
            availableForSale: 0
          },
          performance: {
            annualYield: 12.8,
            monthlyYield: 1.07,
            totalReturn: 25.6,
            lastDividend: null
          },
          business: {
            sector: 'Technology',
            employees: 25,
            revenue: 500000,
            founded: '2022-03-01',
            stage: 'Series A'
          },
          documents: [
            { type: 'incorporation', name: 'Certificato Costituzione', verified: true },
            { type: 'financial', name: 'Bilancio 2024', verified: true },
            { type: 'business_plan', name: 'Business Plan', verified: true }
          ],
          createdAt: '2024-03-01T09:00:00Z',
          updatedAt: '2025-06-20T15:45:00Z',
          nextDividendDate: null
        },
        {
          id: 'asset_3',
          name: 'Collezione Arte Moderna',
          type: 'Arte',
          category: 'collectibles',
          description: 'Collezione di 5 opere di artisti emergenti italiani',
          value: 25000,
          currency: 'EUR',
          status: 'pending_tokenization',
          tokenized: false,
          token: null,
          ownership: {
            totalTokens: 0,
            ownedTokens: 0,
            percentage: 100,
            availableForSale: 0
          },
          performance: {
            annualYield: 0,
            monthlyYield: 0,
            totalReturn: 0,
            lastDividend: null
          },
          collection: {
            pieces: 5,
            period: '2020-2024',
            artists: ['Marco Rossi', 'Elena Bianchi', 'Giuseppe Verde'],
            authenticated: true,
            insured: true
          },
          documents: [
            { type: 'authenticity', name: 'Certificati Autenticità', verified: true },
            { type: 'appraisal', name: 'Perizia Artistica', verified: false },
            { type: 'insurance', name: 'Polizza Arte', verified: true }
          ],
          createdAt: '2025-06-01T14:30:00Z',
          updatedAt: '2025-06-15T11:20:00Z',
          nextDividendDate: null
        }
      ]

      // Apply filters
      let filteredAssets = userAssets

      if (type) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.type.toLowerCase() === type.toLowerCase()
        )
      }

      if (status) {
        filteredAssets = filteredAssets.filter(asset => asset.status === status)
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
        let aValue = a[sortBy]
        let bValue = b[sortBy]
        
        if (sortBy === 'value') {
          aValue = a.value
          bValue = b.value
        } else if (sortBy === 'yield') {
          aValue = a.performance.annualYield
          bValue = b.performance.annualYield
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

      // Calculate summary statistics
      const summary = {
        totalAssets: filteredAssets.length,
        totalValue: filteredAssets.reduce((sum, asset) => sum + asset.value, 0),
        tokenizedAssets: filteredAssets.filter(asset => asset.tokenized).length,
        averageYield: filteredAssets.reduce((sum, asset) => sum + asset.performance.annualYield, 0) / filteredAssets.length,
        byType: {}
      }

      // Group by type
      filteredAssets.forEach(asset => {
        if (!summary.byType[asset.type]) {
          summary.byType[asset.type] = { count: 0, value: 0 }
        }
        summary.byType[asset.type].count++
        summary.byType[asset.type].value += asset.value
      })

      return res.status(200).json({
        success: true,
        data: {
          assets: paginatedAssets,
          summary: summary,
          pagination: {
            total: filteredAssets.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: endIndex < filteredAssets.length
          },
          filters: {
            availableTypes: ['Immobiliare', 'Equity', 'Arte', 'Commodities'],
            availableStatuses: ['active', 'pending_tokenization', 'under_review', 'inactive']
          }
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Assets list error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use GET to retrieve assets list.' 
  })
}

