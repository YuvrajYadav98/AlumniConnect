const express = require("express");
const {
  getPendingAlumni,
  getAllAlumni,
  getAlumniById,
  approveAlumni,
  rejectAlumni,
  deleteAlumni,
} = require("../controllers/adminAlumniController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

// Every route below requires a logged-in admin.
router.use(protect, authorize(ROLES.ADMIN));

// NOTE: static paths (e.g. "/pending") must be declared before the
// dynamic "/:id" route, or Express would try to match "pending" as an id.
router.get("/pending", getPendingAlumni);
router.get("/", getAllAlumni);
router.get("/:id", getAlumniById);
router.put("/:id/approve", approveAlumni);
router.put("/:id/reject", rejectAlumni);
router.delete("/:id", deleteAlumni);

module.exports = router;
