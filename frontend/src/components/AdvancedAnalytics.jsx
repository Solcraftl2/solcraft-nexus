import React, { useState, useEffect } from 'react';
import { 
  samplePortfolio, 
  samplePerformanceData, 
  sampleAssetAllocation,
  sampleMarketTrends,
  sampleTransactions 
} from '../data/sampleData';

const AdvancedAnalytics = ({ user, portfolioData = samplePortfolio }) => {
  const [activeChart, setActiveChart] = useState('performance');
  const [timeRange, setTimeRange] = useState('6M');
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Calculate advanced metrics
  const totalValue = portfolioData.reduce((sum, item) => sum + item.current_value, 0);
  const totalInvested = portfolioData.reduce((sum, item) => sum + item.total_invested, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercentage = ((totalGain / totalInvested) * 100).toFixed(1);

  // Calculate Sharpe Ratio (simplified)
  const sharpeRatio = (parseFloat(totalGainPercentage) / 15).toFixed(2); // Assuming 15% volatility

  // Calculate portfolio diversification
  const assetTypes = portfolioData.reduce((acc, item) => {
    const category = item.assets.asset_categories.name;
    acc[category] = (acc[category] || 0) + item.current_value;
    return acc;
  }, {});

  const diversificationScore = Object.keys(assetTypes).length * 20; // Max 100 for 5 categories

  // Generate performance data based on time range
  const generatePerformanceData = (range) => {
    const periods = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '2Y': 730
    };

    const days = periods[range] || 180;
    const data = [];
    let baseValue = totalInvested;

    for (let i = 0; i < Math.min(days / 7, 52); i++) {
      const volatility = (Math.random() - 0.5) * 0.1; // ±5% volatility
      const trend = 0.002; // 0.2% weekly growth trend
      baseValue *= (1 + trend + volatility);
      
      data.push({
        week: i + 1,
        portfolio: Math.round(baseValue),
        benchmark: Math.round(totalInvested * (1 + (i * 0.001))), // Slower benchmark growth
        date: new Date(Date.now() - (days - i * 7) * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })
      });
    }

    return data;
  };

  const [performanceData, setPerformanceData] = useState(generatePerformanceData(timeRange));

  useEffect(() => {
    setPerformanceData(generatePerformanceData(timeRange));
  }, [timeRange, totalInvested]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Risk assessment
  const calculateRiskLevel = () => {
    const riskScores = portfolioData.map(item => {
      const category = item.assets.asset_categories.name;
      const riskMap = {
        'Immobiliare': 3,
        'Startup': 8,
        'Arte': 6,
        'Commodities': 5,
        'Obbligazioni': 2
      };
      return (riskMap[category] || 5) * (item.current_value / totalValue);
    });

    const avgRisk = riskScores.reduce((sum, score) => sum + score, 0);
    
    if (avgRisk <= 3) return { level: 'Basso', color: '#10B981', description: 'Portfolio conservativo' };
    if (avgRisk <= 6) return { level: 'Medio', color: '#F59E0B', description: 'Portfolio bilanciato' };
    return { level: 'Alto', color: '#EF4444', description: 'Portfolio aggressivo' };
  };

  const riskAssessment = calculateRiskLevel();

  const chartTypes = [
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'allocation', label: 'Allocazione', icon: '🥧' },
    { id: 'risk', label: 'Analisi Rischio', icon: '⚖️' },
    { id: 'trends', label: 'Trend Mercato', icon: '📊' }
  ];

  const timeRanges = ['1M', '3M', '6M', '1Y', '2Y'];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ margin: 0, color: '#1F2937', fontSize: '1.5rem', fontWeight: '700' }}>
          📊 Analytics Avanzate
        </h2>
        
        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {timeRanges.map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '0.5rem 1rem',
                background: timeRange === range 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#F3F4F6',
                color: timeRange === range ? 'white' : '#6B7280',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
            ROI Totale
          </h3>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
            {formatPercentage(parseFloat(totalGainPercentage))}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
            Sharpe Ratio
          </h3>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
            {sharpeRatio}
          </p>
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${riskAssessment.color} 0%, ${riskAssessment.color}CC 100%)`,
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
            Livello Rischio
          </h3>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
            {riskAssessment.level}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
            Diversificazione
          </h3>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>
            {diversificationScore}%
          </p>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {chartTypes.map(chart => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeChart === chart.id 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#F9FAFB',
              color: activeChart === chart.id ? 'white' : '#6B7280',
              border: activeChart === chart.id ? 'none' : '1px solid #E5E7EB',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem'
            }}
          >
            {chart.icon} {chart.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div style={{ minHeight: '400px' }}>
        {/* Performance Chart */}
        {activeChart === 'performance' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937' }}>
              Performance vs Benchmark ({timeRange})
            </h3>
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'end', 
              gap: '0.5rem',
              padding: '1rem',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '1px solid #E5E7EB'
            }}>
              {performanceData.slice(-20).map((data, index) => (
                <div key={index} style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  minWidth: '30px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '2px', 
                    alignItems: 'end', 
                    marginBottom: '0.5rem',
                    height: '200px'
                  }}>
                    <div 
                      style={{
                        width: '12px',
                        height: `${(data.portfolio / Math.max(...performanceData.map(d => d.portfolio))) * 180}px`,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.5s ease'
                      }}
                      title={`Portfolio: ${formatCurrency(data.portfolio)}`}
                    ></div>
                    <div 
                      style={{
                        width: '12px',
                        height: `${(data.benchmark / Math.max(...performanceData.map(d => d.benchmark))) * 180}px`,
                        background: '#E5E7EB',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.5s ease'
                      }}
                      title={`Benchmark: ${formatCurrency(data.benchmark)}`}
                    ></div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: '#6B7280',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {data.date}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  borderRadius: '2px' 
                }}></div>
                <span>Il Tuo Portfolio</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  background: '#E5E7EB', 
                  borderRadius: '2px' 
                }}></div>
                <span>Benchmark Mercato</span>
              </div>
            </div>
          </div>
        )}

        {/* Asset Allocation Chart */}
        {activeChart === 'allocation' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937' }}>
              Allocazione Asset per Categoria
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {sampleAssetAllocation.map((asset, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '1rem',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%',
                    background: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][index]
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '0.5rem' 
                    }}>
                      <span style={{ fontSize: '1rem', color: '#374151', fontWeight: '600' }}>
                        {asset.name}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#1F2937' }}>
                        {asset.percentage}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '12px', 
                      background: '#F3F4F6', 
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${asset.percentage}%`,
                        height: '100%',
                        background: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][index],
                        transition: 'width 1s ease',
                        borderRadius: '6px'
                      }}></div>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '700', 
                    color: '#1F2937', 
                    minWidth: '100px', 
                    textAlign: 'right' 
                  }}>
                    {formatCurrency(asset.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Analysis */}
        {activeChart === 'risk' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937' }}>
              Analisi del Rischio Portfolio
            </h3>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Risk Overview */}
              <div style={{
                padding: '1.5rem',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>
                  Profilo di Rischio: {riskAssessment.level}
                </h4>
                <p style={{ margin: '0 0 1rem 0', color: '#6B7280' }}>
                  {riskAssessment.description}
                </p>
                <div style={{
                  width: '100%',
                  height: '20px',
                  background: '#F3F4F6',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.min(parseFloat(totalGainPercentage) * 2 + 50, 100)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, #10B981 0%, #F59E0B 50%, #EF4444 100%)`,
                    borderRadius: '10px',
                    transition: 'width 1s ease'
                  }}></div>
                </div>
              </div>

              {/* Asset Risk Breakdown */}
              <div style={{
                padding: '1.5rem',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>
                  Rischio per Asset
                </h4>
                {portfolioData.map((item, index) => {
                  const riskLevel = item.assets.asset_categories.name === 'Startup' ? 'Alto' :
                                   item.assets.asset_categories.name === 'Arte' ? 'Medio-Alto' :
                                   item.assets.asset_categories.name === 'Immobiliare' ? 'Medio' : 'Basso';
                  const riskColor = riskLevel === 'Alto' ? '#EF4444' :
                                   riskLevel === 'Medio-Alto' ? '#F59E0B' :
                                   riskLevel === 'Medio' ? '#3B82F6' : '#10B981';
                  
                  return (
                    <div key={item.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: index < portfolioData.length - 1 ? '1px solid #E5E7EB' : 'none'
                    }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#1F2937' }}>
                          {item.assets.name}
                        </span>
                        <span style={{ 
                          marginLeft: '0.5rem',
                          fontSize: '0.8rem',
                          color: riskColor,
                          fontWeight: '600'
                        }}>
                          {riskLevel}
                        </span>
                      </div>
                      <span style={{ color: '#6B7280' }}>
                        {((item.current_value / totalValue) * 100).toFixed(1)}% del portfolio
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Market Trends */}
        {activeChart === 'trends' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1F2937' }}>
              Trend di Mercato per Categoria
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {sampleMarketTrends.map((trend, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1F2937' }}>
                      {trend.category}
                    </h4>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                      Trend degli ultimi 30 giorni
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700',
                      color: trend.color
                    }}>
                      {trend.trend}
                    </span>
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#6B7280'
                    }}>
                      {trend.trend.startsWith('+') ? '📈 In crescita' : 
                       trend.trend.startsWith('-') ? '📉 In calo' : '➡️ Stabile'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;

