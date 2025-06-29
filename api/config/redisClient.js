import Redis from 'ioredis'

let redis

export function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379/0'
    redis = new Redis(url)
  }
  return redis
}

export async function getCache(key) {
  const client = getRedis()
  const data = await client.get(key)
  return data ? JSON.parse(data) : null
}

export async function setCache(key, value, ttlSeconds = 60) {
  const client = getRedis()
  await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}
