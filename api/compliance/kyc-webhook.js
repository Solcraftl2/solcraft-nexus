import { supabase } from '../config/supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const event = req.body || {};
    const providerRef = event.document_id || event.payload?.document?.id;
    const status = event.status || event.payload?.status;
    const reason = event.reason || event.payload?.reason;

    if (!providerRef || !status) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    const { data, error } = await supabase
      .from('kyc_documents')
      .update({
        status: status === 'approved' ? 'verified' : status,
        verified_at: status === 'approved' ? new Date().toISOString() : null,
        rejection_reason: status === 'rejected' ? reason || null : null
      })
      .eq('provider_reference', providerRef)
      .select('user_id')
      .single();

    if (error) throw error;

    if (status === 'approved' && data?.user_id) {
      await checkLevelUpgrade(data.user_id);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('KYC webhook error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function checkLevelUpgrade(userId) {
  const { data: verifiedDocs } = await supabase
    .from('kyc_documents')
    .select('document_type')
    .eq('user_id', userId)
    .eq('status', 'verified');

  const docTypes = (verifiedDocs || []).map(d => d.document_type);
  let newLevel = 0;
  if (docTypes.includes('ID_CARD') || docTypes.includes('PASSPORT')) {
    newLevel = Math.max(newLevel, 2);
  }
  if (docTypes.includes('UTILITY_BILL') || docTypes.includes('BANK_STATEMENT')) {
    newLevel = Math.max(newLevel, 3);
  }
  if (docTypes.includes('SELFIE') && newLevel >= 2) {
    newLevel = Math.max(newLevel, 4);
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('kyc_level')
    .eq('id', userId)
    .single();

  if (newLevel > (currentUser?.kyc_level || 0)) {
    await supabase
      .from('users')
      .update({
        kyc_level: newLevel,
        kyc_status: newLevel >= 2 ? 'verified' : 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  }
}
