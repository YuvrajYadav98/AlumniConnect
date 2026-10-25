const express = require("express");
const {
  getOverview,
  getAlumniByBatch,
  getAlumniByBranch,
  getAlumniByCity,
  getAlumniByIndustry,
  getJobsByCategory,
  getEventRegistrations,
  getMonthlyRegistrations,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/overview", getOverview);
router.get("/alumni-by-batch", getAlumniByBatch);
router.get("/alumni-by-branch", getAlumniByBranch);
router.get("/alumni-by-city", getAlumniByCity);
router.get("/alumni-by-industry", getAlumniByIndustry);
router.get("/jobs-by-category", getJobsByCategory);
router.get("/event-registrations", getEventRegistrations);
router.get("/monthly-registrations", getMonthlyRegistrations);

module.exports = router;
