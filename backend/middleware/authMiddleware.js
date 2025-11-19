const asyncHandler = require('./asyncHandler');
const { verifyAccessToken } = require('../utils/tokenService');
const { getModelForRole, ROLES } = require('../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../utils/constants');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

const protect = (...allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
      throw createError(401, 'Authentication token missing');
    }

    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      throw createError(401, 'Invalid or expired token');
    }

    const { id, role } = decoded;
    const Model = getModelForRole(role);
    const user = await Model.findById(id);

    if (!user) {
      throw createError(401, 'Account not found');
    }

    // Handle both array format and individual arguments
    const roles = allowedRoles.length === 1 && Array.isArray(allowedRoles[0])
      ? allowedRoles[0]
      : allowedRoles;

    if (roles.length && !roles.includes(role)) {
      throw createError(403, 'You do not have access to this resource');
    }

    if (
      [ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY].includes(role) &&
      user.status &&
      user.status !== APPROVAL_STATUS.APPROVED
    ) {
      throw createError(403, 'Account is not approved yet');
    }

    if (Object.prototype.hasOwnProperty.call(user, 'isActive') && user.isActive === false) {
      throw createError(403, 'Account is inactive');
    }

    req.auth = { id, role };
    req.user = user;

    next();
  });

const authorize = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw createError(403, 'Insufficient permissions');
    }

    next();
  });

module.exports = {
  protect,
  authorize,
};


