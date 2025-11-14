/* eslint-disable no-console */
const mongoose = require('mongoose');
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const ClinicSession = require('../models/ClinicSession');
const SessionToken = require('../models/SessionToken');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const LabLead = require('../models/LabLead');
const PharmacyLead = require('../models/PharmacyLead');
const Laboratory = require('../models/Laboratory');
const Pharmacy = require('../models/Pharmacy');
const WalletTransaction = require('../models/WalletTransaction');
const Payment = require('../models/Payment');
const AdminWalletTransaction = require('../models/AdminWalletTransaction');

const {
  LAB_LEAD_STATUS,
  PHARMACY_LEAD_STATUS,
  SESSION_STATUS,
  TOKEN_STATUS,
  APPROVAL_STATUS,
} = require('../utils/constants');

const PASS = 'passed';
const FAIL = 'failed';

const record = async (results, name, fn) => {
  try {
    await fn();
    results.push({ name, status: PASS });
  } catch (error) {
    results.push({ name, status: FAIL, error });
  }
};

const createAdminUser = async ({ request, registrationCode }) => {
  const response = await request.post('/api/admin/auth/signup').send({
    name: 'Dashboard Admin',
    email: 'dashboard-admin@example.com',
    phone: '9999999990',
    password: 'Password123',
    registrationCode,
    isSuperAdmin: true,
  });

  if (response.status !== 201) {
    throw new Error(`Admin registration failed with status ${response.status}`);
  }

  const token = response.body?.data?.tokens?.accessToken;
  if (!token) {
    throw new Error('Admin token missing from registration response');
  }

  return token;
};

const seedDashboardData = async ({ now }) => {
  const approvedDoctor = await Doctor.create({
    firstName: 'Alice',
    lastName: 'Doe',
    email: 'alice@example.com',
    phone: '8888888881',
    password: 'Password123',
    specialization: 'Cardiology',
    gender: 'female',
    licenseNumber: 'DOC-001',
    status: APPROVAL_STATUS.APPROVED,
    isActive: true,
  });

  await Doctor.create({
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@example.com',
    phone: '8888888882',
    password: 'Password123',
    specialization: 'Dermatology',
    gender: 'male',
    licenseNumber: 'DOC-002',
    status: APPROVAL_STATUS.PENDING,
    isActive: false,
  });

  const laboratory = await Laboratory.create({
    labName: 'Central Lab',
    ownerName: 'Lab Owner',
    email: 'labowner@example.com',
    phone: '7777777771',
    password: 'Password123',
    licenseNumber: 'LAB-001',
    status: APPROVAL_STATUS.APPROVED,
    isActive: true,
    address: {
      line1: 'Lab Street',
      city: 'Metropolis',
      state: 'TS',
      location: {
        type: 'Point',
        coordinates: [77.3, 28.7],
      },
    },
  });

  const pharmacy = await Pharmacy.create({
    pharmacyName: 'City Pharmacy',
    ownerName: 'Pharmacy Owner',
    email: 'pharmacyowner@example.com',
    phone: '7777777772',
    password: 'Password123',
    licenseNumber: 'PHA-001',
    status: APPROVAL_STATUS.APPROVED,
    isActive: true,
    address: {
      line1: '123 Market Street',
      city: 'Metropolis',
      state: 'TS',
      location: {
        type: 'Point',
        coordinates: [77.1, 28.5],
      },
    },
  });

  const patient = await Patient.create({
    firstName: 'John',
    lastName: 'Patient',
    email: 'john.patient@example.com',
    phone: '6666666661',
    password: 'Password123',
    gender: 'male',
  });

  const clinic = await Clinic.create({
    doctor: approvedDoctor._id,
    name: 'Central Clinic',
    address: {
      line1: 'Clinic Street',
      city: 'Metropolis',
    },
    location: {
      type: 'Point',
      coordinates: [77.2, 28.6],
    },
  });

  const liveSession = await ClinicSession.create({
    doctor: approvedDoctor._id,
    clinic: clinic._id,
    startTime: new Date(now.getTime() - 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 60 * 60 * 1000),
    status: SESSION_STATUS.LIVE,
    nextTokenNumber: 3,
  });

  const appointmentToday = await Appointment.create({
    patient: patient._id,
    doctor: approvedDoctor._id,
    clinic: clinic._id,
    scheduledFor: now,
    status: 'scheduled',
  });

  await Appointment.create({
    patient: patient._id,
    doctor: approvedDoctor._id,
    clinic: clinic._id,
    scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    status: 'scheduled',
  });

  const cancelledAppointment = await Appointment.create({
    patient: new mongoose.Types.ObjectId(),
    doctor: approvedDoctor._id,
    clinic: clinic._id,
    scheduledFor: now,
    status: 'cancelled',
  });
  await Appointment.updateOne(
    { _id: cancelledAppointment._id },
    { $set: { updatedAt: now } }
  );

  const calledAt = new Date(now.getTime() - 10 * 60 * 1000);
  const visitedAt = new Date(now.getTime() - 5 * 60 * 1000);
  const eta = new Date(now.getTime() - 7 * 60 * 1000);

  await SessionToken.create({
    session: liveSession._id,
    doctor: approvedDoctor._id,
    clinic: clinic._id,
    patient: patient._id,
    appointment: appointmentToday._id,
    tokenNumber: 1,
    status: TOKEN_STATUS.COMPLETED,
    calledAt,
    visitedAt,
    completedAt: now,
    eta,
  });

  await SessionToken.create({
    session: liveSession._id,
    doctor: approvedDoctor._id,
    clinic: clinic._id,
    patient: new mongoose.Types.ObjectId(),
    tokenNumber: 2,
    status: TOKEN_STATUS.NO_SHOW,
    noShowAt: now,
  });

  await LabLead.create({
    prescription: new mongoose.Types.ObjectId(),
    consultation: new mongoose.Types.ObjectId(),
    doctor: approvedDoctor._id,
    patient: patient._id,
    preferredLaboratories: [laboratory._id],
    status: LAB_LEAD_STATUS.COMPLETED,
    reportDetails: {
      uploadedAt: now,
    },
  });

  await PharmacyLead.create({
    prescription: new mongoose.Types.ObjectId(),
    consultation: new mongoose.Types.ObjectId(),
    doctor: approvedDoctor._id,
    patient: patient._id,
    preferredPharmacies: [pharmacy._id],
    status: PHARMACY_LEAD_STATUS.COMPLETED,
    statusHistory: [
      {
        status: PHARMACY_LEAD_STATUS.COMPLETED,
        updatedAt: now,
      },
    ],
  });

  const payment = await Payment.create({
    orderId: 'order_dashboard',
    amount: 1000,
    currency: 'INR',
    type: 'appointment',
    status: 'success',
  });

  await WalletTransaction.create({
    doctor: approvedDoctor._id,
    patient: patient._id,
    appointment: appointmentToday._id,
    payment: payment._id,
    grossAmount: 1000,
    commissionAmount: 100,
    netAmount: 900,
    commissionRate: 0.1,
    currency: 'INR',
    description: 'Test appointment',
    creditedAt: now,
  });

  await AdminWalletTransaction.create({
    amount: 200,
    currency: 'INR',
    source: 'subscription',
    role: 'laboratory',
    subscriber: laboratory._id,
    subscriberModel: 'Laboratory',
    subscription: new mongoose.Types.ObjectId(),
    payment: new mongoose.Types.ObjectId(),
    orderId: 'sub_order_dashboard',
    description: 'Test subscription',
  });
};

const main = async () => {
  const results = [];
  const mongoServer = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.ENABLE_REDIS = 'false';
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.ADMIN_REGISTRATION_CODE = 'dashboard-code';
  process.env.MONGODB_URI = mongoServer.getUri();

  // eslint-disable-next-line global-require
  const app = require('../server');
  const request = supertest(app);

  const adminToken = await createAdminUser({
    request,
    registrationCode: process.env.ADMIN_REGISTRATION_CODE,
  });

  const now = new Date();
  await seedDashboardData({ now });

  await record(results, 'Fetch admin dashboard overview metrics', async () => {
    const response = await request
      .get('/api/admin/dashboard/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = response.body;
    if (!body.success) {
      throw new Error('Dashboard response missing success=true');
    }

    const { doctorMetrics, patientMetrics, labMarketplaceMetrics, pharmacyMarketplaceMetrics, financialMetrics } =
      body;

    if (!doctorMetrics || doctorMetrics.totalVerified !== 1) {
      throw new Error('Doctor metrics totalVerified expected to be 1');
    }

    if (doctorMetrics.activeSessions !== 1) {
      throw new Error('Doctor metrics activeSessions expected to be 1');
    }

    if (doctorMetrics.tokensServedToday !== 1) {
      throw new Error('Doctor metrics tokensServedToday expected to be 1');
    }

    if (!patientMetrics || patientMetrics.bookingsToday !== 2) {
      throw new Error('Patient metrics bookingsToday expected to be 2');
    }

    if (patientMetrics.cancellationsToday !== 1) {
      throw new Error('Patient metrics cancellationsToday expected to be 1');
    }

    if (!labMarketplaceMetrics || labMarketplaceMetrics.totalOrdersCompleted !== 1) {
      throw new Error('Lab marketplace metrics totalOrdersCompleted expected to be 1');
    }

    if (
      !pharmacyMarketplaceMetrics ||
      pharmacyMarketplaceMetrics.totalOrdersCompleted !== 1
    ) {
      throw new Error('Pharmacy marketplace metrics totalOrdersCompleted expected to be 1');
    }

    const revenueToday = financialMetrics?.revenue?.today;
    if (!revenueToday || revenueToday.total !== 300) {
      throw new Error('Financial metrics today.total expected to be 300');
    }
  });

  console.log('\nAdmin Dashboard Metrics Test Summary');
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


