const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  university: { type: String, default: '' },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  bio: { type: String, default: 'Ethiopian student sharing knowledge.' },
  avatar: { type: String, default: null }, // URL to S3 or base64
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  online: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
