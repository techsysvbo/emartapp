const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');

// GET /api/messages/:userId — conversation thread
router.get('/:userId', auth, async (req, res, next) => {
  try {
    const other = new mongoose.Types.ObjectId(req.params.userId);
    const me = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: me, recipient: other, deletedBySender: false },
        { sender: other, recipient: me, deletedByRecipient: false },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatarUrl')
      .populate('recipient', 'name avatarUrl');

    // Mark unread messages as read
    await Message.updateMany(
      { sender: other, recipient: me, readAt: null },
      { readAt: new Date() }
    );

    res.json(messages);
  } catch (err) { next(err); }
});

// POST /api/messages/:userId — send a DM
router.post(
  '/:userId',
  auth,
  [body('content').trim().notEmpty().isLength({ max: 2000 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const msg = await Message.create({
        sender: req.user._id,
        recipient: req.params.userId,
        content: req.body.content,
      });

      const populated = await msg.populate('sender', 'name avatarUrl');
      res.status(201).json(populated);
    } catch (err) { next(err); }
  }
);

// DELETE /api/messages/:id — soft delete for sender or recipient
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Not found' });

    if (msg.sender.equals(req.user._id)) msg.deletedBySender = true;
    else if (msg.recipient.equals(req.user._id)) msg.deletedByRecipient = true;
    else return res.status(403).json({ error: 'Not authorised' });

    await msg.save();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// GET /api/messages — list recent conversations (inbox)
router.get('/', auth, async (req, res, next) => {
  try {
    const me = req.user._id;
    // Find the most recent message per conversation partner
    const threads = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: me }, { recipient: me }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', me] }, '$recipient', '$sender'],
          },
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: { $cond: [{ $and: [{ $eq: ['$recipient', me] }, { $eq: ['$readAt', null] }] }, 1, 0] },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 30 },
    ]);

    res.json(threads);
  } catch (err) { next(err); }
});

module.exports = router;
