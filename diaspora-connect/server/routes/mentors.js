const router = require('express').Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/mentors — browse mentors, filterable
router.get('/', auth, async (req, res, next) => {
  try {
    const { industry, educationLevel, countryOfOrigin, countryOfResidence, q, page = 1, limit = 20 } = req.query;
    const filter = { isMentor: true, isBanned: false };
    if (industry) filter.industry = industry;
    if (educationLevel) filter.educationLevel = educationLevel;
    if (countryOfOrigin) filter.countryOfOrigin = countryOfOrigin;
    if (countryOfResidence) filter.countryOfResidence = countryOfResidence;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { profession: new RegExp(q, 'i') },
        { mentorBio: new RegExp(q, 'i') },
      ];
    }

    const mentors = await User.find(filter)
      .select('name profession industry educationLevel fieldOfStudy countryOfOrigin countryOfResidence avatarUrl mentorBio')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json(mentors);
  } catch (err) { next(err); }
});

// PATCH /api/mentors/enroll — opt in/out as mentor
router.patch('/enroll', auth, async (req, res, next) => {
  try {
    const { isMentor, mentorBio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isMentor: Boolean(isMentor), mentorBio: mentorBio || '' },
      { new: true }
    );
    res.json({ isMentor: user.isMentor, mentorBio: user.mentorBio });
  } catch (err) { next(err); }
});

module.exports = router;
