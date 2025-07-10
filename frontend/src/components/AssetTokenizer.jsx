import React, { useState, useEffect } from 'react';
import xrplService from '../services/xrplService';

/**
 * AssetTokenizer - Componente per tokenizzazione di asset su XRPL
 * Permette di creare token personalizzati per rappresentare asset reali
 */
const AssetTokenizer = ({ wallet, onTokenCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    assetName: '',
    tokenCode: '',
    totalSupply: '',
    description: '',
    assetType: 'real_estate',
    valuation: '',
    documents: []
  });
  const [createdTokens, setCreatedTokens] = useState([]);

  const assetTypes = [
    { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
    { value: 'art', label: 'Art & Collectibles', icon: '🎨' },
    { value: 'commodities', label: 'Commodities', icon: '🥇' },
    { value: 'bonds', label: 'Bonds & Securities', icon: '📊' },
    { value: 'carbon_credits', label: 'Carbon Credits', icon: '🌱' },
    { value: 'insurance', label: 'Insurance Policies', icon: '🛡️' },
    { value: 'other', label: 'Other Assets', icon: '💼' }
  ];

  useEffect(() => {
    loadCreatedTokens();
  }, [wallet]);

  const loadCreatedTokens = () => {
    // Carica token creati dal localStorage per ora
    const saved = localStorage.getItem(`tokens_${wallet?.address}`);
    if (saved) {
      setCreatedTokens(JSON.parse(saved));
    }
  };

  const saveToken = (tokenData) => {
    const saved = localStorage.getItem(`tokens_${wallet?.address}`) || '[]';
    const tokens = JSON.parse(saved);
    tokens.push(tokenData);
    localStorage.setItem(`tokens_${wallet?.address}`, JSON.stringify(tokens));
    setCreatedTokens(tokens);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-genera token code dal nome asset
    if (name === 'assetName') {
      const tokenCode = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 3);
      setFormData(prev => ({
        ...prev,
        tokenCode: tokenCode
      }));
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.assetName.trim()) errors.push('Asset name is required');
    if (!formData.tokenCode.trim()) errors.push('Token code is required');
    if (formData.tokenCode.length < 3) errors.push('Token code must be at least 3 characters');
    if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) errors.push('Valid total supply is required');
    if (!formData.valuation || parseFloat(formData.valuation) <= 0) errors.push('Valid asset valuation is required');
    
    return errors;
  };

  const createToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Validazione
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      if (!wallet || !wallet.seed) {
        throw new Error('Wallet not connected or invalid');
      }

      // Step 1: Crea Trust Line per il nuovo token
      console.log('Creating Trust Line for token:', formData.tokenCode);
      const trustLineResult = await xrplService.createTrustLine(
        wallet,
        formData.tokenCode,
        wallet.address,
        formData.totalSupply
      );

      if (!trustLineResult.success) {
        throw new Error('Failed to create Trust Line');
      }

      // Step 2: Emetti il token
      console.log('Issuing token:', formData.tokenCode);
      const issueResult = await xrplService.issueToken(
        wallet,
        wallet.address, // Per ora emetti a se stesso
        formData.tokenCode,
        formData.totalSupply
      );

      if (!issueResult.success) {
        throw new Error('Failed to issue token');
      }

      // Step 3: Salva i metadati del token
      const tokenData = {
        id: Date.now(),
        ...formData,
        issuer: wallet.address,
        createdAt: new Date().toISOString(),
        txHash: issueResult.hash,
        trustLineTxHash: trustLineResult.hash,
        status: 'active',
        currentSupply: formData.totalSupply,
        holders: 1
      };

      saveToken(tokenData);

      setSuccess(`Token ${formData.tokenCode} created successfully! TX: ${issueResult.hash}`);
      
      // Reset form
      setFormData({
        assetName: '',
        tokenCode: '',
        totalSupply: '',
        description: '',
        assetType: 'real_estate',
        valuation: '',
        documents: []
      });

      if (onTokenCreated) {
        onTokenCreated(tokenData);
      }

    } catch (error) {
      console.error('Token creation error:', error);
      setError(`Token creation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAssetTypeInfo = (type) => {
    return assetTypes.find(t => t.value === type) || assetTypes[0];
  };

  if (!wallet) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Required</h3>
          <p className="text-gray-600">Please connect your XRPL wallet to tokenize assets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Asset Tokenizer</h2>
            <p className="text-gray-600">Create tokens representing real-world assets on XRPL</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Connected Wallet</div>
            <div className="font-mono text-sm text-gray-900">
              {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Tokenization Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Asset Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>
              <input
                type="text"
                name="assetName"
                value={formData.assetName}
                onChange={handleInputChange}
                placeholder="e.g., Manhattan Office Building"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select
                name="assetType"
                value={formData.assetType}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {assetTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Valuation (USD)</label>
              <input
                type="number"
                name="valuation"
                value={formData.valuation}
                onChange={handleInputChange}
                placeholder="1000000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Detailed description of the asset..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Token Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Token Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Token Code</label>
              <input
                type="text"
                name="tokenCode"
                value={formData.tokenCode}
                onChange={handleInputChange}
                placeholder="MAN"
                maxLength={20}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">3-20 characters, auto-generated from asset name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Supply</label>
              <input
                type="number"
                name="totalSupply"
                value={formData.totalSupply}
                onChange={handleInputChange}
                placeholder="1000000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Number of tokens to create</p>
            </div>

            {/* Token Economics Preview */}
            {formData.valuation && formData.totalSupply && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Token Economics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Price:</span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(formData.valuation) / parseFloat(formData.totalSupply || 1))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market Cap:</span>
                    <span className="font-medium">{formatCurrency(formData.valuation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Supply:</span>
                    <span className="font-medium">{parseInt(formData.totalSupply || 0).toLocaleString()} {formData.tokenCode}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Token Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={createToken}
            disabled={isLoading || !formData.assetName || !formData.tokenCode || !formData.totalSupply}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Token...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Token
              </>
            )}
          </button>
        </div>
      </div>

      {/* Created Tokens */}
      {createdTokens.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Created Tokens</h3>
          <div className="space-y-4">
            {createdTokens.map((token) => {
              const assetType = getAssetTypeInfo(token.assetType);
              return (
                <div key={token.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{assetType.icon}</div>
                      <div>
                        <div className="font-semibold text-gray-900">{token.assetName}</div>
                        <div className="text-sm text-gray-600">{token.tokenCode} • {assetType.label}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(token.valuation)}</div>
                      <div className="text-sm text-gray-600">{parseInt(token.totalSupply).toLocaleString()} tokens</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
                    <span className="font-mono">TX: {token.txHash.slice(0, 8)}...{token.txHash.slice(-6)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTokenizer;

