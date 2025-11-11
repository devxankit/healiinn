const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PASSWORD_RESET_CONFIG } = require('./constants');

const generateOtp = (length = PASSWORD_RESET_CONFIG.OTP_LENGTH) => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i += 1) {
    const index = crypto.randomInt(0, digits.length);
    otp += digits[index];
  }

  return otp;
};

const hashOtp = async (otp) => bcrypt.hash(otp, 10);

const verifyOtpHash = async (otp, hash) => bcrypt.compare(otp, hash);

const addMinutes = (minutes) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  addMinutes,
  generateResetToken,
};


