const mongoose = require('mongoose');

const ventSchema = new mongoose.Schema(
  {
    // Author ID is always stored (for moderation) but never sent to clients
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 3000 },
    isAnonymous: { type: Boolean, default: true },
    // IDs of users who have flagged this post
    flags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // 'active' | 'hidden' (auto-hidden after 3+ flags) | 'removed' (mod action)
    status: { type: String, enum: ['active', 'hidden', 'removed'], default: 'active' },
    // Soft-delete: never physically deleted
    deletedAt: { type: Date, default: null },
    modNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-hide when flag count reaches 3
ventSchema.pre('save', function (next) {
  if (this.isModified('flags') && this.flags.length >= 3 && this.status === 'active') {
    this.status = 'hidden';
  }
  next();
});

ventSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('VentPost', ventSchema);
