const mongoose = require('mongoose');

const groupPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 3000 },
    imageUrl: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 1000 },
    category: {
      type: String,
      enum: [
        'Professional Networking', 'Food & Business', 'IT & Tech',
        'Healthcare', 'Education & Research', 'Mentorship',
        'Cultural & Social', 'Support & Wellness', 'Events & Meetups',
        'Masters & PhD Holders', 'Entrepreneurs', 'Skilled Trades', 'Other',
      ],
      default: 'Other',
    },
    homeCountry: { type: String, default: '' },   // country of origin filter
    hostCountry: { type: String, default: '' },   // country of residence filter
    region: { type: String, default: '' },         // e.g. "West Africa"
    industry: { type: String, default: '' },
    profession: { type: String, default: '' },
    educationLevel: { type: String, default: '' }, // for academic groups
    avatarUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posts: [groupPostSchema],
    isPrivate: { type: Boolean, default: false },
    isSeeded: { type: Boolean, default: false },   // pre-seeded community group
  },
  { timestamps: true }
);

groupSchema.index({ category: 1, homeCountry: 1, hostCountry: 1 });
groupSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Group', groupSchema);
