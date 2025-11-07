/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.SMOKE_TEST_BASE_URL || `http://localhost:${PORT}`;

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
      // ignore, server may still be booting
    }

    console.log(`Waiting for API... (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }

  throw new Error(`API not reachable at ${BASE_URL} after ${maxAttempts} attempts`);
};

const main = async () => {
  console.log('Running Healiinn API smoke tests');
  console.log(`Base URL: ${BASE_URL}`);

  const summary = [];

  await waitForServer();

  const patientEmail = `${randomString('patient')}@example.com`;
  const doctorEmail = `${randomString('doctor')}@example.com`;
  const labEmail = `${randomString('lab')}@example.com`;
  const pharmacyEmail = `${randomString('pharmacy')}@example.com`;
  const adminEmail = `${randomString('admin')}@example.com`;

  const adminRegistrationCode = process.env.ADMIN_REGISTRATION_CODE;

  if (!adminRegistrationCode) {
    console.warn('\n[WARN] ADMIN_REGISTRATION_CODE is not set. Admin signup will be skipped.');
  }

  try {
    // Patient signup
    const patientSignup = await client.post('/api/patients/auth/signup', {
      name: 'Test Patient',
      email: patientEmail,
      phone: `9${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      gender: 'other',
      bloodGroup: 'O+',
      address: {
        line1: '123 Main Street',
        city: 'Testville',
        state: 'TS',
        postalCode: '12345',
        country: 'Testland',
      },
    });
    summary.push(['Patient signup', report('Patient signup', patientSignup)]);

    const patientTokens = patientSignup.data?.data?.tokens;
    const patientId = patientSignup.data?.data?.patient?._id;

    // Patient profile update
    if (patientTokens?.accessToken) {
      const patientUpdate = await client.put(
        '/api/patients/auth/me',
        {
          address: { city: 'Updated City' },
          medicalHistory: [{ condition: 'Allergy', notes: 'Peanuts', diagnosedAt: new Date() }],
        },
        authHeader(patientTokens.accessToken)
      );
      summary.push(['Patient update', report('Patient update', patientUpdate)]);
    }

    // Admin signup (conditional)
    let adminTokens;
    if (adminRegistrationCode) {
      const adminSignup = await client.post('/api/admin/auth/signup', {
        name: 'QA Admin',
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
        return false;
      }
      const res = await client.patch(
        `/api/admin/approvals/${role}/${id}/approve`,
        {},
        authHeader(adminTokens.accessToken)
      );
      summary.push([`Admin approve ${role}`, report(`Admin approve ${role}`, res)]);
      return res.status >= 200 && res.status < 300;
    };

    const reject = async (role, id, reason = 'Not specified') => {
      if (!adminTokens?.accessToken) {
        return [false, null];
      }
      const res = await client.patch(
        `/api/admin/approvals/${role}/${id}/reject`,
        { reason },
        authHeader(adminTokens.accessToken)
      );
      const ok = res.status >= 200 && res.status < 300;
      console.log(`\n[${ok ? 'PASS' : 'FAIL'}] Admin reject ${role}`);
      console.log(`Status: ${res.status}`);
      if (!ok) {
        console.log(pretty(res.data));
      }
      return [`Admin reject ${role}`, ok];
    };

    const loginExpecting = async (label, path, body, expectedStatus, tokenStore) => {
      const res = await client.post(path, body);
      const ok = res.status === expectedStatus;
      console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${label}`);
      console.log(`Status: ${res.status}`);
      if (!ok) {
        console.log(pretty(res.data));
      }
      summary.push([label, ok]);
      if (tokenStore && res.status === 200) {
        tokenStore.tokens = res.data?.data?.tokens;
        tokenStore.id = res.data?.data?.[tokenStore.key]?._id;
      }
      return res;
    };

    // Doctor flow
    const doctorSignup = await client.post('/api/doctors/auth/signup', {
      name: 'Test Doctor',
      email: doctorEmail,
      phone: `7${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      specialization: 'Cardiologist',
      licenseNumber: randomString('LIC'),
      experience: 5,
      consultationFee: 500,
      consultationModes: ['video', 'chat'],
      languages: ['English'],
    });
    summary.push(['Doctor signup', report('Doctor signup', doctorSignup)]);

    const doctorId = doctorSignup.data?.data?.doctor?._id;
    const doctorLoginBefore = await loginExpecting(
      'Doctor login before approval',
      '/api/doctors/auth/login',
      { email: doctorEmail, password: 'SecurePass123!' },
      403
    );

    if (doctorId) {
      await approve('doctor', doctorId);
    }

    const doctorStore = { key: 'doctor' };
    await loginExpecting(
      'Doctor login after approval',
      '/api/doctors/auth/login',
      { email: doctorEmail, password: 'SecurePass123!' },
      200,
      doctorStore
    );

    if (doctorStore.tokens?.accessToken) {
      const doctorUpdate = await client.put(
        '/api/doctors/auth/me',
        { consultationFee: 750, availableTimings: ['Mon-Fri 10:00-18:00'] },
        authHeader(doctorStore.tokens.accessToken)
      );
      summary.push(['Doctor update', report('Doctor update', doctorUpdate)]);
    }

    // Doctor rejection flow
    const doctorRejectEmail = `${randomString('doctor-reject')}@example.com`;
    const doctorRejectSignup = await client.post('/api/doctors/auth/signup', {
      name: 'Reject Doctor',
      email: doctorRejectEmail,
      phone: `74${crypto.randomInt(10000000, 99999999)}`,
      password: 'SecurePass123!',
      specialization: 'Dermatologist',
      licenseNumber: randomString('REJLIC'),
    });
    summary.push(['Doctor signup (reject case)', report('Doctor signup (reject case)', doctorRejectSignup)]);

    const doctorRejectId = doctorRejectSignup.data?.data?.doctor?._id;
    await loginExpecting(
      'Doctor login before reject decision',
      '/api/doctors/auth/login',
      { email: doctorRejectEmail, password: 'SecurePass123!' },
      403
    );

    if (doctorRejectId) {
      const rejection = await reject('doctor', doctorRejectId, 'Documents not clear');
      summary.push(rejection);
    }

    const doctorRejectLogin = await client.post('/api/doctors/auth/login', {
      email: doctorRejectEmail,
      password: 'SecurePass123!',
    });
    const docRejectOk = doctorRejectLogin.status === 403 && doctorRejectLogin.data?.data?.status === 'rejected';
    console.log(`\n[${docRejectOk ? 'PASS' : 'FAIL'}] Doctor login after rejection`);
    console.log(`Status: ${doctorRejectLogin.status}`);
    if (!docRejectOk) {
      console.log(pretty(doctorRejectLogin.data));
    }
    summary.push(['Doctor login after rejection', docRejectOk]);

    // Laboratory flow
    const labSignup = await client.post('/api/laboratories/auth/signup', {
      labName: 'Test Lab',
      ownerName: 'Lab Owner',
      email: labEmail,
      phone: `6${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      licenseNumber: randomString('LABLIC'),
      servicesOffered: ['Blood Test'],
      timings: ['24x7'],
    });
    summary.push(['Laboratory signup', report('Laboratory signup', labSignup)]);

    const labId = labSignup.data?.data?.laboratory?._id;
    await loginExpecting(
      'Laboratory login before approval',
      '/api/laboratories/auth/login',
      { email: labEmail, password: 'SecurePass123!' },
      403
    );

    if (labId) {
      await approve('laboratory', labId);
    }

    const labStore = { key: 'laboratory' };
    await loginExpecting(
      'Laboratory login after approval',
      '/api/laboratories/auth/login',
      { email: labEmail, password: 'SecurePass123!' },
      200,
      labStore
    );

    if (labStore.tokens?.accessToken) {
      const labUpdate = await client.put(
        '/api/laboratories/auth/me',
        { servicesOffered: ['Blood Test', 'X-Ray'], timings: ['Mon-Sat 09:00-21:00'] },
        authHeader(labStore.tokens.accessToken)
      );
      summary.push(['Laboratory update', report('Laboratory update', labUpdate)]);
    }

    // Laboratory rejection flow
    const labRejectEmail = `${randomString('lab-reject')}@example.com`;
    const labRejectSignup = await client.post('/api/laboratories/auth/signup', {
      labName: 'Reject Lab',
      email: labRejectEmail,
      phone: `6${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      licenseNumber: randomString('LABREJ'),
    });
    summary.push(['Laboratory signup (reject case)', report('Laboratory signup (reject case)', labRejectSignup)]);

    const labRejectId = labRejectSignup.data?.data?.laboratory?._id;
    await loginExpecting(
      'Laboratory login before reject decision',
      '/api/laboratories/auth/login',
      { email: labRejectEmail, password: 'SecurePass123!' },
      403
    );

    if (labRejectId) {
      const rejection = await reject('laboratory', labRejectId, 'Facility verification pending');
      summary.push(rejection);
    }

    const labRejectLogin = await client.post('/api/laboratories/auth/login', {
      email: labRejectEmail,
      password: 'SecurePass123!',
    });
    const labRejectOk = labRejectLogin.status === 403 && labRejectLogin.data?.data?.status === 'rejected';
    console.log(`\n[${labRejectOk ? 'PASS' : 'FAIL'}] Laboratory login after rejection`);
    console.log(`Status: ${labRejectLogin.status}`);
    if (!labRejectOk) {
      console.log(pretty(labRejectLogin.data));
    }
    summary.push(['Laboratory login after rejection', labRejectOk]);

    // Pharmacy flow
    const pharmacySignup = await client.post('/api/pharmacies/auth/signup', {
      pharmacyName: 'Test Pharmacy',
      ownerName: 'Pharma Owner',
      email: pharmacyEmail,
      phone: `5${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      licenseNumber: randomString('PHARMLIC'),
      gstNumber: '22AAAAA0000A1Z5',
      timings: ['Mon-Sun 08:00-22:00'],
    });
    summary.push(['Pharmacy signup', report('Pharmacy signup', pharmacySignup)]);

    const pharmacyId = pharmacySignup.data?.data?.pharmacy?._id;
    await loginExpecting(
      'Pharmacy login before approval',
      '/api/pharmacies/auth/login',
      { email: pharmacyEmail, password: 'SecurePass123!' },
      403
    );

    if (pharmacyId) {
      await approve('pharmacy', pharmacyId);
    }

    const pharmacyStore = { key: 'pharmacy' };
    await loginExpecting(
      'Pharmacy login after approval',
      '/api/pharmacies/auth/login',
      { email: pharmacyEmail, password: 'SecurePass123!' },
      200,
      pharmacyStore
    );

    if (pharmacyStore.tokens?.accessToken) {
      const pharmacyUpdate = await client.put(
        '/api/pharmacies/auth/me',
        { gstNumber: '33BBBBB1111B2Z6', timings: ['Mon-Sun 07:00-23:00'] },
        authHeader(pharmacyStore.tokens.accessToken)
      );
      summary.push(['Pharmacy update', report('Pharmacy update', pharmacyUpdate)]);
    }

    // Pharmacy rejection flow
    const pharmacyRejectEmail = `${randomString('pharmacy-reject')}@example.com`;
    const pharmacyRejectSignup = await client.post('/api/pharmacies/auth/signup', {
      pharmacyName: 'Reject Pharmacy',
      email: pharmacyRejectEmail,
      phone: `5${crypto.randomInt(100000000, 999999999)}`,
      password: 'SecurePass123!',
      licenseNumber: randomString('PHARREJ'),
    });
    summary.push(['Pharmacy signup (reject case)', report('Pharmacy signup (reject case)', pharmacyRejectSignup)]);

    const pharmacyRejectId = pharmacyRejectSignup.data?.data?.pharmacy?._id;
    await loginExpecting(
      'Pharmacy login before reject decision',
      '/api/pharmacies/auth/login',
      { email: pharmacyRejectEmail, password: 'SecurePass123!' },
      403
    );

    if (pharmacyRejectId) {
      const rejection = await reject('pharmacy', pharmacyRejectId, 'Incomplete documentation');
      summary.push(rejection);
    }

    const pharmacyRejectLogin = await client.post('/api/pharmacies/auth/login', {
      email: pharmacyRejectEmail,
      password: 'SecurePass123!',
    });
    const pharmacyRejectOk =
      pharmacyRejectLogin.status === 403 && pharmacyRejectLogin.data?.data?.status === 'rejected';
    console.log(`\n[${pharmacyRejectOk ? 'PASS' : 'FAIL'}] Pharmacy login after rejection`);
    console.log(`Status: ${pharmacyRejectLogin.status}`);
    if (!pharmacyRejectOk) {
      console.log(pretty(pharmacyRejectLogin.data));
    }
    summary.push(['Pharmacy login after rejection', pharmacyRejectOk]);

    // Patient profile view via admin (if admin exists)
    if (adminTokens?.accessToken && patientId) {
      const patientByAdmin = await client.get(
        `/api/patients/auth/profile/${patientId}`,
        authHeader(adminTokens.accessToken)
      );
      summary.push(['Admin fetch patient profile', report('Admin fetch patient profile', patientByAdmin)]);
    }

    console.log('\nSmoke test summary:');
    const failures = summary.filter(([, ok]) => !ok);
    summary.forEach(([label, ok]) => console.log(`- ${ok ? '✅' : '❌'} ${label}`));

    if (failures.length) {
      console.log(`\n${failures.length} checks failed.`);
      process.exitCode = 1;
    } else {
      console.log('\nAll checks passed!');
    }
  } catch (error) {
    console.error('\nSmoke test aborted due to unexpected error:');
    console.error(error);
    process.exitCode = 1;
  }
};

main().finally(() => sleep(100).then(() => process.exit()));
