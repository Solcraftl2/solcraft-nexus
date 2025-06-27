import React, { useState } from 'react';

const KYCModal = ({ isOpen, onClose, user, onKYCComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Step 1: Informazioni personali
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    phoneNumber: '',
    
    // Step 2: Indirizzo
    address: '',
    city: '',
    postalCode: '',
    country: '',
    
    // Step 3: Documenti
    documentType: 'passport',
    documentNumber: '',
    documentExpiry: '',
    documentFront: null,
    documentBack: null,
    
    // Step 4: Verifica indirizzo
    addressDocument: null,
    addressDocumentType: 'utility_bill'
  });

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field, file) => {
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Il file deve essere inferiore a 5MB');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
    setError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.dateOfBirth && 
               formData.nationality && formData.phoneNumber;
      case 2:
        return formData.address && formData.city && formData.postalCode && formData.country;
      case 3:
        return formData.documentType && formData.documentNumber && 
               formData.documentExpiry && formData.documentFront;
      case 4:
        return formData.addressDocument && formData.addressDocumentType;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setError('');
    } else {
      setError('Completa tutti i campi richiesti per continuare');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const submitKYC = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simula invio dati KYC
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In produzione, qui invieresti i dati a un servizio KYC reale
      const kycData = {
        userId: user.userId,
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          nationality: formData.nationality,
          phoneNumber: formData.phoneNumber
        },
        address: {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country
        },
        documents: {
          identity: {
            type: formData.documentType,
            number: formData.documentNumber,
            expiry: formData.documentExpiry,
            frontImage: formData.documentFront?.name,
            backImage: formData.documentBack?.name
          },
          address: {
            type: formData.addressDocumentType,
            document: formData.addressDocument?.name
          }
        },
        status: 'pending_review',
        submittedAt: new Date().toISOString()
      };
      
      console.log('KYC Data submitted:', kycData);
      
      onKYCComplete({
        status: 'pending_review',
        level: 2,
        message: 'Documenti inviati con successo. Verifica in corso (24-48 ore).'
      });
      
      onClose();
    } catch (error) {
      console.error('Errore invio KYC:', error);
      setError('Errore durante l\'invio. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              📋 Informazioni Personali
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                  placeholder="Mario"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Cognome *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                  placeholder="Rossi"
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Data di Nascita *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Nazionalità *
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Seleziona...</option>
                  <option value="IT">Italia</option>
                  <option value="US">Stati Uniti</option>
                  <option value="GB">Regno Unito</option>
                  <option value="DE">Germania</option>
                  <option value="FR">Francia</option>
                  <option value="ES">Spagna</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Telefono *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                  placeholder="+39 123 456 7890"
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              🏠 Indirizzo di Residenza
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Indirizzo *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
                placeholder="Via Roma 123"
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Città *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                  placeholder="Milano"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  CAP *
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                  placeholder="20100"
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Paese *
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Seleziona...</option>
                <option value="IT">Italia</option>
                <option value="US">Stati Uniti</option>
                <option value="GB">Regno Unito</option>
                <option value="DE">Germania</option>
                <option value="FR">Francia</option>
                <option value="ES">Spagna</option>
              </select>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              🆔 Documento di Identità
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Tipo Documento *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => handleInputChange('documentType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              >
                <option value="passport">Passaporto</option>
                <option value="id_card">Carta d'Identità</option>
                <option value="driving_license">Patente di Guida</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Numero Documento *
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                  placeholder="AB1234567"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Data Scadenza *
                </label>
                <input
                  type="date"
                  value={formData.documentExpiry}
                  onChange={(e) => handleInputChange('documentExpiry', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Fronte Documento * (Max 5MB)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('documentFront', e.target.files[0])}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
              {formData.documentFront && (
                <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem' }}>
                  ✅ {formData.documentFront.name}
                </p>
              )}
            </div>
            
            {formData.documentType !== 'passport' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Retro Documento (Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('documentBack', e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
                {formData.documentBack && (
                  <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem' }}>
                    ✅ {formData.documentBack.name}
                  </p>
                )}
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              📄 Verifica Indirizzo
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Tipo Documento *
              </label>
              <select
                value={formData.addressDocumentType}
                onChange={(e) => handleInputChange('addressDocumentType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              >
                <option value="utility_bill">Bolletta (Luce/Gas/Acqua)</option>
                <option value="bank_statement">Estratto Conto Bancario</option>
                <option value="tax_document">Documento Fiscale</option>
                <option value="rental_agreement">Contratto di Affitto</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Documento Indirizzo * (Max 5MB)
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Il documento deve essere recente (ultimi 3 mesi) e mostrare chiaramente nome e indirizzo
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('addressDocument', e.target.files[0])}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
              {formData.addressDocument && (
                <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem' }}>
                  ✅ {formData.addressDocument.name}
                </p>
              )}
            </div>
          </div>
        );
        
      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              ✅ Riepilogo Verifica
            </h3>
            
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '1.5rem', 
              borderRadius: '0.5rem',
              border: '1px solid #0ea5e9'
            }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0369a1' }}>
                Dati da Verificare:
              </h4>
              
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p><strong>Nome:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Data di Nascita:</strong> {formData.dateOfBirth}</p>
                <p><strong>Nazionalità:</strong> {formData.nationality}</p>
                <p><strong>Telefono:</strong> {formData.phoneNumber}</p>
                <p><strong>Indirizzo:</strong> {formData.address}, {formData.city} {formData.postalCode}, {formData.country}</p>
                <p><strong>Documento:</strong> {formData.documentType} - {formData.documentNumber}</p>
                <p><strong>Documenti Caricati:</strong> {formData.documentFront ? '✅' : '❌'} Fronte, {formData.documentBack ? '✅' : '❌'} Retro, {formData.addressDocument ? '✅' : '❌'} Indirizzo</p>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              border: '1px solid #f59e0b'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                ⚠️ <strong>Importante:</strong> I tuoi documenti saranno verificati entro 24-48 ore. 
                Riceverai una notifica via email con l'esito della verifica.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🔐 Verifica Identità KYC
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Completa la verifica per accedere a tutte le funzionalità
          </p>
          
          {/* Progress Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: step <= currentStep ? '#10b981' : '#e5e7eb',
                color: step <= currentStep ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                {step}
              </div>
            ))}
          </div>
          
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Step {currentStep} di 5
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: currentStep === 1 ? '#f3f4f6' : 'white',
              color: currentStep === 1 ? '#9ca3af' : '#374151',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            ← Indietro
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Avanti →
            </button>
          ) : (
            <button
              onClick={submitKYC}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? '🔄 Invio...' : '✅ Invia Verifica'}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default KYCModal;

