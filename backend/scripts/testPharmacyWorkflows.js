/* eslint-disable no-console */
const path = require('path');
const { fork } = require('child_process');
const axios = require('axios');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { setTimeout: sleep } = require('timers/promises');

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Pharmacy = require('../models/Pharmacy');
const Clinic = require('../models/Clinic');
const ClinicSession = require('../models/ClinicSession');
const SessionToken = require('../models/SessionToken');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const {
  APPROVAL_STATUS,
  PHARMACY_LEAD_STATUS,
} = require('../utils/constants');

const PORT = Number(process.env.TEST_PORT) || 5010;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const AUTH_HEADERS = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const formatDetail = (value) => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const formatError = (error) => {
  if (!error) {
    return 'Unknown error';
  }
  if (error.response) {
    return `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
  }
  if (error.request) {
    return `No response received: ${error.message}`;
  }
  return error.message || String(error);
};

const waitForServer = async ({ url, attempts = 30, delayMs = 500 }) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await axios.get(url, { timeout: 1000 });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // ignore and retry
    }
    await sleep(delayMs);
  }
  throw new Error(`Server did not become ready at ${url}`);
};

const createFixtures = async () => {
  const doctorPassword = 'Doctor@123';
  const patientPassword = 'Patient@123';
  const pharmacyPassword = 'Pharmacy@123';

  const doctor = await Doctor.create({
    firstName: 'Asha',
    lastName: 'Verma',
    email: 'asha.verma@example.com',
    phone: '+9111001100',
    password: doctorPassword,
    specialization: 'General Medicine',
    gender: 'female',
    licenseNumber: 'DOC-TEST-001',
    status: APPROVAL_STATUS.APPROVED,
    clinicDetails: {
      name: 'Healiinn Care',
      address: {
        line1: 'Test Street',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.076],
      },
    },
  });

  const patient = await Patient.create({
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+919999888877',
    password: patientPassword,
    gender: 'male',
  });

  const pharmacy = await Pharmacy.create({
    pharmacyName: 'City Pharmacy',
    ownerName: 'Priya Singh',
    email: 'city.pharmacy@example.com',
    phone: '+918888777766',
    password: pharmacyPassword,
    licenseNumber: 'PHARM-TEST-001',
    gstNumber: '27AAACX1234E1Z5',
    address: {
      line1: 'Pharmacy Lane',
      city: 'Mumbai',
      state: 'MH',
      postalCode: '400002',
      country: 'India',
      location: {
        type: 'Point',
        coordinates: [72.8791, 19.0755],
      },
    },
    deliveryOptions: ['delivery', 'pickup'],
    serviceRadiusKm: 5,
    status: APPROVAL_STATUS.APPROVED,
    approvedAt: new Date(),
  });

  const clinic = await Clinic.create({
    doctor: doctor._id,
    name: 'Healiinn Care Clinic',
    contactNumber: '+910000000000',
    address: {
      line1: 'Clinic Road',
      city: 'Mumbai',
      state: 'MH',
      postalCode: '400001',
      country: 'India',
    },
    isPrimary: true,
    location: {
      type: 'Point',
      coordinates: [72.878, 19.0765],
    },
  });

  const sessionStart = new Date();
  const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

  const clinicSession = await ClinicSession.create({
    doctor: doctor._id,
    clinic: clinic._id,
    startTime: sessionStart,
    endTime: sessionEnd,
    maxTokens: 30,
    averageConsultationMinutes: 15,
  });

  const sessionToken = await SessionToken.create({
    session: clinicSession._id,
    doctor: doctor._id,
    clinic: clinic._id,
    patient: patient._id,
    tokenNumber: 1,
  });

  const consultation = await Consultation.create({
    session: clinicSession._id,
    token: sessionToken._id,
    doctor: doctor._id,
    patient: patient._id,
  });

  const prescription = await Prescription.create({
    patient: patient._id,
    doctor: doctor._id,
    consultation: consultation._id,
    diagnosis: 'Seasonal Flu',
    advice: 'Rest and stay hydrated.',
    medications: [
      {
        name: 'Paracetamol 500mg',
        dosage: '500mg',
        frequency: 'Twice a day',
        duration: '5 days',
        instructions: 'After meals',
      },
    ],
    investigations: [
      {
        name: 'CBC',
        notes: 'If fever persists for more than 3 days.',
      },
    ],
  });

  return {
    doctor,
    doctorPassword,
    patient,
    patientPassword,
    pharmacy,
    pharmacyPassword,
    prescription,
  };
};

const run = async () => {
  const results = [];
  const runTest = async (name, fn) => {
    try {
      const detail = await fn();
      results.push({ name, status: 'PASS', details: formatDetail(detail) });
    } catch (error) {
      results.push({ name, status: 'FAIL', details: formatError(error) });
    }
  };

  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    ENABLE_REDIS: 'false',
    MONGODB_URI: mongoUri,
    PORT: String(PORT),
    JWT_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    FRONTEND_URL: 'http://localhost:3000',
  };

  const serverProcess = fork(path.join(__dirname, '..', 'server.js'), {
    env,
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[server] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[server:error] ${data.toString().trim()}`);
  });

  try {
    await waitForServer({ url: `${BASE_URL}/health` });
    await mongoose.connect(mongoUri);

    const fixtures = await createFixtures();

    const client = axios.create({
      baseURL: BASE_URL,
      timeout: 5000,
      validateStatus: () => true,
    });

    let patientToken;
    let pharmacyToken;
    let sharedLeadId;

    await runTest('Patient login succeeds', async () => {
      const response = await client.post('/api/patients/auth/login', {
        email: fixtures.patient.email,
        password: fixtures.patientPassword,
      });
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      patientToken = response.data.data.tokens.accessToken;
      return { patientId: fixtures.patient._id.toString() };
    });

    await runTest('Pharmacy login succeeds (approved)', async () => {
      const response = await client.post('/api/pharmacies/auth/login', {
        email: fixtures.pharmacy.email,
        password: fixtures.pharmacyPassword,
      });
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      pharmacyToken = response.data.data.tokens.accessToken;
      return { pharmacyId: fixtures.pharmacy._id.toString() };
    });

    await runTest('Prescription share rejects invalid target type', async () => {
      const response = await client.post(
        `/api/prescriptions/${fixtures.prescription._id.toString()}/share`,
        {
          targetType: 'chemist',
          targetIds: [fixtures.pharmacy._id.toString()],
        },
        AUTH_HEADERS(patientToken),
      );
      if (response.status !== 400) {
        throw new Error(`Expected 400, received ${response.status}`);
      }
      return 'Invalid target type correctly rejected';
    });

    await runTest('Prescription share with pharmacy succeeds', async () => {
      const response = await client.post(
        `/api/prescriptions/${fixtures.prescription._id.toString()}/share`,
        {
          targetType: 'pharmacy',
          targetIds: [fixtures.pharmacy._id.toString()],
        },
        AUTH_HEADERS(patientToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      if (!response.data?.data?.leadId) {
        throw new Error('Lead ID missing in response');
      }
      sharedLeadId = response.data.data.leadId;
      const initialStatus = response.data.data.status;
      if (initialStatus !== PHARMACY_LEAD_STATUS.NEW) {
        throw new Error(`Expected status "new", received "${initialStatus}"`);
      }
      return {
        leadId: sharedLeadId,
        statusHistoryEntries: response.data.data.statusHistory?.length || 0,
      };
    });

    await runTest('Pharmacy lead listing (default status) returns shared lead', async () => {
      const response = await client.get(
        '/api/pharmacy/leads',
        AUTH_HEADERS(pharmacyToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      const lead = response.data.leads.find((item) => item.leadId === sharedLeadId);
      if (!lead) {
        throw new Error('Shared lead not found in listing response');
      }
      if (lead.status !== PHARMACY_LEAD_STATUS.NEW) {
        throw new Error(`Expected status "new", received "${lead.status}"`);
      }
      return {
        count: response.data.leads.length,
        status: lead.status,
      };
    });

    await runTest('Pharmacy lead listing rejects invalid status filter', async () => {
      const response = await client.get(
        '/api/pharmacy/leads?status=unknown',
        AUTH_HEADERS(pharmacyToken),
      );
      if (response.status !== 400) {
        throw new Error(`Expected 400, received ${response.status}`);
      }
      return 'Invalid status filter correctly rejected';
    });

    await runTest('Pharmacy status update rejects unsupported value', async () => {
      const response = await client.patch(
        `/api/pharmacy/leads/${sharedLeadId}/status`,
        {
          status: 'ready_for_pickup',
        },
        AUTH_HEADERS(pharmacyToken),
      );
      if (response.status !== 400) {
        throw new Error(`Expected 400, received ${response.status}`);
      }
      return 'Unsupported status correctly rejected';
    });

    await runTest('Pharmacy updates status to patient_arrived', async () => {
      const response = await client.patch(
        `/api/pharmacy/leads/${sharedLeadId}/status`,
        {
          status: PHARMACY_LEAD_STATUS.PATIENT_ARRIVED,
          notes: 'Patient visited store and verified prescription',
        },
        AUTH_HEADERS(pharmacyToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      if (response.data.lead.status !== PHARMACY_LEAD_STATUS.PATIENT_ARRIVED) {
        throw new Error(`Expected status "patient_arrived", received "${response.data.lead.status}"`);
      }
      const historyLength = response.data.lead.statusHistory?.length || 0;
      if (historyLength < 2) {
        throw new Error(`Expected at least 2 history entries, found ${historyLength}`);
      }
      return {
        status: response.data.lead.status,
        historyLength,
      };
    });

    await runTest('Pharmacy updates status to delivery_requested with delivery charge', async () => {
      const response = await client.patch(
        `/api/pharmacy/leads/${sharedLeadId}/status`,
        {
          status: PHARMACY_LEAD_STATUS.DELIVERY_REQUESTED,
          notes: 'Patient requested home delivery',
          billing: {
            deliveryCharge: 80,
            currency: 'inr',
            notes: 'Same-day courier service',
          },
        },
        AUTH_HEADERS(pharmacyToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      if (response.data.lead.status !== PHARMACY_LEAD_STATUS.DELIVERY_REQUESTED) {
        throw new Error(`Expected status "delivery_requested", received "${response.data.lead.status}"`);
      }
      const billing = response.data.lead.billingSummary;
      if (!billing || billing.deliveryCharge !== 80) {
        throw new Error(`Expected delivery charge 80, received ${JSON.stringify(billing)}`);
      }
      return {
        status: response.data.lead.status,
        billing,
      };
    });

    await runTest('Pharmacy completes lead with final billing', async () => {
      const response = await client.patch(
        `/api/pharmacy/leads/${sharedLeadId}/status`,
        {
          status: PHARMACY_LEAD_STATUS.COMPLETED,
          notes: 'Medicines delivered and payment collected',
          billing: {
            totalAmount: 650,
            deliveryCharge: 80,
            currency: 'INR',
            notes: 'Includes delivery fee',
          },
        },
        AUTH_HEADERS(pharmacyToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      if (response.data.lead.status !== PHARMACY_LEAD_STATUS.COMPLETED) {
        throw new Error(`Expected status "completed", received "${response.data.lead.status}"`);
      }
      const billing = response.data.lead.billingSummary;
      if (!billing || billing.totalAmount !== 650) {
        throw new Error(`Expected total amount 650, received ${JSON.stringify(billing)}`);
      }
      return {
        status: response.data.lead.status,
        billing,
      };
    });

    await runTest('Patient sees updated pharmacy sharing details', async () => {
      const response = await client.get(
        `/api/prescriptions/${fixtures.prescription._id.toString()}`,
        AUTH_HEADERS(patientToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      const pharmacyShare = response.data.prescription.sharedWith?.pharmacies;
      if (!pharmacyShare || pharmacyShare.status !== PHARMACY_LEAD_STATUS.COMPLETED) {
        throw new Error(`Expected completed pharmacy share, received ${JSON.stringify(pharmacyShare)}`);
      }
      if (!pharmacyShare.billingSummary || pharmacyShare.billingSummary.totalAmount !== 650) {
        throw new Error(`Expected billing summary with total 650, received ${JSON.stringify(pharmacyShare.billingSummary)}`);
      }
      return {
        status: pharmacyShare.status,
        billing: pharmacyShare.billingSummary,
      };
    });

    await runTest('Pharmacy lead listing with status=all returns updated lead', async () => {
      const response = await client.get(
        '/api/pharmacy/leads?status=all',
        AUTH_HEADERS(pharmacyToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      const lead = response.data.leads.find((item) => item.leadId === sharedLeadId);
      if (!lead) {
        throw new Error('Updated lead not found in status=all listing');
      }
      if (lead.status !== PHARMACY_LEAD_STATUS.COMPLETED) {
        throw new Error(`Expected completed status, received "${lead.status}"`);
      }
      return {
        status: lead.status,
        billing: lead.billingSummary,
      };
    });
  } finally {
    serverProcess.kill('SIGINT');
    await mongoose.disconnect().catch(() => {});
    await mongoServer.stop();
  }

  const passCount = results.filter((item) => item.status === 'PASS').length;
  const failCount = results.length - passCount;

  console.log('\n=== Pharmacy API Test Report ===');
  console.table(
    results.map((item) => ({
      Test: item.name,
      Status: item.status,
      Details: item.details,
    })),
  );
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);

  if (failCount > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Fatal error while running pharmacy API tests:', error);
  process.exitCode = 1;
});


