import { getMarketplaceAssets } from '../config/supabaseClient.js'

export default async function handler(req, res) {
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

      const { data: assets, count } = await getMarketplaceAssets({
        categoryId: type,
        minPrice,
        maxPrice,
        minYield,
        maxYield,
        location,
        featured: featured === 'true',
        search,
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy: {
          price: 'token_price',
          yield: 'expected_yield',
          value: 'total_value',
          createdAt: 'created_at'
        }[sortBy] || 'created_at',
        sortOrder
      })

      const marketStats = {
        totalAssets: count,
        totalValue: assets.reduce((sum, a) => sum + (a.total_value || 0), 0),
        averageYield: assets.length
          ? assets.reduce((sum, a) => sum + (a.expected_yield || 0), 0) / assets.length
          : 0,
        averagePrice: assets.length
          ? assets.reduce((sum, a) => sum + (a.token_price || 0), 0) / assets.length
          : 0
      }

      return res.status(200).json({
        success: true,
        data: {
          assets,
          marketStats,
          pagination: {
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + assets.length < count
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

