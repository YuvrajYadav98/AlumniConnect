const mongoose = require("mongoose");
const Achievement = require("../models/Achievement");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { ROLES } = require("../utils/roles");
const { ACHIEVEMENT_CATEGORIES } = require("../utils/achievementCategories");

const ALLOWED_FIELDS = ["title", "description", "category", "dateAchieved", "image"];

const pickAllowedFields = (body) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

// @desc    Submit an achievement (starts pending admin approval)
// @route   POST /api/achievements
// @access  Private (alumni only)
const submitAchievement = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ALUMNI) {
    res.status(403);
    throw new Error("Only alumni accounts can submit achievements");
  }

  const data = pickAllowedFields(req.body);

  if (!data.title || !data.dateAchieved) {
    res.status(400);
    throw new Error("Title and date achieved are required");
  }

  if (data.category && !ACHIEVEMENT_CATEGORIES.includes(data.category)) {
    res.status(400);
    throw new Error("Invalid achievement category");
  }

  const achievement = await Achievement.create({
    ...data,
    user: req.user._id,
    status: "pending",
  });

  res.status(201).json({ success: true, achievement });
});

// @desc    List the logged-in alumni's own achievements (any status)
// @route   GET /api/achievements/mine
// @access  Private (alumni only)
const listMyAchievements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { user: req.user._id };

  const [achievements, total] = await Promise.all([
    Achievement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

// @desc    List approved achievements for a specific alumni (public profile view)
// @route   GET /api/achievements/user/:userId
// @access  Private (any authenticated user)
const listApprovedAchievementsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const achievements = await Achievement.find({
    user: userId,
    status: "approved",
  })
    .sort({ dateAchieved: -1 })
    // Safety cap - a profile's achievement list is always small in
    // practice, but this guarantees the query can never fetch an
    // unbounded number of documents.
    .limit(100);

  res.status(200).json({ success: true, achievements });
});

// @desc    Delete the logged-in alumni's own achievement
// @route   DELETE /api/achievements/:id
// @access  Private (owner only)
const deleteMyAchievement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid achievement id");
  }

  const deleted = await Achievement.findOneAndDelete({ _id: id, user: req.user._id });
  if (!deleted) {
    res.status(404);
    throw new Error("Achievement not found");
  }

  res.status(200).json({ success: true, message: "Achievement deleted" });
});

// @desc    Get a single achievement by id
// @route   GET /api/achievements/:id
// @access  Private (owner or admin see any status; others only if approved)
const getAchievementById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid achievement id");
  }

  const achievement = await Achievement.findById(id).populate(
    "user",
    "name email profileImage role"
  );
  if (!achievement) {
    res.status(404);
    throw new Error("Achievement not found");
  }

  const isOwner = String(achievement.user._id) === String(req.user._id);
  const isAdmin = req.user.role === ROLES.ADMIN;

  // Pending/rejected achievements are only visible to the person who
  // submitted them and admins - never leaked to other users who might
  // guess or share the id.
  if (achievement.status !== "approved" && !isOwner && !isAdmin) {
    res.status(404);
    throw new Error("Achievement not found");
  }

  res.status(200).json({ success: true, achievement });
});

module.exports = {
  submitAchievement,
  listMyAchievements,
  listApprovedAchievementsForUser,
  getAchievementById,
  deleteMyAchievement,
};
