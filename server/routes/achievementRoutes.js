const express = require("express");
const {
  submitAchievement,
  listMyAchievements,
  listApprovedAchievementsForUser,
  getAchievementById,
  deleteMyAchievement,
} = require("../controllers/achievementController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", submitAchievement);
router.get("/mine", listMyAchievements);
router.get("/user/:userId", listApprovedAchievementsForUser);
router.get("/:id", getAchievementById);
router.delete("/:id", deleteMyAchievement);

module.exports = router;
