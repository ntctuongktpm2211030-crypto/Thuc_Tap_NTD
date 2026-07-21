import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  // Set up connection options with strict timeout and retries to avoid blocking the app
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    retryStrategy(times) {
      if (times > 2) {
        logger.warn('Redis', `Redis connection unreachable after ${times} retries. Running with Memory Cache fallback.`);
        isRedisAvailable = false;
        return null; // stop retrying
      }
      return 1000;
    }
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    logger.info('Redis', 'Connected to Redis successfully.');
  });

  redisClient.on('ready', () => {
    isRedisAvailable = true;
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    logger.debug('Redis', `Redis error: ${err.message}`);
  });
} catch (err: any) {
  logger.warn('Redis', `Failed to construct Redis client: ${err.message}`);
  redisClient = null;
  isRedisAvailable = false;
}

export { redisClient, isRedisAvailable };
