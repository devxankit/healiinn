const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Connect to database
connectDB();

// Routes
app.use('/api/patients/auth', require('./routes/patient-routes/auth.routes'));
app.use('/api/doctors/auth', require('./routes/doctor-routes/auth.routes'));
app.use('/api/laboratories/auth', require('./routes/laboratory-routes/auth.routes'));
app.use('/api/pharmacies/auth', require('./routes/pharmacy-routes/auth.routes'));
app.use('/api/admin/auth', require('./routes/admin-routes/auth.routes'));
app.use('/api/admin/approvals', require('./routes/admin-routes/approval.routes'));
app.use('/api/payments', require('./routes/payment-routes/payment.routes'));

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

