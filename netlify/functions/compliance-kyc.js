const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'solcraft-secret-key');

    if (event.httpMethod === 'GET') {
      // Get KYC status
      const kycStatus = {
        user: decoded.email,
        status: 'verified',
        level: 'tier_3',
        verificationDate: '2025-06-20T14:30:00Z',
        expiryDate: '2026-06-20T14:30:00Z',
        documents: {
          identity: {
            type: 'passport',
            status: 'verified',
            verifiedAt: '2025-06-20T14:30:00Z'
          },
          address: {
            type: 'utility_bill',
            status: 'verified',
            verifiedAt: '2025-06-20T14:35:00Z'
          },
          income: {
            type: 'bank_statement',
            status: 'verified',
            verifiedAt: '2025-06-20T14:40:00Z'
          }
        },
        limits: {
          dailyTrading: 500000,
          monthlyTrading: 10000000,
          maxPositionSize: 2000000,
          withdrawalDaily: 100000,
          withdrawalMonthly: 1000000
        },
        riskProfile: {
          score: 7.5,
          category: 'moderate_aggressive',
          lastAssessment: '2025-06-20T15:00:00Z',
          nextReview: '2025-12-20T15:00:00Z'
        },
        compliance: {
          amlStatus: 'clear',
          sanctionsCheck: 'clear',
          pepStatus: 'not_pep',
          lastScreening: '2025-06-26T00:00:00Z',
          nextScreening: '2025-07-26T00:00:00Z'
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: kycStatus
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Submit KYC documents
      const { documentType, documentData, documentFile } = JSON.parse(event.body);

      if (!documentType || !documentData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      const submissionId = `KYC_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      const submission = {
        id: submissionId,
        user: decoded.email,
        documentType,
        status: 'pending_review',
        submittedAt: new Date().toISOString(),
        estimatedReviewTime: '24-48 hours',
        reviewerNotes: null,
        metadata: {
          ipAddress: event.headers['x-forwarded-for'] || 'unknown',
          userAgent: event.headers['user-agent'] || 'unknown',
          documentHash: `HASH_${Math.random().toString(36).substr(2, 16)}`
        }
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'KYC document submitted successfully',
          data: submission
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('KYC Compliance Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

