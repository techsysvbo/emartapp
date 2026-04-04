const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const Event = require('../models/Event');

// GET /api/events
router.get('/', auth, async (req, res, next) => {
  try {
    const { country, region, industry, eventType, page = 1, limit = 20 } = req.query;
    const filter = { status: { $in: ['upcoming', 'ongoing'] }, startDate: { $gte: new Date() } };
    if (country) filter.country = country;
    if (region) filter.region = region;
    if (industry) filter.industry = industry;
    if (eventType) filter.eventType = eventType;

    const events = await Event.find(filter)
      .populate('organizer', 'name avatarUrl')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(events);
  } catch (err) { next(err); }
});

// POST /api/events
router.post(
  '/',
  auth,
  upload.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { title, description, eventType, location, isOnline, meetingLink,
              country, region, industry, startDate, endDate, maxAttendees, group } = req.body;

      const event = await Event.create({
        title, description, organizer: req.user._id, group: group || null,
        eventType, location, isOnline: isOnline === 'true', meetingLink,
        country, region, industry, startDate, endDate,
        imageUrl: req.file ? await uploadToCloudinary(req.file.buffer) : '',
        maxAttendees: Number(maxAttendees) || 0,
        attendees: [req.user._id],
      });

      res.status(201).json(event);
    } catch (err) { next(err); }
  }
);

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', auth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const attending = event.attendees.some((a) => a.equals(req.user._id));
    if (attending) {
      event.attendees.pull(req.user._id);
    } else {
      if (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
        return res.status(400).json({ error: 'Event is full' });
      }
      event.attendees.push(req.user._id);
    }
    await event.save();
    res.json({ attending: !attending, attendeeCount: event.attendees.length });
  } catch (err) { next(err); }
});

module.exports = router;
