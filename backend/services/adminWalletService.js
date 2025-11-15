const mongoose = require('mongoose');
const AdminWallet = require('../models/AdminWallet');
const AdminWalletTransaction = require('../models/AdminWalletTransaction');
const { ROLES } = require('../utils/constants');

const ROLE_MODEL_MAP = {
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.LABORATORY]: 'Laboratory',
  [ROLES.PHARMACY]: 'Pharmacy',
};

const ensureObjectId = (value) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

const getOrCreateWallet = async () => {
  const wallet = await AdminWallet.findOneAndUpdate(
    { key: 'primary' },
    {},
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return wallet;
};

module.exports = {
  ROLE_MODEL_MAP,
  getOrCreateWallet,
};


