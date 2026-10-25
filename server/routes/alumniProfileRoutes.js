const express = require("express");
const {
  createMyProfile,
  updateMyProfile,
  getMyProfile,
  getProfileByUserId,
  listAlumniDirectory,
  deleteMyProfile,
} = require("../controllers/alumniProfileController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All alumni-profile routes require a logged-in user.
router.use(protect);

router.get("/", listAlumniDirectory);
router.post("/me", createMyProfile);
router.put("/me", updateMyProfile);
router.get("/me", getMyProfile);
router.delete("/me", deleteMyProfile);
router.get("/:userId", getProfileByUserId);

module.exports = router;
