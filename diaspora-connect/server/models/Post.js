const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 3000 },
    imageUrl: { type: String, default: '' },
    region: { type: String, default: '' },       // e.g. "West Africa", "South Asia"
    country: { type: String, default: '' },       // e.g. "Nigeria"
    profession: { type: String, default: '' },
    industry: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    status: { type: String, enum: ['active', 'removed'], default: 'active' },
  },
  { timestamps: true }
);

postSchema.index({ region: 1, industry: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model('Post', postSchema);
