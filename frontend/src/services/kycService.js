// Servizio per gestire il processo KYC (Know Your Customer)
import { supabase } from './supabaseService';

export class KYCService {
  // Livelli KYC e relativi limiti
  static KYC_LEVELS = {
    0: { name: 'Non Verificato', limit: 500, color: '#dc2626' },
    1: { name: 'Base', limit: 2500, color: '#f59e0b' },
    2: { name: 'Intermedio', limit: 10000, color: '#3b82f6' },
    3: { name: 'Avanzato', limit: 50000, color: '#10b981' },
    4: { name: 'Premium', limit: Infinity, color: '#8b5cf6' }
  };

  // Tipi di documenti accettati
  static DOCUMENT_TYPES = {
    ID_CARD: 'Carta d\'Identità',
    PASSPORT: 'Passaporto',
    DRIVING_LICENSE: 'Patente di Guida',
    UTILITY_BILL: 'Bolletta',
    BANK_STATEMENT: 'Estratto Conto',
    SELFIE: 'Selfie con Documento'
  };

  // Ottieni stato KYC utente
  static async getUserKYCStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          kyc_status,
          kyc_level,
          kyc_documents (
            id,
            document_type,
            status,
            uploaded_at,
            verified_at,
            rejection_reason
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        kycStatus: data.kyc_status || 'not_started',
        kycLevel: data.kyc_level || 0,
        documents: data.kyc_documents || [],
        levelInfo: this.KYC_LEVELS[data.kyc_level || 0]
      };
    } catch (error) {
      console.error('Errore recupero stato KYC:', error);
      return { success: false, error: error.message };
    }
  }

  // Avvia processo KYC
  static async startKYCProcess(userId, personalInfo) {
    try {
      // Aggiorna informazioni personali utente
      const { error: userError } = await supabase
        .from('users')
        .update({
          kyc_status: 'in_progress',
          kyc_level: 0,
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          date_of_birth: personalInfo.dateOfBirth,
          nationality: personalInfo.nationality,
          address: personalInfo.address,
          city: personalInfo.city,
          postal_code: personalInfo.postalCode,
          country: personalInfo.country,
          phone: personalInfo.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Crea record audit
      await this.createAuditRecord(userId, 'kyc_started', 'Processo KYC avviato');

      return { success: true };
    } catch (error) {
      console.error('Errore avvio KYC:', error);
      return { success: false, error: error.message };
    }
  }

  // Carica documento
  static async uploadDocument(userId, documentType, file, additionalData = {}) {
    try {
      // Upload file su Supabase Storage
      const fileName = `${userId}/${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Salva metadata documento nel database
      const { data, error } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: userId,
          document_type: documentType,
          file_path: uploadData.path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
          metadata: additionalData
        })
        .select()
        .single();

      if (error) throw error;

      // Crea record audit
      await this.createAuditRecord(
        userId, 
        'document_uploaded', 
        `Documento ${this.DOCUMENT_TYPES[documentType]} caricato`
      );

      // Verifica automatica se possibile
      await this.autoVerifyDocument(data.id, documentType);

      return { success: true, document: data };
    } catch (error) {
      console.error('Errore upload documento:', error);
      return { success: false, error: error.message };
    }
  }

  // Verifica automatica documento (simulata)
  static async autoVerifyDocument(documentId, documentType) {
    try {
      // Simulazione verifica automatica
      const isValid = Math.random() > 0.2; // 80% successo
      const status = isValid ? 'verified' : 'rejected';
      const rejectionReason = isValid ? null : 'Documento non leggibile o danneggiato';

      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status,
          verified_at: isValid ? new Date().toISOString() : null,
          rejection_reason: rejectionReason,
          verified_by: 'auto_system'
        })
        .eq('id', documentId);

      if (error) throw error;

      // Se verificato, controlla se può avanzare di livello
      if (isValid) {
        await this.checkLevelUpgrade(documentId);
      }

      return { success: true, status };
    } catch (error) {
      console.error('Errore verifica automatica:', error);
      return { success: false, error: error.message };
    }
  }

  // Controlla se l'utente può avanzare di livello KYC
  static async checkLevelUpgrade(documentId) {
    try {
      // Ottieni documento e utente
      const { data: document } = await supabase
        .from('kyc_documents')
        .select('user_id')
        .eq('id', documentId)
        .single();

      if (!document) return;

      // Ottieni tutti i documenti verificati dell'utente
      const { data: verifiedDocs } = await supabase
        .from('kyc_documents')
        .select('document_type')
        .eq('user_id', document.user_id)
        .eq('status', 'verified');

      const docTypes = verifiedDocs.map(doc => doc.document_type);
      let newLevel = 0;

      // Logica avanzamento livelli
      if (docTypes.includes('ID_CARD') || docTypes.includes('PASSPORT')) {
        newLevel = Math.max(newLevel, 2);
      }
      
      if (docTypes.includes('UTILITY_BILL') || docTypes.includes('BANK_STATEMENT')) {
        newLevel = Math.max(newLevel, 3);
      }
      
      if (docTypes.includes('SELFIE') && newLevel >= 2) {
        newLevel = Math.max(newLevel, 4);
      }

      // Aggiorna livello utente se migliorato
      const { data: currentUser } = await supabase
        .from('users')
        .select('kyc_level')
        .eq('id', document.user_id)
        .single();

      if (newLevel > (currentUser?.kyc_level || 0)) {
        await supabase
          .from('users')
          .update({
            kyc_level: newLevel,
            kyc_status: newLevel >= 2 ? 'verified' : 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', document.user_id);

        // Crea record audit
        await this.createAuditRecord(
          document.user_id,
          'level_upgraded',
          `Livello KYC aggiornato a ${this.KYC_LEVELS[newLevel].name}`
        );
      }

      return { success: true, newLevel };
    } catch (error) {
      console.error('Errore controllo upgrade livello:', error);
      return { success: false, error: error.message };
    }
  }

  // Verifica telefono con OTP
  static async verifyPhone(userId, phoneNumber) {
    try {
      // Genera OTP (in produzione usare servizio SMS reale)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Salva OTP nel database (con scadenza)
      const { error } = await supabase
        .from('phone_verifications')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          otp_code: otp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minuti
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // In produzione: inviare SMS con OTP
      console.log(`SMS OTP per ${phoneNumber}: ${otp}`);

      return { success: true, message: 'OTP inviato via SMS' };
    } catch (error) {
      console.error('Errore verifica telefono:', error);
      return { success: false, error: error.message };
    }
  }

  // Conferma OTP telefono
  static async confirmPhoneOTP(userId, otp) {
    try {
      const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('otp_code', otp)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { success: false, error: 'OTP non valido o scaduto' };
      }

      // Marca telefono come verificato
      await supabase
        .from('users')
        .update({
          phone_verified: true,
          kyc_level: Math.max(1, 0), // Almeno livello 1
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Elimina OTP usato
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('id', data.id);

      await this.createAuditRecord(userId, 'phone_verified', 'Telefono verificato con successo');

      return { success: true };
    } catch (error) {
      console.error('Errore conferma OTP:', error);
      return { success: false, error: error.message };
    }
  }

  // Crea record audit
  static async createAuditRecord(userId, action, description) {
    try {
      await supabase
        .from('kyc_audit_log')
        .insert({
          user_id: userId,
          action,
          description,
          timestamp: new Date().toISOString(),
          ip_address: 'unknown', // In produzione recuperare IP reale
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Errore creazione audit record:', error);
    }
  }

  // Ottieni URL firmato per visualizzare documento
  static async getDocumentUrl(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 3600); // 1 ora

      if (error) throw error;
      return { success: true, url: data.signedUrl };
    } catch (error) {
      console.error('Errore generazione URL documento:', error);
      return { success: false, error: error.message };
    }
  }

  // Ottieni statistiche KYC per admin
  static async getKYCStats() {
    try {
      const { data: stats, error } = await supabase
        .from('users')
        .select('kyc_level, kyc_status')
        .not('kyc_status', 'is', null);

      if (error) throw error;

      const levelCounts = {};
      const statusCounts = {};

      stats.forEach(user => {
        levelCounts[user.kyc_level] = (levelCounts[user.kyc_level] || 0) + 1;
        statusCounts[user.kyc_status] = (statusCounts[user.kyc_status] || 0) + 1;
      });

      return {
        success: true,
        stats: {
          totalUsers: stats.length,
          levelDistribution: levelCounts,
          statusDistribution: statusCounts
        }
      };
    } catch (error) {
      console.error('Errore recupero statistiche KYC:', error);
      return { success: false, error: error.message };
    }
  }
}

