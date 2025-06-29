import client from 'prom-client'

export const register = new client.Registry()
client.collectDefaultMetrics({ register })

export const httpRequestDuration = new client.Histogram({
  name: 'api_latency_seconds',
  help: 'API response time in seconds',
  labelNames: ['route', 'method', 'status'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5]
})

export const httpErrorCounter = new client.Counter({
  name: 'api_errors_total',
  help: 'Total API errors',
  labelNames: ['route', 'method', 'status']
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpErrorCounter)
