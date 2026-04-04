const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const User = require('../models/User');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// PATCH /api/users/me
router.patch('/me', auth, async (req, res, next) => {
  try {
    const allowed = [
      'name', 'bio', 'profession', 'industry', 'educationLevel',
      'institution', 'fieldOfStudy', 'countryOfResidence',
      'isMentor', 'mentorBio',
    ];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (err) { next(err); }
});

// POST /api/users/me/avatar
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: req.file.path },
      { new: true }
    );
    res.json({ avatarUrl: user.avatarUrl });
  } catch (err) { next(err); }
});

// GET /api/users/:id  (public profile)
router.get('/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('groups', 'name avatarUrl category');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// POST /api/users/:id/follow
router.post('/:id/follow', auth, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target._id.equals(req.user._id)) return res.status(400).json({ error: 'Cannot follow yourself' });

    const isFollowing = target.followers.some((f) => f.equals(req.user._id));
    if (isFollowing) {
      target.followers.pull(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: target._id } });
    } else {
      target.followers.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: target._id } });
    }
    await target.save();
    res.json({ following: !isFollowing, followers: target.followers.length });
  } catch (err) { next(err); }
});

// GET /api/users — search/filter
router.get('/', auth, async (req, res, next) => {
  try {
    const { country, industry, educationLevel, isMentor, q, page = 1, limit = 20 } = req.query;
    const filter = { isBanned: false };
    if (country) filter.$or = [{ countryOfOrigin: country }, { countryOfResidence: country }];
    if (industry) filter.industry = industry;
    if (educationLevel) filter.educationLevel = educationLevel;
    if (isMentor === 'true') filter.isMentor = true;
    if (q) filter.$text = { $search: q };

    const users = await User.find(filter)
      .select('name profession industry educationLevel countryOfOrigin countryOfResidence avatarUrl isMentor')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) { next(err); }
});

module.exports = router;
