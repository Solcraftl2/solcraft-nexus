import { register } from './utils/metrics.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', register.contentType)
  const metrics = await register.metrics()
  res.status(200).send(metrics)
}
