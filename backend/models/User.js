const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, sparse: true }, // preserved for backward-compatibility
  password: { type: String, required: true },
  must_change_password: { type: Boolean, default: false },
  university: { type: String, default: 'Jimma University' },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  bio: { type: String, default: 'Jimma University student sharing knowledge.' },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  online: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
