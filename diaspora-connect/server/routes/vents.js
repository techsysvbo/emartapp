const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const { ventLimiter } = require('../middleware/rateLimiter');
const VentPost = require('../models/VentPost');

// GET /api/vents — authenticated users only, never public
router.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await VentPost.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: 'author',
        select: 'name avatarUrl',
        // The route strips author data if isAnonymous=true
      });

    // Never leak author info for anonymous posts
    const sanitised = posts.map((p) => {
      const obj = p.toObject();
      if (obj.isAnonymous) {
        obj.author = null;
      }
      return obj;
    });

    res.json(sanitised);
  } catch (err) { next(err); }
});

// POST /api/vents — rate-limited to 5/day
router.post(
  '/',
  auth,
  ventLimiter,
  [body('content').trim().notEmpty().isLength({ max: 3000 }).withMessage('Content required (max 3000 chars)')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { content, isAnonymous = true } = req.body;
      const post = await VentPost.create({
        author: req.user._id,
        content,
        isAnonymous: Boolean(isAnonymous),
      });

      const obj = post.toObject();
      if (obj.isAnonymous) obj.author = null;
      res.status(201).json(obj);
    } catch (err) { next(err); }
  }
);

// POST /api/vents/:id/flag — report a vent post
router.post('/:id/flag', auth, async (req, res, next) => {
  try {
    const post = await VentPost.findById(req.params.id);
    if (!post || post.status === 'removed') return res.status(404).json({ error: 'Not found' });

    const alreadyFlagged = post.flags.some((f) => f.equals(req.user._id));
    if (alreadyFlagged) return res.status(400).json({ error: 'Already flagged' });

    post.flags.push(req.user._id);
    // pre-save hook auto-hides if flags >= 3
    await post.save();

    res.json({ message: 'Flagged successfully', flags: post.flags.length, status: post.status });
  } catch (err) { next(err); }
});

// PATCH /api/vents/:id/moderate — admin only
router.patch('/:id/moderate', auth, adminOnly, async (req, res, next) => {
  try {
    const { status, modNote } = req.body;
    const post = await VentPost.findByIdAndUpdate(
      req.params.id,
      { status, modNote: modNote || '' },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (err) { next(err); }
});

module.exports = router;
