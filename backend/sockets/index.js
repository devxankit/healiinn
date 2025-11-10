const jwt = require('jsonwebtoken');

const SESSION_ROOM_PREFIX = 'session:';

const getSessionRoom = (sessionId) => `${SESSION_ROOM_PREFIX}${sessionId}`;

const parseAuthToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { id: payload.id, role: payload.role };
  } catch (error) {
    return null;
  }
};

const registerSockets = (io) => {
  io.on('connection', (socket) => {
    const authToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    const user = parseAuthToken(authToken);

    socket.data.user = user;

    socket.on('session:join', (sessionId) => {
      if (!sessionId) {
        return;
      }
      socket.join(getSessionRoom(sessionId));
      socket.emit('session:joined', { sessionId });
    });

    socket.on('session:leave', (sessionId) => {
      if (!sessionId) {
        return;
      }
      socket.leave(getSessionRoom(sessionId));
      socket.emit('session:left', { sessionId });
    });

    socket.on('session:ping', (sessionId) => {
      socket.emit('session:pong', { sessionId, timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      // no-op for now; hooks kept for future auditing
    });
  });
};

module.exports = registerSockets;

