/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PASS = 'passed';
const FAIL = 'failed';

const main = async () => {
  const results = [];

  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: PASS });
    } catch (error) {
      results.push({ name, status: FAIL, error });
    }
  };

  const mongoServer = await MongoMemoryServer.create();

  const razorpayServicePath = path.resolve(__dirname, '../services/razorpayService.js');
  delete require.cache[razorpayServicePath];
  require.cache[razorpayServicePath] = {
    id: razorpayServicePath,
    filename: razorpayServicePath,
    loaded: true,
    exports: {
      createOrder: async ({ amount, currency, receipt, notes }) => ({
        id: `order_test_${Date.now()}`,
        amount,
        currency,
        receipt,
        notes,
      }),
      verifySignature: () => true,
    },
  };

  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.ENABLE_REDIS = 'false';
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.ADMIN_REGISTRATION_CODE = 'test-code';
  process.env.MONGODB_URI = mongoServer.getUri();

  // eslint-disable-next-line global-require
  const app = require('../server');
  const request = supertest(app);

  let adminToken;
  let laboratoryToken;
  let pharmacyToken;
  let laboratorySubscriptionData = {};
  let pharmacySubscriptionData = {};

  await record('Admin registration', async () => {
    const response = await request.post('/api/admin/auth/signup').send({
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '9999999999',
      password: 'Password123',
      registrationCode: process.env.ADMIN_REGISTRATION_CODE,
    });

    if (response.status !== 201) {
      throw new Error(`Expected 201 got ${response.status}`);
    }

    adminToken = response.body?.data?.tokens?.accessToken;
    if (!adminToken) {
      throw new Error('Admin token missing in response');
    }
  });

  await record('Admin configure subscription plan', async () => {
    if (!adminToken) {
      throw new Error('Admin token not initialized');
    }

    const response = await request
      .put('/api/admin/subscriptions/plan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Standard Subscription',
        description: 'Plan for labs and pharmacies',
        currency: 'INR',
        applicableRoles: ['laboratory', 'pharmacy'],
        durations: [
          { key: '1m', label: '1 Month', durationInDays: 30, price: 499 },
          { key: '6m', label: '6 Months', durationInDays: 180, price: 2499 },
        ],
      });

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  let laboratoryId;
  await record('Laboratory registration', async () => {
    const response = await request.post('/api/laboratories/auth/signup').send({
      labName: 'Diagnostic Lab',
      ownerName: 'Lab Owner',
      email: 'lab@example.com',
      phone: '9999999991',
      password: 'Password123',
      licenseNumber: 'LAB-12345',
      address: { line1: '123 Lab Street', city: 'Test City', state: 'TS' },
    });

    if (response.status !== 201) {
      throw new Error(`Expected 201 got ${response.status}`);
    }

    laboratoryId = response.body?.data?.laboratory?._id;
    if (!laboratoryId) {
      throw new Error('Laboratory id missing');
    }
  });

  await record('Admin approves laboratory', async () => {
    if (!adminToken) {
      throw new Error('Admin token not initialized');
    }
    if (!laboratoryId) {
      throw new Error('Laboratory id not initialized');
    }

    const response = await request
      .patch(`/api/admin/approvals/laboratory/${laboratoryId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  await record('Laboratory login', async () => {
    if (!laboratoryId) {
      throw new Error('Laboratory id not initialized');
    }

    const response = await request.post('/api/laboratories/auth/login').send({
      email: 'lab@example.com',
      password: 'Password123',
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }

    laboratoryToken = response.body?.data?.tokens?.accessToken;
    if (!laboratoryToken) {
      throw new Error('Laboratory token missing');
    }
  });

  await record('Laboratory can view subscription plan', async () => {
    if (!laboratoryToken) {
      throw new Error('Laboratory token not initialized');
    }

    const response = await request
      .get('/api/subscriptions/plan')
      .set('Authorization', `Bearer ${laboratoryToken}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  await record('Laboratory access blocked without active subscription', async () => {
    if (!laboratoryToken) {
      throw new Error('Laboratory token not initialized');
    }

    const response = await request
      .get('/api/labs/leads')
      .set('Authorization', `Bearer ${laboratoryToken}`);

    if (response.status !== 403) {
      throw new Error(`Expected 403 got ${response.status}`);
    }
  });

  await record('Laboratory creates subscription order', async () => {
    if (!laboratoryToken) {
      throw new Error('Laboratory token not initialized');
    }

    const response = await request
      .post('/api/subscriptions/order')
      .set('Authorization', `Bearer ${laboratoryToken}`)
      .send({ durationKey: '1m' });

    if (response.status !== 201) {
      throw new Error(`Expected 201 got ${response.status}`);
    }

    laboratorySubscriptionData = {
      subscriptionId: response.body?.subscription?._id,
      orderId: response.body?.order?.id,
    };

    if (!laboratorySubscriptionData.subscriptionId || !laboratorySubscriptionData.orderId) {
      throw new Error('Subscription order response incomplete');
    }
  });

  await record('Laboratory verifies subscription payment', async () => {
    if (!laboratoryToken) {
      throw new Error('Laboratory token not initialized');
    }

    const response = await request
      .post('/api/subscriptions/verify')
      .set('Authorization', `Bearer ${laboratoryToken}`)
      .send({
        subscriptionId: laboratorySubscriptionData.subscriptionId,
        orderId: laboratorySubscriptionData.orderId,
        paymentId: `pay_${Date.now()}`,
        signature: 'mock-signature',
      });

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  await record('Laboratory access restored after subscription activation', async () => {
    if (!laboratoryToken) {
      throw new Error('Laboratory token not initialized');
    }

    const response = await request
      .get('/api/labs/leads')
      .set('Authorization', `Bearer ${laboratoryToken}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  let pharmacyId;
  await record('Pharmacy registration', async () => {
    const response = await request.post('/api/pharmacies/auth/signup').send({
      pharmacyName: 'Test Pharmacy',
      ownerName: 'Pharmacy Owner',
      email: 'pharmacy@example.com',
      phone: '9999999992',
      password: 'Password123',
      licenseNumber: 'PHA-67890',
      address: {
        line1: '456 Pharma Avenue',
        city: 'Test City',
        state: 'TS',
        location: {
          type: 'Point',
          coordinates: [77.1, 28.5],
        },
      },
    });

    if (response.status !== 201) {
      throw new Error(`Expected 201 got ${response.status}`);
    }

    pharmacyId = response.body?.data?.pharmacy?._id;
    if (!pharmacyId) {
      throw new Error('Pharmacy id missing');
    }
  });

  await record('Admin approves pharmacy', async () => {
    if (!adminToken) {
      throw new Error('Admin token not initialized');
    }
    if (!pharmacyId) {
      throw new Error('Pharmacy id not initialized');
    }

    const response = await request
      .patch(`/api/admin/approvals/pharmacy/${pharmacyId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  await record('Pharmacy login', async () => {
    if (!pharmacyId) {
      throw new Error('Pharmacy id not initialized');
    }

    const response = await request.post('/api/pharmacies/auth/login').send({
      email: 'pharmacy@example.com',
      password: 'Password123',
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }

    pharmacyToken = response.body?.data?.tokens?.accessToken;
    if (!pharmacyToken) {
      throw new Error('Pharmacy token missing');
    }
  });

  await record('Pharmacy blocked without active subscription', async () => {
    if (!pharmacyToken) {
      throw new Error('Pharmacy token not initialized');
    }

    const response = await request
      .get('/api/pharmacy/leads')
      .set('Authorization', `Bearer ${pharmacyToken}`);

    if (response.status !== 403) {
      throw new Error(`Expected 403 got ${response.status}`);
    }
  });

  await record('Pharmacy creates subscription order', async () => {
    if (!pharmacyToken) {
      throw new Error('Pharmacy token not initialized');
    }

    const response = await request
      .post('/api/subscriptions/order')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({ durationKey: '1m' });

    if (response.status !== 201) {
      throw new Error(`Expected 201 got ${response.status}`);
    }

    pharmacySubscriptionData = {
      subscriptionId: response.body?.subscription?._id,
      orderId: response.body?.order?.id,
    };

    if (!pharmacySubscriptionData.subscriptionId || !pharmacySubscriptionData.orderId) {
      throw new Error('Pharmacy subscription order response incomplete');
    }
  });

  await record('Pharmacy verifies subscription payment', async () => {
    if (!pharmacyToken) {
      throw new Error('Pharmacy token not initialized');
    }

    const response = await request
      .post('/api/subscriptions/verify')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({
        subscriptionId: pharmacySubscriptionData.subscriptionId,
        orderId: pharmacySubscriptionData.orderId,
        paymentId: `pay_${Date.now()}`,
        signature: 'mock-signature',
      });

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  await record('Pharmacy access restored after subscription activation', async () => {
    if (!pharmacyToken) {
      throw new Error('Pharmacy token not initialized');
    }

    const response = await request
      .get('/api/pharmacy/leads')
      .set('Authorization', `Bearer ${pharmacyToken}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }
  });

  await record('Admin wallet reflects subscription earnings', async () => {
    if (!adminToken) {
      throw new Error('Admin token not initialized');
    }

    const response = await request
      .get('/api/admin/wallet/subscriptions/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200 got ${response.status}`);
    }

    const earnings = response.body?.overview?.totalEarnings;
    if (typeof earnings !== 'number' || earnings <= 0) {
      throw new Error('Subscription earnings overview did not accumulate totals');
    }
  });

  console.log('\nSubscription API Test Summary');
  results.forEach((result) => {
    if (result.status === PASS) {
      console.log(`✅ ${result.name}`);
    } else {
      console.log(`❌ ${result.name} -> ${result.error?.message || 'Unknown error'}`);
    }
  });

  const passed = results.filter(({ status }) => status === PASS).length;
  const failed = results.length - passed;

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);

  await mongoose.connection.close();
  await mongoServer.stop();

  process.exit(failed > 0 ? 1 : 0);
};

main().catch(async (error) => {
  console.error('Unexpected test runner error', error);
  try {
    await mongoose.connection.close();
  } catch (closeError) {
    console.error('Failed to close mongoose connection', closeError);
  }
  process.exit(1);
});

