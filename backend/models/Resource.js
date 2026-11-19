const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['exam', 'assignment', 'project', 'notes', 'other'], 
    required: true 
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  semester: { type: String }, // e.g. 'Semester 1', 'Semester 2'
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  description: { type: String },
  tags: [{ type: String }],
  fileUrl: { type: String, required: true },
  fileSize: { type: String },
  uploader: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  downloads: { type: Number, default: 0 },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
