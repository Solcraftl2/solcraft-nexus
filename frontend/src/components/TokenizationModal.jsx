import { logger } from '../../../netlify/functions/utils/logger.js';
import React, { useState } from 'react';
import { tokenizationService } from '../services/xrplTokenizationService';

/**
 * Modal per Tokenizzazione REALE di Asset Immobiliari
 * Sostituisce completamente le simulazioni con transazioni XRPL vere
 */
const TokenizationModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        location: '',
        description: '',
        faceValue: '',
        totalSupply: '',
        currency: 'EUR',
        jurisdiction: 'Italy',
        transferFeePercent: '0.5',
        transferable: true,
        burnable: false,
        valuator: '',
        valuation: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Processing, 4: Success

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        const errors = [];
        
        if (!formData.name.trim()) errors.push('Nome asset richiesto');
        if (!formData.symbol.trim()) errors.push('Simbolo token richiesto');
        if (formData.symbol.length > 20) errors.push('Simbolo massimo 20 caratteri');
        if (!formData.location.trim()) errors.push('Ubicazione asset richiesta');
        if (!formData.faceValue || parseFloat(formData.faceValue) <= 0) errors.push('Valore nominale deve essere > 0');
        if (!formData.totalSupply || parseInt(formData.totalSupply) <= 0) errors.push('Supply totale deve essere > 0');
        if (!formData.valuation || parseFloat(formData.valuation) <= 0) errors.push('Valutazione asset richiesta');

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }

        setStep(2); // Mostra conferma
    };

    const confirmTokenization = async () => {
        setIsLoading(true);
        setError('');
        setStep(3); // Processing

        try {
            // Preparazione dati per tokenizzazione REALE
            const assetData = {
                ...formData,
                faceValue: parseFloat(formData.faceValue),
                totalSupply: parseInt(formData.totalSupply),
                valuation: parseFloat(formData.valuation),
                transferFeePercent: parseFloat(formData.transferFeePercent)
            };

            // Chiamata al servizio di tokenizzazione REALE
            logger.info('🚀 Avvio tokenizzazione REALE su XRPL...');
            const tokenResult = await tokenizationService.createRealEstateToken(assetData);

            logger.info('✅ Token creato con successo:', tokenResult);
            
            setStep(4); // Success
            
            // Notifica al componente padre
            if (onSuccess) {
                onSuccess(tokenResult);
            }

        } catch (error) {
            logger.error('❌ Errore tokenizzazione:', error);
            setError(`Tokenizzazione fallita: ${error.message}`);
            setStep(2); // Torna alla conferma
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            symbol: '',
            location: '',
            description: '',
            faceValue: '',
            totalSupply: '',
            currency: 'EUR',
            jurisdiction: 'Italy',
            transferFeePercent: '0.5',
            transferable: true,
            burnable: false,
            valuator: '',
            valuation: ''
        });
        setStep(1);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Tokenizzazione Asset Immobiliare
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                            disabled={isLoading}
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Crea un Multi-Purpose Token (MPT) reale su XRPL per il tuo asset immobiliare
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4].map((stepNum) => (
                            <div key={stepNum} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step >= stepNum 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {stepNum}
                                </div>
                                {stepNum < 4 && (
                                    <div className={`w-12 h-1 mx-2 ${
                                        step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>Dati Asset</span>
                        <span>Conferma</span>
                        <span>Creazione</span>
                        <span>Completato</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Form */}
                    {step === 1 && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Informazioni Base */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Informazioni Asset
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nome Asset *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="es. Appartamento Milano Centro"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Simbolo Token *
                                        </label>
                                        <input
                                            type="text"
                                            name="symbol"
                                            value={formData.symbol}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="es. MIAPT"
                                            maxLength="20"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ubicazione *
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="es. Milano, Via Brera 15"
                                        required
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descrizione
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Descrizione dettagliata dell'asset immobiliare..."
                                    />
                                </div>
                            </div>

                            {/* Valori Finanziari */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Valori Finanziari
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Valore Nominale *
                                        </label>
                                        <input
                                            type="number"
                                            name="faceValue"
                                            value={formData.faceValue}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="100"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Supply Totale *
                                        </label>
                                        <input
                                            type="number"
                                            name="totalSupply"
                                            value={formData.totalSupply}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="1000"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Valutazione Asset *
                                        </label>
                                        <input
                                            type="number"
                                            name="valuation"
                                            value={formData.valuation}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="100000"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Configurazioni Avanzate */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Configurazioni Token
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Commissione Transfer (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="transferFeePercent"
                                            value={formData.transferFeePercent}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Valutatore
                                        </label>
                                        <input
                                            type="text"
                                            name="valuator"
                                            value={formData.valuator}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nome valutatore certificato"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="transferable"
                                            checked={formData.transferable}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Token trasferibile</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="burnable"
                                            checked={formData.burnable}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Token bruciabile</span>
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Continua
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Confirmation */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Conferma Tokenizzazione
                            </h3>
                            
                            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>Nome:</strong> {formData.name}</div>
                                    <div><strong>Simbolo:</strong> {formData.symbol}</div>
                                    <div><strong>Ubicazione:</strong> {formData.location}</div>
                                    <div><strong>Valore Nominale:</strong> €{formData.faceValue}</div>
                                    <div><strong>Supply Totale:</strong> {formData.totalSupply}</div>
                                    <div><strong>Valutazione:</strong> €{formData.valuation}</div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <p className="text-yellow-800 text-sm">
                                    ⚠️ <strong>Attenzione:</strong> La tokenizzazione creerà un token REALE su XRPL blockchain. 
                                    Questa operazione è irreversibile e comporta commissioni di rete.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={isLoading}
                                >
                                    Modifica
                                </button>
                                <button
                                    onClick={confirmTokenization}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creazione...' : 'Conferma Tokenizzazione'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Creazione Token su XRPL
                            </h3>
                            <p className="text-gray-600">
                                Stiamo creando il tuo Multi-Purpose Token sulla blockchain XRPL. 
                                Questo processo può richiedere alcuni secondi...
                            </p>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Token Creato con Successo!
                            </h3>
                            <p className="text-gray-600">
                                Il tuo asset immobiliare è stato tokenizzato con successo su XRPL blockchain.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Chiudi
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TokenizationModal;

