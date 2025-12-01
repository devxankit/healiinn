# Complete Backend Implementation Guide - Healiinn Healthcare Platform

## 📋 Overview

यह document complete backend implementation के लिए comprehensive guide है। सभी controllers, routes, services, और setup instructions यहाँ included हैं।

**Implementation Date**: January 2025  
**Tech Stack**: Node.js + Express.js + MongoDB + Socket.IO  
**Architecture**: MVC Pattern with Real-time Updates

---

## 🗂️ Complete File Structure

```
backend/
├── config/
│   ├── db.js                    # ✅ Existing
│   ├── redis.js                 # ✅ Existing
│   └── socket.js                # ⚠️ To Create
├── models/                      # ✅ All 18 models created
├── controllers/                 # ⚠️ 7/47 created
│   ├── patient-controllers/     # ⚠️ 1/9 created
│   ├── doctor-controllers/      # ⚠️ 0/10 created
│   ├── pharmacy-controllers/    # ⚠️ 0/8 created
│   ├── laboratory-controllers/  # ⚠️ 0/8 created
│   └── admin-controllers/       # ✅ 3/8 created
├── routes/                      # ⚠️ 7/37 created
│   ├── patient-routes/          # ⚠️ 1/9 created
│   ├── doctor-routes/           # ⚠️ 0/10 created
│   ├── pharmacy-routes/        # ⚠️ 0/8 created
│   ├── laboratory-routes/      # ⚠️ 0/8 created
│   └── admin-routes/           # ✅ 3/8 created
├── services/                    # ⚠️ 6/11 created
├── middleware/                  # ✅ All existing
├── utils/                       # ✅ All existing
└── server.js                    # ⚠️ Partial

```

---

## 📝 Implementation Instructions

### Step 1: Create All Controllers

सभी controllers को create करने के लिए, नीचे दिए गए patterns follow करें:

#### Controller Pattern:
```javascript
const asyncHandler = require('../../middleware/asyncHandler');
const Model = require('../../models/Model');
const { ROLES } = require('../../utils/constants');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSearchFilter = (search, fields = []) => {
  if (!search || !fields.length) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

// Controller functions
exports.functionName = asyncHandler(async (req, res) => {
  // Implementation
  return res.status(200).json({
    success: true,
    data: result,
  });
});
```

---

## 🔑 Key Controllers to Create

### Patient Controllers (9 files)

#### 1. patientProfileController.js ✅ (Created)
- `getPatientProfile` - GET /api/patients/auth/me
- `updatePatientProfile` - PUT /api/patients/auth/me

#### 2. patientAppointmentController.js
```javascript
const asyncHandler = require('../../middleware/asyncHandler');
const Appointment = require('../../models/Appointment');
const Session = require('../../models/Session');
const Doctor = require('../../models/Doctor');

// GET /api/patients/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, date, doctor } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { patientId: id };
  if (status) filter.status = status;
  if (date) filter.appointmentDate = new Date(date);
  if (doctor) filter.doctorId = doctor;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('doctorId', 'firstName lastName specialization profileImage')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: appointments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

// GET /api/patients/appointments/upcoming
exports.getUpcomingAppointments = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const appointments = await Appointment.find({
    patientId: id,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] },
  })
    .populate('doctorId', 'firstName lastName specialization profileImage')
    .sort({ appointmentDate: 1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: appointments,
  });
});

// POST /api/patients/appointments
exports.createAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { doctorId, appointmentDate, time, reason, appointmentType } = req.body;

  // Check if doctor exists and is approved
  const doctor = await Doctor.findById(doctorId);
  if (!doctor || doctor.status !== 'approved') {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found or not approved',
    });
  }

  // Find or create session
  const sessionDate = new Date(appointmentDate);
  let session = await Session.findOne({
    doctorId,
    date: { $gte: new Date(sessionDate.setHours(0, 0, 0, 0)), $lt: new Date(sessionDate.setHours(23, 59, 59, 999)) },
  });

  if (!session) {
    // Create new session
    const startTime = sessionDate.setHours(9, 0, 0, 0);
    const endTime = sessionDate.setHours(17, 0, 0, 0);
    const duration = (endTime - startTime) / (1000 * 60); // minutes
    const avgConsultation = doctor.averageConsultationMinutes || 20;
    const maxTokens = Math.floor(duration / avgConsultation);

    session = await Session.create({
      doctorId,
      date: sessionDate,
      sessionStartTime: '09:00',
      sessionEndTime: '17:00',
      maxTokens: maxTokens,
      status: 'scheduled',
    });
  }

  // Check if session has available tokens
  if (session.currentToken >= session.maxTokens) {
    return res.status(400).json({
      success: false,
      message: 'No available slots for this session',
    });
  }

  // Create appointment
  const tokenNumber = session.currentToken + 1;
  const appointment = await Appointment.create({
    patientId: id,
    doctorId,
    sessionId: session._id,
    appointmentDate: new Date(appointmentDate),
    time,
    reason,
    appointmentType: appointmentType || 'New',
    tokenNumber,
    fee: doctor.consultationFee || 0,
  });

  // Update session
  session.currentToken = tokenNumber;
  session.appointments.push(appointment._id);
  await session.save();

  // Emit real-time event
  // io.to(`doctor-${doctorId}`).emit('appointment:created', appointment);

  return res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: await Appointment.findById(appointment._id).populate('doctorId', 'firstName lastName specialization'),
  });
});

// PATCH /api/patients/appointments/:id
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;
  const updateData = req.body;

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId: id });
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed or cancelled appointment',
    });
  }

  Object.assign(appointment, updateData);
  await appointment.save();

  return res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    data: appointment,
  });
});

// DELETE /api/patients/appointments/:id
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({ _id: appointmentId, patientId: id });
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Appointment already completed or cancelled',
    });
  }

  appointment.status = 'cancelled';
  appointment.cancelledAt = new Date();
  await appointment.save();

  // Update session if exists
  if (appointment.sessionId) {
    const session = await Session.findById(appointment.sessionId);
    if (session) {
      session.currentToken = Math.max(0, session.currentToken - 1);
      await session.save();
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
  });
});
```

#### 3. patientDoctorController.js
```javascript
const asyncHandler = require('../../middleware/asyncHandler');
const Doctor = require('../../models/Doctor');
const Hospital = require('../../models/Hospital');
const Specialty = require('../../models/Specialty');
const Review = require('../../models/Review');

// GET /api/patients/doctors
exports.getDoctors = asyncHandler(async (req, res) => {
  const { search, specialty, city, state, rating } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { status: 'approved', isActive: true };
  
  if (specialty) filter.specialization = new RegExp(specialty.trim(), 'i');
  if (city) filter['clinicDetails.address.city'] = new RegExp(city.trim(), 'i');
  if (state) filter['clinicDetails.address.state'] = new RegExp(state.trim(), 'i');
  if (rating) filter.rating = { $gte: parseFloat(rating) };

  const searchFilter = buildSearchFilter(search, [
    'firstName',
    'lastName',
    'specialization',
    'clinicDetails.name',
  ]);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const [doctors, total] = await Promise.all([
    Doctor.find(finalFilter)
      .select('firstName lastName specialization profileImage consultationFee rating clinicDetails')
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: doctors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

// GET /api/patients/doctors/:id
exports.getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doctor = await Doctor.findById(id)
    .select('-password')
    .populate('clinicDetails.address');

  if (!doctor || doctor.status !== 'approved') {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  // Get reviews
  const reviews = await Review.find({ doctorId: id, status: 'approved' })
    .populate('patientId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: {
      doctor,
      reviews,
    },
  });
});
```

**Note**: Similar patterns for remaining controllers. See full implementation guide for complete code.

---

## 🔄 Complete Route Structure

### Patient Routes Example

#### routes/patient-routes/profile.routes.js
```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getPatientProfile,
  updatePatientProfile,
} = require('../../controllers/patient-controllers/patientProfileController');

router.get('/me', protect('patient'), getPatientProfile);
router.put('/me', protect('patient'), updatePatientProfile);

module.exports = router;
```

#### routes/patient-routes/appointment.routes.js
```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getAppointments,
  getUpcomingAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} = require('../../controllers/patient-controllers/patientAppointmentController');

router.get('/', protect('patient'), getAppointments);
router.get('/upcoming', protect('patient'), getUpcomingAppointments);
router.post('/', protect('patient'), createAppointment);
router.patch('/:id', protect('patient'), updateAppointment);
router.delete('/:id', protect('patient'), cancelAppointment);

module.exports = router;
```

---

## 🔌 Socket.IO Setup

### config/socket.js
```javascript
const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenService');
const { getModelForRole } = require('../utils/getModelForRole');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = await verifyAccessToken(token);
      const Model = getModelForRole(decoded.role);
      const user = await Model.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;

    // Join role-specific room
    socket.join(`${role}-${id}`);

    // Join general rooms
    if (role === 'doctor') {
      socket.join('doctors');
    } else if (role === 'pharmacy') {
      socket.join('pharmacies');
    } else if (role === 'laboratory') {
      socket.join('laboratories');
    } else if (role === 'admin') {
      socket.join('admins');
    }

    socket.on('disconnect', () => {
      console.log(`User ${id} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
```

---

## 🚀 Updated server.js

```javascript
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const os = require('os');
require('dotenv').config();

const connectDB = require('./config/db');
const rateLimiter = require('./middleware/rateLimiter');
const { initializeSocket } = require('./config/socket');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(rateLimiter);

// Connect to database
connectDB();

// Auth Routes
app.use('/api/patients/auth', require('./routes/patient-routes/auth.routes'));
app.use('/api/doctors/auth', require('./routes/doctor-routes/auth.routes'));
app.use('/api/laboratories/auth', require('./routes/laboratory-routes/auth.routes'));
app.use('/api/pharmacies/auth', require('./routes/pharmacy-routes/auth.routes'));
app.use('/api/admin/auth', require('./routes/admin-routes/auth.routes'));

// Patient Routes
app.use('/api/patients', require('./routes/patient-routes/profile.routes'));
app.use('/api/patients/appointments', require('./routes/patient-routes/appointment.routes'));
app.use('/api/patients/doctors', require('./routes/patient-routes/doctor.routes'));
app.use('/api/patients/prescriptions', require('./routes/patient-routes/prescription.routes'));
app.use('/api/patients/orders', require('./routes/patient-routes/order.routes'));
app.use('/api/patients/transactions', require('./routes/patient-routes/transaction.routes'));
app.use('/api/patients/requests', require('./routes/patient-routes/request.routes'));
app.use('/api/patients/reviews', require('./routes/patient-routes/review.routes'));
app.use('/api/patients/support', require('./routes/patient-routes/support.routes'));

// Doctor Routes
app.use('/api/doctors', require('./routes/doctor-routes/profile.routes'));
app.use('/api/doctors/dashboard', require('./routes/doctor-routes/dashboard.routes'));
app.use('/api/doctors/patients', require('./routes/doctor-routes/patient.routes'));
app.use('/api/doctors/consultations', require('./routes/doctor-routes/consultation.routes'));
app.use('/api/doctors/prescriptions', require('./routes/doctor-routes/prescription.routes'));
app.use('/api/doctors/appointments', require('./routes/doctor-routes/appointment.routes'));
app.use('/api/doctors/sessions', require('./routes/doctor-routes/session.routes'));
app.use('/api/doctors/queue', require('./routes/doctor-routes/queue.routes'));
app.use('/api/doctors/wallet', require('./routes/doctor-routes/wallet.routes'));
app.use('/api/doctors/support', require('./routes/doctor-routes/support.routes'));

// Pharmacy Routes
app.use('/api/pharmacy', require('./routes/pharmacy-routes/profile.routes'));
app.use('/api/pharmacy/orders', require('./routes/pharmacy-routes/order.routes'));
app.use('/api/pharmacy/medicines', require('./routes/pharmacy-routes/medicine.routes'));
app.use('/api/pharmacy/patients', require('./routes/pharmacy-routes/patient.routes'));
app.use('/api/pharmacy/request-orders', require('./routes/pharmacy-routes/request-order.routes'));
app.use('/api/pharmacy/services', require('./routes/pharmacy-routes/service.routes'));
app.use('/api/pharmacy/wallet', require('./routes/pharmacy-routes/wallet.routes'));
app.use('/api/pharmacy/support', require('./routes/pharmacy-routes/support.routes'));

// Laboratory Routes
app.use('/api/laboratory', require('./routes/laboratory-routes/profile.routes'));
app.use('/api/labs/leads', require('./routes/laboratory-routes/order.routes'));
app.use('/api/laboratory/tests', require('./routes/laboratory-routes/test.routes'));
app.use('/api/laboratory/reports', require('./routes/laboratory-routes/report.routes'));
app.use('/api/laboratory/patients', require('./routes/laboratory-routes/patient.routes'));
app.use('/api/laboratory/request-orders', require('./routes/laboratory-routes/request-order.routes'));
app.use('/api/laboratory/wallet', require('./routes/laboratory-routes/wallet.routes'));
app.use('/api/laboratory/support', require('./routes/laboratory-routes/support.routes'));

// Admin Routes
app.use('/api/admin', require('./routes/admin-routes/providers.routes'));
app.use('/api/admin', require('./routes/admin-routes/users.routes'));
app.use('/api/admin/dashboard', require('./routes/admin-routes/dashboard.routes'));
app.use('/api/admin/requests', require('./routes/admin-routes/request.routes'));
app.use('/api/admin/appointments', require('./routes/admin-routes/appointment.routes'));
app.use('/api/admin/orders', require('./routes/admin-routes/order.routes'));
app.use('/api/admin/inventory', require('./routes/admin-routes/inventory.routes'));
app.use('/api/admin/wallet', require('./routes/admin-routes/wallet.routes'));
app.use('/api/admin/settings', require('./routes/admin-routes/settings.routes'));
app.use('/api/admin/support', require('./routes/admin-routes/support.routes'));

// Public Routes
app.use('/api/pharmacies', require('./routes/patient-routes/pharmacy-discovery.routes'));
app.use('/api/hospitals', require('./routes/patient-routes/hospital.routes'));
app.use('/api/specialties', require('./routes/patient-routes/specialty.routes'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Healiinn Backend API',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  addresses.push(`http://localhost:${PORT}`);
  addresses.push(`http://127.0.0.1:${PORT}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
      if (isIPv4 && !iface.internal) {
        const address = `http://${iface.address}:${PORT}`;
        if (!addresses.includes(address)) {
          addresses.push(address);
        }
      }
    });
  });
  
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`\n📍 Available at:`);
  addresses.forEach((address) => {
    console.log(`   ${address}`);
  });
  console.log('');
});

module.exports = app;
```

---

## 📝 Complete .env.example

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healiinn?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Healiinn <your-email@gmail.com>
ADMIN_NOTIFICATION_EMAILS=admin1@example.com,admin2@example.com

# SMS Configuration (MSG91)
SMS_PROVIDER=MSG91
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=HEALIN
LOGIN_OTP_EXPIRY_MINUTES=10

# Password Reset Configuration
PASSWORD_RESET_OTP_EXPIRY_MINUTES=10
PASSWORD_RESET_MAX_ATTEMPTS=5
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=30

# Admin Registration
ADMIN_REGISTRATION_CODE=your-secure-code-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
PASSWORD_RESET_RATE_LIMIT_WINDOW_MS=3600000
PASSWORD_RESET_RATE_LIMIT_MAX=3
OTP_RATE_LIMIT_WINDOW_MS=300000
OTP_RATE_LIMIT_MAX=3

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Commission Rates
DOCTOR_COMMISSION_RATE=0.1
PHARMACY_COMMISSION_RATE=0.1
LABORATORY_COMMISSION_RATE=0.1

# Redis Configuration (for caching and queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
```

---

## 📊 Implementation Checklist

### Models ✅
- [x] All 18 models created

### Controllers ⚠️
- [ ] Patient Controllers (9 files)
- [ ] Doctor Controllers (10 files)
- [ ] Pharmacy Controllers (8 files)
- [ ] Laboratory Controllers (8 files)
- [ ] Admin Controllers (5 files)

### Routes ⚠️
- [ ] Patient Routes (9 files)
- [ ] Doctor Routes (10 files)
- [ ] Pharmacy Routes (8 files)
- [ ] Laboratory Routes (8 files)
- [ ] Admin Routes (5 files)

### Services ⚠️
- [ ] Payment Service (Razorpay)
- [ ] File Upload Service (Cloudinary)
- [ ] PDF Service
- [ ] Notification Service
- [ ] Real-time Service

### Setup ⚠️
- [ ] Socket.IO Configuration
- [ ] Server.js Updates
- [ ] Environment Variables

---

## 🎯 Next Steps

1. Create all remaining controllers following the patterns above
2. Create all routes files
3. Create missing services
4. Set up Socket.IO
5. Update server.js
6. Complete env.example
7. Test all endpoints
8. Deploy

---

**Last Updated**: January 2025  
**Status**: In Progress (35% Complete)

