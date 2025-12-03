# Appointment Booking & Consultation System - Complete Implementation

## 📋 Overview
This document describes the complete implementation of the appointment booking, session management, consultation, and payment system as per requirements.

---

## ✅ IMPLEMENTED FEATURES

### 1. Patient Appointment Booking Flow

#### 1.1 Doctor Selection
- ✅ Patient can browse and select a doctor
- ✅ Doctor details displayed (specialization, experience, consultation fee, ratings)
- ✅ Available dates shown based on doctor's availability

#### 1.2 Date Selection & Slot Availability
- ✅ Patient selects appointment date
- ✅ System automatically checks slot availability for selected date
- ✅ If all slots are full → Date is disabled, shows "Full" status
- ✅ If slots available → Date is selectable, shows remaining slots count
- ✅ Real-time slot availability check via API

**Endpoint**: `GET /api/patients/doctors/:doctorId/slots?date=YYYY-MM-DD`

**Response**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "totalSlots": 20,
    "bookedSlots": 5,
    "availableSlots": 15,
    "sessionId": "...",
    "nextToken": 6
  }
}
```

#### 1.3 Token Number Display
- ✅ After date selection, token number is automatically displayed
- ✅ Shows: "Your Token Number: X"
- ✅ Displays: "X of Y slots booked"
- ✅ Shows remaining slots count

**Frontend Location**: `frontend/src/modules/patient/patient-pages/PatientDoctorDetails.jsx` (Line 752)

#### 1.4 Payment Process
- ✅ After token number display, patient proceeds to payment
- ✅ Payment integration with Razorpay
- ✅ Payment verification endpoint

**Endpoint**: `POST /api/patients/appointments/:appointmentId/verify-payment`

**Payment Flow**:
1. Patient books appointment → Appointment created with `paymentStatus: 'pending'`
2. Patient makes payment via Razorpay
3. Payment verified → `paymentStatus: 'paid'`
4. Transaction records created (Patient + Admin)
5. Doctor wallet credited (80% of fee, 20% commission)

---

### 2. Doctor Session Management

#### 2.1 Automatic Daily Session Creation
- ✅ Sessions are **automatically created** when patient books appointment
- ✅ No manual session creation needed by doctor
- ✅ Based on doctor's profile settings:
  - `availability` array (day-wise timings)
  - `averageConsultationMinutes` (default: 20 minutes)
  - `blockedDates` (holidays/leaves)
  - `temporaryAvailability` (special dates)

**Calculation Logic**:
```javascript
// From doctor's availability for the day
const duration = endTime - startTime; // in minutes
const maxTokens = Math.floor(duration / averageConsultationMinutes);
```

**Service**: `backend/services/sessionService.js` - `getOrCreateSession()`

#### 2.2 Session Display for Doctor
- ✅ Doctor sees all sessions for selected date
- ✅ Each session shows:
  - Date and time range
  - Total slots (maxTokens)
  - Current bookings (currentToken)
  - Status (scheduled, live, paused, completed)
  - List of patients with token numbers

**Endpoint**: `GET /api/doctors/sessions?date=YYYY-MM-DD`

**Frontend**: `frontend/src/modules/doctor/doctor-pages/DoctorPatients.jsx`

#### 2.3 Session Actions

##### Start Session
- ✅ Doctor can start a session
- ✅ Changes status: `scheduled` → `live`
- ✅ Sets `startedAt` timestamp

##### Pause Session
- ✅ Doctor can pause session
- ✅ Status: `live` → `paused`
- ✅ Tracks pause duration
- ✅ ETA automatically adjusts for all waiting patients

**Endpoint**: `POST /api/doctors/queue/pause`

##### Resume Session
- ✅ Doctor can resume paused session
- ✅ Status: `paused` → `live`
- ✅ ETA recalculated for all waiting patients

**Endpoint**: `POST /api/doctors/queue/resume`

##### Cancel Session
- ✅ Doctor can cancel entire session
- ✅ All appointments for that day are cancelled
- ✅ Patients receive email notifications
- ✅ Patients can reschedule to next available date
- ✅ Real-time notifications sent to all affected patients

**Endpoint**: `DELETE /api/doctors/sessions/:sessionId`

---

### 3. Patient Queue Management

#### 3.1 Patient List Display
- ✅ Doctor sees list of all patients for the day
- ✅ Patients displayed in token number order
- ✅ Shows:
  - Patient name and photo
  - Token number
  - Appointment time (calculated)
  - Queue status (waiting, in-consultation, completed, skipped, no-show)
  - ETA (Estimated Time of Arrival)

**Endpoint**: `GET /api/doctors/queue?date=YYYY-MM-DD`

#### 3.2 Queue Actions

##### Call Next Patient
- ✅ Doctor clicks "Call Next" button
- ✅ Increments `currentToken` in session
- ✅ Next patient's status: `waiting` → `called`
- ✅ Real-time notification to patient
- ✅ ETA updated for all waiting patients

**Endpoint**: `POST /api/doctors/queue/call-next`

**Service**: `backend/services/sessionService.js` - `callNextPatient()`

##### Skip Patient
- ✅ Doctor can skip a patient
- ✅ Status: `waiting` → `skipped`
- ✅ Patient moved to end of queue (if needed)
- ✅ ETA recalculated for all waiting patients

**Endpoint**: `PATCH /api/doctors/queue/:appointmentId/skip`

##### Re-Call Patient
- ✅ Doctor can re-call a skipped/no-show patient
- ✅ Status: `skipped`/`no-show` → `waiting`
- ✅ Patient added back to queue
- ✅ ETA recalculated

**Endpoint**: `PATCH /api/doctors/queue/:appointmentId/recall` ⭐ **NEW**

##### Complete Consultation
- ✅ Doctor marks consultation as complete
- ✅ Status: `in-consultation` → `completed`
- ✅ Appointment status: `scheduled` → `completed`
- ✅ Session token advances

**Endpoint**: `PATCH /api/doctors/queue/:appointmentId/status`

---

### 4. Consultation & Prescription

#### 4.1 Consultation Process
- ✅ Doctor starts consultation with patient
- ✅ Can view patient details (name, age, gender, blood group, medical history)
- ✅ Can add:
  - Diagnosis
  - Vitals (BP, temperature, pulse, etc.)
  - Symptoms
  - Advice
  - Follow-up date

**Endpoint**: `POST /api/doctors/consultations`

#### 4.2 Prescription Creation
- ✅ Doctor creates prescription during consultation
- ✅ Prescription includes:
  - Medications (name, dosage, frequency, duration, instructions, quantity)
  - Notes
  - Expiry date
- ✅ Prescription PDF automatically generated
- ✅ PDF saved to backend storage

**Endpoint**: `POST /api/doctors/prescriptions`

**Prescription Model**: `backend/models/Prescription.js`
- Linked to: `patientId`, `doctorId`, `consultationId`
- Indexed for both patient and doctor queries

#### 4.3 Prescription Storage
- ✅ Prescription saved to **Patient Profile**
  - Patient can view all prescriptions in their app
  - Endpoint: `GET /api/patients/prescriptions`
  
- ✅ Prescription saved to **Doctor Profile**
  - Doctor can view all prescriptions they've created
  - Endpoint: `GET /api/doctors/prescriptions`

- ✅ Prescription linked to consultation
  - Consultation has `prescriptionId` field
  - Can be queried from consultation record

---

### 5. Payment & Wallet System

#### 5.1 Payment Flow
1. **Patient Payment**:
   - Patient pays appointment fee via Razorpay
   - Payment verified via `verifyAppointmentPayment` endpoint
   - Transaction created for patient (type: `payment`)

2. **Admin Wallet**:
   - Full payment amount goes to admin wallet
   - Transaction created (userType: `admin`, type: `payment`)
   - Admin can view all payments in admin panel

3. **Doctor Wallet**:
   - Doctor earns 80% of appointment fee (20% platform commission)
   - Wallet transaction created (type: `earning`)
   - Commission deduction record created (type: `commission_deduction`)
   - Real-time notification to doctor

**Implementation**: `backend/controllers/patient-controllers/patientAppointmentController.js` - `verifyAppointmentPayment()`

#### 5.2 Wallet Transactions

**Doctor Wallet**:
- **Earning**: From completed appointments (80% of fee)
- **Commission Deduction**: Platform commission (20% of fee)
- **Withdrawal**: Doctor can withdraw earnings
- **Balance**: Calculated from all completed transactions

**Endpoint**: `GET /api/doctors/wallet/balance`

**Admin Wallet**:
- **Payment Received**: From all patient payments (appointments, orders, tests)
- **Balance**: Total of all patient payments
- **Transactions**: View all payment transactions

**Endpoint**: `GET /api/admin/wallet/overview`

---

### 6. Notifications System

#### 6.1 Patient Notifications
- ✅ **Appointment Created**: When appointment is booked
- ✅ **Token Called**: When doctor calls patient
- ✅ **ETA Updates**: Real-time ETA updates during queue
- ✅ **Appointment Cancelled**: When session is cancelled
- ✅ **Prescription Created**: When prescription is saved
- ✅ **Payment Confirmed**: When payment is verified
- ✅ **Appointment Rescheduled**: When patient reschedules

**Real-time Events** (Socket.IO):
- `appointment:created`
- `token:called`
- `token:eta:update`
- `appointment:cancelled`
- `prescription:created`
- `appointment:payment:confirmed`
- `appointment:rescheduled`
- `token:recalled` ⭐ **NEW**

**Email Notifications**:
- Appointment confirmation email
- Payment confirmation email
- Appointment cancellation email
- Prescription email (with PDF)

#### 6.2 Doctor Notifications
- ✅ **New Appointment**: When patient books appointment
- ✅ **Wallet Credited**: When payment is received
- ✅ **Session Updates**: When session status changes
- ✅ **Queue Updates**: When queue status changes

**Real-time Events**:
- `appointment:created`
- `wallet:credited` ⭐ **NEW**
- `session:updated`
- `queue:updated`
- `queue:next:called`

#### 6.3 Admin Notifications
- ✅ **Payment Received**: When patient makes payment
- ✅ **Appointment Created**: Track all appointments
- ✅ **Request Confirmed**: When patient confirms order/test request

**Real-time Events**:
- `admin:payment:received`
- `request:confirmed`

---

## 📁 KEY FILES & ENDPOINTS

### Backend Files

#### Controllers
- `backend/controllers/patient-controllers/patientAppointmentController.js`
  - `createAppointment()` - Create appointment
  - `verifyAppointmentPayment()` - Verify payment & credit wallets ⭐ **UPDATED**
  - `rescheduleAppointment()` - Reschedule appointment

- `backend/controllers/doctor-controllers/doctorSessionController.js`
  - `getSessions()` - Get doctor's sessions
  - `createSession()` - Manual session creation (optional)
  - `updateSession()` - Update session status
  - `deleteSession()` - Cancel session

- `backend/controllers/doctor-controllers/doctorQueueController.js`
  - `getQueue()` - Get patient queue for date
  - `callNextPatient()` - Call next patient
  - `skipPatient()` - Skip patient
  - `recallPatient()` - Re-call patient ⭐ **NEW**
  - `updateQueueStatus()` - Update queue status
  - `pauseSession()` - Pause session
  - `resumeSession()` - Resume session

- `backend/controllers/doctor-controllers/doctorConsultationController.js`
  - `createConsultation()` - Create consultation
  - `updateConsultation()` - Update consultation
  - `getConsultations()` - Get consultations

- `backend/controllers/doctor-controllers/doctorPrescriptionController.js`
  - `createPrescription()` - Create prescription
  - `getPrescriptions()` - Get prescriptions

- `backend/controllers/doctor-controllers/doctorWalletController.js`
  - `getWalletBalance()` - Get wallet balance
  - `getEarnings()` - Get earnings history
  - `getTransactions()` - Get transaction history

- `backend/controllers/admin-controllers/adminWalletController.js`
  - `getWalletOverview()` - Get admin wallet overview
  - `getAdminWalletTransactions()` - Get admin transactions

#### Services
- `backend/services/sessionService.js`
  - `getOrCreateSession()` - Auto-create session
  - `checkSlotAvailability()` - Check slot availability
  - `callNextPatient()` - Call next patient
  - `pauseSession()` - Pause session
  - `resumeSession()` - Resume session

- `backend/services/etaService.js`
  - `calculateAppointmentETA()` - Calculate ETA for appointment
  - `calculateQueueETAs()` - Calculate ETAs for all in queue
  - `recalculateSessionETAs()` - Recalculate all ETAs

#### Models
- `backend/models/Appointment.js` - Appointment model
- `backend/models/Session.js` - Session model
- `backend/models/Consultation.js` - Consultation model
- `backend/models/Prescription.js` - Prescription model
- `backend/models/Transaction.js` - Transaction model
- `backend/models/WalletTransaction.js` - Wallet transaction model

### Frontend Files

#### Patient Module
- `frontend/src/modules/patient/patient-pages/PatientDoctorDetails.jsx`
  - Doctor selection
  - Date selection with slot availability
  - Token number display
  - Booking modal with payment

- `frontend/src/modules/patient/patient-pages/PatientAppointments.jsx`
  - View all appointments
  - Reschedule appointments
  - View prescriptions

- `frontend/src/modules/patient/patient-services/patientService.js`
  - `bookAppointment()` - Book appointment
  - `checkDoctorSlotAvailability()` - Check slot availability
  - `verifyAppointmentPayment()` - Verify payment
  - `rescheduleAppointment()` - Reschedule appointment

#### Doctor Module
- `frontend/src/modules/doctor/doctor-pages/DoctorPatients.jsx`
  - View patient queue for date
  - Session management (start, pause, resume, cancel)
  - Queue actions (call next, skip, re-call, complete)

- `frontend/src/modules/doctor/doctor-pages/DoctorConsultations.jsx`
  - Consultation interface
  - Prescription creation
  - Patient details view

- `frontend/src/modules/doctor/doctor-services/doctorService.js`
  - `getSessions()` - Get sessions
  - `callNextPatient()` - Call next patient
  - `skipPatient()` - Skip patient
  - `recallPatient()` - Re-call patient ⭐ **NEW**
  - `pauseSession()` - Pause session
  - `resumeSession()` - Resume session
  - `createPrescription()` - Create prescription

---

## 🔄 COMPLETE FLOW DIAGRAM

### Patient Booking Flow
```
1. Patient selects doctor
   ↓
2. Patient selects date
   ↓
3. System checks slot availability
   ├─ If full → Date disabled, show "Full"
   └─ If available → Show token number, proceed
   ↓
4. Patient confirms booking
   ↓
5. Appointment created (paymentStatus: 'pending')
   ↓
6. Session auto-created (if not exists)
   ↓
7. Token number assigned
   ↓
8. Patient makes payment
   ↓
9. Payment verified
   ├─ Patient transaction created
   ├─ Admin transaction created (full amount)
   └─ Doctor wallet credited (80% of fee)
   ↓
10. Notifications sent
    ├─ Patient: Appointment confirmed
    ├─ Doctor: New appointment + Wallet credited
    └─ Admin: Payment received
```

### Doctor Session Flow
```
1. Doctor views sessions for date
   ↓
2. System shows patient list (by token number)
   ↓
3. Doctor starts session
   ↓
4. Doctor calls next patient
   ├─ Token increments
   ├─ Patient notified
   └─ ETA updated for all waiting
   ↓
5. During consultation:
   ├─ Doctor can: Skip, Re-call, Complete
   ├─ Doctor prepares prescription
   └─ Doctor saves prescription
   ↓
6. Prescription saved
   ├─ Saved to patient profile
   ├─ Saved to doctor profile
   └─ PDF generated
   ↓
7. Consultation completed
   ↓
8. Doctor can pause/resume session
   ↓
9. Doctor can cancel session
   └─ All appointments cancelled
   └─ Patients notified + can reschedule
```

---

## 🆕 NEW ADDITIONS & FIXES

### 1. Doctor Wallet Credit on Payment ⭐ **FIXED**
**File**: `backend/controllers/patient-controllers/patientAppointmentController.js`

**Changes**:
- Added doctor wallet credit when payment is verified
- Doctor earns 80% of appointment fee
- 20% platform commission deducted
- Real-time notification to doctor via Socket.IO

**Code Location**: Lines 667-728

### 2. Re-Call Patient Functionality ⭐ **NEW**
**File**: `backend/controllers/doctor-controllers/doctorQueueController.js`

**Endpoint**: `PATCH /api/doctors/queue/:appointmentId/recall`

**Functionality**:
- Doctor can re-call a skipped or no-show patient
- Changes status from `skipped`/`no-show` → `waiting`
- Patient added back to queue
- ETA recalculated for all waiting patients
- Real-time notification to patient

**Code Location**: Lines 230-290

### 3. Token Number Display ⭐ **VERIFIED**
**File**: `frontend/src/modules/patient/patient-pages/PatientDoctorDetails.jsx`

**Location**: Lines 752-765

**Display**:
- Shows token number after date selection
- Shows "X of Y slots booked"
- Shows remaining slots
- Disabled if date is full

---

## 📊 DATA FLOW

### Appointment Creation
```
Patient → Frontend → API → Backend
  ↓
1. Check slot availability
2. Create/Get session
3. Assign token number
4. Create appointment
5. Return appointment with token number
```

### Payment Verification
```
Patient Payment → Razorpay → Backend Verification
  ↓
1. Verify payment signature
2. Update appointment (paymentStatus: 'paid')
3. Create patient transaction
4. Create admin transaction
5. Credit doctor wallet (80%)
6. Create commission record (20%)
7. Send notifications
```

### Prescription Creation
```
Doctor → Consultation → Prescription
  ↓
1. Create prescription record
2. Generate PDF
3. Link to consultation
4. Link to patient (patientId)
5. Link to doctor (doctorId)
6. Save to database
7. Send to patient app
8. Available in doctor profile
```

---

## 🔧 CONFIGURATION

### Commission Rate
**Location**: `backend/controllers/patient-controllers/patientAppointmentController.js` (Line 679)

**Current**: 20% commission (80% to doctor)
```javascript
const commissionRate = 0.20; // 20% commission
const doctorEarning = appointment.fee * (1 - commissionRate); // 80%
```

**To Change**: Modify `commissionRate` value

### Average Consultation Time
**Location**: Doctor Profile → `averageConsultationMinutes`

**Default**: 20 minutes
**Used For**: Calculating max tokens per session

**Formula**:
```javascript
maxTokens = Math.floor(sessionDuration / averageConsultationMinutes)
```

---

## 📝 API ENDPOINTS SUMMARY

### Patient Endpoints
- `POST /api/patients/appointments` - Book appointment
- `GET /api/patients/doctors/:doctorId/slots` - Check slot availability
- `POST /api/patients/appointments/:id/verify-payment` - Verify payment
- `PATCH /api/patients/appointments/:id/reschedule` - Reschedule appointment
- `GET /api/patients/appointments` - Get patient appointments
- `GET /api/patients/prescriptions` - Get patient prescriptions

### Doctor Endpoints
- `GET /api/doctors/sessions` - Get sessions
- `POST /api/doctors/sessions` - Create session (optional)
- `PATCH /api/doctors/sessions/:id` - Update session
- `DELETE /api/doctors/sessions/:id` - Cancel session
- `GET /api/doctors/queue` - Get patient queue
- `POST /api/doctors/queue/call-next` - Call next patient
- `PATCH /api/doctors/queue/:id/skip` - Skip patient
- `PATCH /api/doctors/queue/:id/recall` - Re-call patient ⭐ **NEW**
- `PATCH /api/doctors/queue/:id/status` - Update queue status
- `POST /api/doctors/queue/pause` - Pause session
- `POST /api/doctors/queue/resume` - Resume session
- `POST /api/doctors/consultations` - Create consultation
- `POST /api/doctors/prescriptions` - Create prescription
- `GET /api/doctors/prescriptions` - Get prescriptions
- `GET /api/doctors/wallet/balance` - Get wallet balance
- `GET /api/doctors/wallet/earnings` - Get earnings

### Admin Endpoints
- `GET /api/admin/wallet/overview` - Get wallet overview
- `GET /api/admin/wallet/transactions` - Get transactions
- `GET /api/admin/appointments` - Get all appointments

---

## ✅ VERIFICATION CHECKLIST

### Appointment Booking
- [x] Patient can select doctor
- [x] Patient can select date
- [x] System checks slot availability
- [x] Full dates are disabled
- [x] Token number displayed after date selection
- [x] Payment integration works
- [x] Payment verification works

### Session Management
- [x] Sessions auto-created based on availability
- [x] Doctor sees patient list for date
- [x] Session can be started
- [x] Session can be paused/resumed
- [x] Session can be cancelled
- [x] All appointments cancelled when session cancelled

### Queue Management
- [x] Doctor can call next patient
- [x] Doctor can skip patient
- [x] Doctor can re-call patient ⭐ **NEW**
- [x] Doctor can complete consultation
- [x] ETA updates in real-time

### Consultation & Prescription
- [x] Doctor can create consultation
- [x] Doctor can create prescription
- [x] Prescription saved to patient profile
- [x] Prescription saved to doctor profile
- [x] Prescription PDF generated

### Payment & Wallet
- [x] Payment goes to admin wallet
- [x] Doctor wallet credited (80%) ⭐ **FIXED**
- [x] Commission deducted (20%)
- [x] Transactions properly recorded
- [x] Real-time notifications sent

### Notifications
- [x] Patient receives all notifications
- [x] Doctor receives notifications
- [x] Admin receives payment notifications
- [x] Real-time Socket.IO events
- [x] Email notifications sent

---

## 🚀 DEPLOYMENT NOTES

1. **Database**: Ensure all models are properly indexed
2. **Socket.IO**: Ensure Socket.IO server is running
3. **Payment Gateway**: Configure Razorpay keys in environment
4. **File Storage**: Ensure upload directories exist
5. **Email Service**: Configure email service for notifications

---

## 📞 SUPPORT

For any issues or questions regarding this implementation, refer to:
- Backend API documentation
- Frontend component documentation
- Socket.IO event documentation

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0

