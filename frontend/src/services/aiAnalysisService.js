/**
 * Solcraft Nexus - AI Analysis Service
 * Handles all AI-powered analysis requests to the backend
 */

// Get backend URL from environment
const getBackendUrl = () => {
  const currentHost = window.location.hostname;
  
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  } else if (currentHost.includes('preview.emergentagent.com')) {
    return process.env.REACT_APP_BACKEND_URL || `https://${currentHost}`;
  } else {
    return process.env.REACT_APP_BACKEND_URL || '';
  }
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

class AIAnalysisService {
  constructor() {
    this.baseURL = API;
  }

  /**
   * Get available AI analysis types and supported asset classes
   */
  async getAnalysisTypes() {
    try {
      const response = await fetch(`${this.baseURL}/ai/analysis-types`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch analysis types`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching analysis types:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific asset using AI
   * @param {Object} assetData - Asset information to analyze
   * @param {string} analysisType - Type of analysis ("comprehensive", "valuation", "risk")
   * @param {string} language - Language for response ("en" or "it")
   */
  async analyzeAsset(assetData, analysisType = 'comprehensive', language = 'en') {
    try {
      const response = await fetch(`${this.baseURL}/ai/analyze-asset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_data: assetData,
          analysis_type: analysisType,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Asset analysis failed`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing asset:', error);
      throw error;
    }
  }

  /**
   * Generate market predictions for asset class
   * @param {string} assetClass - Asset class to predict ("real_estate", "private_credit", etc.)
   * @param {string} timeHorizon - Prediction timeframe ("1_month", "3_months", "6_months", "1_year")
   * @param {string} language - Language for response ("en" or "it")
   */
  async predictMarketTrends(assetClass, timeHorizon = '3_months', language = 'en') {
    try {
      const response = await fetch(`${this.baseURL}/ai/market-prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_class: assetClass,
          time_horizon: timeHorizon,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Market prediction failed`);
      }

      const data = await response.json();
      return data.prediction;
    } catch (error) {
      console.error('Error predicting market trends:', error);
      throw error;
    }
  }

  /**
   * Assess portfolio risk using AI
   * @param {Object} portfolioData - Portfolio information including assets, allocation, etc.
   * @param {string} language - Language for response ("en" or "it")
   */
  async assessPortfolioRisk(portfolioData, language = 'en') {
    try {
      const response = await fetch(`${this.baseURL}/ai/risk-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolio_data: portfolioData,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Risk assessment failed`);
      }

      const data = await response.json();
      return data.assessment;
    } catch (error) {
      console.error('Error assessing portfolio risk:', error);
      throw error;
    }
  }

  /**
   * Generate portfolio optimization recommendations
   * @param {Object} portfolioData - Current portfolio data
   * @param {Array} optimizationGoals - Goals like ["maximize_return", "minimize_risk", "increase_diversification"]
   * @param {string} language - Language for response ("en" or "it")
   */
  async optimizePortfolio(portfolioData, optimizationGoals, language = 'en') {
    try {
      const response = await fetch(`${this.baseURL}/ai/optimize-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolio_data: portfolioData,
          optimization_goals: optimizationGoals,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Portfolio optimization failed`);
      }

      const data = await response.json();
      return data.optimization;
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      throw error;
    }
  }

  /**
   * Quick asset analysis for dashboard cards
   * @param {Array} assets - Array of assets to analyze
   * @param {string} language - Language for response
   */
  async quickAnalysis(assets, language = 'en') {
    try {
      // Analyze multiple assets in parallel
      const analysisPromises = assets.map(asset => 
        this.analyzeAsset(asset, 'quick', language)
      );

      const results = await Promise.allSettled(analysisPromises);
      
      return results.map((result, index) => ({
        asset: assets[index],
        analysis: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('Error in quick analysis:', error);
      throw error;
    }
  }

  /**
   * Generate AI insights for specific portfolio section
   * @param {string} section - Section type ("overview", "risk", "performance", "recommendations")
   * @param {Object} data - Relevant data for the section
   * @param {string} language - Language for response
   */
  async generateInsights(section, data, language = 'en') {
    try {
      let analysis;
      
      switch (section) {
        case 'risk':
          analysis = await this.assessPortfolioRisk(data, language);
          break;
        case 'optimization':
          analysis = await this.optimizePortfolio(data, ['maximize_return', 'minimize_risk'], language);
          break;
        case 'market':
          analysis = await this.predictMarketTrends(data.asset_class || 'real_estate', '3_months', language);
          break;
        default:
          throw new Error(`Unsupported insights section: ${section}`);
      }

      return analysis;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  /**
   * Format AI response for display in UI
   * @param {string} aiResponse - Raw AI response text
   * @returns {Object} Formatted response with sections
   */
  formatAIResponse(aiResponse) {
    try {
      // Try to parse structured response or format as readable text
      const sections = aiResponse.split('\n\n').filter(section => section.trim());
      
      return {
        summary: sections[0] || 'AI analysis completed',
        details: sections.slice(1),
        rawResponse: aiResponse
      };
    } catch (error) {
      return {
        summary: 'AI analysis completed',
        details: [aiResponse],
        rawResponse: aiResponse
      };
    }
  }

  /**
   * Get analysis history for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of analyses to retrieve
   */
  async getAnalysisHistory(userId, limit = 10) {
    try {
      // This would typically fetch from a user-specific endpoint
      // For now, return mock data since we don't have user-specific history endpoint
      return {
        analyses: [],
        total: 0,
        message: 'Analysis history feature coming soon'
      };
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      throw error;
    }
  }
}

// Export singleton instance
const aiAnalysisService = new AIAnalysisService();
export default aiAnalysisService;