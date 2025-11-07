const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance;

const ensureClient = () => {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayInstance;
};

const normalizeAmount = (amount, currency = 'INR') => {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Amount must be a positive number.');
  }

  const multiplier = 100; // Razorpay expects amount in the smallest currency unit
  return Math.round(parsed * multiplier);
};

const createOrder = async ({ amount, currency = 'INR', receipt, notes }) => {
  const client = ensureClient();
  const amountInSubUnits = normalizeAmount(amount, currency);

  const normalizedNotes =
    notes && typeof notes === 'object'
      ? notes
      : notes !== undefined
      ? { note: String(notes) }
      : {};

  const options = {
    amount: amountInSubUnits,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes: normalizedNotes,
  };

  return client.orders.create(options);
};

const verifySignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    throw new Error('Missing orderId, paymentId, or signature.');
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error('Razorpay key secret is not configured.');
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  createOrder,
  verifySignature,
};
