/**
 * Caching utility using Redis
 * Provides functions for caching frequently accessed data
 */

const { redis, isRedisEnabled } = require('../config/redis');

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} Cached data or null
 */
const getCache = async (key) => {
  if (!isRedisEnabled || !redis) {
    return null;
  }

  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`[Cache] Error getting key ${key}:`, error.message);
    return null;
  }
};

/**
 * Set cache data
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 * @returns {Promise<boolean>} Success status
 */
const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  if (!isRedisEnabled || !redis) {
    return false;
  }

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[Cache] Error setting key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cache by key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
const deleteCache = async (key) => {
  if (!isRedisEnabled || !redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`[Cache] Error deleting key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cache by pattern
 * @param {string} pattern - Cache key pattern (e.g., 'user:*')
 * @returns {Promise<number>} Number of keys deleted
 */
const deleteCacheByPattern = async (pattern) => {
  if (!isRedisEnabled || !redis) {
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`[Cache] Error deleting pattern ${pattern}:`, error.message);
    return 0;
  }
};

/**
 * Generate cache key
 * @param {string} prefix - Key prefix
 * @param {string|Object} identifier - Unique identifier
 * @returns {string} Cache key
 */
const generateCacheKey = (prefix, identifier) => {
  if (typeof identifier === 'object') {
    const sortedKeys = Object.keys(identifier).sort();
    const keyString = sortedKeys.map((key) => `${key}:${identifier[key]}`).join('|');
    return `${prefix}:${keyString}`;
  }
  return `${prefix}:${identifier}`;
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  generateCacheKey,
  DEFAULT_TTL,
};

