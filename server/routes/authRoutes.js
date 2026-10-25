const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
// Logout intentionally does NOT require `protect`: it should always be able
// to clear the cookie, even if the token is already expired/invalid.
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);

module.exports = router;
