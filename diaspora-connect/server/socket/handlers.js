const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map(); // userId → socketId

const registerSocketHandlers = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user || user.isBanned) return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Notify others this user is online
    socket.broadcast.emit('user:online', { userId });

    // Join personal room for DMs
    socket.join(`user:${userId}`);

    // ── Direct Messages ─────────────────────────────────────────────────────
    socket.on('dm:send', ({ recipientId, content }) => {
      if (!content || !recipientId) return;
      const payload = {
        senderId: userId,
        senderName: socket.user.name,
        senderAvatar: socket.user.avatarUrl,
        content,
        createdAt: new Date(),
      };
      io.to(`user:${recipientId}`).emit('dm:receive', payload);
    });

    // ── Group Chat ───────────────────────────────────────────────────────────
    socket.on('group:join', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('group:message', ({ groupId, content }) => {
      if (!content || !groupId) return;
      io.to(`group:${groupId}`).emit('group:message', {
        groupId,
        senderId: userId,
        senderName: socket.user.name,
        senderAvatar: socket.user.avatarUrl,
        content,
        createdAt: new Date(),
      });
    });

    // ── Typing Indicators ────────────────────────────────────────────────────
    socket.on('typing:start', ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit('typing:start', { senderId: userId });
    });

    socket.on('typing:stop', ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit('typing:stop', { senderId: userId });
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
    });
  });
};

module.exports = registerSocketHandlers;
