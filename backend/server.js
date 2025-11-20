const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const os = require('os');
require('dotenv').config();

const connectDB = require('./config/db');
const { redis, pub, sub, connectRedis, isRedisEnabled } = require('./config/redis');
const registerSockets = require('./sockets');
const { initWorkers, scheduleRecurringJobs } = require('./services/jobQueue');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Middleware
app.use(helmet()); // Security headers (includes XSS protection)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies with size limit
app.use(cookieParser()); // Parse cookies
app.use(rateLimiter); // General rate limiting

// Connect to database
connectDB();

// Routes
app.use('/api/patients/auth', require('./routes/patient-routes/auth.routes'));
app.use('/api/doctors/auth', require('./routes/doctor-routes/auth.routes'));
app.use('/api/doctors/dashboard', require('./routes/doctor-routes/dashboard.routes'));
app.use('/api/doctors/appointments', require('./routes/doctor-routes/appointments.routes'));
app.use('/api/doctors/consultations', require('./routes/doctor-routes/consultations.routes'));
app.use('/api/doctors/prescriptions', require('./routes/doctor-routes/prescriptions.routes'));
app.use('/api/doctors/availability', require('./routes/doctor-routes/availability.routes'));
app.use('/api/doctors/patients', require('./routes/doctor-routes/patients.routes'));
app.use('/api/doctors/reviews', require('./routes/doctor-routes/reviews.routes'));
app.use('/api/doctors/wallet', require('./routes/doctor-routes/wallet.routes'));
app.use('/api/doctors/transactions', require('./routes/doctor-routes/transaction.routes'));
app.use('/api/laboratories/auth', require('./routes/laboratory-routes/auth.routes'));
app.use('/api/laboratories/dashboard', require('./routes/laboratory-routes/dashboard.routes'));
app.use('/api/laboratories/patients', require('./routes/laboratory-routes/patient.routes'));
app.use('/api/laboratories/reviews', require('./routes/laboratory-routes/review.routes'));
app.use('/api/laboratories/reports', require('./routes/laboratory-routes/report.routes'));
app.use('/api/pharmacies/auth', require('./routes/pharmacy-routes/auth.routes'));
app.use('/api/pharmacies/dashboard', require('./routes/pharmacy-routes/dashboard.routes'));
app.use('/api/pharmacies/patients', require('./routes/pharmacy-routes/patient.routes'));
app.use('/api/pharmacies/reviews', require('./routes/pharmacy-routes/review.routes'));
app.use('/api/pharmacies/reports', require('./routes/pharmacy-routes/report.routes'));
app.use('/api/admin/auth', require('./routes/admin-routes/auth.routes'));
app.use('/api/admin/approvals', require('./routes/admin-routes/approval.routes'));
app.use('/api/admin/settings', require('./routes/admin-routes/settings.routes'));
app.use('/api/admin/activation', require('./routes/admin-routes/activation.routes'));
app.use('/api/admin/dashboard', require('./routes/admin-routes/dashboard.routes'));
app.use('/api/admin/wallet', require('./routes/admin-routes/wallet.routes'));
app.use('/api/admin/transactions', require('./routes/admin-routes/transaction.routes'));
app.use('/api/payments', require('./routes/payment-routes/payment.routes'));
app.use('/api/appointments', require('./routes/appointment-routes/appointment.routes'));
app.use('/api/consultations', require('./routes/appointment-routes/consultation.routes'));
app.use('/api/prescriptions', require('./routes/appointment-routes/prescription.routes'));
app.use('/api/labs', require('./routes/laboratory-routes/lab.routes'));
app.use('/api/pharmacy', require('./routes/pharmacy-routes/pharmacy.routes'));
app.use('/api/patients', require('./routes/patient-routes/transaction.routes'));
app.use('/api/laboratories/wallet', require('./routes/laboratory-routes/wallet.routes'));
app.use('/api/laboratories/transactions', require('./routes/laboratory-routes/transaction.routes'));
app.use('/api/pharmacies/wallet', require('./routes/pharmacy-routes/wallet.routes'));
app.use('/api/pharmacies/transactions', require('./routes/pharmacy-routes/transaction.routes'));
app.use('/api/reports', require('./routes/report-routes/report.routes'));
app.use('/api/reviews', require('./routes/review-routes/review.routes'));
app.use('/api/discovery', require('./routes/discovery-routes/discovery.routes'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Healiinn Backend API',
    status: 'running',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes will be added here
// Example: app.use('/api/v1/auth', require('./routes/v1/auth.routes'));

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

const allowedSocketOrigins = (process.env.SOCKET_CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedSocketOrigins.length ? allowedSocketOrigins : '*',
    credentials: true,
  },
});

app.set('io', io);
app.set('redis', redis);

registerSockets(io);

if (isRedisEnabled && redis && pub && sub) {
  connectRedis()
    .then(() => {
      io.adapter(createAdapter(pub, sub));
      initWorkers(io);
      scheduleRecurringJobs().catch((error) => {
        console.error('Failed to schedule recurring jobs', error);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize Redis adapter', error);
    });
} else {
  console.warn('[Redis] Disabled - sockets running without Redis adapter.');
}

// Listen on all network interfaces (0.0.0.0) to allow network access
server.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  // Get localhost address
  addresses.push(`http://localhost:${PORT}`);
  addresses.push(`http://127.0.0.1:${PORT}`);
  
  // Get network IP addresses
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      // Skip internal (loopback) and non-IPv4 addresses
      // Handle both string 'IPv4' and number 4 (Windows compatibility)
      const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
      if (isIPv4 && !iface.internal) {
        const address = `http://${iface.address}:${PORT}`;
        // Avoid duplicates
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