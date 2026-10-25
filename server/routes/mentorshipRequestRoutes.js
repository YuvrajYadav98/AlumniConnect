const express = require("express");
const {
  sendMentorshipRequest,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  completeMentorship,
  cancelMentorshipRequest,
  listMyMentorshipRequests,
} = require("../controllers/mentorshipRequestController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", listMyMentorshipRequests);
router.post("/:mentorId", sendMentorshipRequest);
router.put("/:id/accept", acceptMentorshipRequest);
router.put("/:id/reject", rejectMentorshipRequest);
router.put("/:id/complete", completeMentorship);
router.delete("/:id", cancelMentorshipRequest);

module.exports = router;
