const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    countryOfOrigin: { type: String, required: true },
    countryOfResidence: { type: String, required: true },
    profession: { type: String, default: '' },
    industry: {
      type: String,
      enum: [
        'Technology', 'Healthcare', 'Finance', 'Law', 'Education',
        'Creative Arts', 'Trades', 'Business', 'Engineering',
        'Science', 'Government', 'Non-profit', 'Other',
      ],
      default: 'Other',
    },
    bio: { type: String, default: '', maxlength: 500 },
    avatarUrl: { type: String, default: '' },
    isMentor: { type: Boolean, default: false },
    mentorBio: { type: String, default: '', maxlength: 500 },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Never return password in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
