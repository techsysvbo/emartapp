const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');

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
    socket.on('dm:send', async ({ recipientId, content }) => {
      if (!content || !recipientId) return;
      try {
        // Persist to database for history and offline delivery
        const saved = await Message.create({
          sender: userId,
          recipient: recipientId,
          content: String(content).slice(0, 2000),
        });

        const payload = {
          _id: saved._id,
          senderId: userId,
          senderName: socket.user.name,
          senderAvatar: socket.user.avatarUrl,
          content: saved.content,
          createdAt: saved.createdAt,
        };
        io.to(`user:${recipientId}`).emit('dm:receive', payload);
        // Echo back to sender so they see it in multi-device scenarios
        socket.emit('dm:receive', payload);
      } catch (err) {
        socket.emit('dm:error', { error: 'Failed to send message' });
      }
    });

    // ── Group Chat ───────────────────────────────────────────────────────────
    socket.on('group:join', async (groupId) => {
      try {
        const group = await Group.findById(groupId).select('members');
        if (!group) return;
        const isMember = group.members.some((m) => m.equals(userId));
        if (isMember) socket.join(`group:${groupId}`);
      } catch { /* ignore */ }
    });

    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('group:message', async ({ groupId, content }) => {
      if (!content || !groupId) return;
      try {
        // Verify membership before broadcasting
        const group = await Group.findById(groupId).select('members');
        if (!group) return;
        const isMember = group.members.some((m) => m.equals(userId));
        if (!isMember) return;

        io.to(`group:${groupId}`).emit('group:message', {
          groupId,
          senderId: userId,
          senderName: socket.user.name,
          senderAvatar: socket.user.avatarUrl,
          content: String(content).slice(0, 3000),
          createdAt: new Date(),
        });
      } catch { /* ignore */ }
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
