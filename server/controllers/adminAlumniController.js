const mongoose = require("mongoose");
const User = require("../models/User");
const AlumniProfile = require("../models/AlumniProfile");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { ROLES } = require("../utils/roles");

const VERIFICATION_STATUSES = ["pending", "approved", "rejected"];

/**
 * Builds the $match stage(s) for the alumni aggregation pipeline from
 * query params. Exported separately (and kept side-effect free) so it
 * can be unit tested without a live database connection.
 *
 * userMatch    -> filters applied directly on the User collection
 * profileMatch -> filters applied after joining AlumniProfile
 */
const buildAlumniFilters = (query = {}) => {
  const { status, search, branch, graduationYear, industry, city, country, skill } = query;

  const userMatch = { role: ROLES.ALUMNI };

  if (status && VERIFICATION_STATUSES.includes(status)) {
    userMatch.verificationStatus = status;
  }

  if (search) {
    // $text must live in the same $match as any other User-level
    // conditions, and must be the first stage of the pipeline.
    userMatch.$text = { $search: search };
  }

  const profileMatch = {};
  if (branch) profileMatch["profile.branch"] = new RegExp(branch, "i");
  if (industry) profileMatch["profile.industry"] = new RegExp(industry, "i");
  if (city) profileMatch["profile.city"] = new RegExp(city, "i");
  if (country) profileMatch["profile.country"] = new RegExp(country, "i");
  if (graduationYear) profileMatch["profile.graduationYear"] = Number(graduationYear);
  if (skill) profileMatch["profile.skills"] = { $in: [new RegExp(skill, "i")] };

  return { userMatch, profileMatch };
};

/**
 * Shared aggregation: User (role=alumni) left-joined with their
 * AlumniProfile (a user may not have created one yet), filtered and
 * paginated. Returns { alumni, total, page, limit }.
 */
const runAlumniQuery = async (query, paginationOpts) => {
  const { userMatch, profileMatch } = buildAlumniFilters(query);
  const { page, limit, skip } = parsePagination(query, paginationOpts);

  const hasProfileMatch = Object.keys(profileMatch).length > 0;

  const pipeline = [
    { $match: userMatch },
    {
      $lookup: {
        from: "alumniprofiles",
        localField: "_id",
        foreignField: "user",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    ...(hasProfileMatch ? [{ $match: profileMatch }] : []),
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }, { $project: { password: 0 } }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await User.aggregate(pipeline);
  const alumni = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return { alumni, total, page, limit };
};

// @desc    List alumni accounts awaiting verification
// @route   GET /api/admin/alumni/pending
// @access  Private (admin only)
const getPendingAlumni = asyncHandler(async (req, res) => {
  const { alumni, total, page, limit } = await runAlumniQuery(
    { ...req.query, status: "pending" },
    {}
  );

  res.status(200).json({
    success: true,
    count: alumni.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    alumni,
  });
});

// @desc    List all alumni accounts, with search/filter/pagination
// @route   GET /api/admin/alumni?status=&search=&branch=&graduationYear=&industry=&city=&country=&skill=&page=&limit=
// @access  Private (admin only)
const getAllAlumni = asyncHandler(async (req, res) => {
  if (req.query.status && !VERIFICATION_STATUSES.includes(req.query.status)) {
    res.status(400);
    throw new Error(
      `Invalid status filter. Must be one of: ${VERIFICATION_STATUSES.join(", ")}`
    );
  }

  const { alumni, total, page, limit } = await runAlumniQuery(req.query, {});

  res.status(200).json({
    success: true,
    count: alumni.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    alumni,
  });
});

// @desc    Get full details (user + profile) for one alumni account
// @route   GET /api/admin/alumni/:id
// @access  Private (admin only)
const getAlumniById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid alumni id");
  }

  const user = await User.findOne({ _id: id, role: ROLES.ALUMNI });

  if (!user) {
    res.status(404);
    throw new Error("Alumni account not found");
  }

  const profile = await AlumniProfile.findOne({ user: id });

  res.status(200).json({
    success: true,
    alumni: user,
    profile: profile || null,
  });
});

// @desc    Approve an alumni account, making it eligible for the public directory
// @route   PUT /api/admin/alumni/:id/approve
// @access  Private (admin only)
const approveAlumni = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid alumni id");
  }

  const user = await User.findOneAndUpdate(
    { _id: id, role: ROLES.ALUMNI },
    { isApproved: true, verificationStatus: "approved" },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("Alumni account not found");
  }

  res.status(200).json({ success: true, message: "Alumni approved", alumni: user });
});

// @desc    Reject an alumni account
// @route   PUT /api/admin/alumni/:id/reject
// @access  Private (admin only)
const rejectAlumni = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid alumni id");
  }

  const user = await User.findOneAndUpdate(
    { _id: id, role: ROLES.ALUMNI },
    { isApproved: false, verificationStatus: "rejected" },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("Alumni account not found");
  }

  res.status(200).json({ success: true, message: "Alumni rejected", alumni: user });
});

// @desc    Permanently delete an alumni account and its profile
// @route   DELETE /api/admin/alumni/:id
// @access  Private (admin only)
const deleteAlumni = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid alumni id");
  }

  const user = await User.findOne({ _id: id, role: ROLES.ALUMNI });

  if (!user) {
    res.status(404);
    throw new Error("Alumni account not found");
  }

  // Remove the profile first, then the account, so we never leave an
  // orphaned AlumniProfile pointing at a deleted user.
  await AlumniProfile.deleteOne({ user: id });
  await User.deleteOne({ _id: id });

  res.status(200).json({ success: true, message: "Alumni account deleted" });
});

module.exports = {
  getPendingAlumni,
  getAllAlumni,
  getAlumniById,
  approveAlumni,
  rejectAlumni,
  deleteAlumni,
  // exported for unit testing
  buildAlumniFilters,
};
