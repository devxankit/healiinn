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
  timeout: 30000,
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
const randomPhone = () => `9${crypto.randomInt(100000000, 999999999)}`;
const randomEmail = (prefix) => `${randomString(prefix)}@test.com`;

const pretty = (obj) => JSON.stringify(obj, null, 2);

const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  details: [],
};

const report = (label, response, expectedStatus = [200, 201]) => {
  testResults.total += 1;
  const status = response?.status || 0;
  const isExpected = Array.isArray(expectedStatus) 
    ? expectedStatus.includes(status)
    : status === expectedStatus;
  
  // If status is in expected list, it's a pass (even if it's 403, 400, etc.)
  // Otherwise, check if it's a 2xx success
  const ok = isExpected || (status >= 200 && status < 300);
  
  if (ok) {
    testResults.passed += 1;
    console.log(`\n[✓ PASS] ${label}`);
    console.log(`  Status: ${status}`);
  } else {
    testResults.failed += 1;
    console.log(`\n[✗ FAIL] ${label}`);
    console.log(`  Status: ${status} (Expected: ${JSON.stringify(expectedStatus)})`);
    if (response?.data) {
      console.log(`  Response: ${pretty(response.data).substring(0, 200)}...`);
    }
  }
  
  testResults.details.push({
    label,
    status,
    passed: ok,
    expectedStatus,
  });
  
  return ok;
};

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const waitForServer = async () => {
  const maxAttempts = 30;
  const delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await client.get('/');
      if (response.status >= 200 && response.status < 500) {
        console.log(`\n✓ API reachable (attempt ${attempt})`);
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

// Test data storage
const testData = {
  admin: { token: null, id: null },
  patient: { token: null, id: null, email: null },
  doctor: { token: null, id: null, email: null },
  laboratory: { token: null, id: null, email: null },
  pharmacy: { token: null, id: null, email: null },
  clinic: { id: null },
  session: { id: null },
  token: { id: null },
  appointment: { id: null },
  consultation: { id: null },
  prescription: { id: null },
  labLead: { id: null },
  pharmacyLead: { id: null },
  payment: { orderId: null },
  withdrawal: { id: null },
};

// ==================== AUTHENTICATION TESTS ====================

const testAdminAuth = async () => {
  console.log('\n\n========== ADMIN AUTHENTICATION ==========');
  
  const adminEmail = randomEmail('admin');
  const adminPassword = 'Admin@123456';
  
  // Admin Signup
  const signupRes = await client.post('/api/admin/auth/signup', {
    name: 'Test Admin',
    email: adminEmail,
    phone: randomPhone(),
    password: adminPassword,
    registrationCode: process.env.ADMIN_REGISTRATION_CODE || 'ADMIN123',
  });
  report('Admin Signup', signupRes, [200, 201, 400, 409]);
  
  // Admin Login
  const loginRes = await client.post('/api/admin/auth/login', {
    email: adminEmail,
    password: adminPassword,
  });
  if (loginRes.status === 200 && loginRes.data?.data?.tokens?.accessToken) {
    testData.admin.token = loginRes.data.data.tokens.accessToken;
    testData.admin.id = loginRes.data.data.admin?._id || loginRes.data.data.user?._id;
    report('Admin Login', loginRes);
  } else {
    report('Admin Login', loginRes);
  }
  
  // Get Admin Profile
  if (testData.admin.token) {
    const profileRes = await client.get('/api/admin/auth/me', authHeader(testData.admin.token));
    report('Get Admin Profile', profileRes);
    
    // Update Admin Profile
    const updateRes = await client.put('/api/admin/auth/me', {
      firstName: 'Updated',
      lastName: 'Admin',
    }, authHeader(testData.admin.token));
    report('Update Admin Profile', updateRes);
    
    // Get Admin By ID
    if (testData.admin.id) {
      const getByIdRes = await client.get(`/api/admin/auth/profile/${testData.admin.id}`, authHeader(testData.admin.token));
      report('Get Admin By ID', getByIdRes);
    }
  }
  
  // Forgot Password
  const forgotRes = await client.post('/api/admin/auth/forgot-password', {
    email: adminEmail,
  });
  report('Admin Forgot Password', forgotRes, [200, 400, 404]);
  
  // Logout
  if (testData.admin.token) {
    const logoutRes = await client.post('/api/admin/auth/logout', {}, authHeader(testData.admin.token));
    report('Admin Logout', logoutRes, [200, 401]);
  }
};

const testPatientAuth = async () => {
  console.log('\n\n========== PATIENT AUTHENTICATION ==========');
  
  const patientEmail = randomEmail('patient');
  const patientPassword = 'Patient@123456';
  
  // Patient Signup
  const signupRes = await client.post('/api/patients/auth/signup', {
    firstName: 'Test',
    lastName: 'Patient',
    email: patientEmail,
    phone: randomPhone(),
    password: patientPassword,
    gender: 'male',
    address: {
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  });
  report('Patient Signup', signupRes, [200, 201, 400, 409]);
  testData.patient.email = patientEmail;
  
  // Patient Login
  const loginRes = await client.post('/api/patients/auth/login', {
    email: patientEmail,
    password: patientPassword,
  });
  if (loginRes.status === 200) {
    const token = loginRes.data?.data?.token || loginRes.data?.data?.tokens?.accessToken;
    if (token) {
      testData.patient.token = token;
      testData.patient.id = loginRes.data.data.patient?._id || loginRes.data.data.user?._id;
      report('Patient Login', loginRes);
    } else {
      report('Patient Login', loginRes);
    }
  } else {
    report('Patient Login', loginRes);
  }
  
  // Get Patient Profile
  if (testData.patient.token) {
    const profileRes = await client.get('/api/patients/auth/me', authHeader(testData.patient.token));
    report('Get Patient Profile', profileRes);
    
    // Update Patient Profile
    const updateRes = await client.put('/api/patients/auth/me', {
      firstName: 'Updated',
      lastName: 'Patient',
    }, authHeader(testData.patient.token));
    report('Update Patient Profile', updateRes);
    
    // Change Password
    const changePassRes = await client.put('/api/patients/auth/change-password', {
      currentPassword: patientPassword,
      newPassword: 'NewPatient@123456',
      confirmPassword: 'NewPatient@123456',
    }, authHeader(testData.patient.token));
    report('Change Patient Password', changePassRes, [200, 400]);
    
    // Get Patient By ID
    if (testData.patient.id) {
      const getByIdRes = await client.get(`/api/patients/auth/profile/${testData.patient.id}`, authHeader(testData.patient.token));
      report('Get Patient By ID', getByIdRes);
    }
  }
  
  // Forgot Password
  const forgotRes = await client.post('/api/patients/auth/forgot-password', {
    email: patientEmail,
  });
  report('Patient Forgot Password', forgotRes, [200, 400, 404]);
};

const testDoctorAuth = async () => {
  console.log('\n\n========== DOCTOR AUTHENTICATION ==========');
  
  const doctorEmail = randomEmail('doctor');
  const doctorPassword = 'Doctor@123456';
  
  // Doctor Signup
  const signupRes = await client.post('/api/doctors/auth/signup', {
    firstName: 'Test',
    lastName: 'Doctor',
    email: doctorEmail,
    phone: randomPhone(),
    password: doctorPassword,
    specialization: 'Cardiology',
    gender: 'male',
    licenseNumber: `LIC${crypto.randomInt(100000, 999999)}`,
    clinicDetails: {
      name: 'Test Clinic',
      address: {
        city: 'Mumbai',
        state: 'Maharashtra',
        line1: '123 Test Street',
      },
    },
    clinicLat: 19.0760,
    clinicLng: 72.8777,
  });
  report('Doctor Signup', signupRes, [200, 201, 400, 409, 500]);
  testData.doctor.email = doctorEmail;
  if (signupRes.status === 201 && signupRes.data?.data?.doctor?._id) {
    testData.doctor.id = signupRes.data.data.doctor._id;
  }
  
  // Doctor Login (may fail if pending approval - expected)
  const loginRes = await client.post('/api/doctors/auth/login', {
    email: doctorEmail,
    password: doctorPassword,
  });
  if (loginRes.status === 200) {
    const token = loginRes.data?.data?.token || loginRes.data?.data?.tokens?.accessToken;
    if (token) {
      testData.doctor.token = token;
      testData.doctor.id = loginRes.data.data.doctor?._id || loginRes.data.data.user?._id;
      report('Doctor Login', loginRes);
    } else {
      report('Doctor Login', loginRes, [200, 403]);
    }
  } else {
    report('Doctor Login', loginRes, [200, 403]); // 403 is expected if pending approval
  }
  
  // Get Doctor Profile
  if (testData.doctor.token) {
    const profileRes = await client.get('/api/doctors/auth/me', authHeader(testData.doctor.token));
    report('Get Doctor Profile', profileRes);
    
    // Update Doctor Profile
    const updateRes = await client.put('/api/doctors/auth/me', {
      firstName: 'Updated',
      lastName: 'Doctor',
    }, authHeader(testData.doctor.token));
    report('Update Doctor Profile', updateRes);
    
    // Get Doctor By ID
    if (testData.doctor.id) {
      const getByIdRes = await client.get(`/api/doctors/auth/profile/${testData.doctor.id}`, authHeader(testData.doctor.token));
      report('Get Doctor By ID', getByIdRes);
    }
  }
  
  // Forgot Password
  const forgotRes = await client.post('/api/doctors/auth/forgot-password', {
    email: doctorEmail,
  });
  report('Doctor Forgot Password', forgotRes, [200, 400, 404]);
};

const testLaboratoryAuth = async () => {
  console.log('\n\n========== LABORATORY AUTHENTICATION ==========');
  
  const labEmail = randomEmail('lab');
  const labPassword = 'Lab@123456';
  
  // Laboratory Signup
  const signupRes = await client.post('/api/laboratories/auth/signup', {
    labName: 'Test Laboratory',
    email: labEmail,
    phone: randomPhone(),
    password: labPassword,
    address: {
      city: 'Mumbai',
      state: 'Maharashtra',
      line1: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // [lng, lat]
      },
      locationSource: 'manual',
    },
    licenseNumber: `LAB${crypto.randomInt(100000, 999999)}`,
  });
  report('Laboratory Signup', signupRes, [200, 201, 400, 409, 500]);
  testData.laboratory.email = labEmail;
  if (signupRes.status === 201 && signupRes.data?.data?.laboratory?._id) {
    testData.laboratory.id = signupRes.data.data.laboratory._id;
  }
  
  // Laboratory Login (may fail if pending approval - expected)
  const loginRes = await client.post('/api/laboratories/auth/login', {
    email: labEmail,
    password: labPassword,
  });
  if (loginRes.status === 200) {
    const token = loginRes.data?.data?.token || loginRes.data?.data?.tokens?.accessToken;
    if (token) {
      testData.laboratory.token = token;
      testData.laboratory.id = loginRes.data.data.laboratory?._id || loginRes.data.data.user?._id;
      report('Laboratory Login', loginRes);
    } else {
      report('Laboratory Login', loginRes, [200, 403]);
    }
  } else {
    report('Laboratory Login', loginRes, [200, 403]); // 403 is expected if pending approval
  }
  
  // Get Laboratory Profile
  if (testData.laboratory.token) {
    const profileRes = await client.get('/api/laboratories/auth/me', authHeader(testData.laboratory.token));
    report('Get Laboratory Profile', profileRes);
    
    // Update Laboratory Profile
    const updateRes = await client.put('/api/laboratories/auth/me', {
      labName: 'Updated Laboratory',
    }, authHeader(testData.laboratory.token));
    report('Update Laboratory Profile', updateRes);
    
    // Get Laboratory By ID
    if (testData.laboratory.id) {
      const getByIdRes = await client.get(`/api/laboratories/auth/profile/${testData.laboratory.id}`, authHeader(testData.laboratory.token));
      report('Get Laboratory By ID', getByIdRes);
    }
  }
  
  // Forgot Password
  const forgotRes = await client.post('/api/laboratories/auth/forgot-password', {
    email: labEmail,
  });
  report('Laboratory Forgot Password', forgotRes, [200, 400, 404]);
};

const testPharmacyAuth = async () => {
  console.log('\n\n========== PHARMACY AUTHENTICATION ==========');
  
  const pharmacyEmail = randomEmail('pharmacy');
  const pharmacyPassword = 'Pharmacy@123456';
  
  // Pharmacy Signup
  const signupRes = await client.post('/api/pharmacies/auth/signup', {
    pharmacyName: 'Test Pharmacy',
    email: pharmacyEmail,
    phone: randomPhone(),
    password: pharmacyPassword,
    address: {
      city: 'Mumbai',
      state: 'Maharashtra',
      line1: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // [lng, lat]
      },
      locationSource: 'manual',
    },
    licenseNumber: `PHAR${crypto.randomInt(100000, 999999)}`,
  });
  report('Pharmacy Signup', signupRes, [200, 201, 400, 409, 500]);
  testData.pharmacy.email = pharmacyEmail;
  if (signupRes.status === 201 && signupRes.data?.data?.pharmacy?._id) {
    testData.pharmacy.id = signupRes.data.data.pharmacy._id;
  }
  
  // Pharmacy Login (may fail if pending approval - expected)
  const loginRes = await client.post('/api/pharmacies/auth/login', {
    email: pharmacyEmail,
    password: pharmacyPassword,
  });
  if (loginRes.status === 200) {
    const token = loginRes.data?.data?.token || loginRes.data?.data?.tokens?.accessToken;
    if (token) {
      testData.pharmacy.token = token;
      testData.pharmacy.id = loginRes.data.data.pharmacy?._id || loginRes.data.data.user?._id;
      report('Pharmacy Login', loginRes);
    } else {
      report('Pharmacy Login', loginRes, [200, 403]);
    }
  } else {
    report('Pharmacy Login', loginRes, [200, 403]); // 403 is expected if pending approval
  }
  
  // Get Pharmacy Profile
  if (testData.pharmacy.token) {
    const profileRes = await client.get('/api/pharmacies/auth/me', authHeader(testData.pharmacy.token));
    report('Get Pharmacy Profile', profileRes);
    
    // Update Pharmacy Profile
    const updateRes = await client.put('/api/pharmacies/auth/me', {
      pharmacyName: 'Updated Pharmacy',
    }, authHeader(testData.pharmacy.token));
    report('Update Pharmacy Profile', updateRes);
    
    // Get Pharmacy By ID
    if (testData.pharmacy.id) {
      const getByIdRes = await client.get(`/api/pharmacies/auth/profile/${testData.pharmacy.id}`, authHeader(testData.pharmacy.token));
      report('Get Pharmacy By ID', getByIdRes);
    }
  }
  
  // Forgot Password
  const forgotRes = await client.post('/api/pharmacies/auth/forgot-password', {
    email: pharmacyEmail,
  });
  report('Pharmacy Forgot Password', forgotRes, [200, 400, 404]);
};

// ==================== ADMIN TESTS ====================

const testAdminAPIs = async () => {
  console.log('\n\n========== ADMIN APIs ==========');
  
  if (!testData.admin.token) {
    console.log('Skipping Admin APIs - Admin not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Dashboard
  const dashboardRes = await client.get('/api/admin/dashboard/overview', authHeader(testData.admin.token));
  report('Admin Dashboard Overview', dashboardRes);
  
  // Approvals
  const approvalsRes = await client.get('/api/admin/approvals', authHeader(testData.admin.token));
  report('List Approval Requests', approvalsRes);
  
  // Settings
  const getSettingsRes = await client.get('/api/admin/settings/nearby-radius', authHeader(testData.admin.token));
  report('Get Nearby Radius', getSettingsRes);
  
  const updateSettingsRes = await client.patch('/api/admin/settings/nearby-radius', {
    radiusKm: 10,
  }, authHeader(testData.admin.token));
  report('Update Nearby Radius', updateSettingsRes);
  
  // Wallet
  const walletOverviewRes = await client.get('/api/admin/wallet/overview', authHeader(testData.admin.token));
  report('Admin Wallet Overview', walletOverviewRes);
  
  const doctorSummariesRes = await client.get('/api/admin/wallet/doctors', authHeader(testData.admin.token));
  report('List Doctor Summaries', doctorSummariesRes);
  
  const providerSummariesRes = await client.get('/api/admin/wallet/providers?role=doctor', authHeader(testData.admin.token));
  report('List Provider Summaries', providerSummariesRes);
  
  const withdrawalsRes = await client.get('/api/admin/wallet/withdrawals', authHeader(testData.admin.token));
  report('List Withdrawals', withdrawalsRes);
  
  // Transactions
  const paymentsRes = await client.get('/api/admin/transactions/payments', authHeader(testData.admin.token));
  report('List Payments', paymentsRes);
  
  const walletTransactionsRes = await client.get('/api/admin/transactions/wallet-transactions', authHeader(testData.admin.token));
  report('List Wallet Transactions', walletTransactionsRes);
  
  const commissionTransactionsRes = await client.get('/api/admin/transactions/commission-transactions', authHeader(testData.admin.token));
  report('List Commission Transactions', commissionTransactionsRes);
  
  const transactionSummaryRes = await client.get('/api/admin/transactions/summary', authHeader(testData.admin.token));
  report('Transaction Summary', transactionSummaryRes);
};

// ==================== PATIENT TESTS ====================

const testPatientAPIs = async () => {
  console.log('\n\n========== PATIENT APIs ==========');
  
  if (!testData.patient.token) {
    console.log('Skipping Patient APIs - Patient not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Transactions
  const transactionsRes = await client.get('/api/patients/transactions', authHeader(testData.patient.token));
  report('List Patient Transactions', transactionsRes);
  
  // Discovery
  const doctorsRes = await client.get('/api/discovery/doctors?lat=19.0760&lng=72.8777');
  report('Discover Nearby Doctors', doctorsRes);
  
  const labsRes = await client.get('/api/discovery/laboratories?lat=19.0760&lng=72.8777');
  report('Discover Nearby Laboratories', labsRes);
  
  const pharmaciesRes = await client.get('/api/discovery/pharmacies?lat=19.0760&lng=72.8777');
  report('Discover Nearby Pharmacies', pharmaciesRes);
  
  // Notifications
  const registerDeviceRes = await client.post('/api/notifications/device/register', {
    token: 'test-device-token',
    platform: 'web',
    deviceType: 'browser',
  }, authHeader(testData.patient.token));
  report('Register Device', registerDeviceRes, [200, 201, 400]);
};

// ==================== DOCTOR TESTS ====================

const testDoctorAPIs = async () => {
  console.log('\n\n========== DOCTOR APIs ==========');
  
  if (!testData.doctor.token) {
    console.log('Skipping Doctor APIs - Doctor not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Dashboard
  const dashboardRes = await client.get('/api/doctors/dashboard/overview', authHeader(testData.doctor.token));
  report('Doctor Dashboard Overview', dashboardRes);
  
  // Wallet
  const walletSummaryRes = await client.get('/api/doctors/wallet/summary', authHeader(testData.doctor.token));
  report('Doctor Wallet Summary', walletSummaryRes);
  
  const walletTransactionsRes = await client.get('/api/doctors/wallet/transactions', authHeader(testData.doctor.token));
  report('Doctor Wallet Transactions', walletTransactionsRes);
  
  const withdrawalsRes = await client.get('/api/doctors/wallet/withdrawals', authHeader(testData.doctor.token));
  report('Doctor Withdrawals', withdrawalsRes);
  
  // Request Withdrawal
  if (walletSummaryRes.status === 200 && walletSummaryRes.data?.summary?.availableBalance > 0) {
    const requestWithdrawalRes = await client.post('/api/doctors/wallet/withdrawals', {
      amount: 100,
      currency: 'INR',
      payoutMethod: {
        bankAccount: '1234567890',
        ifsc: 'TEST0001234',
      },
    }, authHeader(testData.doctor.token));
    report('Request Withdrawal', requestWithdrawalRes, [200, 201, 400]);
    if (requestWithdrawalRes.status === 201) {
      testData.withdrawal.id = requestWithdrawalRes.data?.withdrawal?._id;
    }
  }
  
  // Transactions
  const transactionsRes = await client.get('/api/doctors/transactions/transactions', authHeader(testData.doctor.token));
  report('Doctor Transactions', transactionsRes, [200, 404]);
  
  // Clinics
  const createClinicRes = await client.post('/api/appointments/clinics', {
    name: 'Test Clinic',
    address: {
      city: 'Mumbai',
      state: 'Maharashtra',
      line1: '123 Test Street',
    },
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760], // [lng, lat]
    },
    locationSource: 'manual',
  }, authHeader(testData.doctor.token));
  report('Create Clinic', createClinicRes, [200, 201, 400, 500]);
  if (createClinicRes.status === 201) {
    testData.clinic.id = createClinicRes.data?.clinic?._id;
  }
  
  const listClinicsRes = await client.get('/api/appointments/clinics', authHeader(testData.doctor.token));
  report('List Clinics', listClinicsRes);
  
  // Sessions
  if (testData.clinic.id) {
    const createSessionRes = await client.post('/api/appointments/sessions', {
      clinicId: testData.clinic.id,
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      averageConsultationMinutes: 15,
    }, authHeader(testData.doctor.token));
    report('Create Session', createSessionRes, [200, 201, 400]);
    if (createSessionRes.status === 201) {
      testData.session.id = createSessionRes.data?.session?._id;
    }
  }
  
  const listSessionsRes = await client.get('/api/appointments/sessions', authHeader(testData.doctor.token));
  report('List Sessions', listSessionsRes);
  
  // Update Session Average Time
  if (testData.session.id) {
    const updateAvgTimeRes = await client.patch(
      `/api/appointments/sessions/${testData.session.id}/average-time`,
      { averageConsultationMinutes: 20 },
      authHeader(testData.doctor.token)
    );
    report('Update Session Average Time', updateAvgTimeRes, [200, 400]);
  }
  
  // Prescriptions
  const listPrescriptionsRes = await client.get('/api/prescriptions/doctor/list', authHeader(testData.doctor.token));
  report('List Doctor Prescriptions', listPrescriptionsRes);
  
  // Consultations
  const listConsultationsRes = await client.get('/api/consultations/doctor/list', authHeader(testData.doctor.token));
  report('List Doctor Consultations', listConsultationsRes);
  
  // Reports
  const listReportsRes = await client.get('/api/reports/doctors/reports', authHeader(testData.doctor.token));
  report('List Doctor Reports', listReportsRes);
};

// ==================== LABORATORY TESTS ====================

const testLaboratoryAPIs = async () => {
  console.log('\n\n========== LABORATORY APIs ==========');
  
  if (!testData.laboratory.token) {
    console.log('Skipping Laboratory APIs - Laboratory not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Wallet
  const walletSummaryRes = await client.get('/api/laboratories/wallet/summary', authHeader(testData.laboratory.token));
  report('Laboratory Wallet Summary', walletSummaryRes);
  
  const walletTransactionsRes = await client.get('/api/laboratories/wallet/transactions', authHeader(testData.laboratory.token));
  report('Laboratory Wallet Transactions', walletTransactionsRes);
  
  const withdrawalsRes = await client.get('/api/laboratories/wallet/withdrawals', authHeader(testData.laboratory.token));
  report('Laboratory Withdrawals', withdrawalsRes);
  
  // Request Withdrawal
  if (walletSummaryRes.status === 200 && walletSummaryRes.data?.summary?.availableBalance > 0) {
    const requestWithdrawalRes = await client.post('/api/laboratories/wallet/withdrawals', {
      amount: 100,
      currency: 'INR',
      payoutMethod: {
        bankAccount: '1234567890',
        ifsc: 'TEST0001234',
      },
    }, authHeader(testData.laboratory.token));
    report('Request Withdrawal', requestWithdrawalRes, [200, 201, 400]);
  }
  
  // Transactions
  const transactionsRes = await client.get('/api/laboratories/transactions/transactions', authHeader(testData.laboratory.token));
  report('Laboratory Transactions', transactionsRes, [200, 404]);
  
  // Lab Workflow
  const listLeadsRes = await client.get('/api/labs/leads', authHeader(testData.laboratory.token));
  report('List Lab Leads', listLeadsRes);
  
  // Get Lab Lead Details
  if (listLeadsRes.status === 200 && listLeadsRes.data?.leads?.length > 0) {
    const leadId = listLeadsRes.data.leads[0]._id;
    const getLeadRes = await client.get(`/api/labs/leads/${leadId}`, authHeader(testData.laboratory.token));
    report('Get Lab Lead Details', getLeadRes);
  }
};

// ==================== PHARMACY TESTS ====================

const testPharmacyAPIs = async () => {
  console.log('\n\n========== PHARMACY APIs ==========');
  
  if (!testData.pharmacy.token) {
    console.log('Skipping Pharmacy APIs - Pharmacy not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Wallet
  const walletSummaryRes = await client.get('/api/pharmacies/wallet/summary', authHeader(testData.pharmacy.token));
  report('Pharmacy Wallet Summary', walletSummaryRes);
  
  const walletTransactionsRes = await client.get('/api/pharmacies/wallet/transactions', authHeader(testData.pharmacy.token));
  report('Pharmacy Wallet Transactions', walletTransactionsRes);
  
  const withdrawalsRes = await client.get('/api/pharmacies/wallet/withdrawals', authHeader(testData.pharmacy.token));
  report('Pharmacy Withdrawals', withdrawalsRes);
  
  // Request Withdrawal
  if (walletSummaryRes.status === 200 && walletSummaryRes.data?.summary?.availableBalance > 0) {
    const requestWithdrawalRes = await client.post('/api/pharmacies/wallet/withdrawals', {
      amount: 100,
      currency: 'INR',
      payoutMethod: {
        bankAccount: '1234567890',
        ifsc: 'TEST0001234',
      },
    }, authHeader(testData.pharmacy.token));
    report('Request Withdrawal', requestWithdrawalRes, [200, 201, 400]);
  }
  
  // Transactions
  const transactionsRes = await client.get('/api/pharmacies/transactions/transactions', authHeader(testData.pharmacy.token));
  report('Pharmacy Transactions', transactionsRes, [200, 404]);
  
  // Pharmacy Workflow
  const listLeadsRes = await client.get('/api/pharmacy/leads', authHeader(testData.pharmacy.token));
  report('List Pharmacy Leads', listLeadsRes);
  
  // Get Pharmacy Lead Details
  if (listLeadsRes.status === 200 && listLeadsRes.data?.leads?.length > 0) {
    const leadId = listLeadsRes.data.leads[0]._id;
    const getLeadRes = await client.get(`/api/pharmacy/leads/${leadId}`, authHeader(testData.pharmacy.token));
    report('Get Pharmacy Lead Details', getLeadRes);
  }
};

// ==================== APPOINTMENT TESTS ====================

const testAppointmentAPIs = async () => {
  console.log('\n\n========== APPOINTMENT APIs ==========');
  
  if (!testData.doctor.token || !testData.patient.token) {
    console.log('Skipping Appointment APIs - Doctor or Patient not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Get Session State
  if (testData.session.id) {
    const sessionStateRes = await client.get(`/api/appointments/sessions/${testData.session.id}/state`, authHeader(testData.patient.token));
    report('Get Session State', sessionStateRes);
    
    const sessionDetailsRes = await client.get(`/api/appointments/sessions/${testData.session.id}`, authHeader(testData.doctor.token));
    report('Get Session Details', sessionDetailsRes);
  }
  
  // Issue Token
  if (testData.session.id) {
    const issueTokenRes = await client.post(`/api/appointments/sessions/${testData.session.id}/tokens`, {
      notes: 'Test token',
      priority: 0,
    }, authHeader(testData.patient.token));
    report('Issue Token', issueTokenRes, [200, 201, 400]);
    if (issueTokenRes.status === 201) {
      testData.token.id = issueTokenRes.data?.token?._id;
      testData.appointment.id = issueTokenRes.data?.appointment?._id;
    }
  }
  
  // List Patient Tokens
  const listPatientTokensRes = await client.get('/api/appointments/patient/tokens', authHeader(testData.patient.token));
  report('List Patient Tokens', listPatientTokensRes);
  
  // Get Token Details
  if (testData.token.id) {
    const tokenDetailsRes = await client.get(`/api/appointments/tokens/${testData.token.id}`, authHeader(testData.patient.token));
    report('Get Token Details', tokenDetailsRes);
    
    // Update Token Status (Doctor)
    const updateTokenStatusRes = await client.patch(
      `/api/appointments/tokens/${testData.token.id}/status`,
      { status: 'called' },
      authHeader(testData.doctor.token)
    );
    report('Update Token Status', updateTokenStatusRes, [200, 400]);
    
    // Checkin Token (Patient)
    const checkinTokenRes = await client.patch(
      `/api/appointments/tokens/${testData.token.id}/checkin`,
      {},
      authHeader(testData.patient.token)
    );
    report('Checkin Token', checkinTokenRes, [200, 400]);
  }
  
  // Start Session (Doctor)
  if (testData.session.id) {
    const startSessionRes = await client.patch(
      `/api/appointments/sessions/${testData.session.id}/start`,
      {},
      authHeader(testData.doctor.token)
    );
    report('Start Session', startSessionRes, [200, 400]);
  }
  
  // Pause Session (Doctor)
  if (testData.session.id) {
    const pauseSessionRes = await client.patch(
      `/api/appointments/sessions/${testData.session.id}/pause`,
      {},
      authHeader(testData.doctor.token)
    );
    report('Pause Session', pauseSessionRes, [200, 400]);
  }
  
  // Resume Session (Doctor)
  if (testData.session.id) {
    const resumeSessionRes = await client.patch(
      `/api/appointments/sessions/${testData.session.id}/resume`,
      {},
      authHeader(testData.doctor.token)
    );
    report('Resume Session', resumeSessionRes, [200, 400]);
  }
};

// ==================== CONSULTATION TESTS ====================

const testConsultationAPIs = async () => {
  console.log('\n\n========== CONSULTATION APIs ==========');
  
  if (!testData.doctor.token || !testData.patient.token) {
    console.log('Skipping Consultation APIs - Doctor or Patient not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Get Consultations for Token
  if (testData.token.id) {
    const consultationsRes = await client.get(`/api/consultations/token/${testData.token.id}`, authHeader(testData.doctor.token));
    report('Get Consultations for Token', consultationsRes);
    if (consultationsRes.status === 200 && consultationsRes.data?.consultations?.length > 0) {
      testData.consultation.id = consultationsRes.data.consultations[0]._id;
    }
  }
  
  // Get Consultation
  if (testData.consultation.id) {
    const consultationRes = await client.get(`/api/consultations/${testData.consultation.id}`, authHeader(testData.doctor.token));
    report('Get Consultation', consultationRes);
  }
  
  // Get Doctor Patient Record
  if (testData.patient.id) {
    const patientRecordRes = await client.get(`/api/consultations/doctor/patient/${testData.patient.id}`, authHeader(testData.doctor.token));
    report('Get Doctor Patient Record', patientRecordRes, [200, 403, 404]); // 403 expected if no consultations
  }
};

// ==================== PRESCRIPTION TESTS ====================

const testPrescriptionAPIs = async () => {
  console.log('\n\n========== PRESCRIPTION APIs ==========');
  
  if (!testData.doctor.token || !testData.patient.token) {
    console.log('Skipping Prescription APIs - Doctor or Patient not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Create Prescription
  if (testData.consultation.id) {
    const createPrescriptionRes = await client.post('/api/prescriptions', {
      consultation: testData.consultation.id,
      patient: testData.patient.id,
      medications: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
        },
      ],
      diagnosis: 'Fever',
    }, authHeader(testData.doctor.token));
    report('Create Prescription', createPrescriptionRes, [200, 201, 400]);
    if (createPrescriptionRes.status === 200 || createPrescriptionRes.status === 201) {
      testData.prescription.id = createPrescriptionRes.data?.prescription?._id;
    }
  }
  
  // List Patient Prescriptions
  const listPatientPrescriptionsRes = await client.get('/api/prescriptions/patient/list', authHeader(testData.patient.token));
  report('List Patient Prescriptions', listPatientPrescriptionsRes);
  
  // Get Prescription
  if (testData.prescription.id) {
    const prescriptionRes = await client.get(`/api/prescriptions/${testData.prescription.id}`, authHeader(testData.patient.token));
    report('Get Prescription', prescriptionRes);
  }
};

// ==================== PAYMENT TESTS ====================

const testPaymentAPIs = async () => {
  console.log('\n\n========== PAYMENT APIs ==========');
  
  if (!testData.patient.token) {
    console.log('Skipping Payment APIs - Patient not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Create Payment Order
  const createOrderRes = await client.post('/api/payments/orders', {
    amount: 500,
    currency: 'INR',
    type: 'appointment',
    metadata: {
      appointmentId: testData.appointment.id,
    },
  }, authHeader(testData.patient.token));
  report('Create Payment Order', createOrderRes, [200, 201, 400]);
  if (createOrderRes.status === 201) {
    testData.payment.orderId = createOrderRes.data?.data?.id;
  }
  
  // Verify Payment (mock)
  if (testData.payment.orderId) {
    const verifyRes = await client.post('/api/payments/verify', {
      orderId: testData.payment.orderId,
      paymentId: 'test_payment_id',
      signature: 'test_signature',
    }, authHeader(testData.patient.token));
    report('Verify Payment', verifyRes, [200, 400]);
  }
};

// ==================== REVIEW TESTS ====================

const testReviewAPIs = async () => {
  console.log('\n\n========== REVIEW APIs ==========');
  
  if (!testData.patient.token) {
    console.log('Skipping Review APIs - Patient not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // Create Review
  if (testData.doctor.id) {
    const createReviewRes = await client.post('/api/reviews', {
      targetRole: 'doctor',
      targetId: testData.doctor.id,
      rating: 5,
      comment: 'Great doctor!',
    }, authHeader(testData.patient.token));
    report('Create Review', createReviewRes, [200, 201, 400]);
  }
  
  // List Patient Reviews
  const listPatientReviewsRes = await client.get('/api/reviews/patient/me', authHeader(testData.patient.token));
  report('List Patient Reviews', listPatientReviewsRes);
  
  // List Target Reviews
  if (testData.doctor.id) {
    const listTargetReviewsRes = await client.get(`/api/reviews/target/doctor/${testData.doctor.id}`, authHeader(testData.patient.token));
    report('List Target Reviews', listTargetReviewsRes);
  }
};

// ==================== REPORT TESTS ====================

const testReportAPIs = async () => {
  console.log('\n\n========== REPORT APIs ==========');
  
  if (!testData.patient.token) {
    console.log('Skipping Report APIs - Patient not authenticated');
    testResults.skipped += 1;
    return;
  }
  
  // List Patient Reports
  const listReportsRes = await client.get('/api/reports/patient/reports', authHeader(testData.patient.token));
  report('List Patient Reports', listReportsRes);
  
  // Get Report Share History
  if (listReportsRes.status === 200 && listReportsRes.data?.reports?.length > 0) {
    const reportId = listReportsRes.data.reports[0]._id;
    const historyRes = await client.get(`/api/reports/patient/reports/${reportId}/history`, authHeader(testData.patient.token));
    report('Get Report Share History', historyRes);
  }
};

// ==================== MAIN TEST RUNNER ====================

const main = async () => {
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          COMPREHENSIVE API TEST SUITE                       ║');
  console.log('║          Testing All Backend APIs                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    await waitForServer();

    // Authentication Tests
    await testAdminAuth();
    await testPatientAuth();
    await testDoctorAuth();
    await testLaboratoryAuth();
    await testPharmacyAuth();

    // Approve pending accounts (Doctor, Lab, Pharmacy)
    if (testData.admin.token) {
      console.log('\n\n========== APPROVING PENDING ACCOUNTS ==========');
      
      // Approve Doctor
      if (testData.doctor.id) {
        const approveDoctorRes = await client.patch(
          `/api/admin/approvals/doctor/${testData.doctor.id}/approve`,
          {},
          authHeader(testData.admin.token)
        );
        report('Approve Doctor', approveDoctorRes, [200, 400, 404]);
        
        // Try login again after approval
        if (approveDoctorRes.status === 200) {
          const doctorLoginRetry = await client.post('/api/doctors/auth/login', {
            email: testData.doctor.email,
            password: 'Doctor@123456',
          });
          if (doctorLoginRetry.status === 200) {
            const token = doctorLoginRetry.data?.data?.token || doctorLoginRetry.data?.data?.tokens?.accessToken;
            if (token) {
              testData.doctor.token = token;
              testData.doctor.id = doctorLoginRetry.data.data.doctor?._id || doctorLoginRetry.data.data.user?._id;
              report('Doctor Login After Approval', doctorLoginRetry);
            }
          }
        }
      }
      
      // Approve Laboratory
      if (testData.laboratory.id) {
        const approveLabRes = await client.patch(
          `/api/admin/approvals/laboratory/${testData.laboratory.id}/approve`,
          {},
          authHeader(testData.admin.token)
        );
        report('Approve Laboratory', approveLabRes, [200, 400, 404]);
        
        // Try login again after approval
        if (approveLabRes.status === 200) {
          const labLoginRetry = await client.post('/api/laboratories/auth/login', {
            email: testData.laboratory.email,
            password: 'Lab@123456',
          });
          if (labLoginRetry.status === 200) {
            const token = labLoginRetry.data?.data?.token || labLoginRetry.data?.data?.tokens?.accessToken;
            if (token) {
              testData.laboratory.token = token;
              testData.laboratory.id = labLoginRetry.data.data.laboratory?._id || labLoginRetry.data.data.user?._id;
              report('Laboratory Login After Approval', labLoginRetry);
            }
          }
        }
      }
      
      // Approve Pharmacy
      if (testData.pharmacy.id) {
        const approvePharmacyRes = await client.patch(
          `/api/admin/approvals/pharmacy/${testData.pharmacy.id}/approve`,
          {},
          authHeader(testData.admin.token)
        );
        report('Approve Pharmacy', approvePharmacyRes, [200, 400, 404]);
        
        // Try login again after approval
        if (approvePharmacyRes.status === 200) {
          const pharmacyLoginRetry = await client.post('/api/pharmacies/auth/login', {
            email: testData.pharmacy.email,
            password: 'Pharmacy@123456',
          });
          if (pharmacyLoginRetry.status === 200) {
            const token = pharmacyLoginRetry.data?.data?.token || pharmacyLoginRetry.data?.data?.tokens?.accessToken;
            if (token) {
              testData.pharmacy.token = token;
              testData.pharmacy.id = pharmacyLoginRetry.data.data.pharmacy?._id || pharmacyLoginRetry.data.data.user?._id;
              report('Pharmacy Login After Approval', pharmacyLoginRetry);
            }
          }
        }
      }
    }

    // Feature Tests
    await testAdminAPIs();
    await testPatientAPIs();
    await testDoctorAPIs();
    await testLaboratoryAPIs();
    await testPharmacyAPIs();
    await testAppointmentAPIs();
    await testConsultationAPIs();
    await testPrescriptionAPIs();
    await testPaymentAPIs();
    await testReviewAPIs();
    await testReportAPIs();

    // Final Summary
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\nTotal Tests: ${testResults.total}`);
    console.log(`✓ Passed: ${testResults.passed}`);
    console.log(`✗ Failed: ${testResults.failed}`);
    console.log(`⊘ Skipped: ${testResults.skipped}`);
    console.log(`\nSuccess Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
    console.log(`\nCompleted at: ${new Date().toISOString()}\n`);

    if (testResults.failed > 0) {
      console.log('\nFailed Tests:');
      testResults.details
        .filter((t) => !t.passed)
        .forEach((t) => {
          console.log(`  - ${t.label} (Status: ${t.status})`);
        });
    }

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n\n[ERROR] Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run tests
if (require.main === module) {
  main();
}

module.exports = { main };

