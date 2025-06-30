export function applySecurityHeaders(res) {
  const allowedOrigin = process.env.FRONTEND_URL || 'https://solcraft-nexus-platform.vercel.app';
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
}
