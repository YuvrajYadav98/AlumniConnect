const mongoose = require("mongoose");
const AlumniProfile = require("../models/AlumniProfile");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { calculateProfileCompletion } = require("../utils/profileCompletion");
const { sanitizeProfileForViewer } = require("../utils/sanitizeProfile");
const { buildContainsRegex } = require("../utils/regexHelpers");
const { ROLES } = require("../utils/roles");

// Fields a client is allowed to set on their own profile.
// Deliberately excludes `user` (set from req.user, never from the body).
const ALLOWED_FIELDS = [
  // Personal
  "phone",
  "gender",
  "dateOfBirth",
  "address",
  "city",
  "state",
  "country",
  // Academic
  "college",
  "degree",
  "branch",
  "batch",
  "admissionYear",
  "graduationYear",
  "rollNumber",
  // Career
  "currentCompany",
  "jobTitle",
  "industry",
  "experienceYears",
  "skills",
  "socialLinks",
  "workExperience",
  // Additional
  "bio",
  "achievements",
  "certifications",
  "interests",
  // Visibility
  "isPublic",
  "privacy",
  "isAvailableForMentorship",
  "mentorshipCategories",
  "mentorshipAvailability",
];

const pickAllowedFields = (body) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

// Mentorship is gated behind alumni verification: an unverified account
// could otherwise mark itself available for mentorship through this
// general-purpose profile endpoint, bypassing the admin review step
// that the mentor-specific /api/mentors/me endpoint enforces.
const assertMentorshipFieldsAllowed = (res, user, data) => {
  const touchesMentorship =
    data.isAvailableForMentorship === true ||
    (Array.isArray(data.mentorshipCategories) && data.mentorshipCategories.length > 0);

  if (touchesMentorship && user.verificationStatus !== "approved") {
    res.status(403);
    throw new Error(
      "Only verified alumni can become mentors. Your account is awaiting admin approval."
    );
  }
};

// @desc    Create the logged-in alumni's profile (fails if one already exists)
// @route   POST /api/alumni-profiles/me
// @access  Private (alumni only)
const createMyProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ALUMNI) {
    res.status(403);
    throw new Error("Only alumni accounts can create an alumni profile");
  }

  const existing = await AlumniProfile.findOne({ user: req.user._id });
  if (existing) {
    res.status(409);
    throw new Error("A profile already exists for this account. Use update instead.");
  }

  const data = pickAllowedFields(req.body);

  if (!data.branch || !data.graduationYear) {
    res.status(400);
    throw new Error("Branch and graduation year are required");
  }

  assertMentorshipFieldsAllowed(res, req.user, data);

  const profile = await AlumniProfile.create({ ...data, user: req.user._id });

  res.status(201).json({
    success: true,
    profile,
    profileCompletion: calculateProfileCompletion(profile, req.user.profileImage),
  });
});

// @desc    Update the logged-in alumni's own profile (partial update)
// @route   PUT /api/alumni-profiles/me
// @access  Private (alumni only)
const updateMyProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ALUMNI) {
    res.status(403);
    throw new Error("Only alumni accounts can update an alumni profile");
  }

  const data = pickAllowedFields(req.body);

  assertMentorshipFieldsAllowed(res, req.user, data);

  const profile = await AlumniProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: data },
    { new: true, runValidators: true, context: "query" }
  );

  if (!profile) {
    res.status(404);
    throw new Error("No profile found. Create one first.");
  }

  res.status(200).json({
    success: true,
    profile,
    profileCompletion: calculateProfileCompletion(profile, req.user.profileImage),
  });
});

// @desc    Get the logged-in user's own alumni profile (full detail, own data)
// @route   GET /api/alumni-profiles/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await AlumniProfile.findOne({ user: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error("No profile found. Create one first.");
  }

  res.status(200).json({
    success: true,
    profile,
    profileCompletion: calculateProfileCompletion(profile, req.user.profileImage),
  });
});

// @desc    Get a specific alumni's profile by user id (privacy-filtered for non-owners)
// @route   GET /api/alumni-profiles/:userId
// @access  Private (any authenticated user)
const getProfileByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const profile = await AlumniProfile.findOne({ user: userId }).populate(
    "user",
    "name email profileImage role isApproved verificationStatus"
  );

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  const isOwner = profile.user._id.equals(req.user._id);
  const isAdmin = req.user.role === ROLES.ADMIN;
  const isApprovedAlumni = profile.user.verificationStatus === "approved";

  // Unverified/rejected alumni profiles are not reachable by anyone
  // except the owner and admins - approval gates visibility entirely,
  // not just directory listing.
  if (!isOwner && !isAdmin && !isApprovedAlumni) {
    res.status(403);
    throw new Error("This alumni account has not yet been verified");
  }

  if (!profile.isPublic && !isOwner && !isAdmin) {
    res.status(403);
    throw new Error("This profile is private");
  }

  res.status(200).json({
    success: true,
    profile: sanitizeProfileForViewer(profile, req.user),
  });
});

// Whitelisted sort options for the directory. Kept as an explicit map
// (rather than building a $sort object from raw query input) so a
// request can never inject an arbitrary sort key into the pipeline.
const DIRECTORY_SORT_OPTIONS = {
  newest: { "profile.createdAt": -1 },
  oldest: { "profile.createdAt": 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  batch_asc: { "profile.graduationYear": 1 },
  batch_desc: { "profile.graduationYear": -1 },
  company_asc: { "profile.currentCompany": 1 },
  company_desc: { "profile.currentCompany": -1 },
};

// @desc    Search / browse the alumni directory with filters, sort + pagination
// @route   GET /api/alumni-profiles
// @query   search           - free-text: matches name OR company OR job title
// @query   name              - filter: name contains
// @query   company           - filter: current company contains
// @query   jobTitle          - filter: job title contains
// @query   batch             - filter: batch string contains (e.g. "2016-2020")
// @query   branch            - filter: branch/department contains
// @query   city              - filter: city contains
// @query   industry          - filter: industry contains
// @query   skills            - filter: comma-separated list, matches any
// @query   sort              - one of DIRECTORY_SORT_OPTIONS (default "newest")
// @query   page, limit       - pagination
// @access  Private (any authenticated user)
//
// Implementation notes (query optimization):
// Only verified (approved) alumni with a public profile are ever
// discoverable here - this is the crux of the verification/approval
// flow. Since `name` lives on User but everything else lives on
// AlumniProfile, a single aggregation pipeline is used instead of two
// separate queries: it lets Mongo apply the User-side filter (which hits
// the { role, verificationStatus } compound index) and the
// AlumniProfile-side filters within one pass, sort correctly across
// both collections' fields, and only pull the handful of fields the
// directory card actually needs off the wire - never phone, DOB,
// address, roll number, or password.
const listAlumniDirectory = asyncHandler(async (req, res) => {
  const {
    search,
    name,
    company,
    jobTitle,
    batch,
    branch,
    city,
    industry,
    skills,
    sort,
  } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  // ---- Stage 1: filter User side (hits the {role, verificationStatus} index) ----
  const userMatch = { role: ROLES.ALUMNI, verificationStatus: "approved" };
  const nameRegex = buildContainsRegex(name);
  if (nameRegex) userMatch.name = nameRegex;

  // ---- Stage 2: filter AlumniProfile side (after $lookup + $unwind) ----
  const profileMatch = { "profile.isPublic": true };

  const companyRegex = buildContainsRegex(company);
  if (companyRegex) profileMatch["profile.currentCompany"] = companyRegex;

  const jobTitleRegex = buildContainsRegex(jobTitle);
  if (jobTitleRegex) profileMatch["profile.jobTitle"] = jobTitleRegex;

  const batchRegex = buildContainsRegex(batch);
  if (batchRegex) profileMatch["profile.batch"] = batchRegex;

  const branchRegex = buildContainsRegex(branch);
  if (branchRegex) profileMatch["profile.branch"] = branchRegex;

  const cityRegex = buildContainsRegex(city);
  if (cityRegex) profileMatch["profile.city"] = cityRegex;

  const industryRegex = buildContainsRegex(industry);
  if (industryRegex) profileMatch["profile.industry"] = industryRegex;

  if (skills) {
    const skillRegexes = String(skills)
      .split(",")
      .map((s) => buildContainsRegex(s))
      .filter(Boolean);
    if (skillRegexes.length > 0) {
      profileMatch["profile.skills"] = { $in: skillRegexes };
    }
  }

  // A single search box that matches name OR company OR job title, in
  // addition to (not instead of) the more specific filters above.
  const searchRegex = buildContainsRegex(search);
  if (searchRegex) {
    profileMatch.$or = [
      { name: searchRegex },
      { "profile.currentCompany": searchRegex },
      { "profile.jobTitle": searchRegex },
    ];
  }

  const sortStage = DIRECTORY_SORT_OPTIONS[sort] || DIRECTORY_SORT_OPTIONS.newest;

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
    // Only alumni who have actually created a profile can appear in the
    // directory, so a plain $unwind (not preserveNullAndEmptyArrays) is
    // correct here and also cheaply drops profile-less accounts early.
    { $unwind: "$profile" },
    { $match: profileMatch },
    { $sort: sortStage },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            // Project only what the directory card needs - deliberately
            // excludes phone, dateOfBirth, address, rollNumber, and
            // password, so sensitive fields never leave the database
            // for this endpoint in the first place.
            $project: {
              _id: "$profile._id",
              user: { _id: "$_id", name: "$name", profileImage: "$profileImage" },
              jobTitle: "$profile.jobTitle",
              currentCompany: "$profile.currentCompany",
              batch: "$profile.batch",
              branch: "$profile.branch",
              city: "$profile.city",
              graduationYear: "$profile.graduationYear",
              industry: "$profile.industry",
              skills: "$profile.skills",
              isAvailableForMentorship: "$profile.isAvailableForMentorship",
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await User.aggregate(pipeline);
  const profiles = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  res.status(200).json({
    success: true,
    count: profiles.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    sort: sort && DIRECTORY_SORT_OPTIONS[sort] ? sort : "newest",
    profiles,
  });
});

// @desc    Delete the logged-in user's own alumni profile
// @route   DELETE /api/alumni-profiles/me
// @access  Private (alumni only)
const deleteMyProfile = asyncHandler(async (req, res) => {
  const deleted = await AlumniProfile.findOneAndDelete({ user: req.user._id });

  if (!deleted) {
    res.status(404);
    throw new Error("No profile found to delete");
  }

  res.status(200).json({ success: true, message: "Profile deleted" });
});

module.exports = {
  createMyProfile,
  updateMyProfile,
  getMyProfile,
  getProfileByUserId,
  listAlumniDirectory,
  deleteMyProfile,
};
