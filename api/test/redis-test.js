import { Redis } from '@upstash/redis';

// Test connessione Redis con le credenziali fornite
async function testRedisConnection() {
  try {
    console.log('🔄 Testing Redis connection...');
    
    // Configurazione Redis con credenziali Upstash
    const redis = new Redis({
      url: 'https://trusted-grackle-16855.upstash.io',
      token: 'AkHXAAIgcDHtRT0JFBE_i6iQG_9O9zIKlH3arFQzSZbEaotOjnQlcw'
    });
    
    // Test ping
    const pingResult = await redis.ping();
    console.log('✅ Redis PING result:', pingResult);
    
    // Test set/get
    const testKey = 'solcraft_test_' + Date.now();
    const testValue = { message: 'SolCraft Nexus Redis Test', timestamp: new Date().toISOString() };
    
    await redis.set(testKey, JSON.stringify(testValue), { ex: 60 }); // 60 seconds TTL
    console.log('✅ Redis SET successful:', testKey);
    
    const retrievedValue = await redis.get(testKey);
    console.log('✅ Redis GET result:', JSON.parse(retrievedValue));
    
    // Test delete
    await redis.del(testKey);
    console.log('✅ Redis DEL successful');
    
    // Test rate limiting functionality
    const rateLimitKey = 'rate_limit_test';
    const count1 = await redis.incr(rateLimitKey);
    const count2 = await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 60);
    console.log('✅ Redis rate limiting test:', { count1, count2 });
    
    // Cleanup
    await redis.del(rateLimitKey);
    
    console.log('🎉 All Redis tests passed successfully!');
    
    return {
      status: 'success',
      ping: pingResult,
      connection: 'healthy',
      features: {
        set_get: 'working',
        expiration: 'working',
        rate_limiting: 'working'
      }
    };
    
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return {
      status: 'error',
      error: error.message,
      connection: 'failed'
    };
  }
}

// Test per verificare configurazione
async function testRedisConfig() {
  console.log('🔧 Testing Redis configuration...');
  
  const config = {
    url: 'https://trusted-grackle-16855.upstash.io',
    token: 'AkHXAAIgcDHtRT0JFBE_i6iQG_9O9zIKlH3arFQzSZbEaotOjnQlcw',
    redis_url: 'rediss://default:AUHXAAIjcDEwYTMzMjJiZjMyZjE0YmUzYTg5NzZkOTczMzRmY2JlN3AxMA@trusted-grackle-16855.upstash.io:6379'
  };
  
  console.log('📋 Redis Configuration:');
  console.log('- REST URL:', config.url);
  console.log('- Token:', config.token.substring(0, 20) + '...');
  console.log('- Redis URL:', config.redis_url.substring(0, 50) + '...');
  
  return config;
}

// Esecuzione test se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testRedisConfig();
  testRedisConnection()
    .then(result => {
      console.log('Final result:', result);
      process.exit(result.status === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testRedisConnection, testRedisConfig };

