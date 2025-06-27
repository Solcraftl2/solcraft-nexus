import React, { useState, useEffect } from 'react';
import { KYCService } from '../services/kycService';

const KYCModal = ({ isOpen, onClose, user, onKYCUpdate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [kycData, setKycData] = useState(null);
  
  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: ''
  });
  
  const [phoneOTP, setPhoneOTP] = useState('');
  const [documents, setDocuments] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (isOpen && user) {
      loadKYCData();
    }
  }, [isOpen, user]);

  const loadKYCData = async () => {
    setLoading(true);
    const result = await KYCService.getUserKYCStatus(user.id);
    if (result.success) {
      setKycData(result);
      // Determina step corrente basato su stato KYC
      if (result.kycStatus === 'not_started') {
        setCurrentStep(1);
      } else if (result.kycLevel === 0) {
        setCurrentStep(2);
      } else if (result.kycLevel === 1) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4);
      }
    }
    setLoading(false);
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await KYCService.startKYCProcess(user.id, personalInfo);
    if (result.success) {
      setSuccess('Informazioni personali salvate con successo!');
      setCurrentStep(2);
      await loadKYCData();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handlePhoneVerification = async () => {
    setLoading(true);
    setError('');
    
    const result = await KYCService.verifyPhone(user.id, personalInfo.phone);
    if (result.success) {
      setSuccess('OTP inviato al tuo telefono!');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleOTPConfirm = async () => {
    setLoading(true);
    setError('');
    
    const result = await KYCService.confirmPhoneOTP(user.id, phoneOTP);
    if (result.success) {
      setSuccess('Telefono verificato con successo!');
      setCurrentStep(3);
      await loadKYCData();
      if (onKYCUpdate) onKYCUpdate();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleDocumentUpload = async (documentType, file) => {
    setLoading(true);
    setError('');
    setUploadProgress({ ...uploadProgress, [documentType]: 0 });
    
    const result = await KYCService.uploadDocument(user.id, documentType, file);
    if (result.success) {
      setDocuments({ ...documents, [documentType]: result.document });
      setSuccess(`${KYCService.DOCUMENT_TYPES[documentType]} caricato con successo!`);
      await loadKYCData();
      if (onKYCUpdate) onKYCUpdate();
    } else {
      setError(result.error);
    }
    
    setUploadProgress({ ...uploadProgress, [documentType]: 100 });
    setLoading(false);
  };

  const renderProgressBar = () => {
    const steps = [
      { id: 1, name: 'Info Personali', completed: currentStep > 1 },
      { id: 2, name: 'Verifica Telefono', completed: currentStep > 2 },
      { id: 3, name: 'Documenti', completed: currentStep > 3 },
      { id: 4, name: 'Completato', completed: currentStep >= 4 }
    ];

    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          {steps.map((step, index) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: step.completed ? '#10b981' : currentStep === step.id ? '#3b82f6' : '#e5e7eb',
                color: step.completed || currentStep === step.id ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {step.completed ? '✓' : step.id}
              </div>
              <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.875rem',
                color: step.completed ? '#10b981' : currentStep === step.id ? '#3b82f6' : '#6b7280',
                fontWeight: currentStep === step.id ? '600' : '400'
              }}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: step.completed ? '#10b981' : '#e5e7eb',
                  marginLeft: '1rem'
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderKYCLevel = () => {
    if (!kycData) return null;
    
    const level = kycData.levelInfo;
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        border: `2px solid ${level.color}`,
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: level.color, fontWeight: '600' }}>
              Livello KYC: {level.name}
            </h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Limite transazioni: {level.limit === Infinity ? 'Illimitato' : `€${level.limit.toLocaleString()}`}
            </p>
          </div>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: level.color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 'bold'
          }}>
            {kycData.kycLevel}
          </div>
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <form onSubmit={handlePersonalInfoSubmit}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
        📋 Informazioni Personali
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Nome *
          </label>
          <input
            type="text"
            value={personalInfo.firstName}
            onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Cognome *
          </label>
          <input
            type="text"
            value={personalInfo.lastName}
            onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Data di Nascita *
          </label>
          <input
            type="date"
            value={personalInfo.dateOfBirth}
            onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Nazionalità *
          </label>
          <select
            value={personalInfo.nationality}
            onChange={(e) => setPersonalInfo({ ...personalInfo, nationality: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
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

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Indirizzo *
        </label>
        <input
          type="text"
          value={personalInfo.address}
          onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
          required
          placeholder="Via, numero civico"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Città *
          </label>
          <input
            type="text"
            value={personalInfo.city}
            onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            CAP *
          </label>
          <input
            type="text"
            value={personalInfo.postalCode}
            onChange={(e) => setPersonalInfo({ ...personalInfo, postalCode: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Paese *
          </label>
          <select
            value={personalInfo.country}
            onChange={(e) => setPersonalInfo({ ...personalInfo, country: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
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

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Telefono *
        </label>
        <input
          type="tel"
          value={personalInfo.phone}
          onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
          required
          placeholder="+39 123 456 7890"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Salvataggio...' : 'Continua'}
      </button>
    </form>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
        📱 Verifica Telefono
      </h3>
      
      <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
        Verifica il tuo numero di telefono per aumentare la sicurezza del tuo account.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Numero di Telefono
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handlePhoneVerification}
            disabled={loading || !personalInfo.phone}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !personalInfo.phone ? 0.7 : 1
            }}
          >
            Invia OTP
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Codice OTP
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={phoneOTP}
            onChange={(e) => setPhoneOTP(e.target.value)}
            placeholder="123456"
            maxLength={6}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              textAlign: 'center',
              letterSpacing: '0.1em'
            }}
          />
          <button
            onClick={handleOTPConfirm}
            disabled={loading || phoneOTP.length !== 6}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || phoneOTP.length !== 6 ? 0.7 : 1
            }}
          >
            Verifica
          </button>
        </div>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#fef3c7',
        borderRadius: '0.5rem',
        border: '1px solid #f59e0b'
      }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
          💡 <strong>Suggerimento:</strong> Il codice OTP verrà inviato via SMS al numero fornito. 
          Il codice è valido per 10 minuti.
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const DocumentUpload = ({ type, title, description, required = false }) => {
      const hasDocument = kycData?.documents?.find(doc => doc.document_type === type);
      
      return (
        <div style={{
          padding: '1rem',
          border: '2px dashed #d1d5db',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          backgroundColor: hasDocument ? '#f0f9ff' : '#fafafa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
              {title} {required && <span style={{ color: '#dc2626' }}>*</span>}
            </h4>
            {hasDocument && (
              <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: hasDocument.status === 'verified' ? '#10b981' : 
                                hasDocument.status === 'rejected' ? '#dc2626' : '#f59e0b',
                color: 'white',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {hasDocument.status === 'verified' ? 'Verificato' :
                 hasDocument.status === 'rejected' ? 'Rifiutato' : 'In Revisione'}
              </span>
            )}
          </div>
          
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
            {description}
          </p>
          
          {!hasDocument ? (
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleDocumentUpload(type, file);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem'
              }}
            />
          ) : (
            <div style={{
              padding: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}>
              📄 {hasDocument.file_name}
              {hasDocument.rejection_reason && (
                <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.75rem' }}>
                  Motivo rifiuto: {hasDocument.rejection_reason}
                </p>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          📄 Caricamento Documenti
        </h3>
        
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Carica i tuoi documenti di identità per completare la verifica KYC.
        </p>

        <DocumentUpload
          type="ID_CARD"
          title="Carta d'Identità o Passaporto"
          description="Carica una foto chiara del fronte e retro della tua carta d'identità o passaporto."
          required
        />

        <DocumentUpload
          type="UTILITY_BILL"
          title="Prova di Residenza"
          description="Bolletta, estratto conto o documento ufficiale con il tuo indirizzo (non più vecchio di 3 mesi)."
        />

        <DocumentUpload
          type="SELFIE"
          title="Selfie con Documento"
          description="Scatta un selfie tenendo in mano il tuo documento di identità accanto al viso."
        />

        <div style={{
          padding: '1rem',
          backgroundColor: '#ecfdf5',
          borderRadius: '0.5rem',
          border: '1px solid #10b981',
          marginTop: '1rem'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#065f46' }}>
            🔒 <strong>Sicurezza:</strong> I tuoi documenti sono crittografati e conservati in modo sicuro. 
            Vengono utilizzati solo per la verifica dell'identità secondo le normative KYC/AML.
          </p>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
      
      <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
        Verifica KYC Completata!
      </h3>
      
      <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '1.1rem' }}>
        Il tuo account è stato verificato con successo. Ora puoi accedere a tutte le funzionalità della piattaforma.
      </p>

      {renderKYCLevel()}

      <div style={{
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '0.5rem',
        border: '1px solid #3b82f6',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Cosa puoi fare ora:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af' }}>
          <li>Tokenizzare asset fino al tuo limite</li>
          <li>Partecipare al marketplace</li>
          <li>Ricevere dividendi e rendimenti</li>
          <li>Accedere a investimenti esclusivi</li>
        </ul>
      </div>

      <button
        onClick={onClose}
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Inizia a Investire
      </button>
    </div>
  );

  if (!isOpen) return null;

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
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
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

        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          🆔 Verifica KYC
        </h2>

        {kycData && renderKYCLevel()}
        {renderProgressBar()}

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#10b981', fontSize: '0.875rem', margin: 0 }}>
              ✅ {success}
            </p>
          </div>
        )}

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              🔄 Elaborazione in corso...
            </p>
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default KYCModal;

