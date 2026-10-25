const User = require("../models/User");
const AlumniProfile = require("../models/AlumniProfile");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Job = require("../models/Job");
const Achievement = require("../models/Achievement");
const Connection = require("../models/Connection");
const asyncHandler = require("../utils/asyncHandler");
const { parseDateRange } = require("../utils/parseDateRange");
const { ROLES } = require("../utils/roles");

// Buckets a grouped { _id, count } array down to the top N entries,
// summing everything else into a single "Other" slice. Keeps charts
// with long-tail categorical data (city, industry) readable instead of
// rendering 60 tiny bars.
const topNWithOther = (rows, n) => {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  if (sorted.length <= n) return sorted;

  const top = sorted.slice(0, n);
  const otherCount = sorted.slice(n).reduce((sum, r) => sum + r.count, 0);
  if (otherCount > 0) top.push({ _id: "Other", count: otherCount });
  return top;
};

// Shared shape for every "group AlumniProfile by <field>, count" chart.
// Falls back to "Not specified" for empty/missing values so the chart
// never silently drops incomplete profiles.
const groupAlumniProfilesBy = async (field) => {
  const rows = await AlumniProfile.aggregate([
    {
      $group: {
        _id: {
          $cond: [
            { $or: [{ $eq: [`$${field}`, ""] }, { $eq: [`$${field}`, null] }] },
            "Not specified",
            `$${field}`,
          ],
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  return rows.map((r) => ({ label: r._id, count: r.count }));
};

// @desc    Top-level counts for the 8 admin analytics stat cards
// @route   GET /api/admin/analytics/overview
// @access  Private (admin only)
const getOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalAlumni,
    totalStudents,
    totalMentorsAgg,
    totalEvents,
    totalJobs,
    totalAchievements,
    totalConnections,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: ROLES.ALUMNI }),
    User.countDocuments({ role: ROLES.STUDENT }),
    // "Mentor" = an alumni profile that has opted in to mentorship,
    // joined against User just to keep this consistent with how the
    // rest of the app defines an alumni account.
    AlumniProfile.aggregate([
      { $match: { isAvailableForMentorship: true } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.role": ROLES.ALUMNI } },
      { $count: "count" },
    ]),
    Event.countDocuments({}),
    Job.countDocuments({}),
    Achievement.countDocuments({}),
    Connection.countDocuments({ status: "accepted" }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalAlumni,
      totalStudents,
      totalMentors: totalMentorsAgg[0]?.count || 0,
      totalEvents,
      totalJobs,
      totalAchievements,
      totalConnections,
    },
  });
});

// @desc    Alumni distribution by batch
// @route   GET /api/admin/analytics/alumni-by-batch
// @access  Private (admin only)
const getAlumniByBatch = asyncHandler(async (req, res) => {
  const data = await groupAlumniProfilesBy("batch");
  res.status(200).json({ success: true, data });
});

// @desc    Alumni distribution by branch
// @route   GET /api/admin/analytics/alumni-by-branch
// @access  Private (admin only)
const getAlumniByBranch = asyncHandler(async (req, res) => {
  const data = await groupAlumniProfilesBy("branch");
  res.status(200).json({ success: true, data });
});

// @desc    Alumni distribution by city (top 10 + "Other")
// @route   GET /api/admin/analytics/alumni-by-city
// @access  Private (admin only)
const getAlumniByCity = asyncHandler(async (req, res) => {
  const rows = await AlumniProfile.aggregate([
    {
      $group: {
        _id: {
          $cond: [
            { $or: [{ $eq: ["$city", ""] }, { $eq: ["$city", null] }] },
            "Not specified",
            "$city",
          ],
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const data = topNWithOther(rows, 10).map((r) => ({ label: r._id, count: r.count }));
  res.status(200).json({ success: true, data });
});

// @desc    Alumni distribution by industry (top 10 + "Other")
// @route   GET /api/admin/analytics/alumni-by-industry
// @access  Private (admin only)
const getAlumniByIndustry = asyncHandler(async (req, res) => {
  const rows = await AlumniProfile.aggregate([
    {
      $group: {
        _id: {
          $cond: [
            { $or: [{ $eq: ["$industry", ""] }, { $eq: ["$industry", null] }] },
            "Not specified",
            "$industry",
          ],
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const data = topNWithOther(rows, 10).map((r) => ({ label: r._id, count: r.count }));
  res.status(200).json({ success: true, data });
});

// @desc    Job postings grouped by employment type/category
// @route   GET /api/admin/analytics/jobs-by-category
// @access  Private (admin only)
const getJobsByCategory = asyncHandler(async (req, res) => {
  const rows = await Job.aggregate([
    { $group: { _id: "$jobType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.status(200).json({
    success: true,
    data: rows.map((r) => ({ label: r._id, count: r.count })),
  });
});

// @desc    Top events by registration count, optionally scoped to a
//          date range on the event's own date
// @route   GET /api/admin/analytics/event-registrations?from=&to=&limit=
// @access  Private (admin only)
const getEventRegistrations = asyncHandler(async (req, res) => {
  const { range } = parseDateRange(req.query);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 25);

  const rows = await EventRegistration.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      $lookup: {
        from: "events",
        localField: "event",
        foreignField: "_id",
        as: "event",
      },
    },
    { $unwind: "$event" },
    ...(range ? [{ $match: { "event.date": range } }] : []),
    {
      $group: {
        _id: "$event._id",
        title: { $first: "$event.title" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  res.status(200).json({
    success: true,
    data: rows.map((r) => ({ label: r.title, count: r.count })),
  });
});

// @desc    New user registrations per month, split by role, for a
//          date range (defaults to the last 12 months)
// @route   GET /api/admin/analytics/monthly-registrations?from=&to=
// @access  Private (admin only)
const getMonthlyRegistrations = asyncHandler(async (req, res) => {
  const { from, to, range } = parseDateRange(req.query, { defaultDays: 365 });
  const match = range ? { createdAt: range } : {};

  const rows = await User.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          role: "$role",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Reshape from one row per (month, role) into one row per month with
  // a count per role, and zero-fill any month that had no signups at
  // all so the chart's x-axis doesn't skip gaps.
  const monthMap = new Map();
  for (const r of rows) {
    const key = `${r._id.year}-${String(r._id.month).padStart(2, "0")}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { month: key, students: 0, alumni: 0, admins: 0, total: 0 });
    }
    const entry = monthMap.get(key);
    if (r._id.role === ROLES.STUDENT) entry.students += r.count;
    else if (r._id.role === ROLES.ALUMNI) entry.alumni += r.count;
    else entry.admins += r.count;
    entry.total += r.count;
  }

  const start =
    from ||
    (rows.length
      ? new Date(Date.UTC(rows[0]._id.year, rows[0]._id.month - 1))
      : new Date());
  const end = to || new Date();
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  const filled = [];
  while (cursor <= endMonth) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    filled.push(monthMap.get(key) || { month: key, students: 0, alumni: 0, admins: 0, total: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  res.status(200).json({ success: true, data: filled });
});

module.exports = {
  getOverview,
  getAlumniByBatch,
  getAlumniByBranch,
  getAlumniByCity,
  getAlumniByIndustry,
  getJobsByCategory,
  getEventRegistrations,
  getMonthlyRegistrations,
};
