const Redis = require('ioredis');

const normalize = (value = '') => value.trim();

const nodeEnv = normalize(process.env.NODE_ENV).toLowerCase();
const enableFlag = normalize(process.env.ENABLE_REDIS).toLowerCase();

const localFallbackUrl = normalize(process.env.REDIS_URL_LOCAL);
const prodFallbackUrl = normalize(process.env.REDIS_URL_PROD);

let resolvedRedisUrl = '';

if (nodeEnv === 'production' && prodFallbackUrl) {
  resolvedRedisUrl = prodFallbackUrl;
} else if (localFallbackUrl) {
  resolvedRedisUrl = localFallbackUrl;
}

const isRedisEnabled = enableFlag === 'true' && resolvedRedisUrl;
const redisUrl = isRedisEnabled ? resolvedRedisUrl : '';

let redis = null;
let pub = null;
let sub = null;

const createClient = () => {
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
  });

  client.on('error', (error) => {
    console.error('[Redis] connection error:', error.message);
  });

  client.on('connect', () => {
    console.log('[Redis] connected');
  });

  return client;
};

if (isRedisEnabled) {
  redis = createClient();
  pub = redis.duplicate();
  sub = redis.duplicate();
} else {
  console.warn('[Redis] disabled (ENABLE_REDIS=false or REDIS_URL missing). Realtime queue caching turned off.');
}

const connectRedis = async () => {
  if (!isRedisEnabled) {
    return;
  }

  try {
    await Promise.all([
      redis.connect(),
      pub.connect(),
      sub.connect(),
    ]);
    console.log('[Redis] connections established');
  } catch (error) {
    console.error('[Redis] failed to establish connections', error);
  }
};

module.exports = {
  redis,
  pub,
  sub,
  connectRedis,
  redisUrl,
  isRedisEnabled,
};

