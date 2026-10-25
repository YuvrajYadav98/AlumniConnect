const jwt = require("jsonwebtoken");

/**
 * Signs a JWT carrying the user's id and role.
 * Role is embedded so authorization checks don't need an extra DB
 * lookup on every request (the middleware still re-fetches the user
 * for /me and for protect(), but authorize() can trust the token).
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

module.exports = generateToken;
