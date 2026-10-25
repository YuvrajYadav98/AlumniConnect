const mongoose = require("mongoose");
const Job = require("../models/Job");
const SavedJob = require("../models/SavedJob");
const JobApplication = require("../models/JobApplication");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { buildContainsRegex } = require("../utils/regexHelpers");
const { ROLES } = require("../utils/roles");

const ALLOWED_FIELDS = [
  "title",
  "description",
  "company",
  "location",
  "jobType",
  "experienceRequired",
  "applyLink",
  "applyEmail",
  "skillsRequired",
  "salaryRange",
  "applicationDeadline",
];

const pickAllowedFields = (body) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

// @desc    Post a new job/internship (starts pending admin approval)
// @route   POST /api/jobs
// @access  Private (verified alumni only)
const createJob = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ALUMNI) {
    res.status(403);
    throw new Error("Only alumni accounts can post jobs");
  }
  if (req.user.verificationStatus !== "approved") {
    res.status(403);
    throw new Error("Only verified alumni can post jobs");
  }

  const data = pickAllowedFields(req.body);

  const job = await Job.create({
    ...data,
    postedBy: req.user._id,
    approvalStatus: "pending",
  });

  res.status(201).json({ success: true, job });
});

// Shared lookup used by every mutating action below.
const findJobOr404 = async (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid job id");
  }
  const job = await Job.findById(id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  return job;
};

const isOwnerOrAdmin = (job, user) =>
  user.role === ROLES.ADMIN || String(job.postedBy) === String(user._id);

// @desc    Update a job posting
// @route   PUT /api/jobs/:id
// @access  Private (poster while pending/rejected, or admin any time)
const updateJob = asyncHandler(async (req, res) => {
  const job = await findJobOr404(req.params.id, res);

  if (!isOwnerOrAdmin(job, req.user)) {
    res.status(403);
    throw new Error("You can only edit your own job postings");
  }

  // A non-admin poster can only edit while it's still pending/rejected -
  // once approved and publicly visible, changing the content silently
  // would undermine the point of admin review. Editing a rejected post
  // resubmits it for review.
  if (req.user.role !== ROLES.ADMIN && job.approvalStatus === "approved") {
    res.status(400);
    throw new Error(
      "This job is already approved and can no longer be edited. Delete it and post a new listing instead."
    );
  }

  const data = pickAllowedFields(req.body);
  Object.assign(job, data);

  if (req.user.role !== ROLES.ADMIN) {
    job.approvalStatus = "pending";
    job.reviewedBy = null;
    job.rejectionReason = "";
  }

  await job.save();

  res.status(200).json({ success: true, job });
});

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private (poster or admin)
const deleteJob = asyncHandler(async (req, res) => {
  const job = await findJobOr404(req.params.id, res);

  if (!isOwnerOrAdmin(job, req.user)) {
    res.status(403);
    throw new Error("You can only delete your own job postings");
  }

  await Promise.all([
    SavedJob.deleteMany({ job: job._id }),
    JobApplication.deleteMany({ job: job._id }),
    job.deleteOne(),
  ]);

  res.status(200).json({ success: true, message: "Job deleted" });
});

// @desc    Mark a job as closed (no longer accepting applications) or reopen it
// @route   PUT /api/jobs/:id/close
// @route   PUT /api/jobs/:id/reopen
// @access  Private (poster or admin)
const setJobOpenStatus = (isOpen) =>
  asyncHandler(async (req, res) => {
    const job = await findJobOr404(req.params.id, res);

    if (!isOwnerOrAdmin(job, req.user)) {
      res.status(403);
      throw new Error("You can only manage your own job postings");
    }

    job.status = isOpen ? "open" : "closed";
    await job.save();

    res.status(200).json({
      success: true,
      message: `Job marked as ${job.status}`,
      job,
    });
  });

// @desc    List jobs. Everyone sees only approved, non-expired,
//          open jobs by default; posters/admins can opt into seeing more.
// @route   GET /api/jobs?search=&jobType=&location=&skill=&experience=&page=&limit=
// @access  Private (any authenticated user)
const listJobs = asyncHandler(async (req, res) => {
  const { search, jobType, location, skill, experience, includeExpired } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { approvalStatus: "approved", status: "open" };

  if (includeExpired !== "true") {
    filter.applicationDeadline = { $gte: new Date() };
  }

  if (jobType) filter.jobType = jobType;

  const locationRegex = buildContainsRegex(location);
  if (locationRegex) filter.location = locationRegex;

  const experienceRegex = buildContainsRegex(experience);
  if (experienceRegex) filter.experienceRequired = experienceRegex;

  const skillRegex = buildContainsRegex(skill);
  if (skillRegex) filter.skillsRequired = { $in: [skillRegex] };

  const searchRegex = buildContainsRegex(search);
  if (searchRegex) {
    filter.$or = [
      { title: searchRegex },
      { company: searchRegex },
      { description: searchRegex },
    ];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "name profileImage")
      .lean(), // read-only response - skip Mongoose document hydration
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    jobs,
  });
});

// @desc    Get a single job's details
// @route   GET /api/jobs/:id
// @access  Private (any authenticated user; non-approved jobs are
//          visible only to their poster or an admin)
const getJobById = asyncHandler(async (req, res) => {
  const job = await findJobOr404(req.params.id, res);
  await job.populate("postedBy", "name profileImage");

  if (job.approvalStatus !== "approved" && !isOwnerOrAdmin(job, req.user)) {
    res.status(404);
    throw new Error("Job not found");
  }

  const [isSaved, hasApplied] = await Promise.all([
    SavedJob.exists({ job: job._id, user: req.user._id }),
    JobApplication.exists({ job: job._id, applicant: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    job,
    isSaved: !!isSaved,
    hasApplied: !!hasApplied,
  });
});

// @desc    List jobs the logged-in alumni has posted (any approval status)
// @route   GET /api/jobs/mine
// @access  Private (alumni only)
const listMyPostedJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { postedBy: req.user._id };

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    jobs,
  });
});

// @desc    Save (bookmark) a job
// @route   POST /api/jobs/:id/save
// @access  Private
const saveJob = asyncHandler(async (req, res) => {
  const job = await findJobOr404(req.params.id, res);

  try {
    await SavedJob.create({ user: req.user._id, job: job._id });
  } catch (err) {
    // Duplicate key = already saved - treat as a no-op success rather than an error.
    if (err.code !== 11000) throw err;
  }

  res.status(200).json({ success: true, message: "Job saved" });
});

// @desc    Unsave a job
// @route   DELETE /api/jobs/:id/save
// @access  Private
const unsaveJob = asyncHandler(async (req, res) => {
  await SavedJob.deleteOne({ user: req.user._id, job: req.params.id });
  res.status(200).json({ success: true, message: "Job removed from saved list" });
});

// @desc    List the logged-in user's saved jobs
// @route   GET /api/jobs/saved
// @access  Private
const listSavedJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { user: req.user._id };

  const [saved, total] = await Promise.all([
    SavedJob.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "job", populate: { path: "postedBy", select: "name profileImage" } }),
    SavedJob.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: saved.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    // Drop any rows whose job was since deleted, so the frontend never
    // has to null-check.
    savedJobs: saved.filter((s) => s.job),
  });
});

// @desc    Apply to a job (records interest, returns where to actually apply)
// @route   POST /api/jobs/:id/apply
// @access  Private
const applyToJob = asyncHandler(async (req, res) => {
  const job = await findJobOr404(req.params.id, res);

  if (job.approvalStatus !== "approved") {
    res.status(404);
    throw new Error("Job not found");
  }
  if (job.status !== "open") {
    res.status(400);
    throw new Error("This job is no longer accepting applications");
  }
  if (new Date() > new Date(job.applicationDeadline)) {
    res.status(400);
    throw new Error("The application deadline for this job has passed");
  }

  try {
    await JobApplication.create({ job: job._id, applicant: req.user._id });
  } catch (err) {
    if (err.code !== 11000) throw err; // duplicate = already applied, treat as success
  }

  res.status(200).json({
    success: true,
    message: "Application recorded",
    applyLink: job.applyLink || null,
    applyEmail: job.applyEmail || null,
  });
});

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  closeJob: setJobOpenStatus(false),
  reopenJob: setJobOpenStatus(true),
  listJobs,
  getJobById,
  listMyPostedJobs,
  saveJob,
  unsaveJob,
  listSavedJobs,
  applyToJob,
};
