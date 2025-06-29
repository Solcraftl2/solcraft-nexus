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
    const { documentId, documentType, fileUrl, userId } = req.body;
    if (!documentId || !fileUrl || !userId) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const onfidoToken = process.env.ONFIDO_TOKEN || '';
    const form = new FormData();
    const fileRes = await fetch(fileUrl);
    const blob = await fileRes.blob();

    form.append('file', blob, 'document');
    form.append('type', documentType.toLowerCase());
    form.append('applicant_id', userId);

    const providerRes = await fetch('https://api.onfido.com/v3.5/documents', {
      method: 'POST',
      headers: {
        Authorization: `Token token=${onfidoToken}`
      },
      body: form
    });

    const providerData = await providerRes.json();
    if (!providerRes.ok) {
      console.error('KYC provider error:', providerData);
      return res.status(500).json({ success: false, error: 'Provider error' });
    }

    return res.status(200).json({ success: true, providerReference: providerData.id });
  } catch (error) {
    console.error('KYC submit error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
