const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  environment: process.env.SENTRY_ENVIRONMENT || 'development'
});

module.exports = Sentry;
