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
      // ignore
    }
    console.log(`   retrying (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }

  throw new Error(`API not reachable at ${BASE_URL}. Start the server with npm run dev`);
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
  const password = 'SecurePass123!';
  const payload = {
    name: 'Razorpay Test User',
    email,
    phone: `9${crypto.randomInt(100000000, 999999999)}`,
    password,
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

  // Clean up test payment record so DB stays tidy
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
/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.RAZORPAY_TEST_BASE_URL || `http://localhost:${PORT}`;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_SECRET) {
  console.error('RAZORPAY_KEY_SECRET is not defined. Please set it in your environment before running this script.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const newClient = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  );

  return instance;
};

const client = newClient();

const randomString = (prefix = 'test') => `${prefix}-${crypto.randomBytes(6).toString('hex')}`;

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const report = (label, { status, data }) => {
  const ok = status >= 200 && status < 300;
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${label}`);
  console.log(`Status: ${status}`);
  if (!ok) {
    console.log(JSON.stringify(data, null, 2));
  }
  return ok;
};

const waitForServer = async () => {
  const maxAttempts = Number(process.env.RAZORPAY_TEST_MAX_ATTEMPTS) || 20;
  const delayMs = Number(process.env.RAZORPAY_TEST_RETRY_DELAY_MS) || 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await client.get('/health');
      if (response.status >= 200 && response.status < 500) {
        console.log(`\nAPI reachable (attempt ${attempt})`);
        return true;
      }
    } catch (error) {
      // ignore, retry below
    }
    console.log(`Waiting for API... (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }

  throw new Error(`API not reachable at ${BASE_URL}`);
};

const main = async () => {
  console.log('--- Healiinn Razorpay Integration Test ---');
  console.log(`Base URL: ${BASE_URL}`);

  await waitForServer();

  const testEmail = `${randomString('razorpay')}@example.com`;

  console.log('\n1) Creating patient account');
  const patientSignup = await client.post('/api/patients/auth/signup', {
    name: 'Razorpay Test User',
    email: testEmail,
    phone: `9${crypto.randomInt(100000000, 999999999)}`,
    password: 'SecurePass123!',
    gender: 'other',
  });
  const signupOk = report('Patient signup', patientSignup);

  if (!signupOk) {
    process.exit(1);
  }

  const accessToken = patientSignup.data?.data?.tokens?.accessToken;
  if (!accessToken) {
    console.error('Access token not received after signup. Cannot continue.');
    process.exit(1);
  }

  console.log('\n2) Creating Razorpay order via API');
  const createOrderRes = await client.post(
    '/api/payments/orders',
    {
      amount: 250,
      currency: 'INR',
      type: 'appointment',
      metadata: { test: true },
      notes: { purpose: 'Razorpay integration test' },
    },
    authHeader(accessToken)
  );

  const orderOk = report('Create payment order', createOrderRes);
  if (!orderOk) {
    process.exit(1);
  }

  const orderId = createOrderRes.data?.data?.id;
  if (!orderId) {
    console.error('Order id missing in response.');
    process.exit(1);
  }

  const paymentId = `pay_${randomString()}`;
  const payload = `${orderId}|${paymentId}`;
  const signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(payload).digest('hex');

  console.log('\n3) Verifying Razorpay signature');
  const verifyRes = await client.post(
    '/api/payments/verify',
    {
      orderId,
      paymentId,
      signature,
    },
    authHeader(accessToken)
  );

  const verifyOk = report('Verify payment signature', verifyRes);

  if (!verifyOk) {
    process.exit(1);
  }

  console.log('\nRazorpay flow verified successfully!');
  process.exit(0);
};

main().catch((error) => {
  console.error('\nUnexpected error during Razorpay integration test');
  console.error(error);
  process.exit(1);
});
/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.RAZORPAY_TEST_BASE_URL || `http://localhost:${PORT}`;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_SECRET) {
  console.error('RAZORPAY_KEY_SECRET is not defined. Please set it in your environment before running this script.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const newClient = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  );

  return instance;
};

const client = newClient();

const randomString = (prefix = 'test') => `${prefix}-${crypto.randomBytes(6).toString('hex')}`;

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const report = (label, { status, data }) => {
  const ok = status >= 200 && status < 300;
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${label}`);
  console.log(`Status: ${status}`);
  if (!ok) {
    console.log(JSON.stringify(data, null, 2));
  }
  return ok;
};

const waitForServer = async () => {
  const maxAttempts = Number(process.env.RAZORPAY_TEST_MAX_ATTEMPTS) || 20;
  const delayMs = Number(process.env.RAZORPAY_TEST_RETRY_DELAY_MS) || 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await client.get('/health');
      if (response.status >= 200 && response.status < 500) {
        console.log(`\nAPI reachable (attempt ${attempt})`);
        return true;
      }
    } catch (error) {
      // ignore, retry below
    }
    console.log(`Waiting for API... (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }

  throw new Error(`API not reachable at ${BASE_URL}`);
};

const main = async () => {
  console.log('--- Healiinn Razorpay Integration Test ---');
  console.log(`Base URL: ${BASE_URL}`);

  await waitForServer();

  const testEmail = `${randomString('razorpay')}@example.com`;

  console.log('\n1) Creating patient account');
  const patientSignup = await client.post('/api/patients/auth/signup', {
    name: 'Razorpay Test User',
    email: testEmail,
    phone: `9${crypto.randomInt(100000000, 999999999)}`,
    password: 'SecurePass123!',
    gender: 'other',
  });
  const signupOk = report('Patient signup', patientSignup);

  if (!signupOk) {
    process.exit(1);
  }

  const accessToken = patientSignup.data?.data?.tokens?.accessToken;
  if (!accessToken) {
    console.error('Access token not received after signup. Cannot continue.');
    process.exit(1);
  }

  console.log('\n2) Creating Razorpay order via API');
  const createOrderRes = await client.post(
    '/api/payments/orders',
    {
      amount: 250,
      currency: 'INR',
      type: 'appointment',
      metadata: { test: true },
      notes: { purpose: 'Razorpay integration test' },
    },
    authHeader(accessToken)
  );

  const orderOk = report('Create payment order', createOrderRes);
  if (!orderOk) {
    process.exit(1);
  }

  const orderId = createOrderRes.data?.data?.id;
  if (!orderId) {
    console.error('Order id missing in response.');
    process.exit(1);
  }

  const paymentId = `pay_${randomString()}`;
  const payload = `${orderId}|${paymentId}`;
  const signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(payload).digest('hex');

  console.log('\n3) Verifying Razorpay signature');
  const verifyRes = await client.post(
    '/api/payments/verify',
    {
      orderId,
      paymentId,
      signature,
    },
    authHeader(accessToken)
  );

  const verifyOk = report('Verify payment signature', verifyRes);

  if (!verifyOk) {
    process.exit(1);
  }

  console.log('\nRazorpay flow verified successfully!');
  process.exit(0);
};

main().catch((error) => {
  console.error('\nUnexpected error during Razorpay integration test');
  console.error(error);
  process.exit(1);
});
/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const { createOrder, verifySignature } = require('../services/razorpayService');
const Payment = require('../models/Payment');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.SMOKE_TEST_BASE_URL || `http://localhost:${PORT}`;

let patientToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const newClient = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  );

  return instance;
};

const client = newClient();

const randomString = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

const test = async (label, fn) => {
  try {
    console.log(`\n🧪 Testing: ${label}`);
    await fn();
    testResults.passed++;
    console.log(`✅ PASS: ${label}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ label, error: error.message });
    console.log(`❌ FAIL: ${label}`);
    console.log(`   Error: ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
    }
  }
};

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Test 1: Check Razorpay Environment Variables
const testRazorpayEnv = async () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
  }

  if (keyId === 'your-razorpay-key-id' || keySecret === 'your-razorpay-key-secret') {
    throw new Error('Please set actual Razorpay credentials in .env (not placeholder values)');
  }

  console.log('   ✓ Razorpay environment variables configured');
};

// Test 2: Test Razorpay Service - Order Creation
const testRazorpayOrderCreation = async () => {
  const testAmount = 100;
  const testReceipt = `test_receipt_${Date.now()}`;
  const testNotes = { test: 'Razorpay integration test' };

  const order = await createOrder({
    amount: testAmount,
    currency: 'INR',
    receipt: testReceipt,
    notes: testNotes,
  });

  if (!order || !order.id) {
    throw new Error('Order creation failed: No order ID returned');
  }

  if (!order.amount || order.amount !== testAmount * 100) {
    throw new Error(`Amount mismatch: Expected ${testAmount * 100}, got ${order.amount}`);
  }

  if (order.currency !== 'INR') {
    throw new Error(`Currency mismatch: Expected INR, got ${order.currency}`);
  }

  console.log(`   ✓ Order created: ${order.id}`);
  console.log(`   ✓ Amount: ${order.amount} (${order.amount / 100} INR)`);
  console.log(`   ✓ Currency: ${order.currency}`);
  console.log(`   ✓ Status: ${order.status}`);

  return order;
};

// Test 3: Test Signature Verification
const testSignatureVerification = async () => {
  const testOrderId = 'order_test123';
  const testPaymentId = 'pay_test123';
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Generate a valid signature
  const crypto = require('crypto');
  const payload = `${testOrderId}|${testPaymentId}`;
  const validSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  // Test valid signature
  const isValid = verifySignature({
    orderId: testOrderId,
    paymentId: testPaymentId,
    signature: validSignature,
  });

  if (!isValid) {
    throw new Error('Valid signature verification failed');
  }

  console.log('   ✓ Valid signature verified successfully');

  // Test invalid signature
  const isInvalid = verifySignature({
    orderId: testOrderId,
    paymentId: testPaymentId,
    signature: 'invalid_signature',
  });

  if (isInvalid) {
    throw new Error('Invalid signature should have been rejected');
  }

  console.log('   ✓ Invalid signature correctly rejected');
};

// Test 4: Test Payment Model
const testPaymentModel = async () => {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in .env');
    }
    await mongoose.connect(mongoUri);
    console.log('   ✓ Connected to MongoDB');
  }

  // Create a test payment record
  const testPayment = await Payment.create({
    orderId: `test_order_${Date.now()}`,
    amount: 500,
    currency: 'INR',
    type: 'appointment',
    status: 'pending',
    metadata: { test: true },
  });

  if (!testPayment || !testPayment._id) {
    throw new Error('Failed to create payment record');
  }

  console.log(`   ✓ Payment record created: ${testPayment._id}`);

  // Update payment status
  testPayment.status = 'success';
  testPayment.paymentId = `test_payment_${Date.now()}`;
  await testPayment.save();

  console.log('   ✓ Payment status updated successfully');

  // Clean up test payment
  await Payment.deleteOne({ _id: testPayment._id });
  console.log('   ✓ Test payment record cleaned up');
};

// Test 5: Test API Endpoint - Create Payment Order (requires authentication)
const testCreatePaymentOrderAPI = async () => {
  if (!patientToken) {
    throw new Error('Patient token not available. Please run patient signup/login first.');
  }

  const response = await client.post(
    '/api/payments/orders',
    {
      amount: 1000,
      currency: 'INR',
      type: 'appointment',
      receipt: `test_receipt_api_${Date.now()}`,
      notes: { test: 'API test' },
    },
    authHeader(patientToken)
  );

  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
  }

  if (!response.data.success) {
    throw new Error(`API returned success: false. Response: ${JSON.stringify(response.data)}`);
  }

  if (!response.data.data || !response.data.data.id) {
    throw new Error('No order ID in response');
  }

  console.log(`   ✓ Order created via API: ${response.data.data.id}`);
  console.log(`   ✓ Amount: ${response.data.data.amount / 100} INR`);

  // Verify payment record was created in DB
  const paymentRecord = await Payment.findOne({ orderId: response.data.data.id });
  if (!paymentRecord) {
    throw new Error('Payment record not found in database after API call');
  }

  console.log('   ✓ Payment record saved in database');

  // Clean up
  await Payment.deleteOne({ orderId: response.data.data.id });
  console.log('   ✓ Test payment record cleaned up');
};

// Test 6: Test API Endpoint - Verify Payment Signature
const testVerifyPaymentSignatureAPI = async () => {
  if (!patientToken) {
    throw new Error('Patient token not available');
  }

  // First create an order
  const orderResponse = await client.post(
    '/api/payments/orders',
    {
      amount: 500,
      currency: 'INR',
      type: 'appointment',
    },
    authHeader(patientToken)
  );

  if (orderResponse.status !== 201) {
    throw new Error('Failed to create order for signature verification test');
  }

  const orderId = orderResponse.data.data.id;

  // Generate a test signature
  const crypto = require('crypto');
  const testPaymentId = `pay_test_${Date.now()}`;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const payload = `${orderId}|${testPaymentId}`;
  const testSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  // Test valid signature verification
  const verifyResponse = await client.post(
    '/api/payments/verify',
    {
      orderId,
      paymentId: testPaymentId,
      signature: testSignature,
    },
    authHeader(patientToken)
  );

  if (verifyResponse.status !== 200) {
    throw new Error(
      `Expected status 200, got ${verifyResponse.status}. Response: ${JSON.stringify(verifyResponse.data)}`
    );
  }

  if (!verifyResponse.data.success) {
    throw new Error(`Verification failed. Response: ${JSON.stringify(verifyResponse.data)}`);
  }

  console.log('   ✓ Payment signature verified via API');

  // Verify payment status was updated in DB
  const paymentRecord = await Payment.findOne({ orderId });
  if (!paymentRecord) {
    throw new Error('Payment record not found after verification');
  }

  if (paymentRecord.status !== 'success') {
    throw new Error(`Expected payment status 'success', got '${paymentRecord.status}'`);
  }

  console.log('   ✓ Payment status updated to success in database');

  // Clean up
  await Payment.deleteOne({ orderId });
  console.log('   ✓ Test payment record cleaned up');
};

// Setup: Create a test patient and get token
const setupTestPatient = async () => {
  console.log('\n📝 Setting up test patient...');

  const testEmail = `test_patient_razorpay_${Date.now()}@test.com`;
  const testPassword = 'Test@123456';

  // Signup
  const signupResponse = await client.post('/api/patients/auth/signup', {
    firstName: 'Test',
    lastName: 'Patient',
    email: testEmail,
    phone: `9876543${Math.floor(Math.random() * 10000)}`,
    password: testPassword,
  });

  if (signupResponse.status === 201 && signupResponse.data.data?.tokens?.accessToken) {
    patientToken = signupResponse.data.data.tokens.accessToken;
    console.log('   ✓ Test patient created and logged in');
    return;
  }

  // If signup fails, try login (patient might already exist)
  const loginResponse = await client.post('/api/patients/auth/login', {
    email: testEmail,
    password: testPassword,
  });

  if (loginResponse.status === 200 && loginResponse.data.data?.tokens?.accessToken) {
    patientToken = loginResponse.data.data.tokens.accessToken;
    console.log('   ✓ Test patient logged in');
    return;
  }

  throw new Error('Failed to create or login test patient for API tests');
};

// Wait for API server to be ready
const waitForServer = async () => {
  console.log('⏳ Waiting for API server to be ready...');
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await client.get('/health');
      if (response.status === 200) {
        console.log('✅ API server is ready\n');
        return;
      }
    } catch (error) {
      // Server not ready yet
    }
    await sleep(1000);
  }
  throw new Error('API server is not responding. Please start the server with: npm run dev');
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Razorpay Integration Tests\n');
  console.log('=' .repeat(60));

  try {
    // Wait for server
    await waitForServer();

    // Test 1: Environment Variables
    await test('Razorpay Environment Variables', testRazorpayEnv);

    // Test 2: Service - Order Creation
    await test('Razorpay Service - Order Creation', testRazorpayOrderCreation);

    // Test 3: Service - Signature Verification
    await test('Razorpay Service - Signature Verification', testSignatureVerification);

    // Test 4: Payment Model
    await test('Payment Model - Database Operations', testPaymentModel);

    // Setup test patient for API tests
    await setupTestPatient();

    // Test 5: API - Create Order
    await test('API - Create Payment Order', testCreatePaymentOrderAPI);

    // Test 6: API - Verify Signature
    await test('API - Verify Payment Signature', testVerifyPaymentSignatureAPI);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   📈 Total:  ${testResults.passed + testResults.failed}`);

    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(({ label, error }) => {
        console.log(`   - ${label}: ${error}`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

// Run tests
runTests();

