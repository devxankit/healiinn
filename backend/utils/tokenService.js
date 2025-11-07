const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET || 'change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || ACCESS_SECRET;
const ACCESS_EXPIRE = process.env.JWT_EXPIRE || '7d';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

const createAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRE,
  });

const createRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRE,
  });

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};


