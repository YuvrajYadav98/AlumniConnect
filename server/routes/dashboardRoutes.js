const express = require("express");
const {
  getAdminDashboard,
  getAlumniDashboard,
  getStudentDashboard,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.get("/admin", protect, authorize(ROLES.ADMIN), getAdminDashboard);
router.get("/alumni", protect, authorize(ROLES.ALUMNI), getAlumniDashboard);
router.get("/student", protect, authorize(ROLES.STUDENT), getStudentDashboard);

module.exports = router;
