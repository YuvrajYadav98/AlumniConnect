const User = require("../models/User");
const AlumniProfile = require("../models/AlumniProfile");
const Event = require("../models/Event");
const Job = require("../models/Job");
const Connection = require("../models/Connection");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { calculateProfileCompletion } = require("../utils/profileCompletion");
const { ROLES } = require("../utils/roles");

// @desc    Aggregate stats for the admin dashboard
// @route   GET /api/dashboard/admin
// @access  Private (admin only)
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [totalAlumni, totalStudents, totalEvents, totalJobs, pendingApprovals] =
    await Promise.all([
      User.countDocuments({ role: ROLES.ALUMNI }),
      User.countDocuments({ role: ROLES.STUDENT }),
      Event.countDocuments({}),
      Job.countDocuments({}),
      User.countDocuments({ role: ROLES.ALUMNI, verificationStatus: "pending" }),
    ]);

  res.status(200).json({
    success: true,
    stats: {
      totalAlumni,
      totalStudents,
      totalEvents,
      totalJobs,
      pendingApprovals,
    },
  });
});

// @desc    Aggregate stats for the alumni dashboard
// @route   GET /api/dashboard/alumni
// @access  Private (alumni only)
const getAlumniDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  const connectionFilter = {
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  };

  const [
    profile,
    connectionsCount,
    upcomingEventsCount,
    availableJobsCount,
    unreadNotificationsCount,
    recentNotifications,
  ] = await Promise.all([
    AlumniProfile.findOne({ user: userId }),
    Connection.countDocuments(connectionFilter),
    Event.countDocuments({ date: { $gte: now }, isPublished: true, status: { $ne: "cancelled" } }),
    Job.countDocuments({ status: "open" }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(5),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      profileCompletion: calculateProfileCompletion(profile, req.user.profileImage),
      hasProfile: !!profile,
      connectionsCount,
      upcomingEventsCount,
      availableJobsCount,
      unreadNotificationsCount,
    },
    recentNotifications,
  });
});

// @desc    Aggregate stats for the student dashboard
// @route   GET /api/dashboard/student
// @access  Private (student only)
const getStudentDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  const connectionFilter = {
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  };

  const [alumniCount, availableMentorsCount, jobsCount, eventsCount, connectionsCount] =
    await Promise.all([
      User.countDocuments({ role: ROLES.ALUMNI, verificationStatus: "approved" }),
      AlumniProfile.countDocuments({ isAvailableForMentorship: true, isPublic: true }),
      Job.countDocuments({ status: "open" }),
      Event.countDocuments({ date: { $gte: now }, isPublished: true, status: { $ne: "cancelled" } }),
      Connection.countDocuments(connectionFilter),
    ]);

  res.status(200).json({
    success: true,
    stats: {
      alumniCount,
      availableMentorsCount,
      jobsCount,
      eventsCount,
      connectionsCount,
    },
  });
});

module.exports = { getAdminDashboard, getAlumniDashboard, getStudentDashboard };
