const mongoose = require("mongoose");
const Connection = require("../models/Connection");
const User = require("../models/User");
const AlumniProfile = require("../models/AlumniProfile");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");

/**
 * Alumni networking: send/accept/reject/cancel/remove/block connection
 * requests between any two users, plus listing your accepted network
 * and your pending requests (both directions).
 */

// Maps a raw Connection document to a status label relative to `viewerId`.
// Kept intentionally backward-compatible with the original directory
// "Connect" button contract: top-level `status` is still one of
// none | pending_sent | pending_received | accepted | blocked.
const toRelativeStatus = (connection, viewerId) => {
  if (!connection) return "none";
  if (connection.status === "accepted") return "accepted";
  if (connection.status === "blocked") return "blocked";
  if (connection.status === "rejected") return "none"; // allow re-requesting
  return String(connection.requester) === String(viewerId)
    ? "pending_sent"
    : "pending_received";
};

// Non-fatal notification helper: a failed notification should never
// abort a connection action that already succeeded.
const notify = async (payload) => {
  try {
    await Notification.create(payload);
  } catch {
    // intentionally swallowed - notifications are best-effort
  }
};

// Attaches a lightweight AlumniProfile summary (jobTitle, company,
// branch, batch, city) to a list of { user } shaped results, in one
// extra query rather than N+1 - the same pattern used by the admin
// alumni list and directory endpoints.
const attachProfileSummaries = async (items, getUserId) => {
  const userIds = items.map(getUserId).filter(Boolean);
  const profiles = await AlumniProfile.find({ user: { $in: userIds } }).select(
    "user jobTitle currentCompany branch batch graduationYear city"
  );
  const profileByUserId = new Map(profiles.map((p) => [String(p.user), p]));
  return items.map((item) => ({
    ...item,
    profile: profileByUserId.get(String(getUserId(item))) || null,
  }));
};

// @desc    Send a connection request to another user
// @route   POST /api/connections/:userId
// @access  Private
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (userId === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot connect with yourself");
  }

  const recipient = await User.findById(userId).select("name");
  if (!recipient) {
    res.status(404);
    throw new Error("User not found");
  }

  // A connection may already exist in either direction - don't create a
  // duplicate row (this is the "prevent duplicate requests" guarantee).
  const existing = await Connection.findOne({
    $or: [
      { requester: req.user._id, recipient: userId },
      { requester: userId, recipient: req.user._id },
    ],
  });

  if (existing) {
    if (existing.status === "blocked") {
      res.status(403);
      throw new Error("You cannot send a connection request to this user");
    }

    if (existing.status === "rejected") {
      // Reuse the row rather than trying to insert a new one (which
      // would violate the unique {requester, recipient} index anyway),
      // and reset it to a fresh pending request in the new direction.
      existing.requester = req.user._id;
      existing.recipient = userId;
      existing.status = "pending";
      existing.blockedBy = null;
      existing.respondedAt = null;
      await existing.save();

      await notify({
        recipient: userId,
        sender: req.user._id,
        type: "connection_request",
        title: "New connection request",
        message: `${req.user.name} sent you a connection request.`,
        relatedEntity: existing._id,
        relatedEntityType: "Connection",
      });

      return res.status(200).json({
        success: true,
        status: toRelativeStatus(existing, req.user._id),
        connection: existing,
      });
    }

    // pending or accepted - nothing to do, just report current state
    return res.status(200).json({
      success: true,
      status: toRelativeStatus(existing, req.user._id),
      connection: existing,
    });
  }

  const connection = await Connection.create({
    requester: req.user._id,
    recipient: userId,
    status: "pending",
  });

  await notify({
    recipient: userId,
    sender: req.user._id,
    type: "connection_request",
    title: "New connection request",
    message: `${req.user.name} sent you a connection request.`,
    relatedEntity: connection._id,
    relatedEntityType: "Connection",
  });

  res.status(201).json({
    success: true,
    status: toRelativeStatus(connection, req.user._id),
    connection,
  });
});

// @desc    Get the connection status between the logged-in user and another user
// @route   GET /api/connections/status/:userId
// @access  Private
const getConnectionStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (userId === String(req.user._id)) {
    return res.status(200).json({ success: true, status: "self" });
  }

  const existing = await Connection.findOne({
    $or: [
      { requester: req.user._id, recipient: userId },
      { requester: userId, recipient: req.user._id },
    ],
  });

  res.status(200).json({
    success: true,
    status: toRelativeStatus(existing, req.user._id),
    blockedByMe: existing?.status === "blocked" && String(existing.blockedBy) === String(req.user._id),
    connectionId: existing?._id || null,
  });
});

// @desc    Accept a pending connection request (recipient only)
// @route   PUT /api/connections/:id/accept
// @access  Private
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid connection id");
  }

  const connection = await Connection.findById(id);
  if (!connection) {
    res.status(404);
    throw new Error("Connection request not found");
  }

  if (String(connection.recipient) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the recipient can accept this request");
  }

  if (connection.status !== "pending") {
    res.status(400);
    throw new Error(`Cannot accept a request with status '${connection.status}'`);
  }

  connection.status = "accepted";
  connection.respondedAt = new Date();
  await connection.save();

  await notify({
    recipient: connection.requester,
    sender: req.user._id,
    type: "connection_accepted",
    title: "Connection request accepted",
    message: `${req.user.name} accepted your connection request.`,
    relatedEntity: connection._id,
    relatedEntityType: "Connection",
  });

  res.status(200).json({ success: true, message: "Connection accepted", connection });
});

// @desc    Reject a pending connection request (recipient only)
// @route   PUT /api/connections/:id/reject
// @access  Private
const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid connection id");
  }

  const connection = await Connection.findById(id);
  if (!connection) {
    res.status(404);
    throw new Error("Connection request not found");
  }

  if (String(connection.recipient) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the recipient can reject this request");
  }

  if (connection.status !== "pending") {
    res.status(400);
    throw new Error(`Cannot reject a request with status '${connection.status}'`);
  }

  connection.status = "rejected";
  connection.respondedAt = new Date();
  await connection.save();

  res.status(200).json({ success: true, message: "Connection request rejected", connection });
});

// @desc    Cancel a pending request you sent, or remove an accepted connection
// @route   DELETE /api/connections/:id
// @access  Private (requester for pending, either party for accepted)
const deleteConnection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid connection id");
  }

  const connection = await Connection.findById(id);
  if (!connection) {
    res.status(404);
    throw new Error("Connection not found");
  }

  const meId = String(req.user._id);
  const isRequester = String(connection.requester) === meId;
  const isRecipient = String(connection.recipient) === meId;

  if (!isRequester && !isRecipient) {
    res.status(403);
    throw new Error("You are not part of this connection");
  }

  if (connection.status === "pending") {
    if (!isRequester) {
      res.status(403);
      throw new Error("Only the requester can cancel a pending request. Use reject instead.");
    }
    await connection.deleteOne();
    return res.status(200).json({ success: true, message: "Connection request cancelled" });
  }

  if (connection.status === "accepted") {
    await connection.deleteOne();
    return res.status(200).json({ success: true, message: "Connection removed" });
  }

  res.status(400);
  throw new Error(`Cannot remove a connection with status '${connection.status}'`);
});

// @desc    Block another user (creates or updates the connection between you)
// @route   PUT /api/connections/block/:userId
// @access  Private
const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (userId === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot block yourself");
  }

  const targetExists = await User.exists({ _id: userId });
  if (!targetExists) {
    res.status(404);
    throw new Error("User not found");
  }

  let connection = await Connection.findOne({
    $or: [
      { requester: req.user._id, recipient: userId },
      { requester: userId, recipient: req.user._id },
    ],
  });

  if (connection) {
    connection.status = "blocked";
    connection.blockedBy = req.user._id;
    connection.respondedAt = new Date();
    await connection.save();
  } else {
    connection = await Connection.create({
      requester: req.user._id,
      recipient: userId,
      status: "blocked",
      blockedBy: req.user._id,
      respondedAt: new Date(),
    });
  }

  res.status(200).json({ success: true, message: "User blocked", connection });
});

// @desc    List the logged-in user's accepted connections ("my network")
// @route   GET /api/connections?page=&limit=
// @access  Private
const listConnections = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const meId = req.user._id;

  const filter = {
    status: "accepted",
    $or: [{ requester: meId }, { recipient: meId }],
  };

  const [docs, total] = await Promise.all([
    Connection.find(filter)
      .sort({ respondedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("requester", "name profileImage role")
      .populate("recipient", "name profileImage role"),
    Connection.countDocuments(filter),
  ]);

  const items = docs.map((c) => {
    const isRequester = String(c.requester._id) === String(meId);
    const other = isRequester ? c.recipient : c.requester;
    return {
      connectionId: c._id,
      connectedAt: c.respondedAt || c.updatedAt,
      user: other,
    };
  });

  const withProfiles = await attachProfileSummaries(items, (item) => item.user._id);

  res.status(200).json({
    success: true,
    count: withProfiles.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    connections: withProfiles,
  });
});

// @desc    List pending connection requests, received (default) or sent
// @route   GET /api/connections/pending?type=received|sent&page=&limit=
// @access  Private
const listPendingRequests = asyncHandler(async (req, res) => {
  const type = req.query.type === "sent" ? "sent" : "received";
  const { page, limit, skip } = parsePagination(req.query);
  const meId = req.user._id;

  const filter =
    type === "sent"
      ? { status: "pending", requester: meId }
      : { status: "pending", recipient: meId };

  const [docs, total] = await Promise.all([
    Connection.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("requester", "name profileImage role")
      .populate("recipient", "name profileImage role"),
    Connection.countDocuments(filter),
  ]);

  const items = docs.map((c) => ({
    connectionId: c._id,
    requestedAt: c.createdAt,
    user: type === "sent" ? c.recipient : c.requester,
  }));

  const withProfiles = await attachProfileSummaries(items, (item) => item.user._id);

  res.status(200).json({
    success: true,
    count: withProfiles.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    type,
    requests: withProfiles,
  });
});

module.exports = {
  sendConnectionRequest,
  getConnectionStatus,
  acceptConnectionRequest,
  rejectConnectionRequest,
  deleteConnection,
  blockUser,
  listConnections,
  listPendingRequests,
};
