const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const Group = require('../models/Group');
const User = require('../models/User');

// GET /api/groups — browse groups
router.get('/', auth, async (req, res, next) => {
  try {
    const { category, homeCountry, hostCountry, industry, educationLevel, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (homeCountry) filter.homeCountry = homeCountry;
    if (hostCountry) filter.hostCountry = hostCountry;
    if (industry) filter.industry = industry;
    if (educationLevel) filter.educationLevel = educationLevel;
    if (q) filter.$text = { $search: q };

    const groups = await Group.find(filter)
      .select('name description category homeCountry hostCountry region industry educationLevel avatarUrl members isPrivate')
      .sort({ 'members': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(groups);
  } catch (err) { next(err); }
});

// POST /api/groups — create a group
router.post(
  '/',
  auth,
  upload.single('avatar'),
  [body('name').trim().notEmpty().withMessage('Group name required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const {
        name, description, category, homeCountry, hostCountry, region,
        industry, profession, educationLevel, isPrivate,
      } = req.body;

      const group = await Group.create({
        name, description, category, homeCountry, hostCountry, region,
        industry: industry || '', profession: profession || '',
        educationLevel: educationLevel || '',
        avatarUrl: req.file ? await uploadToCloudinary(req.file.buffer) : '',
        creator: req.user._id,
        admins: [req.user._id],
        members: [req.user._id],
        isPrivate: isPrivate === 'true',
      });

      await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });
      res.status(201).json(group);
    } catch (err) { next(err); }
  }
);

// GET /api/groups/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name avatarUrl profession industry educationLevel')
      .populate('admins', 'name avatarUrl')
      .populate('posts.author', 'name avatarUrl');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) { next(err); }
});

// POST /api/groups/:id/join
router.post('/:id/join', auth, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const isMember = group.members.some((m) => m.equals(req.user._id));
    if (isMember) {
      group.members.pull(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $pull: { groups: group._id } });
    } else {
      group.members.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });
    }
    await group.save();
    res.json({ joined: !isMember, memberCount: group.members.length });
  } catch (err) { next(err); }
});

// POST /api/groups/:id/posts — post inside a group
router.post(
  '/:id/posts',
  auth,
  upload.single('image'),
  [body('content').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });

      const isMember = group.members.some((m) => m.equals(req.user._id));
      if (!isMember) return res.status(403).json({ error: 'Join the group first' });

      group.posts.push({
        author: req.user._id,
        content: req.body.content,
        imageUrl: req.file ? await uploadToCloudinary(req.file.buffer) : '',
      });
      await group.save();

      const updated = await Group.findById(group._id).populate('posts.author', 'name avatarUrl');
      res.status(201).json(updated.posts[updated.posts.length - 1]);
    } catch (err) { next(err); }
  }
);

module.exports = router;
