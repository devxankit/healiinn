/**
 * Integration script to exercise discovery + prescription sharing flows.
 *
 * Usage:
 *   node scripts/testDiscoveryAndPrescription.js
 *
 * Required env:
 *   API_BASE_URL                (default http://localhost:5000)
 *
 * Optional env for discovery:
 *   TEST_LAT                    (default 28.6139)
 *   TEST_LNG                    (default 77.2090)
 *   TEST_RADIUS_KM              (optional)
 *
 * Optional env for auth flows:
 *   PATIENT_EMAIL
 *   PATIENT_PASSWORD
 *   DOCTOR_EMAIL
 *   DOCTOR_PASSWORD
 *
 * Optional env for detailed prescription tests:
 *   PRESCRIPTION_ID
 *   SHARE_LAB_IDS               (comma separated Mongo IDs)
 *   SHARE_PHARMACY_IDS          (comma separated Mongo IDs)
 */

/* eslint-disable no-console */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

const LAT = Number(process.env.TEST_LAT ?? 28.6139);
const LNG = Number(process.env.TEST_LNG ?? 77.209);
const RADIUS_KM = process.env.TEST_RADIUS_KM
  ? Number(process.env.TEST_RADIUS_KM)
  : undefined;

const PATIENT_EMAIL = process.env.PATIENT_EMAIL;
const PATIENT_PASSWORD = process.env.PATIENT_PASSWORD;
const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL;
const DOCTOR_PASSWORD = process.env.DOCTOR_PASSWORD;

const PRESCRIPTION_ID = process.env.PRESCRIPTION_ID;
const SHARE_LAB_IDS = process.env.SHARE_LAB_IDS
  ? process.env.SHARE_LAB_IDS.split(',').map((value) => value.trim()).filter(Boolean)
  : [];
const SHARE_PHARMACY_IDS = process.env.SHARE_PHARMACY_IDS
  ? process.env.SHARE_PHARMACY_IDS.split(',').map((value) => value.trim()).filter(Boolean)
  : [];

const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
});

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prettyJson = (payload) => JSON.stringify(payload, null, 2);

const login = async ({ role, email, password }) => {
  if (!email || !password) {
    console.log(`- Skipping ${role} login (missing credentials)`);
    return null;
  }

  const url = `/api/${role}/auth/login`;
  const response = await client.post(url, { email, password });

  if (!response.data?.success) {
    throw new Error(
      `${role} login failed: ${response.status} ${prettyJson(response.data)}`
    );
  }

  const token = response.data?.data?.tokens?.accessToken;

  if (!token) {
    throw new Error(`${role} login response missing access token`);
  }

  console.log(`- Logged in as ${role}`);
  return token;
};

const discoveryRequest = async ({ path }) => {
  const params = { lat: LAT, lng: LNG };
  if (Number.isFinite(RADIUS_KM) && RADIUS_KM > 0) {
    params.radiusKm = RADIUS_KM;
  }

  const response = await client.get(path, { params });

  if (!response.data?.success) {
    throw new Error(
      `Discovery ${path} failed: ${response.status} ${prettyJson(response.data)}`
    );
  }

  const { count, radiusKm } = response.data.data || {};
  console.log(
    `- Discovery ${path} => ${count ?? 0} results (radius ${radiusKm} km)`
  );

  return response.data.data;
};

const getPatientPrescriptions = async (token) => {
  if (!token) {
    console.log('- Skipping patient prescription list (no token)');
    return [];
  }

  const response = await client.get('/api/prescriptions/patient/list', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.data?.success) {
    throw new Error(
      `Patient prescription list failed: ${response.status} ${prettyJson(
        response.data
      )}`
    );
  }

  const { prescriptions } = response.data;
  console.log(`- Patient prescription list returns ${prescriptions.length} rows`);

  return prescriptions;
};

const getPrescriptionDetail = async (token, id) => {
  if (!token || !id) {
    console.log('- Skipping prescription detail (missing token or id)');
    return null;
  }

  const response = await client.get(`/api/prescriptions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.data?.success) {
    throw new Error(
      `Prescription detail failed: ${response.status} ${prettyJson(
        response.data
      )}`
    );
  }

  console.log(`- Prescription ${id} fetched (sharedWith summary included)`);
  return response.data.prescription;
};

const sharePrescription = async ({ token, id, targetType, targetIds }) => {
  if (!token || !id || !targetIds?.length) {
    console.log(
      `- Skipping share (${targetType}) due to missing token/id/targetIds`
    );
    return null;
  }

  const response = await client.post(
    `/api/prescriptions/${id}/share`,
    {
      targetType,
      targetIds,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.data?.success) {
    throw new Error(
      `Share (${targetType}) failed: ${response.status} ${prettyJson(
        response.data
      )}`
    );
  }

  console.log(
    `- Share (${targetType}) succeeded (targets: ${targetIds.join(', ')})`
  );
  return response.data.data;
};

const run = async () => {
  console.log('Healiinn discovery + prescription integration test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Coordinates: ${LAT}, ${LNG}`);
  if (Number.isFinite(RADIUS_KM)) {
    console.log(`Radius override: ${RADIUS_KM} km`);
  }
  console.log('---');

  try {
    // 1. Public discovery endpoints
    await discoveryRequest({ path: '/api/discovery/doctors' });
    await discoveryRequest({ path: '/api/discovery/laboratories' });
    await discoveryRequest({ path: '/api/discovery/pharmacies' });

    console.log('---');

    // 2. Optional logins
    const doctorToken = await login({
      role: 'doctors',
      email: DOCTOR_EMAIL,
      password: DOCTOR_PASSWORD,
    }).catch((error) => {
      console.warn(`Doctor login skipped: ${error.message}`);
      return null;
    });

    const patientToken = await login({
      role: 'patients',
      email: PATIENT_EMAIL,
      password: PATIENT_PASSWORD,
    }).catch((error) => {
      console.warn(`Patient login skipped: ${error.message}`);
      return null;
    });

    console.log('---');

    // 3. Patient prescriptions (optional)
    let prescriptionId = PRESCRIPTION_ID;

    if (patientToken) {
      const prescriptions = await getPatientPrescriptions(patientToken);

      if (!prescriptionId && prescriptions.length) {
        prescriptionId = prescriptions[0]?._id;
        console.log(`- Using first prescription from list: ${prescriptionId}`);
      }
    }

    if (patientToken && prescriptionId) {
      await getPrescriptionDetail(patientToken, prescriptionId);
    }

    // 4. Share flows
    if (patientToken && prescriptionId) {
      if (SHARE_LAB_IDS.length) {
        await sharePrescription({
          token: patientToken,
          id: prescriptionId,
          targetType: 'laboratory',
          targetIds: SHARE_LAB_IDS,
        });
      }

      if (SHARE_PHARMACY_IDS.length) {
        await sharePrescription({
          token: patientToken,
          id: prescriptionId,
          targetType: 'pharmacy',
          targetIds: SHARE_PHARMACY_IDS,
        });
      }
    } else {
      console.log('- Skipping share tests (need patient token + prescription)');
    }

    console.log('---');

    console.log('Tests finished');
  } catch (error) {
    console.error('Test run failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response body:', prettyJson(error.response.data));
    }
    process.exitCode = 1;
  } finally {
    await pause(100);
  }
};

run();


