const express = require("express");
const {
  createJob,
  updateJob,
  deleteJob,
  closeJob,
  reopenJob,
  listJobs,
  getJobById,
  listMyPostedJobs,
  saveJob,
  unsaveJob,
  listSavedJobs,
  applyToJob,
} = require("../controllers/jobController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Static paths declared before dynamic "/:id" paths, so Express never
// mistakes "mine" or "saved" for a job id.
router.get("/mine", listMyPostedJobs);
router.get("/saved", listSavedJobs);

router.get("/", listJobs);
router.post("/", createJob);

router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

router.put("/:id/close", closeJob);
router.put("/:id/reopen", reopenJob);
router.post("/:id/save", saveJob);
router.delete("/:id/save", unsaveJob);
router.post("/:id/apply", applyToJob);

module.exports = router;
