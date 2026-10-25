const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { isValidEmail, isStrongEnoughPassword } = require("../utils/validators");
const { ROLE_VALUES, ROLES } = require("../utils/roles");

// How long the auth cookie lives, in milliseconds (mirrors JWT_EXPIRE=7d default)
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sets the JWT as an httpOnly cookie so client-side JS can never read it
 * (mitigates XSS token theft), and also returns it in the JSON body so
 * non-browser clients (Postman, mobile apps) can use the Bearer scheme.
 */
const sendAuthResponse = (res, statusCode, user) => {
  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      verificationStatus: user.verificationStatus,
    },
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (!isStrongEnoughPassword(password)) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  // Only allow a restricted, known set of self-registerable roles.
  // Admin accounts should never be created through open registration -
  // they must be provisioned separately (e.g. directly in the DB or by
  // another admin), so "admin" is deliberately excluded here.
  let assignedRole = ROLES.STUDENT;
  if (role) {
    if (!ROLE_VALUES.includes(role) || role === ROLES.ADMIN) {
      res.status(400);
      throw new Error("Invalid role selected");
    }
    assignedRole = role;
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409); // Conflict
    throw new Error("An account with this email already exists");
  }

  // Alumni accounts require admin approval before they gain full access;
  // students are approved automatically. isApproved is enforced by the
  // frontend/route guards, not by blocking login itself.
  const isApproved = assignedRole === ROLES.STUDENT;
  const verificationStatus = assignedRole === ROLES.STUDENT ? "approved" : "pending";

  const user = await User.create({
    name,
    email,
    password, // hashed automatically by the User model's pre-save hook
    role: assignedRole,
    isApproved,
    verificationStatus,
  });

  sendAuthResponse(res, 201, user);
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // password has `select: false` on the schema, so it must be explicitly
  // requested here in order to compare it
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // Use the same generic message whether the email doesn't exist or the
  // password is wrong - prevents leaking which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  sendAuthResponse(res, 200, user);
});

// @desc    Log the current user out (clear auth cookie)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// @desc    Get the currently authenticated user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the `protect` middleware
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profileImage: req.user.profileImage,
      isVerified: req.user.isVerified,
      isApproved: req.user.isApproved,
      verificationStatus: req.user.verificationStatus,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = { registerUser, loginUser, logoutUser, getMe };
