/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const Patient = require('../models/Patient');

const PASS = 'passed';
const FAIL = 'failed';

const record = async (results, name, fn) => {
  try {
    await fn();
    results.push({ name, status: PASS });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, status: FAIL, error: error.message || error });
    console.error(`✗ ${name}: ${error.message || error}`);
  }
};

let mongoServer;
let request;
let app;

const setup = async () => {
  // Create in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Disconnect any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri);
  
  // Create Express app for testing
  app = express();
  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Load routes
  app.use('/api/patients/auth', require('../routes/patient-routes/auth.routes'));
  
  // Error handling
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  request = supertest(app);
};

const teardown = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

const crypto = require('crypto');

const randomString = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
const randomPhone = () => `9${crypto.randomInt(100000000, 999999999)}`;

const createTestPatient = async (suffix = '') => {
  const uniqueId = suffix || randomString('test');
  const patient = await Patient.create({
    firstName: 'John',
    lastName: 'Doe',
    email: `john.doe.${uniqueId}@test.com`,
    phone: randomPhone(),
    password: 'TestPassword123',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'male',
    bloodGroup: 'O+',
    profileImage: 'https://example.com/profile.jpg',
    address: {
      line1: '123 Main Street',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    },
    emergencyContact: {
      name: 'Jane Doe',
      phone: '9876543211',
      relation: 'Spouse',
    },
    medicalHistory: [
      {
        condition: 'Hypertension',
        diagnosedAt: new Date('2020-03-15'),
        notes: 'Controlled with medication',
      },
    ],
    allergies: ['Penicillin', 'Peanuts'],
    isActive: true,
  });

  return patient;
};

const loginPatient = async (email, password) => {
  const response = await request.post('/api/patients/auth/login').send({
    email,
    password,
  });

  if (response.status !== 200 || !response.body?.data?.tokens?.accessToken) {
    throw new Error(`Login failed: ${response.body?.message || 'Unknown error'}`);
  }

  return response.body.data.tokens.accessToken;
};

const main = async () => {
  const results = [];

  await setup();

  console.log('\n=== Patient Profile API Tests ===\n');

  // Test 1: Get Patient Profile
  await record(results, 'Get patient profile', async () => {
    const patient = await createTestPatient();
    const token = await loginPatient(patient.email, 'TestPassword123');

    const response = await request
      .get('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    if (!response.body?.success || !response.body?.data) {
      throw new Error('Response missing success or data');
    }

    const profile = response.body.data;
    if (profile.firstName !== 'John' || profile.lastName !== 'Doe') {
      throw new Error('Profile data mismatch');
    }

    if (!profile.email || !profile.phone) {
      throw new Error('Required fields missing in profile');
    }
  });

  // Test 2: Update Personal Information
  await record(results, 'Update personal information', async () => {
    const patient = await createTestPatient('personal');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const updates = {
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1992-08-20',
      gender: 'female',
      bloodGroup: 'A+',
    };

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    if (!response.body?.success) {
      throw new Error('Update failed');
    }

    const updated = response.body.data;
    if (updated.firstName !== 'Jane' || updated.lastName !== 'Smith') {
      throw new Error('Personal information not updated correctly');
    }

    if (updated.gender !== 'female' || updated.bloodGroup !== 'A+') {
      throw new Error('Gender or blood group not updated');
    }
  });

  // Test 3: Update Contact Information
  await record(results, 'Update contact information', async () => {
    const patient = await createTestPatient('contact');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const newPhone = randomPhone();
    const updates = {
      phone: newPhone,
      address: {
        line1: '456 New Street',
        line2: 'Suite 10',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
      },
    };

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;
    if (updated.phone !== newPhone) {
      throw new Error('Phone not updated');
    }

    if (updated.address?.city !== 'Los Angeles' || updated.address?.state !== 'CA') {
      throw new Error('Address not updated correctly');
    }
  });

  // Test 4: Update Email
  await record(results, 'Update email address', async () => {
    const patient = await createTestPatient('email');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const newEmail = `newemail.${randomString('email')}@test.com`;
    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newEmail });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;
    if (updated.email !== newEmail) {
      throw new Error('Email not updated');
    }
  });

  // Test 5: Update Email - Duplicate Email Error
  await record(results, 'Update email - duplicate email error', async () => {
    const patient1 = await createTestPatient('dup1');
    const patient2 = await Patient.create({
      firstName: 'Test',
      lastName: 'User',
      email: `existing.${randomString('dup')}@test.com`,
      phone: randomPhone(),
      password: 'TestPassword123',
      isActive: true,
    });

    const token = await loginPatient(patient1.email, 'TestPassword123');

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: patient2.email });

    if (response.status !== 409) {
      throw new Error(`Expected 409, got ${response.status}: ${response.body?.message}`);
    }
  });

  // Test 6: Update Phone - Duplicate Phone Error
  await record(results, 'Update phone - duplicate phone error', async () => {
    const patient1 = await createTestPatient('phone1');
    const duplicatePhone = randomPhone();
    const patient2 = await Patient.create({
      firstName: 'Test',
      lastName: 'User',
      email: `test2.${randomString('phone')}@test.com`,
      phone: duplicatePhone,
      password: 'TestPassword123',
      isActive: true,
    });

    const token = await loginPatient(patient1.email, 'TestPassword123');

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: duplicatePhone });

    if (response.status !== 409) {
      throw new Error(`Expected 409, got ${response.status}: ${response.body?.message}`);
    }
  });

  // Test 7: Update Emergency Contact
  await record(results, 'Update emergency contact', async () => {
    const patient = await createTestPatient('emergency');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const updates = {
      emergencyContact: {
        name: 'John Smith',
        phone: '9876543215',
        relation: 'Brother',
      },
    };

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;
    if (updated.emergencyContact?.name !== 'John Smith' || updated.emergencyContact?.relation !== 'Brother') {
      throw new Error('Emergency contact not updated correctly');
    }
  });

  // Test 8: Update Medical History
  await record(results, 'Update medical history', async () => {
    const patient = await createTestPatient('medical');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const newHistory = [
      {
        condition: 'Type 2 Diabetes',
        diagnosedAt: '2018-06-20',
        notes: 'Well managed',
      },
      {
        condition: 'Asthma',
        diagnosedAt: '2015-01-10',
        notes: 'Mild, controlled',
      },
    ];

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicalHistory: newHistory });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;
    if (!Array.isArray(updated.medicalHistory) || updated.medicalHistory.length !== 2) {
      throw new Error('Medical history not updated correctly');
    }

    if (updated.medicalHistory[0].condition !== 'Type 2 Diabetes') {
      throw new Error('Medical history data mismatch');
    }
  });

  // Test 9: Update Allergies
  await record(results, 'Update allergies', async () => {
    const patient = await createTestPatient('allergies');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const newAllergies = ['Penicillin', 'Peanuts', 'Dust', 'Pollen'];

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ allergies: newAllergies });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;
    if (!Array.isArray(updated.allergies) || updated.allergies.length !== 4) {
      throw new Error('Allergies not updated correctly');
    }

    if (!updated.allergies.includes('Dust') || !updated.allergies.includes('Pollen')) {
      throw new Error('Allergies data mismatch');
    }
  });

  // Test 10: Update Profile Image
  await record(results, 'Update profile image', async () => {
    const patient = await createTestPatient('image');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const newImageUrl = 'https://example.com/new-profile.jpg';

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileImage: newImageUrl });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;
    if (updated.profileImage !== newImageUrl) {
      throw new Error('Profile image not updated');
    }
  });

  // Test 11: Change Password - Success
  await record(results, 'Change password - success', async () => {
    const patient = await createTestPatient('pwd1');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const response = await request
      .put('/api/patients/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'TestPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    if (!response.body?.success) {
      throw new Error('Password change failed');
    }

    // Verify new password works
    const loginResponse = await request.post('/api/patients/auth/login').send({
      email: patient.email,
      password: 'NewPassword123',
    });

    if (loginResponse.status !== 200) {
      throw new Error('New password does not work');
    }
  });

  // Test 12: Change Password - Wrong Current Password
  await record(results, 'Change password - wrong current password', async () => {
    const patient = await createTestPatient('pwd2');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const response = await request
      .put('/api/patients/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}: ${response.body?.message}`);
    }

    if (response.body?.message !== 'Current password is incorrect.') {
      throw new Error('Wrong error message for incorrect current password');
    }
  });

  // Test 13: Change Password - Password Mismatch
  await record(results, 'Change password - password mismatch', async () => {
    const patient = await createTestPatient('pwd3');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const response = await request
      .put('/api/patients/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'TestPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}: ${response.body?.message}`);
    }

    if (!response.body?.message?.includes('match')) {
      throw new Error('Wrong error message for password mismatch');
    }
  });

  // Test 14: Change Password - Short Password
  await record(results, 'Change password - short password', async () => {
    const patient = await createTestPatient('pwd4');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const response = await request
      .put('/api/patients/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'TestPassword123',
        newPassword: 'Short1',
        confirmPassword: 'Short1',
      });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}: ${response.body?.message}`);
    }

    if (!response.body?.message?.includes('8 characters')) {
      throw new Error('Wrong error message for short password');
    }
  });

  // Test 15: Change Password - Missing Fields
  await record(results, 'Change password - missing fields', async () => {
    const patient = await createTestPatient('pwd5');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const response = await request
      .put('/api/patients/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'TestPassword123',
        // Missing newPassword and confirmPassword
      });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}: ${response.body?.message}`);
    }
  });

  // Test 16: Update Profile - Partial Address Update
  await record(results, 'Update profile - partial address update', async () => {
    const patient = await createTestPatient('partial');
    const token = await loginPatient(patient.email, 'TestPassword123');

    // Update only city and state, keep other address fields
    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: {
          city: 'San Francisco',
          state: 'CA',
        },
      });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;
    if (updated.address?.city !== 'San Francisco' || updated.address?.state !== 'CA') {
      throw new Error('Partial address update failed');
    }

    // Check that other address fields are preserved
    if (updated.address?.line1 !== '123 Main Street') {
      throw new Error('Other address fields not preserved');
    }
  });

  // Test 17: Get Profile - Unauthorized
  await record(results, 'Get profile - unauthorized', async () => {
    const response = await request.get('/api/patients/auth/me');

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 18: Update Profile - Unauthorized
  await record(results, 'Update profile - unauthorized', async () => {
    const response = await request.put('/api/patients/auth/me').send({
      firstName: 'Test',
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 19: Change Password - Unauthorized
  await record(results, 'Change password - unauthorized', async () => {
    const response = await request.put('/api/patients/auth/change-password').send({
      currentPassword: 'Test123',
      newPassword: 'New123',
      confirmPassword: 'New123',
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 20: Update All Fields Together
  await record(results, 'Update all profile fields together', async () => {
    const patient = await createTestPatient('all');
    const token = await loginPatient(patient.email, 'TestPassword123');

    const newPhone = randomPhone();
    const newEmail = `updated.${randomString('all')}@test.com`;

    const comprehensiveUpdate = {
      firstName: 'Updated',
      lastName: 'Patient',
      dateOfBirth: '1985-12-25',
      gender: 'other',
      bloodGroup: 'B+',
      phone: newPhone,
      email: newEmail,
      profileImage: 'https://example.com/updated.jpg',
      address: {
        line1: '789 Updated Ave',
        line2: 'Floor 5',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Updated Contact',
        phone: '9876543217',
        relation: 'Friend',
      },
      medicalHistory: [
        {
          condition: 'Updated Condition',
          diagnosedAt: '2023-01-01',
          notes: 'Updated notes',
        },
      ],
      allergies: ['Updated Allergy 1', 'Updated Allergy 2'],
    };

    const response = await request
      .put('/api/patients/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send(comprehensiveUpdate);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${response.body?.message}`);
    }

    const updated = response.body.data;

    // Verify all fields
    if (updated.firstName !== 'Updated' || updated.lastName !== 'Patient') {
      throw new Error('Name not updated');
    }

    if (updated.email !== newEmail || updated.phone !== newPhone) {
      throw new Error(`Contact info not updated. Expected email: ${newEmail}, got: ${updated.email}. Expected phone: ${newPhone}, got: ${updated.phone}`);
    }

    if (updated.address?.city !== 'Chicago' || updated.emergencyContact?.name !== 'Updated Contact') {
      throw new Error('Nested fields not updated');
    }

    if (updated.allergies?.length !== 2 || updated.medicalHistory?.length !== 1) {
      throw new Error('Array fields not updated');
    }
  });

  await teardown();

  // Print Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter((r) => r.status === PASS).length;
  const failed = results.filter((r) => r.status === FAIL).length;

  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => r.status === FAIL)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }

  console.log('\nAll tests passed! ✓');
  process.exit(0);
};

main().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});

