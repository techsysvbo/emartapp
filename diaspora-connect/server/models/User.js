const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const INDUSTRIES = [
  // Technology
  'Software Engineering', 'DevOps & Cloud (Docker/Kubernetes)', 'Data Science & AI',
  'Cybersecurity', 'IT Support & Systems', 'Web Development', 'Mobile Development',
  'UI/UX Design', 'Product Management', 'Blockchain & Web3',
  // Healthcare
  'Medicine (Doctor/GP)', 'Nursing', 'Pharmacy', 'Dentistry', 'Physiotherapy',
  'Mental Health & Counselling', 'Public Health', 'Biomedical Science',
  // Business & Entrepreneurship
  'Food Business & Catering', 'Retail & E-commerce', 'Import & Export',
  'Real Estate', 'Marketing & Advertising', 'Supply Chain & Logistics',
  'Consulting', 'Finance & Accounting', 'Banking & Investment', 'Insurance',
  // Trades & Skilled Labour
  'Construction & Civil Engineering', 'Electrical & Plumbing', 'Automotive',
  'Manufacturing', 'Agriculture & Farming', 'Cleaning & Facilities',
  // Professional Services
  'Law & Legal Services', 'Architecture', 'Mechanical Engineering',
  'Chemical Engineering', 'Civil Engineering', 'Surveying',
  // Education & Research
  'Teaching (Primary/Secondary)', 'Higher Education & Academia',
  'Research & Development',
  // Creative & Media
  'Journalism & Media', 'Film & Photography', 'Music & Entertainment',
  'Fashion & Beauty', 'Arts & Design',
  // Public & Social Sector
  'Government & Civil Service', 'NGO & Non-profit', 'Social Work',
  'Military & Security',
  'Other',
];

const EDUCATION_LEVELS = [
  'High School / Secondary',
  'Diploma / HND',
  'Bachelor\'s Degree (BSc/BA/BEng)',
  'Master\'s Degree (MSc/MBA/MA/MEng)',
  'PhD / Doctorate',
  'Professional Certification',
  'Other',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    countryOfOrigin: { type: String, required: true },
    countryOfResidence: { type: String, required: true },
    // Free-text job title (e.g. "Docker/DevOps Engineer", "Jollof Rice Caterer")
    profession: { type: String, default: '', trim: true },
    industry: { type: String, enum: INDUSTRIES, default: 'Other' },
    educationLevel: { type: String, enum: EDUCATION_LEVELS, default: 'Other' },
    // e.g. "University of Lagos", "MIT"
    institution: { type: String, default: '', trim: true },
    // Specialisation / field of study (e.g. "Computer Science", "Food Technology")
    fieldOfStudy: { type: String, default: '', trim: true },
    bio: { type: String, default: '', maxlength: 600 },
    avatarUrl: { type: String, default: '' },
    isMentor: { type: Boolean, default: false },
    mentorBio: { type: String, default: '', maxlength: 600 },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Never return password hash in JSON responses
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
module.exports.INDUSTRIES = INDUSTRIES;
module.exports.EDUCATION_LEVELS = EDUCATION_LEVELS;
