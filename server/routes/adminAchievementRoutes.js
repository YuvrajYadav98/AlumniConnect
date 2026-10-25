const express = require("express");
const {
  listPendingAchievements,
  approveAchievement,
  rejectAchievement,
} = require("../controllers/adminAchievementController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/pending", listPendingAchievements);
router.put("/:id/approve", approveAchievement);
router.put("/:id/reject", rejectAchievement);

module.exports = router;
