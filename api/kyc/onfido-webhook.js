import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const payload = JSON.parse(raw);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const checkId = payload.payload?.object?.check_id;
    const result = payload.payload?.object?.result;

    if (!checkId) {
      return res.status(400).json({ success: false });
    }

    const status = result === 'clear' ? 'verified' : 'rejected';

    const { data: doc } = await supabase
      .from('kyc_documents')
      .select('id, user_id')
      .eq('provider_check_id', checkId)
      .single();

    if (doc) {
      await supabase
        .from('kyc_documents')
        .update({ status, verified_at: new Date().toISOString() })
        .eq('id', doc.id);

      if (status === 'verified') {
        const { data: verifiedDocs } = await supabase
          .from('kyc_documents')
          .select('document_type')
          .eq('user_id', doc.user_id)
          .eq('status', 'verified');

        const types = verifiedDocs.map(d => d.document_type);
        let level = 0;
        if (types.includes('ID_CARD') || types.includes('PASSPORT')) level = 2;
        if (types.includes('UTILITY_BILL') || types.includes('BANK_STATEMENT')) level = Math.max(level, 3);
        if (types.includes('SELFIE') && level >= 2) level = 4;

        const { data: user } = await supabase
          .from('users')
          .select('kyc_level')
          .eq('id', doc.user_id)
          .single();

        if (level > (user?.kyc_level || 0)) {
          await supabase
            .from('users')
            .update({
              kyc_level: level,
              kyc_status: level >= 2 ? 'verified' : 'in_progress',
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.user_id);
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Onfido webhook error:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
