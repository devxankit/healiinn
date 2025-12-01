const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenService');
const { getModelForRole } = require('../utils/getModelForRole');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = await verifyAccessToken(token);
      const Model = getModelForRole(decoded.role);
      const user = await Model.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = { id: decoded.id, role: decoded.role, user };
      next();
    } catch (error) {
      console.error('Socket.IO authentication error:', error.message);
      next(new Error('Authentication error'));
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

