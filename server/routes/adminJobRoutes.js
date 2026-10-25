const express = require("express");
const {
  listPendingJobs,
  listAllJobsForAdmin,
  approveJob,
  rejectJob,
  deleteExpiredJobs,
} = require("../controllers/adminJobController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/pending", listPendingJobs);
router.delete("/expired", deleteExpiredJobs);
router.get("/", listAllJobsForAdmin);
router.put("/:id/approve", approveJob);
router.put("/:id/reject", rejectJob);

module.exports = router;
