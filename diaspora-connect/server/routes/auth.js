const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('countryOfOrigin').notEmpty().withMessage('Country of origin is required'),
    body('countryOfResidence').notEmpty().withMessage('Country of residence is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, email, password, countryOfOrigin, countryOfResidence,
              profession, industry, educationLevel, institution, fieldOfStudy, bio } = req.body;

      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const user = await User.create({
        name, email,
        passwordHash: password,     // pre-save hook hashes it
        countryOfOrigin, countryOfResidence,
        profession: profession || '',
        industry: industry || 'Other',
        educationLevel: educationLevel || 'Other',
        institution: institution || '',
        fieldOfStudy: fieldOfStudy || '',
        bio: bio || '',
      });

      res.status(201).json({ token: signToken(user._id), user });
    } catch (err) { next(err); }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      if (user.isBanned) return res.status(403).json({ error: 'Account suspended' });

      const match = await user.comparePassword(password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      user.lastSeen = new Date();
      await user.save();

      res.json({ token: signToken(user._id), user });
    } catch (err) { next(err); }
  }
);

module.exports = router;
