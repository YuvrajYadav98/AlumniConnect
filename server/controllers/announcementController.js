const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { notifyUsers } = require("../utils/notify");
const { ROLES } = require("../utils/roles");

// Resolves which users should receive a given announcement audience.
// "all" targets every account type that would actually see the app
// (approved alumni, students, and admins) rather than raw role match,
// so an unverified alumni account doesn't get flooded before it's even
// approved.
const resolveAudienceUserIds = async (audience) => {
  const filter =
    audience === "alumni"
      ? { role: ROLES.ALUMNI, verificationStatus: "approved" }
      : audience === "student"
      ? { role: ROLES.STUDENT }
      : audience === "admin"
      ? { role: ROLES.ADMIN }
      : {
          $or: [
            { role: ROLES.STUDENT },
            { role: ROLES.ADMIN },
            { role: ROLES.ALUMNI, verificationStatus: "approved" },
          ],
        };

  const users = await User.find(filter).select("_id");
  return users.map((u) => u._id);
};

// @desc    Create an announcement and notify the target audience
// @route   POST /api/announcements
// @access  Private (admin only)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, audience, attachment, isPinned, expiresAt } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error("Title and content are required");
  }

  const announcement = await Announcement.create({
    title,
    content,
    audience: audience || "all",
    attachment: attachment || "",
    isPinned: !!isPinned,
    expiresAt: expiresAt || null,
    postedBy: req.user._id,
  });

  const recipientIds = await resolveAudienceUserIds(announcement.audience);
  await notifyUsers(
    recipientIds.filter((id) => String(id) !== String(req.user._id)),
    {
      sender: req.user._id,
      type: "announcement",
      title: "New announcement: " + announcement.title,
      message: announcement.content.slice(0, 150),
      relatedEntity: announcement._id,
      relatedEntityType: "Announcement",
    }
  );

  res.status(201).json({ success: true, announcement });
});

// @desc    List announcements relevant to the logged-in user
//          (their role's audience + "all"), newest/pinned first
// @route   GET /api/announcements?page=&limit=
// @access  Private
const listAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {
    audience: { $in: ["all", req.user.role] },
    $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
  };

  const [announcements, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "name profileImage"),
    Announcement.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: announcements.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    announcements,
  });
});

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private (admin only)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid announcement id");
  }

  const deleted = await Announcement.findByIdAndDelete(id);
  if (!deleted) {
    res.status(404);
    throw new Error("Announcement not found");
  }

  res.status(200).json({ success: true, message: "Announcement deleted" });
});

module.exports = { createAnnouncement, listAnnouncements, deleteAnnouncement };
