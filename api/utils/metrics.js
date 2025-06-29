import { Histogram, Counter, register, collectDefaultMetrics } from 'prom-client'

collectDefaultMetrics()

export const httpRequestDuration = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['route', 'method', 'status_code']
})

export const httpRequestErrors = new Counter({
  name: 'api_request_errors_total',
  help: 'Total number of API errors',
  labelNames: ['route', 'method', 'status_code']
})

export { register }
