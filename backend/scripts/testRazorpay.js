/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.RAZORPAY_TEST_BASE_URL || `http://localhost:${PORT}`;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('❌ Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('❌ Please configure MONGODB_URI before running the Razorpay integration script.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return error.response;
    }
    throw error;
  }
);

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const waitForServer = async () => {
  const maxAttempts = Number(process.env.RAZORPAY_TEST_MAX_ATTEMPTS) || 20;
  const delayMs = Number(process.env.RAZORPAY_TEST_RETRY_DELAY_MS) || 1000;

  console.log('⏳ Waiting for API server...');
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await client.get('/health');
      if (response.status >= 200 && response.status < 500) {
        console.log(`✅ API reachable (attempt ${attempt})`);
        return;
      }
    } catch (error) {
      // ignore and retry
    }
    console.log(`   retrying (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }

  throw new Error(`API not reachable at ${BASE_URL}. Start the server with npm run dev.`);
};

const connectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');
};

const randomString = (prefix = 'test') => `${prefix}-${crypto.randomBytes(6).toString('hex')}`;

const ensureTestPatient = async () => {
  const email = `${randomString('razorpay')}@example.com`;
  const payload = {
    name: 'Razorpay Test User',
    email,
    phone: `9${crypto.randomInt(100000000, 999999999)}`,
    password: 'SecurePass123!',
    gender: 'other',
  };

  console.log('\n1️⃣  Creating test patient');
  const signupRes = await client.post('/api/patients/auth/signup', payload);

  if (signupRes.status !== 201 || !signupRes.data?.data?.tokens?.accessToken) {
    throw new Error(`Patient signup failed. Response: ${JSON.stringify(signupRes.data)}`);
  }

  console.log('   ✓ Patient created and authenticated');
  return signupRes.data.data.tokens.accessToken;
};

const createRazorpayOrderViaApi = async (token) => {
  console.log('\n2️⃣  Creating Razorpay order through API');
  const response = await client.post(
    '/api/payments/orders',
    {
      amount: 250,
      currency: 'INR',
      type: 'appointment',
      metadata: { test: true },
      notes: { purpose: 'Razorpay integration check' },
    },
    authHeader(token)
  );

  if (response.status !== 201 || !response.data?.data?.id) {
    throw new Error(`Failed to create Razorpay order. Response: ${JSON.stringify(response.data)}`);
  }

  console.log(`   ✓ Order created: ${response.data.data.id}`);
  return response.data.data;
};

const verifyPaymentViaApi = async (token, order) => {
  console.log('\n3️⃣  Verifying payment signature through API');
  const paymentId = `pay_${randomString()}`;
  const payload = `${order.id}|${paymentId}`;
  const signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(payload).digest('hex');

  const response = await client.post(
    '/api/payments/verify',
    {
      orderId: order.id,
      paymentId,
      signature,
    },
    authHeader(token)
  );

  if (response.status !== 200 || !response.data?.success) {
    throw new Error(`Signature verification failed. Response: ${JSON.stringify(response.data)}`);
  }

  console.log('   ✓ Signature verified by API');

  const paymentRecord = await Payment.findOne({ orderId: order.id });
  if (!paymentRecord) {
    throw new Error('Payment record not found in database after verification');
  }

  if (paymentRecord.status !== 'success') {
    throw new Error(`Payment status expected to be success but found ${paymentRecord.status}`);
  }

  console.log('   ✓ Payment status updated to success in database');

  await Payment.deleteOne({ _id: paymentRecord._id });
  console.log('   ✓ Test payment record cleaned up');
};

const main = async () => {
  console.log('🚀 Healiinn Razorpay Integration Check');
  console.log(`   Base URL: ${BASE_URL}`);

  await waitForServer();
  await connectDatabase();

  const token = await ensureTestPatient();
  const order = await createRazorpayOrderViaApi(token);
  await verifyPaymentViaApi(token, order);

  console.log('\n🎉 Razorpay flow is working end-to-end!');
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n❌ Razorpay integration check failed');
    console.error(error.message);
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

