const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const Post = require('../models/Post');

// GET /api/posts — public feed (auth required)
router.get('/', auth, async (req, res, next) => {
  try {
    const { region, industry, country, tag, page = 1, limit = 20 } = req.query;
    const filter = { status: 'active' };
    if (region) filter.region = region;
    if (industry) filter.industry = industry;
    if (country) filter.country = country;
    if (tag) filter.tags = tag;

    const posts = await Post.find(filter)
      .populate('author', 'name avatarUrl profession industry countryOfOrigin countryOfResidence')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(posts);
  } catch (err) { next(err); }
});

// POST /api/posts
router.post(
  '/',
  auth,
  upload.single('image'),
  [body('content').trim().notEmpty().withMessage('Content is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { content, region, country, profession, industry, tags, group } = req.body;
      const imageUrl = req.file ? await uploadToCloudinary(req.file.buffer) : '';
      const post = await Post.create({
        author: req.user._id,
        content,
        imageUrl,
        region: region || '',
        country: country || '',
        profession: profession || '',
        industry: industry || '',
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        group: group || null,
      });

      const populated = await post.populate('author', 'name avatarUrl profession industry');
      res.status(201).json(populated);
    } catch (err) { next(err); }
  }
);

// POST /api/posts/:id/like
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.status !== 'active') return res.status(404).json({ error: 'Post not found' });

    const liked = post.likes.some((l) => l.equals(req.user._id));
    if (liked) post.likes.pull(req.user._id);
    else post.likes.push(req.user._id);
    await post.save();

    res.json({ liked: !liked, likes: post.likes.length });
  } catch (err) { next(err); }
});

// POST /api/posts/:id/comments
router.post(
  '/:id/comments',
  auth,
  [body('content').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post || post.status !== 'active') return res.status(404).json({ error: 'Post not found' });

      post.comments.push({ author: req.user._id, content: req.body.content });
      await post.save();

      const updated = await Post.findById(post._id)
        .populate('comments.author', 'name avatarUrl');
      res.status(201).json(updated.comments);
    } catch (err) { next(err); }
  }
);

// DELETE /api/posts/:id  (soft delete — author or admin only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.author.equals(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    post.status = 'removed';
    await post.save();
    res.json({ message: 'Post removed' });
  } catch (err) { next(err); }
});

module.exports = router;
