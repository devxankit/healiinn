const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenService');
const { getModelForRole } = require('../utils/getModelForRole');

let io;

const initializeSocket = (server) => {
  // Determine allowed origins
  const allowedOrigins = process.env.SOCKET_IO_CORS_ORIGIN 
    ? process.env.SOCKET_IO_CORS_ORIGIN.split(',').map(origin => origin.trim())
    : process.env.FRONTEND_URL 
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  // In development, allow all localhost origins
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  io = new Server(server, {
    cors: {
      origin: isDevelopment 
        ? (origin, callback) => {
            // Allow all localhost origins in development
            if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        : allowedOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
    allowEIO3: true, // Allow Engine.IO v3 clients
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  console.log('🔌 Socket.IO initialized with CORS origins:', isDevelopment ? 'All localhost origins (development)' : allowedOrigins);

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        console.warn('Socket.IO connection rejected: No token provided');
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify token format first
      if (typeof token !== 'string' || token.trim().length === 0) {
        console.warn('Socket.IO connection rejected: Invalid token format');
        return next(new Error('Authentication error: Invalid token format'));
      }

      const decoded = await verifyAccessToken(token);
      
      if (!decoded || !decoded.id || !decoded.role) {
        console.warn('Socket.IO connection rejected: Invalid token payload');
        return next(new Error('Authentication error: Invalid token payload'));
      }

      const Model = getModelForRole(decoded.role);
      
      if (!Model) {
        console.warn(`Socket.IO connection rejected: Invalid role (${decoded.role})`);
        return next(new Error('Authentication error: Invalid role'));
      }

      const user = await Model.findById(decoded.id).select('-password');

      if (!user) {
        console.warn(`Socket.IO connection rejected: User not found (${decoded.role}:${decoded.id})`);
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = { id: decoded.id, role: decoded.role, user };
      console.log(`✅ Socket.IO authentication successful: ${decoded.role}:${decoded.id}`);
      next();
    } catch (error) {
      // More specific error handling
      if (error.name === 'JsonWebTokenError') {
        console.warn('Socket.IO connection rejected: Invalid token format', {
          name: error.name,
          message: error.message,
        });
        return next(new Error('Authentication error: Invalid token'));
      }
      
      if (error.name === 'TokenExpiredError') {
        console.warn('Socket.IO connection rejected: Token expired', {
          name: error.name,
          message: error.message,
        });
        return next(new Error('Authentication error: Token expired'));
      }
      
      if (error.message?.includes('Token missing') || error.message?.includes('Token invalid')) {
        console.warn('Socket.IO connection rejected:', error.message);
        return next(error);
      }
      
      console.error('Socket.IO authentication error:', {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, user } = socket.user;

    console.log(`User connected: ${role} - ${id}`);

    // Join role-specific room
    socket.join(`${role}-${id}`);

    // Join general rooms for broadcasting
    if (role === 'doctor') {
      socket.join('doctors');
    } else if (role === 'pharmacy') {
      socket.join('pharmacies');
    } else if (role === 'laboratory') {
      socket.join('laboratories');
    } else if (role === 'admin') {
      socket.join('admins');
    } else if (role === 'patient') {
      socket.join('patients');
    }

    // Handle appointment events
    socket.on('appointment:subscribe', (appointmentId) => {
      socket.join(`appointment-${appointmentId}`);
    });

    socket.on('appointment:unsubscribe', (appointmentId) => {
      socket.leave(`appointment-${appointmentId}`);
    });

    // Handle order events
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order-${orderId}`);
    });

    socket.on('order:unsubscribe', (orderId) => {
      socket.leave(`order-${orderId}`);
    });

    // Handle request events
    socket.on('request:subscribe', (requestId) => {
      socket.join(`request-${requestId}`);
    });

    socket.on('request:unsubscribe', (requestId) => {
      socket.leave(`request-${requestId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${role} - ${id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

// Helper functions to emit events
const emitToUser = (userId, role, event, data) => {
  if (io) {
    io.to(`${role}-${userId}`).emit(event, data);
  }
};

const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRoom,
  emitToAll,
};

