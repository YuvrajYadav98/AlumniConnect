const mongoose = require("mongoose");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { areUsersConnected } = require("../utils/connectionHelpers");
const { notifyUser } = require("../utils/notify");
const { getIO } = require("../socket");

// @desc    List the logged-in user's conversations, most recent first,
//          each with the last message and an unread count
// @route   GET /api/messages/conversations
// @access  Private
const listConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: userId }, { recipient: userId }] } },
    { $sort: { createdAt: -1 } },
    {
      // Group by "the other person in this message", keeping only the
      // most recent message per partner (docs already sorted above).
      $group: {
        _id: { $cond: [{ $eq: ["$sender", userId] }, "$recipient", "$sender"] },
        lastMessage: { $first: "$$ROOT" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        user: { _id: "$user._id", name: "$user.name", profileImage: "$user.profileImage" },
        lastMessage: {
          content: "$lastMessage.content",
          sender: "$lastMessage.sender",
          isRead: "$lastMessage.isRead",
          createdAt: "$lastMessage.createdAt",
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  // Unread count per partner - messages they sent me that I haven't read yet.
  const unreadCounts = await Message.aggregate([
    { $match: { recipient: userId, isRead: false } },
    { $group: { _id: "$sender", count: { $sum: 1 } } },
  ]);
  const unreadByUser = new Map(unreadCounts.map((u) => [String(u._id), u.count]));

  const withUnread = conversations.map((c) => ({
    ...c,
    unreadCount: unreadByUser.get(String(c.user._id)) || 0,
  }));

  res.status(200).json({ success: true, conversations: withUnread });
});

// @desc    Get the message thread with a specific user (oldest first)
// @route   GET /api/messages/:userId?page=&limit=
// @access  Private (only if the two users are connected)
const getMessageThread = asyncHandler(async (req, res) => {
  const { userId: peerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(peerId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const allowed = await areUsersConnected(req.user._id, peerId);
  if (!allowed) {
    res.status(403);
    throw new Error("You can only view messages with users you're connected with");
  }

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });

  const filter = {
    $or: [
      { sender: req.user._id, recipient: peerId },
      { sender: peerId, recipient: req.user._id },
    ],
  };

  const [recent, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    // Reversed so the frontend can render top-to-bottom in chronological order.
    messages: recent.reverse(),
  });
});

// @desc    Send a message (REST fallback for clients without an active
//          socket connection - also emits over the socket if available,
//          so the recipient still gets it in real time either way)
// @route   POST /api/messages/:userId
// @body    { content }
// @access  Private (only if the two users are connected)
const sendMessageRest = asyncHandler(async (req, res) => {
  const { userId: recipientId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    res.status(400);
    throw new Error("Invalid recipient id");
  }
  if (!content || !String(content).trim()) {
    res.status(400);
    throw new Error("Message content is required");
  }

  const allowed = await areUsersConnected(req.user._id, recipientId);
  if (!allowed) {
    res.status(403);
    throw new Error("You can only message users you're connected with");
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipientId,
    content: String(content).trim(),
  });

  const io = getIO();
  if (io) {
    const payload = {
      _id: message._id,
      sender: String(req.user._id),
      recipient: recipientId,
      content: message.content,
      isRead: false,
      createdAt: message.createdAt,
    };
    io.to(`user:${recipientId}`).emit("receive_message", payload);
  }

  await notifyUser({
    recipient: recipientId,
    sender: req.user._id,
    type: "message",
    title: "New message",
    message: `${req.user.name}: ${message.content.slice(0, 100)}`,
    relatedEntity: message._id,
    relatedEntityType: "Message",
  });

  res.status(201).json({ success: true, message });
});

// @desc    Mark every message from :userId to me as read (REST fallback,
//          mirrors the socket "mark_read" event)
// @route   PATCH /api/messages/:userId/read
// @access  Private
const markThreadRead = asyncHandler(async (req, res) => {
  const { userId: peerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(peerId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const result = await Message.updateMany(
    { sender: peerId, recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  if (result.modifiedCount > 0) {
    const io = getIO();
    io?.to(`user:${peerId}`).emit("messages_read", { readBy: String(req.user._id) });
  }

  res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
});

module.exports = { listConversations, getMessageThread, sendMessageRest, markThreadRead };
