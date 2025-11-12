/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.SMOKE_TEST_BASE_URL || `http://localhost:${PORT}`;

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

const randomString = (prefix) => `${prefix}-${crypto.randomBytes(6).toString('hex')}`;

const pretty = (obj) => JSON.stringify(obj, null, 2);

const report = (label, { status, data }) => {
  const ok = status >= 200 && status < 300;
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${label}`);
  console.log(`Status: ${status}`);
  if (!ok) {
    console.log(pretty(data));
  }
  return ok;
};

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const waitForServer = async () => {
  const maxAttempts = Number(process.env.SMOKE_TEST_MAX_ATTEMPTS) || 30;
  const delayMs = Number(process.env.SMOKE_TEST_RETRY_DELAY_MS) || 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await client.get('/health');
      if (response.status >= 200 && response.status < 500) {
        console.log(`\nAPI reachable (attempt ${attempt})`);
        return true;
      }
    } catch (error) {
      // ignore retry
    }
    console.log(`Waiting for API... (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }

  throw new Error(`API not reachable at ${BASE_URL}`);
};

const main = async () => {
  console.log('Running appointment / smart queue tests');
  console.log(`Base URL: ${BASE_URL}`);

  const summary = [];

  await waitForServer();

  const adminRegistrationCode = process.env.ADMIN_REGISTRATION_CODE;

  if (!adminRegistrationCode) {
    console.warn('\n[WARN] ADMIN_REGISTRATION_CODE missing. Admin approval steps will fail.');
  }

  try {
    // 1. Patient signup
    const patientEmail = `${randomString('patient') }@example.com`;
    const patientSignup = await client.post('/api/patients/auth/signup', {
      name: 'Queue Patient',
      email: patientEmail,
      phone: `9${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      gender: 'other',
      address: { city: 'Test City' },
    });
    summary.push(['Patient signup', report('Patient signup', patientSignup)]);

    const patientTokens = patientSignup.data?.data?.tokens;

    // 2. Admin signup (if code)
    let adminTokens;
    const adminEmail = `${randomString('admin') }@example.com`;
    if (adminRegistrationCode) {
      const adminSignup = await client.post('/api/admin/auth/signup', {
        name: 'Queue Admin',
        email: adminEmail,
        phone: `8${crypto.randomInt(100000000, 999999999)}`,
        password: 'SecurePass123!',
        registrationCode: adminRegistrationCode,
        isSuperAdmin: true,
      });
      summary.push(['Admin signup', report('Admin signup', adminSignup)]);
      adminTokens = adminSignup.data?.data?.tokens;
    }

    const approve = async (role, id) => {
      if (!adminTokens?.accessToken) {
        console.warn(`[WARN] Cannot approve ${role}; admin token missing`);
        return false;
      }
      const res = await client.patch(
        `/api/admin/approvals/${role}/${id}/approve`,
        {},
        authHeader(adminTokens.accessToken)
      );
      summary.push([`Approve ${role}`, report(`Approve ${role}`, res)]);
      return res.status >= 200 && res.status < 300;
    };

    // 3. Doctor signup & approval
    const doctorEmail = `${randomString('doctor') }@example.com`;
    const doctorSignup = await client.post('/api/doctors/auth/signup', {
      name: 'Queue Doctor',
      email: doctorEmail,
      phone: `7${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      specialization: 'General',
      licenseNumber: randomString('LIC'),
      consultationFee: 500,
      gender: 'male',
      clinicName: 'Queue Care Clinic',
      clinicAddress: {
        line1: '45 Queue Street',
        city: 'Test City',
        state: 'TS',
        postalCode: '410005',
        country: 'India',
      },
      clinicCoordinates: [77.5946, 12.9716],
    });
    summary.push(['Doctor signup', report('Doctor signup', doctorSignup)]);
    const doctorId = doctorSignup.data?.data?.doctor?._id;

    if (doctorId) {
      await approve('doctor', doctorId);
    }

    const doctorLogin = await client.post('/api/doctors/auth/login', {
      email: doctorEmail,
      password: 'SecurePass123!',
    });
    summary.push(['Doctor login', report('Doctor login', doctorLogin)]);
    const doctorTokens = doctorLogin.data?.data?.tokens;

    if (!doctorTokens?.accessToken || !patientTokens?.accessToken) {
      throw new Error('Required tokens missing. Aborting queue tests.');
    }

    // 4. Doctor creates clinic
    const clinicRes = await client.post(
      '/api/appointments/clinics',
      {
        name: 'Main Clinic',
        contactNumber: '1800123456',
        address: {
          line1: '123 Health St',
          city: 'MediCity',
        },
        location: {
          coordinates: [77.5946, 12.9716], // lng, lat
        },
        averageConsultationMinutes: 15,
      },
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Create clinic', report('Create clinic', clinicRes)]);
    const clinicId = clinicRes.data?.clinic?._id;

    if (!clinicId) {
      throw new Error('Clinic creation failed. Aborting appointment tests.');
    }

    // 5. Doctor creates session
    const startTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const sessionRes = await client.post(
      '/api/appointments/sessions',
      {
        clinicId,
        startTime,
        endTime,
        averageConsultationMinutes: 10,
        bufferMinutes: 5,
      },
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Create session', report('Create session', sessionRes)]);
    const sessionId = sessionRes.data?.session?._id;

    if (!sessionId) {
      throw new Error('Session creation failed. Aborting appointment tests.');
    }

    // 6. Doctor starts session
    const startRes = await client.patch(
      `/api/appointments/sessions/${sessionId}/start`,
      {},
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Start session', report('Start session', startRes)]);

    // 7. Patient books token
    const tokenRes = await client.post(
      `/api/appointments/sessions/${sessionId}/tokens`,
      {
        reason: 'General Checkup',
        notes: 'Feeling unwell',
      },
      authHeader(patientTokens.accessToken)
    );
    summary.push(['Issue token', report('Issue token', tokenRes)]);
    const tokenId = tokenRes.data?.token?._id;

    if (!tokenId) {
      throw new Error('Token issuance failed. Aborting appointment tests.');
    }

    // 8. Session state check
    const stateRes = await client.get(
      `/api/appointments/sessions/${sessionId}/state`,
      authHeader(patientTokens.accessToken)
    );
    summary.push(['Get session state', report('Get session state', stateRes)]);

    // 9. Patient check-in
    const checkinRes = await client.patch(
      `/api/appointments/tokens/${tokenId}/checkin`,
      {},
      authHeader(patientTokens.accessToken)
    );
    summary.push(['Patient checkin', report('Patient checkin', checkinRes)]);

    // 10. Doctor calls token
    const callRes = await client.patch(
      `/api/appointments/tokens/${tokenId}/status`,
      { status: 'called' },
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Doctor call token', report('Doctor call token', callRes)]);

    // 11. Doctor marks visited
    const visitedRes = await client.patch(
      `/api/appointments/tokens/${tokenId}/status`,
      { status: 'visited' },
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Doctor mark visited', report('Doctor mark visited', visitedRes)]);

    // 12. Doctor completes consultation
    const completeRes = await client.patch(
      `/api/appointments/tokens/${tokenId}/status`,
      { status: 'completed' },
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Doctor mark completed', report('Doctor mark completed', completeRes)]);

    // 13. Patient token list
    const patientTokensRes = await client.get(
      '/api/appointments/patient/tokens',
      authHeader(patientTokens.accessToken)
    );
    summary.push(['Patient token list', report('Patient token list', patientTokensRes)]);

    // 14. Session pause/resume for coverage
    const pauseRes = await client.patch(
      `/api/appointments/sessions/${sessionId}/pause`,
      { reason: 'Short break', resumeAt: new Date(Date.now() + 10 * 60 * 1000) },
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Pause session', report('Pause session', pauseRes)]);

    const resumeRes = await client.patch(
      `/api/appointments/sessions/${sessionId}/resume`,
      {},
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Resume session', report('Resume session', resumeRes)]);

    // 15. Session details fetch
    const sessionDetailRes = await client.get(
      `/api/appointments/sessions/${sessionId}`,
      authHeader(doctorTokens.accessToken)
    );
    summary.push(['Session details', report('Session details', sessionDetailRes)]);

    console.log('\nAppointment test summary:');
    const failures = summary.filter(([, ok]) => !ok);
    summary.forEach(([label, ok]) => console.log(`- ${ok ? '✅' : '❌'} ${label}`));

    if (failures.length) {
      console.log(`\n${failures.length} appointment checks failed.`);
      process.exitCode = 1;
    } else {
      console.log('\nAll appointment checks passed!');
    }
  } catch (error) {
    console.error('\nAppointment tests aborted due to unexpected error:');
    console.error(error);
    process.exitCode = 1;
  }
};

main().finally(() => sleep(100).then(() => process.exit()));

