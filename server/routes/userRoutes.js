const express = require("express");
const { uploadProfileImage } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { handleSingleUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.put("/me/avatar", protect, handleSingleUpload("image"), uploadProfileImage);

module.exports = router;
