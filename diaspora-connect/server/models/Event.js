const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 3000 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    eventType: {
      type: String,
      enum: ['Meetup', 'Webinar', 'Workshop', 'Networking', 'Job Fair', 'Cultural', 'Other'],
      default: 'Other',
    },
    location: { type: String, default: '' },  // address or "Online"
    isOnline: { type: Boolean, default: false },
    meetingLink: { type: String, default: '' },
    country: { type: String, default: '' },
    region: { type: String, default: '' },
    industry: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    imageUrl: { type: String, default: '' },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxAttendees: { type: Number, default: 0 },  // 0 = unlimited
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1, country: 1, industry: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
