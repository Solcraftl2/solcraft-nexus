import { createClient } from '@supabase/supabase-js';
import { Onfido } from '@onfido/api';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, documentId, documentType, fileUrl } = req.body;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const onfido = new Onfido({ apiToken: process.env.ONFIDO_API_TOKEN });

    // Create applicant
    const { data: user } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    const applicant = await onfido.applicant.create({
      first_name: user?.first_name || 'User',
      last_name: user?.last_name || 'User'
    });

    // Download file and upload to Onfido
    const fileRes = await fetch(fileUrl);
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    await onfido.document.upload({
      applicantId: applicant.id,
      file: buffer,
      filename: `${documentType}.jpg`,
      type: documentType.toLowerCase()
    });

    const check = await onfido.check.create({
      applicantId: applicant.id,
      reportNames: ['document']
    });

    await supabase
      .from('kyc_documents')
      .update({
        provider_applicant_id: applicant.id,
        provider_check_id: check.id,
        status: 'submitted'
      })
      .eq('id', documentId);

    return res.status(200).json({ success: true, checkId: check.id });
  } catch (error) {
    console.error('Onfido initiation error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
