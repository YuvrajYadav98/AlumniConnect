const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

/**
 * protect: verifies the JWT (from the httpOnly cookie, or a Bearer
 * header as a fallback for non-browser clients like Postman/mobile),
 * loads the corresponding user, and attaches it to req.user.
 * Any route using this middleware is a private/authenticated route.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log("=== AUTH DEBUG ===");
  console.log("Cookies:", req.cookies);
  console.log("Authorization:", req.headers.authorization);

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("Token found in cookie");
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token found in Authorization header");
  }

  if (!token) {
    console.log("❌ NO TOKEN");
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT valid:", decoded);
  } catch (error) {
    console.log("❌ JWT ERROR:", error.message);
    res.status(401);
    throw new Error("Not authorized, token is invalid or expired");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    console.log("❌ USER NOT FOUND:", decoded.id);
    res.status(401);
    throw new Error("Not authorized, user no longer exists");
  }

  console.log("✅ USER:", user.email, user.role);

  req.user = user;
  next();
});


/**
 * authorize(...roles): restricts a route to specific roles.
 * Must be used AFTER protect(), since it relies on req.user.
 * Usage: router.get("/admin-only", protect, authorize("admin"), handler)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, no user on request");
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not permitted to access this resource`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
