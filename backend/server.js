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

// Auth Routes
app.use('/api/patients/auth', require('./routes/patient-routes/auth.routes'));
app.use('/api/doctors/auth', require('./routes/doctor-routes/auth.routes'));
app.use('/api/laboratories/auth', require('./routes/laboratory-routes/auth.routes'));
app.use('/api/pharmacies/auth', require('./routes/pharmacy-routes/auth.routes'));
app.use('/api/admin/auth', require('./routes/admin-routes/auth.routes'));

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