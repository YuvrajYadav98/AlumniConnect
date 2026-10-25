const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// Streams a Buffer (from multer's memory storage) up to Cloudinary
// without ever writing it to disk, and resolves with the upload result.
const streamUploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "alumni-connect/profile-images",
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// @desc    Upload/replace the logged-in user's profile image
// @route   PUT /api/users/me/avatar
// @access  Private (any authenticated user)
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image file was provided");
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    res.status(500);
    throw new Error("Image upload is not configured on the server (missing Cloudinary credentials)");
  }

  const result = await streamUploadToCloudinary(req.file.buffer);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: result.secure_url },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    profileImage: user.profileImage,
    user,
  });
});

module.exports = { uploadProfileImage };
