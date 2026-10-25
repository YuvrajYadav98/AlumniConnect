const multer = require("multer");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Files are kept in memory (as a Buffer) rather than written to disk,
// since they're immediately streamed on to Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// Wraps a multer single-file middleware so its errors (wrong type, too
// large, etc.) are converted into a proper 400 response instead of
// falling through to the generic 500 handler.
const handleSingleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      res.status(400);
      return next(new Error(err.message || "File upload failed"));
    }
    next();
  });
};

module.exports = { upload, handleSingleUpload };
