/**
 * Pagination utility that reads from environment configuration
 * Ensures consistent pagination limits across the application
 */

const DEFAULT_LIMIT = Number(process.env.DEFAULT_PAGINATION_LIMIT) || 20;
const MAX_LIMIT = Number(process.env.MAX_PAGINATION_LIMIT) || 50;

/**
 * Get pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {number} defaultLimit - Default limit if not provided (optional)
 * @param {number} maxLimit - Maximum allowed limit (optional)
 * @returns {Object} { page, limit, skip }
 */
const getPaginationParams = (query, defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limitParam = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(limitParam, 1), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Get pagination response metadata
 * @param {number} total - Total number of documents
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};

module.exports = {
  getPaginationParams,
  getPaginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};

