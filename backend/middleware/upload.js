const multer = require('multer');

// Use memory storage — file bytes go into req.file.buffer
// We will then upload to Supabase Storage, NOT to local disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
  fileFilter: function (req, file, cb) {
    cb(null, true); // accept all file types
  }
});

module.exports = upload;
