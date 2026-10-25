const express = require("express");
const {
  listUsers,
  listPendingUsers,
  approveUser,
  rejectUser,
  changeUserRole,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

// Every route below requires a logged-in admin.
router.use(protect, authorize(ROLES.ADMIN));

router.get("/users", listUsers);
router.get("/users/pending", listPendingUsers);
router.patch("/users/:id/approve", approveUser);
router.patch("/users/:id/reject", rejectUser);
router.patch("/users/:id/role", changeUserRole);

module.exports = router;
