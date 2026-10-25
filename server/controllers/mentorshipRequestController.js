const mongoose = require("mongoose");
const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const AlumniProfile = require("../models/AlumniProfile");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { ROLES } = require("../utils/roles");
const { MENTORSHIP_CATEGORIES } = require("../utils/mentorshipCategories");

const ACTIVE_STATUSES = ["pending", "accepted"];

// Non-fatal notification helper - a failed notification should never
// abort a mentorship action that already succeeded.
const notify = async (payload) => {
  try {
    await Notification.create(payload);
  } catch {
    // intentionally swallowed
  }
};

// @desc    Send a mentorship request to a verified, available mentor
// @route   POST /api/mentorship-requests/:mentorId
// @body    { category, topic, message }
// @access  Private (student only)
const sendMentorshipRequest = asyncHandler(async (req, res) => {
  const { mentorId } = req.params;
  const { category, topic, message } = req.body;

  if (req.user.role !== ROLES.STUDENT) {
    res.status(403);
    throw new Error("Only students can send mentorship requests");
  }

  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    res.status(400);
    throw new Error("Invalid mentor id");
  }

  if (!category || !MENTORSHIP_CATEGORIES.includes(category)) {
    res.status(400);
    throw new Error("A valid mentorship category is required");
  }
  if (!topic || !topic.trim()) {
    res.status(400);
    throw new Error("A topic is required");
  }
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("A message describing what you need help with is required");
  }

  const mentorUser = await User.findById(mentorId);
  if (!mentorUser || mentorUser.role !== ROLES.ALUMNI) {
    res.status(404);
    throw new Error("Mentor not found");
  }

  // The core "only verified alumni can become mentors" rule, enforced
  // at the point it actually matters - a student trying to request one.
  if (mentorUser.verificationStatus !== "approved") {
    res.status(403);
    throw new Error("This alumni is not a verified mentor");
  }

  const mentorProfile = await AlumniProfile.findOne({ user: mentorId });
  if (!mentorProfile || !mentorProfile.isAvailableForMentorship) {
    res.status(403);
    throw new Error("This alumni is not currently available for mentorship");
  }
  if (!mentorProfile.mentorshipCategories.includes(category)) {
    res.status(400);
    throw new Error("This mentor does not offer mentorship in that category");
  }

  // Duplicate prevention: an existing pending or accepted request to
  // this mentor blocks sending a new one - report its current state
  // instead of creating a second row.
  const existing = await MentorshipRequest.findOne({
    student: req.user._id,
    mentor: mentorId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (existing) {
    return res.status(200).json({
      success: true,
      message: `You already have a ${existing.status} request with this mentor`,
      request: existing,
    });
  }

  const request = await MentorshipRequest.create({
    student: req.user._id,
    mentor: mentorId,
    category,
    topic: topic.trim(),
    message: message.trim(),
  });

  await notify({
    recipient: mentorId,
    sender: req.user._id,
    type: "mentorship_request",
    title: "New mentorship request",
    message: `${req.user.name} requested mentorship in ${category}.`,
    relatedEntity: request._id,
    relatedEntityType: "MentorshipRequest",
  });

  res.status(201).json({ success: true, request });
});

// Shared lookup used by accept/reject/complete/cancel.
const findRequestOr404 = async (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid mentorship request id");
  }
  const request = await MentorshipRequest.findById(id);
  if (!request) {
    res.status(404);
    throw new Error("Mentorship request not found");
  }
  return request;
};

// @desc    Accept a pending mentorship request
// @route   PUT /api/mentorship-requests/:id/accept
// @access  Private (mentor only)
const acceptMentorshipRequest = asyncHandler(async (req, res) => {
  const request = await findRequestOr404(req.params.id, res);

  if (String(request.mentor) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the mentor can accept this request");
  }
  if (request.status !== "pending") {
    res.status(400);
    throw new Error(`Cannot accept a request with status '${request.status}'`);
  }

  request.status = "accepted";
  request.respondedAt = new Date();
  if (req.body?.mentorNote) request.mentorNote = req.body.mentorNote;
  await request.save();

  await notify({
    recipient: request.student,
    sender: req.user._id,
    type: "mentorship_accepted",
    title: "Mentorship request accepted",
    message: `${req.user.name} accepted your mentorship request on "${request.topic}".`,
    relatedEntity: request._id,
    relatedEntityType: "MentorshipRequest",
  });

  res.status(200).json({ success: true, message: "Mentorship request accepted", request });
});

// @desc    Reject a pending mentorship request
// @route   PUT /api/mentorship-requests/:id/reject
// @access  Private (mentor only)
const rejectMentorshipRequest = asyncHandler(async (req, res) => {
  const request = await findRequestOr404(req.params.id, res);

  if (String(request.mentor) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the mentor can reject this request");
  }
  if (request.status !== "pending") {
    res.status(400);
    throw new Error(`Cannot reject a request with status '${request.status}'`);
  }

  request.status = "rejected";
  request.respondedAt = new Date();
  if (req.body?.mentorNote) request.mentorNote = req.body.mentorNote;
  await request.save();

  await notify({
    recipient: request.student,
    sender: req.user._id,
    type: "mentorship_rejected",
    title: "Mentorship request declined",
    message: `${req.user.name} was unable to accept your mentorship request right now.`,
    relatedEntity: request._id,
    relatedEntityType: "MentorshipRequest",
  });

  res.status(200).json({ success: true, message: "Mentorship request rejected", request });
});

// @desc    Mark an accepted mentorship as completed
// @route   PUT /api/mentorship-requests/:id/complete
// @access  Private (mentor only)
const completeMentorship = asyncHandler(async (req, res) => {
  const request = await findRequestOr404(req.params.id, res);

  if (String(request.mentor) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the mentor can mark this mentorship as completed");
  }
  if (request.status !== "accepted") {
    res.status(400);
    throw new Error(`Cannot complete a request with status '${request.status}'`);
  }

  request.status = "completed";
  await request.save();

  await notify({
    recipient: request.student,
    sender: req.user._id,
    type: "mentorship_completed",
    title: "Mentorship marked as completed",
    message: `${req.user.name} marked your mentorship on "${request.topic}" as completed.`,
    relatedEntity: request._id,
    relatedEntityType: "MentorshipRequest",
  });

  res.status(200).json({ success: true, message: "Mentorship marked as completed", request });
});

// @desc    Cancel a mentorship request you sent, while it's still pending
// @route   DELETE /api/mentorship-requests/:id
// @access  Private (student who sent it, only while pending)
const cancelMentorshipRequest = asyncHandler(async (req, res) => {
  const request = await findRequestOr404(req.params.id, res);

  if (String(request.student) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the student who sent this request can cancel it");
  }
  if (request.status !== "pending") {
    res.status(400);
    throw new Error("Only pending requests can be cancelled");
  }

  await request.deleteOne();

  res.status(200).json({ success: true, message: "Mentorship request cancelled" });
});

// @desc    List mentorship requests relevant to the logged-in user -
//          as the mentor (alumni) or as the student who sent them
// @route   GET /api/mentorship-requests?status=&page=&limit=
// @access  Private
const listMyMentorshipRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter =
    req.user.role === ROLES.ALUMNI ? { mentor: req.user._id } : { student: req.user._id };

  if (status) {
    if (!["pending", "accepted", "rejected", "completed"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status filter");
    }
    filter.status = status;
  }

  const [docs, total] = await Promise.all([
    MentorshipRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("student", "name profileImage")
      .populate("mentor", "name profileImage"),
    MentorshipRequest.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: docs.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    viewerRole: req.user.role === ROLES.ALUMNI ? "mentor" : "student",
    requests: docs,
  });
});

module.exports = {
  sendMentorshipRequest,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  completeMentorship,
  cancelMentorshipRequest,
  listMyMentorshipRequests,
};
