/**
 * Commission Configuration Utility
 * Reads commission rates from environment variables with defaults
 */

/**
 * Get commission rate for a provider type
 * @param {string} providerType - 'doctor', 'pharmacy', 'laboratory', or 'nurse'
 * @returns {number} Commission rate as decimal (e.g., 0.1 = 10%)
 */
const getCommissionRate = (providerType) => {
  switch (providerType) {
    case 'doctor':
      return parseFloat(process.env.DOCTOR_COMMISSION_RATE) || 0.1; // Default 10%
    case 'pharmacy':
      return parseFloat(process.env.PHARMACY_COMMISSION_RATE) || 0.1; // Default 10%
    case 'laboratory':
      return parseFloat(process.env.LABORATORY_COMMISSION_RATE) || 0.2; // Default 20%
    case 'nurse':
      return parseFloat(process.env.NURSE_COMMISSION_RATE) || 0.2; // Default 20%
    default:
      return 0.1; // Default 10%
  }
};

/**
 * Calculate provider earning after commission
 * @param {number} totalAmount - Total amount
 * @param {string} providerType - 'doctor', 'pharmacy', 'laboratory', or 'nurse'
 * @returns {object} { earning, commission }
 */
const calculateProviderEarning = (totalAmount, providerType) => {
  const commissionRate = getCommissionRate(providerType);
  const commission = totalAmount * commissionRate;
  const earning = totalAmount - commission;
  
  return {
    earning,
    commission,
    commissionRate,
  };
};

module.exports = {
  getCommissionRate,
  calculateProviderEarning,
};

