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

    // POST - Genera nuovo report
    if (req.method === 'POST') {
      const {
        reportType = 'portfolio_summary',
        format = 'pdf',
        timeframe = '1y',
        includeCharts = true,
        includeTaxInfo = false,
        customSections = [],
        deliveryMethod = 'download', // download, email
        walletAddress
      } = req.body;

      try {
        const report = await generateReport({
          userAddress: walletAddress || decoded.address,
          userId: decoded.userId,
          userName: decoded.name || 'SolCraft User',
          userEmail: decoded.email,
          reportType,
          format,
          timeframe,
          includeCharts,
          includeTaxInfo,
          customSections,
          deliveryMethod
        });

        return res.status(200).json({
          success: true,
          message: 'Report generato con successo!',
          report: {
            id: report.id,
            type: reportType,
            format: format,
            status: 'completed',
            generatedAt: report.generatedAt,
            expiresAt: report.expiresAt,
            downloadUrl: report.downloadUrl,
            fileSize: report.fileSize,
            pages: report.pages,
            sections: report.sections
          },
          deliveryInfo: report.deliveryInfo
        });

      } catch (error) {
        console.error('Report generation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la generazione del report',
          message: error.message
        });
      }
    }

    // GET - Lista report generati o scarica report
    if (req.method === 'GET') {
      const { reportId, action = 'list' } = req.query;

      if (action === 'download' && reportId) {
        try {
          const reportFile = await downloadReport(reportId, decoded.userId);
          
          if (!reportFile) {
            return res.status(404).json({
              success: false,
              error: 'Report non trovato o scaduto'
            });
          }

          // Imposta headers per download
          res.setHeader('Content-Type', reportFile.mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${reportFile.filename}"`);
          res.setHeader('Content-Length', reportFile.size);
          
          return res.status(200).send(reportFile.data);

        } catch (error) {
          console.error('Report download error:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore durante il download del report'
          });
        }
      }

      // Lista report dell'utente
      try {
        const reports = await getUserReports(decoded.userId);
        
        return res.status(200).json({
          success: true,
          reports: reports,
          total: reports.length,
          metadata: {
            userId: decoded.userId,
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('Reports list error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante il recupero dei report'
        });
      }
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

// Funzioni helper
async function generateReport({
  userAddress,
  userId,
  userName,
  userEmail,
  reportType,
  format,
  timeframe,
  includeCharts,
  includeTaxInfo,
  customSections,
  deliveryMethod
}) {
  const reportId = 'rpt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const timestamp = new Date().toISOString();
  
  // Recupera dati portfolio per il report
  const portfolioData = await getPortfolioDataForReport(userAddress, timeframe);
  
  // Genera contenuto report basato sul tipo
  const reportContent = await generateReportContent({
    reportType,
    portfolioData,
    timeframe,
    includeCharts,
    includeTaxInfo,
    customSections,
    userInfo: { userId, userName, userEmail, userAddress }
  });

  // Genera file report nel formato richiesto
  const reportFile = await generateReportFile(reportContent, format, reportId);

  const report = {
    id: reportId,
    userId: userId,
    type: reportType,
    format: format,
    status: 'completed',
    generatedAt: timestamp,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 giorni
    downloadUrl: `/api/reports/generate?action=download&reportId=${reportId}`,
    fileSize: reportFile.size,
    pages: reportFile.pages,
    sections: reportContent.sections.map(s => s.title),
    deliveryInfo: await handleDelivery(reportFile, deliveryMethod, userEmail)
  };

  // Salva metadata report (in produzione andrebbe in database)
  await saveReportMetadata(report);

  return report;
}

async function getPortfolioDataForReport(address, timeframe) {
  // Simula recupero dati completi portfolio
  return {
    summary: {
      totalValue: 125750.50,
      totalReturn: 28.9,
      annualizedReturn: 24.3,
      volatility: 15.2,
      sharpeRatio: 1.85,
      maxDrawdown: -8.3
    },
    assets: [
      {
        id: 'PROP001',
        name: 'Manhattan Office Building',
        type: 'real_estate',
        value: 65000.00,
        allocation: 51.7,
        return: 32.5,
        yield: 9.6
      },
      {
        id: 'GOLD001',
        name: 'Physical Gold Reserve',
        type: 'commodity',
        value: 23500.00,
        allocation: 18.7,
        return: 18.2,
        yield: 0.0
      },
      {
        id: 'ART001',
        name: 'Renaissance Art Collection',
        type: 'art',
        value: 25000.00,
        allocation: 19.9,
        return: 45.7,
        yield: 0.0
      },
      {
        id: 'SOLAR001',
        name: 'Texas Solar Farm',
        type: 'renewable_energy',
        value: 12250.50,
        allocation: 9.7,
        return: 22.1,
        yield: 7.2
      }
    ],
    transactions: await getTransactionHistory(address, timeframe),
    performance: await getPerformanceHistory(address, timeframe),
    riskMetrics: await getRiskMetrics(address),
    taxInfo: await getTaxInformation(address, timeframe)
  };
}

async function generateReportContent({
  reportType,
  portfolioData,
  timeframe,
  includeCharts,
  includeTaxInfo,
  customSections,
  userInfo
}) {
  const baseContent = {
    title: getReportTitle(reportType),
    subtitle: `Portfolio Report - ${timeframe.toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    userInfo: userInfo,
    sections: []
  };

  // Sezioni standard basate sul tipo di report
  switch (reportType) {
    case 'portfolio_summary':
      baseContent.sections = [
        await generateExecutiveSummary(portfolioData),
        await generateAssetAllocation(portfolioData),
        await generatePerformanceAnalysis(portfolioData),
        await generateRiskAnalysis(portfolioData),
        await generateRecentActivity(portfolioData)
      ];
      break;

    case 'performance_detailed':
      baseContent.sections = [
        await generatePerformanceOverview(portfolioData),
        await generateReturnAnalysis(portfolioData),
        await generateBenchmarkComparison(portfolioData),
        await generateAttributionAnalysis(portfolioData),
        await generateRiskAdjustedMetrics(portfolioData)
      ];
      break;

    case 'risk_assessment':
      baseContent.sections = [
        await generateRiskProfile(portfolioData),
        await generateRiskFactors(portfolioData),
        await generateStressTesting(portfolioData),
        await generateScenarioAnalysis(portfolioData),
        await generateRiskMitigation(portfolioData)
      ];
      break;

    case 'tax_report':
      baseContent.sections = [
        await generateTaxSummary(portfolioData),
        await generateCapitalGains(portfolioData),
        await generateDividendIncome(portfolioData),
        await generateTaxOptimization(portfolioData),
        await generateTaxDocumentation(portfolioData)
      ];
      break;

    case 'compliance_report':
      baseContent.sections = [
        await generateComplianceOverview(portfolioData),
        await generateRegulatoryStatus(portfolioData),
        await generateComplianceRisks(portfolioData),
        await generateActionItems(portfolioData),
        await generateDocumentation(portfolioData)
      ];
      break;

    default:
      baseContent.sections = [
        await generateExecutiveSummary(portfolioData),
        await generateAssetAllocation(portfolioData),
        await generatePerformanceAnalysis(portfolioData)
      ];
  }

  // Aggiungi sezioni personalizzate
  if (customSections && customSections.length > 0) {
    for (const customSection of customSections) {
      baseContent.sections.push(await generateCustomSection(customSection, portfolioData));
    }
  }

  // Aggiungi informazioni fiscali se richieste
  if (includeTaxInfo && reportType !== 'tax_report') {
    baseContent.sections.push(await generateTaxSummary(portfolioData));
  }

  return baseContent;
}

async function generateReportFile(content, format, reportId) {
  const filename = `solcraft_report_${reportId}.${format}`;
  
  switch (format.toLowerCase()) {
    case 'pdf':
      return await generatePDFReport(content, filename);
    case 'excel':
    case 'xlsx':
      return await generateExcelReport(content, filename);
    case 'csv':
      return await generateCSVReport(content, filename);
    case 'json':
      return await generateJSONReport(content, filename);
    default:
      return await generatePDFReport(content, filename);
  }
}

async function generatePDFReport(content, filename) {
  // Simula generazione PDF
  const mockPDFData = Buffer.from(`PDF Report: ${content.title}\nGenerated: ${content.generatedAt}\n\nContent sections: ${content.sections.length}`);
  
  return {
    filename: filename,
    data: mockPDFData,
    size: mockPDFData.length,
    pages: Math.ceil(content.sections.length * 2.5),
    mimeType: 'application/pdf'
  };
}

async function generateExcelReport(content, filename) {
  // Simula generazione Excel
  const mockExcelData = Buffer.from(`Excel Report: ${content.title}\nSheets: Summary, Assets, Performance, Risk`);
  
  return {
    filename: filename,
    data: mockExcelData,
    size: mockExcelData.length,
    pages: 4, // sheets
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

async function generateCSVReport(content, filename) {
  // Simula generazione CSV
  const csvContent = [
    'Asset,Type,Value,Allocation,Return,Yield',
    ...content.sections.find(s => s.type === 'assets')?.data?.map(asset => 
      `${asset.name},${asset.type},${asset.value},${asset.allocation},${asset.return},${asset.yield}`
    ) || []
  ].join('\n');
  
  const mockCSVData = Buffer.from(csvContent);
  
  return {
    filename: filename,
    data: mockCSVData,
    size: mockCSVData.length,
    pages: 1,
    mimeType: 'text/csv'
  };
}

async function generateJSONReport(content, filename) {
  const jsonContent = JSON.stringify(content, null, 2);
  const mockJSONData = Buffer.from(jsonContent);
  
  return {
    filename: filename,
    data: mockJSONData,
    size: mockJSONData.length,
    pages: 1,
    mimeType: 'application/json'
  };
}

async function handleDelivery(reportFile, deliveryMethod, userEmail) {
  switch (deliveryMethod) {
    case 'email':
      if (!userEmail) {
        throw new Error('Email richiesta per la consegna via email');
      }
      // Simula invio email
      return {
        method: 'email',
        status: 'sent',
        recipient: userEmail,
        sentAt: new Date().toISOString(),
        message: 'Report inviato via email con successo'
      };
    
    case 'download':
    default:
      return {
        method: 'download',
        status: 'ready',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Report pronto per il download'
      };
  }
}

// Funzioni per generare sezioni specifiche
async function generateExecutiveSummary(data) {
  return {
    type: 'executive_summary',
    title: 'Executive Summary',
    content: {
      totalValue: data.summary.totalValue,
      totalReturn: data.summary.totalReturn,
      riskLevel: 'Moderate',
      keyHighlights: [
        `Portfolio value: $${data.summary.totalValue.toLocaleString()}`,
        `Total return: ${data.summary.totalReturn}%`,
        `Risk-adjusted return (Sharpe): ${data.summary.sharpeRatio}`,
        `Asset diversification: ${data.assets.length} asset classes`
      ]
    }
  };
}

async function generateAssetAllocation(data) {
  return {
    type: 'asset_allocation',
    title: 'Asset Allocation',
    content: {
      assets: data.assets,
      totalAssets: data.assets.length,
      diversificationScore: 8.5,
      allocationChart: data.assets.map(asset => ({
        name: asset.name,
        value: asset.allocation
      }))
    }
  };
}

async function generatePerformanceAnalysis(data) {
  return {
    type: 'performance',
    title: 'Performance Analysis',
    content: {
      summary: data.summary,
      performance: data.performance,
      benchmark: 'Market Index',
      outperformance: 10.7
    }
  };
}

async function generateRiskAnalysis(data) {
  return {
    type: 'risk',
    title: 'Risk Analysis',
    content: {
      riskMetrics: data.riskMetrics,
      riskLevel: 'Moderate',
      riskScore: 6.5,
      recommendations: [
        'Consider reducing real estate concentration',
        'Add defensive assets for downside protection',
        'Monitor correlation increases during market stress'
      ]
    }
  };
}

async function generateRecentActivity(data) {
  return {
    type: 'activity',
    title: 'Recent Activity',
    content: {
      transactions: data.transactions.slice(0, 10),
      totalTransactions: data.transactions.length,
      period: 'Last 30 days'
    }
  };
}

// Funzioni helper per dati mock
async function getTransactionHistory(address, timeframe) {
  // Simula cronologia transazioni
  return Array.from({ length: 25 }, (_, i) => ({
    id: `tx_${i}`,
    type: Math.random() > 0.5 ? 'buy' : 'sell',
    asset: ['PROP001', 'GOLD001', 'ART001', 'SOLAR001'][Math.floor(Math.random() * 4)],
    amount: Math.random() * 1000 + 100,
    price: Math.random() * 100 + 50,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
  }));
}

async function getPerformanceHistory(address, timeframe) {
  // Simula cronologia performance
  const days = timeframe === '1y' ? 365 : timeframe === '6m' ? 180 : 90;
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 100000 + Math.random() * 25000,
    return: (Math.random() - 0.5) * 5
  }));
}

async function getRiskMetrics(address) {
  return {
    volatility: 15.2,
    sharpeRatio: 1.85,
    maxDrawdown: -8.3,
    beta: 0.85,
    alpha: 3.2,
    valueAtRisk: -2850.25
  };
}

async function getTaxInformation(address, timeframe) {
  return {
    capitalGains: 12500.75,
    dividendIncome: 2340.50,
    taxableEvents: 45,
    estimatedTax: 3125.19
  };
}

function getReportTitle(reportType) {
  const titles = {
    'portfolio_summary': 'Portfolio Summary Report',
    'performance_detailed': 'Detailed Performance Report',
    'risk_assessment': 'Risk Assessment Report',
    'tax_report': 'Tax Report',
    'compliance_report': 'Compliance Report'
  };
  
  return titles[reportType] || 'Portfolio Report';
}

async function saveReportMetadata(report) {
  // In produzione, salvare in database
  console.log('Report metadata saved:', report.id);
}

async function downloadReport(reportId, userId) {
  // In produzione, recuperare da storage
  // Per ora simula un file
  return {
    filename: `solcraft_report_${reportId}.pdf`,
    data: Buffer.from(`Mock report content for ${reportId}`),
    size: 1024,
    mimeType: 'application/pdf'
  };
}

async function getUserReports(userId) {
  // Simula lista report dell'utente
  return [
    {
      id: 'rpt_001',
      type: 'portfolio_summary',
      format: 'pdf',
      generatedAt: '2024-01-20T10:30:00Z',
      expiresAt: '2024-02-19T10:30:00Z',
      status: 'completed',
      fileSize: 2048,
      downloadUrl: '/api/reports/generate?action=download&reportId=rpt_001'
    },
    {
      id: 'rpt_002',
      type: 'performance_detailed',
      format: 'excel',
      generatedAt: '2024-01-15T14:20:00Z',
      expiresAt: '2024-02-14T14:20:00Z',
      status: 'completed',
      fileSize: 4096,
      downloadUrl: '/api/reports/generate?action=download&reportId=rpt_002'
    }
  ];
}

