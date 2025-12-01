# Consultation Flow & ETA Implementation Summary

## ✅ COMPLETED IMPLEMENTATION

### 1. Skip/No-Show with ETA Updates
- **Skip Patient**: When doctor skips a patient, ETA is recalculated for all waiting patients
- **No-Show**: When patient doesn't show up, appointment is marked as no-show, session token advances, and ETAs are recalculated
- **Real-time Updates**: All ETA changes are broadcasted via Socket.IO

### 2. Session Cancel with Notifications
- **Session Cancellation**: When doctor cancels a session, all appointments in that session are cancelled
- **Email Notifications**: All affected patients receive email notifications
- **Real-time Events**: Patients receive Socket.IO notifications about cancelled appointments
- **Response Data**: Returns count of cancelled appointments

### 3. Patient Reschedule Appointment
- **New Endpoint**: `PATCH /api/patients/appointments/:id/reschedule`
- **Slot Validation**: Checks if new date has available slots before rescheduling
- **Session Management**: Automatically creates new session if needed
- **Token Management**: Updates old and new session token counts
- **ETA Updates**: Recalculates ETAs for both old and new sessions
- **Notifications**: Sends confirmation email to patient

### 4. Patient Consultation Complete
- **New Endpoint**: `PATCH /api/patients/consultations/:id/complete`
- **Status Update**: Marks consultation as completed
- **Appointment Update**: Updates associated appointment status
- **Real-time Events**: Notifies doctor when patient marks consultation complete
- **Validation**: Prevents completing already completed or cancelled consultations

### 5. ETA Updates in All Scenarios
- **Skip**: ETA recalculated after skip
- **No-Show**: ETA recalculated after no-show
- **Pause/Resume**: ETA adjusted based on session pause status
- **Call Next**: ETA updated when doctor calls next patient
- **Reschedule**: ETA recalculated for both old and new sessions
- **Session Cancel**: All affected appointments are cancelled

---

## 📁 NEW FILES CREATED

1. **`backend/controllers/patient-controllers/patientConsultationController.js`**
   - `getConsultations` - Get all consultations for patient
   - `getConsultationById` - Get specific consultation details
   - `completeConsultation` - Patient marks consultation as complete

2. **`backend/routes/patient-routes/consultation.routes.js`**
   - Routes for patient consultation endpoints

---

## 🔧 MODIFIED FILES

### 1. `backend/controllers/doctor-controllers/doctorQueueController.js`
- **Skip Patient**: Added session token update and ETA recalculation
- **Update Queue Status**: Added ETA recalculation for skip and no-show
- **No-Show Handling**: Marks appointment as cancelled and updates session token

### 2. `backend/controllers/doctor-controllers/doctorSessionController.js`
- **Session Cancel**: Enhanced to send notifications to all affected patients
- **Fixed**: Changed `SESSION_STATUS.ACTIVE` to `SESSION_STATUS.LIVE`
- **Response**: Returns count of cancelled appointments

### 3. `backend/controllers/patient-controllers/patientAppointmentController.js`
- **Reschedule Endpoint**: New `rescheduleAppointment` function
- **Slot Validation**: Checks availability before rescheduling
- **Session Management**: Handles both old and new sessions
- **ETA Updates**: Recalculates ETAs for both sessions
- **Notifications**: Sends confirmation email

### 4. `backend/routes/patient-routes/appointment.routes.js`
- **New Route**: `PATCH /:id/reschedule` for rescheduling

### 5. `backend/server.js`
- **New Route**: Added patient consultation routes

---

## 🔑 NEW API ENDPOINTS

### Patient Endpoints

#### Reschedule Appointment
```
PATCH /api/patients/appointments/:id/reschedule
Body: {
  appointmentDate: "2025-12-01",
  time: "10:00 AM"
}
```

#### Get Consultations
```
GET /api/patients/consultations?status=completed&date=2025-12-01&page=1&limit=20
```

#### Get Consultation Details
```
GET /api/patients/consultations/:id
```

#### Complete Consultation
```
PATCH /api/patients/consultations/:id/complete
```

---

## 🔄 REAL-TIME EVENTS (Socket.IO)

### Doctor Events
- `queue:updated` - Queue status changed
- `appointment:rescheduled` - Patient rescheduled appointment
- `consultation:completed` - Patient marked consultation complete

### Patient Events
- `token:eta:update` - ETA updated after skip/no-show/reschedule
- `appointment:skipped` - Appointment was skipped by doctor
- `appointment:status:updated` - Appointment status changed
- `appointment:cancelled` - Session cancelled, appointment cancelled
- `consultation:completed` - Consultation marked as complete

---

## 📊 FLOW DIAGRAMS

### Reschedule Flow
```
Patient requests reschedule
  ↓
Check new date slot availability
  ↓
Create/get session for new date
  ↓
Update old session token count
  ↓
Assign new token to appointment
  ↓
Recalculate ETAs for both sessions
  ↓
Send notifications
  ↓
Return updated appointment
```

### Session Cancel Flow
```
Doctor cancels session
  ↓
Find all appointments in session
  ↓
Cancel all appointments
  ↓
Send email to each patient
  ↓
Emit Socket.IO events
  ↓
Delete session
  ↓
Return cancellation count
```

### Consultation Complete Flow
```
Patient marks consultation complete
  ↓
Validate consultation status
  ↓
Update consultation status
  ↓
Update appointment status
  ↓
Emit Socket.IO events
  ↓
Return completed consultation
```

---

## ✨ KEY FEATURES

1. **Automatic ETA Recalculation**: ETA updates automatically in all scenarios
2. **Session Management**: Automatic session creation and token management
3. **Notification System**: Email and Socket.IO notifications for all actions
4. **Validation**: Comprehensive validation before any action
5. **Real-time Updates**: All changes broadcasted in real-time
6. **Error Handling**: Proper error messages and status codes

---

## 🧪 TESTING SCENARIOS

1. ✅ Skip patient → ETA recalculated
2. ✅ No-show patient → ETA recalculated, token advanced
3. ✅ Pause session → ETA becomes null
4. ✅ Resume session → ETA recalculated
5. ✅ Cancel session → All appointments cancelled, notifications sent
6. ✅ Reschedule appointment → Slot validation, ETA updates
7. ✅ Complete consultation → Status updated, notifications sent

---

**Status**: ✅ Complete and Ready
**Date**: November 29, 2025

