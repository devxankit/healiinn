# Backend Implementation Plan - Healiinn Healthcare Platform

## 📋 Overview

यह document complete backend implementation के लिए step-by-step plan है। Frontend analysis के आधार पर, सभी modules, APIs, और features को implement किया जाएगा।

**Implementation Date**: January 2025  
**Tech Stack**: Node.js + Express.js + MongoDB + Socket.IO  
**Architecture**: MVC Pattern with Real-time Updates

---

## 🏗️ Project Structure

```
backend/
├── config/
│   ├── db.js                    # MongoDB connection
│   ├── redis.js                 # Redis connection (for caching & queues)
│   └── socket.js                # Socket.IO configuration
├── models/                      # Database models
│   ├── Patient.js               # ✅ Existing
│   ├── Doctor.js                # ✅ Existing
│   ├── Pharmacy.js              # ✅ Existing
│   ├── Laboratory.js            # ✅ Existing
│   ├── Admin.js                 # ✅ Existing
│   ├── Appointment.js           # ⚠️ To Create
│   ├── Consultation.js          # ⚠️ To Create
│   ├── Prescription.js          # ⚠️ To Create
│   ├── Order.js                 # ⚠️ To Create
│   ├── LabReport.js             # ⚠️ To Create
│   ├── Transaction.js           # ⚠️ To Create
│   ├── WalletTransaction.js    # ⚠️ To Create
│   ├── WithdrawalRequest.js    # ⚠️ To Create
│   ├── Request.js               # ⚠️ To Create
│   ├── Session.js               # ⚠️ To Create
│   ├── Review.js                # ⚠️ To Create
│   ├── Hospital.js              # ⚠️ To Create
│   ├── Specialty.js             # ⚠️ To Create
│   ├── Medicine.js              # ⚠️ To Create
│   ├── Test.js                  # ⚠️ To Create
│   ├── PharmacyService.js       # ⚠️ To Create
│   ├── SupportTicket.js         # ⚠️ To Create
│   ├── AdminSettings.js         # ⚠️ To Create
│   ├── LoginOtpToken.js         # ✅ Existing
│   ├── PasswordResetToken.js    # ✅ Existing
│   └── TokenBlacklist.js        # ✅ Existing
├── controllers/                 # Request handlers
│   ├── patient-controllers/
│   │   ├── patientAuthController.js    # ✅ Existing
│   │   ├── patientProfileController.js  # ⚠️ To Create
│   │   ├── patientAppointmentController.js  # ⚠️ To Create
│   │   ├── patientDoctorController.js   # ⚠️ To Create
│   │   ├── patientPrescriptionController.js  # ⚠️ To Create
│   │   ├── patientOrderController.js   # ⚠️ To Create
│   │   ├── patientTransactionController.js  # ⚠️ To Create
│   │   ├── patientRequestController.js  # ⚠️ To Create
│   │   ├── patientReviewController.js  # ⚠️ To Create
│   │   └── patientSupportController.js # ⚠️ To Create
│   ├── doctor-controllers/
│   │   ├── doctorAuthController.js     # ✅ Existing
│   │   ├── doctorProfileController.js   # ⚠️ To Create
│   │   ├── doctorDashboardController.js # ⚠️ To Create
│   │   ├── doctorPatientController.js   # ⚠️ To Create
│   │   ├── doctorConsultationController.js  # ⚠️ To Create
│   │   ├── doctorPrescriptionController.js  # ⚠️ To Create
│   │   ├── doctorAppointmentController.js  # ⚠️ To Create
│   │   ├── doctorSessionController.js    # ⚠️ To Create
│   │   ├── doctorQueueController.js     # ⚠️ To Create
│   │   ├── doctorWalletController.js    # ⚠️ To Create
│   │   └── doctorSupportController.js   # ⚠️ To Create
│   ├── pharmacy-controllers/
│   │   ├── pharmacyAuthController.js    # ✅ Existing
│   │   ├── pharmacyProfileController.js  # ⚠️ To Create
│   │   ├── pharmacyOrderController.js    # ⚠️ To Create
│   │   ├── pharmacyMedicineController.js # ⚠️ To Create
│   │   ├── pharmacyPatientController.js # ⚠️ To Create
│   │   ├── pharmacyRequestOrderController.js  # ⚠️ To Create
│   │   ├── pharmacyServiceController.js  # ⚠️ To Create
│   │   ├── pharmacyWalletController.js   # ⚠️ To Create
│   │   └── pharmacySupportController.js  # ⚠️ To Create
│   ├── laboratory-controllers/
│   │   ├── laboratoryAuthController.js  # ✅ Existing
│   │   ├── laboratoryProfileController.js  # ⚠️ To Create
│   │   ├── laboratoryOrderController.js  # ⚠️ To Create
│   │   ├── laboratoryTestController.js   # ⚠️ To Create
│   │   ├── laboratoryReportController.js # ⚠️ To Create
│   │   ├── laboratoryPatientController.js  # ⚠️ To Create
│   │   ├── laboratoryRequestOrderController.js  # ⚠️ To Create
│   │   ├── laboratoryWalletController.js  # ⚠️ To Create
│   │   └── laboratorySupportController.js # ⚠️ To Create
│   └── admin-controllers/
│       ├── adminAuthController.js        # ✅ Existing
│       ├── adminDashboardController.js  # ⚠️ To Create
│       ├── adminUserController.js        # ✅ Existing
│       ├── adminProviderController.js   # ✅ Existing
│       ├── adminRequestController.js     # ⚠️ To Create
│       ├── adminAppointmentController.js # ⚠️ To Create
│       ├── adminOrderController.js       # ⚠️ To Create
│       ├── adminInventoryController.js   # ⚠️ To Create
│       ├── adminWalletController.js      # ⚠️ To Create
│       ├── adminSettingsController.js    # ⚠️ To Create
│       └── adminSupportController.js     # ⚠️ To Create
├── routes/                      # API routes
│   ├── patient-routes/
│   │   ├── auth.routes.js       # ✅ Existing
│   │   ├── profile.routes.js    # ⚠️ To Create
│   │   ├── appointment.routes.js # ⚠️ To Create
│   │   ├── doctor.routes.js    # ⚠️ To Create
│   │   ├── prescription.routes.js  # ⚠️ To Create
│   │   ├── order.routes.js      # ⚠️ To Create
│   │   ├── transaction.routes.js  # ⚠️ To Create
│   │   ├── request.routes.js    # ⚠️ To Create
│   │   ├── review.routes.js     # ⚠️ To Create
│   │   └── support.routes.js    # ⚠️ To Create
│   ├── doctor-routes/
│   │   ├── auth.routes.js       # ✅ Existing
│   │   ├── profile.routes.js    # ⚠️ To Create
│   │   ├── dashboard.routes.js  # ⚠️ To Create
│   │   ├── patient.routes.js    # ⚠️ To Create
│   │   ├── consultation.routes.js  # ⚠️ To Create
│   │   ├── prescription.routes.js  # ⚠️ To Create
│   │   ├── appointment.routes.js  # ⚠️ To Create
│   │   ├── session.routes.js    # ⚠️ To Create
│   │   ├── queue.routes.js      # ⚠️ To Create
│   │   ├── wallet.routes.js     # ⚠️ To Create
│   │   └── support.routes.js    # ⚠️ To Create
│   ├── pharmacy-routes/
│   │   ├── auth.routes.js       # ✅ Existing
│   │   ├── profile.routes.js    # ⚠️ To Create
│   │   ├── order.routes.js      # ⚠️ To Create
│   │   ├── medicine.routes.js   # ⚠️ To Create
│   │   ├── patient.routes.js    # ⚠️ To Create
│   │   ├── request-order.routes.js  # ⚠️ To Create
│   │   ├── service.routes.js    # ⚠️ To Create
│   │   ├── wallet.routes.js     # ⚠️ To Create
│   │   └── support.routes.js    # ⚠️ To Create
│   ├── laboratory-routes/
│   │   ├── auth.routes.js       # ✅ Existing
│   │   ├── profile.routes.js    # ⚠️ To Create
│   │   ├── order.routes.js      # ⚠️ To Create
│   │   ├── test.routes.js       # ⚠️ To Create
│   │   ├── report.routes.js     # ⚠️ To Create
│   │   ├── patient.routes.js    # ⚠️ To Create
│   │   ├── request-order.routes.js  # ⚠️ To Create
│   │   ├── wallet.routes.js     # ⚠️ To Create
│   │   └── support.routes.js    # ⚠️ To Create
│   └── admin-routes/
│       ├── auth.routes.js       # ✅ Existing
│       ├── dashboard.routes.js # ⚠️ To Create
│       ├── users.routes.js      # ✅ Existing
│       ├── providers.routes.js  # ✅ Existing
│       ├── request.routes.js    # ⚠️ To Create
│       ├── appointment.routes.js  # ⚠️ To Create
│       ├── order.routes.js      # ⚠️ To Create
│       ├── inventory.routes.js  # ⚠️ To Create
│       ├── wallet.routes.js     # ⚠️ To Create
│       ├── settings.routes.js   # ⚠️ To Create
│       └── support.routes.js    # ⚠️ To Create
├── services/                    # Business logic services
│   ├── emailService.js          # ✅ Existing
│   ├── smsService.js            # ✅ Existing
│   ├── loginOtpService.js       # ✅ Existing
│   ├── passwordResetService.js  # ✅ Existing
│   ├── profileService.js        # ✅ Existing
│   ├── adminNotificationService.js  # ✅ Existing
│   ├── paymentService.js        # ⚠️ To Create (Razorpay integration)
│   ├── fileUploadService.js     # ⚠️ To Create (Cloudinary)
│   ├── pdfService.js             # ⚠️ To Create (Prescription/Report PDF)
│   ├── notificationService.js   # ⚠️ To Create (Push notifications)
│   └── realtimeService.js        # ⚠️ To Create (Socket.IO helpers)
├── middleware/
│   ├── authMiddleware.js         # ✅ Existing
│   ├── asyncHandler.js           # ✅ Existing
│   ├── rateLimiter.js            # ✅ Existing
│   └── validationMiddleware.js  # ✅ Existing
├── utils/
│   ├── constants.js             # ✅ Existing
│   ├── getModelForRole.js       # ✅ Existing
│   ├── tokenService.js          # ✅ Existing
│   ├── otpService.js            # ✅ Existing
│   └── locationUtils.js         # ✅ Existing
├── server.js                    # Main server file
└── .env                         # Environment variables

```

---

## 📝 Implementation Steps

### Step 1: Create All Database Models ✅
- [x] Patient, Doctor, Pharmacy, Laboratory, Admin (Existing)
- [ ] Appointment Model
- [ ] Consultation Model
- [ ] Prescription Model
- [ ] Order Model
- [ ] LabReport Model
- [ ] Transaction Model
- [ ] WalletTransaction Model
- [ ] WithdrawalRequest Model
- [ ] Request Model
- [ ] Session Model
- [ ] Review Model
- [ ] Hospital Model
- [ ] Specialty Model
- [ ] Medicine Model
- [ ] Test Model
- [ ] PharmacyService Model
- [ ] SupportTicket Model
- [ ] AdminSettings Model

### Step 2: Create All Controllers ✅
- [x] Auth Controllers (All modules - Existing)
- [ ] Patient Controllers (Profile, Appointments, Doctors, Prescriptions, Orders, Transactions, Requests, Reviews, Support)
- [ ] Doctor Controllers (Profile, Dashboard, Patients, Consultations, Prescriptions, Appointments, Sessions, Queue, Wallet, Support)
- [ ] Pharmacy Controllers (Profile, Orders, Medicines, Patients, Request Orders, Services, Wallet, Support)
- [ ] Laboratory Controllers (Profile, Orders, Tests, Reports, Patients, Request Orders, Wallet, Support)
- [ ] Admin Controllers (Dashboard, Requests, Appointments, Orders, Inventory, Wallet, Settings, Support)

### Step 3: Create All Routes ✅
- [x] Auth Routes (All modules - Existing)
- [ ] Patient Routes (All feature routes)
- [ ] Doctor Routes (All feature routes)
- [ ] Pharmacy Routes (All feature routes)
- [ ] Laboratory Routes (All feature routes)
- [ ] Admin Routes (All feature routes)

### Step 4: Create Services ✅
- [x] Email Service (Existing)
- [x] SMS Service (Existing)
- [x] OTP Service (Existing)
- [ ] Payment Service (Razorpay)
- [ ] File Upload Service (Cloudinary)
- [ ] PDF Service (Prescription/Report generation)
- [ ] Notification Service (Push notifications)
- [ ] Real-time Service (Socket.IO helpers)

### Step 5: Set Up Real-time with Socket.IO ✅
- [ ] Socket.IO server setup
- [ ] Real-time appointment updates
- [ ] Real-time order status updates
- [ ] Real-time request status updates
- [ ] Real-time notification system

### Step 6: Update Server.js ✅
- [ ] Add all route imports
- [ ] Set up Socket.IO
- [ ] Add error handling
- [ ] Add middleware

### Step 7: Update Environment Variables ✅
- [ ] Complete .env.example with all required variables

---

## 🔑 Key Features to Implement

### 1. Authentication & Authorization
- ✅ OTP-based login (Patient, Doctor, Pharmacy, Laboratory)
- ✅ Email/Password login (Admin)
- ✅ JWT token generation & refresh
- ✅ Token blacklisting on logout
- ✅ Role-based access control

### 2. Real-time Updates
- [ ] Socket.IO for live updates
- [ ] Appointment queue updates
- [ ] Order status changes
- [ ] Request status updates
- [ ] Notification system

### 3. Payment Integration
- [ ] Razorpay integration
- [ ] Payment webhooks
- [ ] Refund handling
- [ ] Transaction tracking

### 4. File Management
- [ ] Cloudinary integration
- [ ] Profile image upload
- [ ] Document upload (licenses, certificates)
- [ ] Prescription PDF storage
- [ ] Lab report PDF storage

### 5. PDF Generation
- [ ] Prescription PDF generation
- [ ] Lab report PDF generation
- [ ] Custom letterhead support

### 6. Notification System
- [ ] SMS notifications (OTP, reminders)
- [ ] Email notifications
- [ ] In-app notifications
- [ ] Push notifications

### 7. Search & Filtering
- [ ] Full-text search
- [ ] City/State filtering
- [ ] Advanced filtering options

### 8. Analytics & Reporting
- [ ] Dashboard statistics
- [ ] Revenue reports
- [ ] User analytics
- [ ] Provider performance metrics

---

## 📊 API Endpoints Summary

### Patient APIs (35+ endpoints)
- Authentication: 3 endpoints
- Profile: 2 endpoints
- Discovery: 5 endpoints
- Appointments: 5 endpoints
- Prescriptions: 3 endpoints
- Orders: 3 endpoints
- Transactions: 2 endpoints
- History: 4 endpoints
- Support: 4 endpoints
- Requests: 5 endpoints
- Reviews: 3 endpoints

### Doctor APIs (30+ endpoints)
- Authentication: 3 endpoints
- Profile: 2 endpoints
- Dashboard: 3 endpoints
- Patients: 3 endpoints
- Consultations: 4 endpoints
- Prescriptions: 3 endpoints
- Wallet: 4 endpoints
- Support: 3 endpoints
- Availability: 2 endpoints
- Sessions: 4 endpoints
- Queue: 4 endpoints
- Reviews: 2 endpoints

### Pharmacy APIs (25+ endpoints)
- Authentication: 3 endpoints
- Profile: 2 endpoints
- Orders: 3 endpoints
- Patients: 3 endpoints
- Medicines: 4 endpoints
- Wallet: 4 endpoints
- Dashboard: 1 endpoint
- Request Orders: 3 endpoints
- Prescriptions: 2 endpoints
- Support: 2 endpoints
- Services: 5 endpoints

### Laboratory APIs (25+ endpoints)
- Authentication: 3 endpoints
- Profile: 2 endpoints
- Orders: 3 endpoints
- Tests: 4 endpoints
- Reports: 4 endpoints
- Patients: 4 endpoints
- Wallet: 4 endpoints
- Dashboard: 1 endpoint
- Request Orders: 4 endpoints
- Requests: 2 endpoints
- Support: 2 endpoints

### Admin APIs (45+ endpoints)
- Authentication: 2 endpoints
- Dashboard: 1 endpoint
- Users: 4 endpoints
- Doctors: 4 endpoints
- Pharmacies: 4 endpoints
- Laboratories: 4 endpoints
- Verifications: 1 endpoint
- Activities: 1 endpoint
- Profile: 3 endpoints
- Settings: 2 endpoints
- Wallet: 4 endpoints
- Requests: 5 endpoints
- Appointments: 4 endpoints
- Orders: 3 endpoints
- Inventory: 4 endpoints
- Pharmacy Medicines: 3 endpoints

**Total: 160+ API endpoints**

---

## 🔄 Real-time Events

### Socket.IO Events to Implement

**Appointment Events:**
- `appointment:created` - New appointment created
- `appointment:updated` - Appointment status changed
- `appointment:cancelled` - Appointment cancelled
- `queue:updated` - Patient queue updated

**Order Events:**
- `order:created` - New order created
- `order:status:updated` - Order status changed
- `order:confirmed` - Order confirmed by provider

**Request Events:**
- `request:created` - New request created
- `request:accepted` - Request accepted by admin
- `request:responded` - Admin responded to request
- `request:confirmed` - Request confirmed by patient

**Notification Events:**
- `notification:new` - New notification
- `notification:read` - Notification read

---

## 🗄️ Database Models Details

### Core Models
1. **Appointment** - Patient appointments with doctors
2. **Consultation** - Doctor consultations with patients
3. **Prescription** - Prescriptions generated by doctors
4. **Order** - Pharmacy/Lab orders
5. **LabReport** - Laboratory test reports
6. **Transaction** - Payment transactions
7. **WalletTransaction** - Wallet transactions
8. **WithdrawalRequest** - Withdrawal requests
9. **Request** - Patient requests for medicines/tests
10. **Session** - Doctor sessions with tokens
11. **Review** - Patient reviews for doctors
12. **Hospital** - Hospital information
13. **Specialty** - Medical specialties
14. **Medicine** - Pharmacy medicines
15. **Test** - Laboratory tests
16. **PharmacyService** - Pharmacy services
17. **SupportTicket** - Support tickets
18. **AdminSettings** - Admin settings

---

## 🚀 Implementation Priority

### Phase 1: Core Models & Controllers (High Priority)
1. Create all database models
2. Create all controllers with basic CRUD operations
3. Create all routes
4. Update server.js

### Phase 2: Services & Real-time (Medium Priority)
1. Payment service
2. File upload service
3. PDF generation service
4. Socket.IO setup
5. Real-time events

### Phase 3: Advanced Features (Low Priority)
1. Analytics & reporting
2. Advanced search
3. Notification system
4. Performance optimization

---

## ✅ Completion Checklist

- [ ] All models created
- [ ] All controllers created
- [ ] All routes created
- [ ] All services created
- [ ] Socket.IO configured
- [ ] Real-time events implemented
- [ ] Payment integration complete
- [ ] File upload working
- [ ] PDF generation working
- [ ] Environment variables documented
- [ ] Server.js updated
- [ ] Error handling complete
- [ ] Validation complete
- [ ] Testing complete

---

## 📝 Notes

1. **No GPS/Location Tracking**: Location is stored as simple text fields only (city, state, postalCode)
2. **OTP-based Login**: Patient, Doctor, Pharmacy, Laboratory use OTP (no passwords)
3. **Admin Password Login**: Admin uses email/password authentication
4. **Real-time Updates**: Socket.IO for live updates
5. **Mobile-First**: Backend should support mobile-first frontend
6. **MVC Structure**: Strict MVC pattern followed
7. **RESTful APIs**: All APIs follow RESTful conventions

---

**Last Updated**: January 2025  
**Status**: In Progress

