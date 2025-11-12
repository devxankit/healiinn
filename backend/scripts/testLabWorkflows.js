/* eslint-disable no-console */
const path = require('path');
const { fork } = require('child_process');
const axios = require('axios');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { setTimeout: sleep } = require('timers/promises');

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Laboratory = require('../models/Laboratory');
const Clinic = require('../models/Clinic');
const ClinicSession = require('../models/ClinicSession');
const SessionToken = require('../models/SessionToken');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const {
  APPROVAL_STATUS,
  LAB_LEAD_STATUS,
} = require('../utils/constants');

const PORT = Number(process.env.TEST_PORT) || 5011;
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
  const labPassword = 'Lab@1234';

  const doctor = await Doctor.create({
    firstName: 'Neeraj',
    lastName: 'Kulkarni',
    email: 'neeraj.kulkarni@example.com',
    phone: '+911122334455',
    password: doctorPassword,
    specialization: 'Pathology',
    gender: 'male',
    licenseNumber: 'DOC-LAB-001',
    status: APPROVAL_STATUS.APPROVED,
    clinicDetails: {
      name: 'City Health Clinic',
      address: {
        line1: 'Central Avenue',
        city: 'Pune',
        state: 'MH',
        postalCode: '411001',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
      },
    },
  });

  const patient = await Patient.create({
    firstName: 'Sneha',
    lastName: 'Joshi',
    email: 'sneha.joshi@example.com',
    phone: '+919887766554',
    password: patientPassword,
    gender: 'female',
  });

  const laboratory = await Laboratory.create({
    labName: 'Precision Labs',
    ownerName: 'Arjun Patel',
    email: 'precision.labs@example.com',
    phone: '+918765432100',
    password: labPassword,
    licenseNumber: 'LAB-TEST-001',
    address: {
      line1: 'Lab Street',
      city: 'Pune',
      state: 'MH',
      postalCode: '411002',
      country: 'India',
      location: {
        type: 'Point',
        coordinates: [73.8575, 18.521],
      },
    },
    servicesOffered: ['Blood Tests', 'Urine Tests'],
    status: APPROVAL_STATUS.APPROVED,
    approvedAt: new Date(),
  });

  const clinic = await Clinic.create({
    doctor: doctor._id,
    name: 'City Health Clinic',
    contactNumber: '+919900112233',
    address: {
      line1: 'Central Avenue',
      city: 'Pune',
      state: 'MH',
      postalCode: '411001',
      country: 'India',
    },
    isPrimary: true,
    location: {
      type: 'Point',
      coordinates: [73.8569, 18.5209],
    },
  });

  const sessionStart = new Date();
  const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

  const clinicSession = await ClinicSession.create({
    doctor: doctor._id,
    clinic: clinic._id,
    startTime: sessionStart,
    endTime: sessionEnd,
    maxTokens: 25,
    averageConsultationMinutes: 12,
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
    diagnosis: 'Routine Health Checkup',
    advice: 'Fasting for 8 hours before blood sample.',
    medications: [
      {
        name: 'Vitamin D Supplement',
        dosage: '1000 IU',
        frequency: 'Once a day',
        duration: '30 days',
      },
    ],
    investigations: [
      {
        name: 'Complete Blood Count',
        notes: 'Include ESR',
      },
      {
        name: 'Lipid Profile',
        notes: 'Fasting sample',
      },
    ],
  });

  return {
    doctor,
    doctorPassword,
    patient,
    patientPassword,
    laboratory,
    labPassword,
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
    let labToken;
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

    await runTest('Laboratory login succeeds (approved)', async () => {
      const response = await client.post('/api/laboratories/auth/login', {
        email: fixtures.laboratory.email,
        password: fixtures.labPassword,
      });
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      labToken = response.data.data.tokens.accessToken;
      return { laboratoryId: fixtures.laboratory._id.toString() };
    });

    await runTest('Prescription share rejects invalid target type', async () => {
      const response = await client.post(
        `/api/prescriptions/${fixtures.prescription._id.toString()}/share`,
        {
          targetType: 'pharmacy',
          targetIds: [fixtures.laboratory._id.toString()],
        },
        AUTH_HEADERS(patientToken),
      );
      if (response.status !== 400) {
        throw new Error(`Expected 400, received ${response.status}`);
      }
      return 'Invalid target type correctly rejected';
    });

    await runTest('Prescription share with laboratory succeeds', async () => {
      const response = await client.post(
        `/api/prescriptions/${fixtures.prescription._id.toString()}/share`,
        {
          targetType: 'laboratory',
          targetIds: [fixtures.laboratory._id.toString()],
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
      if (response.data.data.status !== LAB_LEAD_STATUS.NEW) {
        throw new Error(`Expected status "new", received "${response.data.data.status}"`);
      }
      return {
        leadId: sharedLeadId,
        statusHistoryEntries: response.data.data.statusHistory?.length || 0,
      };
    });

    await runTest('Laboratory lead listing (default status) returns shared lead', async () => {
      const response = await client.get(
        '/api/labs/leads',
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      const lead = response.data.leads.find((item) => item.leadId === sharedLeadId);
      if (!lead) {
        throw new Error('Shared lead not found in listing response');
      }
      if (lead.status !== LAB_LEAD_STATUS.NEW) {
        throw new Error(`Expected status "new", received "${lead.status}"`);
      }
      return {
        count: response.data.leads.length,
        status: lead.status,
      };
    });

    await runTest('Laboratory lead listing rejects invalid status filter', async () => {
      const response = await client.get(
        '/api/labs/leads?status=invalid',
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 400) {
        throw new Error(`Expected 400, received ${response.status}`);
      }
      return 'Invalid status filter correctly rejected';
    });

    await runTest('Laboratory status update rejects unsupported value', async () => {
      const response = await client.patch(
        `/api/labs/leads/${sharedLeadId}/status`,
        {
          status: 'results_ready',
        },
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 400) {
        throw new Error(`Expected 400, received ${response.status}`);
      }
      return 'Unsupported status correctly rejected';
    });

    await runTest('Laboratory updates status to home_collection_requested', async () => {
      const response = await client.patch(
        `/api/labs/leads/${sharedLeadId}/status`,
        {
          status: LAB_LEAD_STATUS.HOME_COLLECTION_REQUESTED,
          notes: 'Patient requested home visit for sample collection',
        },
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      if (response.data.lead.status !== LAB_LEAD_STATUS.HOME_COLLECTION_REQUESTED) {
        throw new Error(`Expected status "home_collection_requested", received "${response.data.lead.status}"`);
      }
      return {
        status: response.data.lead.status,
        historyLength: response.data.lead.statusHistory?.length || 0,
      };
    });

    await runTest('Laboratory updates status to sample_collected', async () => {
      const response = await client.patch(
        `/api/labs/leads/${sharedLeadId}/status`,
        {
          status: LAB_LEAD_STATUS.SAMPLE_COLLECTED,
          notes: 'Home collection completed by phlebotomist',
        },
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      return {
        status: response.data.lead.status,
      };
    });

    await runTest('Laboratory updates status to test_completed with billing', async () => {
      const response = await client.patch(
        `/api/labs/leads/${sharedLeadId}/status`,
        {
          status: LAB_LEAD_STATUS.TEST_COMPLETED,
          notes: 'Lab analysis completed, preparing report',
          billing: {
            totalAmount: 1200,
            homeCollectionCharge: 150,
            currency: 'inr',
            notes: 'Includes home collection service',
          },
        },
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      const billing = response.data.lead.billingSummary;
      if (!billing || billing.totalAmount !== 1200 || billing.homeCollectionCharge !== 150) {
        throw new Error(`Unexpected billing summary: ${JSON.stringify(billing)}`);
      }
      return {
        status: response.data.lead.status,
        billing,
      };
    });

    await runTest('Laboratory uploads report', async () => {
      const response = await client.patch(
        `/api/labs/leads/${sharedLeadId}/status`,
        {
          status: LAB_LEAD_STATUS.REPORT_UPLOADED,
          notes: 'Report uploaded and shared with patient',
          report: {
            fileUrl: 'https://example.com/reports/cbc-123.pdf',
            fileName: 'cbc-report.pdf',
            mimeType: 'application/pdf',
            notes: 'Digital signature included',
          },
        },
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      if (response.data.lead.status !== LAB_LEAD_STATUS.REPORT_UPLOADED) {
        throw new Error(`Expected status "report_uploaded", received "${response.data.lead.status}"`);
      }
      if (!response.data.lead.reportDetails || response.data.lead.reportDetails.fileUrl !== 'https://example.com/reports/cbc-123.pdf') {
        throw new Error(`Report details missing or incorrect: ${JSON.stringify(response.data.lead.reportDetails)}`);
      }
      return {
        status: response.data.lead.status,
        report: response.data.lead.reportDetails,
      };
    });

    await runTest('Laboratory marks lead as completed', async () => {
      const response = await client.patch(
        `/api/labs/leads/${sharedLeadId}/status`,
        {
          status: LAB_LEAD_STATUS.COMPLETED,
          notes: 'Patient acknowledged receipt of report',
        },
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      if (response.data.lead.status !== LAB_LEAD_STATUS.COMPLETED) {
        throw new Error(`Expected status "completed", received "${response.data.lead.status}"`);
      }
      return {
        status: response.data.lead.status,
      };
    });

    await runTest('Patient sees updated laboratory sharing details with report', async () => {
      const response = await client.get(
        `/api/prescriptions/${fixtures.prescription._id.toString()}`,
        AUTH_HEADERS(patientToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      const labShare = response.data.prescription.sharedWith?.laboratories;
      if (!labShare || labShare.status !== LAB_LEAD_STATUS.COMPLETED) {
        throw new Error(`Expected completed lab share, received ${JSON.stringify(labShare)}`);
      }
      if (!labShare.billingSummary || labShare.billingSummary.totalAmount !== 1200) {
        throw new Error(`Expected billing summary with total 1200, received ${JSON.stringify(labShare.billingSummary)}`);
      }
      if (!labShare.reportDetails || labShare.reportDetails.fileUrl !== 'https://example.com/reports/cbc-123.pdf') {
        throw new Error(`Expected report details, received ${JSON.stringify(labShare.reportDetails)}`);
      }
      return {
        status: labShare.status,
        billing: labShare.billingSummary,
        report: labShare.reportDetails,
      };
    });

    await runTest('Laboratory lead listing with status=all returns completed lead', async () => {
      const response = await client.get(
        '/api/labs/leads?status=all',
        AUTH_HEADERS(labToken),
      );
      if (response.status !== 200) {
        throw new Error(`Expected 200, received ${response.status}: ${JSON.stringify(response.data)}`);
      }
      const lead = response.data.leads.find((item) => item.leadId === sharedLeadId);
      if (!lead) {
        throw new Error('Updated lead not found in status=all listing');
      }
      if (lead.status !== LAB_LEAD_STATUS.COMPLETED) {
        throw new Error(`Expected completed status, received "${lead.status}"`);
      }
      return {
        status: lead.status,
        report: lead.reportDetails,
      };
    });
  } finally {
    serverProcess.kill('SIGINT');
    await mongoose.disconnect().catch(() => {});
    await mongoServer.stop();
  }

  const passCount = results.filter((item) => item.status === 'PASS').length;
  const failCount = results.length - passCount;

  console.log('\n=== Laboratory API Test Report ===');
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
  console.error('Fatal error while running laboratory API tests:', error);
  process.exitCode = 1;
});


