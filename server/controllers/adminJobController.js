const mongoose = require("mongoose");
const Job = require("../models/Job");
const SavedJob = require("../models/SavedJob");
const JobApplication = require("../models/JobApplication");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { buildContainsRegex } = require("../utils/regexHelpers");

const notify = async (payload) => {
  try {
    await Notification.create(payload);
  } catch {
    // non-fatal
  }
};

// @desc    List jobs awaiting admin review
// @route   GET /api/admin/jobs/pending
// @access  Private (admin only)
const listPendingJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { approvalStatus: "pending" };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "name email profileImage"),
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

// @desc    List all jobs regardless of approval/open status, with filters
// @route   GET /api/admin/jobs?status=&search=&page=&limit=
// @access  Private (admin only)
const listAllJobsForAdmin = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.approvalStatus = status;
  }
  const searchRegex = buildContainsRegex(search);
  if (searchRegex) {
    filter.$or = [{ title: searchRegex }, { company: searchRegex }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "name email profileImage"),
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

// @desc    Approve a pending job - makes it visible to students/alumni
// @route   PUT /api/admin/jobs/:id/approve
// @access  Private (admin only)
const approveJob = asyncHandler(async (req, res) => {
  const job = await findJobOr404(req.params.id, res);

  job.approvalStatus = "approved";
  job.reviewedBy = req.user._id;
  job.rejectionReason = "";
  await job.save();

  await notify({
    recipient: job.postedBy,
    sender: req.user._id,
    type: "job",
    title: "Your job posting was approved",
    message: `"${job.title}" at ${job.company} is now live.`,
    relatedEntity: job._id,
    relatedEntityType: "Job",
  });

  res.status(200).json({ success: true, message: "Job approved", job });
});

// @desc    Reject a pending job
// @route   PUT /api/admin/jobs/:id/reject
// @body    { reason }
// @access  Private (admin only)
const rejectJob = asyncHandler(async (req, res) => {
  const job = await findJobOr404(req.params.id, res);

  job.approvalStatus = "rejected";
  job.reviewedBy = req.user._id;
  job.rejectionReason = req.body?.reason || "";
  await job.save();

  await notify({
    recipient: job.postedBy,
    sender: req.user._id,
    type: "job",
    title: "Your job posting was not approved",
    message: job.rejectionReason || `"${job.title}" at ${job.company} was not approved.`,
    relatedEntity: job._id,
    relatedEntityType: "Job",
  });

  res.status(200).json({ success: true, message: "Job rejected", job });
});

// @desc    Permanently delete every job whose application deadline has passed
// @route   DELETE /api/admin/jobs/expired
// @access  Private (admin only)
const deleteExpiredJobs = asyncHandler(async (req, res) => {
  const expiredJobs = await Job.find({ applicationDeadline: { $lt: new Date() } }).select("_id");
  const expiredIds = expiredJobs.map((j) => j._id);

  if (expiredIds.length === 0) {
    return res
      .status(200)
      .json({ success: true, message: "No expired jobs to delete", deletedCount: 0 });
  }

  await Promise.all([
    SavedJob.deleteMany({ job: { $in: expiredIds } }),
    JobApplication.deleteMany({ job: { $in: expiredIds } }),
    Job.deleteMany({ _id: { $in: expiredIds } }),
  ]);

  res.status(200).json({
    success: true,
    message: `Deleted ${expiredIds.length} expired job(s)`,
    deletedCount: expiredIds.length,
  });
});

module.exports = {
  listPendingJobs,
  listAllJobsForAdmin,
  approveJob,
  rejectJob,
  deleteExpiredJobs,
};
