const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");

// @desc    List the logged-in user's notifications, newest first
// @route   GET /api/notifications?unreadOnly=&page=&limit=
// @access  Private
const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15 });

  const filter = { recipient: req.user._id };
  if (req.query.unreadOnly === "true") {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name profileImage"),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    notifications,
  });
});

// @desc    Get just the unread notification count (for a nav badge)
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({ success: true, unreadCount });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid notification id");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.status(200).json({ success: true, notification });
});

// @desc    Mark all of the logged-in user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, message: "All notifications marked as read" });
});

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllAsRead };
