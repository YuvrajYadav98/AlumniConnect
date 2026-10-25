const mongoose = require("mongoose");
const Achievement = require("../models/Achievement");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { notifyUser } = require("../utils/notify");

// @desc    List achievements awaiting admin review
// @route   GET /api/admin/achievements/pending
// @access  Private (admin only)
const listPendingAchievements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { status: "pending" };

  const [achievements, total] = await Promise.all([
    Achievement.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email profileImage"),
    Achievement.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: achievements.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    achievements,
  });
});

const findAchievementOr404 = async (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid achievement id");
  }
  const achievement = await Achievement.findById(id);
  if (!achievement) {
    res.status(404);
    throw new Error("Achievement not found");
  }
  return achievement;
};

// @desc    Approve a pending achievement
// @route   PUT /api/admin/achievements/:id/approve
// @access  Private (admin only)
const approveAchievement = asyncHandler(async (req, res) => {
  const achievement = await findAchievementOr404(req.params.id, res);

  achievement.status = "approved";
  achievement.reviewedBy = req.user._id;
  await achievement.save();

  await notifyUser({
    recipient: achievement.user,
    sender: req.user._id,
    type: "achievement_approved",
    title: "Achievement approved",
    message: `Your achievement "${achievement.title}" is now visible on your profile.`,
    relatedEntity: achievement._id,
    relatedEntityType: "Achievement",
  });

  res.status(200).json({ success: true, message: "Achievement approved", achievement });
});

// @desc    Reject a pending achievement
// @route   PUT /api/admin/achievements/:id/reject
// @access  Private (admin only)
const rejectAchievement = asyncHandler(async (req, res) => {
  const achievement = await findAchievementOr404(req.params.id, res);

  achievement.status = "rejected";
  achievement.reviewedBy = req.user._id;
  await achievement.save();

  await notifyUser({
    recipient: achievement.user,
    sender: req.user._id,
    type: "system",
    title: "Achievement not approved",
    message: `Your achievement "${achievement.title}" was not approved.`,
    relatedEntity: achievement._id,
    relatedEntityType: "Achievement",
  });

  res.status(200).json({ success: true, message: "Achievement rejected", achievement });
});

module.exports = { listPendingAchievements, approveAchievement, rejectAchievement };
