import React, { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import aiAnalysisService from './services/aiAnalysisService';
import marketplaceService from './services/marketplaceService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const Dashboard = ({ connectedWallet, onDisconnect }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioData, setPortfolioData] = useState(null);
  const [userAssets, setUserAssets] = useState([]);
  const [tradingData, setTradingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [marketplaceAssets, setMarketplaceAssets] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    asset_id: '',
    order_type: 'market',
    side: 'buy',
    quantity: 1,
    price: null
  });

  // Mock user portfolio data (in production, fetch from backend)
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock portfolio data
      setPortfolioData({
        totalValue: 125000,
        totalReturn: 15.8,
        monthlyReturn: 3.2,
        assets: [
          { name: 'Real Estate', value: 50000, percentage: 40, change: 12.5 },
          { name: 'Private Credit', value: 30000, percentage: 24, change: 8.3 },
          { name: 'Commodities', value: 25000, percentage: 20, change: -2.1 },
          { name: 'Equity Securities', value: 20000, percentage: 16, change: 18.7 }
        ]
      });

      // Mock user assets
      setUserAssets([
        {
          id: 1,
          name: 'Manhattan Office Complex',
          type: 'Real Estate',
          value: 25000,
          tokens: 100,
          apy: 8.5,
          status: 'Active',
          lastUpdate: '2025-01-13'
        },
        {
          id: 2,
          name: 'Private Credit Fund III',
          type: 'Private Credit',
          value: 15000,
          tokens: 60,
          apy: 12.3,
          status: 'Active',
          lastUpdate: '2025-01-12'
        },
        {
          id: 3,
          name: 'Gold Reserve Token',
          type: 'Commodities',
          value: 8000,
          tokens: 32,
          apy: 6.7,
          status: 'Active',
          lastUpdate: '2025-01-11'
        }
      ]);

      // Mock trading data
      setTradingData([
        {
          id: 1,
          asset: 'Manhattan Office Complex',
          type: 'Buy',
          amount: 50,
          price: 250,
          total: 12500,
          date: '2025-01-13',
          status: 'Completed'
        },
        {
          id: 2,
          asset: 'Private Credit Fund III',
          type: 'Sell',
          amount: 20,
          price: 300,
          total: 6000,
          date: '2025-01-12',
          status: 'Pending'
        }
      ]);

      setLoading(false);
    };

    loadDashboardData();
  }, []);

  // Load marketplace data
  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        const [assets, orders] = await Promise.all([
          marketplaceService.getMarketplaceAssets({ limit: 20 }),
          marketplaceService.getUserOrders(connectedWallet?.address || 'demo_user')
        ]);
        
        setMarketplaceAssets(assets.assets || []);
        setUserOrders(orders.orders || []);
      } catch (error) {
        console.error('Error loading marketplace data:', error);
      }
    };

    if (connectedWallet) {
      loadMarketplaceData();
    }
  }, [connectedWallet]);

  // Load AI insights
  const loadAIInsights = async (section, data) => {
    setAiLoading(true);
    try {
      const insights = await aiAnalysisService.generateInsights(section, data, 'en');
      setAiInsights(prev => ({
        ...prev,
        [section]: insights
      }));
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Quick analyze asset
  const analyzeAsset = async (asset) => {
    setAiLoading(true);
    try {
      const analysis = await aiAnalysisService.analyzeAsset(asset, 'comprehensive', 'en');
      setAiInsights(prev => ({
        ...prev,
        [`asset_${asset.id}`]: analysis
      }));
    } catch (error) {
      console.error('Error analyzing asset:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Chart configurations
  const portfolioChartData = {
    labels: portfolioData?.assets?.map(asset => asset.name) || [],
    datasets: [
      {
        data: portfolioData?.assets?.map(asset => asset.percentage) || [],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444'
        ],
        borderWidth: 0,
      }
    ]
  };

  const performanceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value ($)',
        data: [100000, 105000, 108000, 112000, 118000, 125000],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Professional RWA Platform
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Connected:</span> {connectedWallet?.address?.slice(0, 6)}...{connectedWallet?.address?.slice(-4)}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Balance:</span> {connectedWallet?.balanceXrp || 'N/A'} XRP
              </div>
              <button
                onClick={onDisconnect}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-6">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📊 Portfolio Overview
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'assets'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🏢 My Assets
              </button>
              <button
                onClick={() => setActiveTab('trading')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'trading'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                💹 Trading
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'marketplace'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🛒 Marketplace
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📈 Analytics
              </button>
              <button
                onClick={() => setActiveTab('ai-insights')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'ai-insights'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🤖 AI Insights
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  + Tokenize Asset
                </button>
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                  🔄 Transfer Tokens
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Portfolio Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Portfolio Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Portfolio Value</h3>
                  <p className="text-3xl font-bold text-gray-900">${portfolioData?.totalValue?.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-1">+{portfolioData?.totalReturn}% all time</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Return</h3>
                  <p className="text-3xl font-bold text-gray-900">{portfolioData?.monthlyReturn}%</p>
                  <p className="text-sm text-green-600 mt-1">+2.1% vs last month</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Active Assets</h3>
                  <p className="text-3xl font-bold text-gray-900">{userAssets?.length}</p>
                  <p className="text-sm text-blue-600 mt-1">Across 4 categories</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tokens</h3>
                  <p className="text-3xl font-bold text-gray-900">{userAssets?.reduce((acc, asset) => acc + asset.tokens, 0)}</p>
                  <p className="text-sm text-gray-600 mt-1">Tokenized holdings</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h3>
                  <div className="h-64">
                    <Doughnut data={portfolioChartData} options={chartOptions} />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
                  <div className="h-64">
                    <Line data={performanceChartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Asset Performance Table */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Asset Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {portfolioData?.assets?.map((asset, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.value.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.percentage}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`${asset.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {asset.change > 0 ? '+' : ''}{asset.change}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* My Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Tokenized Assets</h2>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  + Tokenize New Asset
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {userAssets.map((asset) => (
                  <div key={asset.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                        <p className="text-sm text-gray-600">{asset.type}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {asset.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Value:</span>
                        <span className="text-sm font-semibold text-gray-900">${asset.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tokens Owned:</span>
                        <span className="text-sm font-semibold text-gray-900">{asset.tokens}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">APY:</span>
                        <span className="text-sm font-semibold text-green-600">{asset.apy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Updated:</span>
                        <span className="text-sm text-gray-900">{asset.lastUpdate}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Trade
                      </button>
                      <button 
                        onClick={() => analyzeAsset(asset)}
                        disabled={aiLoading}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {aiLoading ? '🤖 ...' : '🤖 AI Analysis'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trading Tab */}
          {activeTab === 'trading' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Trading Activity</h2>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  + New Order
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tradingData.map((trade) => (
                        <tr key={trade.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trade.asset}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              trade.type === 'Buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trade.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trade.total.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              trade.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {trade.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Asset Marketplace</h2>
                <div className="flex space-x-4">
                  <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                    <option>All Categories</option>
                    <option>Real Estate</option>
                    <option>Private Credit</option>
                    <option>Commodities</option>
                    <option>Equity Securities</option>
                  </select>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    List Asset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Marketplace asset cards */}
                {[
                  {
                    name: 'Berlin Residential Complex',
                    type: 'Real Estate',
                    price: 500,
                    totalValue: 2500000,
                    apy: 7.8,
                    available: 1250,
                    image: '/api/placeholder/300/200'
                  },
                  {
                    name: 'Tech Startup Equity',
                    type: 'Equity Securities',
                    price: 100,
                    totalValue: 500000,
                    apy: 25.3,
                    available: 2000,
                    image: '/api/placeholder/300/200'
                  },
                  {
                    name: 'Silver Mining Rights',
                    type: 'Commodities',
                    price: 150,
                    totalValue: 750000,
                    apy: 9.2,
                    available: 800,
                    image: '/api/placeholder/300/200'
                  }
                ].map((asset, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <img 
                      src={asset.image} 
                      alt={asset.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                          <p className="text-sm text-gray-600">{asset.type}</p>
                        </div>
                        <span className="text-sm font-semibold text-green-600">{asset.apy}% APY</span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Token Price:</span>
                          <span className="font-semibold">${asset.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-semibold">${asset.totalValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-semibold">{asset.available} tokens</span>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          Buy Tokens
                        </button>
                        <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Portfolio Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Class Performance</h3>
                  <div className="h-64">
                    <Bar 
                      data={{
                        labels: ['Real Estate', 'Private Credit', 'Commodities', 'Equity Securities'],
                        datasets: [
                          {
                            label: 'Returns (%)',
                            data: [12.5, 8.3, -2.1, 18.7],
                            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
                          }
                        ]
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Portfolio Risk Score</span>
                        <span className="font-semibold">Medium (6/10)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Diversification Score</span>
                        <span className="font-semibold">Good (8/10)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Liquidity Score</span>
                        <span className="font-semibold">High (9/10)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">🤖 AI-Powered Insights</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => loadAIInsights('risk', { 
                      total_value: portfolioData?.totalValue,
                      assets: userAssets,
                      allocation: portfolioData?.assets 
                    })}
                    disabled={aiLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {aiLoading ? 'Analyzing...' : 'Risk Analysis'}
                  </button>
                  <button
                    onClick={() => loadAIInsights('optimization', {
                      total_value: portfolioData?.totalValue,
                      assets: userAssets,
                      allocation: portfolioData?.assets,
                      risk_profile: 'Moderate'
                    })}
                    disabled={aiLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {aiLoading ? 'Optimizing...' : 'Portfolio Optimization'}
                  </button>
                  <button
                    onClick={() => loadAIInsights('market', { asset_class: 'real_estate' })}
                    disabled={aiLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {aiLoading ? 'Predicting...' : 'Market Prediction'}
                  </button>
                </div>
              </div>

              {/* AI Insights Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Assessment Insights */}
                {aiInsights.risk && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      ⚠️ AI Risk Assessment
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(aiInsights.risk.timestamp).toLocaleDateString()}
                      </span>
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {aiInsights.risk.ai_insights}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio Optimization Insights */}
                {aiInsights.optimization && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      🎯 AI Portfolio Optimization
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(aiInsights.optimization.timestamp).toLocaleDateString()}
                      </span>
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {aiInsights.optimization.ai_insights}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Prediction Insights */}
                {aiInsights.market && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📈 AI Market Prediction
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(aiInsights.market.timestamp).toLocaleDateString()}
                      </span>
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {aiInsights.market.ai_insights}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Asset-specific AI Insights */}
                {Object.entries(aiInsights).filter(([key]) => key.startsWith('asset_')).map(([key, insight]) => (
                  <div key={key} className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      🏢 Asset AI Analysis
                      <span className="ml-2 text-sm text-gray-500">
                        {insight.asset_name}
                      </span>
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {insight.ai_insights}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* No insights yet */}
              {Object.keys(aiInsights).length === 0 && !aiLoading && (
                <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
                  <p className="text-gray-600 mb-6">
                    Get AI-powered analysis of your portfolio, market predictions, and optimization recommendations.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => loadAIInsights('risk', { 
                        total_value: portfolioData?.totalValue,
                        assets: userAssets 
                      })}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Start Risk Analysis
                    </button>
                    <button
                      onClick={() => loadAIInsights('optimization', {
                        total_value: portfolioData?.totalValue,
                        assets: userAssets
                      })}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Optimize Portfolio
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {aiLoading && (
                <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis in Progress</h3>
                  <p className="text-gray-600">
                    Our AI is analyzing your data to provide intelligent insights...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;