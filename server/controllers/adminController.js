const mongoose = require("mongoose");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { parsePagination } = require("../utils/pagination");
const { ROLE_VALUES } = require("../utils/roles");

// @desc    List all users, with optional filters (role, approval status)
// @route   GET /api/admin/users?role=&isApproved=&search=&page=&limit=
// @access  Private (admin only)
const listUsers = asyncHandler(async (req, res) => {
  const { role, isApproved, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (role) {
    if (!ROLE_VALUES.includes(role)) {
      res.status(400);
      throw new Error("Invalid role filter");
    }
    filter.role = role;
  }
  if (isApproved !== undefined) {
    filter.isApproved = isApproved === "true";
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    users,
  });
});

// @desc    Get accounts pending admin approval (typically new alumni signups)
// @route   GET /api/admin/users/pending
// @access  Private (admin only)
const listPendingUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { isApproved: false };

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    users,
  });
});

// @desc    Approve a user account (e.g. a newly registered alumni)
// @route   PATCH /api/admin/users/:id/approve
// @access  Private (admin only)
const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isApproved: true, verificationStatus: "approved" },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ success: true, user });
});

// @desc    Revoke approval for a user account
// @route   PATCH /api/admin/users/:id/reject
// @access  Private (admin only)
const rejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (id === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot reject your own account");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isApproved: false, verificationStatus: "rejected" },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ success: true, user });
});

// @desc    Change a user's role (e.g. promote a user to admin)
// @route   PATCH /api/admin/users/:id/role
// @access  Private (admin only)
const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (!ROLE_VALUES.includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  if (id === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot change your own role");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ success: true, user });
});

module.exports = {
  listUsers,
  listPendingUsers,
  approveUser,
  rejectUser,
  changeUserRole,
};
