const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { buildContainsRegex } = require("../utils/regexHelpers");
const { ROLES } = require("../utils/roles");
const { MENTORSHIP_CATEGORIES } = require("../utils/mentorshipCategories");

/**
 * Mentor search is deliberately its own endpoint (not just another
 * filter on the alumni directory): it enforces two extra conditions
 * that only apply to mentorship - `verificationStatus === "approved"`
 * (only verified alumni can be discovered as mentors) and
 * `isAvailableForMentorship === true` - and returns a mentor-shaped
 * projection (experience, mentorship categories, availability, about)
 * instead of the general directory card shape.
 */

// @desc    Search verified, available mentors
// @route   GET /api/mentors?category=&skill=&search=&page=&limit=
// @access  Private (any authenticated user)
const listMentors = asyncHandler(async (req, res) => {
  const { category, skill, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  if (category && !MENTORSHIP_CATEGORIES.includes(category)) {
    res.status(400);
    throw new Error("Invalid mentorship category");
  }

  // Only verified (approved) alumni are ever discoverable as mentors -
  // this is the crux of "only verified alumni can become mentors".
  const userMatch = { role: ROLES.ALUMNI, verificationStatus: "approved" };

  const profileMatch = {
    "profile.isAvailableForMentorship": true,
    "profile.isPublic": true,
  };

  if (category) {
    profileMatch["profile.mentorshipCategories"] = category;
  }

  const skillRegex = buildContainsRegex(skill);
  if (skillRegex) {
    profileMatch["profile.skills"] = { $in: [skillRegex] };
  }

  const searchRegex = buildContainsRegex(search);
  if (searchRegex) {
    profileMatch.$or = [
      { name: searchRegex },
      { "profile.currentCompany": searchRegex },
      { "profile.jobTitle": searchRegex },
    ];
  }

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
    { $unwind: "$profile" },
    { $match: profileMatch },
    { $sort: { "profile.updatedAt": -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: "$profile._id",
              user: { _id: "$_id", name: "$name", profileImage: "$profileImage" },
              jobTitle: "$profile.jobTitle",
              currentCompany: "$profile.currentCompany",
              experienceYears: "$profile.experienceYears",
              skills: "$profile.skills",
              mentorshipCategories: "$profile.mentorshipCategories",
              mentorshipAvailability: "$profile.mentorshipAvailability",
              bio: "$profile.bio",
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await User.aggregate(pipeline);
  const mentors = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  res.status(200).json({
    success: true,
    count: mentors.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    categories: MENTORSHIP_CATEGORIES,
    mentors,
  });
});

module.exports = { listMentors };
